import { useState } from 'react'
import { updateProfile } from 'firebase/auth'
import { auth } from '../../lib/firebase'
import { useApp } from '../../context/AppContext'
import { resizeImage } from '../../lib/utils'

export default function CompleteProfileScreen({ onDone }) {
  const { state, updateState, currentUser, showToast } = useApp()
  const [firstName, setFirstName] = useState('')
  const [lastName,  setLastName]  = useState('')
  const [username,  setUsername]  = useState('')
  const [phone,     setPhone]     = useState(window._pendingPhone || '')
  const [weight,    setWeight]    = useState('')
  const [height,    setHeight]    = useState('')
  const [goal,      setGoal]      = useState('')
  const [level,     setLevel]     = useState('')
  const [days,      setDays]      = useState('')
  const [photoURL,  setPhotoURL]  = useState('')
  const [error,     setError]     = useState('')
  const [saving,    setSaving]    = useState(false)

  async function handleAvatar(e) {
    const file = e.target.files[0]
    if (!file) return
    const compressed = await resizeImage(file)
    setPhotoURL(compressed)
  }

  async function save() {
    if (!firstName.trim()) { setError('El nombre es obligatorio.'); return }
    setSaving(true)
    try {
      const fullName = `${firstName} ${lastName}`.trim()
      await updateProfile(auth.currentUser, { displayName: fullName })
      updateState(prev => ({
        ...prev,
        displayName: fullName,
        firstName, lastName, username,
        phone, weight, height, goal, level, days,
        ...(photoURL ? { photoURL } : {}),
      }))
      window._pendingPhone = null
      onDone(firstName)
    } catch { setError('Error al guardar. Intenta de nuevo.') }
    setSaving(false)
  }

  function skip() {
    const firstName = state?.displayName?.split(' ')[0] || 'campeón'
    onDone(firstName)
  }

  return (
    <div className="profile-screen" style={{ zIndex: 400 }}>
      <div className="bg-[var(--surface)] border-b border-[var(--border-color)] px-6 py-4 sticky top-0 z-10">
        <div className="font-bebas text-[1.4rem] tracking-widest">Completa tu perfil</div>
      </div>

      <div className="p-6 max-w-[500px] mx-auto flex flex-col gap-4">
        <div className="text-center">
          <div className="text-3xl mb-1">🎉</div>
          <p className="text-xs text-[var(--muted)]">¡Correo verificado! Cuéntanos un poco más sobre ti.</p>
        </div>

        {/* Avatar */}
        <div className="flex flex-col items-center gap-2">
          <label className="cursor-pointer">
            <div className="w-20 h-20 rounded-full border-2 border-dashed border-accent bg-[var(--surface2)] flex items-center justify-center text-3xl overflow-hidden">
              {photoURL ? <img src={photoURL} className="w-full h-full object-cover" alt="" /> : '📷'}
            </div>
            <input type="file" accept="image/*" className="hidden" onChange={handleAvatar} />
          </label>
          <span className="text-xs text-[var(--muted)]">Foto de perfil (opcional)</span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {[
            { label:'Nombre',    value:firstName, set:setFirstName, placeholder:'Ej: Carlos' },
            { label:'Apellidos', value:lastName,  set:setLastName,  placeholder:'Ej: López'  },
            { label:'Peso (kg)', value:weight,    set:setWeight,    placeholder:'70', type:'number' },
            { label:'Estatura (cm)', value:height, set:setHeight,  placeholder:'175', type:'number' },
          ].map(({ label, value, set, placeholder, type='text' }) => (
            <div key={label} className="flex flex-col gap-1">
              <label className="text-xs text-[var(--muted)] uppercase tracking-wider">{label}</label>
              <input className="input-field" type={type} placeholder={placeholder} value={value} onChange={e => set(e.target.value)} />
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs text-[var(--muted)] uppercase tracking-wider">Nombre de usuario</label>
          <input className="input-field" placeholder="Ej: carlos123" value={username} onChange={e => setUsername(e.target.value.toLowerCase())} />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-[var(--muted)] uppercase tracking-wider">Teléfono</label>
          <input className="input-field" type="tel" placeholder="+56912345678" value={phone} onChange={e => setPhone(e.target.value)} />
        </div>

        {[
          { label:'Objetivo', value:goal, set:setGoal, opts:['Bajar de peso','Ganar músculo','Mantener peso','Mejorar resistencia','Salud general'] },
          { label:'Nivel de experiencia', value:level, set:setLevel, opts:['Principiante','Intermedio','Avanzado'] },
          { label:'Días por semana', value:days, set:setDays, opts:['1-2','3-4','5-6','Todos los días'] },
        ].map(({ label, value, set, opts }) => (
          <div key={label} className="flex flex-col gap-1">
            <label className="text-xs text-[var(--muted)] uppercase tracking-wider">{label}</label>
            <select className="input-field" value={value} onChange={e => set(e.target.value)}>
              <option value="">Seleccionar</option>
              {opts.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
        ))}

        {error && <p className="text-xs text-[var(--down)] text-center">{error}</p>}
        <button className="btn-login mt-2" onClick={save} disabled={saving}>
          {saving ? 'GUARDANDO...' : 'GUARDAR Y ENTRAR 🚀'}
        </button>
        <button className="text-xs text-[var(--muted)] text-center" onClick={skip}>Omitir por ahora →</button>
        <div className="h-8" />
      </div>
    </div>
  )
}
