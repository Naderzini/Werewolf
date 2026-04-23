import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { COLORS } from '../constants/theme';
import PhaseBanner from '../components/PhaseBanner';
import SkipPhaseButton from '../components/SkipPhaseButton';
import { useGame } from '../context/GameContext';
import usePhaseTimer from '../hooks/usePhaseTimer';

const EMOJIS = ['🧑', '�', '🧔', '🧑‍🦱', '�', '👱‍♀️', '🧑‍🎓', '�‍🦰', '🧑‍�', '👨‍🦲', '🧔‍♂️', '👩‍�'];

export default function DayScreen({ navigation }) {
  const { t } = useTranslation();
  const { state } = useGame();

  const duration = state.phaseDuration || state.settings?.dayDuration || 120;
  // Visual countdown only — server emits phase_changed to Vote
  const { formatted } = usePhaseTimer(duration);

  const videoPlayers = (state.players || []).map((p, i) => ({
    ...p,
    emoji: p.isDead ? '💀' : EMOJIS[i % EMOJIS.length],
    isMe: p.id === state.playerId,
    isSpeaking: false,
  }));

  // Build recap from last night_results (events: killed_by_wolves | killed_by_witch | saved)
  const recap = (state.nightResults || []).filter((r) => r.event !== 'saved');
  const roleLabel = (r) => (r ? r.charAt(0).toUpperCase() + r.slice(1) : 'unknown');

  return (
    <LinearGradient colors={['#050510', '#030308', COLORS.bg]} style={styles.container}>
      {/* Phase banner */}
      <PhaseBanner
        phase="day"
        label={`${t('day.title')} — ${t('day.dayNum')} ${state.dayNumber || 2}`}
        icon="☀️"
      />

      {/* Night recap — who died last night */}
      <View style={styles.recapBox}>
        <Text style={styles.recapTitle}>🌙 Last night…</Text>
        {recap.length === 0 ? (
          <Text style={styles.recapPeace}>☀️ A peaceful night — nobody died.</Text>
        ) : (
          recap.map((r) => (
            <Text key={r.playerId} style={styles.recapLine}>
              💀 <Text style={styles.recapName}>{r.name}</Text> was{' '}
              {r.event === 'killed_by_witch' ? 'killed by the witch' : 'killed by the wolves'}.
              {r.role ? ` They were a ${roleLabel(r.role)}.` : ''}
            </Text>
          ))
        )}
      </View>

      {/* Video grid */}
      <View style={styles.videoGrid}>
        {videoPlayers.map((player, index) => (
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
      <Text style={styles.timer}>{formatted}</Text>

      {/* Bottom controls */}
      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.controlBtn}>
          <Text style={styles.controlIcon}>🎙️</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.controlBtn}>
          <Text style={styles.controlIcon}>📹</Text>
        </TouchableOpacity>
        <View style={styles.voteBtn}>
          <SkipPhaseButton label={`${t('day.vote')} 🗳️`} />
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 50 },
  recapBox: {
    marginHorizontal: 12,
    marginTop: 8,
    padding: 14,
    borderRadius: 14,
    backgroundColor: 'rgba(124,58,237,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(124,58,237,0.35)',
    gap: 6,
  },
  recapTitle: {
    color: '#c4b5fd',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  recapPeace: { color: '#fde68a', fontSize: 13, fontWeight: '600' },
  recapLine: { color: COLORS.text, fontSize: 13, lineHeight: 19 },
  recapName: { color: '#f87171', fontWeight: '800' },
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
