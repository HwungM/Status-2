import React, { useEffect, useRef } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, Animated, Modal } from 'react-native'
import { useUIStore } from '@/store/uiStore'

export function ViralMomentOverlay() {
  const { viralMoment, hideViralMoment } = useUIStore()

  const pulseAnim = useRef(new Animated.Value(1)).current
  const fadeAnim = useRef(new Animated.Value(0)).current
  const scaleAnim = useRef(new Animated.Value(0.7)).current

  useEffect(() => {
    if (viralMoment?.visible) {
      Animated.parallel([
        Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, tension: 80, friction: 8 }),
        Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
      ]).start()

      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.08, duration: 600, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 0.96, duration: 600, useNativeDriver: true }),
        ]),
      ).start()
    } else {
      pulseAnim.stopAnimation()
      pulseAnim.setValue(1)
      fadeAnim.setValue(0)
      scaleAnim.setValue(0.7)
    }
  }, [viralMoment?.visible])

  if (!viralMoment) return null

  const formatGain = (n: number) => {
    if (n >= 1000000) return `+${(n / 1000000).toFixed(1)}M`
    if (n >= 1000) return `+${(n / 1000).toFixed(1)}K`
    return `+${n}`
  }

  return (
    <Modal visible={!!viralMoment?.visible} transparent animationType="none" onRequestClose={hideViralMoment}>
      <TouchableOpacity style={styles.backdrop} onPress={hideViralMoment} activeOpacity={1}>
        {/* Glow layers */}
        <View style={styles.glowOuter} />
        <View style={styles.glowInner} />

        <Animated.View style={[styles.card, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
          {/* Trending badge */}
          <View style={styles.trendingBadge}>
            <Text style={styles.trendingText}>🔥 TRENDING</Text>
          </View>

          {/* Fire emoji, pulsing */}
          <Animated.Text style={[styles.fireEmoji, { transform: [{ scale: pulseAnim }] }]}>
            🔥
          </Animated.Text>

          <Text style={styles.viralTitle}>YOU'RE GOING VIRAL</Text>

          <Animated.Text style={[styles.followerGain, { transform: [{ scale: pulseAnim }] }]}>
            {formatGain(viralMoment.followersGained)}
          </Animated.Text>
          <Text style={styles.followerLabel}>NEW FOLLOWERS</Text>

          <View style={styles.divider} />

          <Text style={styles.narrative}>{viralMoment.narrativeResult}</Text>

          <TouchableOpacity style={styles.dismissBtn} onPress={hideViralMoment}>
            <Text style={styles.dismissText}>Keep Going 🚀</Text>
          </TouchableOpacity>
        </Animated.View>
      </TouchableOpacity>
    </Modal>
  )
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  glowOuter: {
    position: 'absolute',
    width: 400,
    height: 400,
    borderRadius: 200,
    backgroundColor: 'rgba(249,115,22,0.08)',
    top: '50%',
    left: '50%',
    marginLeft: -200,
    marginTop: -200,
  },
  glowInner: {
    position: 'absolute',
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: 'rgba(245,158,11,0.1)',
    top: '50%',
    left: '50%',
    marginLeft: -125,
    marginTop: -125,
  },
  card: {
    backgroundColor: '#0F0F0F',
    borderRadius: 28,
    padding: 32,
    marginHorizontal: 24,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#F59E0B',
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 24,
    elevation: 20,
    width: '85%',
  },
  trendingBadge: {
    backgroundColor: 'rgba(245,158,11,0.15)',
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: 'rgba(245,158,11,0.4)',
    marginBottom: 20,
  },
  trendingText: {
    color: '#F59E0B',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 2,
  },
  fireEmoji: {
    fontSize: 72,
    marginBottom: 12,
  },
  viralTitle: {
    color: '#fff',
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: 1,
    textAlign: 'center',
    marginBottom: 20,
  },
  followerGain: {
    color: '#F59E0B',
    fontSize: 64,
    fontWeight: '900',
    letterSpacing: -2,
    lineHeight: 68,
  },
  followerLabel: {
    color: '#9CA3AF',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 3,
    marginBottom: 24,
  },
  divider: {
    width: '100%',
    height: 1,
    backgroundColor: '#2A2A2A',
    marginBottom: 20,
  },
  narrative: {
    color: '#D1D5DB',
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 28,
  },
  dismissBtn: {
    backgroundColor: '#F59E0B',
    borderRadius: 999,
    paddingVertical: 14,
    paddingHorizontal: 36,
  },
  dismissText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '800',
  },
})
