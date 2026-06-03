import React from 'react'
import { Image, View, StyleSheet, ViewStyle } from 'react-native'
import { COLORS } from '@/constants/colors'

interface AvatarProps {
  uri?: string
  size?: number
  style?: ViewStyle
  ring?: boolean
  ringColor?: string
}

export function Avatar({ uri, size = 44, style, ring, ringColor = COLORS.primary }: AvatarProps) {
  const src = uri || `https://i.pravatar.cc/${size}?u=default`
  return (
    <View style={[ring && { borderRadius: size, borderWidth: 2, borderColor: ringColor, padding: 2 }, style]}>
      <Image
        source={{ uri: src }}
        style={[styles.avatar, { width: size, height: size, borderRadius: size / 2 }]}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  avatar: { backgroundColor: '#333' },
})
