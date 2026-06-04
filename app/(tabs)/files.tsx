import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, Alert, Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path, Circle, Rect, Line, Polyline } from 'react-native-svg';
import { FONT } from '../../constants/fonts';

// ── Palette ────────────────────────────────────────────────────────────────
const BG      = '#F9F6ED';
const CARD    = '#FFFFFF';
const PRIMARY = '#1A1512';
const MUTED   = '#8C7F6E';
const MUTED_BG= '#F3EFE7';
const GREEN   = '#96C979';
const YELLOW  = '#FAD957';
const BLUE    = '#A5CCF4';
const PINK    = '#FAB2D3';
const RED_BG  = '#FDECEA';
const RED_FG  = '#C0392B';

// ── Type colors ────────────────────────────────────────────────────────────
const TYPE_COLOR: Record<string, { bg: string; fg: string }> = {
  PDF:  { bg: PINK,   fg: '#7A1A3A' },
  CSV:  { bg: GREEN,  fg: '#1A3D0A' },
  JSON: { bg: BLUE,   fg: '#1A3A5C' },
  PNG:  { bg: YELLOW, fg: '#3D2C00' },
};

// ── Mock data ──────────────────────────────────────────────────────────────
type FileItem = { id: string; name: string; type: string; size: string };
const INITIAL_FILES: FileItem[] = [
  { id: '1', name: 'Examen_sangre_marzo.pdf', type: 'PDF',  size: '1.2 MB' },
  { id: '2', name: 'Reporte_actividad.csv',   type: 'CSV',  size: '340 KB' },
  { id: '3', name: 'Config_dispositivo.json', type: 'JSON', size: '12 KB'  },
  { id: '4', name: 'Electrocardiograma.png',  type: 'PNG',  size: '2.8 MB' },
];
const STORAGE_USED  = 4.4;
const STORAGE_LIMIT = 100;

