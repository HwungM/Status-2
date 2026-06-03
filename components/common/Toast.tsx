import React, { useEffect, useRef } from 'react'
import { Animated, StyleSheet, Text, View } from 'react-native'
import { COLORS } from '@/constants/colors'

interface ToastProps {
  message: string
  type?: 'success' | 'error' | 'info'
  visible: boolean
}

export function Toast({ message, type = 'info', visible }: ToastProps) {
  const translateY = useRef(new Animated.Value(-100)).current

  useEffect(() => {
    if (visible) {
      Animated.spring(translateY, { toValue: 0, useNativeDriver: true, tension: 80, friction: 10 }).start()
    } else {
      Animated.timing(translateY, { toValue: -100, duration: 300, useNativeDriver: true }).start()
    }
  }, [visible])

  const bgColor = type === 'error' ? '#7F1D1D' : type === 'success' ? '#14532D' : '#1E3A5F'

  return (
    <Animated.View style={[styles.container, { backgroundColor: bgColor, transform: [{ translateY }] }]}>
      <Text style={styles.text}>{message}</Text>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 60,
    left: 16,
    right: 16,
    borderRadius: 12,
    padding: 14,
    zIndex: 9999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 10,
  },
  text: { color: '#fff', fontSize: 14, fontWeight: '500' },
})
