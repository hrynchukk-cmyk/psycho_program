import React, { useState } from 'react'
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import { useAuth } from '../auth'
import { ApiError } from '../api'
import { Button } from '../ui'
import { Logo } from '../components/Logo'
import { colors, serif } from '../theme'

export default function AuthScreen() {
  const { login, claim } = useAuth()
  const [mode, setMode] = useState<'login' | 'claim'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async () => {
    setError('')
    setBusy(true)
    try {
      if (mode === 'login') await login(email.trim(), password)
      else await claim(email.trim(), password)
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Не вдалося зʼєднатися із сервером')
    } finally {
      setBusy(false)
    }
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.bg }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.logo}>
          <Logo size={66} />
        </View>
        <Text style={styles.title}>Psycho Program</Text>
        <Text style={styles.tagline}>♥ ПРОСТІР ТУРБОТИ ПРО СЕБЕ</Text>

        <View style={styles.tabs}>
          <Text
            onPress={() => setMode('login')}
            style={[styles.tab, mode === 'login' && styles.tabActive]}
          >
            Вхід
          </Text>
          <Text
            onPress={() => setMode('claim')}
            style={[styles.tab, mode === 'claim' && styles.tabActive]}
          >
            За запрошенням
          </Text>
        </View>

        {mode === 'claim' ? (
          <Text style={styles.hint}>
            Введіть email, на який вас запросив психолог, і придумайте пароль — так ви активуєте свій акаунт.
          </Text>
        ) : null}

        <Text style={styles.label}>Email</Text>
        <TextInput
          style={styles.input}
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
          placeholder="ви@example.com"
          placeholderTextColor={colors.faint}
        />
        <Text style={styles.label}>Пароль</Text>
        <TextInput
          style={styles.input}
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          placeholder="••••••••"
          placeholderTextColor={colors.faint}
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <View style={{ height: 8 }} />
        <Button title={mode === 'login' ? 'Увійти' : 'Активувати акаунт'} onPress={submit} loading={busy} />

        <Text style={styles.note}>Демо: client@psychoprogram.com / demo1234</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: { padding: 24, paddingTop: 80, flexGrow: 1 },
  logo: { alignSelf: 'center' },
  title: { textAlign: 'center', fontSize: 26, fontFamily: serif, color: colors.text, marginTop: 16 },
  tagline: { textAlign: 'center', fontSize: 11, fontWeight: '700', color: colors.eyebrow, letterSpacing: 1.2, marginTop: 6, marginBottom: 26 },
  tabs: { flexDirection: 'row', backgroundColor: colors.cream, borderRadius: 12, borderWidth: 1, borderColor: colors.border, padding: 4, marginBottom: 16 },
  tab: { flex: 1, textAlign: 'center', paddingVertical: 9, borderRadius: 9, fontWeight: '600', color: colors.sub, overflow: 'hidden' },
  tabActive: { backgroundColor: colors.brandSoft, color: colors.brand },
  hint: { fontSize: 13, color: colors.sub, marginBottom: 14, lineHeight: 18 },
  label: { fontSize: 13, fontWeight: '600', color: colors.text, marginBottom: 6, marginTop: 10 },
  input: { backgroundColor: colors.cream, borderWidth: 1, borderColor: colors.border, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: colors.text },
  error: { color: colors.danger, fontSize: 13, marginTop: 12 },
  note: { textAlign: 'center', color: colors.faint, fontSize: 12, marginTop: 18 },
})
