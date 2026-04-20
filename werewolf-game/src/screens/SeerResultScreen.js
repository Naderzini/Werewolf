import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { COLORS } from '../constants/theme';
import GradientButton from '../components/GradientButton';
import { useGame } from '../context/GameContext';

export default function SeerResultScreen({ navigation, route }) {
  const { t } = useTranslation();
  const { state } = useGame();
  const { targetName, isWolf } = route.params || { targetName: 'أحمد', isWolf: true };
  const scaleAnim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    Animated.spring(scaleAnim, { toValue: 1, friction: 4, useNativeDriver: true }).start();
  }, []);

  return (
    <LinearGradient colors={['#1a1400', '#060500', COLORS.bg]} style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.eyebrow}>👁️ {t('seerResult.visionTitle')}</Text>

        {/* Result card */}
        <Animated.View style={[
          styles.visionCard,
          isWolf ? styles.wolfCard : styles.villagerCard,
          { transform: [{ scale: scaleAnim }] },
        ]}>
          <Text style={styles.visionIcon}>{isWolf ? '🐺' : '🧑‍🌾'}</Text>
          <Text style={[styles.visionName, isWolf ? { color: '#f87171' } : { color: '#4ade80' }]}>
            {targetName}
          </Text>
          <View style={[styles.badge, isWolf ? styles.wolfBadge : styles.villageBadge]}>
            <Text style={[styles.badgeText, isWolf ? { color: '#f87171' } : { color: '#4ade80' }]}>
              {isWolf ? `${t('seerResult.isWolf')} 🐺` : `${t('seerResult.isVillager')} ✅`}
            </Text>
          </View>
          <Text style={styles.revealText}>
            {t('seerResult.revealed')} {targetName} {isWolf ? '🐺' : '✅'}
          </Text>
        </Animated.View>

        {/* Seer log */}
        <View style={styles.logBox}>
          <Text style={styles.logTitle}>{t('seerResult.log')}</Text>
          {state.seerResults.map((result, i) => (
            <View key={i} style={styles.logRow}>
              <Text style={styles.logEmoji}>{result.isWolf ? '🐺' : '🧑‍🌾'}</Text>
              <Text style={styles.logName}>{result.playerName}</Text>
              <Text style={[styles.logResult, { color: result.isWolf ? '#f87171' : '#4ade80' }]}>
                {result.isWolf ? '🐺 ' + t('roles.wolf') : '✅ ' + t('roles.villager')}
              </Text>
            </View>
          ))}
          {/* Current result if not in state yet */}
          {!state.seerResults.find((r) => r.playerName === targetName) && (
            <View style={styles.logRow}>
              <Text style={styles.logEmoji}>{isWolf ? '🐺' : '🧑‍🌾'}</Text>
              <Text style={styles.logName}>{targetName}</Text>
              <Text style={[styles.logResult, { color: isWolf ? '#f87171' : '#4ade80' }]}>
                {isWolf ? '🐺 ' + t('roles.wolf') : '✅ ' + t('roles.villager')}
              </Text>
            </View>
          )}
        </View>

        <GradientButton
          title={t('common.confirm')}
          onPress={() => navigation.replace('Day')}
          colors={['#d97706', '#b45309']}
          style={styles.btn}
        />
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { alignItems: 'center', paddingHorizontal: 20, gap: 16, width: '100%' },
  eyebrow: { fontSize: 12, color: '#d97706', letterSpacing: 2, fontFamily: 'monospace' },
  visionCard: {
    width: '100%',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    gap: 6,
  },
  wolfCard: { backgroundColor: '#1a0505', borderWidth: 2, borderColor: 'rgba(239,68,68,0.3)' },
  villagerCard: { backgroundColor: '#051a0d', borderWidth: 2, borderColor: 'rgba(34,197,94,0.3)' },
  visionIcon: { fontSize: 48 },
  visionName: { fontSize: 20, fontWeight: '900' },
  badge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 10, marginTop: 4 },
  wolfBadge: { backgroundColor: 'rgba(239,68,68,0.15)', borderWidth: 1, borderColor: 'rgba(239,68,68,0.3)' },
  villageBadge: { backgroundColor: 'rgba(34,197,94,0.15)', borderWidth: 1, borderColor: 'rgba(34,197,94,0.3)' },
  badgeText: { fontSize: 11, fontWeight: '700' },
  revealText: { fontSize: 12, color: '#aaa', marginTop: 6, textAlign: 'center', lineHeight: 20 },
  logBox: {
    width: '100%',
    backgroundColor: '#1a1100',
    borderWidth: 1,
    borderColor: 'rgba(217,119,6,0.25)',
    borderRadius: 14,
    padding: 14,
  },
  logTitle: { fontSize: 10, color: '#d97706', marginBottom: 8 },
  logRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  logEmoji: { fontSize: 18 },
  logName: { flex: 1, fontSize: 12, color: COLORS.text },
  logResult: { fontSize: 11 },
  btn: { width: 200 },
});
