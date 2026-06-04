import React, { useState, useMemo } from 'react'
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  TextInput, Modal, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native'
import { useLocalSearchParams, router } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { COLORS } from '@/constants/colors'
import { useGameStore } from '@/store/gameStore'
import { useAI } from '@/hooks/useAI'
import { Avatar } from '@/components/common/Avatar'
import { Post, Reply } from '@/types'
import { LocalWorldSessionService } from '@/services/worldSessionService'
import { generateId } from '@/utils/generateId'

export default function PostDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const { session, refreshSession } = useGameStore()
  const { handlePlayerAction } = useAI()
  const [replyText, setReplyText] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const post = session?.sharedFeed.find(p => p.id === id)
  const allChars = session?.worldState.characters || []
  const playerSlot = session?.players[0]
  const playerChar = allChars.find(c => c.id === playerSlot?.characterId)
  const author = allChars.find(c => c.id === post?.authorCharacterId)

  const formatCount = (n: number) => {
    if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`
    if (n >= 1000) return `${(n / 1000).toFixed(1)}K`
    return n.toString()
  }

  const formatTimestamp = (ts: number) => {
    const d = new Date(ts)
    const h = d.getHours()
    const m = d.getMinutes().toString().padStart(2, '0')
    const ampm = h >= 12 ? 'PM' : 'AM'
    const hour = h % 12 || 12
    const month = d.getMonth() + 1
    const day = d.getDate()
    const year = String(d.getFullYear()).slice(2)
    return `${hour}:${m} ${ampm} · ${month}/${day}/${year}`
  }

  const handleSubmitReply = async () => {
    if (!replyText.trim() || !post || !session || !playerSlot || !playerChar) return
    const trimmed = replyText.trim()
    setIsSubmitting(true)

    const newReply: Reply = {
      id: generateId(),
      postId: post.id,
      authorCharacterId: playerChar.id,
      content: `@${author?.handle || 'them'} ${trimmed}`,
      likes: 0,
      createdAt: Date.now(),
    }
    await LocalWorldSessionService.updatePostReplies(session.id, post.id, [...(post.replies || []), newReply])
    setReplyText('')

    const result = await handlePlayerAction(`Replied to @${author?.handle}'s post: "${trimmed}"`)
    await refreshSession()
    setIsSubmitting(false)
  }

  if (!post || !session) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backArrow}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Post</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.center}><ActivityIndicator color={COLORS.primary} /></View>
      </SafeAreaView>
    )
  }

  const replies = post.replies || []
  const views = useMemo(() => Math.floor(post.likes * (2 + Math.random() * 8)), [post.id])

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Post</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
          {/* Author row */}
          <View style={styles.authorRow}>
            <TouchableOpacity onPress={() => author && router.push(`/game/character/${author.id}`)}>
              <Avatar uri={author?.avatar} size={52} />
            </TouchableOpacity>
            <View style={styles.authorInfo}>
              <View style={styles.authorNameRow}>
                <Text style={styles.authorName}>{author?.name || 'Unknown'}</Text>
                {author?.isVerified && (
                  <View style={styles.verifiedBadge}><Text style={styles.verifiedText}>✓</Text></View>
                )}
              </View>
              <Text style={styles.authorHandle}>@{author?.handle || 'unknown'}</Text>
            </View>
          </View>

          {/* Post content */}
          <Text style={styles.postContent}>{post.content}</Text>

          {/* Timestamp + views */}
          <Text style={styles.timestamp}>{formatTimestamp(post.createdAt)} · <Text style={styles.views}>{formatCount(views)} Views</Text></Text>

          {/* Stats row */}
          <View style={styles.statsRow}>
            <TouchableOpacity style={styles.statPill}>
              <Text style={styles.statPillIcon}>💬</Text>
              <Text style={styles.statPillText}>{formatCount(replies.length)}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.statPill}>
              <Text style={styles.statPillIcon}>🔁</Text>
              <Text style={styles.statPillText}>{formatCount(post.reposts)}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.statPill}>
              <Text style={styles.statPillIcon}>♡</Text>
              <Text style={styles.statPillText}>{formatCount(post.likes)}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.divider} />

          {/* Reply composer */}
          <View style={styles.replyComposer}>
            <Avatar uri={playerChar?.avatar} size={36} />
            <TextInput
              style={styles.replyInput}
              value={replyText}
              onChangeText={setReplyText}
              placeholder={`Reply to @${author?.handle || 'them'}...`}
              placeholderTextColor={COLORS.textSecondary}
              multiline
              maxLength={280}
            />
            <TouchableOpacity
              style={[styles.replyPostBtn, (!replyText.trim() || isSubmitting) && styles.replyPostBtnDisabled]}
              onPress={handleSubmitReply}
              disabled={!replyText.trim() || isSubmitting}
            >
              {isSubmitting
                ? <ActivityIndicator size="small" color="#fff" />
                : <Text style={styles.replyPostBtnText}>Reply</Text>
              }
            </TouchableOpacity>
          </View>

          <View style={styles.divider} />

          {/* Replies */}
          {replies.length === 0 ? (
            <Text style={styles.noReplies}>No replies yet. Be the first.</Text>
          ) : (
            replies.map((reply) => {
              const isPhantom = reply.authorCharacterId.startsWith('phantom_')
              const replyChar = isPhantom ? null : allChars.find(c => c.id === reply.authorCharacterId)
              const isPlayerReply = reply.authorCharacterId === playerChar?.id

              const displayName = isPhantom ? (reply.phantomName || 'Someone') : (replyChar?.name || 'Unknown')
              const displayHandle = isPhantom ? (reply.phantomHandle || 'user') : (replyChar?.handle || 'unknown')

              return (
                <View key={reply.id} style={styles.replyItem}>
                  <TouchableOpacity
                    onPress={() => !isPhantom && replyChar && router.push(`/game/character/${replyChar.id}`)}
                    disabled={isPhantom}
                  >
                    {isPhantom
                      ? <View style={styles.phantomAvatar}><Text style={styles.phantomAvatarText}>{displayName[0]}</Text></View>
                      : <Avatar uri={replyChar?.avatar} size={40} />
                    }
                  </TouchableOpacity>
                  <View style={styles.replyBody}>
                    <View style={styles.replyNameRow}>
                      <Text style={styles.replyName}>{displayName}</Text>
                      {replyChar?.isVerified && (
                        <View style={styles.replyVerified}><Text style={styles.verifiedText}>✓</Text></View>
                      )}
                      <Text style={styles.replyHandle}> @{displayHandle}</Text>
                      {isPlayerReply && <View style={styles.youBadge}><Text style={styles.youBadgeText}>you</Text></View>}
                      {isPhantom && reply.phantomFollowerCount && (
                        <Text style={styles.phantomFollowers}> · {formatCount(reply.phantomFollowerCount)}</Text>
                      )}
                    </View>
                    <Text style={styles.replyText}>{reply.content}</Text>
                    <View style={styles.replyFooter}>
                      <Text style={styles.replyLikes}>♡ {formatCount(reply.likes)}</Text>
                      <Text style={styles.replyFooterSep}>·</Text>
                      <Text style={styles.replyFooterText}>Reply</Text>
                    </View>
                  </View>
                </View>
              )
            })
          )}

          <View style={styles.endPadding} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: COLORS.divider },
  backBtn: { width: 40 },
  backArrow: { color: '#fff', fontSize: 22 },
  headerTitle: { color: '#fff', fontSize: 16, fontWeight: '700' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll: { flex: 1 },
  authorRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, paddingBottom: 12 },
  authorInfo: { flex: 1 },
  authorNameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  authorName: { color: '#fff', fontSize: 17, fontWeight: '700' },
  verifiedBadge: { width: 17, height: 17, borderRadius: 9, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center' },
  verifiedText: { color: '#fff', fontSize: 9, fontWeight: '900' },
  authorHandle: { color: COLORS.textSecondary, fontSize: 14, marginTop: 1 },
  postContent: { color: '#fff', fontSize: 20, lineHeight: 28, paddingHorizontal: 16, paddingBottom: 14 },
  timestamp: { color: COLORS.textSecondary, fontSize: 13, paddingHorizontal: 16, paddingBottom: 14 },
  views: { fontWeight: '700', color: COLORS.textSecondary },
  statsRow: { flexDirection: 'row', gap: 10, paddingHorizontal: 16, paddingBottom: 14 },
  statPill: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#1A1A1A', borderRadius: 999, paddingVertical: 8, paddingHorizontal: 14, borderWidth: 1, borderColor: '#2A2A2A' },
  statPillIcon: { fontSize: 15 },
  statPillText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  divider: { height: 1, backgroundColor: COLORS.divider, marginHorizontal: 0 },
  replyComposer: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, padding: 16 },
  replyInput: { flex: 1, color: '#fff', fontSize: 15, lineHeight: 22, minHeight: 40, paddingTop: 4 },
  replyPostBtn: { backgroundColor: COLORS.primary, borderRadius: 999, paddingVertical: 8, paddingHorizontal: 16, alignSelf: 'flex-start' },
  replyPostBtnDisabled: { opacity: 0.4 },
  replyPostBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  noReplies: { color: COLORS.textSecondary, textAlign: 'center', padding: 32, fontSize: 14 },
  replyItem: { flexDirection: 'row', gap: 12, paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: COLORS.divider },
  replyBody: { flex: 1 },
  replyNameRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 3, flexWrap: 'nowrap' },
  replyName: { color: '#fff', fontWeight: '700', fontSize: 14 },
  replyVerified: { width: 14, height: 14, borderRadius: 7, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center', marginLeft: 3 },
  replyHandle: { color: COLORS.textSecondary, fontSize: 13, flexShrink: 1 },
  youBadge: { marginLeft: 6, backgroundColor: 'rgba(59,130,246,0.2)', borderRadius: 4, paddingHorizontal: 5, paddingVertical: 1 },
  youBadgeText: { color: COLORS.primary, fontSize: 10, fontWeight: '700' },
  replyText: { color: '#fff', fontSize: 15, lineHeight: 22, marginBottom: 8 },
  replyFooter: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  replyLikes: { color: COLORS.textSecondary, fontSize: 13 },
  replyFooterSep: { color: COLORS.divider },
  replyFooterText: { color: COLORS.textSecondary, fontSize: 13 },
  endPadding: { height: 60 },
  phantomAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#2A2A2A', alignItems: 'center', justifyContent: 'center' },
  phantomAvatarText: { color: '#9CA3AF', fontSize: 16, fontWeight: '700' },
  phantomFollowers: { color: '#6B7280', fontSize: 11 },
})
