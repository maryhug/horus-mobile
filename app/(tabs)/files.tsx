import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, Alert, Modal,
  ActivityIndicator, RefreshControl,
} from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import type { DimensionValue } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as DocumentPicker from 'expo-document-picker';
import Svg, { Path, Circle, Line, Polyline, Rect } from 'react-native-svg';
import { FONT } from '../../constants/fonts';
import { useAppTheme } from '../../hooks/useAppTheme';
import { useLanguage } from '../../contexts/LanguageContext';
import { apiClient, getErrorMessage } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import MedicalReviewModal, {
  buildReviewState, buildConfirmPayload,
  type ReviewState,
} from '../../components/MedicalReviewModal';

// ── Types ─────────────────────────────────────────────────────────────────────
type CloudFile = {
  publicId:     string;
  resourceType: string;
  name:         string;
  format:       string;
  sizeBytes:    number;
  url:          string;
  uploadedAt:   string;
};

type StorageInfo = { usedBytes: number; limitBytes: number; usedMB: number; limitMB: number };

// ── Stable accent colors ───────────────────────────────────────────────────────
const TYPE_COLOR: Record<string, { bg: string; fg: string }> = {
  PDF:  { bg: '#FAB2D3', fg: '#7A1A3A' },
  JPG:  { bg: '#FAD957', fg: '#3D2C00' },
  JPEG: { bg: '#FAD957', fg: '#3D2C00' },
  PNG:  { bg: '#FAD957', fg: '#3D2C00' },
  CSV:  { bg: '#96C979', fg: '#1A3D0A' },
  JSON: { bg: '#A5CCF4', fg: '#1A3A5C' },
  DOCX: { bg: '#C8AAFF', fg: '#3A0A7A' },
  DOC:  { bg: '#C8AAFF', fg: '#3A0A7A' },
};

