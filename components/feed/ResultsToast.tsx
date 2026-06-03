import React, { useEffect, useRef } from 'react'
import { Animated, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { COLORS } from '@/constants/colors'

interface ResultsToastProps {
  visible: boolean
  xpGained: number
  followersGained: number
  narrativeResult: string
  statChanges: { stat: string; delta: number; flavorText: string }[]
  onDismiss: () => void
}

export function ResultsToast({ visible, xpGained, followersGained, narrativeResult, statChanges, onDismiss }: ResultsToastProps) {
  const translateY = useRef(new Animated.Value(-200)).current

  useEffect(() => {
    if (visible) {
      Animated.spring(translateY, { toValue: 0, useNativeDriver: true, tension: 70, friction: 9 }).start()
      const timer = setTimeout(onDismiss, 6000)
      return () => clearTimeout(timer)
    } else {
      Animated.timing(translateY, { toValue: -200, duration: 300, useNativeDriver: true }).start()
    }
  }, [visible])

  return (
    <Animated.View style={[styles.container, { transform: [{ translateY }] }]}>
      <View style={styles.header}>
        <Text style={styles.headerText}>
          ✨ +{xpGained} XP{'  '}
          <Text style={{ color: followersGained >= 0 ? COLORS.positive : COLORS.danger }}>
            👥 {followersGained >= 0 ? '+' : ''}{followersGained}
          </Text>
        </Text>
        <TouchableOpacity onPress={onDismiss}>
          <Text style={styles.close}>✕</Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.narrative}>{narrativeResult}</Text>
      {statChanges.slice(0, 3).map((sc, i) => (
        <Text key={i} style={styles.stat}>
          <Text style={{ color: sc.delta > 0 ? COLORS.positive : COLORS.danger }}>
            {sc.stat} {sc.delta > 0 ? '↑' : '↓'}
          </Text>
          {'  '}<Text style={styles.flavorText}>{sc.flavorText}</Text>
        </Text>
      ))}
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 60,
    left: 16,
    right: 16,
    backgroundColor: '#14532D',
    borderRadius: 16,
    padding: 16,
    zIndex: 9999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 12,
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  headerText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  close: { color: '#86EFAC', fontSize: 16 },
  narrative: { color: '#D1FAE5', fontSize: 13, lineHeight: 18, marginBottom: 8 },
  stat: { color: '#fff', fontSize: 12, marginBottom: 2 },
  flavorText: { color: '#A7F3D0', fontSize: 12 },
})
