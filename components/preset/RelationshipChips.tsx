import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native'
import { COLORS } from '@/constants/colors'
import { ChemistryType } from '@/types'

const CHEMISTRY_OPTIONS: { type: ChemistryType; label: string; emoji: string }[] = [
  { type: 'rivals', label: 'Rivals', emoji: '⚔️' },
  { type: 'spicy', label: 'Spicy', emoji: '🌶️' },
  { type: 'lovers', label: 'Lovers', emoji: '💕' },
  { type: 'energy', label: 'Energy', emoji: '😈' },
  { type: 'mentors', label: 'Mentors', emoji: '🤝' },
  { type: 'family', label: 'Family', emoji: '👨‍👩‍👦' },
  { type: 'friends', label: 'Friends', emoji: '👥' },
]

interface RelationshipChipsProps {
  selected: ChemistryType
  onSelect: (type: ChemistryType) => void
}

export function RelationshipChips({ selected, onSelect }: RelationshipChipsProps) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scroll}>
      {CHEMISTRY_OPTIONS.map(opt => (
        <TouchableOpacity
          key={opt.type}
          style={[styles.chip, selected === opt.type && styles.chipActive]}
          onPress={() => onSelect(opt.type)}
          activeOpacity={0.8}
        >
          <Text style={styles.chipText}>{opt.emoji} {opt.label}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  scroll: { marginVertical: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: COLORS.divider,
    borderStyle: 'dashed',
    marginRight: 8,
  },
  chipActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primary + '22' },
  chipText: { color: COLORS.textPrimary, fontSize: 13, fontWeight: '500' },
})
