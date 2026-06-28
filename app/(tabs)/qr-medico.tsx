import React, { useRef, useState, useCallback } from 'react';
import type { ComponentProps } from 'react';
import { useFocusEffect } from 'expo-router';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  Share, Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';

type IoniconsName = ComponentProps<typeof Ionicons>['name'];

type ToggleItem = {
  key:     string;
  label:   string;
  desc:    string;
  icon:    IoniconsName;
  enabled: boolean;
};
import { useAuth } from '../../contexts/AuthContext';
import { apiClient } from '../../services/api';
import { FONT } from '../../constants/fonts';
import { useAppTheme } from '../../hooks/useAppTheme';
import { useLanguage } from '../../contexts/LanguageContext';

// ── Foreground colors (do not change between themes) ──────────────────────
const YELLOW_FG = '#3D2C00';
const BLUE_FG   = '#1A3A5C';
const PINK_FG   = '#7A1A3A';

// ── Privacy toggles ────────────────────────────────────────────────────────
const INITIAL_TOGGLES: ToggleItem[] = [
  { key: 'blood',      label: 'Tipo de sangre',         desc: 'O+',                    icon: 'water-outline',         enabled: true  },
  { key: 'allergies',  label: 'Alergias',                desc: 'Severidad y reacción',  icon: 'fitness-outline',       enabled: true  },
  { key: 'meds',       label: 'Medicamentos actuales',   desc: 'Dosis y frecuencia',    icon: 'medical-outline',       enabled: true  },
  { key: 'conditions', label: 'Condiciones crónicas',    desc: 'Solo activas',          icon: 'heart-outline',         enabled: true  },
  { key: 'contacts',   label: 'Contactos de emergencia', desc: 'Nombre y teléfono',     icon: 'call-outline',          enabled: true  },
  { key: 'notes',      label: 'Notas médicas',           desc: 'Información adicional', icon: 'document-text-outline', enabled: false },
];

// ── Custom toggle ──────────────────────────────────────────────────────────
function Toggle({ value, onToggle, green, mutedBg }: { value: boolean; onToggle: () => void; green: string; mutedBg: string }) {
  const anim = useRef(new Animated.Value(value ? 1 : 0)).current;

  // Sync thumb position when value changes externally (API load, parent state update)
  React.useEffect(() => {
    Animated.timing(anim, { toValue: value ? 1 : 0, duration: 180, useNativeDriver: true }).start();
  }, [value]);

  const toggle = () => {
    Animated.timing(anim, {
      toValue: value ? 0 : 1, duration: 180, useNativeDriver: true,
    }).start();
    onToggle();
  };
  const translateX = anim.interpolate({ inputRange: [0, 1], outputRange: [2, 20] });
  return (
    <TouchableOpacity
      onPress={toggle} activeOpacity={0.85}
      style={[ts.track, { backgroundColor: value ? green : mutedBg }]}
    >
      <Animated.View style={[ts.thumb, { transform: [{ translateX }] }]} />
    </TouchableOpacity>
  );
}
const ts = StyleSheet.create({
  track: { width: 44, height: 24, borderRadius: 12, justifyContent: 'center' },
  thumb: {
    width: 20, height: 20, borderRadius: 10, backgroundColor: '#FFFFFF',
    shadowColor: '#000', shadowOpacity: 0.18,
    shadowOffset: { width: 0, height: 1 }, shadowRadius: 2, elevation: 2,
  },
});

