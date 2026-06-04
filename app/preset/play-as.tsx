import React, { useState } from 'react'
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  TextInput, Alert,
} from 'react-native'
import { router } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { COLORS } from '@/constants/colors'
import { useScenarioStore } from '@/store/scenarioStore'
import { Character } from '@/types'
import { generateId } from '@/utils/generateId'
import { Avatar } from '@/components/common/Avatar'

const AVATAR_OPTIONS = [
  'https://i.pravatar.cc/150?img=1',
  'https://i.pravatar.cc/150?img=2',
  'https://i.pravatar.cc/150?img=3',
  'https://i.pravatar.cc/150?img=4',
  'https://i.pravatar.cc/150?img=5',
  'https://i.pravatar.cc/150?img=6',
  'https://i.pravatar.cc/150?img=7',
  'https://i.pravatar.cc/150?img=8',
  'https://i.pravatar.cc/150?img=9',
  'https://i.pravatar.cc/150?img=10',
  'https://i.pravatar.cc/150?img=11',
  'https://i.pravatar.cc/150?img=12',
]

export default function PlayAsScreen() {
  const { toggleCharacter, setPlayerCharacter } = useScenarioStore()

  const [name, setName] = useState('')
  const [handle, setHandle] = useState('')
  const [bio, setBio] = useState('')
  const [description, setDescription] = useState('')
  const [selectedAvatar, setSelectedAvatar] = useState(AVATAR_OPTIONS[0])

  const canContinue = name.trim().length > 0 && handle.trim().length > 0

  const handleContinue = () => {
    if (!canContinue) {
      Alert.alert('Required', 'Name and handle are required')
      return
    }
    const rawHandle = handle.replace('@', '').trim()
    const character: Character = {
      id: `custom_player_${generateId()}`,
      name: name.trim(),
      handle: rawHandle,
      avatar: selectedAvatar,
      bio: bio.trim() || `${name.trim()} — making moves in the celebrity world`,
      description: description.trim() || 'An ambitious newcomer trying to make it big.',
      fandom: 'celebrities',
      followerCount: 847,
      isVerified: false,
      isPlayerControlled: true,
      controlledByUserId: 'player_1',
    }
    toggleCharacter(character)
    setPlayerCharacter(character.id)
    router.push('/preset/first-follower')
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.back}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Create your character</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.subtitle}>
          You're a nobody with 847 followers. Build your empire from scratch.
        </Text>

        {/* Avatar picker */}
        <View style={styles.section}>
          <Text style={styles.label}>Pick your look</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.avatarScroll}>
            {AVATAR_OPTIONS.map(uri => (
              <TouchableOpacity key={uri} onPress={() => setSelectedAvatar(uri)} style={styles.avatarOption}>
                <Avatar uri={uri} size={64} ring={selectedAvatar === uri} />
                {selectedAvatar === uri && (
                  <View style={styles.avatarCheck}><Text style={styles.avatarCheckText}>✓</Text></View>
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Name */}
        <View style={styles.section}>
          <Text style={styles.label}>Your name <Text style={styles.required}>*</Text></Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Display name"
            placeholderTextColor="#6B7280"
          />
        </View>

        {/* Handle */}
        <View style={styles.section}>
          <Text style={styles.label}>Your handle <Text style={styles.required}>*</Text></Text>
          <TextInput
            style={styles.input}
            value={handle}
            onChangeText={t => setHandle(t.startsWith('@') ? t : `@${t}`)}
            placeholder="@yourhandle"
            placeholderTextColor="#6B7280"
            autoCapitalize="none"
          />
        </View>

        {/* Bio */}
        <View style={styles.section}>
          <Text style={styles.label}>Bio <Text style={styles.optional}>(optional)</Text></Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={bio}
            onChangeText={setBio}
            placeholder="Short bio shown on your profile..."
            placeholderTextColor="#6B7280"
            multiline
          />
        </View>

        {/* Personality */}
        <View style={styles.section}>
          <Text style={styles.label}>Your vibe / backstory <Text style={styles.optional}>(optional)</Text></Text>
          <Text style={styles.hint}>The AI uses this to shape how celebrities respond to you</Text>
          <TextInput
            style={[styles.input, styles.textAreaTall]}
            value={description}
            onChangeText={setDescription}
            placeholder={'How do you act? What\'s your angle?\n\ne.g. Chaotic, funny, always stirring drama. Ex-reality TV contestant trying to rebrand.'}
            placeholderTextColor="#6B7280"
            multiline
            numberOfLines={5}
          />
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.continueBtn, !canContinue && styles.continueBtnDisabled]}
          onPress={handleContinue}
          disabled={!canContinue}
          activeOpacity={0.85}
        >
          <Text style={styles.continueBtnText}>Continue →</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12 },
  back: { color: COLORS.textPrimary, fontSize: 24, width: 40 },
  title: { color: COLORS.textPrimary, fontSize: 17, fontWeight: '700', flex: 1, textAlign: 'center' },
  subtitle: { color: COLORS.textSecondary, fontSize: 14, paddingHorizontal: 20, marginBottom: 24, lineHeight: 20 },
  scroll: { flex: 1 },
  avatarScroll: { marginTop: 4 },
  section: { paddingHorizontal: 20, marginBottom: 20 },
  label: { color: '#fff', fontSize: 14, fontWeight: '600', marginBottom: 8 },
  required: { color: '#EF4444' },
  optional: { color: '#6B7280', fontWeight: '400' },
  hint: { color: '#6B7280', fontSize: 12, marginBottom: 8 },
  input: { backgroundColor: '#1A1A1A', borderRadius: 12, padding: 14, color: '#fff', fontSize: 15, borderWidth: 1, borderColor: '#2A2A2A' },
  textArea: { minHeight: 72, textAlignVertical: 'top' },
  textAreaTall: { minHeight: 100, textAlignVertical: 'top' },
  avatarOption: { marginRight: 10, alignItems: 'center' },
  avatarCheck: { position: 'absolute', bottom: 0, right: 0, backgroundColor: '#3B82F6', borderRadius: 999, width: 20, height: 20, alignItems: 'center', justifyContent: 'center' },
  avatarCheckText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  footer: { padding: 20, paddingBottom: 32, borderTopWidth: 1, borderTopColor: '#2A2A2A' },
  continueBtn: { backgroundColor: COLORS.primary, borderRadius: 999, paddingVertical: 18, alignItems: 'center' },
  continueBtnDisabled: { opacity: 0.4 },
  continueBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
})
