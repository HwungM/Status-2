import React, { useState } from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { router } from 'expo-router'
import { COLORS } from '@/constants/colors'
import { Post, Character } from '@/types'
import { Avatar } from '@/components/common/Avatar'

interface PostCardProps {
  post: Post
  character: Character | null
  allCharacters?: Character[]
  onReply?: (post: Post) => void
}

export function PostCard({ post, character, allCharacters = [], onReply }: PostCardProps) {
  const [liked, setLiked] = useState(false)
  const [localLikes, setLocalLikes] = useState(post.likes)

  const handleLike = () => {
    setLiked(!liked)
    setLocalLikes(liked ? localLikes - 1 : localLikes + 1)
  }

  const formatCount = (n: number) => {
    if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`
    if (n >= 1000) return `${(n / 1000).toFixed(1)}K`
    return n.toString()
  }

  const timeAgo = () => {
    const diff = Date.now() - post.createdAt
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return 'now'
    if (mins < 60) return `${mins}m`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs}h`
    return `${Math.floor(hrs / 24)}d`
  }

  const isHighFollower = (character?.followerCount ?? 0) >= 100000
  const isPlayer = post.isPlayerPost
  const replyCount = post.replies?.length || 0

  const handleAuthorPress = () => {
    if (character) router.push(`/game/character/${character.id}`)
  }

  const handleOpenPost = () => {
    router.push(`/game/post/${post.id}`)
  }

  return (
    <TouchableOpacity style={[styles.container, isPlayer && styles.playerContainer]} onPress={handleOpenPost} activeOpacity={0.92}>
      {isPlayer && <View style={styles.playerAccent} />}
      {isHighFollower && !isPlayer && <View style={styles.goldAccent} />}
      <View style={styles.row}>
        <TouchableOpacity onPress={handleAuthorPress} activeOpacity={0.8}>
          <View style={[styles.avatarWrapper, isHighFollower && styles.avatarGlow]}>
            <Avatar uri={character?.avatar} size={44} />
          </View>
        </TouchableOpacity>
        <View style={styles.content}>
          <View style={styles.nameRow}>
            <TouchableOpacity onPress={handleAuthorPress} activeOpacity={0.8} style={styles.nameTouch}>
              <Text style={styles.name}>{character?.name || 'Unknown'}</Text>
              {character?.isVerified && (
                <View style={styles.verifiedBadge}><Text style={styles.verifiedText}>✓</Text></View>
              )}
              <Text style={styles.handle}> @{character?.handle || 'unknown'}</Text>
            </TouchableOpacity>
            <Text style={styles.time}>{timeAgo()}</Text>
          </View>
          <Text style={styles.postText}>{post.content}</Text>
          <View style={styles.actions}>
            <TouchableOpacity style={styles.actionBtn} onPress={handleOpenPost}>
              <Text style={styles.actionText}>💬</Text>
              {replyCount > 0 && <Text style={[styles.actionCount, styles.actionCountActive]}>{formatCount(replyCount)}</Text>}
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionBtn}>
              <Text style={styles.actionText}>🔁</Text>
              {post.reposts > 0 && <Text style={styles.actionCount}>{formatCount(post.reposts)}</Text>}
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionBtn} onPress={handleLike}>
              <Text style={[styles.actionText, liked && styles.likedHeart]}>{liked ? '♥' : '♡'}</Text>
              <Text style={[styles.actionCount, liked && styles.likedCount]}>{formatCount(localLikes)}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
      <View style={styles.divider} />
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  container: { backgroundColor: COLORS.background, position: 'relative' },
  playerContainer: { backgroundColor: 'rgba(59,130,246,0.03)' },
  playerAccent: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, backgroundColor: COLORS.primary, borderRadius: 2 },
  goldAccent: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, backgroundColor: '#F59E0B', borderRadius: 2 },
  row: { flexDirection: 'row', padding: 16, paddingBottom: 10 },
  avatarWrapper: { marginRight: 12, marginTop: 2 },
  avatarGlow: { shadowColor: '#F59E0B', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.5, shadowRadius: 6, elevation: 4 },
  content: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  nameTouch: { flexDirection: 'row', alignItems: 'center', flex: 1, flexShrink: 1 },
  name: { color: COLORS.textPrimary, fontWeight: '700', fontSize: 14 },
  verifiedBadge: { width: 15, height: 15, borderRadius: 8, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center', marginLeft: 4 },
  verifiedText: { color: '#fff', fontSize: 8, fontWeight: '900' },
  handle: { color: COLORS.textSecondary, fontSize: 13, flexShrink: 1 },
  time: { color: COLORS.textSecondary, fontSize: 12, marginLeft: 6, flexShrink: 0 },
  postText: { color: COLORS.textPrimary, fontSize: 15, lineHeight: 22, marginBottom: 8 },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingVertical: 4, paddingHorizontal: 8, borderRadius: 999 },
  actionText: { color: COLORS.textSecondary, fontSize: 15 },
  actionCount: { color: COLORS.textSecondary, fontSize: 13 },
  actionCountActive: { color: COLORS.primary },
  likedHeart: { color: '#E11D48' },
  likedCount: { color: '#E11D48' },
  divider: { height: 1, backgroundColor: COLORS.divider, marginLeft: 72 },
})
