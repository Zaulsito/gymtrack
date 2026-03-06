import { useState, useEffect } from 'react'
import { doc, getDoc, setDoc, collection, query, where, getDocs } from 'firebase/firestore'
import { db } from '../../lib/firebase'
import { useApp } from '../../context/AppContext'

export default function PartnerScreen({ onClose, onRegister }) {
  const { state, updateState, currentUser, showToast, isDemoMode } = useApp()

  // Mensaje especial en modo demo
  if (isDemoMode) {
    return (
      <div className="profile-screen">
        <div className="bg-[var(--surface)] border-b border-[var(--border-color)] px-6 py-4 flex items-center gap-4 sticky top-0 z-10">
          <button className="text-accent text-xl" onClick={onClose}>←</button>
          <div className="font-bebas text-[1.4rem] tracking-widest">Partner</div>
        </div>
        <div className="p-6 max-w-[500px] mx-auto flex flex-col items-center gap-6 text-center mt-8">
          <div className="text-6xl">🤝</div>
          <h2 className="font-bebas text-2xl text-accent tracking-widest">Compañeros de entreno</h2>
          <p className="text-[var(--muted)] text-sm leading-relaxed">
            Con el sistema de partners puedes añadir amigos y compañeros para ver sus resultados y comparar el progreso juntos.
          </p>
          <div className="bg-[var(--surface2)] border border-[var(--border-color)] rounded-xl p-4 w-full text-sm text-[var(--muted)]">
            <div className="text-accent font-semibold mb-2">¿Cómo funciona?</div>
            <ul className="text-left flex flex-col gap-2">
              <li>✅ Comparte tu enlace con tu compañero</li>
              <li>✅ Él acepta la invitación</li>
              <li>✅ Ven el progreso del otro en tiempo real</li>
              <li>✅ Comparan pesos, repeticiones y evolución</li>
            </ul>
          </div>
          <div className="flex flex-col gap-3 w-full">
            <button className="btn-login" onClick={onRegister}>CREAR CUENTA GRATIS</button>
            <button className="btn-outline py-2.5 text-sm" onClick={onClose}>Seguir en modo demo</button>
          </div>
        </div>
      </div>
    )
  }

  const [partners,      setPartners]      = useState([])
  const [loading,       setLoading]       = useState(true)
  const [expanded,      setExpanded]      = useState({})
  const [inviterData,   setInviterData]   = useState(null)
  const [notifications, setNotifications] = useState([])
  const [searchUser,    setSearchUser]    = useState('')
  const [searchResult,  setSearchResult]  = useState(null)
  const [searching,     setSearching]     = useState(false)
  const [searchError,   setSearchError]   = useState('')

  const myLink    = `${window.location.origin}${window.location.pathname}?partner=${currentUser?.uid}`
  const inviteUid = new URLSearchParams(window.location.search).get('partner')
  const partnerIds = state?.partners || []

  useEffect(() => {
    if (!state?.partners) return
    loadPartners()
    loadNotifications()
    if (inviteUid && inviteUid !== currentUser?.uid && !partnerIds.includes(inviteUid)) {
      loadInviter(inviteUid)
    }
  }, [state?.partners])

  async function loadInviter(uid) {
    try {
      const snap = await getDoc(doc(db, 'users', uid))
      if (snap.exists()) setInviterData({ uid, ...snap.data() })
    } catch {}
  }

  async function loadPartners() {
    setLoading(true)
    const loaded = []
    for (const uid of partnerIds) {
      try {
        const snap = await getDoc(doc(db, 'users', uid))
        if (snap.exists()) loaded.push({ uid, ...snap.data() })
      } catch {}
    }
    setPartners(loaded)
    setLoading(false)
  }

  async function loadNotifications() {
    try {
      const snap = await getDoc(doc(db, 'users', currentUser.uid))
      if (snap.exists()) {
        const notifs = snap.data().notifications || []
        setNotifications(notifs.filter(n => !n.read))
      }
    } catch {}
  }

  async function sendNotification(toUid, message, type) {
    try {
      const notif = {
        id:      Date.now(),
        message,
        type,    // 'accepted' | 'rejected'
        from:    state?.displayName || currentUser?.email,
        read:    false,
        date:    new Date().toISOString(),
      }
      const theirRef  = doc(db, 'users', toUid)
      const theirSnap = await getDoc(theirRef)
      if (theirSnap.exists()) {
        const existing = theirSnap.data().notifications || []
        await setDoc(theirRef, { ...theirSnap.data(), notifications: [...existing, notif] })
      }
    } catch {}
  }

  async function dismissNotification(id) {
    try {
      const snap = await getDoc(doc(db, 'users', currentUser.uid))
      if (snap.exists()) {
        const updated = (snap.data().notifications || []).map(n => n.id === id ? { ...n, read: true } : n)
        await setDoc(doc(db, 'users', currentUser.uid), { ...snap.data(), notifications: updated })
        setNotifications(prev => prev.filter(n => n.id !== id))
      }
    } catch {}
  }

  async function searchByUsername() {
    const term = searchUser.trim().toLowerCase().replace('@', '')
    if (!term) return
    setSearching(true); setSearchError(''); setSearchResult(null)
    try {
      const q    = query(collection(db, 'users'), where('username', '==', term))
      const snap = await getDocs(q)
      if (snap.empty) { setSearchError('No se encontró ese usuario.'); setSearching(false); return }
      const found = { uid: snap.docs[0].id, ...snap.docs[0].data() }
      if (found.uid === currentUser?.uid) { setSearchError('Ese eres tú 😄'); setSearching(false); return }
      if (partnerIds.includes(found.uid)) { setSearchError('Ya es tu partner.'); setSearching(false); return }
      setSearchResult(found)
    } catch { setSearchError('Error al buscar.') }
    setSearching(false)
  }

  async function acceptPartner(uid) {
    const newPartners = [...partnerIds, uid]
    updateState(prev => ({ ...prev, partners: newPartners }))
    try {
      const theirRef  = doc(db, 'users', uid)
      const theirSnap = await getDoc(theirRef)
      if (theirSnap.exists()) {
        const theirData = theirSnap.data()
        if (!(theirData.partners || []).includes(currentUser.uid)) {
          await setDoc(theirRef, { ...theirData, partners: [...(theirData.partners || []), currentUser.uid] })
        }
      }
    } catch {}
    await sendNotification(uid, `${state?.displayName || 'Alguien'} aceptó tu invitación de partner 🤝`, 'accepted')
    window.history.replaceState({}, '', window.location.pathname)
    setInviterData(null)
    setSearchResult(null)
    setSearchUser('')
    showToast('✓ Partner vinculado 🤝', 'ok')
    // Auto-actualizar lista
    const loaded = [...partners]
    try {
      const snap = await getDoc(doc(db, 'users', uid))
      if (snap.exists()) loaded.push({ uid, ...snap.data() })
    } catch {}
    setPartners(loaded)
    setLoading(false)
  }

  async function rejectPartner(uid) {
    await sendNotification(uid, `${state?.displayName || 'Alguien'} rechazó tu invitación de partner`, 'rejected')
    window.history.replaceState({}, '', window.location.pathname)
    setInviterData(null)
    showToast('Invitación rechazada', '')
  }

  function skipInvite() {
    window.history.replaceState({}, '', window.location.pathname)
    setInviterData(null)
  }

  async function removePartner(uid) {
    if (!confirm('¿Desvincular este partner?')) return
    updateState(prev => ({ ...prev, partners: (prev.partners || []).filter(p => p !== uid) }))
    try {
      const theirRef  = doc(db, 'users', uid)
      const theirSnap = await getDoc(theirRef)
      if (theirSnap.exists()) {
        const theirData = theirSnap.data()
        await setDoc(theirRef, { ...theirData, partners: (theirData.partners || []).filter(p => p !== currentUser.uid) })
      }
    } catch {}
    showToast('✓ Partner desvinculado', '')
    loadPartners()
  }

  function copyLink() {
    navigator.clipboard.writeText(myLink).then(() => showToast('✓ Enlace copiado', 'ok'))
  }

  return (
    <div className="profile-screen">
      <div className="bg-[var(--surface)] border-b border-[var(--border-color)] px-6 py-4 flex items-center gap-4 sticky top-0 z-10">
        <button className="text-accent text-xl" onClick={onClose}>←</button>
        <div className="font-bebas text-[1.4rem] tracking-widest">Partner</div>
      </div>

      <div className="p-6 pb-6 max-w-[500px] mx-auto flex flex-col gap-4">

        {/* Notificaciones */}
        {notifications.length > 0 && (
          <section className="flex flex-col gap-2">
            <div className="section-title">Notificaciones</div>
            {notifications.map(n => (
              <div key={n.id} className={`rounded-xl border p-3 flex items-start gap-3 ${n.type === 'accepted' ? 'border-[rgba(57,255,20,0.3)] bg-[rgba(57,255,20,0.06)]' : 'border-[rgba(255,51,102,0.3)] bg-[rgba(255,51,102,0.06)]'}`}>
                <div className="text-2xl">{n.type === 'accepted' ? '🤝' : '❌'}</div>
                <div className="flex-1">
                  <p className="text-sm">{n.message}</p>
                  <p className="text-xs text-[var(--muted)] mt-1">{new Date(n.date).toLocaleDateString()}</p>
                </div>
                <button className="text-[var(--muted)] text-lg" onClick={() => dismissNotification(n.id)}>×</button>
              </div>
            ))}
          </section>
        )}

        {/* Invitación pendiente con datos del invitador */}
        {inviterData && (
          <div className="bg-[var(--surface2)] border-2 border-accent rounded-xl p-4 flex flex-col gap-4">
            <p className="text-sm font-semibold text-accent text-center">🔗 Invitación de partner</p>
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-full border-2 border-accent bg-[var(--surface)] flex items-center justify-center text-2xl flex-shrink-0 overflow-hidden">
                {inviterData.photoURL ? <img src={inviterData.photoURL} className="w-full h-full object-cover" alt="" /> : '👤'}
              </div>
              <div>
                <div className="font-semibold">{inviterData.displayName || 'Usuario'}</div>
                <div className="text-xs text-[var(--muted)]">@{inviterData.username || '-'}</div>
                {inviterData.goal && <div className="text-xs text-accent">🎯 {inviterData.goal}</div>}
                <div className="text-xs text-[var(--muted)]">{inviterData.exercises?.length || 0} ejercicios registrados</div>
              </div>
            </div>
            <p className="text-xs text-[var(--muted)] text-center">¿Quieres vincularte con este compañero?</p>
            <div className="flex gap-2">
              <button className="btn-danger flex-1 py-2 text-sm" onClick={() => rejectPartner(inviterData.uid)}>✕ Rechazar</button>
              <button className="btn-outline flex-1 py-2 text-sm" onClick={skipInvite}>⌁ Omitir</button>
              <button className="btn-accent flex-1 py-2 text-sm" onClick={() => acceptPartner(inviterData.uid)}>✓ Aceptar</button>
            </div>
          </div>
        )}

        {/* Mi enlace */}
        <section className="flex flex-col gap-3">
          <div className="section-title">Mi enlace de partner</div>
          <div className="bg-[var(--surface2)] border border-[var(--border-color)] rounded-xl p-3 text-xs text-[var(--muted)] break-all">{myLink}</div>
          <button className="btn-accent w-full py-2.5 text-sm" onClick={copyLink}>📋 Copiar enlace</button>
          <p className="text-xs text-[var(--muted)]">También puedes buscar a tu compañero por su <strong className="text-[var(--text)]">nombre de usuario</strong>:</p>
        </section>

        {/* Buscar por usuario */}
        <section className="flex flex-col gap-2">
          <div className="section-title">Buscar por usuario</div>
          <div className="flex gap-2">
            <input
              className="input-field flex-1"
              placeholder="@usuario"
              value={searchUser}
              onChange={e => { setSearchUser(e.target.value); setSearchError(''); setSearchResult(null) }}
              onKeyDown={e => e.key === 'Enter' && searchByUsername()}
            />
            <button className="btn-accent px-4 text-sm" onClick={searchByUsername} disabled={searching}>
              {searching ? '...' : '🔍'}
            </button>
          </div>
          {searchError && <p className="text-xs text-[var(--down)]">{searchError}</p>}
          {searchResult && (
            <div className="bg-[var(--surface2)] border border-accent rounded-xl p-3 flex items-center gap-3">
              <div className="w-12 h-12 rounded-full border-2 border-accent bg-[var(--surface)] flex items-center justify-center text-xl flex-shrink-0 overflow-hidden">
                {searchResult.photoURL ? <img src={searchResult.photoURL} className="w-full h-full object-cover" alt="" /> : '👤'}
              </div>
              <div className="flex-1">
                <div className="font-semibold">{searchResult.displayName || 'Usuario'}</div>
                <div className="text-xs text-[var(--muted)]">@{searchResult.username}</div>
                {searchResult.goal && <div className="text-xs text-accent">🎯 {searchResult.goal}</div>}
              </div>
              <button className="btn-accent px-3 py-1.5 text-sm" onClick={() => acceptPartner(searchResult.uid)}>
                + Añadir
              </button>
            </div>
          )}
        </section>

        {/* Lista de partners */}
        {loading ? (
          <div className="text-center text-[var(--muted)] py-8">Cargando...</div>
        ) : partners.length === 0 ? (
          <div className="text-center py-8 text-[var(--muted)]">
            <div className="text-4xl mb-3">🤝</div>
            <p>Aún no tienes partners vinculados.</p>
          </div>
        ) : (
          <section>
            <div className="section-title">Mis partners ({partners.length})</div>
            {partners.map(p => {
              const pLogs = p.logs?.[p.uid] || {}
              const exs   = p.exercises || []
              let sube = 0, baja = 0, mant = 0
              exs.forEach(ex => {
                const el = pLogs[String(ex.id)] || []
                if (el.length) {
                  const c = el[el.length-1].cond
                  if (c==='SUBE') sube++; else if (c==='BAJA') baja++; else mant++
                }
              })
              const isOpen = !!expanded[p.uid]
              return (
                <div key={p.uid} className="bg-[var(--surface2)] border border-[var(--border-color)] rounded-xl mb-3 overflow-hidden">
                  <div className="flex items-center gap-3 p-3 cursor-pointer" onClick={() => setExpanded(v => ({ ...v, [p.uid]: !isOpen }))}>
                    <div className="w-12 h-12 rounded-full border-2 border-accent bg-[var(--surface)] flex items-center justify-center text-xl flex-shrink-0 overflow-hidden">
                      {p.photoURL ? <img src={p.photoURL} className="w-full h-full object-cover" alt="" /> : '👤'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold">{p.displayName || p.username || 'Partner'}</div>
                      <div className="text-xs text-[var(--muted)]">@{p.username || '-'} · {exs.length} ejercicios</div>
                      {p.goal && <div className="text-xs text-accent">🎯 {p.goal}</div>}
                    </div>
                    <span className="text-[var(--muted)]">{isOpen ? '▴' : '▾'}</span>
                  </div>
                  {isOpen && (
                    <div className="px-3 pb-3">
                      <div className="grid grid-cols-3 gap-2 mb-3">
                        {[['var(--up)','⬆ Sube',sube],['var(--hold)','⬌ Mant.',mant],['var(--down)','⬇ Baja',baja]].map(([color,label,val]) => (
                          <div key={label} className="bg-[var(--surface)] rounded-lg p-2 text-center">
                            <div className="font-bold text-base" style={{ color }}>{val}</div>
                            <div className="text-[0.62rem] text-[var(--muted)]">{label}</div>
                          </div>
                        ))}
                      </div>
                      <div className="text-xs text-[var(--muted)] uppercase tracking-wider mb-2">Ejercicios</div>
                      {exs.length === 0
                        ? <p className="text-xs text-[var(--muted)]">Sin ejercicios.</p>
                        : exs.map(ex => {
                            const el   = pLogs[String(ex.id)] || []
                            const last = el.length ? el[el.length-1] : null
                            return (
                              <div key={ex.id} className="flex justify-between items-center py-1.5 border-b border-[var(--border-color)]">
                                <div>
                                  <span className="text-[var(--muted)] text-xs mr-1">{ex.num}</span>
                                  <span className="text-sm">{ex.name}</span>
                                </div>
                                <div className="text-right text-xs">
                                  {last ? <div className="font-semibold">{last.peso||'-'} kg</div> : <div className="text-[var(--muted)]">Sin datos</div>}
                                  {last?.cond && <div style={{ color: last.cond==='SUBE'?'var(--up)':last.cond==='BAJA'?'var(--down)':'var(--hold)' }}>{last.cond}</div>}
                                </div>
                              </div>
                            )
                          })
                      }
                      <button className="btn-danger w-full mt-3 py-1.5 text-xs" onClick={() => removePartner(p.uid)}>✕ Desvincular</button>
                    </div>
                  )}
                </div>
              )
            })}
          </section>
        )}
      </div>
    </div>
  )
}
