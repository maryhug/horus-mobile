import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Switch,
  Modal,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage, Language } from '../contexts/LanguageContext';
import { apiClient, getErrorMessage } from '../services/api';
import { AppColors } from '../constants/colors';

function makeStyles(c: AppColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: c.background },
    header: {
      flexDirection: 'row', alignItems: 'center', gap: 12,
      paddingHorizontal: 20, paddingVertical: 14,
      borderBottomWidth: 1, borderBottomColor: c.border,
      backgroundColor: c.surface,
    },
    backBtn: {
      width: 38, height: 38, borderRadius: 10,
      backgroundColor: c.surfaceElevated,
      borderWidth: 1, borderColor: c.border,
      justifyContent: 'center', alignItems: 'center',
    },
    headerTitle: { fontSize: 18, fontWeight: '800', color: c.textPrimary, flex: 1 },
    scroll: { paddingBottom: 40 },
    sectionLabel: {
      fontSize: 11, fontWeight: '800', color: c.textMuted, letterSpacing: 1.2,
      paddingHorizontal: 20, paddingTop: 24, paddingBottom: 10,
    },
    settingGroup: {
      backgroundColor: c.surface, marginHorizontal: 16,
      borderRadius: 20, borderWidth: 1, borderColor: c.border, overflow: 'hidden',
    },
    settingRow: {
      flexDirection: 'row', alignItems: 'center', gap: 14,
      paddingHorizontal: 16, paddingVertical: 14,
      borderBottomWidth: 1, borderBottomColor: c.border,
    },
    settingRowLast: { borderBottomWidth: 0 },
    settingIconWrap: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
    settingText: { flex: 1 },
    settingTitle: { fontSize: 14, fontWeight: '600', color: c.textPrimary },
    settingDesc: { fontSize: 12, color: c.textSecondary, marginTop: 1 },
    themeSelector: { flexDirection: 'row', gap: 10, paddingHorizontal: 16, paddingBottom: 16 },
    themeOption: {
      flex: 1, padding: 12, borderRadius: 14,
      borderWidth: 1.5, borderColor: c.border, alignItems: 'center', gap: 6,
    },
    themeOptionActive: { borderColor: c.accent, backgroundColor: c.accent10 },
    themeOptionLabel: { fontSize: 13, fontWeight: '600', color: c.textSecondary },
    themeOptionLabelActive: { color: c.accent },
    dangerGroup: {
      backgroundColor: c.surface, marginHorizontal: 16,
      borderRadius: 20, borderWidth: 1, borderColor: `${c.accent}40`, overflow: 'hidden',
    },
    dangerRow: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 16, paddingVertical: 15 },
    dangerIconWrap: { width: 36, height: 36, borderRadius: 10, backgroundColor: c.accent10, justifyContent: 'center', alignItems: 'center' },
    dangerText: { flex: 1 },
    dangerTitle: { fontSize: 14, fontWeight: '600', color: c.accent },
    dangerDesc: { fontSize: 12, color: c.textSecondary, marginTop: 1 },
    versionText: { textAlign: 'center', color: c.textMuted, fontSize: 12, marginTop: 24 },

    // Shared modal
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
    modalCard: { backgroundColor: c.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '90%' },
    modalHeader: {
      flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
      padding: 20, borderBottomWidth: 1, borderBottomColor: c.border,
    },
    modalTitle: { fontSize: 17, fontWeight: '800', color: c.textPrimary },
    modalClose: { width: 32, height: 32, borderRadius: 16, backgroundColor: c.surfaceElevated, justifyContent: 'center', alignItems: 'center' },
    modalBody: { padding: 20 },
    modalActions: { flexDirection: 'row', gap: 12, marginTop: 4 },
    cancelBtn: { flex: 1, paddingVertical: 14, borderRadius: 14, borderWidth: 1.5, borderColor: c.border, alignItems: 'center' },
    cancelBtnText: { color: c.textSecondary, fontWeight: '700', fontSize: 14 },
    confirmBtn: { flex: 1, paddingVertical: 14, borderRadius: 14, backgroundColor: c.accent, alignItems: 'center', justifyContent: 'center' },
    confirmBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 14 },

    // Logout modal
    logoutModalCard: { backgroundColor: c.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
    logoutModalTitle: { fontSize: 18, fontWeight: '800', color: c.textPrimary, marginBottom: 8 },
    logoutModalDesc: { color: c.textSecondary, fontSize: 14, marginBottom: 24 },

    // Terms modal
    termsSection: { marginBottom: 20 },
    termsSectionTitle: { fontSize: 13, fontWeight: '800', color: c.accent, marginBottom: 8, letterSpacing: 0.5 },
    termsText: { fontSize: 13, color: c.textSecondary, lineHeight: 20 },

    // Change password modal
    inputGroup: { marginBottom: 16 },
    inputLabel: { fontSize: 13, fontWeight: '600', color: c.textSecondary, marginBottom: 6 },
    inputBox: {
      flexDirection: 'row', alignItems: 'center',
      backgroundColor: c.surfaceElevated, borderRadius: 12,
      borderWidth: 1, borderColor: c.border, paddingHorizontal: 14, height: 50,
    },
    inputBoxError: { borderColor: '#EF233C' },
    textInput: { flex: 1, color: c.textPrimary, fontSize: 15 },
    eyeBtn: { padding: 4 },
    errorBox: {
      backgroundColor: 'rgba(239,35,60,0.10)', borderRadius: 10,
      borderWidth: 1, borderColor: 'rgba(239,35,60,0.25)',
      paddingHorizontal: 14, paddingVertical: 10, marginBottom: 16,
      flexDirection: 'row', alignItems: 'center', gap: 8,
    },
    errorText: { color: '#EF233C', fontSize: 13, flex: 1, lineHeight: 18 },
    successBox: {
      backgroundColor: 'rgba(76,175,80,0.10)', borderRadius: 10,
      borderWidth: 1, borderColor: 'rgba(76,175,80,0.25)',
      paddingHorizontal: 14, paddingVertical: 10, marginBottom: 16,
      flexDirection: 'row', alignItems: 'center', gap: 8,
    },
    successText: { color: '#4CAF50', fontSize: 13, flex: 1 },

    // Language modal
    langOption: {
      flexDirection: 'row', alignItems: 'center', gap: 14,
      paddingVertical: 16, paddingHorizontal: 4,
      borderBottomWidth: 1, borderBottomColor: c.border,
    },
    langOptionLast: { borderBottomWidth: 0 },
    langFlag: { fontSize: 28 },
    langText: { flex: 1 },
    langName: { fontSize: 15, fontWeight: '600', color: c.textPrimary },
    langNative: { fontSize: 12, color: c.textSecondary, marginTop: 1 },
    langCheck: { width: 24, height: 24, borderRadius: 12, backgroundColor: c.accent, justifyContent: 'center', alignItems: 'center' },
    langCheckEmpty: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: c.border },
    langSubtitle: { fontSize: 13, color: c.textSecondary, marginBottom: 20 },
  });
}

