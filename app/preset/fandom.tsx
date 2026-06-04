import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native'
import { router } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { COLORS } from '@/constants/colors'
import { useScenarioStore } from '@/store/scenarioStore'
import { CHARACTERS } from '@/constants/characters'

const CELEB_HIGHLIGHTS = [
  { name: 'Taylor Swift', handle: 'taylorswift13', followers: '270M' },
  { name: 'Nicki Minaj', handle: 'NICKIMINAJ', followers: '230M' },
  { name: 'Rihanna', handle: 'rihanna', followers: '150M' },
  { name: 'Drake', handle: 'Drake', followers: '145M' },
  { name: 'Billie Eilish', handle: 'BillieEilish', followers: '110M' },
  { name: 'Doja Cat', handle: 'DojaCat', followers: '95M' },
]

export default function FandomScreen() {
  const { setFandom, toggleCharacter, resetPreset } = useScenarioStore()

  const handleStart = () => {
    resetPreset()
    setFandom('celebrities')
    const celebs = CHARACTERS.filter(c => c.fandom === 'celebrities')
    celebs.forEach(c => toggleCharacter(c))
    router.push('/preset/play-as')
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.content}>
        <Text style={styles.logo}>CLOUT</Text>
        <Text style={styles.tagline}>The celebrity social media RPG</Text>

        <View style={styles.castPreview}>
          {CELEB_HIGHLIGHTS.map((c) => (
            <View key={c.handle} style={styles.celebChip}>
              <Text style={styles.celebName}>{c.name}</Text>
              <Text style={styles.celebFollowers}>{c.followers}</Text>
            </View>
          ))}
          <View style={styles.celebChip}>
            <Text style={styles.celebName}>+ more</Text>
            <Text style={styles.celebFollowers}>celebrities</Text>
          </View>
        </View>

        <View style={styles.rules}>
          <View style={styles.rule}>
            <Text style={styles.ruleIcon}>📱</Text>
            <Text style={styles.ruleText}>Create your character. Start with 847 followers.</Text>
          </View>
          <View style={styles.rule}>
            <Text style={styles.ruleIcon}>📈</Text>
            <Text style={styles.ruleText}>Post, reply, DM. Grow your follower count.</Text>
          </View>
          <View style={styles.rule}>
            <Text style={styles.ruleIcon}>🌟</Text>
            <Text style={styles.ruleText}>Big celebs will ignore you at first. Earn their attention.</Text>
          </View>
          <View style={styles.rule}>
            <Text style={styles.ruleIcon}>👑</Text>
            <Text style={styles.ruleText}>Hit your follower goal. Become a legend.</Text>
          </View>
        </View>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.startBtn} onPress={handleStart} activeOpacity={0.85}>
          <Text style={styles.startBtnText}>Create Your Character →</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  content: { flex: 1, paddingHorizontal: 24, paddingTop: 40, alignItems: 'center' },
  logo: { color: '#fff', fontSize: 48, fontWeight: '900', letterSpacing: 6, marginBottom: 4 },
  tagline: { color: COLORS.textSecondary, fontSize: 15, marginBottom: 40 },
  castPreview: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginBottom: 40 },
  celebChip: { backgroundColor: '#1A1A1A', borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1, borderColor: '#2A2A2A', alignItems: 'center' },
  celebName: { color: '#fff', fontSize: 13, fontWeight: '700' },
  celebFollowers: { color: COLORS.textSecondary, fontSize: 11 },
  rules: { width: '100%', gap: 16 },
  rule: { flexDirection: 'row', alignItems: 'flex-start', gap: 14 },
  ruleIcon: { fontSize: 22, width: 28 },
  ruleText: { color: '#D1D5DB', fontSize: 15, lineHeight: 22, flex: 1 },
  footer: { padding: 24, paddingBottom: 32 },
  startBtn: { backgroundColor: COLORS.primary, borderRadius: 999, paddingVertical: 18, alignItems: 'center' },
  startBtnText: { color: '#fff', fontSize: 17, fontWeight: '800', letterSpacing: 0.5 },
})
