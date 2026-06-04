import React, { useState } from 'react'
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  TextInput, Modal, ScrollView, Alert,
} from 'react-native'
import { router } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { COLORS } from '@/constants/colors'
import { useScenarioStore } from '@/store/scenarioStore'
import { CharacterSelectRow } from '@/components/preset/CharacterSelectRow'
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
  const { selectedCharacters, playerCharacterId, setPlayerCharacter, toggleCharacter } = useScenarioStore()

  const [showModal, setShowModal] = useState(false)
  const [name, setName] = useState('')
  const [handle, setHandle] = useState('')
  const [bio, setBio] = useState('')
  const [description, setDescription] = useState('')
  const [selectedAvatar, setSelectedAvatar] = useState(AVATAR_OPTIONS[0])

  const handleCreateAndPlay = () => {
    if (!name.trim() || !handle.trim()) {
      Alert.alert('Required', 'Name and handle are required')
      return
    }
    const rawHandle = handle.replace('@', '').trim()
    const character: Character = {
      id: `custom_player_${generateId()}`,
      name: name.trim(),
      handle: rawHandle,
      avatar: selectedAvatar,
      bio: bio.trim() || `${name.trim()} — custom character`,
      description: description.trim(),
      fandom: null,
      followerCount: 1000,
      isVerified: false,
      isPlayerControlled: true,
      controlledByUserId: 'player_1',
    }
    toggleCharacter(character)
    setPlayerCharacter(character.id)
    setShowModal(false)
    router.push('/preset/first-follower')
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.back}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Who do you want to play as?</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Create custom character CTA */}
      <TouchableOpacity style={styles.createCta} onPress={() => setShowModal(true)} activeOpacity={0.8}>
        <Text style={styles.createCtaIcon}>✨</Text>
        <View style={styles.createCtaText}>
          <Text style={styles.createCtaTitle}>Create my own character</Text>
          <Text style={styles.createCtaSubtitle}>Build yourself from scratch</Text>
        </View>
        <Text style={styles.createCtaArrow}>→</Text>
      </TouchableOpacity>

      <Text style={styles.orLabel}>— or play as —</Text>

      <FlatList
        data={selectedCharacters}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <CharacterSelectRow
            character={item}
            selected={playerCharacterId === item.id}
            onToggle={() => setPlayerCharacter(item.id)}
            showRadio
          />
        )}
        showsVerticalScrollIndicator={false}
      />

      {playerCharacterId && !showModal && (
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.continueButton}
            onPress={() => router.push('/preset/first-follower')}
            activeOpacity={0.85}
          >
            <Text style={styles.continueText}>Continue →</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Custom character modal */}
      <Modal visible={showModal} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modal}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowModal(false)}>
              <Text style={styles.modalCancel}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Create Your Character</Text>
            <TouchableOpacity onPress={handleCreateAndPlay} disabled={!name.trim() || !handle.trim()}>
              <Text style={[styles.modalDone, name.trim() && handle.trim() && styles.modalDoneActive]}>
                Play
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
            {/* Avatar picker */}
            <View style={styles.section}>
              <Text style={styles.label}>Pick your avatar</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {AVATAR_OPTIONS.map(uri => (
                  <TouchableOpacity key={uri} onPress={() => setSelectedAvatar(uri)} style={styles.avatarOption}>
                    <Avatar uri={uri} size={60} ring={selectedAvatar === uri} />
                    {selectedAvatar === uri && <View style={styles.avatarCheck}><Text style={styles.avatarCheckText}>✓</Text></View>}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Name */}
            <View style={styles.section}>
              <Text style={styles.label}>Your name</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Display name"
                placeholderTextColor="#9CA3AF"
              />
            </View>

            {/* Handle */}
            <View style={styles.section}>
              <Text style={styles.label}>Your handle</Text>
              <TextInput
                style={styles.input}
                value={handle}
                onChangeText={t => setHandle(t.startsWith('@') ? t : `@${t}`)}
                placeholder="@yourhandle"
                placeholderTextColor="#9CA3AF"
                autoCapitalize="none"
              />
            </View>

            {/* Bio */}
            <View style={styles.section}>
              <Text style={styles.label}>Profile bio</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={bio}
                onChangeText={setBio}
                placeholder="Short bio shown on your profile..."
                placeholderTextColor="#9CA3AF"
                multiline
              />
            </View>

            {/* Personality */}
            <View style={styles.section}>
              <Text style={styles.label}>Your personality / backstory</Text>
              <Text style={styles.hint}>The AI uses this to shape how NPCs respond to you</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={description}
                onChangeText={setDescription}
                placeholder="How do you act? What's your vibe? What's your backstory?&#10;&#10;e.g. Chaotic, funny, always stirring drama. Recently went viral for the wrong reasons."
                placeholderTextColor="#9CA3AF"
                multiline
                numberOfLines={5}
              />
            </View>

            <View style={{ height: 60 }} />
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12 },
  back: { color: COLORS.textPrimary, fontSize: 24, width: 40 },
  title: { color: COLORS.textPrimary, fontSize: 17, fontWeight: '700', flex: 1, textAlign: 'center' },
  createCta: {
    flexDirection: 'row', alignItems: 'center',
    marginHorizontal: 20, marginBottom: 4,
    backgroundColor: 'rgba(59,130,246,0.12)',
    borderWidth: 1.5, borderColor: '#3B82F6',
    borderRadius: 16, padding: 16,
  },
  createCtaIcon: { fontSize: 24, marginRight: 12 },
  createCtaText: { flex: 1 },
  createCtaTitle: { color: '#fff', fontSize: 15, fontWeight: '700' },
  createCtaSubtitle: { color: '#93C5FD', fontSize: 12, marginTop: 2 },
  createCtaArrow: { color: '#3B82F6', fontSize: 18, fontWeight: '700' },
  orLabel: { color: '#6B7280', fontSize: 12, textAlign: 'center', marginVertical: 12 },
  footer: { padding: 20, borderTopWidth: 1, borderTopColor: COLORS.divider },
  continueButton: { backgroundColor: COLORS.primary, borderRadius: 999, paddingVertical: 16, alignItems: 'center' },
  continueText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  modal: { flex: 1, backgroundColor: '#0A0A0A' },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#2A2A2A' },
  modalCancel: { color: '#9CA3AF', fontSize: 16 },
  modalTitle: { color: '#fff', fontSize: 16, fontWeight: '700' },
  modalDone: { color: '#9CA3AF', fontSize: 16, fontWeight: '700' },
  modalDoneActive: { color: '#3B82F6' },
  modalScroll: { flex: 1 },
  section: { paddingHorizontal: 20, marginTop: 20 },
  label: { color: '#fff', fontSize: 14, fontWeight: '600', marginBottom: 8 },
  hint: { color: '#9CA3AF', fontSize: 12, marginBottom: 8 },
  input: { backgroundColor: '#1A1A1A', borderRadius: 12, padding: 14, color: '#fff', fontSize: 15, borderWidth: 1, borderColor: '#2A2A2A' },
  textArea: { minHeight: 80, textAlignVertical: 'top' },
  avatarOption: { marginRight: 10, alignItems: 'center' },
  avatarCheck: { position: 'absolute', bottom: 0, right: 0, backgroundColor: '#3B82F6', borderRadius: 999, width: 18, height: 18, alignItems: 'center', justifyContent: 'center' },
  avatarCheckText: { color: '#fff', fontSize: 10, fontWeight: '700' },
})
