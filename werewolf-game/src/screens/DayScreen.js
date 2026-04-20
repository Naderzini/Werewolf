import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { COLORS } from '../constants/theme';
import PhaseBanner from '../components/PhaseBanner';
import GradientButton from '../components/GradientButton';
import PlayerAvatar from '../components/PlayerAvatar';
import { useGame } from '../context/GameContext';

const VIDEO_PLAYERS = [
  { id: 'p1', name: 'أحمد', emoji: '🧑', isSpeaking: true },
  { id: 'me', name: 'أنت', emoji: '😐', isMe: true },
  { id: 'p2', name: 'سارة', emoji: '👩' },
  { id: 'p4', name: 'لينا', emoji: '💀', isDead: true },
  { id: 'p5', name: 'يوسف', emoji: '🧑‍🦱' },
  { id: 'p3', name: 'كريم', emoji: '🧔' },
];

export default function DayScreen({ navigation }) {
  const { t } = useTranslation();
  const { state } = useGame();
  const [timeLeft, setTimeLeft] = useState(120);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 0) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (s) => {
    const min = Math.floor(s / 60);
    const sec = s % 60;
    return `${min}:${sec.toString().padStart(2, '0')}`;
  };

  return (
    <LinearGradient colors={['#050510', '#030308', COLORS.bg]} style={styles.container}>
      {/* Phase banner */}
      <PhaseBanner
        phase="day"
        label={`${t('day.title')} — ${t('day.dayNum')} ${state.dayNumber || 2}`}
        icon="☀️"
      />

      {/* Video grid */}
      <View style={styles.videoGrid}>
        {VIDEO_PLAYERS.map((player, index) => (
          <View
            key={player.id}
            style={[
              styles.videoCell,
              player.isSpeaking && styles.speaking,
              player.isMe && styles.meCell,
              player.isDead && styles.deadCell,
            ]}
          >
            <Text style={styles.videoEmoji}>{player.emoji}</Text>
            <Text style={[
              styles.videoName,
              player.isMe && { color: '#a78bfa' },
              player.isDead && { color: '#555' },
            ]}>
              {player.name}
            </Text>
            {player.isSpeaking && (
              <View style={styles.speakingIndicator}>
                <View style={styles.speakingBar} />
                <View style={[styles.speakingBar, { height: 8 }]} />
                <View style={styles.speakingBar} />
              </View>
            )}
          </View>
        ))}
      </View>

      {/* Timer */}
      <Text style={styles.timer}>{formatTime(timeLeft)}</Text>

      {/* Bottom controls */}
      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.controlBtn}>
          <Text style={styles.controlIcon}>🎙️</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.controlBtn}>
          <Text style={styles.controlIcon}>📹</Text>
        </TouchableOpacity>
        <GradientButton
          title={`🗳️ ${t('day.vote')}`}
          onPress={() => navigation.replace('Vote')}
          colors={['#d97706', '#b45309']}
          style={styles.voteBtn}
        />
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 50 },
  videoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    padding: 8,
    flex: 1,
  },
  videoCell: {
    width: '48%',
    aspectRatio: 4 / 3,
    borderRadius: 12,
    backgroundColor: '#111120',
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  speaking: {
    borderColor: COLORS.village,
    borderWidth: 2,
    shadowColor: COLORS.village,
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  meCell: {
    borderColor: '#7c3aed',
  },
  deadCell: {
    opacity: 0.3,
  },
  videoEmoji: { fontSize: 32 },
  videoName: {
    position: 'absolute',
    bottom: 4,
    right: 8,
    fontSize: 10,
    color: '#fff',
    fontWeight: '700',
  },
  speakingIndicator: {
    position: 'absolute',
    top: 6,
    left: 6,
    flexDirection: 'row',
    gap: 2,
    alignItems: 'flex-end',
  },
  speakingBar: {
    width: 3,
    height: 6,
    borderRadius: 1,
    backgroundColor: COLORS.village,
  },
  timer: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.moon,
    textAlign: 'center',
    marginVertical: 8,
  },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    paddingBottom: 30,
  },
  controlBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  controlIcon: { fontSize: 18 },
  voteBtn: { flex: 1, height: 44 },
});
