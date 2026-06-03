import React, { useState } from 'react'
import { View, Text, FlatList, TouchableOpacity, StyleSheet, TextInput } from 'react-native'
import { router } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { COLORS } from '@/constants/colors'
import { useScenarioStore } from '@/store/scenarioStore'
import { CharacterSelectRow } from '@/components/preset/CharacterSelectRow'
import { Character } from '@/types'

export default function CharactersScreen() {
  const { selectedCharacters, toggleCharacter, getFilteredCharacters } = useScenarioStore()
  const [search, setSearch] = useState('')
  const [tab, setTab] = useState<'all' | 'custom'>('all')

  const characters = getFilteredCharacters(search)

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.back}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Select up to 8 characters</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.searchBar}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search characters"
          placeholderTextColor={COLORS.textSecondary}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <View style={styles.tabs}>
        {(['all', 'custom'] as const).map(t => (
          <TouchableOpacity
            key={t}
            style={[styles.tab, tab === t && styles.tabActive]}
            onPress={() => setTab(t)}
          >
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
              {t === 'all' ? 'All characters' : 'Custom characters'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={characters}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <CharacterSelectRow
            character={item}
            selected={selectedCharacters.some(c => c.id === item.id)}
            onToggle={() => toggleCharacter(item)}
          />
        )}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <Text style={styles.empty}>No characters found</Text>
        }
      />

      {selectedCharacters.length > 0 && (
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.continueButton}
            onPress={() => router.push('/preset/play-as')}
            activeOpacity={0.85}
          >
            <Text style={styles.continueText}>Continue ({selectedCharacters.length})</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12 },
  back: { color: COLORS.textPrimary, fontSize: 24, width: 40 },
  title: { color: COLORS.textPrimary, fontSize: 17, fontWeight: '700', flex: 1, textAlign: 'center' },
  searchBar: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 20, marginBottom: 14, backgroundColor: COLORS.surface2, borderRadius: 12, paddingHorizontal: 14 },
  searchIcon: { fontSize: 16, marginRight: 8 },
  searchInput: { flex: 1, color: COLORS.textPrimary, fontSize: 15, paddingVertical: 12 },
  tabs: { flexDirection: 'row', paddingHorizontal: 20, marginBottom: 4, gap: 8 },
  tab: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 999, backgroundColor: COLORS.surface2 },
  tabActive: { backgroundColor: COLORS.primary },
  tabText: { color: COLORS.textSecondary, fontSize: 13, fontWeight: '600' },
  tabTextActive: { color: '#fff' },
  empty: { color: COLORS.textSecondary, textAlign: 'center', marginTop: 40 },
  footer: { padding: 20, borderTopWidth: 1, borderTopColor: COLORS.divider },
  continueButton: { backgroundColor: COLORS.primary, borderRadius: 999, paddingVertical: 16, alignItems: 'center' },
  continueText: { color: '#fff', fontSize: 16, fontWeight: '700' },
})
