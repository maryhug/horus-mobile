import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '../contexts/ThemeContext';
import { useApi } from '../hooks/useApi';
import { apiClient, getErrorMessage } from '../services/api';
import { AppColors } from '../constants/colors';
import type { Contact, CreateContactPayload } from '../types/api';

function makeStyles(c: AppColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0a0f1e' },
    safeArea: { flex: 1, backgroundColor: '#0a0f1e' },
    content: { padding: 20, paddingTop: 20, paddingBottom: 40 },

    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 24,
    },
    backButton: { padding: 8 },
    backText: { color: '#2563eb', fontSize: 16 },
    alertBadge: {
      backgroundColor: '#ff3b30',
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 20,
    },
    alertBadgeText: { color: '#fff', fontWeight: 'bold', fontSize: 11, letterSpacing: 1 },

    card: {
      backgroundColor: '#131929',
      borderRadius: 16,
      padding: 20,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: '#1e2d45',
    },
    alertCard: { borderColor: '#ff3b3055' },
    cardTitle: {
      color: '#8a9bb0',
      fontSize: 12,
      fontWeight: 'bold',
      letterSpacing: 1,
      marginBottom: 12,
      textTransform: 'uppercase',
    },
    cardTitleRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    addBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: 'rgba(37,99,235,0.15)',
      borderRadius: 8,
      paddingHorizontal: 10,
      paddingVertical: 5,
    },
    addBtnText: { color: '#2563eb', fontSize: 12, fontWeight: '700' },

    name: { color: '#ffffff', fontSize: 26, fontWeight: 'bold', marginBottom: 8 },
    detail: { color: '#c0cfe0', fontSize: 15, marginBottom: 6 },
    highlight: { color: '#ff3b30', fontWeight: 'bold' },

    tag: {
      backgroundColor: '#ff3b3022',
      borderRadius: 8, padding: 10, marginBottom: 8,
      borderWidth: 1, borderColor: '#ff3b3044',
    },
    tagText: { color: '#ff8a80', fontSize: 14 },

    contactRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: '#1e2d45',
    },
    contactRowLast: { borderBottomWidth: 0 },
    contactInfo: { flex: 1 },
    contactName: { color: '#ffffff', fontSize: 15, fontWeight: '600', marginBottom: 2 },
    contactRelation: { color: '#8a9bb0', fontSize: 12 },
    contactPhone: { color: '#c0cfe0', fontSize: 13, marginTop: 1 },
    callBtn: {
      flexDirection: 'row', alignItems: 'center', gap: 5,
      backgroundColor: 'rgba(37,99,235,0.15)',
      borderRadius: 10, paddingHorizontal: 12, paddingVertical: 7,
    },
    callBtnText: { color: '#2563eb', fontWeight: 'bold', fontSize: 13 },

    emptyText: { color: '#8a9bb0', fontSize: 14, textAlign: 'center', paddingVertical: 8 },

    loadingWrap: { alignItems: 'center', paddingVertical: 20 },
    errorText: { color: '#ff8a80', fontSize: 13, textAlign: 'center', marginBottom: 10 },
    retryBtn: {
      alignSelf: 'center',
      backgroundColor: 'rgba(37,99,235,0.15)',
      borderRadius: 8, paddingHorizontal: 16, paddingVertical: 8,
    },
    retryBtnText: { color: '#2563eb', fontWeight: '700', fontSize: 13 },

    // Modal
    modalOverlay: {
      flex: 1, backgroundColor: 'rgba(0,0,0,0.7)',
      justifyContent: 'flex-end',
    },
    modalCard: {
      backgroundColor: '#131929',
      borderTopLeftRadius: 24, borderTopRightRadius: 24,
      padding: 24, paddingBottom: 40,
      borderTopWidth: 1, borderColor: '#1e2d45',
    },
    modalTitle: { fontSize: 18, fontWeight: '800', color: '#ffffff', marginBottom: 20 },
    fieldGroup: { marginBottom: 16 },
    fieldLabel: { fontSize: 13, color: '#8a9bb0', fontWeight: '500', marginBottom: 6 },
    fieldInput: {
      backgroundColor: '#0a0f1e',
      borderRadius: 12, borderWidth: 1, borderColor: '#1e2d45',
      paddingHorizontal: 14, paddingVertical: 12,
      color: '#ffffff', fontSize: 14,
    },
    modalActions: { flexDirection: 'row', gap: 12, marginTop: 8 },
    cancelBtn: {
      flex: 1, paddingVertical: 14, borderRadius: 14,
      borderWidth: 1.5, borderColor: '#1e2d45', alignItems: 'center',
    },
    cancelBtnText: { color: '#8a9bb0', fontWeight: '700', fontSize: 14 },
    saveBtn: {
      flex: 1, paddingVertical: 14, borderRadius: 14,
      backgroundColor: '#2563eb', alignItems: 'center',
    },
    saveBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 14 },
  });
}

