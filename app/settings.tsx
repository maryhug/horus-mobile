import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTheme } from '../contexts/ThemeContext';
import { AppColors } from '../constants/colors';

function makeStyles(c: AppColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: c.background },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingHorizontal: 20,
      paddingVertical: 14,
      borderBottomWidth: 1,
      borderBottomColor: c.border,
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
      fontSize: 11, fontWeight: '800', color: c.textMuted,
      letterSpacing: 1.2,
      paddingHorizontal: 20,
      paddingTop: 24,
      paddingBottom: 10,
    },

    settingGroup: {
      backgroundColor: c.surface,
      marginHorizontal: 16,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: c.border,
      overflow: 'hidden',
    },
    settingRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14,
      paddingHorizontal: 16,
      paddingVertical: 14,
      borderBottomWidth: 1,
      borderBottomColor: c.border,
    },
    settingRowLast: { borderBottomWidth: 0 },
    settingIconWrap: {
      width: 36, height: 36, borderRadius: 10,
      justifyContent: 'center', alignItems: 'center',
    },
    settingText: { flex: 1 },
    settingTitle: { fontSize: 14, fontWeight: '600', color: c.textPrimary },
    settingDesc: { fontSize: 12, color: c.textSecondary, marginTop: 1 },

    // Theme selector
    themeSelector: { flexDirection: 'row', gap: 10, paddingHorizontal: 16, paddingBottom: 16 },
    themeOption: {
      flex: 1, padding: 12, borderRadius: 14,
      borderWidth: 1.5, borderColor: c.border,
      alignItems: 'center', gap: 6,
    },
    themeOptionActive: { borderColor: c.accent, backgroundColor: c.accent10 },
    themeOptionLabel: { fontSize: 13, fontWeight: '600', color: c.textSecondary },
    themeOptionLabelActive: { color: c.accent },

    // Danger
    dangerGroup: {
      backgroundColor: c.surface,
      marginHorizontal: 16,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: `${c.accent}40`,
      overflow: 'hidden',
    },
    dangerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14,
      paddingHorizontal: 16,
      paddingVertical: 15,
    },
    dangerIconWrap: {
      width: 36, height: 36, borderRadius: 10,
      backgroundColor: c.accent10,
      justifyContent: 'center', alignItems: 'center',
    },
    dangerText: { flex: 1 },
    dangerTitle: { fontSize: 14, fontWeight: '600', color: c.accent },
    dangerDesc: { fontSize: 12, color: c.textSecondary, marginTop: 1 },

    versionText: {
      textAlign: 'center',
      color: c.textMuted,
      fontSize: 12,
      marginTop: 24,
    },
  });
}

