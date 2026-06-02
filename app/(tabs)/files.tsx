import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../contexts/ThemeContext';
import { AppColors } from '../../constants/colors';
import { HorusIcon } from '../../assets/icons';
import type { HorusIconName } from '../../assets/icons';
import { AppHeader } from '../../components/AppHeader';

type FileItem = { name: string; type: string; size: string; iconColor: string; iconName: HorusIconName };

const INITIAL_FILES: FileItem[] = [];

const FILE_TYPES = ['PDF', 'CSV', 'JSON', 'PNG'];

function makeStyles(c: AppColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: c.background },
    header: {
      paddingHorizontal: 20,
      paddingTop: 14,
      paddingBottom: 16,
      backgroundColor: c.background,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
    },
    headerText: { flex: 1 },
    pageTitle: { fontSize: 20, fontWeight: '700', color: c.textPrimary, lineHeight: 26 },
    pageTitleAccent: { color: c.accent },
    pageSubtitle: { fontSize: 11, color: c.textSecondary, marginTop: 4, lineHeight: 16 },
    themeBtn: {
      width: 42,
      height: 42,
      borderRadius: 21,
      backgroundColor: c.surface,
      justifyContent: 'center',
      alignItems: 'center',
      marginLeft: 12,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.08,
      shadowRadius: 10,
      elevation: 3,
    },
    scrollContent: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 72, gap: 14 },
    uploadZone: {
      backgroundColor: c.surface,
      borderRadius: 26,
      padding: 28,
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.10,
      shadowRadius: 16,
      elevation: 4,
    },
    uploadIconCircle: {
      width: 72,
      height: 72,
      borderRadius: 36,
      backgroundColor: c.accent,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 16,
      shadowColor: c.accent,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.4,
      shadowRadius: 14,
      elevation: 8,
    },
    uploadTitle: { fontSize: 14, fontWeight: '600', color: c.textPrimary, marginBottom: 8, textAlign: 'center' },
    uploadHint: { fontSize: 12, color: c.textSecondary, textAlign: 'center', marginBottom: 16, lineHeight: 18 },
    uploadLink: { color: c.accent, fontWeight: '600' },
    fileTypesRow: { flexDirection: 'row', gap: 8 },
    fileTypeBadge: {
      backgroundColor: c.surfaceElevated,
      borderRadius: 10,
      paddingHorizontal: 10,
      paddingVertical: 5,
    },
    fileTypeText: { fontSize: 11, color: c.textSecondary, fontWeight: '600', letterSpacing: 0.5 },
    recentCard: {
      backgroundColor: c.surface,
      borderRadius: 26,
      overflow: 'hidden',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.10,
      shadowRadius: 16,
      elevation: 4,
    },
    recentHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 14,
      borderBottomWidth: 1,
      borderBottomColor: c.border,
    },
    recentTitle: { fontSize: 14, fontWeight: '600', color: c.textPrimary },
    recentCount: { fontSize: 11, color: c.textSecondary },
    fileList: { paddingHorizontal: 16 },
    fileRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 13, gap: 12 },
    fileRowBorder: { borderBottomWidth: 1, borderBottomColor: c.border },
    fileIcon: { width: 46, height: 46, borderRadius: 14, justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
    fileInfo: { flex: 1 },
    fileName: { fontSize: 13, fontWeight: '500', color: c.textPrimary, marginBottom: 3 },
    fileMeta: { fontSize: 11, color: c.textSecondary },
    fileActions: { flexDirection: 'row', gap: 6 },
    actionBtn: {
      width: 36,
      height: 36,
      borderRadius: 12,
      backgroundColor: c.surfaceElevated,
      justifyContent: 'center',
      alignItems: 'center',
    },
    emptyState: { paddingVertical: 32, alignItems: 'center', gap: 8 },
    emptyText: { fontSize: 13, color: c.textMuted },
    storageCard: {
      backgroundColor: c.surface,
      borderRadius: 26,
      padding: 16,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.10,
      shadowRadius: 16,
      elevation: 4,
    },
    storageHeader: { flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 12 },
    storageTitle: { fontSize: 13, fontWeight: '600', color: c.textPrimary },
    storageBarTrack: { height: 6, backgroundColor: c.border, borderRadius: 3, overflow: 'hidden', marginBottom: 8 },
    storageBarFill: { width: '16.4%', height: '100%', backgroundColor: c.accent, borderRadius: 3 },
    storageStats: { flexDirection: 'row', justifyContent: 'space-between' },
    storageUsed: { fontSize: 11, color: c.textSecondary },
    storageTotal: { fontSize: 11, color: c.textMuted },
  });
}

