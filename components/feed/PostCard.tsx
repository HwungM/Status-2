import React, { useState } from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { COLORS } from '@/constants/colors'
import { Post, Character } from '@/types'
import { Avatar } from '@/components/common/Avatar'

interface PostCardProps {
  post: Post
  character: Character | null
  onPress?: () => void
}

export function PostCard({ post, character, onPress }: PostCardProps) {
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

  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.9}>
      <View style={styles.row}>
        <Avatar uri={character?.avatar} size={44} style={styles.avatar} />
        <View style={styles.content}>
          <View style={styles.nameRow}>
            <Text style={styles.name}>{character?.name || 'Unknown'}</Text>
            {character?.isVerified && <Text style={styles.verified}> ✓</Text>}
            <Text style={styles.handle}> @{character?.handle || 'unknown'}</Text>
            <Text style={styles.time}> · {timeAgo()}</Text>
          </View>
          <Text style={styles.postText}>{post.content}</Text>
          <View style={styles.actions}>
            <TouchableOpacity style={styles.actionBtn} onPress={() => {}}>
              <Text style={styles.actionText}>💬 {formatCount(post.replies?.length || 0)}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionBtn} onPress={() => {}}>
              <Text style={styles.actionText}>🔁 {formatCount(post.reposts)}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionBtn} onPress={handleLike}>
              <Text style={[styles.actionText, liked && styles.liked]}>
                {liked ? '♥' : '♡'} {formatCount(localLikes)}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionBtn}>
              <Text style={styles.actionText}>☆</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
      <View style={styles.divider} />
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  container: { backgroundColor: COLORS.background },
  row: { flexDirection: 'row', padding: 16, paddingBottom: 12 },
  avatar: { marginRight: 12, marginTop: 2 },
  content: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', marginBottom: 4 },
  name: { color: COLORS.textPrimary, fontWeight: '700', fontSize: 14 },
  verified: { color: COLORS.verified, fontSize: 14 },
  handle: { color: COLORS.textSecondary, fontSize: 13 },
  time: { color: COLORS.textSecondary, fontSize: 13 },
  postText: { color: COLORS.textPrimary, fontSize: 15, lineHeight: 21, marginBottom: 10 },
  actions: { flexDirection: 'row', justifyContent: 'space-between', maxWidth: 240 },
  actionBtn: { paddingVertical: 4, paddingHorizontal: 8 },
  actionText: { color: COLORS.textSecondary, fontSize: 13 },
  liked: { color: '#E11D48' },
  divider: { height: 1, backgroundColor: COLORS.divider, marginLeft: 72 },
})
