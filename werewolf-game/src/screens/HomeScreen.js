import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { COLORS } from '../constants/theme';
import Moon from '../components/Moon';
import GradientButton from '../components/GradientButton';
import { useGame } from '../context/GameContext';

const { width, height } = Dimensions.get('window');

const Star = ({ delay, top, left, size }) => {
  const opacity = useRef(new Animated.Value(0.2)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.9, duration: 1500, delay, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.2, duration: 1500, useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, []);

  return (
    <Animated.View
      style={{
        position: 'absolute',
        top,
        left,
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: '#fff',
        opacity,
      }}
    />
  );
};

const stars = Array.from({ length: 40 }, (_, i) => ({
  id: i,
  top: Math.random() * height * 0.5,
  left: Math.random() * width,
  size: Math.random() * 2.5 + 0.5,
  delay: Math.random() * 3000,
}));

export default function HomeScreen({ navigation }) {
  const { t } = useTranslation();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const { setPlayer, setRoom } = useGame();

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 1000, useNativeDriver: true }),
    ]).start();
  }, []);

  const handleCreateRoom = () => {
    const playerId = 'player_' + Date.now();
    const roomCode = 'WLF-' + Math.floor(10 + Math.random() * 90);
    setPlayer(playerId, '');
    setRoom(roomCode, roomCode, true);
    navigation.navigate('JoinRoom', { mode: 'create', roomCode });
  };

  const handleJoinRoom = () => {
    const playerId = 'player_' + Date.now();
    setPlayer(playerId, '');
    navigation.navigate('JoinRoom', { mode: 'join' });
  };

  return (
    <LinearGradient
      colors={['#1a0a2e', '#0a0510', COLORS.bg]}
      locations={[0, 0.5, 1]}
      style={styles.container}
    >
      {/* Stars */}
      {stars.map((star) => (
        <Star key={star.id} {...star} />
      ))}

      {/* Moon */}
      <View style={styles.moonContainer}>
        <Moon size={120} />
      </View>

      {/* Content */}
      <Animated.View style={[styles.content, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
        {/* Badge */}
        <View style={styles.badge}>
          <Text style={styles.badgeText}>🐺 {t('app.subtitle')}</Text>
        </View>

        {/* Title */}
        <Text style={styles.title}>🐺</Text>
        <Text style={styles.titleText}>{t('app.title')}</Text>
        <Text style={styles.subtitle}>{t('app.subtitle')}</Text>

        {/* Tags */}
        <View style={styles.tags}>
          <View style={[styles.tag, styles.tagVoice]}>
            <Text style={[styles.tagText, { color: '#c4b5fd' }]}>🎙️ {t('app.subtitle').includes('اجتماعي') ? 'صوت حي' : 'Live Voice'}</Text>
          </View>
          <View style={[styles.tag, styles.tagLive]}>
            <Text style={[styles.tagText, { color: '#f87171' }]}>🔴 Online</Text>
          </View>
        </View>

        {/* Buttons */}
        <View style={styles.buttons}>
          <GradientButton
            title={t('home.createRoom')}
            icon="🎮"
            onPress={handleCreateRoom}
            colors={['#7c3aed', '#4f46e5']}
            style={styles.mainBtn}
          />
          <Text style={styles.or}>{t('home.or')}</Text>
          <GradientButton
            title={t('home.joinRoom')}
            icon="🔑"
            onPress={handleJoinRoom}
            colors={['#7c3aed', '#4f46e5']}
            outline
            style={styles.mainBtn}
          />
        </View>
      </Animated.View>

      {/* Settings Button */}
      <TouchableOpacity
        style={styles.settingsBtn}
        onPress={() => navigation.navigate('Settings')}
      >
        <Text style={styles.settingsIcon}>⚙️</Text>
      </TouchableOpacity>

      {/* Trees silhouette */}
      <View style={styles.treesContainer}>
        <View style={styles.trees}>
          {[0, 30, 70, 120, 170, 220, 270, 320].map((left, i) => (
            <View
              key={i}
              style={[
                styles.tree,
                {
                  left,
                  height: 60 + Math.random() * 80,
                  borderLeftWidth: 18 + Math.random() * 15,
                  borderRightWidth: 18 + Math.random() * 15,
                  opacity: i % 2 === 0 ? 0.6 : 0.4,
                },
              ]}
            />
          ))}
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moonContainer: {
    position: 'absolute',
    top: 80,
    alignSelf: 'center',
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: 30,
    marginTop: 120,
  },
  badge: {
    backgroundColor: 'rgba(200,168,75,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(200,168,75,0.3)',
    borderRadius: 30,
    paddingHorizontal: 18,
    paddingVertical: 6,
    marginBottom: 16,
  },
  badgeText: {
    color: COLORS.moon,
    fontSize: 11,
    letterSpacing: 2,
  },
  title: {
    fontSize: 60,
    marginBottom: 4,
  },
  titleText: {
    fontSize: 42,
    fontWeight: '900',
    color: COLORS.moon,
    letterSpacing: 2,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.muted,
    marginTop: 8,
    letterSpacing: 1,
  },
  tags: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 20,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  tag: {
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
  },
  tagVoice: {
    backgroundColor: 'rgba(124,58,237,0.08)',
    borderColor: 'rgba(124,58,237,0.3)',
  },
  tagLive: {
    backgroundColor: 'rgba(239,68,68,0.08)',
    borderColor: 'rgba(239,68,68,0.3)',
  },
  tagText: {
    fontSize: 12,
    fontWeight: '600',
  },
  buttons: {
    width: '100%',
    marginTop: 30,
    alignItems: 'center',
    gap: 10,
  },
  mainBtn: {
    width: 220,
  },
  or: {
    color: COLORS.muted,
    fontSize: 12,
  },
  settingsBtn: {
    position: 'absolute',
    top: 50,
    right: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingsIcon: {
    fontSize: 18,
  },
  treesContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 120,
    overflow: 'hidden',
  },
  trees: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 120,
  },
  tree: {
    position: 'absolute',
    bottom: 0,
    width: 0,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomWidth: 0,
    borderTopWidth: 0,
    borderStyle: 'solid',
    borderBottomColor: '#0a0a18',
    backgroundColor: '#0a0a18',
  },
});
