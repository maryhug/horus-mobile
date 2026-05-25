import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../contexts/ThemeContext';

export default function TabLayout() {
    const { colors } = useTheme();
    const insets = useSafeAreaInsets();

    // Minimum safe area per platform in case insets.bottom reports 0
    const minBottom = Platform.OS === 'ios' ? 34 : Platform.OS === 'android' ? 28 : 8;
    const safeBottom = Math.max(insets.bottom, minBottom);

    // Content area is always 52px (icon 24 + gap + label 14 + breathing room)
    // safeBottom is added purely as dead space at the bottom for home indicator / gestures
    const tabBarHeight = 52 + 6 + safeBottom; // 6 = paddingTop

    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarStyle: {
                    backgroundColor: colors.surface,
                    borderTopColor: colors.border,
                    borderTopWidth: 1,
                    height: tabBarHeight,
                    paddingTop: 6,
                    paddingBottom: safeBottom,
                },
                tabBarActiveTintColor: colors.accent,
                tabBarInactiveTintColor: colors.textMuted,
                tabBarLabelStyle: { fontSize: 10, fontWeight: '600' },
            }}
        >
            <Tabs.Screen
                name="dashboard"
                options={{
                    title: 'Dashboard',
                    tabBarIcon: ({ color, size }) => <Ionicons name="grid-outline" size={size} color={color} />,
                }}
            />
            <Tabs.Screen
                name="monitor"
                options={{
                    title: 'Monitor',
                    tabBarIcon: ({ color, size }) => <Ionicons name="radio-outline" size={size} color={color} />,
                }}
            />
            <Tabs.Screen
                name="qr-medico"
                options={{
                    title: 'ID Médico',
                    tabBarIcon: ({ color, size }) => <Ionicons name="qr-code-outline" size={size} color={color} />,
                }}
            />
            <Tabs.Screen
                name="assistant"
                options={{
                    title: 'Asistente IA',
                    tabBarIcon: ({ color, size }) => <Ionicons name="sparkles-outline" size={size} color={color} />,
                }}
            />
            <Tabs.Screen
                name="files"
                options={{
                    title: 'Archivos',
                    tabBarIcon: ({ color, size }) => <Ionicons name="folder-outline" size={size} color={color} />,
                }}
            />
            <Tabs.Screen
                name="profile"
                options={{
                    title: 'Perfil',
                    tabBarIcon: ({ color, size }) => <Ionicons name="person-outline" size={size} color={color} />,
                }}
            />
        </Tabs>
    );
}