import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useTranslation } from 'react-i18next';
import { COLORS } from '../constants/theme';

const AVATAR_OPTIONS = [
  '🧑', '👩', '🧔', '👱‍♀️', '👨‍🦱', '👩‍🦰', '🧑‍🦱', '👱', '👨‍🦳', '👩‍🦳',
  '👶', '👴', '👵', '🧓', '👲', '👳‍♀️', '👳', '🧕', '👮‍♀️',
  '👮', '👷‍♀️', '👷', '💂‍♀️', '💂', '🕵️‍♀️', '🕵️', '👩‍⚕️', '👨‍⚕️', '👩‍🌾',
  '👨‍🌾', '👩‍🍳', '👨‍🍳', '👩‍🎓', '👨‍🎓', '👩‍🎨', '👨‍🎨', '👩‍🏫', '👨‍🏫',
  '👩‍⚖️', '👨‍⚖️', '👩‍🌰', '👨‍🌰', '👩‍🔬', '👨‍🔬', '👩‍💻', '👨‍💻', '👩‍🎤',
  '👨‍🎤', '👩‍🏭', '👨‍🏭', '👩‍✈️', '👨‍✈️', '👩‍🚀', '👨‍🚀', '👩‍⚕️', '👨‍⚕️',
  '🧑‍⚕️', '👩‍🌾', '🧑‍🌾', '👩‍🍳', '🧑‍🍳', '👩‍🎓', '🧑‍🎓','🧑‍🏫'
];

export default function AvatarPicker({ selectedAvatar, onAvatarSelect, title = "Choose your avatar" }) {
  const { t } = useTranslation();
  const [showAll, setShowAll] = useState(false);
  const displayAvatars = showAll ? AVATAR_OPTIONS : AVATAR_OPTIONS.slice(0, 24);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      
      <ScrollView style={styles.avatarScroll} showsVerticalScrollIndicator={false}>
        <View style={styles.avatarGrid}>
          {displayAvatars.map((avatar, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.avatarOption,
                selectedAvatar === avatar && styles.selectedAvatar
              ]}
              onPress={() => onAvatarSelect(avatar)}
            >
              <Text style={styles.avatarEmoji}>{avatar}</Text>
              {selectedAvatar === avatar && (
                <View style={styles.checkmark}>
                  <Text style={styles.checkmarkText}>✓</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>
        
        {!showAll && AVATAR_OPTIONS.length > 24 && (
          <TouchableOpacity 
            style={styles.showMoreButton} 
            onPress={() => setShowAll(true)}
          >
            <Text style={styles.showMoreText}>{t('common.showMore')}</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#161625',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 16,
    textAlign: 'center',
  },
  avatarScroll: {
    maxHeight: 200,
  },
  avatarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'center',
  },
  avatarOption: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#1a1a2e',
    borderWidth: 2,
    borderColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  selectedAvatar: {
    borderColor: '#7c3aed',
    backgroundColor: '#2a1a3e',
  },
  avatarEmoji: {
    fontSize: 24,
  },
  checkmark: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#7c3aed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmarkText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  showMoreButton: {
    width: '100%',
    padding: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  showMoreText: {
    color: COLORS.muted,
    fontSize: 12,
  },
});
