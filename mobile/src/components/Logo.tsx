import React from 'react'
import { Text, View } from 'react-native'
import { colors } from '../theme'

// Логотип без нативних модулів: тепла кремова плитка із золотим серцем —
// «простір турботи про себе».
export function Logo({ size = 64 }: { size?: number }) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.3,
        backgroundColor: colors.brandSoft,
        borderWidth: 1.5,
        borderColor: colors.brandSoftBorder,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#5C4433',
        shadowOpacity: 0.12,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 6 },
        elevation: 5,
      }}
    >
      <Text style={{ color: colors.gold, fontSize: size * 0.42, marginTop: size * 0.02 }}>♥</Text>
    </View>
  )
}

// Кругла кнопка-аватар з ініціалами — золотий кружок з еспресо-текстом.
export function Avatar({ initials, size = 34 }: { initials: string; size?: number }) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: colors.gold,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text style={{ color: colors.brandDark, fontWeight: '800', fontSize: size * 0.36 }}>{initials.toUpperCase()}</Text>
    </View>
  )
}
