import React from 'react'
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, ViewStyle, TextStyle } from 'react-native'
import { COLORS } from '@/constants/colors'

interface ButtonProps {
  title: string
  onPress: () => void
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  disabled?: boolean
  style?: ViewStyle
  textStyle?: TextStyle
}

export function Button({ title, onPress, variant = 'primary', size = 'md', loading, disabled, style, textStyle }: ButtonProps) {
  const buttonStyle = [
    styles.base,
    styles[variant],
    styles[`size_${size}`],
    (disabled || loading) && styles.disabled,
    style,
  ]

  return (
    <TouchableOpacity style={buttonStyle} onPress={onPress} disabled={disabled || loading} activeOpacity={0.8}>
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? '#fff' : COLORS.primary} size="small" />
      ) : (
        <Text style={[styles.text, styles[`text_${variant}`], styles[`textSize_${size}`], textStyle]}>{title}</Text>
      )}
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  base: {
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primary: { backgroundColor: COLORS.primary },
  secondary: { backgroundColor: COLORS.surface2, borderWidth: 1, borderColor: COLORS.divider },
  ghost: { backgroundColor: 'transparent' },
  danger: { backgroundColor: COLORS.danger },
  size_sm: { paddingHorizontal: 16, paddingVertical: 8 },
  size_md: { paddingHorizontal: 24, paddingVertical: 12 },
  size_lg: { paddingHorizontal: 32, paddingVertical: 16 },
  disabled: { opacity: 0.5 },
  text: { fontWeight: '600' },
  text_primary: { color: '#fff' },
  text_secondary: { color: COLORS.textPrimary },
  text_ghost: { color: COLORS.primary },
  text_danger: { color: '#fff' },
  textSize_sm: { fontSize: 13 },
  textSize_md: { fontSize: 15 },
  textSize_lg: { fontSize: 17 },
})