export default function QrMedicoScreen() {
  const { BG, CARD, PRIMARY, MUTED, MUTED_BG, GREEN, YELLOW, BLUE, PINK, isDark } = useAppTheme();
  const s = React.useMemo(() => makeStyles(BG, CARD, PRIMARY, MUTED, MUTED_BG, GREEN, YELLOW, BLUE, PINK), [isDark]);

  const { user } = useAuth();
  const { t } = useLanguage();
  const [toggles,      setToggles]      = useState(INITIAL_TOGGLES);
  const [open,         setOpen]         = useState(false);
  const [saved,        setSaved]        = useState(false);
  const [privacySaved, setPrivacySaved] = useState(false);

  // Edad y tipo de sangre desde API
  const [ageLabel,   setAgeLabel]   = useState<string>('—');
  const [bloodType,  setBloodType]  = useState<string>('—');

  // Mapa toggle key → campo de privacidad en la API
  const PRIVACY_KEY_MAP: Record<string, string> = {
    blood:      'showBloodType',
    allergies:  'showAllergies',
    meds:       'showMedications',
    conditions: 'showChronicConditions',
    contacts:   'showEmergencyContacts',
    notes:      'showMedicalHistory',
  };

  useFocusEffect(
    useCallback(() => {
      apiClient.get<{
        personalInfo?: {
          dateOfBirth?: string;
          bloodType?: string;
        };
        privacySettings?: {
          showBloodType?: boolean;
          showAllergies?: boolean;
          showMedications?: boolean;
          showChronicConditions?: boolean;
          showEmergencyContacts?: boolean;
          showMedicalHistory?: boolean;
        };
      }>('/profile/full')
        .then(r => {
          const dob = r.data.personalInfo?.dateOfBirth;
          if (dob) {
            const today = new Date();
            const d     = new Date(dob + 'T00:00:00');
            let age = today.getFullYear() - d.getFullYear();
            if (
              today.getMonth() < d.getMonth() ||
              (today.getMonth() === d.getMonth() && today.getDate() < d.getDate())
            ) age -= 1;
            setAgeLabel(`${age} ${t.qrAge}`);
          }
          const bt = r.data.personalInfo?.bloodType;
          if (bt) {
            const labels: Record<string, string> = {
              A_POSITIVE: 'A+',  A_NEGATIVE: 'A-',
              B_POSITIVE: 'B+',  B_NEGATIVE: 'B-',
              AB_POSITIVE: 'AB+',AB_NEGATIVE: 'AB-',
              O_POSITIVE: 'O+',  O_NEGATIVE: 'O-',
            };
            setBloodType(labels[bt] ?? bt);
          }
          if (r.data.privacySettings) {
            const priv = r.data.privacySettings;
            setToggles(prev => prev.map(item => {
              const apiField = PRIVACY_KEY_MAP[item.key];
              if (!apiField) return item;
              const val = priv[apiField as keyof typeof priv];
              return val !== undefined ? { ...item, enabled: val } : item;
            }));
          }
        })
        .catch(() => {});
    }, [])
  );

  // Animation values
  const slideAnim  = useRef(new Animated.Value(0)).current;
  const arrowAnim  = useRef(new Animated.Value(0)).current;

  const fullName    = user ? `${user.firstName} ${user.lastName}` : '—';
  const emergencyUrl = `https://horus-emergency-2eum.vercel.app/emergency/${user?.id ?? 'demo'}`;

  const flip = (key: string) => {
    setToggles(prev => {
      const next = prev.map(item => item.key === key ? { ...item, enabled: !item.enabled } : item);
      const changed = next.find(item => item.key === key);
      if (changed) {
        const apiField = PRIVACY_KEY_MAP[key];
        if (apiField) {
          apiClient.put('/profile/privacy', { [apiField]: changed.enabled })
            .then(() => {
              setPrivacySaved(true);
              setTimeout(() => setPrivacySaved(false), 1500);
            })
            .catch((err) => {
              console.error('[Privacy] PUT error:', err?.response?.data ?? err?.message);
            });
        }
      }
      return next;
    });
  };

  const handleToggleQR = () => {
    const next = !open;
    setOpen(next);
    Animated.parallel([
      Animated.spring(slideAnim, {
        toValue: next ? 1 : 0,
        useNativeDriver: true,
        tension: 65, friction: 10,
      }),
      Animated.timing(arrowAnim, {
        toValue: next ? 1 : 0,
        duration: 280, useNativeDriver: true,
      }),
    ]).start();
  };

  const handleShare = async () => {
    try { await Share.share({ message: `Mi ID Médico Horus: ${emergencyUrl}`, url: emergencyUrl }); }
    catch {}
  };

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 1800);
  };

  // Derived animated styles
  const qrTranslateY = slideAnim.interpolate({ inputRange: [0, 1], outputRange: [-30, 0] });
  const qrOpacity    = slideAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 1] });
  const arrowRotate  = arrowAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] });

  return (
    <SafeAreaView style={s.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.scroll}
      >
        {/* ── Header ──────────────────────────────────────────────────── */}
        <View style={{ gap: 2 }}>
          <Text style={s.title}>{t.qrTitle}</Text>
          <Text style={s.subtitle}>{t.qrSubtitle}</Text>
        </View>

        {/* ── QR Card ──────────────────────────────────────────────────── */}
        <View style={s.card}>

          {/* QR expandido — nombre, QR, botones */}
          {open && (
            <Animated.View style={[s.qrAnimWrap, { opacity: qrOpacity, transform: [{ translateY: qrTranslateY }] }]}>
              <Text style={s.userName}>{fullName}</Text>
              <View style={s.metaRow}>
                <Text style={s.metaAge}>{ageLabel}</Text>
                <View style={s.dot} />
                <View style={s.bloodBadge}>
                  <Text style={s.bloodText}>{bloodType}</Text>
                </View>
              </View>
              <View style={s.qrBox}>
                <QRCode value={emergencyUrl} size={180} color="#1A1512" backgroundColor="#FFFFFF" />
              </View>
              <View style={s.btnRow}>
                <TouchableOpacity style={s.btnDark} onPress={handleShare} activeOpacity={0.85}>
                  <Ionicons name="share-outline" size={17} color="#FFFFFF" />
                  <Text style={s.btnDarkText}>{t.qrShare}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={s.btnYellow} onPress={handleSave} activeOpacity={0.85}>
                  <Ionicons name={saved ? 'checkmark' : 'arrow-down-circle-outline'} size={17} color={YELLOW_FG} />
                  <Text style={s.btnYellowText}>{saved ? t.qrSaved : t.qrSaveBtn}</Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
          )}

          <TouchableOpacity style={[s.toggleRow, { marginTop: open ? 20 : 0 }]} onPress={handleToggleQR} activeOpacity={0.75}>
            <Text style={s.generateLabel}>{open ? t.qrCompress : t.qrGenerate}</Text>
            <View style={s.cornerArrow}>
              <Animated.View style={{ transform: [{ rotate: arrowRotate }] }}>
                <Ionicons name="chevron-down" size={16} color={MUTED} />
              </Animated.View>
            </View>
          </TouchableOpacity>

        </View>

        {/* ── Privacy toggles ─────────────────────────────────────────── */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text style={s.sectionTitle}>{t.qrPrivacyTitle}</Text>
          {privacySaved && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Ionicons name="checkmark-circle" size={14} color={GREEN} />
              <Text style={{ fontSize: 12, color: GREEN, fontFamily: FONT.sansMedium }}>Guardado</Text>
            </View>
          )}
        </View>
        <View style={{ gap: 8 }}>
          {toggles.map(item => {
            const labelMap: Record<string,string> = {
              blood: t.qrBlood, allergies: t.qrAllergies, meds: t.qrMeds,
              conditions: t.qrConditions, contacts: t.qrContacts, notes: t.qrNotes,
            };
            const descMap: Record<string,string> = {
              blood: '', allergies: t.qrAllergiesDesc, meds: t.qrMedsDesc,
              conditions: t.qrConditionsDesc, contacts: t.qrContactsDesc, notes: t.qrNotesDesc,
            };
            return (
              <View key={item.key} style={s.toggleCard}>
                <View style={s.toggleIcon}>
                  <Ionicons name={item.icon} size={18} color={PRIMARY} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.toggleLabel}>{labelMap[item.key] ?? item.label}</Text>
                  <Text style={s.toggleDesc}>{descMap[item.key] ?? item.desc}</Text>
                </View>
                <Toggle value={item.enabled} onToggle={() => flip(item.key)} green={GREEN} mutedBg={MUTED_BG} />
              </View>
            );
          })}
        </View>

        {/* ── Watch instructions ───────────────────────────────────────── */}
        <View style={s.watchCard}>
          <View style={s.watchHeader}>
            <Ionicons name="watch-outline" size={18} color={BLUE_FG} />
            <Text style={s.watchTitle}>{t.qrWatchTitle}</Text>
          </View>
          <View style={{ gap: 12, marginTop: 16 }}>
            {[t.qrWatchStep1, t.qrWatchStep2, t.qrWatchStep3, t.qrWatchStep4].map((step, i) => (
              <View key={i} style={s.step}>
                <View style={s.stepNum}>
                  <Text style={s.stepNumText}>{i + 1}</Text>
                </View>
                <Text style={s.stepText}>{step}</Text>
              </View>
            ))}
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

