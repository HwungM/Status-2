import React, { useState } from 'react'
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  TextInput, ActivityIndicator, Alert, PanResponder,
} from 'react-native'
import { router } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { COLORS } from '@/constants/colors'
import { useScenarioStore } from '@/store/scenarioStore'
import { LocalWorldSessionService } from '@/services/worldSessionService'
import { generateWorldInspiration } from '@/services/openaiService'
import { useGameStore } from '@/store/gameStore'

export default function WorldSetupScreen() {
  const {
    selectedCharacters, playerCharacterId, firstFollowerCharacterId,
    firstFollowerChemistry, mainGoal, worldSetting, difficulty, madnessScale,
    setMainGoal, setWorldSetting, setDifficulty, setMadnessScale,
    selectedFandom,
  } = useScenarioStore()

  const { loadSession } = useGameStore()
  const [loading, setLoading] = useState(false)
  const [inspirationLoading, setInspirationLoading] = useState(false)
  const [inspirations, setInspirations] = useState<string[]>([])
  const [showInspirations, setShowInspirations] = useState(false)

  const handleGetInspiration = async () => {
    setInspirationLoading(true)
    setShowInspirations(true)
    try {
      const options = await generateWorldInspiration(selectedFandom, selectedCharacters.slice(0, 4))
      setInspirations(options)
    } catch (e: any) {
      Alert.alert('Error', e.message)
    } finally {
      setInspirationLoading(false)
    }
  }

  const handleCreate = async () => {
    if (!playerCharacterId || selectedCharacters.length === 0) {
      Alert.alert('Missing info', 'Please complete all previous steps')
      return
    }
    setLoading(true)
    try {
      const session = await LocalWorldSessionService.createSession({
        scenarioId: null,
        characters: selectedCharacters,
        playerCharacterId,
        firstFollowerCharacterId: firstFollowerCharacterId || selectedCharacters.find(c => c.id !== playerCharacterId)?.id || '',
        firstFollowerChemistry,
        mainGoal: mainGoal || 'Become the most iconic person in this world',
        worldSetting: worldSetting || `A dramatic world where social media clout is the ultimate currency. ${selectedCharacters.slice(0, 3).map(c => c.name).join(', ')} are all players in a game where every post counts.`,
        fandom: selectedFandom,
        difficulty,
        madnessScale,
      })
      await loadSession(session.id)
      router.push('/loading')
    } catch (e: any) {
      Alert.alert('Error creating world', e.message)
    } finally {
      setLoading(false)
    }
  }

  const [trackWidth, setTrackWidth] = useState(0)

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: (e) => {
      if (trackWidth <= 0) return
      const x = e.nativeEvent.locationX
      const val = Math.round(Math.min(100, Math.max(0, (x / trackWidth) * 100)))
      setMadnessScale(val)
    },
    onPanResponderMove: (e) => {
      if (trackWidth <= 0) return
      const x = e.nativeEvent.locationX
      const val = Math.round(Math.min(100, Math.max(0, (x / trackWidth) * 100)))
      setMadnessScale(val)
    },
  })

  const madnessEmoji =
    madnessScale <= 20 ? '🧘' :
    madnessScale <= 50 ? '😏' :
    madnessScale <= 80 ? '🤯' : '🤪'

  const madnessLabel =
    madnessScale <= 20 ? 'Realistic' :
    madnessScale <= 50 ? 'Heightened' :
    madnessScale <= 80 ? 'Chaotic' : 'Bonkers'

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.back}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Set up your world</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Main goal */}
        <View style={styles.section}>
          <Text style={styles.label}>Your main character goal</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Become the most iconic person in your world"
            placeholderTextColor="#9CA3AF"
            value={mainGoal}
            onChangeText={setMainGoal}
            multiline
          />
        </View>

        {/* World setting */}
        <View style={styles.section}>
          <View style={styles.labelRow}>
            <Text style={styles.label}>My world setting</Text>
            <TouchableOpacity
              style={styles.inspirationBtn}
              onPress={handleGetInspiration}
              disabled={inspirationLoading}
            >
              {inspirationLoading
                ? <ActivityIndicator size="small" color="#3B82F6" />
                : <Text style={styles.inspirationText}>✨ Inspiration</Text>
              }
            </TouchableOpacity>
          </View>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Describe your world setting. The AI reads this and generates everything from it..."
            placeholderTextColor="#9CA3AF"
            value={worldSetting}
            onChangeText={setWorldSetting}
            multiline
            numberOfLines={5}
          />
          <Text style={styles.charCount}>{worldSetting.length} chars</Text>

          {showInspirations && (
            <View style={styles.inspirationsList}>
              {inspirationLoading ? (
                <Text style={styles.loadingText}>Generating options...</Text>
              ) : (
                inspirations.map((opt, i) => (
                  <TouchableOpacity
                    key={i}
                    style={styles.inspirationOption}
                    onPress={() => {
                      setWorldSetting(opt)
                      setShowInspirations(false)
                    }}
                  >
                    <Text style={styles.inspirationOptionText}>{opt}</Text>
                  </TouchableOpacity>
                ))
              )}
            </View>
          )}
        </View>

        {/* Difficulty */}
        <View style={styles.section}>
          <Text style={styles.label}>Difficulty</Text>
          <View style={styles.difficultyRow}>
            {([
              { id: 'easy', label: 'Easy 😌', desc: 'Forgiving' },
              { id: 'normal', label: 'Normal ⚖️', desc: 'Balanced' },
              { id: 'hard', label: 'Hard 😵', desc: 'Brutal' },
            ] as const).map(d => (
              <TouchableOpacity
                key={d.id}
                style={[styles.difficultyCard, difficulty === d.id && styles.difficultyCardActive]}
                onPress={() => setDifficulty(d.id)}
              >
                <Text style={styles.difficultyLabel}>{d.label}</Text>
                <Text style={styles.difficultyDesc}>{d.desc}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Madness scale */}
        <View style={styles.section}>
          <View style={styles.madnessHeader}>
            <Text style={styles.label}>Madness Scale</Text>
            <View style={styles.madnessBadge}>
              <Text style={styles.madnessBadgeText}>{madnessEmoji} {madnessLabel}</Text>
            </View>
          </View>
          <View style={styles.sliderLabels}>
            <Text style={styles.sliderLabel}>🧘 Realistic</Text>
            <Text style={styles.sliderValue}>{madnessScale}</Text>
            <Text style={styles.sliderLabel}>🤪 Bonkers</Text>
          </View>
          <View
            style={styles.sliderTrack}
            onLayout={e => setTrackWidth(e.nativeEvent.layout.width)}
            {...panResponder.panHandlers}
          >
            <View style={[styles.sliderFill, { width: `${madnessScale}%` }]} />
            <View style={[styles.sliderThumb, { left: `${madnessScale}%` }]} />
          </View>
          <Text style={styles.madnessDesc}>
            {madnessScale <= 20 && 'Grounded drama. Consequences feel earned.'}
            {madnessScale > 20 && madnessScale <= 50 && 'Exaggerated but believable. Drama escalates faster.'}
            {madnessScale > 50 && madnessScale <= 80 && 'Absurd twists. Characters do unhinged things.'}
            {madnessScale > 80 && 'Complete chaos. Anything goes. Maximum clout mayhem.'}
          </Text>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.createButton, loading && styles.createButtonDisabled]}
          onPress={handleCreate}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.createText}>🌍 Create world</Text>
          }
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0A0A0A' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12 },
  back: { color: '#fff', fontSize: 24, width: 40 },
  title: { color: '#fff', fontSize: 17, fontWeight: '700', flex: 1, textAlign: 'center' },
  scroll: { flex: 1 },
  section: { paddingHorizontal: 20, marginBottom: 24 },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  label: { color: '#fff', fontSize: 15, fontWeight: '600', marginBottom: 8 },
  input: { backgroundColor: '#1A1A1A', borderRadius: 12, padding: 14, color: '#fff', fontSize: 15, borderWidth: 1, borderColor: '#2A2A2A' },
  textArea: { minHeight: 100, textAlignVertical: 'top' },
  charCount: { color: '#9CA3AF', fontSize: 12, marginTop: 4, textAlign: 'right' },
  inspirationBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1E3A5F', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6 },
  inspirationText: { color: '#93C5FD', fontSize: 13, fontWeight: '600' },
  inspirationsList: { backgroundColor: '#1A1A1A', borderRadius: 12, marginTop: 8, borderWidth: 1, borderColor: '#2A2A2A' },
  loadingText: { color: '#9CA3AF', padding: 16, textAlign: 'center' },
  inspirationOption: { padding: 14, borderBottomWidth: 1, borderBottomColor: '#2A2A2A' },
  inspirationOptionText: { color: '#fff', fontSize: 14, lineHeight: 20 },
  difficultyRow: { flexDirection: 'row', gap: 10 },
  difficultyCard: { flex: 1, backgroundColor: '#1A1A1A', borderRadius: 12, padding: 14, alignItems: 'center', borderWidth: 1.5, borderColor: '#2A2A2A' },
  difficultyCardActive: { borderColor: '#3B82F6', backgroundColor: 'rgba(59,130,246,0.1)' },
  difficultyLabel: { color: '#fff', fontSize: 13, fontWeight: '600', marginBottom: 2 },
  difficultyDesc: { color: '#9CA3AF', fontSize: 11 },
  madnessHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  madnessBadge: { backgroundColor: 'rgba(59,130,246,0.15)', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  madnessBadgeText: { color: '#93C5FD', fontSize: 12, fontWeight: '700' },
  madnessDesc: { color: '#9CA3AF', fontSize: 12, marginTop: 8 },
  sliderLabels: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  sliderLabel: { color: '#9CA3AF', fontSize: 12 },
  sliderValue: { color: '#3B82F6', fontSize: 13, fontWeight: '700' },
  sliderTrack: { height: 32, backgroundColor: '#1A1A1A', borderRadius: 16, overflow: 'visible', justifyContent: 'center', marginBottom: 2 },
  sliderFill: { position: 'absolute', left: 0, top: 8, height: 16, backgroundColor: '#3B82F6', borderRadius: 16 },
  sliderThumb: { position: 'absolute', top: 4, marginLeft: -12, width: 24, height: 24, borderRadius: 12, backgroundColor: '#fff', shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 4, elevation: 4 },
  footer: { padding: 20, borderTopWidth: 1, borderTopColor: '#2A2A2A' },
  createButton: { backgroundColor: '#3B82F6', borderRadius: 999, paddingVertical: 16, alignItems: 'center' },
  createButtonDisabled: { opacity: 0.6 },
  createText: { color: '#fff', fontSize: 16, fontWeight: '700' },
})
