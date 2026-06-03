import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { ScandalState } from '@/types'

interface ScandalBannerProps {
  scandal: ScandalState
  onAction: (text: string) => void
}

const SEVERITY_COLORS = {
  'minor': '#F59E0B',
  'major': '#EF4444',
  'career-ending': '#7C3AED',
}

const SEVERITY_LABELS = {
  'minor': 'MINOR',
  'major': 'MAJOR',
  'career-ending': 'CAREER ENDING',
}

export function ScandalBanner({ scandal, onAction }: ScandalBannerProps) {
  if (!scandal.active) return null

  const color = SEVERITY_COLORS[scandal.severity]
  const label = SEVERITY_LABELS[scandal.severity]
  const estimatedLoss = scandal.followerLossPerTick * scandal.ticksRemaining

  return (
    <View style={[styles.container, { borderColor: color }]}>
      <View style={styles.top}>
        <View style={styles.titleRow}>
          <Text style={styles.alertIcon}>⚠️</Text>
          <Text style={[styles.title, { color }]}>CANCEL ALERT</Text>
          <View style={[styles.severityBadge, { backgroundColor: color + '22', borderColor: color }]}>
            <Text style={[styles.severityText, { color }]}>{label}</Text>
          </View>
        </View>
        <Text style={styles.cause}>{scandal.cause}</Text>
        <Text style={styles.lossEstimate}>
          Estimated follower loss: ~{estimatedLoss.toLocaleString()} over {scandal.ticksRemaining} day{scandal.ticksRemaining !== 1 ? 's' : ''}
        </Text>
      </View>
      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.apologizeBtn}
          onPress={() => onAction('I want to publicly apologize and address the controversy with humility')}
          activeOpacity={0.8}
        >
          <Text style={styles.apologizeText}>🙏 Apologize</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.doubleDownBtn}
          onPress={() => onAction('I am doubling down on my position and defending myself publicly')}
          activeOpacity={0.8}
        >
          <Text style={styles.doubleDownText}>💪 Double Down</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(239,68,68,0.08)',
    borderWidth: 1,
    borderRadius: 0,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderLeftWidth: 4,
    borderTopWidth: 0,
    borderRightWidth: 0,
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A2A',
  },
  top: { marginBottom: 12 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  alertIcon: { fontSize: 16 },
  title: { fontSize: 14, fontWeight: '900', letterSpacing: 1 },
  severityBadge: {
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderWidth: 1,
  },
  severityText: { fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  cause: { color: '#E5E7EB', fontSize: 13, lineHeight: 18, marginBottom: 4 },
  lossEstimate: { color: '#9CA3AF', fontSize: 12 },
  actions: { flexDirection: 'row', gap: 10 },
  apologizeBtn: {
    flex: 1,
    backgroundColor: 'rgba(59,130,246,0.15)',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(59,130,246,0.3)',
  },
  apologizeText: { color: '#93C5FD', fontSize: 13, fontWeight: '700' },
  doubleDownBtn: {
    flex: 1,
    backgroundColor: 'rgba(239,68,68,0.15)',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.3)',
  },
  doubleDownText: { color: '#FCA5A5', fontSize: 13, fontWeight: '700' },
})
