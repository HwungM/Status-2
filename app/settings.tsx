import React, { useState, useEffect } from 'react'
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, TextInput, Alert, ActivityIndicator } from 'react-native'
import { router } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { COLORS } from '@/constants/colors'
import { saveApiKey, testApiKey } from '@/services/openaiService'
import { LocalWorldSessionService } from '@/services/worldSessionService'
import { useGameStore } from '@/store/gameStore'
import { useUIStore } from '@/store/uiStore'

export default function SettingsScreen() {
  const { session } = useGameStore()
  const { showToast } = useUIStore()
  const [apiKey, setApiKey] = useState('')
  const [supabaseUrl, setSupabaseUrl] = useState('')
  const [supabaseKey, setSupabaseKey] = useState('')
  const [showApiKey, setShowApiKey] = useState(false)
  const [isTesting, setIsTesting] = useState(false)
  const [keyStatus, setKeyStatus] = useState<'idle' | 'ok' | 'error'>('idle')
  const [keyError, setKeyError] = useState('')

  useEffect(() => {
    AsyncStorage.multiGet(['clout:openai_key', 'clout:supabase_url', 'clout:supabase_key'])
      .then(pairs => {
        const map = Object.fromEntries(pairs.map(([k, v]) => [k, v || '']))
        setApiKey(map['clout:openai_key'])
        setSupabaseUrl(map['clout:supabase_url'])
        setSupabaseKey(map['clout:supabase_key'])
      })
  }, [])

  const handleSaveApiKey = async () => {
    const trimmed = apiKey.trim()
    if (!trimmed) {
      Alert.alert('Missing Key', 'Please enter your Gemini API key first.')
      return
    }
    await saveApiKey(trimmed)
    setKeyStatus('ok')
  }

  const handleClearData = () => {
    Alert.alert(
      'Clear all game data',
      'This will delete all your worlds and progress. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All Data',
          style: 'destructive',
          onPress: async () => {
            await LocalWorldSessionService.clearAllData()
            showToast('All data cleared', 'success')
            router.replace('/')
          },
        },
      ]
    )
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.back}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Settings</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.group}>
          <Text style={styles.groupTitle}>AI Configuration</Text>
          <View style={styles.inputRow}>
            <Text style={styles.inputLabel}>OpenAI API Key</Text>
            <Text style={styles.inputHint}>Powers all AI storytelling. Only sent to OpenAI. Never stored externally.</Text>
            <View style={styles.inputWithToggle}>
              <TextInput
                style={styles.input}
                value={apiKey}
                onChangeText={setApiKey}
                placeholder="sk-proj-..."
                placeholderTextColor="#9CA3AF"
                secureTextEntry={!showApiKey}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity style={styles.toggleBtn} onPress={() => setShowApiKey(!showApiKey)}>
                <Text style={styles.toggleBtnText}>{showApiKey ? '🙈' : '👁️'}</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={styles.saveBtn} onPress={handleSaveApiKey}>
              <Text style={styles.saveBtnText}>Save Key</Text>
            </TouchableOpacity>
            {keyStatus === 'ok' && (
              <Text style={styles.keyOk}>✅ Key saved! AI features are active.</Text>
            )}
          </View>
        </View>

        <View style={styles.group}>
          <Text style={styles.groupTitle}>Supabase (v2 — inactive)</Text>
          <View style={styles.inputRow}>
            <Text style={styles.inputLabel}>Supabase URL</Text>
            <TextInput
              style={styles.input}
              value={supabaseUrl}
              onChangeText={setSupabaseUrl}
              placeholder="https://xxx.supabase.co"
              placeholderTextColor="#9CA3AF"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>
          <View style={styles.inputRow}>
            <Text style={styles.inputLabel}>Supabase Anon Key</Text>
            <TextInput
              style={styles.input}
              value={supabaseKey}
              onChangeText={setSupabaseKey}
              placeholder="eyJ..."
              placeholderTextColor="#9CA3AF"
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>
          <Text style={styles.inactiveNote}>⚠️ Supabase is scaffolded but inactive in v1. Configure for multiplayer in v2.</Text>
        </View>

        <View style={styles.group}>
          <Text style={styles.groupTitle}>Data</Text>
          <TouchableOpacity style={styles.dangerBtn} onPress={handleClearData}>
            <Text style={styles.dangerBtnText}>🗑️ Clear all game data</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.group}>
          <Text style={styles.versionText}>Clout v1.0.0 — No energy. No gems. No limits.</Text>
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
  scroll: { flex: 1 },
  group: { paddingHorizontal: 20, marginTop: 28, marginBottom: 4 },
  groupTitle: { color: '#9CA3AF', fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 },
  inputRow: { marginBottom: 16 },
  inputLabel: { color: '#fff', fontSize: 15, fontWeight: '600', marginBottom: 4 },
  inputHint: { color: '#9CA3AF', fontSize: 12, marginBottom: 8 },
  inputWithToggle: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1A1A1A', borderRadius: 12, borderWidth: 1, borderColor: '#2A2A2A' },
  input: { flex: 1, color: '#fff', fontSize: 15, padding: 14, backgroundColor: '#1A1A1A', borderRadius: 12, borderWidth: 1, borderColor: '#2A2A2A' },
  toggleBtn: { paddingHorizontal: 14 },
  toggleBtnText: { fontSize: 18 },
  saveBtn: { backgroundColor: '#3B82F6', borderRadius: 999, paddingVertical: 10, alignItems: 'center', marginTop: 8 },
  saveBtnText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  inactiveNote: { color: '#9CA3AF', fontSize: 12, marginTop: 8, lineHeight: 18 },
  dangerBtn: { backgroundColor: '#1A1A1A', borderRadius: 12, paddingVertical: 16, alignItems: 'center', borderWidth: 1.5, borderColor: '#EF4444' },
  dangerBtnText: { color: '#EF4444', fontSize: 15, fontWeight: '600' },
  versionText: { color: '#9CA3AF', fontSize: 13, textAlign: 'center', paddingVertical: 8 },
  keyOk: { color: '#22C55E', fontSize: 13, marginTop: 8, textAlign: 'center' },
  keyErr: { color: '#EF4444', fontSize: 13, marginTop: 8, textAlign: 'center', lineHeight: 18 },
})
