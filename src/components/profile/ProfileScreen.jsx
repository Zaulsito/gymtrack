import { useState } from 'react'
import { updateProfile, EmailAuthProvider, reauthenticateWithCredential, updatePassword } from 'firebase/auth'
import { doc, setDoc, deleteDoc, getDocs, collection, query, where } from 'firebase/firestore'
import { auth, db } from '../../lib/firebase'
import { useApp } from '../../context/AppContext'
import { resizeImage } from '../../lib/utils'
import CompleteProfileScreen from './CompleteProfileScreen'

export default function ProfileScreen({ onClose }) {
  const { state, updateState, currentUser, showToast, saveData } = useApp()
  const [saving,    setSaving]    = useState(false)
  const [error,     setError]     = useState('')
  const [showPwModal, setShowPwModal] = useState(false)

  // Form state
  const [fullName, setFullName] = useState(state?.displayName || '')
  const [username, setUsername] = useState(state?.username || '')
  const [age,      setAge]      = useState(state?.age || '')
  const [gender,   setGender]   = useState(state?.gender || '')
  const [weight,   setWeight]   = useState(state?.weight || '')
  const [height,   setHeight]   = useState(state?.height || '')
  const [goal,     setGoal]     = useState(state?.goal || '')
  const [level,    setLevel]    = useState(state?.level || '')
  const [days,     setDays]     = useState(state?.days || '')

  const lastUsernameChange = state?.usernameChangedAt ? new Date(state.usernameChangedAt) : null
  const daysSinceChange    = lastUsernameChange ? Math.floor((new Date() - lastUsernameChange) / 86400000) : 999
  const daysUntilChange    = Math.max(0, 14 - daysSinceChange)
  const canChangeUsername  = daysUntilChange === 0
  const usernameChanged    = username !== (state?.username || '')

  async function saveProfile() {
    if (!fullName.trim()) { setError('El nombre es obligatorio.'); return }
    if (username && !/^[a-z0-9_]+$/.test(username)) { setError('Usuario: solo letras, números y _'); return }

    // Validar cambio de username
    if (usernameChanged) {
      if (!canChangeUsername) { setError(`Puedes cambiar el usuario en ${daysUntilChange} días.`); return }
      // Verificar que no exista
      try {
        const q    = query(collection(db, 'users'), where('username', '==', username.toLowerCase()))
        const snap = await getDocs(q)
        const taken = snap.docs.some(d => d.id !== currentUser.uid)
        if (taken) { setError('Ese nombre de usuario ya está en uso.'); return }
      } catch { setError('Error al verificar el usuario.'); return }
    }

    setSaving(true)
    try {
      await updateProfile(currentUser, { displayName: fullName })
      const extra = usernameChanged ? { usernameChangedAt: new Date().toISOString() } : {}
      updateState(prev => ({ ...prev, displayName: fullName, username, age, gender, weight, height, goal, level, days, ...extra }))
      showToast('✓ Perfil guardado', 'ok')
      setError('')
    } catch { setError('Error al guardar.') }
    setSaving(false)
  }

  async function handleAvatarChange(e) {
    const file = e.target.files[0]
    if (!file) return
    const compressed = await resizeImage(file)
    updateState(prev => ({ ...prev, photoURL: compressed }))
    showToast('✓ Foto actualizada', 'ok')
  }

  // Delete account
  const [deleteStep, setDeleteStep] = useState(false)
  const [deletePw,   setDeletePw]   = useState('')
  const [deleteErr,  setDeleteErr]  = useState('')

  const hasDeleteReq = !!state?.deleteRequest
  const deleteScheduled = hasDeleteReq ? new Date(state.deleteRequest.scheduledAt) : null
  const daysLeft = deleteScheduled ? Math.ceil((deleteScheduled - new Date()) / 86400000) : 0

  async function requestDelete() {
    if (!deletePw) { setDeleteErr('Ingresa tu contraseña.'); return }
    try {
      const credential = EmailAuthProvider.credential(currentUser.email, deletePw)
      await reauthenticateWithCredential(currentUser, credential)
      const scheduledAt = new Date()
      scheduledAt.setDate(scheduledAt.getDate() + 7)
      updateState(prev => ({ ...prev, deleteRequest: { requestedAt: new Date().toISOString(), scheduledAt: scheduledAt.toISOString() } }))
      setDeleteStep(false)
      showToast(`⏳ Eliminación programada para ${scheduledAt.toLocaleDateString('es-CL')}`, 'warn')
    } catch (e) {
      setDeleteErr('Contraseña incorrecta.')
    }
  }

  async function cancelDelete() {
    if (!confirm('¿Cancelar la solicitud de eliminación?')) return
    updateState(prev => { const next = { ...prev }; delete next.deleteRequest; return next })
    showToast('✓ Eliminación cancelada', 'ok')
  }

  const photoURL = state?.photoURL

  return (
    <div className="profile-screen">
      <div className="bg-[var(--surface)] border-b border-[var(--border-color)] px-6 py-4 flex items-center gap-4 sticky top-0 z-[290]">
        <button className="text-accent text-xl" onClick={onClose}>←</button>
        <div className="font-bebas text-[1.4rem] tracking-widest">Mi Perfil</div>
      </div>

      <div className="p-6 max-w-[500px] mx-auto flex flex-col gap-6">
        {/* Avatar */}
        <div className="flex flex-col items-center gap-2">
          <label className="cursor-pointer">
            {photoURL
              ? <img src={photoURL} className="w-24 h-24 rounded-full object-cover border-4 border-accent" alt="" />
              : <div className="w-24 h-24 rounded-full border-4 border-accent bg-[var(--surface2)] flex items-center justify-center text-4xl">🐱</div>
            }
            <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
          </label>
          <span className="text-xs text-[var(--muted)]">Toca para cambiar foto</span>
        </div>

        {/* Datos de acceso */}
        <section className="flex flex-col gap-3">
          <div className="section-title">Datos de acceso</div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-[var(--muted)] uppercase tracking-wider">Nombre completo</label>
            <input className="input-field" value={fullName} onChange={e => setFullName(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <label className="text-xs text-[var(--muted)] uppercase tracking-wider">Nombre de usuario</label>
              {!canChangeUsername && (
                <span className="text-xs text-[var(--hold)]">🔒 Cambia en {daysUntilChange} días</span>
              )}
              {canChangeUsername && lastUsernameChange && (
                <span className="text-xs text-[var(--up)]">✓ Disponible para cambiar</span>
              )}
            </div>
            <input
              className={`input-field ${!canChangeUsername ? 'opacity-50' : ''}`}
              placeholder="@usuario"
              value={username}
              onChange={e => canChangeUsername && setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
              disabled={!canChangeUsername}
            />
            {canChangeUsername && (
              <p className="text-xs text-[var(--muted)]">Solo letras, números y _. Podrás cambiarlo de nuevo en 14 días.</p>
            )}
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-[var(--muted)] uppercase tracking-wider">Correo electrónico</label>
            <input className="input-field opacity-50" value={currentUser?.email || ''} disabled />
          </div>
          <button className="btn-outline text-sm py-2" onClick={() => setShowPwModal(true)}>🔑 Cambiar contraseña</button>
        </section>

        {/* Datos físicos */}
        <section className="flex flex-col gap-3">
          <div className="section-title">Datos físicos</div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs text-[var(--muted)] uppercase tracking-wider">Edad</label>
              <input className="input-field" type="number" placeholder="Años" value={age} onChange={e => setAge(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-[var(--muted)] uppercase tracking-wider">Género</label>
              <select className="input-field" value={gender} onChange={e => setGender(e.target.value)}>
                <option value="">Seleccionar</option>
                {['Masculino','Femenino','Otro','Prefiero no decir'].map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-[var(--muted)] uppercase tracking-wider">Peso (kg)</label>
              <input
                className="input-field"
                type="number"
                placeholder="kg"
                value={weight}
                onChange={e => {
                  const val = e.target.value.replace(/[^0-9]/g, '').slice(0, 3)
                  if (val === '' || parseInt(val) <= 300) setWeight(val)
                }}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-[var(--muted)] uppercase tracking-wider">Altura (cm)</label>
              <input
                className="input-field"
                type="number"
                placeholder="cm"
                value={height}
                onChange={e => {
                  const val = e.target.value.replace(/[^0-9]/g, '').slice(0, 3)
                  if (val === '' || (parseInt(val) <= 240)) setHeight(val)
                }}
              />
            </div>
          </div>
        </section>
        <section className="flex flex-col gap-3">
          <div className="section-title">Entrenamiento</div>
          {[
            { label: 'Objetivo', value: goal, set: setGoal, opts: ['Bajar de peso','Ganar músculo','Mantener peso','Mejorar resistencia','Salud general'] },
            { label: 'Nivel de experiencia', value: level, set: setLevel, opts: ['Principiante','Intermedio','Avanzado'] },
            { label: 'Días por semana', value: days, set: setDays, opts: ['1-2','3-4','5-6','Todos los días'] },
          ].map(({ label, value, set, opts }) => (
            <div key={label} className="flex flex-col gap-1">
              <label className="text-xs text-[var(--muted)] uppercase tracking-wider">{label}</label>
              <select className="input-field" value={value} onChange={e => set(e.target.value)}>
                <option value="">Seleccionar</option>
                {opts.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
          ))}
        </section>

        {error && <p className="text-xs text-[var(--down)] text-center">{error}</p>}
        <button className="btn-login" onClick={saveProfile} disabled={saving}>
          {saving ? 'GUARDANDO...' : 'GUARDAR CAMBIOS'}
        </button>

        {/* Zona peligrosa */}
        <section className="flex flex-col gap-3">
          <div className="section-title" style={{ color: 'var(--down)' }}>Zona peligrosa</div>
          <button className="btn-danger text-sm py-2 w-full" onClick={onClose}>🚪 Cerrar sesión (ir al logout)</button>
          {hasDeleteReq ? (
            <div className="p-3 rounded-xl border border-[rgba(255,51,102,0.3)] bg-[rgba(255,51,102,0.1)]">
              <div className="text-[var(--down)] text-sm font-semibold mb-1">⏳ Eliminación programada</div>
              <div className="text-xs text-[var(--muted)] mb-3">Tu cuenta se eliminará en <strong className="text-[var(--text)]">{daysLeft} día{daysLeft!==1?'s':''}</strong> ({deleteScheduled?.toLocaleDateString('es-CL')}).</div>
              <button className="btn-outline text-sm py-1.5 w-full" onClick={cancelDelete}>↩ Cancelar eliminación</button>
            </div>
          ) : (
            <>
              {!deleteStep
                ? <button className="btn-danger text-sm py-2 w-full" onClick={() => setDeleteStep(true)}>🗑 Eliminar mi cuenta</button>
                : <div className="flex flex-col gap-2">
                    <input className="input-field" type="password" placeholder="Confirma tu contraseña" value={deletePw} onChange={e => setDeletePw(e.target.value)} />
                    {deleteErr && <p className="text-xs text-[var(--down)]">{deleteErr}</p>}
                    <div className="flex gap-2">
                      <button className="btn-outline flex-1 py-2 text-sm" onClick={() => { setDeleteStep(false); setDeletePw(''); setDeleteErr('') }}>Cancelar</button>
                      <button className="btn-danger flex-1 py-2 text-sm" onClick={requestDelete}>Confirmar</button>
                    </div>
                  </div>
              }
            </>
          )}
        </section>
        <div className="h-8" />
      </div>

      {showPwModal && <ChangePwModal onClose={() => setShowPwModal(false)} />}
    </div>
  )
}

function ChangePwModal({ onClose }) {
  const { currentUser, showToast } = useApp()
  const [current,  setCurrent]  = useState('')
  const [newPw,    setNewPw]    = useState('')
  const [confirm,  setConfirm]  = useState('')
  const [error,    setError]    = useState('')
  const [saving,   setSaving]   = useState(false)

  async function doChange() {
    if (!current || !newPw || !confirm) { setError('Completa todos los campos.'); return }
    if (newPw.length < 6) { setError('La contraseña debe tener al menos 6 caracteres.'); return }
    if (newPw !== confirm) { setError('Las contraseñas no coinciden.'); return }
    setSaving(true)
    try {
      const credential = EmailAuthProvider.credential(currentUser.email, current)
      await reauthenticateWithCredential(currentUser, credential)
      await updatePassword(currentUser, newPw)
      onClose()
      showToast('✓ Contraseña actualizada', 'ok')
    } catch (e) {
      const msgs = { 'auth/wrong-password':'Contraseña actual incorrecta.', 'auth/invalid-credential':'Contraseña actual incorrecta.' }
      setError(msgs[e.code] || 'Error al cambiar la contraseña.')
    }
    setSaving(false)
  }

  return (
    <div className="modal-overlay" style={{ zIndex: 500 }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box">
        <h2 className="font-bebas text-[1.6rem] tracking-wider text-accent mb-5">Cambiar Contraseña</h2>
        {[
          { label: 'Contraseña actual',           value: current, set: setCurrent  },
          { label: 'Nueva contraseña',            value: newPw,   set: setNewPw    },
          { label: 'Confirmar nueva contraseña',  value: confirm, set: setConfirm  },
        ].map(({ label, value, set }) => (
          <div key={label} className="flex flex-col gap-1 mb-3">
            <label className="text-xs text-[var(--muted)] uppercase tracking-wider">{label}</label>
            <input className="input-field" type="password" placeholder="••••••••" value={value} onChange={e => set(e.target.value)} />
          </div>
        ))}
        {error && <p className="text-xs text-[var(--down)] mb-2">{error}</p>}
        <div className="flex gap-3">
          <button className="btn-outline flex-1 py-2.5" onClick={onClose}>Cancelar</button>
          <button className="btn-accent flex-1 py-2.5" onClick={doChange} disabled={saving}>{saving ? 'Guardando...' : 'Guardar'}</button>
        </div>
      </div>
    </div>
  )
}