// ── SVG Icons (Lucide paths) ───────────────────────────────────────────────
function UploadCloudIcon({ color, size = 28 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M12 12v9"     stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="m16 16-4-4-4 4" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function HardDriveIcon({ color, size = 16 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Line x1={22} y1={12} x2={2} y2={12} stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      <Line x1={6} y1={16} x2="6.01" y2={16} stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      <Line x1={10} y1={16} x2="10.01" y2={16} stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function FileTextIcon({ color, size = 20 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M14 2v4a2 2 0 0 0 2 2h4" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M10 9H8"  stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M16 13H8" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M16 17H8" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function DownloadIcon({ color, size = 16 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      <Polyline points="7 10 12 15 17 10" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      <Line x1={12} y1={15} x2={12} y2={3} stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function Trash2Icon({ color, size = 16 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M3 6h18"                                     stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"      stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"         stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      <Line x1={10} y1={11} x2={10} y2={17}                 stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      <Line x1={14} y1={11} x2={14} y2={17}                 stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

// ── Screen ─────────────────────────────────────────────────────────────────
export default function FilesScreen() {
  const [files, setFiles] = useState<FileItem[]>(INITIAL_FILES);

  const pct = Math.round((STORAGE_USED / STORAGE_LIMIT) * 100);

  const handleDownload = (name: string) => {
    Share.share({ message: `Descargando: ${name}` }).catch(() => {});
  };

  const handleDelete = (id: string, name: string) => {
    Alert.alert(
      'Eliminar archivo',
      `¿Eliminar "${name}"? Esta acción no se puede deshacer.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Eliminar', style: 'destructive', onPress: () => setFiles(p => p.filter(f => f.id !== id)) },
      ]
    );
  };

  return (
    <SafeAreaView style={s.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>

        {/* ── Header ──────────────────────────────────────────────────── */}
        <View style={s.header}>
          <Text style={s.title}>Archivos</Text>
          <Text style={s.subtitle}>Documentos y reportes médicos</Text>
        </View>

        {/* ── Upload zone ─────────────────────────────────────────────── */}
        <TouchableOpacity style={s.uploadZone} activeOpacity={0.85}>
          <View style={s.uploadIcon}>
            <UploadCloudIcon color={PRIMARY} size={28} />
          </View>
          <Text style={s.uploadTitle}>Subir archivo</Text>
          <Text style={s.uploadSub}>PDF, CSV, JSON, PNG · máx. 25 MB</Text>
        </TouchableOpacity>

        {/* ── Storage bar ─────────────────────────────────────────────── */}
        <View style={s.storageCard}>
          <View style={s.storageRow}>
            <View style={s.storageLeft}>
              <HardDriveIcon color={MUTED} size={16} />
              <Text style={s.storageLabel}>Almacenamiento</Text>
            </View>
            <Text style={s.storageValue}>{STORAGE_USED} MB de {STORAGE_LIMIT} MB</Text>
          </View>
          <View style={s.barTrack}>
            <View style={[s.barFill, { width: `${pct}%` as any }]} />
          </View>
        </View>

        {/* ── File list ───────────────────────────────────────────────── */}
        <Text style={s.sectionTitle}>Archivos recientes</Text>

        {files.length === 0 ? (
          <View style={s.emptyCard}>
            <Text style={s.emptyTitle}>Sin archivos</Text>
            <Text style={s.emptySub}>Sube tu primer documento</Text>
          </View>
        ) : (
          <View style={s.fileList}>
            {files.map(f => {
              const tc = TYPE_COLOR[f.type] ?? { bg: MUTED_BG, fg: PRIMARY };
              return (
                <View key={f.id} style={s.fileRow}>
                  <View style={[s.fileIcon, { backgroundColor: tc.bg }]}>
                    <FileTextIcon color={tc.fg} size={20} />
                  </View>
                  <View style={s.fileInfo}>
                    <Text style={s.fileName} numberOfLines={1}>{f.name}</Text>
                    <Text style={s.fileMeta}>{f.type} · {f.size}</Text>
                  </View>
                  <TouchableOpacity style={s.actionBtn} activeOpacity={0.7} onPress={() => handleDownload(f.name)}>
                    <DownloadIcon color={MUTED} size={16} />
                  </TouchableOpacity>
                  <TouchableOpacity style={s.actionBtnRed} onPress={() => handleDelete(f.id, f.name)} activeOpacity={0.7}>
                    <Trash2Icon color={RED_FG} size={16} />
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  scroll:    { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 120, gap: 20 },

  // Header
  header:   { gap: 3, paddingTop: 20 },
  title:    { fontSize: 26, fontFamily: FONT.displayBold, color: PRIMARY, letterSpacing: -0.52 },
  subtitle: { fontSize: 14, color: MUTED, fontFamily: FONT.sansRegular },

  // Upload zone — borde punteado visible
  uploadZone: {
    backgroundColor: CARD,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: '#C8C2B6',
    borderStyle: 'dashed',
    paddingVertical: 36,
    alignItems: 'center',
    gap: 4,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
  },
  uploadIcon: {
    width: 56, height: 56, borderRadius: 16,
    backgroundColor: YELLOW,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 8,
  },
  uploadTitle: { fontSize: 15, fontWeight: '700', color: PRIMARY },
  uploadSub:   { fontSize: 12, color: MUTED, marginTop: 2 },

  // Storage card
  storageCard: {
    backgroundColor: CARD, borderRadius: 24, padding: 18,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
    gap: 12,
  },
  storageRow:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  storageLeft:  { flexDirection: 'row', alignItems: 'center', gap: 8 },
  storageLabel: { fontSize: 13, fontWeight: '700', color: PRIMARY },
  storageValue: { fontSize: 12, color: MUTED },
  barTrack: {
    height: 10, backgroundColor: MUTED_BG,
    borderRadius: 5, overflow: 'hidden',
  },
  barFill: { height: '100%', backgroundColor: GREEN, borderRadius: 5 },

  // Section title
  sectionTitle: { fontSize: 17, fontFamily: FONT.displayBold, color: PRIMARY, letterSpacing: -0.34 },

  // File list — cada fila es una card separada
  fileList:  { gap: 8 },
  fileRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: CARD, borderRadius: 20,
    paddingHorizontal: 14, paddingVertical: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 6, elevation: 1,
  },
  // ← CÍRCULOS (borderRadius = mitad del tamaño)
  fileIcon: {
    width: 42, height: 42, borderRadius: 21,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  fileInfo:  { flex: 1, minWidth: 0 },
  fileName:  { fontSize: 14, fontWeight: '700', color: PRIMARY },
  fileMeta:  { fontSize: 12, color: MUTED, marginTop: 1 },
  actionBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: MUTED_BG,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  actionBtnRed: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: RED_BG,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },

  // Empty state
  emptyCard: {
    backgroundColor: CARD, borderRadius: 24,
    paddingVertical: 40, alignItems: 'center', gap: 6,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
  },
  emptyTitle: { fontSize: 14, fontWeight: '700', color: PRIMARY },
  emptySub:   { fontSize: 12, color: MUTED },
});
