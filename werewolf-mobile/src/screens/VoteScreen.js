import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { COLORS } from '../constants/theme';
import GradientButton from '../components/GradientButton';
import SkipPhaseButton from '../components/SkipPhaseButton';
import { useGame } from '../context/GameContext';
import { castVote as sendCastVote, onVoteUpdate } from '../services/socketService';

const EMOJIS = ['🧑', '👩', '🧔', '🧑‍🦱', '👨', '👱‍♀️'];

export default function VoteScreen({ navigation }) {
  const { t } = useTranslation();
  const { state } = useGame();
  const [selected, setSelected] = useState(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [votes, setVotes] = useState({});

  useEffect(() => {
    const off = onVoteUpdate(({ votes: v }) => setVotes(v || {}));
    return () => off?.();
  }, []);

  const alivePlayers = (state.players || []).filter((p) => !p.isDead && p.id !== state.playerId);

  const voteCounts = {};
  Object.values(votes).forEach((tid) => {
    if (tid) voteCounts[tid] = (voteCounts[tid] || 0) + 1;
  });
  const maxVotes = Math.max(0, ...Object.values(voteCounts));

  const candidates = alivePlayers.map((p, i) => ({
    id: p.id,
    name: p.name,
    emoji: EMOJIS[i % EMOJIS.length],
    votes: voteCounts[p.id] || 0,
  }));

  const handleVote = () => {
    if (!selected) return;
    sendCastVote(selected);
    setHasVoted(true);
  };

  return (
    <LinearGradient colors={['#1a1400', '#060500', COLORS.bg]} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <Text style={styles.headerIcon}>🗳️</Text>
          <Text style={styles.headerTitle}>{t('vote.title')}</Text>
          <Text style={styles.headerSub}>{t('vote.voteToEliminate')}</Text>
        </View>

        {/* Player vote cards */}
        <View style={styles.list}>
          {candidates.map((player) => {
            const isSelected = selected === player.id;
            const votePercent = maxVotes > 0 ? (player.votes / (maxVotes + 1)) * 100 : 0;

            return (
              <TouchableOpacity
                key={player.id}
                style={[styles.voteRow, isSelected && styles.selectedRow]}
                onPress={() => !hasVoted && setSelected(player.id)}
                disabled={hasVoted}
              >
                {/* Vote bar background */}
                <View style={[styles.voteBar, { width: `${votePercent}%` }]} />

                <View style={styles.rowContent}>
                  <Text style={styles.emoji}>{player.emoji}</Text>
                  <Text style={[styles.name, isSelected && { color: '#fbbf24' }]}>
                    {player.name}
                  </Text>
                  <View style={styles.voteCount}>
                    <Text style={styles.voteNum}>{player.votes + (isSelected && hasVoted ? 1 : 0)}</Text>
                    <Text style={styles.voteLabel}>{t('vote.votes')}</Text>
                  </View>
                  {isSelected && <Text style={styles.selectedIcon}>🗳️</Text>}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {!hasVoted ? (
          <GradientButton
            title={`🗳️ ${t('vote.confirmVote')}`}
            onPress={handleVote}
            colors={['#d97706', '#b45309']}
            style={styles.voteBtn}
            disabled={!selected}
          />
        ) : (
          <View style={styles.votedBox}>
            <Text style={styles.votedText}>✅ {t('vote.confirmVote')}</Text>
          </View>
        )}

        {/* Once voted, players can ready-up to resolve the vote immediately */}
        {hasVoted && (
          <View style={{ marginTop: 8 }}>
            <SkipPhaseButton label="End vote" />
          </View>
        )}
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 50 },
  scroll: { padding: 16, gap: 16 },
  header: { alignItems: 'center', gap: 4 },
  headerIcon: { fontSize: 40 },
  headerTitle: { fontSize: 24, fontWeight: '900', color: '#fbbf24' },
  headerSub: { fontSize: 12, color: COLORS.muted },
  timer: { fontSize: 20, fontWeight: '900', color: '#fbbf24', marginTop: 6 },
  list: { gap: 8 },
  voteRow: {
    borderRadius: 12,
    backgroundColor: '#1a1400',
    borderWidth: 1,
    borderColor: '#2a2200',
    overflow: 'hidden',
    position: 'relative',
  },
  selectedRow: {
    borderColor: '#d97706',
    borderWidth: 2,
  },
  voteBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    backgroundColor: 'rgba(217,119,6,0.1)',
    borderRadius: 12,
  },
  rowContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    zIndex: 1,
  },
  emoji: { fontSize: 24 },
  name: { flex: 1, fontSize: 14, fontWeight: '700', color: COLORS.text },
  voteCount: { alignItems: 'center' },
  voteNum: { fontSize: 18, fontWeight: '900', color: '#fbbf24' },
  voteLabel: { fontSize: 8, color: COLORS.muted },
  selectedIcon: { fontSize: 18 },
  voteBtn: { width: '100%' },
  votedBox: {
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(34,197,94,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(34,197,94,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  votedText: { color: '#4ade80', fontSize: 14, fontWeight: '700' },
});
