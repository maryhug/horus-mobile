import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';

export default function Emergency() {
    const router = useRouter();

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Text style={styles.backText}>← Back</Text>
                </TouchableOpacity>
                <View style={styles.alertBadge}>
                    <Text style={styles.alertText}>🚨 EMERGENCY VIEW</Text>
                </View>
            </View>

            {/* Patient Info */}
            <View style={styles.card}>
                <Text style={styles.cardTitle}>👤 Patient</Text>
                <Text style={styles.name}>John Doe</Text>
                <Text style={styles.detail}>📅 DOB: March 15, 1990 · 35 years old</Text>
                <Text style={styles.detail}>🩸 Blood type: <Text style={styles.highlight}>O+</Text></Text>
            </View>

            {/* Critical Alerts */}
            <View style={[styles.card, styles.alertCard]}>
                <Text style={styles.cardTitle}>⚠️ Critical Alerts</Text>
                <View style={styles.tag}>
                    <Text style={styles.tagText}>🥜 Peanut allergy — SEVERE</Text>
                </View>
                <View style={styles.tag}>
                    <Text style={styles.tagText}>💊 Penicillin allergy</Text>
                </View>
                <View style={styles.tag}>
                    <Text style={styles.tagText}>❤️ Hypertension</Text>
                </View>
            </View>

            {/* Current Medications */}
            <View style={styles.card}>
                <Text style={styles.cardTitle}>💊 Current Medications</Text>
                <Text style={styles.detail}>• Lisinopril 10mg — once daily</Text>
                <Text style={styles.detail}>• Metformin 500mg — twice daily</Text>
            </View>

            {/* Emergency Contacts */}
            <View style={styles.card}>
                <Text style={styles.cardTitle}>📞 Emergency Contacts</Text>
                <TouchableOpacity style={styles.contactRow}>
                    <Text style={styles.detail}>👩 Jane Doe (Wife)</Text>
                    <Text style={styles.callButton}>Call</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.contactRow}>
                    <Text style={styles.detail}>👨‍⚕️ Dr. Smith (Doctor)</Text>
                    <Text style={styles.callButton}>Call</Text>
                </TouchableOpacity>
            </View>

        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0a0f1e',
    },
    content: {
        padding: 20,
        paddingTop: 60,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 24,
    },
    backButton: {
        padding: 8,
    },
    backText: {
        color: '#2563eb',
        fontSize: 16,
    },
    alertBadge: {
        backgroundColor: '#ff3b30',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },
    alertText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 11,
        letterSpacing: 1,
    },
    card: {
        backgroundColor: '#131929',
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#1e2d45',
    },
    alertCard: {
        borderColor: '#ff3b3055',
    },
    cardTitle: {
        color: '#8a9bb0',
        fontSize: 12,
        fontWeight: 'bold',
        letterSpacing: 1,
        marginBottom: 12,
        textTransform: 'uppercase',
    },
    name: {
        color: '#ffffff',
        fontSize: 26,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    detail: {
        color: '#c0cfe0',
        fontSize: 15,
        marginBottom: 6,
    },
    highlight: {
        color: '#ff3b30',
        fontWeight: 'bold',
    },
    tag: {
        backgroundColor: '#ff3b3022',
        borderRadius: 8,
        padding: 10,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: '#ff3b3044',
    },
    tagText: {
        color: '#ff8a80',
        fontSize: 14,
    },
    contactRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#1e2d45',
    },
    callButton: {
        color: '#2563eb',
        fontWeight: 'bold',
        fontSize: 14,
    },
});