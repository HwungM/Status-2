import React from 'react'
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native'
import { COLORS } from '@/constants/colors'

interface InviteCodePillProps {
  code: string
  onCopy?: () => void
}

export function InviteCodePill({ code, onCopy }: InviteCodePillProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>Invite friends (multiplayer coming soon)</Text>
      <TouchableOpacity style={styles.pill} onPress={onCopy} activeOpacity={0.7}>
        <Text style={styles.code}>{code}</Text>
        <Text style={styles.copyIcon}>  📋</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { marginVertical: 8 },
  label: { color: COLORS.textSecondary, fontSize: 12, marginBottom: 6 },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface2,
    borderRadius: 999,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: COLORS.divider,
    alignSelf: 'flex-start',
  },
  code: { color: COLORS.textPrimary, fontSize: 16, fontWeight: '700', letterSpacing: 3 },
  copyIcon: { color: COLORS.textSecondary, fontSize: 14 },
})
