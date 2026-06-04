import React, { useState, useEffect, useRef } from 'react'
import { View, Text, FlatList, TouchableOpacity, StyleSheet, TextInput, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native'
import { router, useLocalSearchParams } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useGameStore } from '@/store/gameStore'
import { useAI } from '@/hooks/useAI'
import { Avatar } from '@/components/common/Avatar'
import { LocalWorldSessionService } from '@/services/worldSessionService'
import { generateId } from '@/utils/generateId'
import { DMMessage } from '@/types'

export default function DMScreen() {
  const { characterId } = useLocalSearchParams<{ characterId: string }>()
  const { session } = useGameStore()
  const { sendDM, isGenerating } = useAI()
  const [messages, setMessages] = useState<DMMessage[]>([])
  const [input, setInput] = useState('')
  const [isLoaded, setIsLoaded] = useState(false)
  const [ghosted, setGhosted] = useState(false)
  const flatListRef = useRef<FlatList>(null)

  const character = session?.worldState.characters.find(c => c.id === characterId)
  const playerChar = session?.worldState.characters.find(
    c => c.id === session.players[0]?.characterId
  )

  // Load DM history on mount
  useEffect(() => {
    if (!session || !characterId) return
    LocalWorldSessionService.getDMHistory(session.id, characterId).then(history => {
      setMessages(history)
      setIsLoaded(true)
    })
  }, [session?.id, characterId])

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100)
    }
  }, [messages])

  const handleSend = async () => {
    if (!input.trim() || isGenerating || !session) return
    setGhosted(false)

    const userMsg: DMMessage = {
      id: generateId(),
      role: 'player',
      content: input.trim(),
      createdAt: Date.now(),
    }

    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    setInput('')

    // Persist player message
    await LocalWorldSessionService.addDMMessage(session.id, characterId, userMsg)

    const history = newMessages.map(m => ({ role: m.role, content: m.content }))
    const playerSlot = session.players[0]
    const response = await sendDM(characterId, history, playerSlot?.gameState.followerCount || 0)

    if (response) {
      const npcMsg: DMMessage = {
        id: generateId(),
        role: 'npc',
        content: response,
        createdAt: Date.now(),
      }
      setMessages(prev => [...prev, npcMsg])
      await LocalWorldSessionService.addDMMessage(session.id, characterId, npcMsg)
    } else {
      // Ghosted
      setGhosted(true)
    }
  }

  if (!character) {
    return (
      <SafeAreaView style={styles.safe}>
        <Text style={styles.error}>Character not found</Text>
      </SafeAreaView>
    )
  }

  if (!isLoaded) {
    return (
      <SafeAreaView style={styles.safe}>
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
        <View style={styles.loadingContainer}>
          <ActivityIndicator color="#3B82F6" />
        </View>
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
          <Text style={styles.headerSub}>
            {(character.followerCount / 1000000).toFixed(1)}M followers · {character.isVerified ? '✓ Verified' : 'Not verified'}
          </Text>
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
              <Text style={styles.emptyChatFollowers}>
                {character.followerCount >= 1000000
                  ? `${(character.followerCount / 1000000).toFixed(1)}M followers`
                  : `${(character.followerCount / 1000).toFixed(0)}K followers`}
              </Text>
              <Text style={styles.emptyChatDesc}>{character.bio}</Text>
              <Text style={styles.emptyChatHint}>
                {character.followerCount > 1000000
                  ? 'Big accounts don\'t always respond. Make it count.'
                  : 'Send a message to start the conversation.'}
              </Text>
            </View>
          }
        />
        {isGenerating && (
          <View style={styles.typingIndicator}>
            <Text style={styles.typingText}>{character.name} is typing...</Text>
          </View>
        )}
        {ghosted && !isGenerating && (
          <View style={styles.ghostedContainer}>
            <Text style={styles.ghostedText}>Left on read 👀</Text>
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
            style={[styles.sendBtn, (!input.trim() || isGenerating) && styles.sendBtnDisabled]}
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
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#2A2A2A', gap: 12 },
  back: { color: '#fff', fontSize: 24 },
  headerInfo: { flex: 1 },
  headerName: { color: '#fff', fontSize: 16, fontWeight: '700' },
  headerHandle: { color: '#9CA3AF', fontSize: 13 },
  headerSub: { color: '#9CA3AF', fontSize: 12 },
  messageList: { padding: 16, paddingBottom: 8, flexGrow: 1 },
  bubble: { maxWidth: '80%', marginBottom: 10, borderRadius: 18, padding: 12, paddingHorizontal: 14 },
  playerBubble: { alignSelf: 'flex-end', backgroundColor: '#3B82F6' },
  npcBubble: { alignSelf: 'flex-start', backgroundColor: '#1A1A1A' },
  bubbleText: { fontSize: 15, lineHeight: 20 },
  playerBubbleText: { color: '#fff' },
  npcBubbleText: { color: '#fff' },
  emptyChat: { flex: 1, alignItems: 'center', paddingTop: 60, paddingHorizontal: 32 },
  emptyChatName: { color: '#fff', fontSize: 20, fontWeight: '800', marginTop: 16, marginBottom: 4 },
  emptyChatFollowers: { color: '#9CA3AF', fontSize: 13, marginBottom: 8 },
  emptyChatDesc: { color: '#9CA3AF', fontSize: 14, textAlign: 'center', lineHeight: 20, marginBottom: 16 },
  emptyChatHint: { color: '#4B5563', fontSize: 13, textAlign: 'center', fontStyle: 'italic' },
  typingIndicator: { paddingHorizontal: 20, paddingBottom: 4 },
  typingText: { color: '#9CA3AF', fontSize: 13, fontStyle: 'italic' },
  ghostedContainer: { paddingHorizontal: 20, paddingBottom: 4, alignItems: 'center' },
  ghostedText: { color: '#6B7280', fontSize: 13 },
  inputBar: { flexDirection: 'row', alignItems: 'flex-end', paddingHorizontal: 16, paddingVertical: 12, borderTopWidth: 1, borderTopColor: '#2A2A2A', gap: 10 },
  input: { flex: 1, backgroundColor: '#1A1A1A', borderRadius: 24, paddingHorizontal: 16, paddingVertical: 10, color: '#fff', fontSize: 15, maxHeight: 100 },
  sendBtn: { width: 42, height: 42, borderRadius: 21, backgroundColor: '#3B82F6', alignItems: 'center', justifyContent: 'center' },
  sendBtnDisabled: { backgroundColor: '#2A2A2A' },
  sendBtnText: { color: '#fff', fontSize: 18, fontWeight: '700' },
})
