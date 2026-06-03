import React from 'react'
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator,
} from 'react-native'
import { router, useLocalSearchParams } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { COLORS } from '@/constants/colors'
import { useGameStore } from '@/store/gameStore'
import { Avatar } from '@/components/common/Avatar'
import { StatBar } from '@/components/common/StatBar'
import { formatFollowerCount } from '@/utils/statHelpers'

const CHEMISTRY_COLORS: Record<string, string> = {
  rivals: '#EF4444',
  spicy: '#F97316',
  lovers: '#EC4899',
  friends: '#22C55E',
  enemies: '#7C3AED',
  energy: '#F59E0B',
  mentors: '#3B82F6',
  family: '#06B6D4',
  strangers: '#6B7280',
}

const CHEMISTRY_EMOJI: Record<string, string> = {
  rivals: '⚔️',
  spicy: '🌶️',
  lovers: '💕',
  friends: '💚',
  enemies: '💀',
  energy: '⚡',
  mentors: '🎓',
  family: '🤝',
  strangers: '👤',
}

function formatCount(n: number): string {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`
  return n.toString()
}

function timeAgo(ts: number): string {
  const diff = Date.now() - ts
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

export default function CharacterProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const { session } = useGameStore()

  if (!session) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}><ActivityIndicator color={COLORS.primary} /></View>
      </SafeAreaView>
    )
  }

  const character = session.worldState.characters.find(c => c.id === id)
  if (!character) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <Text style={styles.notFound}>Character not found</Text>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.backLink}>← Go back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    )
  }

  const playerSlot = session.players[0]
  const playerChar = session.worldState.characters.find(c => c.id === playerSlot?.characterId)
  const relationship = playerSlot?.gameState.relationships[character.id]

  // Get their recent posts
  const recentPosts = session.sharedFeed
    .filter(p => p.authorCharacterId === character.id)
    .slice(0, 5)

  const chemistry = relationship?.chemistry || 'strangers'
  const chemColor = CHEMISTRY_COLORS[chemistry] || '#6B7280'
  const chemEmoji = CHEMISTRY_EMOJI[chemistry] || '👤'

  const isPlayer = character.id === playerChar?.id

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Profile hero */}
        <View style={styles.hero}>
          <View style={[styles.avatarContainer, character.isVerified && styles.avatarVerifiedGlow]}>
            <Avatar uri={character.avatar} size={100} />
          </View>

          <View style={styles.nameBlock}>
            <View style={styles.nameRow}>
              <Text style={styles.name}>{character.name}</Text>
              {character.isVerified && (
                <View style={styles.verifiedBadge}>
                  <Text style={styles.verifiedText}>✓</Text>
                </View>
              )}
            </View>
            <Text style={styles.handle}>@{character.handle}</Text>
          </View>

          <View style={styles.followerRow}>
            <View style={styles.followerStat}>
              <Text style={styles.followerNum}>{formatFollowerCount(character.followerCount)}</Text>
              <Text style={styles.followerLabel}>Followers</Text>
            </View>
            {character.fandom && (
              <View style={styles.fandomBadge}>
                <Text style={styles.fandomText}>{character.fandom}</Text>
              </View>
            )}
          </View>

          <Text style={styles.bio}>{character.bio}</Text>
        </View>

        {/* Relationship with player */}
        {!isPlayer && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Your Connection</Text>
            <View style={[styles.relCard, { borderColor: chemColor + '44' }]}>
              <View style={styles.relTop}>
                <View style={[styles.chemBadge, { backgroundColor: chemColor + '22', borderColor: chemColor + '66' }]}>
                  <Text style={styles.chemEmoji}>{chemEmoji}</Text>
                  <Text style={[styles.chemLabel, { color: chemColor }]}>{chemistry}</Text>
                </View>
                {relationship && (
                  <Text style={styles.relValue}>{relationship.value}%</Text>
                )}
              </View>
              {relationship && (
                <>
                  <View style={styles.relBarBg}>
                    <View style={[
                      styles.relBarFill,
                      { width: `${relationship.value}%`, backgroundColor: chemColor },
                    ]} />
                  </View>
                  <Text style={styles.relFlavor}>{relationship.flavorText}</Text>
                </>
              )}
              {!relationship && (
                <Text style={styles.relFlavor}>You haven't connected with {character.name} yet.</Text>
              )}
            </View>
          </View>
        )}

        {/* Recent Posts */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Posts</Text>
          {recentPosts.length === 0 ? (
            <Text style={styles.emptyText}>{character.name} hasn't posted yet.</Text>
          ) : (
            recentPosts.map(post => (
              <View key={post.id} style={styles.postCard}>
                <Text style={styles.postContent}>{post.content}</Text>
                <View style={styles.postMeta}>
                  <Text style={styles.postMetaText}>💬 {post.replies?.length || 0}</Text>
                  <Text style={styles.postMetaText}>🔁 {formatCount(post.reposts)}</Text>
                  <Text style={styles.postMetaText}>♡ {formatCount(post.likes)}</Text>
                  <Text style={styles.postTime}>{timeAgo(post.createdAt)}</Text>
                </View>
              </View>
            ))
          )}
        </View>

        {/* Action Buttons */}
        {!isPlayer && (
          <View style={styles.actionSection}>
            <TouchableOpacity
              style={styles.dmBtn}
              onPress={() => router.push(`/game/messages/${character.id}`)}
              activeOpacity={0.85}
            >
              <Text style={styles.dmBtnText}>💬 Send DM</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.activityBtn}
              onPress={() => router.back()}
              activeOpacity={0.85}
            >
              <Text style={styles.activityBtnText}>🎭 Do Activity</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={{ height: 60 }} />
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  notFound: { color: COLORS.textSecondary, fontSize: 16 },
  backLink: { color: COLORS.primary, fontSize: 15 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  backBtn: { width: 40, alignItems: 'flex-start' },
  backArrow: { color: COLORS.textPrimary, fontSize: 22 },
  headerTitle: { color: COLORS.textPrimary, fontSize: 16, fontWeight: '700' },
  hero: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 20,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  avatarContainer: {
    borderRadius: 54,
    marginBottom: 14,
  },
  avatarVerifiedGlow: {
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 6,
  },
  nameBlock: { alignItems: 'center', marginBottom: 12 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  name: { color: '#fff', fontSize: 22, fontWeight: '800' },
  verifiedBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  verifiedText: { color: '#fff', fontSize: 11, fontWeight: '900' },
  handle: { color: COLORS.textSecondary, fontSize: 15 },
  followerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 14,
  },
  followerStat: { alignItems: 'center' },
  followerNum: { color: '#fff', fontSize: 20, fontWeight: '800' },
  followerLabel: { color: COLORS.textSecondary, fontSize: 12 },
  fandomBadge: {
    backgroundColor: 'rgba(168,85,247,0.15)',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: 'rgba(168,85,247,0.3)',
  },
  fandomText: { color: '#C084FC', fontSize: 12, fontWeight: '600' },
  bio: { color: '#D1D5DB', fontSize: 15, lineHeight: 22, textAlign: 'center' },
  section: {
    paddingHorizontal: 16,
    paddingTop: 20,
    marginBottom: 4,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 14,
  },
  relCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
  },
  relTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  chemBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
  },
  chemEmoji: { fontSize: 14 },
  chemLabel: { fontSize: 13, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  relValue: { color: '#fff', fontSize: 18, fontWeight: '800' },
  relBarBg: { height: 6, backgroundColor: '#2A2A2A', borderRadius: 3, marginBottom: 10, overflow: 'hidden' },
  relBarFill: { height: 6, borderRadius: 3 },
  relFlavor: { color: COLORS.textSecondary, fontSize: 14, lineHeight: 20 },
  postCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.divider,
  },
  postContent: { color: '#E5E7EB', fontSize: 15, lineHeight: 22, marginBottom: 10 },
  postMeta: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  postMetaText: { color: COLORS.textSecondary, fontSize: 13 },
  postTime: { color: COLORS.textSecondary, fontSize: 12, marginLeft: 'auto' },
  emptyText: { color: COLORS.textSecondary, fontSize: 14, fontStyle: 'italic' },
  actionSection: {
    paddingHorizontal: 16,
    paddingTop: 20,
    gap: 12,
  },
  dmBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  dmBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  activityBtn: {
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.divider,
  },
  activityBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
})