function makeStyles(
  BG: string, CARD: string, PRIMARY: string, MUTED: string, MUTED_BG: string,
  GREEN: string, YELLOW: string, BLUE: string, PINK: string,
) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: BG },
    scroll:    { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 120, gap: 16 },

    title:    { fontSize: 26, fontFamily: FONT.displayBold, color: PRIMARY, letterSpacing: -0.5 },
    subtitle: { fontSize: 14, color: MUTED, fontFamily: FONT.sansMedium },

    // QR card
    card: {
      backgroundColor: CARD, borderRadius: 20,
      paddingHorizontal: 20, paddingTop: 14, paddingBottom: 12,
      alignItems: 'center',
      shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
    },
    userName: { fontSize: 20, fontWeight: '800', color: PRIMARY, letterSpacing: -0.3 },
    metaRow:  { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 6, marginBottom: 4 },
    metaAge:  { fontSize: 13, color: MUTED },
    dot:      { width: 4, height: 4, borderRadius: 2, backgroundColor: MUTED + '80' },
    bloodBadge: {
      backgroundColor: PINK, borderRadius: 999,
      paddingHorizontal: 10, paddingVertical: 2,
    },
    bloodText: { fontSize: 13, fontWeight: '700', color: PINK_FG },

    // QR slide section
    qrAnimWrap: { width: '100%', alignItems: 'center', marginTop: 16 },
    qrBox: {
      backgroundColor: '#FFFFFF', borderRadius: 20, padding: 20,
      shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.06, shadowRadius: 6, elevation: 1,
    },
    btnRow: { flexDirection: 'row', gap: 12, marginTop: 20, width: '100%' },
    btnDark: {
      flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
      gap: 8, backgroundColor: '#1A1512', borderRadius: 18, paddingVertical: 14,
    },
    btnDarkText:   { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
    btnYellow: {
      flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
      gap: 8, backgroundColor: YELLOW, borderRadius: 18, paddingVertical: 14,
    },
    btnYellowText: { color: YELLOW_FG, fontSize: 14, fontWeight: '700' },

    toggleRow: {
      flexDirection: 'row', alignItems: 'center',
      justifyContent: 'space-between',
      width: '100%',
    },
    generateLabel: {
      fontSize: 14, fontWeight: '600', color: MUTED,
    },
    cornerArrow: {
      width: 28, height: 28, borderRadius: 14,
      backgroundColor: MUTED_BG,
      alignItems: 'center', justifyContent: 'center',
    },

    // Section title
    sectionTitle: { fontSize: 17, fontWeight: '700', color: PRIMARY, letterSpacing: -0.3 },

    // Toggle rows
    toggleCard: {
      flexDirection: 'row', alignItems: 'center', gap: 12,
      backgroundColor: CARD, borderRadius: 20, padding: 14,
      shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.04, shadowRadius: 6, elevation: 1,
    },
    toggleIcon: {
      width: 36, height: 36, borderRadius: 12,
      backgroundColor: MUTED_BG,
      alignItems: 'center', justifyContent: 'center',
    },
    toggleLabel: { fontSize: 14, fontWeight: '700', color: PRIMARY },
    toggleDesc:  { fontSize: 12, color: MUTED, marginTop: 1 },

    // Watch card
    watchCard: {
      backgroundColor: BLUE, borderRadius: 28, padding: 20,
      shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
    },
    watchHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    watchTitle:  { fontSize: 15, fontWeight: '700', color: BLUE_FG },
    step:        { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
    stepNum: {
      width: 24, height: 24, borderRadius: 12,
      backgroundColor: BLUE_FG,
      alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    },
    stepNumText: { fontSize: 12, fontWeight: '700', color: BLUE },
    stepText:    { flex: 1, fontSize: 13, fontWeight: '500', color: BLUE_FG, lineHeight: 19 },
  });
}
