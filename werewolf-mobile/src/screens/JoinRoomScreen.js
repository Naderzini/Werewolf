import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { COLORS } from '../constants/theme';
import GradientButton from '../components/GradientButton';
import { useGame } from '../context/GameContext';
import {
  connectSocket,
  createRoom as socketCreateRoom,
  joinRoom as socketJoinRoom,
} from '../services/socketService';

export default function JoinRoomScreen({ navigation, route }) {
  const { t } = useTranslation();
  const { mode } = route.params || {};
  const isCreate = mode === 'create';
  const { setPlayer, setRoom, updateRoom } = useGame();

  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);

  // Accept "WLF-123", "wlf123", "123 ", etc. and normalize to backend format.
  const normalizeCode = (raw) => {
    const cleaned = (raw || '').toUpperCase().replace(/\s+/g, '').trim();
    if (!cleaned) return '';
    // If user typed digits only, auto-prefix with "WLF-"
    if (/^\d+$/.test(cleaned)) return `WLF-${cleaned}`;
    // If user typed "WLF123", insert the hyphen
    if (/^WLF\d+$/.test(cleaned)) return `WLF-${cleaned.slice(3)}`;
    return cleaned;
  };

  const handleContinue = async () => {
    if (!name.trim()) return;
    const normalized = normalizeCode(code);
    if (!isCreate && !normalized) return;
    setLoading(true);
    try {
      await connectSocket();
      const response = isCreate
        ? await socketCreateRoom(name.trim())
        : await socketJoinRoom(normalized, name.trim());

      const { room, playerId } = response;
      setPlayer(playerId, name.trim());
      setRoom(room.code, room.code, room.hostId === playerId);
      updateRoom(room);
      navigation.replace('Lobby');
    } catch (err) {
      const msg = err?.message || 'Unknown error';
      const friendly = {
        ROOM_NOT_FOUND: 'Room not found. Check the code.',
        ROOM_FULL: 'This room is full (max 12).',
        GAME_ALREADY_STARTED: 'Game already started.',
        NOT_CONNECTED: 'Cannot reach the server. Check your connection.',
        TIMEOUT: 'Server did not respond. Try again.',
      }[msg] || msg;
      Alert.alert('Error', friendly);
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={['#1a0a2e', '#0a0510', COLORS.bg]} style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.inner}
      >
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← {t('common.back')}</Text>
        </TouchableOpacity>

        <View style={styles.content}>
          <Text style={styles.emoji}>{isCreate ? '🎮' : '🔑'}</Text>
          <Text style={styles.title}>
            {isCreate ? t('home.createRoom') : t('home.joinRoom')}
          </Text>

          {isCreate ? (
            <View style={styles.infoBox}>
              <Text style={styles.infoText}>
                {t('home.createRoomInfo') ||
                  'A unique room code will be generated when you continue.'}
              </Text>
            </View>
          ) : (
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>{t('home.enterCode')}</Text>
              <TextInput
                style={styles.input}
                value={code}
                onChangeText={setCode}
                placeholder="WLF-XXX"
                placeholderTextColor="#444"
                autoCapitalize="characters"
                textAlign="center"
                maxLength={10}
              />
            </View>
          )}

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>{t('home.enterName')}</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="..."
              placeholderTextColor="#444"
              textAlign="center"
              maxLength={20}
              editable={!loading}
            />
          </View>

          <GradientButton
            title={isCreate ? t('home.createRoom') : t('home.join')}
            icon={isCreate ? '🚀' : '🔑'}
            onPress={handleContinue}
            colors={['#7c3aed', '#4f46e5']}
            style={styles.continueBtn}
            disabled={loading || !name.trim() || (!isCreate && !normalizeCode(code))}
          />
          {loading && (
            <ActivityIndicator size="small" color={COLORS.moon} style={{ marginTop: 10 }} />
          )}
        </View>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  inner: { flex: 1 },
  backBtn: { marginTop: 50, marginLeft: 20, alignSelf: 'flex-start' },
  backText: { color: COLORS.muted, fontSize: 14 },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 30,
    gap: 20,
  },
  emoji: { fontSize: 50 },
  title: { fontSize: 28, fontWeight: '900', color: COLORS.text, marginBottom: 10 },
  infoBox: {
    backgroundColor: '#1e1e30',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#2a2a45',
    width: '100%',
    alignItems: 'center',
  },
  infoText: {
    fontSize: 12,
    color: COLORS.muted,
    textAlign: 'center',
    lineHeight: 18,
  },
  inputContainer: { width: '100%' },
  inputLabel: { fontSize: 12, color: COLORS.muted, marginBottom: 8, textAlign: 'center' },
  input: {
    backgroundColor: '#1e1e30',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#2a2a45',
    color: COLORS.text,
    fontSize: 18,
    fontWeight: '700',
  },
  continueBtn: { width: 220, marginTop: 10 },
});
