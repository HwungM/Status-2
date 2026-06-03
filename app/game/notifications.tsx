import React from 'react'
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { COLORS } from '@/constants/colors'
import { useGameStore } from '@/store/gameStore'
import { Avatar } from '@/components/common/Avatar'
import { Notification } from '@/types'

const TYPE_ICONS: Record<Notification['type'], string> = {
  reply: '💬',
  reaction: '❤️',
  follower_milestone: '👥',
  activity_accepted: '🎉',
  scandal: '🔥',
  player_joined: '🎮',
}

export default function NotificationsScreen() {
  const { session } = useGameStore()
  const notifications = session?.sharedNotifications || []
  const allChars = session?.worldState.characters || []

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>Notifications</Text>
      </View>

      <FlatList
        data={notifications}
        keyExtractor={item => item.id}
        renderItem={({ item }) => {
          const char = allChars.find(c => c.id === item.sourceCharacterId)
          return (
            <View style={styles.notifRow}>
              <View style={styles.notifLeft}>
                <Avatar uri={char?.avatar} size={44} />
                <View style={styles.notifIcon}>
                  <Text style={styles.notifIconText}>{TYPE_ICONS[item.type]}</Text>
                </View>
              </View>
              <View style={styles.notifContent}>
                <Text style={styles.notifTitle}>
                  <Text style={styles.notifName}>{char?.name || 'Someone'} </Text>
                  <Text style={styles.notifAction}>{item.title}</Text>
                </Text>
                {item.preview && (
                  <Text style={styles.notifPreview} numberOfLines={2}>{item.preview}</Text>
                )}
              </View>
              {!item.isRead && <View style={styles.unreadDot} />}
            </View>
          )
        }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>🔔</Text>
            <Text style={styles.emptyTitle}>No notifications yet</Text>
            <Text style={styles.emptyDesc}>Start playing to see reactions and events</Text>
          </View>
        }
        contentContainerStyle={{ flexGrow: 1 }}
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0A0A0A' },
  header: { paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#2A2A2A' },
  title: { color: '#fff', fontSize: 22, fontWeight: '800' },
  notifRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#2A2A2A' },
  notifLeft: { position: 'relative', marginRight: 14 },
  notifIcon: { position: 'absolute', bottom: -4, right: -4, backgroundColor: '#0A0A0A', borderRadius: 10, width: 20, height: 20, alignItems: 'center', justifyContent: 'center' },
  notifIconText: { fontSize: 12 },
  notifContent: { flex: 1 },
  notifTitle: { color: '#fff', fontSize: 14, lineHeight: 20, marginBottom: 3 },
  notifName: { fontWeight: '700' },
  notifAction: { color: '#9CA3AF' },
  notifPreview: { color: '#9CA3AF', fontSize: 13, lineHeight: 17 },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#3B82F6', marginLeft: 8 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  emptyEmoji: { fontSize: 48, marginBottom: 16 },
  emptyTitle: { color: '#fff', fontSize: 18, fontWeight: '700', marginBottom: 8 },
  emptyDesc: { color: '#9CA3AF', fontSize: 15, textAlign: 'center' },
})
