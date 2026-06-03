import React from 'react'
import { View, Text, StyleSheet, ViewStyle } from 'react-native'
import { COLORS } from '@/constants/colors'

interface BadgeProps {
  label: string
  color?: string
  textColor?: string
  style?: ViewStyle
}

export function Badge({ label, color = COLORS.primary, textColor = '#fff', style }: BadgeProps) {
  return (
    <View style={[styles.badge, { backgroundColor: color + '22', borderColor: color + '44', borderWidth: 1 }, style]}>
      <Text style={[styles.text, { color }]}>{label}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    alignSelf: 'flex-start',
  },
  text: { fontSize: 11, fontWeight: '600' },
})
