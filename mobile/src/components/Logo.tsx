import React from 'react'
import { Text, View } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import Svg, { Circle, Path } from 'react-native-svg'
import { colors } from '../theme'

// Логотип: градієнтний квадрат із білою іконкою «людина + галочка» (за дизайном).
export function Logo({ size = 54 }: { size?: number }) {
  const icon = size * 0.56
  return (
    <LinearGradient
      colors={[colors.brand, colors.brandDark]}
      start={{ x: 0.1, y: 0 }}
      end={{ x: 0.9, y: 1 }}
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.28,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: colors.brand,
        shadowOpacity: 0.4,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 5 },
        elevation: 6,
      }}
    >
      <Svg width={icon} height={icon} viewBox="0 0 44 44" fill="none">
        <Circle cx="22" cy="17" r="9" stroke="#fff" strokeWidth="2.5" />
        <Path d="M10 37C10 31 15.4 26.5 22 26.5C28.6 26.5 34 31 34 37" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" />
        <Path d="M18 15.5L21 18.5L27 12" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      </Svg>
    </LinearGradient>
  )
}

// Кругла кнопка-аватар з ініціалами.
export function Avatar({ initials, size = 34 }: { initials: string; size?: number }) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: colors.brand,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text style={{ color: '#fff', fontWeight: '800', fontSize: size * 0.34 }}>{initials.toUpperCase()}</Text>
    </View>
  )
}