function getMimeType(ext: string): string {
  const MIME: Record<string, string> = {
    pdf:  'application/pdf',
    jpg:  'image/jpeg',
    jpeg: 'image/jpeg',
    png:  'image/png',
    csv:  'text/csv',
    json: 'application/json',
    doc:  'application/msword',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  };
  return MIME[ext.toLowerCase()] ?? 'application/octet-stream';
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// ── SVG Icons ─────────────────────────────────────────────────────────────────
const sw = { strokeWidth: 2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
function Icon({ size = 24, children }: { size?: number; children: React.ReactNode }) {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">{children}</Svg>;
}
const UploadCloudIcon = ({ c, s = 28 }: { c: string; s?: number }) => (
  <Icon size={s}>
    <Path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242" stroke={c} {...sw} />
    <Path d="M12 12v9" stroke={c} {...sw} />
    <Path d="m16 16-4-4-4 4" stroke={c} {...sw} />
  </Icon>
);
const HardDriveIcon = ({ c, s = 16 }: { c: string; s?: number }) => (
  <Icon size={s}>
    <Line x1={22} y1={12} x2={2} y2={12} stroke={c} {...sw} />
    <Path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" stroke={c} {...sw} />
    <Line x1={6} y1={16} x2="6.01" y2={16} stroke={c} {...sw} />
    <Line x1={10} y1={16} x2="10.01" y2={16} stroke={c} {...sw} />
  </Icon>
);
const FileTextIcon = ({ c, s = 20 }: { c: string; s?: number }) => (
  <Icon size={s}>
    <Path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" stroke={c} {...sw} />
    <Path d="M14 2v4a2 2 0 0 0 2 2h4" stroke={c} {...sw} />
    <Path d="M10 9H8" stroke={c} {...sw} />
    <Path d="M16 13H8" stroke={c} {...sw} />
    <Path d="M16 17H8" stroke={c} {...sw} />
  </Icon>
);
const DownloadIcon = ({ c, s = 16 }: { c: string; s?: number }) => (
  <Icon size={s}>
    <Path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" stroke={c} {...sw} />
    <Polyline points="7 10 12 15 17 10" stroke={c} {...sw} />
    <Line x1={12} y1={15} x2={12} y2={3} stroke={c} {...sw} />
  </Icon>
);
const Trash2Icon = ({ c, s = 16 }: { c: string; s?: number }) => (
  <Icon size={s}>
    <Path d="M3 6h18" stroke={c} {...sw} />
    <Path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" stroke={c} {...sw} />
    <Path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" stroke={c} {...sw} />
    <Line x1={10} y1={11} x2={10} y2={17} stroke={c} {...sw} />
    <Line x1={14} y1={11} x2={14} y2={17} stroke={c} {...sw} />
  </Icon>
);
const ShieldIcon = ({ c, s = 28 }: { c: string; s?: number }) => (
  <Icon size={s}>
    <Path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke={c} {...sw} />
  </Icon>
);
const XIcon = ({ c, s = 20 }: { c: string; s?: number }) => (
  <Icon size={s}>
    <Path d="M18 6 6 18" stroke={c} {...sw} />
    <Path d="m6 6 12 12" stroke={c} {...sw} />
  </Icon>
);

// ── Screen ────────────────────────────────────────────────────────────────────
export default function FilesScreen() {
  const { BG, CARD, PRIMARY, MUTED, MUTED_BG, GREEN, YELLOW, RED_BG, isDark } = useAppTheme();
  const RED_FG = '#C0392B';
  const s = React.useMemo(() => makeStyles(BG, CARD, PRIMARY, MUTED, MUTED_BG, GREEN, YELLOW, RED_BG, isDark), [isDark]);
  const { t } = useLanguage();
  const { user } = useAuth();

  const [files, setFiles]           = useState<CloudFile[]>([]);
  const [storage, setStorage]       = useState<StorageInfo | null>(null);
  const [loadingFiles, setLoading]  = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [uploading, setUploading]   = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);

  // Disclaimer modal
  const [showDisclaimer, setShowDisclaimer] = useState(false);
  const [pendingFile, setPendingFile]       = useState<DocumentPicker.DocumentPickerAsset | null>(null);

  // Review modal
  const [showReview, setShowReview]     = useState(false);
  const [reviewState, setReviewState]   = useState<ReviewState | null>(null);
  const [pendingNormalized, setPendingNormalized] = useState<Record<string, string>>({});
  const [lastUploadedPublicId, setLastUploadedPublicId] = useState<string | null>(null);

  // Delete modal
  const [deleteTarget, setDeleteTarget] = useState<CloudFile | null>(null);

  // Download state
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      const [filesRes, storageRes] = await Promise.all([
        apiClient.get<{ files: CloudFile[] }>('/files'),
        apiClient.get<StorageInfo>('/files/storage'),
      ]);
      setFiles(filesRes.data.files);
      setStorage(storageRes.data);
    } catch (err) {
      console.error('[Files] load error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const onRefresh = () => { setRefreshing(true); loadData(); };

  // ── Upload flow ─────────────────────────────────────────────────────────────
  const handlePickFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*', 'text/csv', 'application/json',
               'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
        copyToCacheDirectory: true,
      });
      if (result.canceled || !result.assets?.length) return;
      setPendingFile(result.assets[0]);
      setShowDisclaimer(true);
    } catch (err) {
      Alert.alert('Error', 'No se pudo abrir el selector de archivos.');
    }
  };

  const handleConfirmUpload = async () => {
    if (!pendingFile) return;
    setShowDisclaimer(false);
    setUploading(true);

    try {
      let mime = pendingFile.mimeType || 'application/octet-stream';
      if (pendingFile.name.toLowerCase().endsWith('.pdf')) {
        mime = 'application/pdf';
      }

      const formData = new FormData();
      formData.append('file', {
        uri:  pendingFile.uri,
        name: pendingFile.name,
        type: mime,
      } as any);

      const res = await apiClient.post<{
        publicId?: string;
        structuredData: any;
        normalizedMedications: Record<string, string>;
      }>('/files/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 120_000,
      });

      await loadData();

      const { publicId, structuredData, normalizedMedications } = res.data;
      if (structuredData) {
        const rs = buildReviewState(structuredData);
        setReviewState(rs);
        setPendingNormalized(normalizedMedications || {});
        setLastUploadedPublicId(publicId ?? null);
        setShowReview(true);
      } else {
        Alert.alert('Archivo subido', 'El documento se guardó pero no se detectó información médica estructurada.');
      }
    } catch (err) {
      Alert.alert('Error', getErrorMessage(err));
    } finally {
      setUploading(false);
      setPendingFile(null);
    }
  };

  const existingProfile = { bloodType: user?.bloodType, gender: user?.gender };

  const handleConfirmExtraction = async () => {
    if (!reviewState) return;
    setConfirming(true);
    try {
      const payload = buildConfirmPayload(reviewState, existingProfile);
      await apiClient.post('/files/confirm', {
        structuredData:        payload,
        normalizedMedications: pendingNormalized,
      });
      setShowReview(false);
      setReviewState(null);
      setLastUploadedPublicId(null);
      Alert.alert('¡Guardado!', 'Los datos médicos se añadieron a tu perfil correctamente.');
    } catch (err) {
      Alert.alert('Error', getErrorMessage(err));
    } finally {
      setConfirming(false);
    }
  };

  // ── Download ────────────────────────────────────────────────────────────────
  const handleDownload = async (file: CloudFile) => {
    if (downloadingId) return;
    setDownloadingId(file.publicId);
    try {
      const ext      = file.format.toLowerCase();
      const safeName = file.name.replace(/[^a-zA-Z0-9_\-\.]/g, '_');
      const localUri = `${FileSystem.cacheDirectory ?? ''}${safeName}.${ext}`;

      // Route through our server so auth + proper headers are added
      const b64       = btoa(file.publicId);
      const serverUrl = `${apiClient.defaults.baseURL}/files/download/${b64}?rt=${file.resourceType}&fmt=${ext}`;
      const authHeader = (apiClient.defaults.headers.common?.['Authorization'] as string) ?? '';

      const result = await FileSystem.downloadAsync(serverUrl, localUri, {
        headers: {
          Authorization:           authHeader,
          'bypass-tunnel-reminder': 'true',
        },
      });

      if (result.status !== 200) throw new Error(`HTTP ${result.status}`);

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(result.uri, {
          mimeType:    getMimeType(ext),
          dialogTitle: file.name,
        });
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      Alert.alert('Error', `No se pudo descargar el archivo.\n${msg}`);
    } finally {
      setDownloadingId(null);
    }
  };

  // ── Cancel review — delete the just-uploaded file from Cloudinary ─────────
  const handleCancelReview = async () => {
    setShowReview(false);
    setReviewState(null);
    if (lastUploadedPublicId) {
      const encodedId = btoa(lastUploadedPublicId);
      try {
        await apiClient.delete(`/files/${encodedId}`);
        setFiles(prev => prev.filter(f => f.publicId !== lastUploadedPublicId));
      } catch { /* best-effort */ }
      setLastUploadedPublicId(null);
    }
  };

  // ── Delete ──────────────────────────────────────────────────────────────────
  const handleDelete = (file: CloudFile) => setDeleteTarget(file);

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    const file = deleteTarget;
    setDeleteTarget(null);
    setDeletingId(file.publicId);
    try {
      const encodedId = btoa(file.publicId);
      await apiClient.delete(`/files/${encodedId}`);
      setFiles(prev => prev.filter(f => f.publicId !== file.publicId));
      setStorage(prev => prev ? {
        ...prev,
        usedBytes: Math.max(0, prev.usedBytes - file.sizeBytes),
        usedMB:    Math.max(0, Math.round((prev.usedBytes - file.sizeBytes) / (1024 * 1024) * 100) / 100),
      } : prev);
    } catch (err) {
      Alert.alert('Error', getErrorMessage(err));
    } finally {
      setDeletingId(null);
    }
  };

  // ── Storage bar ─────────────────────────────────────────────────────────────
  const usedMB  = storage?.usedMB  ?? 0;
  const limitMB = storage?.limitMB ?? 100;
  const pct     = Math.min(100, Math.round((usedMB / limitMB) * 100));
  const barColor = pct > 80 ? '#E8805A' : GREEN;

  return (
    <SafeAreaView style={s.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={PRIMARY} />}
      >
        {/* ── Header ─────────────────────────────────────────────────────── */}
        <View style={s.header}>
          <Text style={s.title}>{t.filesTitle}</Text>
          <Text style={s.subtitle}>{t.filesSubtitle}</Text>
        </View>

        {/* ── Upload zone ────────────────────────────────────────────────── */}
        <TouchableOpacity
          style={s.uploadZone}
          activeOpacity={0.85}
          onPress={handlePickFile}
          disabled={uploading}
        >
          {uploading ? (
            <>
              <ActivityIndicator color={PRIMARY} size="large" style={{ marginBottom: 8 }} />
              <Text style={s.uploadTitle}>Procesando documento…</Text>
              <Text style={s.uploadSub}>OCR + análisis con IA. Puede tomar 1-2 min.</Text>
            </>
          ) : (
            <>
              <View style={s.uploadIcon}>
                <UploadCloudIcon c={PRIMARY} s={28} />
              </View>
              <Text style={s.uploadTitle}>{t.filesUpload}</Text>
              <Text style={s.uploadSub}>PDF, CSV, JSON, PNG, DOCX · máx. 25 MB</Text>
            </>
          )}
        </TouchableOpacity>

        {/* ── Storage bar ────────────────────────────────────────────────── */}
        <View style={s.storageCard}>
          <View style={s.storageRow}>
            <View style={s.storageLeft}>
              <HardDriveIcon c={MUTED} s={16} />
              <Text style={s.storageLabel}>{t.filesStorage}</Text>
            </View>
            <Text style={s.storageValue}>{usedMB} MB {t.filesOf} {limitMB} MB</Text>
          </View>
          <View style={s.barTrack}>
            <View style={[s.barFill, { width: `${pct}%` as DimensionValue, backgroundColor: barColor }]} />
          </View>
        </View>

        {/* ── File list ──────────────────────────────────────────────────── */}
        <Text style={s.sectionTitle}>Archivos</Text>

        {loadingFiles ? (
          <View style={s.emptyCard}>
            <ActivityIndicator color={PRIMARY} />
          </View>
        ) : files.length === 0 ? (
          <View style={s.emptyCard}>
            <Text style={s.emptyTitle}>{t.filesNoFiles}</Text>
            <Text style={s.emptySub}>{t.filesUploadFirst}</Text>
          </View>
        ) : (
          <View style={s.fileList}>
            {files.map(f => {
              const tc = TYPE_COLOR[f.format] ?? { bg: MUTED_BG, fg: PRIMARY };
              const isDeleting    = deletingId    === f.publicId;
              const isDownloading = downloadingId === f.publicId;
              return (
                <View key={f.publicId} style={s.fileRow}>
                  <View style={[s.fileIcon, { backgroundColor: tc.bg }]}>
                    <FileTextIcon c={tc.fg} s={20} />
                  </View>
                  <View style={s.fileInfo}>
                    <Text style={s.fileName} numberOfLines={1}>{f.name}</Text>
                    <Text style={s.fileMeta}>{f.format} · {formatBytes(f.sizeBytes)}</Text>
                  </View>
                  <TouchableOpacity
                    style={s.actionBtn}
                    activeOpacity={0.7}
                    onPress={() => handleDownload(f)}
                    disabled={isDownloading}
                  >
                    {isDownloading
                      ? <ActivityIndicator color={MUTED} size="small" />
                      : <DownloadIcon c={MUTED} s={16} />
                    }
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={s.actionBtnRed}
                    activeOpacity={0.7}
                    onPress={() => handleDelete(f)}
                    disabled={isDeleting}
                  >
                    {isDeleting
                      ? <ActivityIndicator color={RED_FG} size="small" />
                      : <Trash2Icon c={RED_FG} s={16} />
                    }
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* ── Medical review modal ──────────────────────────────────────────── */}
      {reviewState && (
        <MedicalReviewModal
          visible={showReview}
          state={reviewState}
          onChange={setReviewState}
          onConfirm={handleConfirmExtraction}
          onCancel={handleCancelReview}
          loading={confirming}
          existingProfile={existingProfile}
        />
      )}

      {/* ── Delete modal ──────────────────────────────────────────────────── */}
      <Modal visible={!!deleteTarget} transparent animationType="fade">
        <View style={s.overlay}>
          <View style={s.modal}>
            <View style={s.modalHeader}>
              <View style={[s.modalIconWrap, { backgroundColor: RED_BG }]}>
                <Trash2Icon c={RED_FG} s={24} />
              </View>
              <TouchableOpacity style={s.modalClose} onPress={() => setDeleteTarget(null)}>
                <XIcon c={MUTED} s={18} />
              </TouchableOpacity>
            </View>

            <Text style={s.modalTitle}>Eliminar archivo</Text>
            <Text style={s.modalBody}>
              Esta acción eliminará el archivo de forma permanente y{' '}
              <Text style={{ fontFamily: FONT.sansBold }}>no se puede deshacer.</Text>
              {'\n\n'}Los datos médicos extraídos de este documento{' '}
              <Text style={{ fontFamily: FONT.sansBold }}>no serán eliminados</Text>{' '}
              de tu perfil.
            </Text>

            {deleteTarget && (
              <View style={s.filePreview}>
                <FileTextIcon c={MUTED} s={16} />
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={s.filePreviewName} numberOfLines={1}>{deleteTarget.name}</Text>
                  <Text style={{ fontSize: 11, fontFamily: FONT.sansRegular, color: MUTED }}>
                    {deleteTarget.format} · {formatBytes(deleteTarget.sizeBytes)}
                  </Text>
                </View>
              </View>
            )}

            <View style={s.modalActions}>
              <TouchableOpacity style={s.btnCancel} onPress={() => setDeleteTarget(null)}>
                <Text style={s.btnCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[s.btnConfirm, { backgroundColor: RED_FG }]} onPress={confirmDelete}>
                <Text style={s.btnConfirmText}>Eliminar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Disclaimer modal ───────────────────────────────────────────────── */}
      <Modal visible={showDisclaimer} transparent animationType="fade">
        <View style={s.overlay}>
          <View style={s.modal}>
            {/* header */}
            <View style={s.modalHeader}>
              <View style={s.modalIconWrap}>
                <ShieldIcon c={PRIMARY} s={28} />
              </View>
              <TouchableOpacity
                style={s.modalClose}
                onPress={() => { setShowDisclaimer(false); setPendingFile(null); }}
              >
                <XIcon c={MUTED} s={18} />
              </TouchableOpacity>
            </View>

            <Text style={s.modalTitle}>Aviso importante</Text>
            <Text style={s.modalBody}>
              HORUS actúa como plataforma de almacenamiento y análisis. No verificamos la exactitud
              de los documentos médicos subidos.{'\n\n'}
              Al continuar, confirmas que:{'\n'}
              • Eres el titular o tienes autorización para subir este documento.{'\n'}
              • La información es real y tuya.{'\n'}
              • El análisis con IA es orientativo y no reemplaza criterio médico.{'\n\n'}
              <Text style={{ fontFamily: FONT.sansBold }}>
                HORUS no se hace responsable del contenido ni del uso que se dé a la información extraída.
              </Text>
            </Text>

            {pendingFile && (
              <View style={s.filePreview}>
                <FileTextIcon c={MUTED} s={16} />
                <Text style={s.filePreviewName} numberOfLines={1}>{pendingFile.name}</Text>
              </View>
            )}

            <View style={s.modalActions}>
              <TouchableOpacity
                style={s.btnCancel}
                onPress={() => { setShowDisclaimer(false); setPendingFile(null); }}
              >
                <Text style={s.btnCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.btnConfirm} onPress={handleConfirmUpload}>
                <Text style={s.btnConfirmText}>Entiendo, subir</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────────
function makeStyles(
  BG: string, CARD: string, PRIMARY: string, MUTED: string,
  MUTED_BG: string, GREEN: string, YELLOW: string, RED_BG: string, isDark: boolean,
) {
  const OVERLAY = isDark ? 'rgba(0,0,0,0.75)' : 'rgba(0,0,0,0.5)';
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: BG },
    scroll:    { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 120, gap: 20 },

    header:   { gap: 3, paddingTop: 20 },
    title:    { fontSize: 26, fontFamily: FONT.displayBold, color: PRIMARY, letterSpacing: -0.52 },
    subtitle: { fontSize: 14, color: MUTED, fontFamily: FONT.sansRegular },

    uploadZone: {
      backgroundColor: CARD, borderRadius: 28,
      borderWidth: 2, borderColor: '#C8C2B6', borderStyle: 'dashed',
      paddingVertical: 36, alignItems: 'center', gap: 4,
      shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
    },
    uploadIcon: {
      width: 56, height: 56, borderRadius: 16,
      backgroundColor: YELLOW,
      alignItems: 'center', justifyContent: 'center', marginBottom: 8,
    },
    uploadTitle: { fontSize: 15, fontFamily: FONT.sansBold,    color: PRIMARY },
    uploadSub:   { fontSize: 12, fontFamily: FONT.sansRegular, color: MUTED, marginTop: 2 },

    storageCard: {
      backgroundColor: CARD, borderRadius: 24, padding: 18,
      shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.04, shadowRadius: 8, elevation: 2, gap: 12,
    },
    storageRow:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    storageLeft:  { flexDirection: 'row', alignItems: 'center', gap: 8 },
    storageLabel: { fontSize: 13, fontFamily: FONT.sansBold,    color: PRIMARY },
    storageValue: { fontSize: 12, fontFamily: FONT.sansRegular, color: MUTED },
    barTrack:     { height: 10, backgroundColor: MUTED_BG, borderRadius: 5, overflow: 'hidden' },
    barFill:      { height: '100%', borderRadius: 5 },

    sectionTitle: { fontSize: 17, fontFamily: FONT.displayBold, color: PRIMARY, letterSpacing: -0.34 },

    fileList: { gap: 8 },
    fileRow: {
      flexDirection: 'row', alignItems: 'center', gap: 12,
      backgroundColor: CARD, borderRadius: 20,
      paddingHorizontal: 14, paddingVertical: 12,
      shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.04, shadowRadius: 6, elevation: 1,
    },
    fileIcon: {
      width: 42, height: 42, borderRadius: 21,
      alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    },
    fileInfo:  { flex: 1, minWidth: 0 },
    fileName:  { fontSize: 14, fontFamily: FONT.sansBold,    color: PRIMARY },
    fileMeta:  { fontSize: 12, fontFamily: FONT.sansRegular, color: MUTED, marginTop: 1 },
    actionBtn: {
      width: 36, height: 36, borderRadius: 18, backgroundColor: MUTED_BG,
      alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    },
    actionBtnRed: {
      width: 36, height: 36, borderRadius: 18, backgroundColor: RED_BG,
      alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    },

    emptyCard: {
      backgroundColor: CARD, borderRadius: 24,
      paddingVertical: 40, alignItems: 'center', gap: 6,
      shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
    },
    emptyTitle: { fontSize: 14, fontFamily: FONT.sansBold,    color: PRIMARY },
    emptySub:   { fontSize: 12, fontFamily: FONT.sansRegular, color: MUTED },

    // ── Disclaimer modal ─────────────────────────────────────────────────────
    overlay: {
      flex: 1, backgroundColor: OVERLAY,
      justifyContent: 'flex-end',
    },
    modal: {
      backgroundColor: CARD, borderTopLeftRadius: 32, borderTopRightRadius: 32,
      padding: 28, paddingBottom: 40, gap: 16,
    },
    modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    modalIconWrap: {
      width: 52, height: 52, borderRadius: 16, backgroundColor: MUTED_BG,
      alignItems: 'center', justifyContent: 'center',
    },
    modalClose: {
      width: 36, height: 36, borderRadius: 18, backgroundColor: MUTED_BG,
      alignItems: 'center', justifyContent: 'center',
    },
    modalTitle: { fontSize: 20, fontFamily: FONT.displayBold, color: PRIMARY, letterSpacing: -0.4 },
    modalBody:  { fontSize: 13, fontFamily: FONT.sansRegular, color: MUTED, lineHeight: 20 },

    filePreview: {
      flexDirection: 'row', alignItems: 'center', gap: 8,
      backgroundColor: MUTED_BG, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10,
    },
    filePreviewName: { flex: 1, fontSize: 13, fontFamily: FONT.sansMedium, color: PRIMARY },

    modalActions: { flexDirection: 'row', gap: 12, marginTop: 4 },
    btnCancel: {
      flex: 1, paddingVertical: 14, borderRadius: 16,
      backgroundColor: MUTED_BG, alignItems: 'center',
    },
    btnCancelText: { fontSize: 15, fontFamily: FONT.sansBold, color: MUTED },
    btnConfirm: {
      flex: 1, paddingVertical: 14, borderRadius: 16,
      backgroundColor: PRIMARY, alignItems: 'center',
    },
    btnConfirmText: { fontSize: 15, fontFamily: FONT.sansBold, color: CARD },
  });
}
