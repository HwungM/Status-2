import React from 'react'
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native'
import { COLORS } from '@/constants/colors'
import { GameEvent } from '@/types'

interface EventBannerProps {
  event: GameEvent
  onPress: () => void
}

export function EventBanner({ event, onPress }: EventBannerProps) {
  return (
    <TouchableOpacity style={styles.banner} onPress={onPress} activeOpacity={0.85}>
      <Text style={styles.text}>
        🎭 <Text style={styles.bold}>Event</Text> — up to <Text style={styles.xp}>+{event.xpMax} XP</Text>
      </Text>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: COLORS.primary,
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 999,
    paddingVertical: 10,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  text: { color: '#fff', fontSize: 14 },
  bold: { fontWeight: '700' },
  xp: { color: COLORS.xp, fontWeight: '700' },
})
