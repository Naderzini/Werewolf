import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { COLORS } from '../constants/theme';
import { MIN_PLAYERS, MAX_PLAYERS } from '../constants/roles';
import GradientButton from '../components/GradientButton';
import PlayerAvatar from '../components/PlayerAvatar';
import SettingsPanel from '../components/SettingsPanel';
import { useGame } from '../context/GameContext';
import {
  updateSettings as sendSettings,
  startGame as sendStartGame,
  leaveRoom as sendLeaveRoom,
} from '../services/socketService';

export default function LobbyScreen({ navigation }) {
  const { t } = useTranslation();
  const { state, setSettings } = useGame();
  const [starting, setStarting] = useState(false);

  const players = state.players || [];
  const canStart = state.isHost && players.length >= MIN_PLAYERS && !starting;

  const handleStartGame = async () => {
    if (players.length < MIN_PLAYERS) {
      Alert.alert('', `Need at least ${MIN_PLAYERS} players.`);
      return;
    }
    setStarting(true);
    try {
      await sendStartGame();
    } catch (err) {
      Alert.alert('Error', err.message || 'Could not start game');
      setStarting(false);
    }
  };

  const handleSettingsChange = async (partial) => {
    // Optimistic update then sync
    setSettings(partial);
    try {
      await sendSettings(partial);
    } catch (err) {
      Alert.alert('Error', err.message || 'Could not update settings');
    }
  };

  const handleLeave = async () => {
    try {
      await sendLeaveRoom();
    } catch (_) {}
    navigation.popToTop();
  };

  const renderPlayer = ({ item, index }) => (
    <View style={styles.playerRow}>
      <PlayerAvatar 
        name={item.name} 
        index={index} 
        size={36} 
        isHost={item.isHost} 
        avatarUrl={item.avatarUrl}
      />
      <View style={styles.playerInfo}>
        <Text style={styles.playerName}>{item.name}</Text>
        {item.isHost && <Text style={styles.hostBadge}>👑 {t('lobby.host')}</Text>}
      </View>
      <View
        style={[
          styles.statusDot,
          { backgroundColor: item.isOnline ? COLORS.village : '#444' },
        ]}
      />
    </View>
  );

  return (
    <LinearGradient colors={['#1a0a2e', '#0a0a16']} style={styles.container}>
      <View style={styles.header}>
        <View style={styles.codeBox}>
          <Text style={styles.codeLabel}>{t('lobby.roomCode')}</Text>
          <Text style={styles.codeValue}>{state.roomCode || '—'}</Text>
        </View>
        <Text style={styles.playerCount}>
          {players.length}/{MAX_PLAYERS} {t('lobby.players')}
        </Text>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={{ paddingBottom: 20 }}>
        {/* Players */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Players</Text>
          <FlatList
            scrollEnabled={false}
            data={players}
            renderItem={renderPlayer}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ gap: 6 }}
          />
        </View>

        {/* Settings */}
        <View style={styles.section}>
          <SettingsPanel
            settings={state.settings}
            playerCount={players.length}
            isHost={state.isHost}
            onChange={handleSettingsChange}
          />
        </View>
      </ScrollView>

      <View style={styles.bottom}>
        {state.isHost ? (
          <GradientButton
            title={starting ? '...' : t('lobby.startGame')}
            icon="🚀"
            onPress={handleStartGame}
            colors={['#7c3aed', '#4f46e5']}
            style={styles.startBtn}
            disabled={!canStart}
          />
        ) : (
          <View style={styles.waitingBox}>
            <Text style={styles.waitingText}>⏳ {t('lobby.waiting')}</Text>
          </View>
        )}

        <TouchableOpacity style={styles.leaveBtn} onPress={handleLeave}>
          <Text style={styles.leaveText}>🚪 {t('lobby.leave')}</Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingTop: 50,
    paddingHorizontal: 16,
    paddingBottom: 16,
    backgroundColor: '#1a0a2e',
  },
  codeBox: {
    backgroundColor: '#1e1e30',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#2a2a45',
    alignItems: 'center',
    marginBottom: 10,
  },
  codeLabel: { fontSize: 10, color: COLORS.muted, marginBottom: 4 },
  codeValue: { fontSize: 24, fontWeight: '900', letterSpacing: 5, color: COLORS.moon },
  playerCount: { fontSize: 12, color: COLORS.muted, textAlign: 'center', marginTop: 4 },
  scroll: { flex: 1 },
  section: { paddingHorizontal: 16, paddingTop: 14 },
  sectionTitle: {
    fontSize: 12,
    color: COLORS.muted,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  playerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 10,
    backgroundColor: '#161625',
    borderRadius: 10,
  },
  playerInfo: { flex: 1 },
  playerName: { fontSize: 14, fontWeight: '600', color: COLORS.text },
  hostBadge: { fontSize: 10, color: COLORS.moon, marginTop: 2 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  bottom: { padding: 16, gap: 10 },
  startBtn: { width: '100%' },
  waitingBox: {
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  waitingText: { color: COLORS.muted, fontSize: 14 },
  leaveBtn: { alignItems: 'center', padding: 10 },
  leaveText: { color: '#ef4444', fontSize: 13 },
});
