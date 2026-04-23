import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../constants/theme';

const AVATAR_COLORS = ['#2d1b69', '#1a2e1a', '#2e1a1a', '#1a2a2e', '#2e2a1a', '#1a1a2a', '#2a1a2e', '#1a2e2a'];
const AVATAR_EMOJIS = ['🧑', '👩', '🧔', '👩‍🦰', '🧑‍🦱', '👨‍🦳', '👩‍🦱', '🧑‍🦰'];

export default function PlayerAvatar({ name, index = 0, size = 40, isHost = false, isDead = false, isSpeaking = false, speakColor, avatarUrl }) {
  const bgColor = AVATAR_COLORS[index % AVATAR_COLORS.length];
  // Use custom avatar if provided, otherwise fall back to default emoji based on index
  const emoji = avatarUrl || AVATAR_EMOJIS[index % AVATAR_EMOJIS.length];

  return (
    <View style={[
      styles.container,
      { 
        width: size, 
        height: size, 
        borderRadius: size / 2,
        backgroundColor: bgColor,
        opacity: isDead ? 0.3 : 1,
        borderWidth: isSpeaking ? 2 : 1.5,
        borderColor: isSpeaking ? (speakColor || COLORS.village) : COLORS.border,
      },
      isSpeaking && { shadowColor: speakColor || COLORS.village, shadowOpacity: 0.4, shadowRadius: 8, elevation: 5 },
    ]}>
      <Text style={{ fontSize: size * 0.5 }}>{isDead ? '💀' : (isHost ? '👑' : emoji)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
