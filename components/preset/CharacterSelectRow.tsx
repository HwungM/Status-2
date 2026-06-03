import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { COLORS } from '@/constants/colors'
import { Character } from '@/types'
import { Avatar } from '@/components/common/Avatar'

interface CharacterSelectRowProps {
  character: Character
  selected: boolean
  onToggle: () => void
  showRadio?: boolean
}

export function CharacterSelectRow({ character, selected, onToggle, showRadio }: CharacterSelectRowProps) {
  return (
    <TouchableOpacity style={styles.row} onPress={onToggle} activeOpacity={0.8}>
      <Avatar uri={character.avatar} size={48} />
      <View style={styles.info}>
        <View style={styles.nameRow}>
          <Text style={styles.name}>{character.name}</Text>
          {character.isVerified && <Text style={styles.verified}> ✓</Text>}
        </View>
        <Text style={styles.handle}>@{character.handle}</Text>
        <Text style={styles.bio} numberOfLines={2}>{character.bio}</Text>
      </View>
      {showRadio ? (
        <View style={[styles.radio, selected && styles.radioSelected]}>
          {selected && <View style={styles.radioDot} />}
        </View>
      ) : (
        <View style={[styles.checkbox, selected && styles.checkboxSelected]}>
          {selected && <Text style={styles.checkmark}>✓</Text>}
        </View>
      )}
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: COLORS.divider },
  info: { flex: 1, marginLeft: 12 },
  nameRow: { flexDirection: 'row', alignItems: 'center' },
  name: { color: COLORS.textPrimary, fontSize: 15, fontWeight: '600' },
  verified: { color: COLORS.verified, fontSize: 14 },
  handle: { color: COLORS.textSecondary, fontSize: 13, marginBottom: 2 },
  bio: { color: COLORS.textSecondary, fontSize: 12, lineHeight: 16 },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: COLORS.divider, alignItems: 'center', justifyContent: 'center' },
  radioSelected: { borderColor: COLORS.primary },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: COLORS.primary },
  checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: COLORS.divider, alignItems: 'center', justifyContent: 'center' },
  checkboxSelected: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  checkmark: { color: '#fff', fontSize: 13, fontWeight: '700' },
})
