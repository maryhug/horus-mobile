/**
 * AppHeader — Header compartido en todas las vistas de Horus Mobile.
 * Mantiene consistencia visual: logo + "HORUS MOBILE", acciones opcionales.
 */
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { HorusIcon } from '../assets/icons';

interface AppHeaderProps {
  /** Acción al presionar notificaciones (opcional) */
  onNotification?: () => void;
  /** Ocultar el botón de notificaciones */
  hideNotification?: boolean;
  /** Ocultar el avatar del usuario */
  hideAvatar?: boolean;
  /** Elemento adicional en la derecha (antes de las acciones) */
  rightExtra?: React.ReactNode;
}

export function AppHeader({
  onNotification,
  hideNotification = false,
  hideAvatar = false,
  rightExtra,
}: AppHeaderProps) {
  const { colors, isDark, toggleTheme } = useTheme();
  const { user } = useAuth();

  const initials = user
    ? `${user.firstName?.[0] ?? ''}${user.lastName?.[0] ?? ''}`.toUpperCase() || 'HM'
    : 'HM';

  const s = styles(colors, isDark);

  return (
    <View style={s.root}>
      {/* ── Brand ── */}
      <View style={s.brand}>
        <View style={s.logoWrap}>
          <Image
            source={require('../assets/icon.png')}
            style={s.logoImg}
            resizeMode="contain"
          />
        </View>
        <View>
          <Text style={s.brandName}>HORUS</Text>
          <Text style={s.brandSub}>MOBILE</Text>
        </View>
      </View>

      {/* ── Actions ── */}
      <View style={s.actions}>
        {rightExtra}

        <TouchableOpacity style={s.btn} onPress={toggleTheme} activeOpacity={0.75}>
          <HorusIcon name={isDark ? 'sun' : 'moon'} size={19} color={colors.textSecondary} />
        </TouchableOpacity>

        {!hideNotification && (
          <TouchableOpacity style={s.btn} onPress={onNotification} activeOpacity={0.75}>
            <HorusIcon name="bell" size={19} color={colors.textSecondary} />
          </TouchableOpacity>
        )}

        {!hideAvatar && (
          <View style={s.avatar}>
            <Text style={s.avatarText}>{initials}</Text>
          </View>
        )}
      </View>
    </View>
  );
}

function styles(c: ReturnType<typeof useTheme>['colors'], isDark: boolean) {
  return StyleSheet.create({
    root: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 12,
      backgroundColor: c.background,
    },
    brand: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    logoWrap: {
      width: 42,
      height: 42,
      borderRadius: 14,
      backgroundColor: c.accent10,
      justifyContent: 'center',
      alignItems: 'center',
    },
    logoImg: { width: 28, height: 28 },
    brandName: {
      color: c.accent,
      fontSize: 13,
      fontWeight: '900',
      letterSpacing: 2,
      lineHeight: 16,
    },
    brandSub: {
      color: c.textMuted,
      fontSize: 9,
      fontWeight: '700',
      letterSpacing: 2.5,
      lineHeight: 12,
    },
    actions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    btn: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: c.surface,
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: isDark ? 0.3 : 0.08,
      shadowRadius: 8,
      elevation: 3,
    },
    avatar: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: c.teal ?? c.accent,
      justifyContent: 'center',
      alignItems: 'center',
    },
    avatarText: { color: '#FFF', fontSize: 13, fontWeight: '800' },
  });
}

export default AppHeader;
