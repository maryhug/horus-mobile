import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { useApi } from '../../hooks/useApi';
import { apiClient, getErrorMessage } from '../../services/api';
import { AppColors } from '../../constants/colors';
import type { ProfileData, ProfileUpdatePayload } from '../../types/api';

function makeStyles(c: AppColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: c.background },
    scroll: { paddingBottom: 32 },

    profileCard: {
      backgroundColor: c.surface,
      marginHorizontal: 16,
      marginTop: 16,
      borderRadius: 20,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: c.border,
    },
    banner: { height: 110, backgroundColor: c.accent },
    profileBottom: { paddingHorizontal: 16, paddingBottom: 20 },
    avatarWrap: {
      marginTop: -38,
      marginBottom: 10,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-end',
    },
    avatarBox: {
      width: 76,
      height: 76,
      borderRadius: 16,
      backgroundColor: c.spaceIndigo,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 3,
      borderColor: c.surface,
    },
    cameraBtn: {
      position: 'absolute',
      bottom: -2,
      left: 52,
      width: 26,
      height: 26,
      borderRadius: 13,
      backgroundColor: c.accent,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 2,
      borderColor: c.surface,
    },
    editBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: c.accent,
      paddingHorizontal: 16,
      paddingVertical: 9,
      borderRadius: 22,
      shadowColor: c.accent,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.35,
      shadowRadius: 8,
      elevation: 5,
    },
    editBtnText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
    userName: { fontSize: 22, fontWeight: '800', color: c.textPrimary, marginBottom: 4 },
    userHandle: { fontSize: 13, color: c.textSecondary },

    sectionCard: {
      backgroundColor: c.surface,
      marginHorizontal: 16,
      marginTop: 14,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: c.border,
      overflow: 'hidden',
    },
    sectionHeader: {
      paddingHorizontal: 16,
      paddingTop: 16,
      paddingBottom: 12,
      borderBottomWidth: 1,
      borderBottomColor: c.border,
    },
    sectionTitle: { fontSize: 11, fontWeight: '800', color: c.textMuted, letterSpacing: 1.2 },

    infoRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14,
      paddingHorizontal: 16,
      paddingVertical: 14,
      borderBottomWidth: 1,
      borderBottomColor: c.border,
    },
    infoIconWrap: {
      width: 34,
      height: 34,
      borderRadius: 10,
      backgroundColor: c.accent10,
      justifyContent: 'center',
      alignItems: 'center',
    },
    infoTextWrap: { flex: 1 },
    infoLabel: { fontSize: 11, color: c.textMuted, marginBottom: 2 },
    infoValue: { fontSize: 14, color: c.textPrimary, fontWeight: '500' },
    infoValueMuted: { fontSize: 14, color: c.textMuted },

    deviceRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: c.border,
    },
    deviceIconWrap: {
      width: 38,
      height: 38,
      borderRadius: 11,
      backgroundColor: c.accent10,
      justifyContent: 'center',
      alignItems: 'center',
    },
    deviceName: { fontSize: 15, fontWeight: '700', color: c.textPrimary },
    deviceId: { fontSize: 12, color: c.textSecondary, marginTop: 2 },
    statsGrid: { flexDirection: 'row', flexWrap: 'wrap' },
    statCell: {
      width: '50%',
      padding: 14,
      borderBottomWidth: 1,
      borderBottomColor: c.border,
      borderRightWidth: 1,
      borderRightColor: c.border,
    },
    statCellNoRight: { borderRightWidth: 0 },
    statCellNoBorder: { borderBottomWidth: 0 },
    statLabel: { fontSize: 11, color: c.textMuted, marginBottom: 4 },
    statValue: { fontSize: 16, fontWeight: '700', color: c.textPrimary },
    statValueGreen: { fontSize: 16, fontWeight: '700', color: c.success },

    settingsBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: c.surface,
      marginHorizontal: 16,
      marginTop: 14,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: c.border,
      padding: 16,
    },
    settingsBtnLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    settingsBtnIconWrap: {
      width: 38,
      height: 38,
      borderRadius: 11,
      backgroundColor: c.surfaceElevated,
      justifyContent: 'center',
      alignItems: 'center',
    },
    settingsBtnText: { fontSize: 15, fontWeight: '600', color: c.textPrimary },
    settingsBtnSub: { fontSize: 12, color: c.textSecondary, marginTop: 1 },

    logoutBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      marginHorizontal: 16,
      marginTop: 14,
      borderRadius: 14,
      borderWidth: 1.5,
      borderColor: c.accent,
      padding: 14,
    },
    logoutText: { fontSize: 15, fontWeight: '700', color: c.accent },

    // Edit modal
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.55)',
      justifyContent: 'flex-end',
    },
    modalCard: {
      backgroundColor: c.surface,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      padding: 24,
      paddingBottom: 40,
    },
    modalTitle: { fontSize: 18, fontWeight: '800', color: c.textPrimary, marginBottom: 20 },
    fieldGroup: { marginBottom: 16 },
    fieldLabel: { fontSize: 13, color: c.textSecondary, fontWeight: '500', marginBottom: 6 },
    fieldInput: {
      backgroundColor: c.surfaceElevated,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: c.border,
      paddingHorizontal: 14,
      paddingVertical: 12,
      color: c.textPrimary,
      fontSize: 14,
    },
    modalActions: { flexDirection: 'row', gap: 12, marginTop: 8 },
    cancelBtn: {
      flex: 1,
      paddingVertical: 14,
      borderRadius: 14,
      borderWidth: 1.5,
      borderColor: c.border,
      alignItems: 'center',
    },
    cancelBtnText: { color: c.textSecondary, fontWeight: '700', fontSize: 14 },
    saveBtn: {
      flex: 1,
      paddingVertical: 14,
      borderRadius: 14,
      backgroundColor: c.accent,
      alignItems: 'center',
    },
    saveBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 14 },
  });
}

