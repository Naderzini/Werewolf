import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { COLORS } from '../constants/theme';
import GradientButton from '../components/GradientButton';
import { useGame } from '../context/GameContext';

export default function JoinRoomScreen({ navigation, route }) {
  const { t } = useTranslation();
  const { mode, roomCode: initialCode } = route.params || {};
  const isCreate = mode === 'create';
  const { setPlayer, setRoom } = useGame();

  const [name, setName] = useState('');
  const [code, setCode] = useState(initialCode || '');

  const handleContinue = () => {
    if (!name.trim()) return;
    if (!isCreate && !code.trim()) return;

    const playerId = 'player_' + Date.now();
    setPlayer(playerId, name.trim());
    
    if (isCreate) {
      setRoom(code, code, true);
    } else {
      setRoom(code.trim(), code.trim(), false);
    }

    navigation.navigate('Lobby');
  };

  return (
    <LinearGradient colors={['#1a0a2e', '#0a0510', COLORS.bg]} style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.inner}>
        {/* Back button */}
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← {t('common.back')}</Text>
        </TouchableOpacity>

        <View style={styles.content}>
          <Text style={styles.emoji}>{isCreate ? '🎮' : '🔑'}</Text>
          <Text style={styles.title}>{isCreate ? t('home.createRoom') : t('home.joinRoom')}</Text>

          {/* Room code display (create) or input (join) */}
          {isCreate ? (
            <View style={styles.codeBox}>
              <Text style={styles.codeLabel}>{t('lobby.roomCode')}</Text>
              <Text style={styles.codeValue}>{code}</Text>
            </View>
          ) : (
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>{t('home.enterCode')}</Text>
              <TextInput
                style={styles.input}
                value={code}
                onChangeText={setCode}
                placeholder="WLF-XX"
                placeholderTextColor="#444"
                autoCapitalize="characters"
                textAlign="center"
              />
            </View>
          )}

          {/* Name input */}
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
            />
          </View>

          {/* Continue */}
          <GradientButton
            title={isCreate ? t('lobby.startGame') : t('home.join')}
            icon={isCreate ? '🚀' : '🔑'}
            onPress={handleContinue}
            colors={['#7c3aed', '#4f46e5']}
            style={styles.continueBtn}
            disabled={!name.trim() || (!isCreate && !code.trim())}
          />
        </View>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  inner: { flex: 1 },
  backBtn: {
    marginTop: 50,
    marginLeft: 20,
    alignSelf: 'flex-start',
  },
  backText: {
    color: COLORS.muted,
    fontSize: 14,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 30,
    gap: 20,
  },
  emoji: { fontSize: 50 },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: COLORS.text,
    marginBottom: 10,
  },
  codeBox: {
    backgroundColor: '#1e1e30',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#2a2a45',
    width: '100%',
    alignItems: 'center',
  },
  codeLabel: {
    fontSize: 11,
    color: COLORS.muted,
    marginBottom: 6,
  },
  codeValue: {
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: 6,
    color: COLORS.moon,
  },
  inputContainer: {
    width: '100%',
  },
  inputLabel: {
    fontSize: 12,
    color: COLORS.muted,
    marginBottom: 8,
    textAlign: 'center',
  },
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
  continueBtn: {
    width: 220,
    marginTop: 10,
  },
});
