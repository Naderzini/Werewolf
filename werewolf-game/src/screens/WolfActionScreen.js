import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { COLORS } from '../constants/theme';
import PhaseBanner from '../components/PhaseBanner';
import GradientButton from '../components/GradientButton';
import { useGame } from '../context/GameContext';

const ALIVE_PLAYERS = [
  { id: 'p1', name: 'أحمد', emoji: '🧑' },
  { id: 'p3', name: 'كريم', emoji: '🧔', isWolf: true },
  { id: 'p4', name: 'لينا', emoji: '👩', isDead: true },
  { id: 'p5', name: 'سارة', emoji: '👩‍🦰' },
];

export default function WolfActionScreen({ navigation }) {
  const { t } = useTranslation();
  const { wolfVote } = useGame();
  const [selectedVictim, setSelectedVictim] = useState(null);

  const handleConfirmKill = () => {
    if (!selectedVictim) return;
    wolfVote(selectedVictim);
    navigation.replace('Day');
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
          {ALIVE_PLAYERS.map((player) => (
            <TouchableOpacity
              key={player.id}
              style={[
                styles.playerCard,
                player.isDead && styles.deadCard,
                selectedVictim === player.id && styles.selectedCard,
                player.isWolf && styles.wolfCard,
              ]}
              onPress={() => !player.isDead && !player.isWolf && setSelectedVictim(player.id)}
              disabled={player.isDead || player.isWolf}
            >
              <Text style={styles.playerEmoji}>{player.isDead ? '💀' : player.emoji}</Text>
              <Text style={[
                styles.playerName,
                selectedVictim === player.id && { color: '#ef4444' },
                player.isWolf && { color: '#ef4444' },
                player.isDead && { color: '#555' },
              ]}>
                {player.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Confirm kill button */}
        <GradientButton
          title={`🩸 ${t('night.confirmKill')}`}
          onPress={handleConfirmKill}
          colors={['#ef4444', '#b91c1c']}
          style={styles.killBtn}
          disabled={!selectedVictim}
        />
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
});
