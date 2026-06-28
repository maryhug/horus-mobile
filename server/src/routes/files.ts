import { Router, Response } from 'express';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { requireAuth, AuthRequest } from '../middleware/auth';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 25 * 1024 * 1024 } });
const USER_LIMIT_BYTES = 100 * 1024 * 1024; // 100 MB per user

function extractFilename(publicId: string): string {
  const last = publicId.split('/').pop() || publicId;
  return last.replace(/_\d{13}$/, '');
}

// GET /api/files
router.get('/', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const result = await (cloudinary.search as any)
      .expression(`folder:medical-records/${req.userId}`)
      .sort_by('created_at', 'desc')
      .max_results(200)
      .execute();

    const files = (result.resources || []).map((r: any) => ({
      publicId:     r.public_id,
      resourceType: r.resource_type,
      name:         extractFilename(r.public_id),
      format:       (r.format || 'file').toUpperCase(),
      sizeBytes:    r.bytes || 0,
      url:          r.secure_url,
      uploadedAt:   r.created_at,
    }));

    res.json({ files });
  } catch (error) {
    console.error('[files GET]', error);
    res.status(500).json({ message: 'Error al obtener archivos' });
  }
});

// GET /api/files/storage
router.get('/storage', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const result = await (cloudinary.search as any)
      .expression(`folder:medical-records/${req.userId}`)
      .max_results(500)
      .execute();

    const usedBytes = (result.resources || []).reduce((sum: number, r: any) => sum + (r.bytes || 0), 0);

    res.json({
      usedBytes,
      limitBytes: USER_LIMIT_BYTES,
      usedMB:     Math.round(usedBytes / (1024 * 1024) * 100) / 100,
      limitMB:    USER_LIMIT_BYTES / (1024 * 1024),
    });
  } catch (error) {
    console.error('[files/storage GET]', error);
    res.status(500).json({ message: 'Error al obtener almacenamiento' });
  }
});

// POST /api/files/upload  — proxies to horus-braslet which handles OCR + scraping
router.post('/upload', requireAuth, upload.single('file'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ message: 'Archivo requerido' });
      return;
    }

    const brasletUrl = process.env.BRASLET_URL || 'http://localhost:3002';

    const formData = new FormData();
    const ab   = req.file.buffer.buffer.slice(req.file.buffer.byteOffset, req.file.buffer.byteOffset + req.file.buffer.byteLength) as ArrayBuffer;
    const blob = new Blob([ab], { type: req.file.mimetype });
    formData.append('file', blob, req.file.originalname);
    formData.append('userId', req.userId!);

    const response = await fetch(`${brasletUrl}/api/medical-history/uploadDocuments`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const err = await response.text();
      console.error('[files/upload] braslet error:', err);
      res.status(response.status).json({ message: 'Error en el procesamiento del documento', detail: err });
      return;
    }

    const data = await response.json();
    res.status(201).json(data);
  } catch (error) {
    console.error('[files/upload]', error);
    res.status(500).json({ message: 'Error al subir el archivo' });
  }
});

// POST /api/files/confirm  — save user-reviewed structured data to PostgreSQL
router.post('/confirm', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { structuredData, normalizedMedications } = req.body;
    if (!structuredData) {
      res.status(400).json({ message: 'structuredData es requerido' });
      return;
    }

    const brasletUrl = process.env.BRASLET_URL || 'http://localhost:3002';

    const response = await fetch(`${brasletUrl}/api/medical-history/confirmExtraction`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: req.userId, structuredData, normalizedMedications }),
    });

    if (!response.ok) {
      const err = await response.text();
      res.status(response.status).json({ message: 'Error al guardar datos médicos', detail: err });
      return;
    }

    res.json({ ok: true });
  } catch (error) {
    console.error('[files/confirm]', error);
    res.status(500).json({ message: 'Error al confirmar extracción' });
  }
});

