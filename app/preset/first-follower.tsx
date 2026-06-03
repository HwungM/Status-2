import React, { useState } from 'react'
import { View, Text, FlatList, TouchableOpacity, StyleSheet, TextInput } from 'react-native'
import { router } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { COLORS } from '@/constants/colors'
import { useScenarioStore } from '@/store/scenarioStore'
import { CharacterSelectRow } from '@/components/preset/CharacterSelectRow'
import { RelationshipChips } from '@/components/preset/RelationshipChips'
import { ChemistryType } from '@/types'
import { Avatar } from '@/components/common/Avatar'

export default function FirstFollowerScreen() {
  const {
    selectedCharacters,
    playerCharacterId,
    firstFollowerCharacterId,
    firstFollowerChemistry,
    setFirstFollower,
    setFirstFollowerChemistry,
  } = useScenarioStore()

  const [search, setSearch] = useState('')

  const npcs = selectedCharacters.filter(c => c.id !== playerCharacterId)
  const filtered = search
    ? npcs.filter(c => c.name.toLowerCase().includes(search.toLowerCase()))
    : npcs

  const selectedFollower = npcs.find(c => c.id === firstFollowerCharacterId)

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.back}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>
          {selectedCharacters.find(c => c.id === playerCharacterId)?.name || 'Your character'}'s first follower?
        </Text>
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

      {selectedFollower && (
        <View style={styles.chemistryContainer}>
          <View style={styles.selectedFollower}>
            <Avatar uri={selectedFollower.avatar} size={36} />
            <Text style={styles.selectedName}>{selectedFollower.name}</Text>
          </View>
          <RelationshipChips
            selected={firstFollowerChemistry as ChemistryType}
            onSelect={(type) => setFirstFollowerChemistry(type)}
          />
        </View>
      )}

      <FlatList
        data={filtered}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <CharacterSelectRow
            character={item}
            selected={firstFollowerCharacterId === item.id}
            onToggle={() => setFirstFollower(item.id)}
            showRadio
          />
        )}
        showsVerticalScrollIndicator={false}
      />

      {firstFollowerCharacterId && (
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.playButton}
            onPress={() => router.push('/preset/world-setup')}
            activeOpacity={0.85}
          >
            <Text style={styles.playText}>Let's play! →</Text>
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
  title: { color: COLORS.textPrimary, fontSize: 16, fontWeight: '700', flex: 1, textAlign: 'center' },
  searchBar: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 20, marginBottom: 8, backgroundColor: '#222222', borderRadius: 12, paddingHorizontal: 14 },
  searchIcon: { fontSize: 16, marginRight: 8 },
  searchInput: { flex: 1, color: '#fff', fontSize: 15, paddingVertical: 12 },
  chemistryContainer: { backgroundColor: '#1A1A1A', marginHorizontal: 20, borderRadius: 16, padding: 14, marginBottom: 12 },
  selectedFollower: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  selectedName: { color: '#fff', fontSize: 15, fontWeight: '600', marginLeft: 10 },
  footer: { padding: 20, borderTopWidth: 1, borderTopColor: '#2A2A2A' },
  playButton: { backgroundColor: '#3B82F6', borderRadius: 999, paddingVertical: 16, alignItems: 'center' },
  playText: { color: '#fff', fontSize: 16, fontWeight: '700' },
})
