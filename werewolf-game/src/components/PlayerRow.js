import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { COLORS } from '../constants/theme';
import PlayerAvatar from './PlayerAvatar';

export default function PlayerRow({ 
  player, 
  index = 0, 
  onPress, 
  selected = false, 
  disabled = false, 
  selectedColor = COLORS.village,
  rightElement,
  subtitle,
}) {
  const Container = onPress ? TouchableOpacity : View;

  return (
    <Container
      onPress={disabled ? undefined : onPress}
      activeOpacity={0.7}
      style={[
        styles.row,
        selected && { borderColor: selectedColor, backgroundColor: selectedColor + '15' },
        disabled && { opacity: 0.4 },
      ]}
    >
      <PlayerAvatar 
        name={player.name} 
        index={index} 
        size={32} 
        isDead={player.isDead}
        isSpeaking={player.isSpeaking}
      />
      <View style={styles.info}>
        <Text style={[styles.name, selected && { color: selectedColor }]}>{player.name}</Text>
        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      </View>
      {rightElement}
      {player.isOnline !== undefined && (
        <View style={[styles.dot, { backgroundColor: player.isOnline ? COLORS.village : '#444' }]} />
      )}
    </Container>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 10,
    backgroundColor: '#161625',
    borderRadius: 10,
    marginBottom: 6,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text,
  },
  subtitle: {
    fontSize: 10,
    color: COLORS.muted,
    marginTop: 2,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
});
