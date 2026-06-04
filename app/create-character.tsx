import React, { useState } from 'react'
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, TextInput, Switch } from 'react-native'
import { router } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { COLORS } from '@/constants/colors'
import { Avatar } from '@/components/common/Avatar'
import { useScenarioStore } from '@/store/scenarioStore'
import { Character } from '@/types'
import { generateId } from '@/utils/generateId'

const FOLLOWER_PRESETS = [
  { label: '1K+', value: 1000 },
  { label: '5K+', value: 5000 },
  { label: '10K+', value: 10000 },
  { label: '20K+', value: 20000 },
  { label: '50K+', value: 50000 },
  { label: '100K+', value: 100000 },
]

export default function CreateCharacterScreen() {
  const { toggleCharacter } = useScenarioStore()
  const [name, setName] = useState('')
  const [handle, setHandle] = useState('')
  const [gender, setGender] = useState<'male' | 'female' | 'nonbinary'>('female')
  const [bio, setBio] = useState('')
  const [description, setDescription] = useState('')
  const [followerCount, setFollowerCount] = useState(5000)
  const [isPublic, setIsPublic] = useState(false)

  const handleCreate = () => {
    if (!name.trim() || !handle.trim()) return
    const character: Character = {
      id: `custom_${generateId()}`,
      name: name.trim(),
      handle: handle.replace('@', '').trim(),
      avatar: `https://i.pravatar.cc/150?u=${handle.trim()}`,
      bio: bio.trim() || `${name.trim()} — custom character`,
      description: description.trim(),
      fandom: null,
      followerCount,
      isVerified: false,
      isPlayerControlled: false,
      controlledByUserId: null,
    }
    toggleCharacter(character)
    router.back()
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.back}>✕</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Create Character</Text>
        <TouchableOpacity
          onPress={handleCreate}
          disabled={!name.trim() || !handle.trim()}
        >
          <Text style={[styles.create, name.trim() && handle.trim() && styles.createActive]}>
            Create
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Avatar */}
        <View style={styles.avatarSection}>
          <View style={styles.avatarPlaceholder}>
            <Avatar uri={`https://i.pravatar.cc/100?u=${handle || 'new'}`} size={80} ring />
          </View>
          <Text style={styles.avatarHint}>Avatar auto-generated from handle</Text>
        </View>

        {/* Name */}
        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Name</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Character name"
            placeholderTextColor="#9CA3AF"
          />
        </View>

        {/* Handle */}
        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Handle</Text>
          <TextInput
            style={styles.input}
            value={handle}
            onChangeText={(t) => setHandle(t.startsWith('@') ? t : `@${t}`)}
            placeholder="@handle"
            placeholderTextColor="#9CA3AF"
            autoCapitalize="none"
          />
        </View>

        {/* Gender */}
        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Gender</Text>
          <View style={styles.genderRow}>
            {(['male', 'female', 'nonbinary'] as const).map(g => (
              <TouchableOpacity
                key={g}
                style={[styles.genderChip, gender === g && styles.genderChipActive]}
                onPress={() => setGender(g)}
              >
                <Text style={[styles.genderText, gender === g && styles.genderTextActive]}>
                  {g === 'nonbinary' ? 'Non-binary' : g.charAt(0).toUpperCase() + g.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Bio */}
        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Profile bio</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={bio}
            onChangeText={setBio}
            placeholder="Short bio shown on profile..."
            placeholderTextColor="#9CA3AF"
            multiline
          />
        </View>

        {/* Follower count */}
        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Follower count</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {FOLLOWER_PRESETS.map(p => (
              <TouchableOpacity
                key={p.value}
                style={[styles.followerChip, followerCount === p.value && styles.followerChipActive]}
                onPress={() => setFollowerCount(p.value)}
              >
                <Text style={[styles.followerChipText, followerCount === p.value && styles.followerChipTextActive]}>
                  {p.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Description */}
        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Additional description</Text>
          <Text style={styles.fieldHint}>Influences this character's in-game personality and behavior</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={description}
            onChangeText={setDescription}
            placeholder="Personality traits, backstory, how they act..."
            placeholderTextColor="#9CA3AF"
            multiline
          />
        </View>

        {/* Public toggle */}
        <View style={styles.field}>
          <View style={styles.toggleRow}>
            <View>
              <Text style={styles.fieldLabel}>Make character public</Text>
              <Text style={styles.fieldHint}>Allow others to find and add to their worlds</Text>
            </View>
            <Switch
              value={isPublic}
              onValueChange={setIsPublic}
              trackColor={{ false: '#2A2A2A', true: '#3B82F6' }}
              thumbColor="#fff"
            />
          </View>
        </View>

        <View style={{ height: 80 }} />
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0A0A0A' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#2A2A2A' },
  back: { color: '#fff', fontSize: 20, width: 40 },
  title: { color: '#fff', fontSize: 17, fontWeight: '700' },
  create: { color: '#9CA3AF', fontSize: 16, fontWeight: '600' },
  createActive: { color: '#3B82F6' },
  scroll: { flex: 1 },
  avatarSection: { alignItems: 'center', paddingVertical: 24 },
  avatarPlaceholder: {},
  avatarHint: { color: '#9CA3AF', fontSize: 12, marginTop: 8 },
  field: { paddingHorizontal: 20, marginBottom: 20 },
  fieldLabel: { color: '#fff', fontSize: 15, fontWeight: '600', marginBottom: 6 },
  fieldHint: { color: '#9CA3AF', fontSize: 12, marginBottom: 8 },
  input: { backgroundColor: '#1A1A1A', borderRadius: 12, padding: 14, color: '#fff', fontSize: 15, borderWidth: 1, borderColor: '#2A2A2A' },
  textArea: { minHeight: 80, textAlignVertical: 'top' },
  genderRow: { flexDirection: 'row', gap: 10 },
  genderChip: { flex: 1, paddingVertical: 10, borderRadius: 999, backgroundColor: '#1A1A1A', alignItems: 'center', borderWidth: 1.5, borderColor: '#2A2A2A' },
  genderChipActive: { borderColor: '#3B82F6', backgroundColor: 'rgba(59,130,246,0.1)' },
  genderText: { color: '#9CA3AF', fontSize: 13, fontWeight: '600' },
  genderTextActive: { color: '#fff' },
  followerChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 999, backgroundColor: '#1A1A1A', marginRight: 8, borderWidth: 1.5, borderColor: '#2A2A2A' },
  followerChipActive: { borderColor: '#3B82F6', backgroundColor: 'rgba(59,130,246,0.1)' },
  followerChipText: { color: '#9CA3AF', fontSize: 13, fontWeight: '600' },
  followerChipTextActive: { color: '#3B82F6' },
  toggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
})
