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
  { id: 'p2', name: 'سارة', emoji: '👩' },
  { id: 'p3', name: 'كريم', emoji: '🧔' },
];

export default function WitchActionScreen({ navigation }) {
  const { t } = useTranslation();
  const { state, witchAction } = useGame();
  const [killTarget, setKillTarget] = useState(null);
  const [showKillList, setShowKillList] = useState(false);

  // Simulated wolf victim
  const wolfVictim = { id: 'p1', name: 'أحمد', emoji: '🧑' };

  const handleSave = () => {
    witchAction({ type: 'save', targetId: wolfVictim.id });
    navigation.replace('Day');
  };

  const handleKill = () => {
    if (!killTarget) return;
    witchAction({ type: 'kill', targetId: killTarget });
    navigation.replace('Day');
  };

  const handleSkip = () => {
    witchAction(null);
    navigation.replace('Day');
  };

  return (
    <LinearGradient colors={['#120835', '#050310', COLORS.bg]} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <PhaseBanner phase="night" label={t('night.witchTurn')} icon="🧙‍♂️" />

        {/* Victim info */}
        <View style={styles.victimCard}>
          <Text style={styles.victimEmoji}>{wolfVictim.emoji}</Text>
          <View style={styles.victimInfo}>
            <Text style={styles.victimWarning}>⚠️ {t('night.victimChosen')}</Text>
            <Text style={styles.victimName}>{wolfVictim.name}</Text>
            <Text style={styles.victimDesc}>{t('night.willDie')}</Text>
          </View>
        </View>

        {/* Potions */}
        <View style={styles.potionRow}>
          <View style={[styles.potion, styles.lifePotion]}>
            <Text style={styles.potionEmoji}>💚</Text>
            <Text style={[styles.potionName, { color: '#34d399' }]}>{t('night.savePotion')}</Text>
            <Text style={styles.potionCount}>{state.witchSaveUsed ? '×0' : '×1'}</Text>
          </View>
          <View style={[styles.potion, styles.deathPotion]}>
            <Text style={styles.potionEmoji}>🖤</Text>
            <Text style={[styles.potionName, { color: '#f87171' }]}>{t('night.killPotion')}</Text>
            <Text style={styles.potionCount}>{state.witchKillUsed ? '×0' : '×1'}</Text>
          </View>
        </View>

        {/* Save button */}
        {!state.witchSaveUsed && (
          <GradientButton
            title={`💚 ${t('night.savePlayer')} ${wolfVictim.name}`}
            onPress={handleSave}
            colors={['#059669', '#047857']}
            style={styles.actionBtn}
          />
        )}

        {/* Kill button */}
        {!state.witchKillUsed && (
          <>
            {showKillList ? (
              <View style={styles.killList}>
                <Text style={styles.killLabel}>{t('night.chooseVictim')}</Text>
                {ALIVE_PLAYERS.filter((p) => p.id !== wolfVictim.id).map((player) => (
                  <TouchableOpacity
                    key={player.id}
                    style={[styles.killRow, killTarget === player.id && styles.killRowSelected]}
                    onPress={() => setKillTarget(player.id)}
                  >
                    <Text style={styles.killEmoji}>{player.emoji}</Text>
                    <Text style={[styles.killName, killTarget === player.id && { color: '#f87171' }]}>
                      {player.name}
                    </Text>
                  </TouchableOpacity>
                ))}
                <GradientButton
                  title={`🖤 ${t('night.useDeathPotion')}`}
                  onPress={handleKill}
                  colors={['#ef4444', '#b91c1c']}
                  style={styles.actionBtn}
                  disabled={!killTarget}
                />
              </View>
            ) : (
              <GradientButton
                title={`🖤 ${t('night.useDeathPotion')}`}
                onPress={() => setShowKillList(true)}
                colors={['#ef4444', '#b91c1c']}
                style={styles.actionBtn}
              />
            )}
          </>
        )}

        {/* Skip */}
        <TouchableOpacity style={styles.skipBtn} onPress={handleSkip}>
          <Text style={styles.skipText}>{t('night.skip')}</Text>
        </TouchableOpacity>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 50 },
  scroll: { padding: 16, gap: 16 },
  victimCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#1a0808',
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.3)',
    borderRadius: 14,
    padding: 14,
  },
  victimEmoji: { fontSize: 32 },
  victimInfo: { flex: 1 },
  victimWarning: { fontSize: 10, color: '#ef4444' },
  victimName: { fontSize: 18, fontWeight: '700', color: COLORS.text },
  victimDesc: { fontSize: 10, color: '#888', marginTop: 2 },
  potionRow: { flexDirection: 'row', gap: 10 },
  potion: {
    flex: 1,
    borderRadius: 14,
    padding: 12,
    alignItems: 'center',
    gap: 4,
  },
  lifePotion: { backgroundColor: '#062a1a', borderWidth: 1, borderColor: 'rgba(5,150,105,0.3)' },
  deathPotion: { backgroundColor: '#1a0808', borderWidth: 1, borderColor: 'rgba(239,68,68,0.3)' },
  potionEmoji: { fontSize: 28 },
  potionName: { fontSize: 12, fontWeight: '700' },
  potionCount: { fontSize: 10, color: '#888' },
  actionBtn: { width: '100%' },
  killList: { gap: 8 },
  killLabel: { fontSize: 12, color: '#ef4444' },
  killRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 10,
    backgroundColor: '#1a0808',
    borderWidth: 1,
    borderColor: '#2a1400',
    borderRadius: 10,
  },
  killRowSelected: { borderColor: '#ef4444', borderWidth: 2 },
  killEmoji: { fontSize: 22 },
  killName: { fontSize: 13, color: COLORS.text, flex: 1 },
  skipBtn: {
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#2a2a3a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  skipText: { fontSize: 12, color: COLORS.muted },
});
