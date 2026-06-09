import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import { useAppTheme } from '../hooks/useAppTheme';
import { useLanguage } from '../contexts/LanguageContext';

const YELLOW   = '#FAD957';
const ICON_ON  = '#1A1512';   // icono activo → siempre sobre fondo amarillo

// ── SVG icons ──────────────────────────────────────────────────────────────
function ActivityIcon({ color }: { color: string }) {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path
        d="M22 12h-2.48a2 2 0 0 0-1.93 1.46l-2.35 8.36a.25.25 0 0 1-.48 0L9.24 2.18a.25.25 0 0 0-.48 0l-2.35 8.36A2 2 0 0 1 4.49 12H2"
        stroke={color} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round"
      />
    </Svg>
  );
}

function RadarIcon({ color }: { color: string }) {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path d="M19.07 4.93A10 10 0 0 0 6.99 3.34"       stroke={color} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M4 6h.01"                                  stroke={color} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M2.29 9.62A10 10 0 1 0 21.31 8.35"        stroke={color} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M16.24 7.76A6 6 0 1 0 8.23 16.67"         stroke={color} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M12 18h.01"                                stroke={color} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M17.99 11.66A6 6 0 0 1 15.77 16.67"       stroke={color} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />
      <Circle cx={12} cy={12} r={2}                       stroke={color} strokeWidth={2.4} />
      <Path d="m13.41 10.59 5.66-5.66"                   stroke={color} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function QrIcon({ color }: { color: string }) {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Rect x={3}  y={3}  width={5} height={5} rx={1} stroke={color} strokeWidth={2.4} />
      <Rect x={16} y={3}  width={5} height={5} rx={1} stroke={color} strokeWidth={2.4} />
      <Rect x={3}  y={16} width={5} height={5} rx={1} stroke={color} strokeWidth={2.4} />
      <Path d="M21 16h-3a2 2 0 0 0-2 2v3"  stroke={color} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M21 21v.01"                  stroke={color} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M12 7v3a2 2 0 0 1-2 2H7"    stroke={color} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M3 12h.01"                   stroke={color} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M12 3h.01"                   stroke={color} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M12 16v.01"                  stroke={color} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M16 12h1"                    stroke={color} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M21 12v.01"                  stroke={color} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M12 21v-1"                   stroke={color} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function MessageIcon({ color }: { color: string }) {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path
        d="M2.992 16.342a2 2 0 0 1 .094 1.167l-1.065 3.29a1 1 0 0 0 1.236 1.168l3.413-.998a2 2 0 0 1 1.099.092 10 10 0 1 0-4.777-4.719"
        stroke={color} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round"
      />
    </Svg>
  );
}

function FolderIcon({ color }: { color: string }) {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path
        d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"
        stroke={color} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round"
      />
      <Path d="M2 10h20" stroke={color} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function UserIcon({ color }: { color: string }) {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" stroke={color} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />
      <Circle cx={12} cy={7} r={4} stroke={color} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

// ── Tab definitions ────────────────────────────────────────────────────────
type TabDef = { name: string; label: string; Icon: React.FC<{ color: string }> };

// ── Component ──────────────────────────────────────────────────────────────
export function FloatingTabBar({ state, navigation }: BottomTabBarProps) {
  const insets    = useSafeAreaInsets();
  const bottomPad = Math.max(insets.bottom, Platform.OS === 'ios' ? 16 : 12);

  const { PRIMARY, MUTED, isDark } = useAppTheme();
  const { t } = useLanguage();

  const TABS = React.useMemo<TabDef[]>(() => [
    { name: 'dashboard', label: t.navHome,    Icon: ActivityIcon },
    { name: 'monitor',   label: t.navMonitor, Icon: RadarIcon    },
    { name: 'qr-medico', label: t.navId,      Icon: QrIcon       },
    { name: 'assistant', label: t.navAi,      Icon: MessageIcon  },
    { name: 'files',     label: t.navFiles,   Icon: FolderIcon   },
    { name: 'profile',   label: t.navProfile, Icon: UserIcon     },
  ], [t]);

  // Invertidos: tema claro → navbar oscuro · tema oscuro → navbar crema
  // PRIMARY es crema en dark (#F5EFE6) y oscuro en light (#1A1512)
  // BG es oscuro en dark (#1A1510) y crema en light (#F9F6ED)
  const barBg    = isDark ? PRIMARY    : '#191512';
  const iconOff  = isDark ? '#7A6A58' : 'rgba(255,255,255,0.55)';
  const labelOff = isDark ? '#7A6A58' : 'rgba(255,255,255,0.45)';
  const labelOn  = isDark ? '#1A1510' : '#FFFFFF';

  return (
    <View style={[s.wrapper, { paddingBottom: bottomPad }]}>
      <View style={[s.bar, { backgroundColor: barBg }]}>
        {TABS.map((tab, idx) => {
          const active  = state.index === idx;
          const color   = active ? ICON_ON : iconOff;
          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: state.routes[idx]?.key,
              canPreventDefault: true,
            });
            if (!event.defaultPrevented) navigation.navigate(tab.name);
          };
          return (
            <TouchableOpacity key={tab.name} style={s.tab} onPress={onPress} activeOpacity={0.75}>
              <View style={[s.iconWrap, active && s.iconWrapActive]}>
                <tab.Icon color={color} />
              </View>
              <Text style={[s.label, { color: labelOff }, active && { color: labelOn }]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    paddingHorizontal: 16,
    pointerEvents: 'box-none',
  } as any,
  bar: {
    flexDirection: 'row',
    borderRadius: 28,
    paddingHorizontal: 10,
    paddingVertical: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 20,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
    paddingVertical: 2,
  },
  iconWrap: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
  },
  iconWrapActive: {
    backgroundColor: YELLOW,
  },
  label: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: -0.3,
  },
});
