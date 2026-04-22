import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { COLORS } from '../constants/theme';
import { ROLES } from '../constants/roles';
import PhaseBanner from '../components/PhaseBanner';
import PlayerAvatar from '../components/PlayerAvatar';
import { useGame } from '../context/GameContext';

const VOICE_PLAYERS = [
  { id: 'p1', name: 'أحمد', isSpeaking: true },
  { id: 'p2', name: 'سارة', isSpeaking: false },
  { id: 'p3', name: 'كريم', isSpeaking: false },
  { id: 'p4', name: 'لينا', isDead: true },
  { id: 'p5', name: 'يوسف', isSpeaking: false },
  { id: 'me', name: 'أنت', isMe: true },
];

export default function NightScreen({ navigation }) {
  const { t } = useTranslation();
  const { state, setTimer } = useGame();
  const [timeLeft, setTimeLeft] = useState(60);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 0) {
          clearInterval(interval);
          navigateToRoleAction();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const navigateToRoleAction = () => {
    const role = state.myRole;
    switch (role) {
      case ROLES.WOLF:
        navigation.replace('WolfAction');
        break;
      case ROLES.SEER:
        navigation.replace('SeerAction');
        break;
      case ROLES.WITCH:
        navigation.replace('WitchAction');
        break;
      case ROLES.DOCTOR:
        navigation.replace('DoctorAction');
        break;
      default:
        // Villager and Hunter just wait
        setTimeout(() => navigation.replace('Day'), 3000);
        break;
    }
  };

  const formatTime = (s) => {
    const min = Math.floor(s / 60);
    const sec = s % 60;
    return `${min}:${sec.toString().padStart(2, '0')}`;
  };

  return (
    <LinearGradient
      colors={['#0a0a1f', '#030308', COLORS.bg]}
      style={styles.container}
    >
      <PhaseBanner phase="night" label={t('night.title')} icon="🌙" />

      {/* Timer */}
      <Text style={styles.timer}>{formatTime(timeLeft)}</Text>
      <Text style={styles.voiceLabel}>{t('night.voiceOnly')}</Text>

      {/* Voice grid */}
      <View style={styles.voiceGrid}>
        {VOICE_PLAYERS.map((player, index) => (
          <View key={player.id} style={styles.voiceCell}>
            <View style={[
              styles.voiceAvatar,
              player.isSpeaking && styles.speaking,
              player.isMe && styles.meAvatar,
              player.isDead && { opacity: 0.3 },
            ]}>
              <PlayerAvatar
                name={player.name}
                index={index}
                size={52}
                isDead={player.isDead}
                isSpeaking={player.isSpeaking}
                speakColor={COLORS.village}
              />
            </View>
            <Text style={[
              styles.voiceName,
              player.isSpeaking && { color: COLORS.village },
              player.isMe && { color: '#a78bfa' },
              player.isDead && { color: '#444' },
            ]}>
              {player.name}
            </Text>
            {player.isSpeaking && <Text style={styles.speakingDot}>●</Text>}
          </View>
        ))}
      </View>

      {/* Action button - skip to role action */}
      <TouchableOpacity style={styles.skipBtn} onPress={navigateToRoleAction}>
        <Text style={styles.skipText}>⏭️ {state.myRole ? t('common.confirm') : t('night.title')}</Text>
      </TouchableOpacity>

      {/* Mute toggle */}
      <View style={styles.controls}>
        <TouchableOpacity style={styles.controlBtn}>
          <Text style={styles.controlIcon}>{state.isMuted ? '🔇' : '🎙️'}</Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 50 },
  timer: {
    fontSize: 48,
    fontWeight: '900',
    color: COLORS.moon,
    textAlign: 'center',
    marginVertical: 8,
  },
  voiceLabel: {
    fontSize: 11,
    color: COLORS.muted,
    textAlign: 'center',
    marginBottom: 20,
  },
  voiceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 16,
    paddingHorizontal: 20,
  },
  voiceCell: {
    alignItems: 'center',
    gap: 4,
    width: 80,
  },
  voiceAvatar: {
    borderWidth: 2,
    borderColor: COLORS.border,
    borderRadius: 30,
  },
  speaking: {
    borderColor: COLORS.village,
    shadowColor: COLORS.village,
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 5,
  },
  meAvatar: {
    borderColor: '#7c3aed',
  },
  voiceName: {
    fontSize: 10,
    color: COLORS.muted,
    fontWeight: '600',
  },
  speakingDot: {
    fontSize: 8,
    color: COLORS.village,
  },
  skipBtn: {
    marginTop: 30,
    alignSelf: 'center',
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 20,
    paddingHorizontal: 24,
    paddingVertical: 10,
  },
  skipText: {
    color: COLORS.muted,
    fontSize: 13,
  },
  controls: {
    position: 'absolute',
    bottom: 40,
    alignSelf: 'center',
    flexDirection: 'row',
    gap: 16,
  },
  controlBtn: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  controlIcon: {
    fontSize: 22,
  },
});
