import { useState, useEffect } from 'react'
import { doc, getDoc, setDoc } from 'firebase/firestore'
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
            <button className="btn-login" onClick={onRegister}>
              CREAR CUENTA GRATIS
            </button>
            <button className="btn-outline py-2.5 text-sm" onClick={onClose}>
              Seguir en modo demo
            </button>
          </div>
        </div>
      </div>
    )
  }
  const [partners, setPartners] = useState([])
  const [loading,  setLoading]  = useState(true)
  const [expanded, setExpanded] = useState({})

  const myLink     = `${window.location.origin}${window.location.pathname}?partner=${currentUser?.uid}`
  const urlParams  = new URLSearchParams(window.location.search)
  const inviteUid  = urlParams.get('partner')
  const partnerIds = state?.partners || []

  useEffect(() => { loadPartners() }, [])

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

  async function acceptPartner(uid) {
    const newPartners = [...partnerIds, uid]
    updateState(prev => ({ ...prev, partners: newPartners }))
    // Mutual link
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
    window.history.replaceState({}, '', window.location.pathname)
    showToast('✓ Partner vinculado 🤝', 'ok')
    loadPartners()
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

      <div className="p-6 max-w-[500px] mx-auto flex flex-col gap-4">
        {/* My link */}
        <section className="flex flex-col gap-3">
          <div className="section-title">Mi enlace de partner</div>
          <div className="bg-[var(--surface2)] border border-[var(--border-color)] rounded-xl p-3 text-xs text-[var(--muted)] break-all">{myLink}</div>
          <button className="btn-accent w-full py-2.5 text-sm" onClick={copyLink}>📋 Copiar enlace</button>
          <p className="text-xs text-[var(--muted)]">Comparte este enlace con tu compañero — puedes tener <strong className="text-[var(--text)]">múltiples partners</strong>.</p>
        </section>

        {/* Pending invite */}
        {inviteUid && inviteUid !== currentUser?.uid && !partnerIds.includes(inviteUid) && (
          <div className="p-3 bg-[var(--surface2)] border border-accent rounded-xl">
            <p className="text-sm mb-3">🔗 Tienes una invitación de partner pendiente</p>
            <button className="btn-accent w-full py-2 text-sm" onClick={() => acceptPartner(inviteUid)}>✓ Aceptar invitación</button>
          </div>
        )}

        {/* Partners list */}
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