// GET /api/files/download/:b64  — proxy download (avoids mobile CDN issues)
router.get('/download/:b64', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const publicId = Buffer.from(req.params.b64, 'base64').toString('utf-8');
    if (!publicId.startsWith(`medical-records/${req.userId}/`)) {
      res.status(403).json({ message: 'No autorizado' }); return;
    }

    const filename = extractFilename(publicId);

    // Use the admin API to get the real resource info (secure_url includes version + correct extension)
    let resource: any;
    let foundRt: 'raw' | 'image' | 'video' | undefined;
    let apiError: string | undefined;

    for (const rt of ['raw', 'image', 'video'] as const) {
      try {
        resource = await cloudinary.api.resource(publicId, { resource_type: rt });
        foundRt = rt;
        console.log(`[files/download] Found as resource_type=${rt} url=${resource.secure_url}`);
        break;
      } catch (e: any) {
        apiError = e?.message ?? String(e);
        console.warn(`[files/download] Not found as resource_type=${rt}:`, apiError);
      }
    }

    if (!resource || !foundRt) {
      res.status(404).json({ message: 'Archivo no encontrado en Cloudinary', detail: apiError }); return;
    }

    // The secure_url from the Admin API is the canonical, authenticated URL.
    // We use it directly — it already contains the version number and correct extension.
    // For private/authenticated delivery, we generate an authenticated URL using the
    // same public_id + format so Cloudinary keeps the extension in the signature.
    const fileFormat: string = resource.format || 'bin';

    // private_download_url calls api.cloudinary.com (admin endpoint, not CDN) — bypasses
    // any CDN-level PDF/image access restrictions that cause 401 on direct delivery URLs.
    const expiresAt = Math.floor(Date.now() / 1000) + 300;
    const privateUrl: string = (cloudinary.utils as any).private_download_url(
      publicId,
      fileFormat,
      { resource_type: foundRt, type: 'upload', expires_at: expiresAt, attachment: true },
    );
    console.log(`[files/download] private_download_url=${privateUrl}`);

    let cloudRes: globalThis.Response;
    try {
      cloudRes = await fetch(privateUrl);
      console.log(`[files/download] fetch status=${cloudRes.status}`);
    } catch (fetchErr: any) {
      console.error('[files/download] fetch threw:', fetchErr);
      res.status(502).json({ message: 'No se pudo conectar a Cloudinary', detail: fetchErr?.message }); return;
    }

    if (!cloudRes.ok) {
      const body = await cloudRes.text().catch(() => '');
      console.error(`[files/download] error ${cloudRes.status}:`, body.slice(0, 500));
      res.status(502).json({ message: `Cloudinary devolvió ${cloudRes.status}`, detail: body.slice(0, 200) }); return;
    }

    const buffer = Buffer.from(await cloudRes.arrayBuffer());

    const MIME: Record<string, string> = {
      pdf:  'application/pdf',
      jpg:  'image/jpeg',
      jpeg: 'image/jpeg',
      png:  'image/png',
      gif:  'image/gif',
      csv:  'text/csv',
      json: 'application/json',
      doc:  'application/msword',
      docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    };
    const mimeType = MIME[fileFormat] ?? cloudRes.headers.get('content-type') ?? 'application/octet-stream';

    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}.${fileFormat}"`);
    res.setHeader('Content-Length', buffer.length);
    res.end(buffer);
  } catch (error) {
    console.error('[files/download]', error);
    res.status(500).json({ message: 'Error al descargar archivo' });
  }
});

// DELETE /api/files/:publicId  — publicId is base64-encoded
router.delete('/:publicId', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    let publicId: string;
    try {
      publicId = Buffer.from(req.params.publicId, 'base64').toString('utf-8');
    } catch {
      res.status(400).json({ message: 'ID de archivo inválido' });
      return;
    }

    // Security: only allow deleting own files
    if (!publicId.startsWith(`medical-records/${req.userId}/`)) {
      res.status(403).json({ message: 'No autorizado' });
      return;
    }

    // Try resource types until one succeeds
    let deleted = false;
    for (const resourceType of ['raw', 'image', 'video'] as const) {
      const result = await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
      if (result.result === 'ok') { deleted = true; break; }
    }

    if (!deleted) {
      console.warn(`[files/delete] Could not delete ${publicId} from Cloudinary (may already be gone)`);
    }

    res.json({ ok: true });
  } catch (error) {
    console.error('[files DELETE]', error);
    res.status(500).json({ message: 'Error al eliminar archivo' });
  }
});

export default router;
