import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Platform, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../contexts/ThemeContext';

const TAB_COLORS: Record<string, string> = {
  dashboard: '#FF6B9D',
  monitor:   '#4B8EF0',
  'qr-medico': '#34D399',
  assistant: '#A78BFA',
  files:     '#FF8C42',
  profile:   '#FCD34D',
};

export default function TabLayout() {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();

  const minBottom = Platform.OS === 'ios' ? 34 : Platform.OS === 'android' ? 28 : 8;
  const safeBottom = Math.max(insets.bottom, minBottom);
  const tabBarHeight = 58 + safeBottom;

  const bg     = isDark ? '#181928' : '#FFFFFF';
  const border = isDark ? '#252640' : '#E8EAF6';
  const muted  = isDark ? '#4A5080' : '#A0A8C8';

  return (
    <Tabs
      screenOptions={({ route }) => {
        const activeColor = TAB_COLORS[route.name] ?? '#FF6B9D';
        return {
          headerShown: false,
          tabBarStyle: {
            backgroundColor: bg,
            borderTopColor: border,
            borderTopWidth: 1,
            height: tabBarHeight,
            paddingTop: 8,
            paddingBottom: safeBottom,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: -4 },
            shadowOpacity: isDark ? 0.3 : 0.08,
            shadowRadius: 16,
            elevation: 20,
          },
          tabBarActiveTintColor: activeColor,
          tabBarInactiveTintColor: muted,
          tabBarLabelStyle: { fontSize: 9, fontWeight: '800', letterSpacing: 0.3, marginTop: 1 },
          tabBarIconStyle: { marginBottom: -2 },
          tabBarItemStyle: { borderRadius: 14 },
          tabBarBackground: () => (
            <View style={{ flex: 1, backgroundColor: bg }} />
          ),
        };
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color, focused }) => (
            <View style={focused ? {
              backgroundColor: TAB_COLORS['dashboard'] + '22',
              borderRadius: 12, padding: 4,
            } : {}}>
              <Ionicons name={focused ? 'grid' : 'grid-outline'} size={22} color={color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="monitor"
        options={{
          title: 'Monitor',
          tabBarIcon: ({ color, focused }) => (
            <View style={focused ? {
              backgroundColor: TAB_COLORS['monitor'] + '22',
              borderRadius: 12, padding: 4,
            } : {}}>
              <Ionicons name={focused ? 'radio' : 'radio-outline'} size={22} color={color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="qr-medico"
        options={{
          title: 'ID Médico',
          tabBarIcon: ({ color, focused }) => (
            <View style={focused ? {
              backgroundColor: TAB_COLORS['qr-medico'] + '22',
              borderRadius: 12, padding: 4,
            } : {}}>
              <Ionicons name={focused ? 'qr-code' : 'qr-code-outline'} size={22} color={color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="assistant"
        options={{
          title: 'Asistente',
          tabBarIcon: ({ color, focused }) => (
            <View style={focused ? {
              backgroundColor: TAB_COLORS['assistant'] + '22',
              borderRadius: 12, padding: 4,
            } : {}}>
              <Ionicons name={focused ? 'sparkles' : 'sparkles-outline'} size={22} color={color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="files"
        options={{
          title: 'Archivos',
          tabBarIcon: ({ color, focused }) => (
            <View style={focused ? {
              backgroundColor: TAB_COLORS['files'] + '22',
              borderRadius: 12, padding: 4,
            } : {}}>
              <Ionicons name={focused ? 'folder' : 'folder-outline'} size={22} color={color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color, focused }) => (
            <View style={focused ? {
              backgroundColor: TAB_COLORS['profile'] + '22',
              borderRadius: 12, padding: 4,
            } : {}}>
              <Ionicons name={focused ? 'person-circle' : 'person-circle-outline'} size={22} color={color} />
            </View>
          ),
        }}
      />
    </Tabs>
  );
}
