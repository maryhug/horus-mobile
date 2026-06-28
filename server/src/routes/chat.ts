import { Router, Response } from 'express';
import { requireAuth, AuthRequest } from '../middleware/auth';

const router = Router();

const horusUrl = process.env.HORUS_API_URL ?? 'http://localhost:3001';
const horusSecret = process.env.HORUS_API_SECRET ?? '';

async function horusFetch(path: string, body: Record<string, unknown>, timeoutMs = 30000) {
  const response = await fetch(`${horusUrl}/chat${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${horusSecret}`,
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(timeoutMs),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`HORUS ${response.status}: ${text}`);
  }

  return response.json();
}

router.post('/init', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const data = await horusFetch('/init', { userId: req.userId });
    res.json(data);
  } catch (err) {
    console.error('[HORUS] init error:', (err as Error).message);
    res.status(500).json({ message: 'Error al iniciar sesión con HORUS' });
  }
});

router.post('/message', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { sessionId, message, mediaBase64, mediaType } = req.body as {
      sessionId: string;
      message: string;
      mediaBase64?: string;
      mediaType?: string;
    };
    const data = await horusFetch('/message', { sessionId, message, mediaBase64, mediaType });
    res.json(data);
  } catch (err) {
    const msg = (err as Error).message ?? String(err);
    console.error('[HORUS] message error:', msg);
    res.status(500).json({ message: 'Error al procesar mensaje', detail: msg });
  }
});

router.post('/end', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { sessionId } = req.body as { sessionId: string };
    const data = await horusFetch('/end', { sessionId });
    res.json(data);
  } catch (err) {
    console.error('[HORUS] end error:', (err as Error).message);
    res.status(500).json({ message: 'Error al finalizar sesión' });
  }
});

// TTS — ElevenLabs (timeout 20s para audio generation)
router.post('/tts', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { text, voiceId } = req.body as { text: string; voiceId: string };
    const data = await horusFetch('/tts', { text, voiceId }, 20000);
    res.json(data);
  } catch (err) {
    console.error('[HORUS] tts error:', (err as Error).message);
    res.status(500).json({ message: 'Error en TTS' });
  }
});

// History — GET conversaciones del usuario autenticado
router.get('/history', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const response = await fetch(`${horusUrl}/chat/history?userId=${req.userId}`, {
      headers: { 'Authorization': `Bearer ${horusSecret}` },
      signal: AbortSignal.timeout(10000),
    });
    if (!response.ok) {
      const text = await response.text();
      throw new Error(`HORUS ${response.status}: ${text}`);
    }
    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.error('[HORUS] history error:', (err as Error).message);
    res.status(500).json({ message: 'Error al obtener historial' });
  }
});

// STT — OpenAI Whisper (timeout 30s)
router.post('/stt', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { audioBase64, mimeType } = req.body as { audioBase64: string; mimeType: string };
    const data = await horusFetch('/stt', { audioBase64, mimeType }, 30000);
    res.json(data);
  } catch (err) {
    console.error('[HORUS] stt error:', (err as Error).message);
    res.status(500).json({ message: 'Error en STT' });
  }
});

export default router;