export default function Emergency() {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const [addModalVisible, setAddModalVisible] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [newContact, setNewContact] = useState<CreateContactPayload>({ name: '', phone: '', relation: '' });

  const { data: contacts, loading, error, refetch } = useApi<Contact[]>(
    () => apiClient.get<Contact[]>('/contacts').then(r => r.data)
  );

  const handleCall = (phone: string) => {
    Linking.openURL(`tel:${phone}`).catch(() =>
      Alert.alert('Error', 'No se pudo abrir la aplicación de llamadas.')
    );
  };

  const handleAddContact = async () => {
    if (!newContact.name.trim() || !newContact.phone.trim()) {
      Alert.alert('Campos requeridos', 'El nombre y teléfono son obligatorios.');
      return;
    }
    setIsSaving(true);
    try {
      await apiClient.post('/contacts', newContact);
      setAddModalVisible(false);
      setNewContact({ name: '', phone: '', relation: '' });
      refetch();
    } catch (err) {
      Alert.alert('Error', getErrorMessage(err));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={refetch} tintColor="#2563eb" />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backText}>← Volver</Text>
          </TouchableOpacity>
          <View style={styles.alertBadge}>
            <Text style={styles.alertBadgeText}>🚨 EMERGENCIA</Text>
          </View>
        </View>

        {/* Patient Info — TODO: ajustar según la respuesta real de la API — conectar con perfil del usuario */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>👤 Paciente</Text>
          <Text style={styles.name}>Información del paciente</Text>
          <Text style={styles.detail}>🩸 Tipo de sangre: <Text style={styles.highlight}>Ver perfil</Text></Text>
          <Text style={styles.detail}>ℹ️ Datos médicos disponibles en el perfil</Text>
        </View>

        {/* Critical Alerts */}
        <View style={[styles.card, styles.alertCard]}>
          <Text style={styles.cardTitle}>⚠️ Alertas críticas</Text>
          <View style={styles.tag}>
            <Text style={styles.tagText}>🥜 Consultar perfil para alergias</Text>
          </View>
          <View style={styles.tag}>
            <Text style={styles.tagText}>💊 Consultar perfil para medicamentos</Text>
          </View>
        </View>

        {/* Emergency Contacts */}
        <View style={styles.card}>
          <View style={styles.cardTitleRow}>
            <Text style={styles.cardTitle}>📞 Contactos de emergencia</Text>
            <TouchableOpacity style={styles.addBtn} onPress={() => setAddModalVisible(true)}>
              <Ionicons name="add" size={14} color="#2563eb" />
              <Text style={styles.addBtnText}>Agregar</Text>
            </TouchableOpacity>
          </View>

          {loading && (
            <View style={styles.loadingWrap}>
              <ActivityIndicator color="#2563eb" />
            </View>
          )}

          {error && !loading && (
            <>
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity style={styles.retryBtn} onPress={refetch}>
                <Text style={styles.retryBtnText}>Reintentar</Text>
              </TouchableOpacity>
            </>
          )}

          {!loading && !error && (!contacts || contacts.length === 0) && (
            <Text style={styles.emptyText}>No hay contactos de emergencia registrados.</Text>
          )}

          {!loading && contacts && contacts.map((contact, i) => (
            <View
              key={contact.id}
              style={[styles.contactRow, i === contacts.length - 1 && styles.contactRowLast]}
            >
              <View style={styles.contactInfo}>
                <Text style={styles.contactName}>{contact.name}</Text>
                {contact.relation && (
                  <Text style={styles.contactRelation}>{contact.relation}</Text>
                )}
                <Text style={styles.contactPhone}>{contact.phone}</Text>
              </View>
              <TouchableOpacity style={styles.callBtn} onPress={() => handleCall(contact.phone)}>
                <Ionicons name="call" size={14} color="#2563eb" />
                <Text style={styles.callBtnText}>Llamar</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Add contact modal */}
      <Modal
        visible={addModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setAddModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Nuevo contacto</Text>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Nombre *</Text>
              <TextInput
                style={styles.fieldInput}
                value={newContact.name}
                onChangeText={v => setNewContact(p => ({ ...p, name: v }))}
                placeholder="Nombre completo"
                placeholderTextColor="#4a5568"
              />
            </View>
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Teléfono *</Text>
              <TextInput
                style={styles.fieldInput}
                value={newContact.phone}
                onChangeText={v => setNewContact(p => ({ ...p, phone: v }))}
                placeholder="+57 300 000 0000"
                placeholderTextColor="#4a5568"
                keyboardType="phone-pad"
              />
            </View>
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Relación</Text>
              <TextInput
                style={styles.fieldInput}
                value={newContact.relation}
                onChangeText={v => setNewContact(p => ({ ...p, relation: v }))}
                placeholder="Ej: Esposo/a, Médico, Familiar"
                placeholderTextColor="#4a5568"
              />
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setAddModalVisible(false)}>
                <Text style={styles.cancelBtnText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleAddContact} disabled={isSaving}>
                {isSaving
                  ? <ActivityIndicator color="#FFFFFF" size="small" />
                  : <Text style={styles.saveBtnText}>Guardar</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
