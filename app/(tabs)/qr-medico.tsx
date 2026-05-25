/**
 * qr-medico.tsx — ID Médico QR para Horus Mobile
 *
 * Genera un QR con la ficha médica completa del usuario.
 * - Sin internet para leerlo
 * - Sin app para escanearlo (cámara nativa)
 * - El QR abre una página HTML auto-contenida con toda la info
 * - Respeta PrivacySettings del usuario
 * - El usuario puede elegir qué datos incluir
 */

import React, { useMemo, useState, useCallback, useRef } from 'react';
import {
    View, Text, ScrollView, StyleSheet, TouchableOpacity,
    ActivityIndicator, Share, Dimensions, Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';
import * as MediaLibrary from 'expo-media-library';
import { captureRef } from 'react-native-view-shot';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { useApi } from '../../hooks/useApi';
import { apiClient } from '../../services/api';
import { AppColors } from '../../constants/colors';

const { width: SW } = Dimensions.get('window');
const H_PAD = 20;
const CARD_GAP = 12;
const QR_SIZE = SW - H_PAD * 2 - 48;

// TYPES

type ProfileData = {
    personalInfo?: {
        firstName: string;
        lastName: string;
        dateOfBirth?: string;
        gender?: string;
        bloodType?: string;
        identificationNumber?: string;
    };
    medicalProfile?: {
        heightCm?: number;
        weightKg?: number;
        organDonor?: boolean;
        insuranceProvider?: string;
        additionalNotes?: string;
    };
    allergies?: Array<{
        allergenName: string;
        allergyType: string;
        severity: string;
        reactionDescription?: string;
    }>;
    chronicConditions?: Array<{
        conditionName: string;
        severity?: string;
        status: string;
    }>;
    medications?: Array<{
        customMedicationName?: string;
        medication?: { genericName: string };
        dosage?: string;
        frequency?: string;
        route?: string;
    }>;
    emergencyContacts?: Array<{
        fullName: string;
        relationship: string;
        phonePrimary: string;
        phoneSecondary?: string;
    }>;
    privacySettings?: {
        showFullName?: boolean;
        showBloodType?: boolean;
        showMedications?: boolean;
        showAllergies?: boolean;
        showEmergencyContacts?: boolean;
        showMedicalHistory?: boolean;
        showAge?: boolean;
    };
};

type QrConfig = {
    includeBloodType: boolean;
    includeAllergies: boolean;
    includeMedications: boolean;
    includeConditions: boolean;
    includeContacts: boolean;
    includeMedicalNotes: boolean;
};

// HELPERS

function bloodTypeLabel(bt?: string): string {
    if (!bt) return '—';
    return bt.replace('_POSITIVE', '+').replace('_NEGATIVE', '-').replace('_', '');
}

function ageFromDob(dob?: string): string {
    if (!dob) return '';
    const age = Math.floor((Date.now() - new Date(dob).getTime()) / (365.25 * 24 * 3600 * 1000));
    return `${age} años`;
}

function severityColor(s: string): string {
    switch (s?.toUpperCase()) {
        case 'LIFE_THREATENING': return '#EF233C';
        case 'SEVERE':           return '#FF5722';
        case 'MODERATE':         return '#FF9800';
        default:                 return '#4CAF50';
    }
}

function severityLabel(s: string): string {
    switch (s?.toUpperCase()) {
        case 'LIFE_THREATENING': return '⚠️ Riesgo vital';
        case 'SEVERE':           return 'Severa';
        case 'MODERATE':         return 'Moderada';
        default:                 return 'Leve';
    }
}

/**
 * buildQrUrl — genera la URL pública de la ficha médica
 * El QR solo contiene la URL — liviano, siempre funciona
 */
function buildQrUrl(userId: string): string {
    const base = 'https://arla-roomiest-iconoclastically.ngrok-free.dev';
    return `${base}/emergency/${userId}`;
}

// STYLES

function makeStyles(c: AppColors) {
    return StyleSheet.create({
        container:    { flex: 1, backgroundColor: c.background },
        header: {
            flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
            paddingHorizontal: H_PAD, paddingVertical: 14,
            borderBottomWidth: 1, borderBottomColor: c.border,
            backgroundColor: c.surface,
        },
        headerBrand:  { flexDirection: 'row', alignItems: 'center', gap: 10 },
        brandIcon: {
            width: 40, height: 40, borderRadius: 12,
            backgroundColor: c.accent10, borderWidth: 1, borderColor: c.accent20,
            justifyContent: 'center', alignItems: 'center',
        },
        brandName:    { color: c.accent, fontSize: 14, fontWeight: '800', letterSpacing: 1.5, lineHeight: 17 },
        brandSub:     { color: c.textMuted, fontSize: 9, fontWeight: '600', letterSpacing: 2, lineHeight: 12 },
        headerActions:{ flexDirection: 'row', alignItems: 'center', gap: 8 },
        headerBtn: {
            width: 40, height: 40, borderRadius: 12,
            backgroundColor: c.surfaceElevated, borderWidth: 1, borderColor: c.border,
            justifyContent: 'center', alignItems: 'center',
        },
        scroll:       { paddingHorizontal: H_PAD, paddingBottom: 40 },
        titleSection: {
            flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
            paddingTop: 20, marginBottom: 20,
        },
        titleLeft:    { flex: 1 },
        pageTitle:    { fontSize: 30, fontWeight: '800', color: c.textPrimary, lineHeight: 36, marginBottom: 6 },
        pageTitleAccent: { color: c.accent },
        pageSubtitle: { fontSize: 13, color: c.textSecondary, lineHeight: 18 },
        statusPill: {
            flexDirection: 'row', alignItems: 'center',
            backgroundColor: c.accent10, borderRadius: 20,
            paddingHorizontal: 10, paddingVertical: 6, gap: 6, marginLeft: 12,
        },
        statusDot:    { width: 7, height: 7, borderRadius: 3.5, backgroundColor: c.accent },
        statusLabel:  { color: c.accent, fontSize: 11, fontWeight: '700' },

        // QR card
        qrCard: {
            backgroundColor: c.surface, borderRadius: 20,
            borderWidth: 1, borderColor: c.border,
            padding: 24, alignItems: 'center',
            marginBottom: CARD_GAP,
        },
        qrWrap: {
            backgroundColor: '#FFFFFF', borderRadius: 16,
            padding: 16, marginBottom: 16,
        },
        qrName:       { fontSize: 16, fontWeight: '700', color: c.textPrimary, marginBottom: 4 },
        qrMeta:       { fontSize: 13, color: c.textSecondary, textAlign: 'center' },
        qrBlood: {
            flexDirection: 'row', alignItems: 'center', gap: 6,
            backgroundColor: c.accent10, borderRadius: 20,
            paddingHorizontal: 12, paddingVertical: 5, marginTop: 8,
        },
        qrBloodText:  { fontSize: 14, fontWeight: '800', color: c.accent },

        // Botones de acción
        actionsRow:   { flexDirection: 'row', gap: CARD_GAP, marginBottom: CARD_GAP },
        actionBtn: {
            flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
            gap: 8, paddingVertical: 14, borderRadius: 14,
            backgroundColor: c.surfaceElevated, borderWidth: 1, borderColor: c.border,
        },
        actionBtnPrimary: { backgroundColor: c.accent, borderColor: c.accent },
        actionBtnText:    { fontSize: 14, fontWeight: '700', color: c.textPrimary },
        actionBtnTextPrimary: { color: '#FFFFFF' },

        // Config card
        card: {
            backgroundColor: c.surface, borderRadius: 18,
            borderWidth: 1, borderColor: c.border,
            marginBottom: CARD_GAP, overflow: 'hidden',
        },
        cardHead: {
            flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
            paddingHorizontal: 16, paddingVertical: 13,
            borderBottomWidth: 1, borderBottomColor: c.border,
        },
        cardHeadLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
        cardTitle:    { fontSize: 15, fontWeight: '700', color: c.textPrimary },
        toggleRow: {
            flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
            paddingHorizontal: 16, paddingVertical: 13,
            borderBottomWidth: 1, borderBottomColor: c.border,
        },
        toggleRowLast:  { borderBottomWidth: 0 },
        toggleLeft:     { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
        toggleIconWrap: {
            width: 32, height: 32, borderRadius: 9,
            justifyContent: 'center', alignItems: 'center',
        },
        toggleLabel:    { fontSize: 14, fontWeight: '600', color: c.textPrimary },
        toggleSub:      { fontSize: 11, color: c.textSecondary, marginTop: 2 },

        // Info card
        infoCard: {
            backgroundColor: c.accent10, borderRadius: 14,
            borderWidth: 1, borderColor: c.accent20,
            padding: 14, flexDirection: 'row', gap: 12,
            alignItems: 'flex-start', marginBottom: CARD_GAP,
        },
        infoText: { flex: 1, fontSize: 12, color: c.textSecondary, lineHeight: 18 },

        // Loading / error
        centered:     { alignItems: 'center', paddingVertical: 40, gap: 12 },
        errorText:    { fontSize: 14, color: c.textSecondary, textAlign: 'center' },
    });
}

// TOGGLE ROW

function ToggleRow({ icon, iconBg, iconColor, label, sub, value, onChange, last, styles, c }: {
    icon: React.ComponentProps<typeof Ionicons>['name'];
    iconBg: string; iconColor: string;
    label: string; sub: string;
    value: boolean; onChange: (v: boolean) => void;
    last?: boolean;
    styles: ReturnType<typeof makeStyles>;
    c: AppColors;
}) {
    return (
        <View style={[styles.toggleRow, last && styles.toggleRowLast]}>
            <View style={styles.toggleLeft}>
                <View style={[styles.toggleIconWrap, { backgroundColor: iconBg }]}>
                    <Ionicons name={icon} size={16} color={iconColor} />
                </View>
                <View>
                    <Text style={styles.toggleLabel}>{label}</Text>
                    <Text style={styles.toggleSub}>{sub}</Text>
                </View>
            </View>
            <Switch
                value={value}
                onValueChange={onChange}
                trackColor={{ false: c.border, true: c.accent20 }}
                thumbColor={value ? c.accent : c.textMuted}
            />
        </View>
    );
}

// SCREEN

export default function QrMedicoScreen() {
    const { colors, isDark, toggleTheme } = useTheme();
    const styles = useMemo(() => makeStyles(colors), [colors]);

    const qrRef = useRef<View>(null);

    const [saving, setSaving] = useState(false);
    const [cfg, setCfg] = useState<QrConfig>({
        includeBloodType:    true,
        includeAllergies:    true,
        includeMedications:  true,
        includeConditions:   true,
        includeContacts:     true,
        includeMedicalNotes: false,
    });

    const { data, loading, error, refetch } = useApi<ProfileData>(
        () => apiClient.get<ProfileData>('/profile/full').then(r => r.data)
    );

    const { user } = useAuth();

    const qrUrl = useMemo(() => {
        if (!user?.id) return null;
        return buildQrUrl(user.id);
    }, [user?.id]);

    const toggle = useCallback((key: keyof QrConfig) => {
        setCfg(prev => ({ ...prev, [key]: !prev[key] }));
    }, []);

    const handleShare = useCallback(async () => {
        if (!qrUrl) return;
        await Share.share({
            message: qrUrl,
            title: 'Mi ID Médico Horus',
        });
    }, [qrUrl]);

    const handleSave = useCallback(async () => {
        if (!qrRef.current || saving) return;
        setSaving(true);
        try {
            // Pedir permiso a la galería
            const { status } = await MediaLibrary.requestPermissionsAsync();
            if (status !== 'granted') {
                alert('Necesitamos permiso para guardar en tu galería.');
                setSaving(false);
                return;
            }
            // Capturar el QR como imagen PNG
            const uri = await captureRef(qrRef, {
                format: 'png',
                quality: 1,
                result: 'tmpfile',
            });
            // Guardar en galería
            const asset = await MediaLibrary.createAssetAsync(uri);
            await MediaLibrary.createAlbumAsync('Horus', asset, false);
            alert('✅ QR guardado en tu galería en el álbum "Horus"');
        } catch (e: any) {
            alert('Error al guardar: ' + e.message);
        } finally {
            setSaving(false);
        }
    }, [saving]);

    const p = data?.personalInfo;
    const name = p ? `${p.firstName} ${p.lastName}` : '';
    const blood = bloodTypeLabel(p?.bloodType);
    const age = ageFromDob(p?.dateOfBirth);

    return (
        <SafeAreaView style={styles.container}>
            {/* ── Header ── */}
            <View style={styles.header}>
                <View style={styles.headerBrand}>
                    <View style={styles.brandIcon}>
                        <Ionicons name="qr-code-outline" size={20} color={colors.accent} />
                    </View>
                    <View>
                        <Text style={styles.brandName}>ID MÉDICO</Text>
                        <Text style={styles.brandSub}>HORUS · QR</Text>
                    </View>
                </View>
                <View style={styles.headerActions}>
                    <TouchableOpacity style={styles.headerBtn} onPress={toggleTheme}>
                        <Ionicons name={isDark ? 'sunny-outline' : 'moon-outline'} size={18} color={colors.textSecondary} />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.headerBtn} onPress={refetch}>
                        <Ionicons name="refresh-outline" size={18} color={colors.textSecondary} />
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

                {/* ── Título ── */}
                <View style={styles.titleSection}>
                    <View style={styles.titleLeft}>
                        <Text style={styles.pageTitle}>
                            Mi <Text style={styles.pageTitleAccent}>ID Médico</Text>
                        </Text>
                        <Text style={styles.pageSubtitle}>
                            Escaneable sin internet ni app desde cualquier cámara
                        </Text>
                    </View>
                    <View style={styles.statusPill}>
                        <View style={styles.statusDot} />
                        <Text style={styles.statusLabel}>QR</Text>
                    </View>
                </View>

                {/* ── Info ── */}
                <View style={styles.infoCard}>
                    <Ionicons name="information-circle-outline" size={18} color={colors.accent} />
                    <Text style={styles.infoText}>
                        Muestra este QR en tu reloj como fondo de pantalla. Cualquier persona puede escanearlo con la cámara del teléfono para ver tu ficha médica, sin internet y sin instalar ninguna app.
                    </Text>
                </View>

                {/* ── QR ── */}
                {loading ? (
                    <View style={[styles.card, styles.centered]}>
                        <ActivityIndicator size="large" color={colors.accent} />
                        <Text style={styles.errorText}>Cargando tu perfil médico…</Text>
                    </View>
                ) : error ? (
                    <View style={[styles.card, styles.centered]}>
                        <Ionicons name="cloud-offline-outline" size={32} color={colors.textMuted} />
                        <Text style={styles.errorText}>{error}</Text>
                        <TouchableOpacity onPress={refetch}>
                            <Text style={{ color: colors.accent, fontWeight: '700', fontSize: 14 }}>Reintentar</Text>
                        </TouchableOpacity>
                    </View>
                ) : qrUrl ? (
                    <View style={styles.qrCard}>
                        <View style={styles.qrWrap} ref={qrRef} collapsable={false}>
                            <QRCode
                                value={qrUrl}
                                size={QR_SIZE}
                                color="#14151F"
                                backgroundColor="#FFFFFF"
                                ecl="M"
                            />
                        </View>
                        {name ? <Text style={styles.qrName}>{name}</Text> : null}
                        {age ? <Text style={styles.qrMeta}>{age}</Text> : null}
                        {blood !== '—' && (
                            <View style={styles.qrBlood}>
                                <Ionicons name="water" size={14} color={colors.accent} />
                                <Text style={styles.qrBloodText}>Tipo {blood}</Text>
                            </View>
                        )}
                    </View>
                ) : null}

                {/* ── Acciones ── */}
                {qrUrl && (
                    <View style={styles.actionsRow}>
                        <TouchableOpacity style={styles.actionBtn} onPress={handleShare}>
                            <Ionicons name="share-outline" size={18} color={colors.textPrimary} />
                            <Text style={styles.actionBtnText}>Compartir</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.actionBtn, styles.actionBtnPrimary, saving && { opacity: 0.7 }]}
                            onPress={handleSave}
                            disabled={saving}
                        >
                            {saving
                                ? <ActivityIndicator size="small" color="#FFF" />
                                : <Ionicons name="download-outline" size={18} color="#FFF" />
                            }
                            <Text style={styles.actionBtnTextPrimary}>{saving ? 'Guardando…' : 'Guardar'}</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {/* ── Configuración del QR ── */}
                <View style={styles.card}>
                    <View style={styles.cardHead}>
                        <View style={styles.cardHeadLeft}>
                            <Ionicons name="options-outline" size={16} color={colors.accent} />
                            <Text style={styles.cardTitle}>Datos incluidos en el QR</Text>
                        </View>
                    </View>
                    <ToggleRow
                        icon="water" iconBg="rgba(239,35,60,0.10)" iconColor={colors.accent}
                        label="Tipo de sangre" sub="Visible al escanear"
                        value={cfg.includeBloodType} onChange={() => toggle('includeBloodType')}
                        styles={styles} c={colors}
                    />
                    <ToggleRow
                        icon="warning" iconBg="rgba(255,87,34,0.10)" iconColor="#FF5722"
                        label="Alergias" sub="Incluye severidad y reacción"
                        value={cfg.includeAllergies} onChange={() => toggle('includeAllergies')}
                        styles={styles} c={colors}
                    />
                    <ToggleRow
                        icon="medical" iconBg="rgba(33,150,243,0.10)" iconColor="#2196F3"
                        label="Medicamentos" sub="Medicación actual"
                        value={cfg.includeMedications} onChange={() => toggle('includeMedications')}
                        styles={styles} c={colors}
                    />
                    <ToggleRow
                        icon="fitness" iconBg="rgba(76,175,80,0.10)" iconColor="#4CAF50"
                        label="Condiciones crónicas" sub="Solo condiciones activas"
                        value={cfg.includeConditions} onChange={() => toggle('includeConditions')}
                        styles={styles} c={colors}
                    />
                    <ToggleRow
                        icon="call" iconBg="rgba(255,167,38,0.10)" iconColor="#FFA726"
                        label="Contactos de emergencia" sub="Nombre y teléfono"
                        value={cfg.includeContacts} onChange={() => toggle('includeContacts')}
                        styles={styles} c={colors}
                    />
                    <ToggleRow
                        icon="document-text" iconBg={colors.surfaceElevated} iconColor={colors.textMuted}
                        label="Notas médicas" sub="Información adicional del perfil"
                        value={cfg.includeMedicalNotes} onChange={() => toggle('includeMedicalNotes')}
                        last styles={styles} c={colors}
                    />
                </View>

                {/* ── Instrucciones reloj ── */}
                <View style={styles.card}>
                    <View style={styles.cardHead}>
                        <View style={styles.cardHeadLeft}>
                            <Ionicons name="watch-outline" size={16} color={colors.accent} />
                            <Text style={styles.cardTitle}>Cómo ponerlo en tu reloj</Text>
                        </View>
                    </View>
                    {[
                        { n: '1', icon: 'download-outline',      text: 'Toca "Guardar" para descargar el QR como imagen a tu galería' },
                        { n: '2', icon: 'watch-outline',          text: 'En tu Redmi Watch: Ajustes → Carátula → Foto personal → selecciona la imagen del QR' },
                        { n: '3', icon: 'scan-outline',           text: 'Cualquier persona puede escanearlo con la cámara nativa de cualquier teléfono' },
                        { n: '4', icon: 'globe-outline',          text: 'Se abre automáticamente tu ficha médica en el navegador, sin internet ni app' },
                    ].map((step, i, arr) => (
                        <View key={i} style={[styles.toggleRow, i === arr.length - 1 && styles.toggleRowLast]}>
                            <View style={styles.toggleLeft}>
                                <View style={[styles.toggleIconWrap, { backgroundColor: colors.accent10 }]}>
                                    <Text style={{ fontSize: 12, fontWeight: '800', color: colors.accent }}>{step.n}</Text>
                                </View>
                                <Text style={[styles.toggleLabel, { fontSize: 13, fontWeight: '500', flex: 1, flexWrap: 'wrap' }]}>
                                    {step.text}
                                </Text>
                            </View>
                        </View>
                    ))}
                </View>

            </ScrollView>
        </SafeAreaView>
    );
}