import React from 'react'
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Image } from 'react-native'
import { router, useLocalSearchParams } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { COLORS } from '@/constants/colors'
import { getScenarioById } from '@/constants/scenarios'
import { useScenarioStore } from '@/store/scenarioStore'
import { Avatar } from '@/components/common/Avatar'

export default function ScenarioDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const scenario = getScenarioById(id)
  const { loadScenario } = useScenarioStore()

  if (!scenario) {
    return (
      <SafeAreaView style={styles.safe}>
        <Text style={styles.error}>Scenario not found</Text>
      </SafeAreaView>
    )
  }

  const handlePlay = () => {
    loadScenario(id)
    router.push('/preset/play-as')
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Hero image */}
        <View style={styles.heroContainer}>
          <Image source={{ uri: scenario.coverImage }} style={styles.hero} />
          <View style={styles.heroOverlay} />
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Text style={styles.backText}>←</Text>
          </TouchableOpacity>
          <View style={styles.heroBadge}>
            <Text style={styles.heroBadgeText}>{scenario.category}</Text>
          </View>
        </View>

        <View style={styles.content}>
          <Text style={styles.title}>{scenario.name}</Text>
          <Text style={styles.desc}>{scenario.description}</Text>

          <View style={styles.statsRow}>
            <Text style={styles.stat}>👥 {scenario.playerCount.toLocaleString()} playing</Text>
            <Text style={styles.stat}>🎭 {scenario.defaultCharacters.length} characters</Text>
          </View>

          {/* Characters */}
          <Text style={styles.sectionTitle}>Characters</Text>
          {scenario.defaultCharacters.map(char => (
            <View key={char.id} style={styles.charRow}>
              <Avatar uri={char.avatar} size={48} />
              <View style={styles.charInfo}>
                <View style={styles.charNameRow}>
                  <Text style={styles.charName}>{char.name}</Text>
                  {char.isVerified && <Text style={styles.verified}> ✓</Text>}
                </View>
                <Text style={styles.charHandle}>@{char.handle}</Text>
                <Text style={styles.charBio} numberOfLines={2}>{char.bio}</Text>
              </View>
            </View>
          ))}

          <View style={{ height: 100 }} />
        </View>
      </ScrollView>

      {/* Play button */}
      <View style={styles.playContainer}>
        <TouchableOpacity style={styles.playButton} onPress={handlePlay} activeOpacity={0.85}>
          <Text style={styles.playText}>▶  Play Now</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  error: { color: COLORS.textPrimary, textAlign: 'center', marginTop: 100 },
  heroContainer: { height: 260, position: 'relative' },
  hero: { width: '100%', height: '100%' },
  heroOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.4)' },
  backBtn: { position: 'absolute', top: 16, left: 16, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 999, width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  backText: { color: '#fff', fontSize: 18 },
  heroBadge: { position: 'absolute', top: 16, right: 16, backgroundColor: 'rgba(59,130,246,0.6)', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6 },
  heroBadgeText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  content: { padding: 20 },
  title: { color: COLORS.textPrimary, fontSize: 26, fontWeight: '900', marginBottom: 8 },
  desc: { color: COLORS.textSecondary, fontSize: 15, lineHeight: 22, marginBottom: 16 },
  statsRow: { flexDirection: 'row', gap: 16, marginBottom: 24 },
  stat: { color: COLORS.textSecondary, fontSize: 13 },
  sectionTitle: { color: COLORS.textPrimary, fontSize: 18, fontWeight: '700', marginBottom: 14 },
  charRow: { flexDirection: 'row', marginBottom: 16 },
  charInfo: { flex: 1, marginLeft: 12 },
  charNameRow: { flexDirection: 'row', alignItems: 'center' },
  charName: { color: COLORS.textPrimary, fontSize: 15, fontWeight: '700' },
  verified: { color: COLORS.verified, fontSize: 14 },
  charHandle: { color: COLORS.textSecondary, fontSize: 13, marginBottom: 2 },
  charBio: { color: COLORS.textSecondary, fontSize: 13, lineHeight: 17 },
  playContainer: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: COLORS.background, padding: 20, borderTopWidth: 1, borderTopColor: COLORS.divider },
  playButton: { backgroundColor: COLORS.primary, borderRadius: 999, paddingVertical: 16, alignItems: 'center' },
  playText: { color: '#fff', fontSize: 17, fontWeight: '700' },
})