export default function FilesScreen() {
  const { colors, isDark, toggleTheme } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [files, setFiles] = useState<FileItem[]>(INITIAL_FILES);

  const handleDelete = (index: number) => {
    Alert.alert(
      'Eliminar archivo',
      `¿Seguro que deseas eliminar "${files[index].name}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Eliminar', style: 'destructive', onPress: () => setFiles(prev => prev.filter((_, i) => i !== index)) },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <AppHeader />
      {/* Greeting compacto — sin repetir "Archivos" que ya está en el nav */}
      <View style={{ paddingHorizontal: 20, paddingBottom: 10, backgroundColor: colors.background }}>
        <Text style={{ fontSize: 13, color: colors.textSecondary }}>
          Reportes, configuraciones e historiales de tu dispositivo
        </Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <TouchableOpacity style={styles.uploadZone} activeOpacity={0.8}>
          <View style={styles.uploadIconCircle}>
            <HorusIcon name="upload" size={34} color="#FFFFFF" />
          </View>
          <Text style={styles.uploadTitle}>Arrastra y suelta tus archivos aquí</Text>
          <Text style={styles.uploadHint}>
            o <Text style={styles.uploadLink}>haz clic para seleccionar</Text>
            {' '}· Máx. 25 MB por archivo
          </Text>
          <View style={styles.fileTypesRow}>
            {FILE_TYPES.map(type => (
              <View key={type} style={styles.fileTypeBadge}>
                <Text style={styles.fileTypeText}>{type}</Text>
              </View>
            ))}
          </View>
        </TouchableOpacity>

        <View style={styles.recentCard}>
          <View style={styles.recentHeader}>
            <Text style={styles.recentTitle}>Archivos recientes</Text>
            <Text style={styles.recentCount}>{files.length} elemento{files.length !== 1 ? 's' : ''}</Text>
          </View>
          {files.length === 0 ? (
            <View style={styles.emptyState}>
              <HorusIcon name="files" size={40} color={colors.textMuted} />
              <Text style={styles.emptyText}>No hay archivos aún</Text>
            </View>
          ) : (
            <View style={styles.fileList}>
              {files.map((file, index) => (
                <View key={index} style={[styles.fileRow, index < files.length - 1 && styles.fileRowBorder]}>
                  <View style={[styles.fileIcon, { backgroundColor: file.iconColor + '22' }]}>
                    <HorusIcon name={file.iconName} size={20} color={file.iconColor} />
                  </View>
                  <View style={styles.fileInfo}>
                    <Text style={styles.fileName} numberOfLines={1}>{file.name}</Text>
                    <Text style={styles.fileMeta}>{file.type} · {file.size}</Text>
                  </View>
                  <View style={styles.fileActions}>
                    <TouchableOpacity style={styles.actionBtn}>
                      <HorusIcon name="download" size={17} color={colors.textSecondary} />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionBtn} onPress={() => handleDelete(index)}>
                      <HorusIcon name="trash" size={17} color={colors.strawberryRed} />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>

        <View style={styles.storageCard}>
          <View style={styles.storageHeader}>
            <HorusIcon name="cloud" size={15} color={colors.accent} />
            <Text style={styles.storageTitle}>Almacenamiento</Text>
          </View>
          <View style={styles.storageBarTrack}>
            <View style={[styles.storageBarFill, { width: '0%' }]} />
          </View>
          <View style={styles.storageStats}>
            <Text style={styles.storageUsed}>0 MB usados</Text>
            <Text style={styles.storageTotal}>Sin límite configurado</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
