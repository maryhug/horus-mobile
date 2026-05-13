import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';

export default function Index() {
    const router = useRouter();

    return (
        <View style={styles.container}>
            <View style={styles.badge}>
                <Text style={styles.badgeText}>🏥 EMERGENCY!</Text>
            </View>

            <Text style={styles.title}>Horus Bracelet</Text>
            <Text style={styles.subtitle}>
                Scan your NFC bracelet to access{'\n'}critical medical information
            </Text>

            <TouchableOpacity
                style={styles.button}
                onPress={() => router.push('/emergency')}
            >
                <Text style={styles.buttonText}>📡 Scan Bracelet</Text>
            </TouchableOpacity>

            <Text style={styles.footer}>Powered by Horus Health System</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0a0f1e',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
    },
    badge: {
        backgroundColor: '#ff3b30',
        paddingHorizontal: 16,
        paddingVertical: 6,
        borderRadius: 20,
        marginBottom: 24,
    },
    badgeText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 12,
        letterSpacing: 2,
    },
    title: {
        fontSize: 36,
        fontWeight: 'bold',
        color: '#ffffff',
        marginBottom: 12,
    },
    subtitle: {
        fontSize: 16,
        color: '#8a9bb0',
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: 48,
    },
    button: {
        backgroundColor: '#2563eb',
        paddingHorizontal: 40,
        paddingVertical: 18,
        borderRadius: 16,
        marginBottom: 48,
        shadowColor: '#2563eb',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 16,
        elevation: 8,
    },
    buttonText: {
        color: '#ffffff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    footer: {
        color: '#3d4f63',
        fontSize: 12,
    },
});