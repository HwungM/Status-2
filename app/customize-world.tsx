import React, { useState, useEffect } from 'react'
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, TextInput, Alert, Clipboard } from 'react-native'
import { router } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { COLORS } from '@/constants/colors'
import { useGameStore } from '@/store/gameStore'
import { LocalWorldSessionService } from '@/services/worldSessionService'
import { InviteCodePill } from '@/components/multiplayer/InviteCodePill'
import { useUIStore } from '@/store/uiStore'

export default function CustomizeWorldScreen() {
  const { session, refreshSession } = useGameStore()
  const { showToast } = useUIStore()

  const [mainGoal, setMainGoal] = useState('')
  const [worldSetting, setWorldSetting] = useState('')
  const [difficulty, setDifficulty] = useState<'easy' | 'normal' | 'hard'>('normal')
  const [madnessScale, setMadnessScale] = useState(50)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (session) {
      setMainGoal(session.worldState.mainGoal)
      setWorldSetting(session.worldState.worldSetting)
      setDifficulty(session.worldState.difficulty)
      setMadnessScale(session.worldState.madnessScale)
    }
  }, [session?.id])

  const handleSave = async () => {
    if (!session) return
    setSaving(true)
    try {
      await LocalWorldSessionService.updateWorldState(session.id, {
        mainGoal,
        worldSetting,
        difficulty,
        madnessScale,
      })
      await refreshSession()
      showToast('World updated!', 'success')
      router.back()
    } catch (e: any) {
      showToast(e.message, 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleCopyCode = () => {
    if (session?.inviteCode) {
      Clipboard.setString(session.inviteCode)
      showToast('Invite code copied!', 'success')
    }
  }

  if (!session) return null

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.back}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Customize World</Text>
        <TouchableOpacity onPress={handleSave} disabled={saving}>
          <Text style={[styles.save, saving && styles.saveDisabled]}>
            {saving ? 'Saving...' : 'Save'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.label}>Your main character goal</Text>
          <TextInput
            style={styles.input}
            value={mainGoal}
            onChangeText={setMainGoal}
            placeholder="What do you want to achieve?"
            placeholderTextColor="#9CA3AF"
            multiline
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>My world setting</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={worldSetting}
            onChangeText={setWorldSetting}
            placeholder="Describe your world..."
            placeholderTextColor="#9CA3AF"
            multiline
            numberOfLines={5}
          />
          <Text style={styles.charCount}>{worldSetting.length} characters</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Difficulty</Text>
          <View style={styles.diffRow}>
            {(['easy', 'normal', 'hard'] as const).map(d => (
              <TouchableOpacity
                key={d}
                style={[styles.diffCard, difficulty === d && styles.diffCardActive]}
                onPress={() => setDifficulty(d)}
              >
                <Text style={styles.diffLabel}>
                  {d === 'easy' ? '😌 Easy' : d === 'normal' ? '⚖️ Normal' : '😵 Hard'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Madness Scale</Text>
          <View style={styles.sliderLabels}>
            <Text style={styles.sliderLabel}>🧘 Realistic</Text>
            <Text style={styles.sliderValue}>{madnessScale}/100</Text>
            <Text style={styles.sliderLabel}>🤪 Bonkers</Text>
          </View>
          <View style={styles.sliderTrack}>
            {[0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100].map(v => (
              <TouchableOpacity
                key={v}
                style={[styles.sliderDot, madnessScale >= v && styles.sliderDotActive]}
                onPress={() => setMadnessScale(v)}
              />
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <InviteCodePill code={session.inviteCode} onCopy={handleCopyCode} />
        </View>

        <View style={styles.section}>
          <TouchableOpacity
            style={styles.multiplayerBtn}
            onPress={() => showToast('Multiplayer coming soon! Your invite code is ready when it launches.', 'info')}
          >
            <Text style={styles.multiplayerBtnText}>🎮 Convert to Multiplayer</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0A0A0A' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#2A2A2A' },
  back: { color: '#fff', fontSize: 24 },
  title: { color: '#fff', fontSize: 17, fontWeight: '700' },
  save: { color: '#3B82F6', fontSize: 16, fontWeight: '600' },
  saveDisabled: { opacity: 0.5 },
  scroll: { flex: 1 },
  section: { paddingHorizontal: 20, marginBottom: 24, marginTop: 16 },
  label: { color: '#fff', fontSize: 15, fontWeight: '600', marginBottom: 8 },
  input: { backgroundColor: '#1A1A1A', borderRadius: 12, padding: 14, color: '#fff', fontSize: 15, borderWidth: 1, borderColor: '#2A2A2A' },
  textArea: { minHeight: 100, textAlignVertical: 'top' },
  charCount: { color: '#9CA3AF', fontSize: 12, marginTop: 4, textAlign: 'right' },
  diffRow: { flexDirection: 'row', gap: 10 },
  diffCard: { flex: 1, backgroundColor: '#1A1A1A', borderRadius: 12, padding: 14, alignItems: 'center', borderWidth: 1.5, borderColor: '#2A2A2A' },
  diffCardActive: { borderColor: '#3B82F6', backgroundColor: 'rgba(59,130,246,0.1)' },
  diffLabel: { color: '#fff', fontSize: 13, fontWeight: '600' },
  sliderLabels: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  sliderLabel: { color: '#9CA3AF', fontSize: 12 },
  sliderValue: { color: '#3B82F6', fontSize: 13, fontWeight: '700' },
  sliderTrack: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', height: 32 },
  sliderDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#2A2A2A' },
  sliderDotActive: { backgroundColor: '#3B82F6' },
  multiplayerBtn: { borderRadius: 12, paddingVertical: 16, alignItems: 'center', borderWidth: 2, borderColor: '#3B82F6', backgroundColor: 'rgba(59,130,246,0.1)' },
  multiplayerBtnText: { color: '#3B82F6', fontSize: 15, fontWeight: '700' },
})
