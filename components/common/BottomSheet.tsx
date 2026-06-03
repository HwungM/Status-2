import React, { useEffect, useRef } from 'react'
import { Animated, Modal, Pressable, StyleSheet, View } from 'react-native'
import { COLORS } from '@/constants/colors'

interface BottomSheetProps {
  visible: boolean
  onClose: () => void
  children: React.ReactNode
  height?: number | string
}

export function BottomSheet({ visible, onClose, children, height = '60%' }: BottomSheetProps) {
  const translateY = useRef(new Animated.Value(600)).current

  useEffect(() => {
    if (visible) {
      Animated.spring(translateY, { toValue: 0, useNativeDriver: true, tension: 65, friction: 11 }).start()
    } else {
      Animated.timing(translateY, { toValue: 600, duration: 250, useNativeDriver: true }).start()
    }
  }, [visible])

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <Animated.View style={[styles.sheet, { height: height as any, transform: [{ translateY }] }]}>
        <View style={styles.handle} />
        {children}
      </Animated.View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)' },
  sheet: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 16,
    paddingTop: 12,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  handle: {
    width: 36,
    height: 4,
    backgroundColor: COLORS.divider,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 12,
  },
})
