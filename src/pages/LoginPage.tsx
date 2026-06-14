import { useState } from 'react'
import { HeartPulse, LogIn } from 'lucide-react'
import { useStore } from '../data/store'
import { ApiError } from '../api/client'
import { Button, Field, inputCls } from '../components/ui'

export default function LoginPage() {
  const { login, register } = useStore()
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [form, setForm] = useState({ email: '', password: '', firstName: '', lastName: '' })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async () => {
    setError('')
    setBusy(true)
    try {
      if (mode === 'login') {
        await login(form.email, form.password)
      } else {
        await register(form)
      }
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Не вдалося зʼєднатися з сервером')
    } finally {
      setBusy(false)
    }
  }

  const fillDemo = () => setForm({ ...form, email: 'demo@psychoprogram.com', password: 'demo1234' })

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center text-center">
          <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-600 text-white">
            <HeartPulse size={26} />
          </span>
          <h1 className="text-xl font-bold text-gray-900">Psycho Program</h1>
          <p className="text-sm text-gray-500">Адмін-панель для психологів</p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex gap-2">
            <button
              onClick={() => setMode('login')}
              className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium ${mode === 'login' ? 'bg-brand-50 text-brand-700' : 'text-gray-500 hover:bg-gray-50'}`}
            >
              Увійти
            </button>
            <button
              onClick={() => setMode('register')}
              className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium ${mode === 'register' ? 'bg-brand-50 text-brand-700' : 'text-gray-500 hover:bg-gray-50'}`}
            >
              Реєстрація
            </button>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault()
              if (!busy) submit()
            }}
          >
            {mode === 'register' && (
              <div className="flex gap-2">
                <Field label="Ім'я">
                  <input className={inputCls} value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} />
                </Field>
                <Field label="Прізвище">
                  <input className={inputCls} value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} />
                </Field>
              </div>
            )}
            <Field label="Email">
              <input
                type="email"
                autoComplete="email"
                className={inputCls}
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </Field>
            <Field label="Пароль">
              <input
                type="password"
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                className={inputCls}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
            </Field>

            {error && <div className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

            <Button type="submit" disabled={busy} className="w-full justify-center">
              <LogIn size={16} /> {busy ? 'Зачекайте…' : mode === 'login' ? 'Увійти' : 'Створити акаунт'}
            </Button>
          </form>

          {mode === 'login' && (
            <button onClick={fillDemo} className="mt-3 w-full text-center text-xs text-gray-400 hover:text-gray-600">
              Підставити демо-акаунт (demo@psychoprogram.com)
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
