import React from 'react'
import { Text, View } from 'react-native'
import { colors } from '../theme'

// Логотип без нативних модулів: фірмовий заокруглений квадрат із білою галочкою.
export function Logo({ size = 64 }: { size?: number }) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.28,
        backgroundColor: colors.brand,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: colors.brand,
        shadowOpacity: 0.4,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 5 },
        elevation: 6,
      }}
    >
      <View
        style={{
          width: size * 0.5,
          height: size * 0.5,
          borderRadius: size * 0.25,
          borderWidth: 2.5,
          borderColor: '#fff',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text style={{ color: '#fff', fontSize: size * 0.26, fontWeight: '800', marginTop: -1 }}>✓</Text>
      </View>
    </View>
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