type SettingRowProps = {
  icon: string;
  iconBg: string;
  iconColor: string;
  title: string;
  desc?: string;
  isLast?: boolean;
  right?: React.ReactNode;
  onPress?: () => void;
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

export default function SettingsScreen() {
  const { colors, isDark, toggleTheme } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const [notifAlerts, setNotifAlerts] = useState(true);
  const [notifSync, setNotifSync] = useState(true);
  const [notifLocation, setNotifLocation] = useState(false);
  const [autoSync, setAutoSync] = useState(true);
  const [nfcEnabled, setNfcEnabled] = useState(true);
  const [gpsEnabled, setGpsEnabled] = useState(true);

  const switchColors = { trackColor: { false: colors.border, true: `${colors.accent}80` }, thumbColor: colors.accent };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={18} color={colors.textSecondary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Configuración</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* ── Apariencia ── */}
        <Text style={styles.sectionLabel}>APARIENCIA</Text>
        <View style={styles.settingGroup}>
          <View style={[styles.settingRow, { paddingBottom: 8 }]}>
            <View style={[styles.settingIconWrap, { backgroundColor: colors.accent10 }]}>
              <Ionicons name={isDark ? 'moon' : 'sunny'} size={18} color={colors.accent} />
            </View>
            <View style={styles.settingText}>
              <Text style={styles.settingTitle}>Tema</Text>
              <Text style={styles.settingDesc}>Elige entre oscuro y claro</Text>
            </View>
          </View>
          <View style={styles.themeSelector}>
            <TouchableOpacity
              style={[styles.themeOption, isDark && styles.themeOptionActive]}
              onPress={() => !isDark && toggleTheme()}
            >
              <Ionicons name="moon" size={22} color={isDark ? colors.accent : colors.textMuted} />
              <Text style={[styles.themeOptionLabel, isDark && styles.themeOptionLabelActive]}>Oscuro</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.themeOption, !isDark && styles.themeOptionActive]}
              onPress={() => isDark && toggleTheme()}
            >
              <Ionicons name="sunny" size={22} color={!isDark ? colors.accent : colors.textMuted} />
              <Text style={[styles.themeOptionLabel, !isDark && styles.themeOptionLabelActive]}>Claro</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Notificaciones ── */}
        <Text style={styles.sectionLabel}>NOTIFICACIONES</Text>
        <View style={styles.settingGroup}>
          <SettingRow
            icon="warning-outline" iconBg="rgba(255,167,38,0.12)" iconColor="#FFA726"
            title="Alertas de seguridad"
            desc="Geocercas, ritmo cardíaco, caídas"
            right={<Switch value={notifAlerts} onValueChange={setNotifAlerts} {...switchColors} />}
            styles={styles}
          />
          <SettingRow
            icon="sync-outline" iconBg="rgba(76,175,80,0.12)" iconColor="#4CAF50"
            title="Sincronización"
            desc="Notificación al sincronizar"
            right={<Switch value={notifSync} onValueChange={setNotifSync} {...switchColors} />}
            styles={styles}
          />
          <SettingRow
            icon="location-outline" iconBg={colors.accent10} iconColor={colors.accent}
            title="Actualizaciones de ubicación"
            desc="Notificar cambios de ubicación"
            isLast
            right={<Switch value={notifLocation} onValueChange={setNotifLocation} {...switchColors} />}
            styles={styles}
          />
        </View>

        {/* ── Dispositivo ── */}
        <Text style={styles.sectionLabel}>DISPOSITIVO</Text>
        <View style={styles.settingGroup}>
          <SettingRow
            icon="wifi-outline" iconBg="rgba(76,175,80,0.12)" iconColor="#4CAF50"
            title="NFC"
            desc="Lectura y escritura NFC"
            right={<Switch value={nfcEnabled} onValueChange={setNfcEnabled} {...switchColors} />}
            styles={styles}
          />
          <SettingRow
            icon="navigate-outline" iconBg={colors.accent10} iconColor={colors.accent}
            title="GPS"
            desc="Seguimiento de ubicación"
            right={<Switch value={gpsEnabled} onValueChange={setGpsEnabled} {...switchColors} />}
            styles={styles}
          />
          <SettingRow
            icon="repeat-outline" iconBg={colors.grey10} iconColor={colors.textSecondary}
            title="Sincronización automática"
            desc="Sincronizar cada 5 minutos"
            isLast
            right={<Switch value={autoSync} onValueChange={setAutoSync} {...switchColors} />}
            styles={styles}
          />
        </View>

        {/* ── Privacidad ── */}
        <Text style={styles.sectionLabel}>PRIVACIDAD Y CUENTA</Text>
        <View style={styles.settingGroup}>
          <SettingRow
            icon="lock-closed-outline" iconBg={colors.grey10} iconColor={colors.textSecondary}
            title="Cambiar contraseña" styles={styles}
          />
          <SettingRow
            icon="shield-outline" iconBg={colors.grey10} iconColor={colors.textSecondary}
            title="Privacidad de datos" styles={styles}
          />
          <SettingRow
            icon="language-outline" iconBg={colors.grey10} iconColor={colors.textSecondary}
            title="Idioma"
            desc="Español"
            isLast styles={styles}
          />
        </View>

        {/* ── Acerca de ── */}
        <Text style={styles.sectionLabel}>ACERCA DE</Text>
        <View style={styles.settingGroup}>
          <SettingRow
            icon="information-circle-outline" iconBg={colors.grey10} iconColor={colors.textSecondary}
            title="Versión de la app"
            desc="Horus Mobile v1.0.0"
            right={<View />}
            styles={styles}
          />
          <SettingRow
            icon="document-text-outline" iconBg={colors.grey10} iconColor={colors.textSecondary}
            title="Términos y condiciones" styles={styles}
          />
          <SettingRow
            icon="help-circle-outline" iconBg={colors.grey10} iconColor={colors.textSecondary}
            title="Centro de ayuda"
            isLast styles={styles}
          />
        </View>

        {/* ── Danger zone ── */}
        <Text style={styles.sectionLabel}>SESIÓN</Text>
        <View style={styles.dangerGroup}>
          <TouchableOpacity style={styles.dangerRow} onPress={() => router.replace('/login')}>
            <View style={styles.dangerIconWrap}>
              <Ionicons name="log-out-outline" size={18} color={colors.accent} />
            </View>
            <View style={styles.dangerText}>
              <Text style={styles.dangerTitle}>Cerrar sesión</Text>
              <Text style={styles.dangerDesc}>maryhug@horus.com</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.accent} />
          </TouchableOpacity>
        </View>

        <Text style={styles.versionText}>Horus Mobile © 2026 · v1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}