type SettingRowProps = {
  icon: string; iconBg: string; iconColor: string;
  title: string; desc?: string; isLast?: boolean;
  right?: React.ReactNode; onPress?: () => void;
  styles: ReturnType<typeof makeStyles>;
};

function SettingRow({ icon, iconBg, iconColor, title, desc, isLast, right, onPress, styles }: SettingRowProps) {
  return (
    <TouchableOpacity
      style={[styles.settingRow, isLast && styles.settingRowLast]}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      <View style={[styles.settingIconWrap, { backgroundColor: iconBg }]}>
        <Ionicons name={icon as any} size={18} color={iconColor} />
      </View>
      <View style={styles.settingText}>
        <Text style={styles.settingTitle}>{title}</Text>
        {desc && <Text style={styles.settingDesc}>{desc}</Text>}
      </View>
      {right ?? <Ionicons name="chevron-forward" size={16} color="rgba(141,153,174,0.5)" />}
    </TouchableOpacity>
  );
}

const LANGUAGES: { code: Language; name: string; native: string; flag: string }[] = [
  { code: 'es', name: 'Español', native: 'Spanish', flag: '🇪🇸' },
  { code: 'en', name: 'English', native: 'Inglés', flag: '🇺🇸' },
];

export default function SettingsScreen() {
  const { colors, isDark, toggleTheme } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { logout, user } = useAuth();
  const { language, setLanguage, t } = useLanguage();

  const [notifAlerts, setNotifAlerts] = useState(true);
  const [notifSync, setNotifSync] = useState(true);
  const [notifLocation, setNotifLocation] = useState(false);
  const [autoSync, setAutoSync] = useState(true);
  const [nfcEnabled, setNfcEnabled] = useState(true);
  const [gpsEnabled, setGpsEnabled] = useState(true);

  const [termsVisible, setTermsVisible] = useState(false);
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);
  const [langModalVisible, setLangModalVisible] = useState(false);
  const [pwModalVisible, setPwModalVisible] = useState(false);

  // Change password state
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);
  const [pwError, setPwError] = useState<string | null>(null);
  const [pwSuccess, setPwSuccess] = useState(false);

  const switchColors = { trackColor: { false: colors.border, true: `${colors.accent}80` }, thumbColor: colors.accent };

  const handleLogout = () => setLogoutModalVisible(true);
  const confirmLogout = async () => {
    setLogoutModalVisible(false);
    await logout();
  };

  const openPwModal = () => {
    setCurrentPw(''); setNewPw(''); setConfirmPw('');
    setPwError(null); setPwSuccess(false);
    setPwModalVisible(true);
  };

  const handleChangePassword = async () => {
    if (!currentPw || !newPw || !confirmPw) {
      setPwError(t('passwordRequired'));
      return;
    }
    if (newPw !== confirmPw) {
      setPwError(t('passwordMismatch'));
      return;
    }
    setPwError(null);
    setPwLoading(true);
    try {
      await apiClient.put('/auth/change-password', { currentPassword: currentPw, newPassword: newPw });
      setPwSuccess(true);
      setCurrentPw(''); setNewPw(''); setConfirmPw('');
    } catch (err) {
      setPwError(getErrorMessage(err));
    } finally {
      setPwLoading(false);
    }
  };

  const currentLangName = LANGUAGES.find(l => l.code === language)?.name ?? 'Español';

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={18} color={colors.textSecondary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('title')}</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* ── Apariencia ── */}
        <Text style={styles.sectionLabel}>{t('appearance')}</Text>
        <View style={styles.settingGroup}>
          <View style={[styles.settingRow, { paddingBottom: 8 }]}>
            <View style={[styles.settingIconWrap, { backgroundColor: colors.accent10 }]}>
              <Ionicons name={isDark ? 'moon' : 'sunny'} size={18} color={colors.accent} />
            </View>
            <View style={styles.settingText}>
              <Text style={styles.settingTitle}>{t('theme')}</Text>
              <Text style={styles.settingDesc}>{t('themeDesc')}</Text>
            </View>
          </View>
          <View style={styles.themeSelector}>
            <TouchableOpacity style={[styles.themeOption, isDark && styles.themeOptionActive]} onPress={() => !isDark && toggleTheme()}>
              <Ionicons name="moon" size={22} color={isDark ? colors.accent : colors.textMuted} />
              <Text style={[styles.themeOptionLabel, isDark && styles.themeOptionLabelActive]}>{t('dark')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.themeOption, !isDark && styles.themeOptionActive]} onPress={() => isDark && toggleTheme()}>
              <Ionicons name="sunny" size={22} color={!isDark ? colors.accent : colors.textMuted} />
              <Text style={[styles.themeOptionLabel, !isDark && styles.themeOptionLabelActive]}>{t('light')}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Notificaciones ── */}
        <Text style={styles.sectionLabel}>{t('notifications')}</Text>
        <View style={styles.settingGroup}>
          <SettingRow icon="warning-outline" iconBg="rgba(255,167,38,0.12)" iconColor="#FFA726"
            title={t('securityAlerts')} desc={t('securityAlertsDesc')}
            right={<Switch value={notifAlerts} onValueChange={setNotifAlerts} {...switchColors} />} styles={styles} />
          <SettingRow icon="sync-outline" iconBg="rgba(76,175,80,0.12)" iconColor="#4CAF50"
            title={t('syncNotif')} desc={t('syncNotifDesc')}
            right={<Switch value={notifSync} onValueChange={setNotifSync} {...switchColors} />} styles={styles} />
          <SettingRow icon="location-outline" iconBg={colors.accent10} iconColor={colors.accent}
            title={t('locationUpdates')} desc={t('locationUpdatesDesc')} isLast
            right={<Switch value={notifLocation} onValueChange={setNotifLocation} {...switchColors} />} styles={styles} />
        </View>

        {/* ── Dispositivo ── */}
        <Text style={styles.sectionLabel}>{t('device')}</Text>
        <View style={styles.settingGroup}>
          <SettingRow icon="wifi-outline" iconBg="rgba(76,175,80,0.12)" iconColor="#4CAF50"
            title={t('nfc')} desc={t('nfcDesc')}
            right={<Switch value={nfcEnabled} onValueChange={setNfcEnabled} {...switchColors} />} styles={styles} />
          <SettingRow icon="navigate-outline" iconBg={colors.accent10} iconColor={colors.accent}
            title={t('gps')} desc={t('gpsDesc')}
            right={<Switch value={gpsEnabled} onValueChange={setGpsEnabled} {...switchColors} />} styles={styles} />
          <SettingRow icon="repeat-outline" iconBg={colors.grey10} iconColor={colors.textSecondary}
            title={t('autoSync')} desc={t('autoSyncDesc')} isLast
            right={<Switch value={autoSync} onValueChange={setAutoSync} {...switchColors} />} styles={styles} />
        </View>

        {/* ── Privacidad ── */}
        <Text style={styles.sectionLabel}>{t('privacy')}</Text>
        <View style={styles.settingGroup}>
          <SettingRow icon="lock-closed-outline" iconBg={colors.grey10} iconColor={colors.textSecondary}
            title={t('changePassword')} onPress={openPwModal} styles={styles} />
          <SettingRow icon="shield-outline" iconBg={colors.grey10} iconColor={colors.textSecondary}
            title={t('privacyData')} styles={styles} />
          <SettingRow icon="language-outline" iconBg={colors.grey10} iconColor={colors.textSecondary}
            title={t('language')} desc={currentLangName} isLast
            onPress={() => setLangModalVisible(true)} styles={styles} />
        </View>

        {/* ── Acerca de ── */}
        <Text style={styles.sectionLabel}>{t('about')}</Text>
        <View style={styles.settingGroup}>
          <SettingRow icon="information-circle-outline" iconBg={colors.grey10} iconColor={colors.textSecondary}
            title={t('appVersion')} desc={t('appVersionDesc')} right={<View />} styles={styles} />
          <SettingRow icon="document-text-outline" iconBg={colors.grey10} iconColor={colors.textSecondary}
            title={t('terms')} onPress={() => setTermsVisible(true)} styles={styles} />
          <SettingRow icon="help-circle-outline" iconBg={colors.grey10} iconColor={colors.textSecondary}
            title={t('help')} isLast styles={styles} />
        </View>

        {/* ── Sesión ── */}
        <Text style={styles.sectionLabel}>{t('session')}</Text>
        <View style={styles.dangerGroup}>
          <TouchableOpacity style={styles.dangerRow} onPress={handleLogout}>
            <View style={styles.dangerIconWrap}>
              <Ionicons name="log-out-outline" size={18} color={colors.accent} />
            </View>
            <View style={styles.dangerText}>
              <Text style={styles.dangerTitle}>{t('logout')}</Text>
              <Text style={styles.dangerDesc}>{user?.email ?? ''}</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.accent} />
          </TouchableOpacity>
        </View>

        <Text style={styles.versionText}>{t('version')}</Text>
      </ScrollView>

      {/* ── Modal: Cerrar sesión ── */}
      <Modal visible={logoutModalVisible} transparent animationType="fade" onRequestClose={() => setLogoutModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.logoutModalCard}>
            <Text style={styles.logoutModalTitle}>{t('logoutConfirmTitle')}</Text>
            <Text style={styles.logoutModalDesc}>{t('logoutConfirmDesc')}</Text>
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setLogoutModalVisible(false)}>
                <Text style={styles.cancelBtnText}>{t('cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.confirmBtn} onPress={confirmLogout}>
                <Text style={styles.confirmBtnText}>{t('confirm')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Modal: Cambiar contraseña ── */}
      <Modal visible={pwModalVisible} transparent animationType="slide" onRequestClose={() => setPwModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('changePasswordTitle')}</Text>
              <TouchableOpacity style={styles.modalClose} onPress={() => setPwModalVisible(false)}>
                <Ionicons name="close" size={18} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalBody} keyboardShouldPersistTaps="handled">

              {pwError && (
                <View style={styles.errorBox}>
                  <Ionicons name="alert-circle-outline" size={16} color="#EF233C" />
                  <Text style={styles.errorText}>{pwError}</Text>
                </View>
              )}
              {pwSuccess && (
                <View style={styles.successBox}>
                  <Ionicons name="checkmark-circle-outline" size={16} color="#4CAF50" />
                  <Text style={styles.successText}>
                    {language === 'es' ? '¡Contraseña actualizada correctamente!' : 'Password updated successfully!'}
                  </Text>
                </View>
              )}

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>{t('currentPassword')}</Text>
                <View style={[styles.inputBox, pwError ? styles.inputBoxError : null]}>
                  <Ionicons name="lock-closed-outline" size={18} color={colors.textMuted} style={{ marginRight: 10 }} />
                  <TextInput
                    style={styles.textInput}
                    placeholder="••••••••"
                    placeholderTextColor={colors.textMuted}
                    secureTextEntry={!showCurrent}
                    value={currentPw}
                    onChangeText={v => { setCurrentPw(v); setPwError(null); setPwSuccess(false); }}
                    editable={!pwLoading}
                  />
                  <TouchableOpacity onPress={() => setShowCurrent(p => !p)} style={styles.eyeBtn}>
                    <Ionicons name={showCurrent ? 'eye-outline' : 'eye-off-outline'} size={18} color={colors.textMuted} />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>{t('newPassword')}</Text>
                <View style={[styles.inputBox, pwError ? styles.inputBoxError : null]}>
                  <Ionicons name="lock-open-outline" size={18} color={colors.textMuted} style={{ marginRight: 10 }} />
                  <TextInput
                    style={styles.textInput}
                    placeholder="••••••••"
                    placeholderTextColor={colors.textMuted}
                    secureTextEntry={!showNew}
                    value={newPw}
                    onChangeText={v => { setNewPw(v); setPwError(null); setPwSuccess(false); }}
                    editable={!pwLoading}
                  />
                  <TouchableOpacity onPress={() => setShowNew(p => !p)} style={styles.eyeBtn}>
                    <Ionicons name={showNew ? 'eye-outline' : 'eye-off-outline'} size={18} color={colors.textMuted} />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>{t('confirmPassword')}</Text>
                <View style={[styles.inputBox, pwError ? styles.inputBoxError : null]}>
                  <Ionicons name="lock-open-outline" size={18} color={colors.textMuted} style={{ marginRight: 10 }} />
                  <TextInput
                    style={styles.textInput}
                    placeholder="••••••••"
                    placeholderTextColor={colors.textMuted}
                    secureTextEntry={!showConfirm}
                    value={confirmPw}
                    onChangeText={v => { setConfirmPw(v); setPwError(null); setPwSuccess(false); }}
                    editable={!pwLoading}
                  />
                  <TouchableOpacity onPress={() => setShowConfirm(p => !p)} style={styles.eyeBtn}>
                    <Ionicons name={showConfirm ? 'eye-outline' : 'eye-off-outline'} size={18} color={colors.textMuted} />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.modalActions}>
                <TouchableOpacity style={styles.cancelBtn} onPress={() => setPwModalVisible(false)} disabled={pwLoading}>
                  <Text style={styles.cancelBtnText}>{t('cancel')}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.confirmBtn} onPress={handleChangePassword} disabled={pwLoading}>
                  {pwLoading
                    ? <ActivityIndicator size="small" color="#FFF" />
                    : <Text style={styles.confirmBtnText}>{t('save')}</Text>
                  }
                </TouchableOpacity>
              </View>

            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ── Modal: Idioma ── */}
      <Modal visible={langModalVisible} transparent animationType="slide" onRequestClose={() => setLangModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('languageTitle')}</Text>
              <TouchableOpacity style={styles.modalClose} onPress={() => setLangModalVisible(false)}>
                <Ionicons name="close" size={18} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <View style={styles.modalBody}>
              <Text style={styles.langSubtitle}>{t('selectLanguage')}</Text>
              {LANGUAGES.map((lang, i) => (
                <TouchableOpacity
                  key={lang.code}
                  style={[styles.langOption, i === LANGUAGES.length - 1 && styles.langOptionLast]}
                  onPress={() => { setLanguage(lang.code); setLangModalVisible(false); }}
                  activeOpacity={0.7}
                >
                  <Text style={styles.langFlag}>{lang.flag}</Text>
                  <View style={styles.langText}>
                    <Text style={styles.langName}>{lang.name}</Text>
                    <Text style={styles.langNative}>{lang.native}</Text>
                  </View>
                  {language === lang.code
                    ? <View style={styles.langCheck}><Ionicons name="checkmark" size={14} color="#FFF" /></View>
                    : <View style={styles.langCheckEmpty} />
                  }
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Modal: Términos ── */}
      <Modal visible={termsVisible} transparent animationType="slide" onRequestClose={() => setTermsVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('terms')}</Text>
              <TouchableOpacity style={styles.modalClose} onPress={() => setTermsVisible(false)}>
                <Ionicons name="close" size={18} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              {[
                ['1. ACEPTACIÓN DE TÉRMINOS', 'Al utilizar Horus Mobile, aceptas los presentes términos y condiciones en su totalidad.'],
                ['2. USO DE LA APLICACIÓN', 'Horus Mobile es una plataforma de monitoreo de salud y seguridad personal. Está prohibido su uso con fines comerciales no autorizados o actividades ilegales.'],
                ['3. PRIVACIDAD Y DATOS', 'Recopilamos datos de salud, ubicación y uso del dispositivo para brindar el servicio. Esta información es confidencial y no se comparte sin tu consentimiento.'],
                ['4. DISPOSITIVOS HORUS', 'Los dispositivos Horus son de uso exclusivo del titular registrado. La pérdida o robo debe reportarse de inmediato.'],
                ['5. LIMITACIÓN DE RESPONSABILIDAD', 'Horus Mobile es una herramienta de apoyo y no reemplaza la atención médica profesional.'],
                ['6. MODIFICACIONES', 'Nos reservamos el derecho de actualizar estos términos. Las modificaciones serán notificadas en la app.'],
                ['7. CONTACTO', 'Dudas: soporte@horusbraslet.com — Versión 1.0, Mayo 2026.'],
              ].map(([title, text], i, arr) => (
                <View key={title} style={[styles.termsSection, i === arr.length - 1 && { marginBottom: 40 }]}>
                  <Text style={styles.termsSectionTitle}>{title}</Text>
                  <Text style={styles.termsText}>{text}</Text>
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
