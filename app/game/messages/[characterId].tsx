import React, { useState, useEffect, useRef } from 'react'
import { View, Text, FlatList, TouchableOpacity, StyleSheet, TextInput, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native'
import { router, useLocalSearchParams } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { COLORS } from '@/constants/colors'
import { useGameStore } from '@/store/gameStore'
import { useAI } from '@/hooks/useAI'
import { Avatar } from '@/components/common/Avatar'

interface Message {
  id: string
  role: 'player' | 'npc'
  content: string
  createdAt: number
}

export default function DMScreen() {
  const { characterId } = useLocalSearchParams<{ characterId: string }>()
  const { session } = useGameStore()
  const { sendDM, isGenerating } = useAI()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const flatListRef = useRef<FlatList>(null)

  const character = session?.worldState.characters.find(c => c.id === characterId)
  const playerChar = session?.worldState.characters.find(
    c => c.id === session.players[0]?.characterId
  )

  const handleSend = async () => {
    if (!input.trim() || isGenerating) return
    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'player',
      content: input.trim(),
      createdAt: Date.now(),
    }
    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    setInput('')

    const history = newMessages.map(m => ({ role: m.role, content: m.content }))
    const response = await sendDM(characterId, history)

    if (response) {
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'npc',
        content: response,
        createdAt: Date.now(),
      }])
    }
  }

  useEffect(() => {
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100)
  }, [messages])

  if (!character) {
    return (
      <SafeAreaView style={styles.safe}>
        <Text style={styles.error}>Character not found</Text>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.back}>←</Text>
        </TouchableOpacity>
        <Avatar uri={character.avatar} size={36} />
        <View style={styles.headerInfo}>
          <Text style={styles.headerName}>{character.name}</Text>
          <Text style={styles.headerHandle}>@{character.handle}</Text>
        </View>
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <View style={[
              styles.bubble,
              item.role === 'player' ? styles.playerBubble : styles.npcBubble,
            ]}>
              <Text style={[
                styles.bubbleText,
                item.role === 'player' ? styles.playerBubbleText : styles.npcBubbleText,
              ]}>
                {item.content}
              </Text>
            </View>
          )}
          contentContainerStyle={styles.messageList}
          ListEmptyComponent={
            <View style={styles.emptyChat}>
              <Avatar uri={character.avatar} size={72} ring />
              <Text style={styles.emptyChatName}>{character.name}</Text>
              <Text style={styles.emptyChatDesc}>Start a conversation with {character.name}</Text>
              <Text style={styles.emptyChatBio}>{character.bio}</Text>
            </View>
          }
        />
        {isGenerating && (
          <View style={styles.typingIndicator}>
            <Text style={styles.typingText}>{character.name} is typing...</Text>
          </View>
        )}
        <View style={styles.inputBar}>
          <TextInput
            style={styles.input}
            placeholder={`Message ${character.name}...`}
            placeholderTextColor="#9CA3AF"
            value={input}
            onChangeText={setInput}
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            style={[styles.sendBtn, !input.trim() && styles.sendBtnDisabled]}
            onPress={handleSend}
            disabled={!input.trim() || isGenerating}
          >
            <Text style={styles.sendBtnText}>↑</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0A0A0A' },
  flex: { flex: 1 },
  error: { color: '#fff', textAlign: 'center', marginTop: 100 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#2A2A2A', gap: 12 },
  back: { color: '#fff', fontSize: 24 },
  headerInfo: { flex: 1 },
  headerName: { color: '#fff', fontSize: 16, fontWeight: '700' },
  headerHandle: { color: '#9CA3AF', fontSize: 13 },
  messageList: { padding: 16, paddingBottom: 8, flexGrow: 1 },
  bubble: { maxWidth: '80%', marginBottom: 10, borderRadius: 18, padding: 12, paddingHorizontal: 14 },
  playerBubble: { alignSelf: 'flex-end', backgroundColor: '#3B82F6' },
  npcBubble: { alignSelf: 'flex-start', backgroundColor: '#1A1A1A' },
  bubbleText: { fontSize: 15, lineHeight: 20 },
  playerBubbleText: { color: '#fff' },
  npcBubbleText: { color: '#fff' },
  emptyChat: { flex: 1, alignItems: 'center', paddingTop: 60, paddingHorizontal: 32 },
  emptyChatName: { color: '#fff', fontSize: 20, fontWeight: '800', marginTop: 16, marginBottom: 4 },
  emptyChatDesc: { color: '#9CA3AF', fontSize: 15, marginBottom: 12 },
  emptyChatBio: { color: '#9CA3AF', fontSize: 13, textAlign: 'center', lineHeight: 18 },
  typingIndicator: { paddingHorizontal: 20, paddingBottom: 4 },
  typingText: { color: '#9CA3AF', fontSize: 13, fontStyle: 'italic' },
  inputBar: { flexDirection: 'row', alignItems: 'flex-end', paddingHorizontal: 16, paddingVertical: 12, borderTopWidth: 1, borderTopColor: '#2A2A2A', gap: 10 },
  input: { flex: 1, backgroundColor: '#1A1A1A', borderRadius: 24, paddingHorizontal: 16, paddingVertical: 10, color: '#fff', fontSize: 15, maxHeight: 100 },
  sendBtn: { width: 42, height: 42, borderRadius: 21, backgroundColor: '#3B82F6', alignItems: 'center', justifyContent: 'center' },
  sendBtnDisabled: { backgroundColor: '#2A2A2A' },
  sendBtnText: { color: '#fff', fontSize: 18, fontWeight: '700' },
})
