import { useState } from 'react'
import { confirmPasswordReset } from 'firebase/auth'
import { auth } from '../../lib/firebase'

export default function ResetPasswordPanel({ oobCode, onDone }) {
  const [password,  setPassword]  = useState('')
  const [confirm,   setConfirm]   = useState('')
  const [error,     setError]     = useState('')
  const [loading,   setLoading]   = useState(false)
  const [success,   setSuccess]   = useState(false)

  async function doReset() {
    if (!password || !confirm) { setError('Completa todos los campos.'); return }
    if (password.length < 8 || password.length > 16) { setError('La contraseña debe tener entre 8 y 16 caracteres.'); return }
    if (password !== confirm) { setError('Las contraseñas no coinciden.'); return }
    setLoading(true); setError('')
    try {
      await confirmPasswordReset(auth, oobCode, password)
      setSuccess(true)
    } catch (e) {
      const msgs = {
        'auth/expired-action-code': 'El enlace expiró. Solicita uno nuevo.',
        'auth/invalid-action-code': 'El enlace no es válido. Solicita uno nuevo.',
        'auth/weak-password':       'La contraseña es muy débil.',
      }
      setError(msgs[e.code] || 'Error al restablecer. Intenta de nuevo.')
    }
    setLoading(false)
  }

  if (success) {
    return (
      <div className="fixed inset-0 bg-[var(--bg)] z-[500] flex items-center justify-center p-6">
        <div className="w-full max-w-[360px] bg-[var(--surface)] border border-[var(--border-color)] rounded-2xl px-8 py-10 flex flex-col items-center gap-6 text-center">
          <div className="text-5xl">✅</div>
          <div>
            <div className="font-bebas text-[2rem] tracking-widest text-[var(--up)] leading-none mb-2">¡Contraseña actualizada!</div>
            <p className="text-sm text-[var(--muted)]">Tu contraseña fue restablecida correctamente. Ya puedes iniciar sesión.</p>
          </div>
          <button className="btn-login w-full" onClick={onDone}>IR AL INICIO DE SESIÓN</button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-[var(--bg)] z-[500] flex items-center justify-center p-6">
      <div className="w-full max-w-[360px] bg-[var(--surface)] border border-[var(--border-color)] rounded-2xl px-8 py-10 flex flex-col gap-5">
        <div className="text-center">
          <div className="text-4xl mb-2">🔑</div>
          <div className="font-bebas text-[1.8rem] tracking-widest text-accent leading-none mb-1">Nueva contraseña</div>
          <p className="text-xs text-[var(--muted)]">Elige una contraseña segura entre 8 y 16 caracteres.</p>
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-[var(--muted)] uppercase tracking-wider">Nueva contraseña</label>
            <input
              className="input-field"
              type="password"
              placeholder="Mínimo 8 caracteres"
              value={password}
              onChange={e => setPassword(e.target.value)}
              maxLength={16}
              autoComplete="new-password"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-[var(--muted)] uppercase tracking-wider">Confirmar contraseña</label>
            <input
              className="input-field"
              type="password"
              placeholder="Repite la contraseña"
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              maxLength={16}
              onKeyDown={e => e.key === 'Enter' && doReset()}
              autoComplete="new-password"
            />
          </div>
          {error && <p className="text-xs text-[var(--down)] text-center">{error}</p>}
          <button className="btn-login mt-1" onClick={doReset} disabled={loading}>
            {loading ? 'GUARDANDO...' : 'GUARDAR CONTRASEÑA'}
          </button>
        </div>
      </div>
    </div>
  )
}
