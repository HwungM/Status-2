import React from 'react'
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Image } from 'react-native'
import { router } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { COLORS } from '@/constants/colors'
import { useGameStore } from '@/store/gameStore'
import { Avatar } from '@/components/common/Avatar'
import { StatBar } from '@/components/common/StatBar'
import { PostCard } from '@/components/feed/PostCard'
import { formatFollowerCount } from '@/utils/statHelpers'

export default function ProfileScreen() {
  const { session } = useGameStore()

  if (!session) return null

  const playerSlot = session.players[0]
  const gs = playerSlot?.gameState
  const playerChar = session.worldState.characters.find(c => c.id === playerSlot?.characterId)
  if (!gs || !playerChar) return null

  const playerPosts = session.sharedFeed.filter(p => p.isPlayerPost)
  const followerDelta = gs.actionLog.length > 0
    ? gs.actionLog.slice(-3).reduce((sum, a) => sum + a.followerDelta, 0)
    : 0

  const relationships = Object.entries(gs.relationships).map(([id, rel]) => ({
    id,
    char: session.worldState.characters.find(c => c.id === id),
    rel,
  })).filter(r => r.char)

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Blue banner */}
        <View style={styles.banner} />

        {/* Profile header */}
        <View style={styles.profileSection}>
          <View style={styles.profileTopRow}>
            <Avatar uri={playerChar.avatar} size={72} ring style={styles.profileAvatar} />
            <TouchableOpacity
              style={styles.editButton}
              onPress={() => router.push('/customize-world')}
            >
              <Text style={styles.editButtonText}>Edit details</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.displayName}>
            {playerChar.name}
            {playerChar.isVerified && <Text style={styles.verified}> ✓</Text>}
          </Text>
          <Text style={styles.handle}>@{playerChar.handle}</Text>
          <Text style={styles.bio}>{playerChar.bio}</Text>

          {/* Follower count */}
          <View style={styles.followerRow}>
            <Text style={styles.followerCount}>{formatFollowerCount(gs.followerCount)}</Text>
            <Text style={styles.followerLabel}> followers</Text>
            {followerDelta !== 0 && (
              <Text style={[styles.followerDelta, { color: followerDelta > 0 ? '#22C55E' : '#EF4444' }]}>
                {followerDelta > 0 ? ' +' : ' '}{followerDelta}
              </Text>
            )}
          </View>

          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.actionBtn} onPress={() => router.push('/game/feed' as any)}>
              <Text style={styles.actionBtnText}>📖 View Actions Log</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionBtn} onPress={() => router.push('/customize-world')}>
              <Text style={styles.actionBtnText}>⚙️ Customize World</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Stats */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Social Media Presence</Text>
          {Object.entries(gs.stats).map(([stat, value]) => (
            <StatBar
              key={stat}
              label={stat.charAt(0).toUpperCase() + stat.slice(1)}
              value={value}
              emoji={stat === 'humor' ? '😂' : stat === 'aura' ? '🌟' : stat === 'charisma' ? '✨' : '🔥'}
              color={stat === 'humor' ? '#F97316' : '#3B82F6'}
            />
          ))}
        </View>

        {/* Relationships */}
        {relationships.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Relationships ({relationships.length})</Text>
            {relationships.map(({ id, char, rel }) => (
              <TouchableOpacity
                key={id}
                style={styles.relCard}
                onPress={() => router.push(`/game/messages/${id}` as any)}
                activeOpacity={0.8}
              >
                <Avatar uri={char!.avatar} size={44} />
                <View style={styles.relInfo}>
                  <View style={styles.relNameRow}>
                    <Text style={styles.relName}>{char!.name}</Text>
                    {char!.isVerified && <Text style={styles.verified}> ✓</Text>}
                  </View>
                  <Text style={styles.relHandle}>@{char!.handle}</Text>
                  <View style={styles.relBarBg}>
                    <View style={[styles.relBarFill, { width: `${rel.value}%` }]} />
                  </View>
                  <Text style={styles.relFlavor}>{rel.flavorText}</Text>
                </View>
                <View style={styles.relRight}>
                  <Text style={styles.relPercent}>{rel.value}%</Text>
                  <Text style={styles.relChemistry}>{rel.chemistry}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Your Posts */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Posts</Text>
          {playerPosts.length === 0 ? (
            <Text style={styles.noPosts}>No posts yet. Head to the feed and post something!</Text>
          ) : (
            playerPosts.slice(0, 5).map(post => (
              <PostCard
                key={post.id}
                post={post}
                character={playerChar}
              />
            ))
          )}
        </View>

        <View style={{ height: 80 }} />
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0A0A0A' },
  banner: { height: 100, backgroundColor: '#1E3A5F' },
  profileSection: { padding: 16, marginTop: -36 },
  profileTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 12 },
  profileAvatar: { borderWidth: 3, borderColor: '#0A0A0A', borderRadius: 40 },
  editButton: { backgroundColor: '#1A1A1A', borderRadius: 999, paddingHorizontal: 16, paddingVertical: 8, borderWidth: 1, borderColor: '#2A2A2A' },
  editButtonText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  displayName: { color: '#fff', fontSize: 22, fontWeight: '900', marginBottom: 2 },
  verified: { color: '#3B82F6', fontSize: 18 },
  handle: { color: '#9CA3AF', fontSize: 15, marginBottom: 8 },
  bio: { color: '#fff', fontSize: 14, lineHeight: 20, marginBottom: 12 },
  followerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  followerCount: { color: '#fff', fontSize: 18, fontWeight: '800' },
  followerLabel: { color: '#9CA3AF', fontSize: 15 },
  followerDelta: { fontSize: 14, fontWeight: '600' },
  actionButtons: { flexDirection: 'row', gap: 10 },
  actionBtn: { flex: 1, backgroundColor: '#1A1A1A', borderRadius: 999, paddingVertical: 10, alignItems: 'center', borderWidth: 1, borderColor: '#2A2A2A' },
  actionBtnText: { color: '#9CA3AF', fontSize: 12 },
  section: { paddingHorizontal: 16, marginBottom: 24 },
  sectionTitle: { color: '#fff', fontSize: 18, fontWeight: '700', marginBottom: 14 },
  relCard: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#2A2A2A', gap: 12 },
  relInfo: { flex: 1 },
  relNameRow: { flexDirection: 'row', alignItems: 'center' },
  relName: { color: '#fff', fontSize: 15, fontWeight: '700' },
  relHandle: { color: '#9CA3AF', fontSize: 13, marginBottom: 6 },
  relBarBg: { height: 4, backgroundColor: '#2A2A2A', borderRadius: 2, marginBottom: 4 },
  relBarFill: { height: 4, backgroundColor: '#3B82F6', borderRadius: 2 },
  relFlavor: { color: '#9CA3AF', fontSize: 12 },
  relRight: { alignItems: 'flex-end', gap: 2 },
  relPercent: { color: '#22C55E', fontSize: 14, fontWeight: '700' },
  relChemistry: { color: '#9CA3AF', fontSize: 11 },
  noPosts: { color: '#9CA3AF', fontSize: 14, textAlign: 'center', padding: 20 },
})
