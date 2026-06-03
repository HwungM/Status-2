import React, { useState } from 'react'
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, TextInput, Image, Dimensions } from 'react-native'
import { router } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { COLORS } from '@/constants/colors'
import { SCENARIOS, getFeaturedScenarios, getPopularScenarios } from '@/constants/scenarios'
import { Scenario } from '@/types'

const { width } = Dimensions.get('window')

function ScenarioRow({ scenario, onPress }: { scenario: Scenario; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.85}>
      <Image source={{ uri: scenario.coverImage }} style={styles.rowImage} />
      <View style={styles.rowInfo}>
        <View style={styles.rowBadge}>
          <Text style={styles.rowBadgeText}>{scenario.category}</Text>
        </View>
        <Text style={styles.rowTitle}>{scenario.name}</Text>
        <Text style={styles.rowDesc} numberOfLines={2}>{scenario.description}</Text>
        <Text style={styles.rowPlayers}>👥 {scenario.playerCount.toLocaleString()} playing</Text>
      </View>
    </TouchableOpacity>
  )
}

export default function ExploreScreen() {
  const [tab, setTab] = useState<'featured' | 'popular'>('featured')
  const [search, setSearch] = useState('')

  const scenarios = tab === 'featured' ? getFeaturedScenarios() : getPopularScenarios()
  const filtered = search
    ? SCENARIOS.filter(s => s.name.toLowerCase().includes(search.toLowerCase()))
    : scenarios

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.back}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Explore Worlds</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.searchBar}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search worlds..."
          placeholderTextColor={COLORS.textSecondary}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {!search && (
        <View style={styles.tabs}>
          {(['featured', 'popular'] as const).map(t => (
            <TouchableOpacity
              key={t}
              style={[styles.tab, tab === t && styles.tabActive]}
              onPress={() => setTab(t)}
            >
              <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
        {filtered.map(s => (
          <ScenarioRow
            key={s.id}
            scenario={s}
            onPress={() => router.push(`/scenario/${s.id}`)}
          />
        ))}
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16 },
  back: { color: COLORS.textPrimary, fontSize: 24 },
  title: { color: COLORS.textPrimary, fontSize: 18, fontWeight: '700' },
  searchBar: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 20, marginBottom: 16, backgroundColor: COLORS.surface2, borderRadius: 12, paddingHorizontal: 14 },
  searchIcon: { fontSize: 16, marginRight: 8 },
  searchInput: { flex: 1, color: COLORS.textPrimary, fontSize: 15, paddingVertical: 12 },
  tabs: { flexDirection: 'row', paddingHorizontal: 20, marginBottom: 8, gap: 8 },
  tab: { paddingHorizontal: 18, paddingVertical: 8, borderRadius: 999, backgroundColor: COLORS.surface2 },
  tabActive: { backgroundColor: COLORS.primary },
  tabText: { color: COLORS.textSecondary, fontSize: 14, fontWeight: '600' },
  tabTextActive: { color: '#fff' },
  list: { flex: 1 },
  row: { flexDirection: 'row', padding: 16, borderBottomWidth: 1, borderBottomColor: COLORS.divider },
  rowImage: { width: 80, height: 80, borderRadius: 12, backgroundColor: COLORS.surface2 },
  rowInfo: { flex: 1, marginLeft: 14 },
  rowBadge: { marginBottom: 4 },
  rowBadgeText: { color: COLORS.primary, fontSize: 11, fontWeight: '600' },
  rowTitle: { color: COLORS.textPrimary, fontSize: 16, fontWeight: '700', marginBottom: 4 },
  rowDesc: { color: COLORS.textSecondary, fontSize: 13, lineHeight: 18, marginBottom: 4 },
  rowPlayers: { color: COLORS.textSecondary, fontSize: 12 },
})
