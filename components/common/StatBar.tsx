import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { COLORS } from '@/constants/colors'

interface StatBarProps {
  label: string
  value: number
  delta?: number
  flavorText?: string
  color?: string
  emoji?: string
}

export function StatBar({ label, value, delta, flavorText, color = COLORS.primary, emoji }: StatBarProps) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.label}>{emoji ? `${emoji} ` : ''}{label}</Text>
        <View style={styles.valueRow}>
          <Text style={styles.value}>{value.toFixed(0)}%</Text>
          {delta !== undefined && delta !== 0 && (
            <Text style={[styles.delta, { color: delta > 0 ? COLORS.positive : COLORS.danger }]}>
              {delta > 0 ? ` +${delta.toFixed(1)}%` : ` ${delta.toFixed(1)}%`}
            </Text>
          )}
        </View>
      </View>
      <View style={styles.barBg}>
        <View style={[styles.barFill, { width: `${Math.min(100, value)}%`, backgroundColor: color }]} />
      </View>
      {flavorText && <Text style={styles.flavor}>{flavorText}</Text>}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { marginBottom: 16 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  label: { color: COLORS.textPrimary, fontSize: 14, fontWeight: '600' },
  valueRow: { flexDirection: 'row', alignItems: 'center' },
  value: { color: COLORS.textPrimary, fontSize: 14, fontWeight: '700' },
  delta: { fontSize: 12, fontWeight: '600' },
  barBg: { height: 6, backgroundColor: COLORS.divider, borderRadius: 3 },
  barFill: { height: 6, borderRadius: 3 },
  flavor: { color: COLORS.textSecondary, fontSize: 12, marginTop: 4 },
})
