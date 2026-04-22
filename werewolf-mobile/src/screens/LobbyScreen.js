import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { COLORS } from '../constants/theme';
import { ROLE_CONFIG, getRoleDistribution } from '../constants/roles';
import GradientButton from '../components/GradientButton';
import PlayerAvatar from '../components/PlayerAvatar';
import { useGame } from '../context/GameContext';

// Mock players for demo - in production these come from Firebase/Socket.IO
const MOCK_PLAYERS = [
  { id: 'p1', name: 'أحمد', isOnline: true, isHost: true },
  { id: 'p2', name: 'سارة', isOnline: true, isHost: false },
  { id: 'p3', name: 'كريم', isOnline: true, isHost: false },
  { id: 'p4', name: 'لينا', isOnline: false, isHost: false },
  { id: 'p5', name: 'يوسف', isOnline: false, isHost: false },
];

export default function LobbyScreen({ navigation }) {
  const { t } = useTranslation();
  const { state, updatePlayers, startGame } = useGame();
  const [players, setPlayers] = useState([]);

  useEffect(() => {
    // In production: listen to Firebase/Socket for player updates
    // For now, use mock data + current player
    const currentPlayer = {
      id: state.playerId,
      name: state.playerName || 'You',
      isOnline: true,
      isHost: state.isHost,
    };
    
    const allPlayers = state.isHost
      ? [currentPlayer, ...MOCK_PLAYERS.slice(1)]
      : [...MOCK_PLAYERS.slice(0, 1), currentPlayer, ...MOCK_PLAYERS.slice(2)];
    
    setPlayers(allPlayers);
    updatePlayers(allPlayers);
  }, []);

  const canStart = players.length >= 6;

  const handleStartGame = () => {
    if (!canStart) {
      Alert.alert('', t('lobby.minPlayers'));
      return;
    }
    // Assign roles
    const roles = Object.keys(getRoleDistribution(players.length) || {});
    const shuffledRoles = [];
    const dist = getRoleDistribution(players.length);
    if (dist) {
      for (const [role, count] of Object.entries(dist)) {
        for (let i = 0; i < count; i++) shuffledRoles.push(role);
      }
    }
    // Shuffle
    for (let i = shuffledRoles.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffledRoles[i], shuffledRoles[j]] = [shuffledRoles[j], shuffledRoles[i]];
    }
    
    // For demo: assign first role to current player
    const myRole = shuffledRoles[0] || 'wolf';
    startGame(myRole);
    navigation.replace('RoleReveal');
  };

  const renderPlayer = ({ item, index }) => (
    <View style={styles.playerRow}>
      <PlayerAvatar name={item.name} index={index} size={36} isHost={item.isHost} />
      <View style={styles.playerInfo}>
        <Text style={styles.playerName}>{item.name}</Text>
        {item.isHost && <Text style={styles.hostBadge}>👑 {t('lobby.host')}</Text>}
      </View>
      <View style={[styles.statusDot, { backgroundColor: item.isOnline ? COLORS.village : '#444' }]} />
    </View>
  );

  return (
    <LinearGradient colors={['#1a0a2e', '#0a0a16']} style={styles.container}>
      {/* Header with room code */}
      <View style={styles.header}>
        <View style={styles.codeBox}>
          <Text style={styles.codeLabel}>{t('lobby.roomCode')}</Text>
          <Text style={styles.codeValue}>{state.roomCode || 'WLF-47'}</Text>
        </View>
        <Text style={styles.roomName}>🌲</Text>
        <Text style={styles.playerCount}>
          {players.length}/8 {t('lobby.players')}
        </Text>
      </View>

      {/* Players list */}
      <FlatList
        data={players}
        renderItem={renderPlayer}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        style={styles.listContainer}
      />

      {/* Bottom actions */}
      <View style={styles.bottom}>
        {state.isHost ? (
          <GradientButton
            title={t('lobby.startGame')}
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
        
        <TouchableOpacity style={styles.leaveBtn} onPress={() => navigation.popToTop()}>
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
  codeLabel: {
    fontSize: 10,
    color: COLORS.muted,
    marginBottom: 4,
  },
  codeValue: {
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: 5,
    color: COLORS.moon,
  },
  roomName: {
    fontSize: 20,
    textAlign: 'center',
  },
  playerCount: {
    fontSize: 12,
    color: COLORS.muted,
    textAlign: 'center',
    marginTop: 4,
  },
  listContainer: { flex: 1 },
  list: {
    padding: 16,
    gap: 6,
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
  playerName: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  hostBadge: {
    fontSize: 10,
    color: COLORS.moon,
    marginTop: 2,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  bottom: {
    padding: 16,
    gap: 10,
  },
  startBtn: {
    width: '100%',
  },
  waitingBox: {
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  waitingText: {
    color: COLORS.muted,
    fontSize: 14,
  },
  leaveBtn: {
    alignItems: 'center',
    padding: 10,
  },
  leaveText: {
    color: '#ef4444',
    fontSize: 13,
  },
});