export default function ProfileScreen() {
  const { colors, isDark, toggleTheme } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { user, logout, updateUser } = useAuth();

  const [editModalVisible, setEditModalVisible] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editFields, setEditFields] = useState<ProfileUpdatePayload>({});

  const { data: profile, loading, refetch } = useApi<ProfileData>(
    () => apiClient.get<ProfileData>('/profile').then(r => r.data)
  );

  const displayUser = profile ?? user;

  const fullName = displayUser
    ? `${displayUser.firstName ?? ''} ${displayUser.lastName ?? ''}`.trim() || displayUser.email
    : 'Cargando...';

  const handleOpenEdit = () => {
    setEditFields({
      firstName: displayUser?.firstName ?? '',
      lastName: displayUser?.lastName ?? '',
      phone: displayUser?.phone ?? '',
      location: displayUser?.location ?? '',
    });
    setEditModalVisible(true);
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      await apiClient.put('/profile', editFields);
      updateUser(editFields);
      setEditModalVisible(false);
      refetch();
    } catch (err) {
      Alert.alert('Error', getErrorMessage(err));
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Cerrar sesión',
      '¿Estás seguro que deseas cerrar sesión?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Cerrar sesión', style: 'destructive', onPress: logout },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
        backgroundColor: colors.surface,
      }}>
        <Text style={{ fontSize: 20, fontWeight: '800', color: colors.textPrimary }}>Mi Perfil</Text>
        <TouchableOpacity
          onPress={toggleTheme}
          style={{
            width: 38, height: 38, borderRadius: 10,
            backgroundColor: colors.surfaceElevated,
            borderWidth: 1, borderColor: colors.border,
            justifyContent: 'center', alignItems: 'center',
          }}
        >
          <Ionicons name={isDark ? 'sunny-outline' : 'moon-outline'} size={18} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={refetch} tintColor={colors.accent} />
        }
      >
        {/* Profile card */}
        <View style={styles.profileCard}>
          <View style={styles.banner} />
          <View style={styles.profileBottom}>
            <View style={styles.avatarWrap}>
              <View>
                <View style={styles.avatarBox}>
                  {loading
                    ? <ActivityIndicator color={colors.accent} />
                    : <Ionicons name="person" size={36} color={colors.lavenderGrey} />}
                </View>
                <View style={styles.cameraBtn}>
                  <Ionicons name="camera" size={12} color="#FFFFFF" />
                </View>
              </View>
              <TouchableOpacity style={styles.editBtn} onPress={handleOpenEdit}>
                <Ionicons name="pencil" size={14} color="#FFFFFF" />
                <Text style={styles.editBtnText}>Editar perfil</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.userName}>{fullName}</Text>
            <Text style={styles.userHandle}>
              {displayUser?.email ?? '—'} · Miembro Horus
            </Text>
          </View>
        </View>

        {/* Personal info */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>INFORMACIÓN PERSONAL</Text>
          </View>

          <InfoRow icon="mail-outline" label="Email" value={displayUser?.email ?? '—'} colors={colors} styles={styles} />
          <InfoRow icon="call-outline" label="Teléfono" value={displayUser?.phone ?? '—'} muted={!displayUser?.phone} styles={styles} colors={colors} />
          <InfoRow icon="location-outline" label="Ubicación" value={displayUser?.location ?? '—'} muted={!displayUser?.location} styles={styles} colors={colors} />
          <InfoRow icon="water-outline" label="Tipo de sangre" value={displayUser?.bloodType ?? '—'} muted={!displayUser?.bloodType} styles={styles} colors={colors} />
          <View style={[styles.infoRow, { borderBottomWidth: 0 }]}>
            <View style={styles.infoIconWrap}>
              <Ionicons name="calendar-outline" size={17} color={colors.accent} />
            </View>
            <View style={styles.infoTextWrap}>
              <Text style={styles.infoLabel}>Fecha de nacimiento</Text>
              <Text style={displayUser?.dateOfBirth ? styles.infoValue : styles.infoValueMuted}>
                {displayUser?.dateOfBirth
                  ? new Date(displayUser.dateOfBirth).toLocaleDateString('es-MX')
                  : '—'}
              </Text>
            </View>
          </View>
        </View>

        {/* Device info */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>MI MANILLA HORUS</Text>
          </View>
          <View style={styles.deviceRow}>
            <View style={styles.deviceIconWrap}>
              <Ionicons name="shield-checkmark-outline" size={20} color={colors.accent} />
            </View>
            <View>
              <Text style={styles.deviceName}>Horus Pro · Negro</Text>
              <Text style={styles.deviceId}>
                {displayUser?.nfcTagId ? `NFC: ${displayUser.nfcTagId}` : 'ID: No registrada'}
              </Text>
            </View>
          </View>
          {/* TODO: ajustar según la respuesta real de la API — estos datos deben venir del dispositivo */}
          <View style={styles.statsGrid}>
            <View style={styles.statCell}>
              <Text style={styles.statLabel}>NFC</Text>
              <Text style={styles.statValueGreen}>Activo</Text>
            </View>
            <View style={[styles.statCell, styles.statCellNoRight]}>
              <Text style={styles.statLabel}>GPS</Text>
              <Text style={styles.statValueGreen}>Activo</Text>
            </View>
            <View style={[styles.statCell, styles.statCellNoBorder]}>
              <Text style={styles.statLabel}>Batería</Text>
              <Text style={styles.statValue}>85%</Text>
            </View>
            <View style={[styles.statCell, styles.statCellNoRight, styles.statCellNoBorder]}>
              <Text style={styles.statLabel}>Firmware</Text>
              <Text style={styles.statValue}>v2.4.1</Text>
            </View>
          </View>
        </View>

        <TouchableOpacity style={styles.settingsBtn} onPress={() => router.push('/settings')}>
          <View style={styles.settingsBtnLeft}>
            <View style={styles.settingsBtnIconWrap}>
              <Ionicons name="settings-outline" size={20} color={colors.textSecondary} />
            </View>
            <View>
              <Text style={styles.settingsBtnText}>Configuración</Text>
              <Text style={styles.settingsBtnSub}>Notificaciones, privacidad, dispositivo</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={19} color={colors.accent} />
          <Text style={styles.logoutText}>Cerrar sesión</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Edit profile modal */}
      <Modal visible={editModalVisible} transparent animationType="slide" onRequestClose={() => setEditModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Editar perfil</Text>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Nombre</Text>
              <TextInput
                style={styles.fieldInput}
                value={editFields.firstName}
                onChangeText={v => setEditFields(p => ({ ...p, firstName: v }))}
                placeholder="Nombre"
                placeholderTextColor={colors.textMuted}
              />
            </View>
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Apellido</Text>
              <TextInput
                style={styles.fieldInput}
                value={editFields.lastName}
                onChangeText={v => setEditFields(p => ({ ...p, lastName: v }))}
                placeholder="Apellido"
                placeholderTextColor={colors.textMuted}
              />
            </View>
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Teléfono</Text>
              <TextInput
                style={styles.fieldInput}
                value={editFields.phone}
                onChangeText={v => setEditFields(p => ({ ...p, phone: v }))}
                placeholder="+57 300 000 0000"
                placeholderTextColor={colors.textMuted}
                keyboardType="phone-pad"
              />
            </View>
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Ubicación</Text>
              <TextInput
                style={styles.fieldInput}
                value={editFields.location}
                onChangeText={v => setEditFields(p => ({ ...p, location: v }))}
                placeholder="Ciudad, País"
                placeholderTextColor={colors.textMuted}
              />
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setEditModalVisible(false)}>
                <Text style={styles.cancelBtnText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleSaveProfile} disabled={isSaving}>
                {isSaving
                  ? <ActivityIndicator color="#FFFFFF" size="small" />
                  : <Text style={styles.saveBtnText}>Guardar</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function InfoRow({
  icon, label, value, muted, styles, colors,
}: {
  icon: string; label: string; value: string; muted?: boolean;
  styles: ReturnType<typeof makeStyles>; colors: AppColors;
}) {
  return (
    <View style={styles.infoRow}>
      <View style={styles.infoIconWrap}>
        <Ionicons name={icon as any} size={17} color={colors.accent} />
      </View>
      <View style={styles.infoTextWrap}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={muted ? styles.infoValueMuted : styles.infoValue}>{value}</Text>
      </View>
    </View>
  );
}
