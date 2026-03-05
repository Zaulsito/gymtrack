import { useState, useEffect } from 'react'
import {
  signInWithEmailAndPassword, createUserWithEmailAndPassword,
  sendEmailVerification, sendPasswordResetEmail, signOut, reload
} from 'firebase/auth'
import { getDocs, collection, query, where } from 'firebase/firestore'
import { auth, db } from '../../lib/firebase'
import { useApp } from '../../context/AppContext'

// ── LOGIN ────────────────────────────────────────────────────────────────────
export function LoginPanel({ onGoRegister }) {
  const { enterDemoMode, showToast } = useApp()
  const [email,       setEmail]       = useState('')
  const [password,    setPassword]    = useState('')
  const [error,       setError]       = useState('')
  const [loading,     setLoading]     = useState(false)
  const [showForgot,  setShowForgot]  = useState(false)
  const [resetEmail,  setResetEmail]  = useState('')
  const [resetSent,   setResetSent]   = useState(false)
  const [resetLoading,setResetLoading]= useState(false)

  async function doLogin() {
    if (!email || !password) { setError('Completa todos los campos.'); return }
    setLoading(true); setError('')
    let loginEmail = email.trim()

    // Username lookup
    if (!loginEmail.includes('@')) {
      try {
        const q    = query(collection(db, 'users'), where('username', '==', loginEmail.toLowerCase().replace('@','')))
        const snap = await getDocs(q)
        if (snap.empty) { setError('No existe ese nombre de usuario.'); setLoading(false); return }
        loginEmail = snap.docs[0].data().email
      } catch { setError('Error al buscar usuario.'); setLoading(false); return }
    }

    try {
      await signInWithEmailAndPassword(auth, loginEmail, password)
    } catch (e) {
      const msgs = {
        'auth/user-not-found':    'No existe una cuenta con ese correo.',
        'auth/wrong-password':    'Contraseña incorrecta.',
        'auth/invalid-credential':'Correo o contraseña incorrectos.',
        'auth/too-many-requests': 'Demasiados intentos. Espera un momento.',
      }
      setError(msgs[e.code] || 'Error al iniciar sesión.')
    }
    setLoading(false)
  }

  async function doReset() {
    if (!resetEmail.trim()) { showToast('⚠ Ingresa tu correo', 'warn'); return }
    setResetLoading(true)
    try {
      await sendPasswordResetEmail(auth, resetEmail.trim())
      setResetSent(true)
    } catch (e) {
      const msgs = {
        'auth/user-not-found': 'No existe una cuenta con ese correo.',
        'auth/invalid-email':  'Correo inválido.',
      }
      showToast(msgs[e.code] || 'Error al enviar el correo.', 'warn')
    }
    setResetLoading(false)
  }

  // Panel de recuperación de contraseña
  if (showForgot) {
    return (
      <div className="flex flex-col gap-4 w-full text-center">
        <div>
          <div className="text-4xl mb-2">🔑</div>
          <h2 className="text-accent text-xl font-bebas tracking-wider mb-1">Recuperar contraseña</h2>
          <p className="text-xs text-[var(--muted)]">Ingresa tu correo y te enviaremos un enlace para restablecer tu contraseña.</p>
        </div>

        {resetSent ? (
          <div className="flex flex-col gap-4">
            <div className="bg-[rgba(57,255,20,0.08)] border border-[rgba(57,255,20,0.3)] rounded-xl p-4">
              <p className="text-sm text-[var(--up)]">✅ Correo enviado a <strong>{resetEmail}</strong></p>
              <p className="text-xs text-[var(--muted)] mt-1">Revisa tu bandeja de entrada y sigue el enlace para restablecer tu contraseña.</p>
            </div>
            <button className="btn-login" onClick={() => { setShowForgot(false); setResetSent(false); setResetEmail('') }}>
              VOLVER AL INICIO
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <input
              className="input-field"
              type="email"
              placeholder="tu@correo.com"
              value={resetEmail}
              onChange={e => setResetEmail(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && doReset()}
              autoComplete="email"
            />
            <button className="btn-login" onClick={doReset} disabled={resetLoading}>
              {resetLoading ? 'ENVIANDO...' : 'ENVIAR ENLACE'}
            </button>
            <button className="text-xs text-[var(--muted)] underline" onClick={() => setShowForgot(false)}>
              ← Volver al inicio de sesión
            </button>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3 w-full">
      <div className="flex flex-col gap-1">
        <label className="text-xs text-[var(--muted)] uppercase tracking-wider">Correo o usuario</label>
        <input
          className="input-field"
          type="text"
          placeholder="tu@correo.com o @usuario"
          value={email}
          onChange={e => setEmail(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && doLogin()}
          autoComplete="username"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs text-[var(--muted)] uppercase tracking-wider">Contraseña</label>
        <input
          className="input-field"
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={e => setPassword(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && doLogin()}
          autoComplete="current-password"
        />
        <button className="text-xs text-[var(--muted)] text-right mt-1 hover:text-accent transition-colors" onClick={() => { setShowForgot(true); setResetEmail(email) }}>
          ¿Olvidaste tu contraseña?
        </button>
      </div>
      {error && <p className="text-xs text-[var(--down)] text-center">{error}</p>}
      <button className="btn-login mt-1" onClick={doLogin} disabled={loading}>
        {loading ? 'ENTRANDO...' : 'ENTRAR'}
      </button>

      <div className="flex items-center gap-3 my-1">
        <div className="flex-1 h-px bg-[var(--border-color)]" />
        <span className="text-xs text-[var(--muted)]">o</span>
        <div className="flex-1 h-px bg-[var(--border-color)]" />
      </div>

      <button
        className="btn-outline w-full py-3 text-sm"
        onClick={enterDemoMode}
      >
        👀 Explorar modo demo
      </button>

      <p className="text-center text-xs text-[var(--muted)] mt-2">
        ¿No tienes cuenta?{' '}
        <button className="text-accent font-semibold" onClick={onGoRegister}>Regístrate</button>
      </p>
    </div>
  )
}

// ── REGISTER ─────────────────────────────────────────────────────────────────
export function RegisterPanel({ onGoLogin, onVerify }) {
  const [email,    setEmail]    = useState('')
  const [phone,    setPhone]    = useState('')
  const [password, setPassword] = useState('')
  const [confirm,  setConfirm]  = useState('')
  const [error,    setError]    = useState('')
  const [loading,  setLoading]  = useState(false)

  async function doRegister() {
    if (!email || !phone || !password || !confirm) { setError('Completa todos los campos.'); return }
    if (password.length < 8 || password.length > 16) { setError('La contraseña debe tener entre 8 y 16 caracteres.'); return }
    if (password !== confirm) { setError('Las contraseñas no coinciden.'); return }

    setLoading(true); setError('')
    try {
      const cred = await createUserWithEmailAndPassword(auth, email.trim(), password)
      window._pendingPhone = phone
      await sendEmailVerification(cred.user)
      onVerify(cred.user)
    } catch (e) {
      const msgs = {
        'auth/email-already-in-use': 'Ya existe una cuenta con ese correo.',
        'auth/invalid-email':        'Correo inválido.',
        'auth/weak-password':        'La contraseña es muy débil.',
      }
      setError(msgs[e.code] || 'Error al crear la cuenta.')
    }
    setLoading(false)
  }

  return (
    <div className="flex flex-col gap-3 w-full">
      <p className="text-xs text-[var(--muted)] text-center">Crea tu cuenta — completa tu perfil después</p>
      <div className="flex flex-col gap-1">
        <label className="text-xs text-[var(--muted)] uppercase tracking-wider">Correo electrónico</label>
        <input className="input-field" type="email" placeholder="tu@correo.com" value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs text-[var(--muted)] uppercase tracking-wider">Teléfono</label>
        <input className="input-field" type="tel" placeholder="+56912345678" value={phone} onChange={e => setPhone(e.target.value)} />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs text-[var(--muted)] uppercase tracking-wider">
          Contraseña <span className="text-[var(--muted)] normal-case">(8–16 caracteres)</span>
        </label>
        <input className="input-field" type="password" placeholder="Mínimo 8 caracteres" value={password} onChange={e => setPassword(e.target.value)} maxLength={16} autoComplete="new-password" />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs text-[var(--muted)] uppercase tracking-wider">Confirmar contraseña</label>
        <input className="input-field" type="password" placeholder="Repite la contraseña" value={confirm} onChange={e => setConfirm(e.target.value)} maxLength={16} onKeyDown={e => e.key === 'Enter' && doRegister()} autoComplete="new-password" />
      </div>
      {error && <p className="text-xs text-[var(--down)] text-center">{error}</p>}
      <button className="btn-login mt-1" onClick={doRegister} disabled={loading}>
        {loading ? 'CREANDO...' : 'CREAR CUENTA'}
      </button>
      <p className="text-center text-xs text-[var(--muted)]">
        ¿Ya tienes cuenta?{' '}
        <button className="text-accent font-semibold" onClick={onGoLogin}>Inicia sesión</button>
      </p>
    </div>
  )
}

// ── VERIFY EMAIL ──────────────────────────────────────────────────────────────
const VERIFY_TIMEOUT_MINS = 30

export function VerifyPanel({ user, onVerified, onBack }) {
  const [error,       setError]       = useState('')
  const [loading,     setLoading]     = useState(false)
  const [resendCount, setResendCount] = useState(1)
  const [cooldown,    setCooldown]    = useState(120)
  const [isCooling,   setIsCooling]   = useState(true)
  const [timeLeft,    setTimeLeft]    = useState(VERIFY_TIMEOUT_MINS * 60) // 30 min countdown

  // Cooldown timer (reenvío)
  useEffect(() => {
    let secs = 120
    const t = setInterval(() => {
      secs--
      setCooldown(secs)
      if (secs <= 0) { clearInterval(t); setIsCooling(false) }
    }, 1000)
    return () => clearInterval(t)
  }, [])

  // Auto-delete timer (30 min)
  useEffect(() => {
    const t = setInterval(async () => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(t)
          // Borrar cuenta y volver al login
          auth.currentUser?.delete().catch(() => {})
          signOut(auth).catch(() => {})
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(t)
  }, [])

  // Auto-polling cada 5 seg para detectar verificación
  useEffect(() => {
    const t = setInterval(async () => {
      try {
        await reload(auth.currentUser)
        if (auth.currentUser?.emailVerified) {
          clearInterval(t)
          onVerified()
        }
      } catch {}
    }, 5000)
    return () => clearInterval(t)
  }, [onVerified])

  async function checkVerified() {
    setLoading(true); setError('')
    try {
      await reload(auth.currentUser)
      if (auth.currentUser?.emailVerified) {
        onVerified()
      } else {
        setError('Aún no verificaste. Haz clic en el enlace del correo y vuelve aquí.')
      }
    } catch { setError('Error al verificar. Intenta de nuevo.') }
    setLoading(false)
  }

  async function resend() {
    if (resendCount >= 5) return
    try {
      await sendEmailVerification(auth.currentUser)
      const newCount = resendCount + 1
      setResendCount(newCount)
      const mins = newCount * 2
      setCooldown(mins * 60)
      setIsCooling(true)
      let secs = mins * 60
      const t = setInterval(() => {
        secs--
        setCooldown(secs)
        if (secs <= 0) { clearInterval(t); setIsCooling(false) }
      }, 1000)
    } catch {}
  }

  async function goBack() {
    try {
      await auth.currentUser?.delete()
    } catch {}
    await signOut(auth)
    onBack?.()
  }

  const mins    = Math.floor(cooldown / 60)
  const secs    = String(cooldown % 60).padStart(2, '0')
  const tlMins  = Math.floor(timeLeft / 60)
  const tlSecs  = String(timeLeft % 60).padStart(2, '0')

  return (
    <div className="flex flex-col gap-4 w-full text-center">
      <div>
        <div className="text-4xl mb-2">📧</div>
        <h2 className="text-accent text-xl font-bebas tracking-wider mb-1">Verifica tu correo</h2>
        <p className="text-xs text-[var(--muted)]">
          Haz clic en el enlace que enviamos a{' '}
          <strong className="text-[var(--text)]">{user?.email}</strong>
        </p>
      </div>

      {/* Cuenta regresiva de 30 min */}
      <div className={`text-xs px-3 py-2 rounded-lg border ${timeLeft < 300 ? 'border-[rgba(255,51,102,0.4)] text-[var(--down)] bg-[rgba(255,51,102,0.08)]' : 'border-[var(--border-color)] text-[var(--muted)]'}`}>
        ⏳ La cuenta se eliminará si no verificas en{' '}
        <strong className={timeLeft < 300 ? 'text-[var(--down)]' : 'text-[var(--text)]'}>
          {tlMins}:{tlSecs}
        </strong>
      </div>

      {error && <p className="text-xs text-[var(--down)]">{error}</p>}

      <button className="btn-login" onClick={checkVerified} disabled={loading}>
        {loading ? 'VERIFICANDO...' : 'VERIFICAR Y ENTRAR'}
      </button>

      <div>
        <p className="text-xs text-[var(--muted)]">
          ¿No llegó?{' '}
          <button
            className={`font-semibold ${isCooling || resendCount >= 5 ? 'text-[var(--muted)] cursor-not-allowed' : 'text-accent'}`}
            onClick={resend}
            disabled={isCooling || resendCount >= 5}
          >
            Reenviar correo
          </button>
        </p>
        {isCooling && (
          <p className="text-xs text-[var(--muted)] mt-1">
            Podrás reenviar en {mins}:{secs}
          </p>
        )}
      </div>

      <button className="text-xs text-[var(--muted)] underline hover:text-[var(--text)] transition-colors" onClick={goBack}>
        ← Volver al inicio
      </button>
    </div>
  )
}
