import React, { useState } from 'react'
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, TextInput } from 'react-native'
import { router } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { COLORS } from '@/constants/colors'
import { FANDOMS } from '@/constants/fandoms'
import { useScenarioStore } from '@/store/scenarioStore'

export default function FandomScreen() {
  const { setFandom } = useScenarioStore()
  const [search, setSearch] = useState('')
  const [tab, setTab] = useState<'popular' | 'trending'>('popular')

  const filtered = FANDOMS.filter(f =>
    !search || f.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.back}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>What fandom is your world in?</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.searchBar}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search fandoms..."
          placeholderTextColor={COLORS.textSecondary}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <View style={styles.tabs}>
        {(['popular', 'trending'] as const).map(t => (
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

      <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
        {filtered.map(fandom => (
          <TouchableOpacity
            key={fandom.id}
            style={styles.fandomRow}
            onPress={() => {
              setFandom(fandom.id)
              router.push('/preset/characters')
            }}
            activeOpacity={0.8}
          >
            <Text style={styles.fandomEmoji}>{fandom.emoji}</Text>
            <View style={styles.fandomInfo}>
              <Text style={styles.fandomName}>{fandom.name}</Text>
              <Text style={styles.fandomCount}>{fandom.worldCount} worlds</Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>
        ))}
        <View style={{ height: 20 }} />
      </ScrollView>

      <View style={styles.skipContainer}>
        <TouchableOpacity
          style={styles.skipButton}
          onPress={() => {
            setFandom(null)
            router.push('/preset/characters')
          }}
        >
          <Text style={styles.skipText}>I don't know (skip)</Text>
        </TouchableOpacity>
        <Text style={styles.skipSubtext}>We'll determine the fandom from the characters you pick</Text>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 8, paddingBottom: 16 },
  back: { color: COLORS.textPrimary, fontSize: 24, width: 40 },
  title: { color: COLORS.textPrimary, fontSize: 17, fontWeight: '700', flex: 1, textAlign: 'center' },
  searchBar: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 20, marginBottom: 14, backgroundColor: COLORS.surface2, borderRadius: 12, paddingHorizontal: 14 },
  searchIcon: { fontSize: 16, marginRight: 8 },
  searchInput: { flex: 1, color: COLORS.textPrimary, fontSize: 15, paddingVertical: 12 },
  tabs: { flexDirection: 'row', paddingHorizontal: 20, marginBottom: 8, gap: 8 },
  tab: { paddingHorizontal: 18, paddingVertical: 8, borderRadius: 999, backgroundColor: COLORS.surface2 },
  tabActive: { backgroundColor: COLORS.primary },
  tabText: { color: COLORS.textSecondary, fontSize: 14, fontWeight: '600' },
  tabTextActive: { color: '#fff' },
  list: { flex: 1 },
  fandomRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: COLORS.divider },
  fandomEmoji: { fontSize: 28, marginRight: 14, width: 36 },
  fandomInfo: { flex: 1 },
  fandomName: { color: COLORS.textPrimary, fontSize: 16, fontWeight: '600' },
  fandomCount: { color: COLORS.textSecondary, fontSize: 13, marginTop: 2 },
  chevron: { color: COLORS.textSecondary, fontSize: 22 },
  skipContainer: { padding: 20, borderTopWidth: 1, borderTopColor: COLORS.divider },
  skipButton: { backgroundColor: COLORS.surface2, borderRadius: 999, paddingVertical: 14, alignItems: 'center', marginBottom: 8 },
  skipText: { color: COLORS.textSecondary, fontSize: 15 },
  skipSubtext: { color: COLORS.textSecondary, fontSize: 12, textAlign: 'center' },
})
