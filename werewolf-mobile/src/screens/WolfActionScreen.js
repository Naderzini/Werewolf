import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { COLORS } from '../constants/theme';
import { ROLES } from '../constants/roles';
import PhaseBanner from '../components/PhaseBanner';
import GradientButton from '../components/GradientButton';
import { useGame } from '../context/GameContext';
import { getActionPlayers } from '../utils/players';
import { sendWolfVote } from '../services/socketService';

export default function WolfActionScreen({ navigation }) {
  const { t } = useTranslation();
  const { state, wolfVote } = useGame();
  const [selectedVictim, setSelectedVictim] = useState(null);
  const [confirmed, setConfirmed] = useState(false);

  // Exclude self; wolves can target any non-wolf alive player
  const players = getActionPlayers(state.players, state.playerId, {
    includeSelf: false,
    extraFilter: (p) => p.role !== 'wolf',
  });

  const handleConfirmKill = () => {
    if (!selectedVictim || confirmed) return;
    sendWolfVote(selectedVictim);
    wolfVote(selectedVictim);
    setConfirmed(true);
  };

  return (
    <LinearGradient colors={['#0a0a1f', '#030308', COLORS.bg]} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <PhaseBanner phase="night" label={t('night.wolfChannel')} icon="🐺" />

        {/* Wolf chat indicator */}
        <View style={styles.chatBox}>
          <Text style={styles.chatSpeaker}>{t('common.speaking')}...</Text>
          <Text style={styles.chatMessage}>"نقتل أحمد الليلة — يشك فينا!"</Text>
        </View>

        {/* Choose victim */}
        <Text style={styles.sectionLabel}>{t('night.chooseVictim')}</Text>

        <View style={styles.playerGrid}>
          {players.map((player) => (
            <TouchableOpacity
              key={player.id}
              style={[
                styles.playerCard,
                player.isDead && styles.deadCard,
                selectedVictim === player.id && styles.selectedCard,
              ]}
              onPress={() => !player.isDead && setSelectedVictim(player.id)}
              disabled={player.isDead}
            >
              <Text style={styles.playerEmoji}>{player.emoji}</Text>
              <Text
                style={[
                  styles.playerName,
                  selectedVictim === player.id && { color: '#ef4444' },
                  player.isDead && { color: '#555' },
                ]}
              >
                {player.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Confirm kill button / confirmed state */}
        {confirmed ? (
          <View style={styles.confirmedBox}>
            <Text style={styles.confirmedText}>✅ Vote submitted — waiting for night to end…</Text>
          </View>
        ) : (
          <GradientButton
            title={`🩸 ${t('night.confirmKill')}`}
            onPress={handleConfirmKill}
            colors={['#ef4444', '#b91c1c']}
            style={styles.killBtn}
            disabled={!selectedVictim}
          />
        )}
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 50 },
  scroll: { padding: 16, gap: 16 },
  chatBox: {
    backgroundColor: '#0d0508',
    borderWidth: 1,
    borderColor: '#3a1a1a',
    borderRadius: 12,
    padding: 12,
  },
  chatSpeaker: {
    fontSize: 10,
    color: '#ef4444',
    marginBottom: 4,
  },
  chatMessage: {
    fontSize: 13,
    color: '#aa5555',
    fontStyle: 'italic',
    lineHeight: 20,
  },
  sectionLabel: {
    fontSize: 12,
    color: '#ef4444',
    letterSpacing: 1,
  },
  playerGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'center',
  },
  playerCard: {
    width: 80,
    backgroundColor: '#111120',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    padding: 10,
    alignItems: 'center',
    gap: 4,
  },
  deadCard: {
    opacity: 0.3,
    borderColor: '#333',
  },
  selectedCard: {
    backgroundColor: '#1a0808',
    borderColor: '#ef4444',
    borderWidth: 2,
    shadowColor: '#ef4444',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  wolfCard: {
    borderColor: '#ef4444',
    backgroundColor: '#1a0808',
  },
  playerEmoji: { fontSize: 28 },
  playerName: { fontSize: 10, color: COLORS.text },
  killBtn: { width: '100%', marginTop: 8 },
  confirmedBox: {
    marginTop: 8,
    padding: 14,
    borderRadius: 12,
    backgroundColor: '#0d1a0d',
    borderWidth: 1,
    borderColor: '#1a4d1a',
    alignItems: 'center',
  },
  confirmedText: { color: '#4ade80', fontSize: 13, fontWeight: '600' },
});
