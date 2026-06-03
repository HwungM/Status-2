import React from 'react'
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native'
import { router } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { COLORS } from '@/constants/colors'
import { useScenarioStore } from '@/store/scenarioStore'
import { CharacterSelectRow } from '@/components/preset/CharacterSelectRow'

export default function PlayAsScreen() {
  const { selectedCharacters, playerCharacterId, setPlayerCharacter } = useScenarioStore()

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.back}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Who do you want to play as?</Text>
        <View style={{ width: 40 }} />
      </View>

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

      {playerCharacterId && (
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.continueButton}
            onPress={() => router.push('/preset/first-follower')}
            activeOpacity={0.85}
          >
            <Text style={styles.continueText}>Continue</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12 },
  back: { color: COLORS.textPrimary, fontSize: 24, width: 40 },
  title: { color: COLORS.textPrimary, fontSize: 17, fontWeight: '700', flex: 1, textAlign: 'center' },
  footer: { padding: 20, borderTopWidth: 1, borderTopColor: COLORS.divider },
  continueButton: { backgroundColor: COLORS.primary, borderRadius: 999, paddingVertical: 16, alignItems: 'center' },
  continueText: { color: '#fff', fontSize: 16, fontWeight: '700' },
})
