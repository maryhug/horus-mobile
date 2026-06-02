import { Tabs } from 'expo-router';
import { Platform, View, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../contexts/ThemeContext';
import { HorusIcon } from '../../assets/icons';
import { TAB_COLORS } from '../../constants/colors';
import type { HorusIconName } from '../../assets/icons';

type TabKey = keyof typeof TAB_COLORS;

interface TabIconProps {
  name: HorusIconName;
  activeName: HorusIconName;
  label: string;
  tabKey: TabKey;
  focused: boolean;
}

function TabItem({ name, activeName, label, tabKey, focused }: TabIconProps) {
  const { colors } = useTheme();
  const tc = TAB_COLORS[tabKey];

  return (
    <View style={{ alignItems: 'center', paddingTop: 6, width: 52 }}>
      {/* Icon pill — only shows bg when active */}
      <View style={{
        width: 44,
        height: 28,
        borderRadius: 14,
        backgroundColor: focused ? tc.bg : 'transparent',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 3,
      }}>
        <HorusIcon
          name={focused ? activeName : name}
          size={20}
          color={focused ? tc.icon : colors.textMuted}
        />
      </View>
      {/* Label */}
      <Text style={{
        fontSize: 10,
        fontWeight: focused ? '700' : '500',
        color: focused ? tc.icon : colors.textMuted,
        letterSpacing: 0.1,
      }}>
        {label}
      </Text>
    </View>
  );
}

export default function TabLayout() {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();

  const minBottom = Platform.OS === 'ios' ? 20 : Platform.OS === 'android' ? 8 : 4;
  const safeBottom = Math.max(insets.bottom, minBottom);
  const TAB_HEIGHT = 58 + safeBottom;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          height: TAB_HEIGHT,
          paddingBottom: safeBottom,
          paddingTop: 0,
          paddingHorizontal: 4,
          // Subtle top shadow
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -3 },
          shadowOpacity: isDark ? 0.22 : 0.07,
          shadowRadius: 12,
          elevation: 10,
        },
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textMuted,
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabItem
              name="dashboard" activeName="dashboard-active"
              label="Inicio" tabKey="dashboard" focused={focused}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="monitor"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabItem
              name="monitor" activeName="monitor-active"
              label="Monitor" tabKey="monitor" focused={focused}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="qr-medico"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabItem
              name="qr-medical" activeName="qr-medical-active"
              label="ID Médico" tabKey="qr" focused={focused}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="assistant"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabItem
              name="assistant" activeName="assistant-active"
              label="Asistente" tabKey="assistant" focused={focused}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="files"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabItem
              name="files" activeName="files-active"
              label="Archivos" tabKey="files" focused={focused}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabItem
              name="profile" activeName="profile-active"
              label="Perfil" tabKey="profile" focused={focused}
            />
          ),
        }}
      />
    </Tabs>
  );
}
