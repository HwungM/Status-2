import React, { useEffect, useRef, useState } from 'react'
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native'
import { router } from 'expo-router'
import { COLORS } from '@/constants/colors'
import { useGameStore } from '@/store/gameStore'
import { useAI } from '@/hooks/useAI'

const { width, height } = Dimensions.get('window')

const LOADING_MESSAGES = [
  { emoji: '💜', text: 'Building relationships...' },
  { emoji: '🎭', text: 'Staging arcs and events...' },
  { emoji: '⚡', text: 'Charging the feed...' },
  { emoji: '🌟', text: 'Populating your world...' },
  { emoji: '📖', text: 'Writing your story arc...' },
  { emoji: '🎲', text: 'Setting tension levels...' },
  { emoji: '🌊', text: 'Generating cast dynamics...' },
]

export default function LoadingScreen() {
  const { session } = useGameStore()
  const { initWorld, loadInitialFeed } = useAI()
  const [messageIndex, setMessageIndex] = useState(0)
  const [progress, setProgress] = useState(0)
  const progressAnim = useRef(new Animated.Value(0)).current
  const fadeAnim = useRef(new Animated.Value(1)).current

  useEffect(() => {
    // Cycle messages
    const msgInterval = setInterval(() => {
      Animated.sequence([
        Animated.timing(fadeAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
        Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
      ]).start()
      setMessageIndex(i => (i + 1) % LOADING_MESSAGES.length)
    }, 1400)

    // Animate progress bar
    Animated.timing(progressAnim, {
      toValue: 1,
      duration: 6000,
      useNativeDriver: false,
    }).start()

    // Initialize AI world
    const run = async () => {
      try {
        if (session) {
          await initWorld()
          await loadInitialFeed()
        }
      } catch (_) {}
      setTimeout(() => router.replace('/game/feed'), 6200)
    }
    run()

    return () => clearInterval(msgInterval)
  }, [])

  const msg = LOADING_MESSAGES[messageIndex]
  const playerChar = session?.worldState.characters.find(
    c => c.id === session.players[0]?.characterId
  )
  const chars = session?.worldState.characters.slice(0, 3) || []

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  })

  return (
    <View style={styles.container}>
      {/* Particle dots */}
      {Array.from({ length: 20 }).map((_, i) => (
        <View
          key={i}
          style={[
            styles.particle,
            {
              left: `${(i * 5.3) % 100}%`,
              top: `${(i * 7.7) % 100}%`,
              width: 2 + (i % 3),
              height: 2 + (i % 3),
              opacity: 0.2 + (i % 5) * 0.1,
            },
          ]}
        />
      ))}

      {/* Character images */}
      <View style={styles.avatarsContainer}>
        {chars.map((char, i) => {
          const offsets = [{ left: -50 }, { left: 0 }, { left: 50 }]
          return (
            <View
              key={char.id}
              style={[
                styles.avatarWrapper,
                { marginLeft: i === 0 ? 0 : -20, zIndex: i },
              ]}
            >
              <Animated.Image
                source={{ uri: char.avatar }}
                style={styles.avatar}
              />
            </View>
          )
        })}
      </View>

      {/* Message */}
      <Animated.View style={[styles.messageContainer, { opacity: fadeAnim }]}>
        <Text style={styles.messageEmoji}>{msg.emoji}</Text>
        <Text style={styles.messageText}>{msg.text}</Text>
      </Animated.View>

      {/* Progress bar */}
      <View style={styles.progressContainer}>
        <Animated.View style={[styles.progressBar, { width: progressWidth }]} />
      </View>

      {playerChar && (
        <Text style={styles.worldName}>
          {session?.worldState.fandom ? `${session.worldState.fandom} · ` : ''}{playerChar.name}'s World
        </Text>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A', alignItems: 'center', justifyContent: 'center' },
  particle: { position: 'absolute', backgroundColor: '#3B82F6', borderRadius: 999 },
  avatarsContainer: { flexDirection: 'row', marginBottom: 48, alignItems: 'center' },
  avatarWrapper: { width: 80, height: 80, borderRadius: 40, overflow: 'hidden', borderWidth: 3, borderColor: '#0F172A' },
  avatar: { width: '100%', height: '100%' },
  messageContainer: { alignItems: 'center', marginBottom: 48 },
  messageEmoji: { fontSize: 32, marginBottom: 10 },
  messageText: { color: '#fff', fontSize: 17, fontWeight: '500', letterSpacing: 0.3 },
  progressContainer: { width: width * 0.7, height: 4, backgroundColor: '#1E3A5F', borderRadius: 2, overflow: 'hidden', marginBottom: 20 },
  progressBar: { height: '100%', backgroundColor: '#3B82F6', borderRadius: 2 },
  worldName: { color: '#9CA3AF', fontSize: 13 },
})
