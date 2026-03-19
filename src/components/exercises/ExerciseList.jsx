import { useState, useRef } from 'react'
import { useApp } from '../../context/AppContext'
import ExerciseCard from './ExerciseCard'
import AddExerciseModal from '../modals/AddExerciseModal'

const CAT_ICONS = {
  'Todas':       '▦',
  'Piernas':     '🦵',
  'Brazos':      '💪',
  'Cuerpo':      '🧍',
  'Caderas':     '🍑',
  'Pecho':       '🫀',
  'Mancuernas':  '🏋️',
  'Abdominal':   '⚡',
  'Espalda':     '🔙',
  'Otros':       '➕',
}

export default function ExerciseList() {
  const { state, updateState, myLogs } = useApp()
  const [search,    setSearch]    = useState('')
  const [showModal, setShowModal] = useState(false)
  const [condFilter, setCondFilter] = useState(null) // 'SUBE' | 'BAJA' | 'MANTIENE' | null
  const [restTimer, setRestTimer] = useState(null)  // seconds remaining
  const [restMax,   setRestMax]   = useState(90)
  const restRef = useRef(null)
  const dragIndex = useRef(null)
  const dragOver  = useRef(null)

  // Recuperar timer si la app vuelve del segundo plano
  useRef(() => {
    const endTime = parseInt(localStorage.getItem('gymtrack_rest_end') || '0')
    const maxSecs = parseInt(localStorage.getItem('gymtrack_rest_max') || '90')
    const remaining = Math.round((endTime - Date.now()) / 1000)
    if (remaining > 0) {
      setRestMax(maxSecs)
      setRestTimer(remaining)
      restRef.current = setInterval(() => {
        setRestTimer(() => {
          const end = parseInt(localStorage.getItem('gymtrack_rest_end') || '0')
          const rem = Math.max(0, Math.round((end - Date.now()) / 1000))
          if (rem <= 0) {
            clearInterval(restRef.current)
            localStorage.removeItem('gymtrack_rest_end')
            return 0
          }
          return rem
        })
      }, 500)
    }
  })

  if (!state) return null

  const logs       = myLogs()
  const currentCat = state.currentCat || 'Todas'
  const cats       = ['Todas', ...(state.categories || [])]

  let exercises = state.exercises || []
  if (currentCat !== 'Todas') exercises = exercises.filter(e => e.cat === currentCat)
  if (search) exercises = exercises.filter(e =>
    e.name.toLowerCase().includes(search.toLowerCase()) ||
    String(e.num).toLowerCase().includes(search.toLowerCase()) ||
    (e.maquina && String(e.maquina).includes(search))
  )

  // Filtro por condición al hacer click en stats
  if (condFilter) {
    exercises = exercises.filter(ex => {
      const exLogs = logs[String(ex.id)] || []
      if (!exLogs.length) return false
      return exLogs[exLogs.length - 1].cond === condFilter
    })
  }

  let sube = 0, baja = 0, mantiene = 0
  ;(state.exercises || []).filter(ex => currentCat === 'Todas' || ex.cat === currentCat).forEach(ex => {
    const exLogs = logs[String(ex.id)] || []
    if (exLogs.length) {
      const c = exLogs[exLogs.length - 1].cond
      if (c === 'SUBE') sube++
      else if (c === 'BAJA') baja++
      else mantiene++
    }
  })

  // Rest timer
  async function requestNotificationPermission() {
    if ('Notification' in window && Notification.permission === 'default') {
      await Notification.requestPermission()
    }
  }

  function playBeep() {
    try {
      const ctx  = new (window.AudioContext || window.webkitAudioContext)()
      const osc  = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.type = 'sine'
      osc.frequency.setValueAtTime(880, ctx.currentTime)
      osc.frequency.setValueAtTime(660, ctx.currentTime + 0.15)
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.3)
      gain.gain.setValueAtTime(0.4, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6)
      osc.start()
      osc.stop(ctx.currentTime + 0.6)
    } catch {}
  }

  function sendToSW(type, data = {}) {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({ type, ...data })
    }
  }

  async function startRestTimer(secs) {
    await requestNotificationPermission()
    clearInterval(restRef.current)
    setRestMax(secs)
    setRestTimer(secs)

    // Guardar endTime para recuperar si la app vuelve del fondo
    localStorage.setItem('gymtrack_rest_end', Date.now() + secs * 1000)
    localStorage.setItem('gymtrack_rest_max', secs)

    // Avisar al SW para notificación en segundo plano
    sendToSW('START_REST_TIMER', { seconds: secs })

    restRef.current = setInterval(() => {
      setRestTimer(prev => {
        // Recalcular desde endTime real (por si app estuvo en fondo)
        const endTime = parseInt(localStorage.getItem('gymtrack_rest_end') || '0')
        const remaining = Math.max(0, Math.round((endTime - Date.now()) / 1000))

        if (remaining <= 0) {
          clearInterval(restRef.current)
          localStorage.removeItem('gymtrack_rest_end')
          if (navigator.vibrate) navigator.vibrate([300, 100, 300])
          playBeep()
          return 0
        }
        return remaining
      })
    }, 500)
  }

  function stopRestTimer() {
    clearInterval(restRef.current)
    setRestTimer(null)
    localStorage.removeItem('gymtrack_rest_end')
    sendToSW('CANCEL_REST_TIMER')
  }

  const formatTime = s => s >= 60
    ? `${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`
    : `${s}s`

  // Drag & drop categories
  function onDragStart(i) { dragIndex.current = i }
  function onDragEnter(i) { dragOver.current  = i }
  function onDragEnd() {
    const from = dragIndex.current
    const to   = dragOver.current
    if (from === null || to === null || from === to) return
    const newCats = [...(state.categories || [])]
    const [moved] = newCats.splice(from - 1, 1)
    newCats.splice(to - 1, 0, moved)
    updateState(prev => ({ ...prev, categories: newCats }))
    dragIndex.current = null
    dragOver.current  = null
  }

  return (
    <>
      {/* ── DESKTOP LAYOUT ── */}
      <div className="hidden md:flex min-h-screen">

        {/* Sidebar */}
        <aside className="w-64 shrink-0 border-r border-[var(--border-color)] flex flex-col bg-[var(--bg)]">
          <div className="px-5 pt-6 pb-4">
            <p className="text-[10px] font-bold tracking-widest uppercase text-accent/60 mb-0.5">Exercise Categories</p>
            <p className="text-[9px] text-[var(--muted)] uppercase tracking-widest">Active: {currentCat}</p>
          </div>

          <nav className="flex-1 overflow-y-auto">
            {cats.map((cat, i) => (
              <button
                key={cat}
                draggable={cat !== 'Todas'}
                onDragStart={() => onDragStart(i)}
                onDragEnter={() => onDragEnter(i)}
                onDragEnd={onDragEnd}
                onDragOver={e => e.preventDefault()}
                onClick={() => updateState({ currentCat: cat }, false)}
                className={`w-full flex items-center gap-4 px-5 py-3.5 text-sm font-semibold tracking-widest uppercase transition-all text-left
                  ${currentCat === cat
                    ? 'bg-accent/10 text-accent border-r-2 border-accent'
                    : 'text-[var(--muted)] hover:bg-[var(--surface)] hover:text-[var(--text)]'
                  }`}
              >
                <span className="text-base w-5 text-center">{CAT_ICONS[cat] || '·'}</span>
                <span>{cat}</span>
              </button>
            ))}
          </nav>

          <div className="p-4 border-t border-[var(--border-color)]">
            <button
              className="w-full py-3.5 bg-accent text-black font-bebas text-sm tracking-widest rounded-xl flex items-center justify-center gap-2 hover:opacity-90 transition-all shadow-[0_0_20px_rgba(200,255,0,0.2)]"
              onClick={() => setShowModal(true)}
            >
              ＋ Nuevo Ejercicio
            </button>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto">
          {/* Search bar */}
          <div className="sticky top-0 z-10 bg-[var(--bg)]/80 backdrop-blur-xl border-b border-[var(--border-color)] px-6 py-3 flex items-center gap-4">
            <div className="flex items-center gap-2 bg-[var(--surface)] border border-[var(--border-color)] rounded-full px-4 py-2 flex-1 max-w-xs focus-within:border-accent transition-colors">
              <span className="text-[var(--muted)] text-sm">🔍</span>
              <input
                className="flex-1 bg-transparent border-none outline-none text-sm text-[var(--text)] placeholder:text-[var(--muted)]"
                placeholder="Buscar ejercicios..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
              {search && <button className="text-[var(--muted)] text-xs" onClick={() => setSearch('')}>✕</button>}
            </div>
          </div>

          <div className="p-6 pb-16">
            {/* Stats cards */}
            {exercises.length > 0 && (
              <div className="grid grid-cols-3 gap-5 mb-8">
                {[
                  { num: sube,     label: 'Sube',     sub: '+vs el mes pasado',     color: 'text-[var(--up)]',   border: 'border-[var(--up)]/20',   bg: 'bg-[rgba(57,255,20,0.05)]',  icon: '↑', cond: 'SUBE'     },
                  { num: mantiene, label: 'Mantiene', sub: 'Estabilidad alcanzada',  color: 'text-[var(--hold)]', border: 'border-[var(--hold)]/20', bg: 'bg-[rgba(255,215,0,0.05)]',  icon: '→', cond: 'MANTIENE' },
                  { num: baja,     label: 'Baja',     sub: 'Requiere enfoque',       color: 'text-[var(--down)]', border: 'border-[var(--down)]/20', bg: 'bg-[rgba(255,51,102,0.05)]', icon: '↓', cond: 'BAJA'     },
                ].map(({ num, label, sub, color, border, bg, icon, cond }) => (
                  <div
                    key={label}
                    onClick={() => setCondFilter(prev => prev === cond ? null : cond)}
                    className={`${bg} border ${border} rounded-2xl p-5 relative overflow-hidden cursor-pointer transition-all hover:scale-[1.02] select-none
                      ${condFilter === cond ? 'ring-2 ring-offset-1 ring-offset-[var(--bg)] scale-[1.02]' : 'hover:opacity-90'}
                    `}
                    style={condFilter === cond ? { ringColor: 'currentColor' } : {}}
                  >
                    <div className="absolute top-0 right-0 w-20 h-20 rounded-bl-full opacity-50" style={{ background: 'currentColor' }} />
                    <div className="flex items-center justify-between mb-3">
                      <span className={`font-bebas text-base tracking-widest ${color}`}>{label}</span>
                      <span className={`text-xl ${color}`}>{icon}</span>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className={`font-bebas text-5xl ${color}`}>{String(num).padStart(2,'0')}</span>
                      <span className="text-xs text-[var(--muted)] uppercase tracking-widest">Ejercicios</span>
                    </div>
                    <p className={`text-xs mt-2 ${color} opacity-60`}>{sub}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Session Progress + Rest Timer */}
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bebas text-2xl tracking-widest text-[var(--text)]">Session Progress</h3>
              <div className="flex items-center gap-3 bg-[var(--surface)] border border-[var(--border-color)] rounded-full px-4 py-2">
                <span className="text-accent text-sm">⏱</span>
                <span className="text-xs font-bold text-[var(--muted)] uppercase tracking-widest">Rest Timer:</span>
                <div className="flex gap-1.5">
                  {[{s:60,l:'1m'},{s:90,l:'1:30'},{s:120,l:'2m'},{s:180,l:'3m'}].map(({s,l}) => (
                    <button
                      key={s}
                      onClick={() => startRestTimer(s)}
                      className={`text-[10px] font-bold px-2 py-0.5 rounded transition-all
                        ${restMax === s && restTimer !== null
                          ? 'bg-accent text-black'
                          : 'bg-[var(--surface2)] text-[var(--muted)] hover:bg-accent hover:text-black'
                        }`}
                    >{l}</button>
                  ))}
                </div>
              </div>
            </div>

            {/* Active filter badge */}
            {condFilter && (
              <div className="flex items-center gap-2 mb-4">
                <span className="text-xs text-[var(--muted)]">Filtrando por:</span>
                <span className={`text-xs font-bold px-3 py-1 rounded-full border flex items-center gap-1
                  ${condFilter === 'SUBE'     ? 'text-[var(--up)]   border-[var(--up)]/40   bg-[rgba(57,255,20,0.08)]'  : ''}
                  ${condFilter === 'MANTIENE' ? 'text-[var(--hold)] border-[var(--hold)]/40 bg-[rgba(255,215,0,0.08)]'  : ''}
                  ${condFilter === 'BAJA'     ? 'text-[var(--down)] border-[var(--down)]/40 bg-[rgba(255,51,102,0.08)]' : ''}
                `}>
                  {condFilter === 'SUBE' ? '↑' : condFilter === 'BAJA' ? '↓' : '→'} {condFilter}
                  <button className="ml-1 opacity-60 hover:opacity-100" onClick={() => setCondFilter(null)}>✕</button>
                </span>
              </div>
            )}
            {exercises.length === 0 ? (
              <div className="text-center py-16 text-[var(--muted)]">
                <div className="text-6xl mb-4">{search ? '🔍' : '🏋️'}</div>
                <p className="text-sm">{search ? `No se encontró "${search}"` : 'No hay ejercicios. Presiona + para agregar uno.'}</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {exercises.map(ex => (
                  <ExerciseCard
                    key={ex.id}
                    ex={ex}
                    logs={logs[String(ex.id)] || []}
                    onStartTimer={startRestTimer}
                  />
                ))}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* ── MOBILE LAYOUT ── */}
      <div className="md:hidden">
        {/* Category tabs */}
        <div className="flex gap-2 overflow-x-auto px-4 py-3 scrollbar-hide bg-[var(--bg)] border-b border-[var(--border-color)]">
          {cats.map(cat => (
            <button
              key={cat}
              onClick={() => updateState({ currentCat: cat }, false)}
              className={`flex-none px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all
                ${currentCat === cat
                  ? 'bg-accent text-black'
                  : 'bg-[var(--surface)] text-[var(--muted)] border border-[var(--border-color)]'
                }`}
            >{cat}</button>
          ))}
        </div>

        {/* Search */}
        <div className="px-4 py-2 bg-[var(--bg)]">
          <div className="flex items-center gap-2 bg-[var(--surface)] border border-[var(--border-color)] rounded-xl px-3 py-2 focus-within:border-accent transition-colors">
            <span className="text-sm text-[var(--muted)]">🔍</span>
            <input
              className="flex-1 bg-transparent border-none outline-none text-sm text-[var(--text)] placeholder:text-[var(--muted)]"
              placeholder="Buscar por nombre o nº máquina..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            {search && <button className="text-[var(--muted)] text-xs" onClick={() => setSearch('')}>✕</button>}
          </div>
        </div>

        {/* Mobile stats */}
        {exercises.length > 0 && (
          <div className="grid grid-cols-3 gap-2 px-4 py-3">
            {[
              { num: sube,     label: 'Sube',     color: 'text-[var(--up)]',   icon: '↑', cond: 'SUBE'     },
              { num: mantiene, label: 'Mantiene', color: 'text-[var(--hold)]', icon: '→', cond: 'MANTIENE' },
              { num: baja,     label: 'Baja',     color: 'text-[var(--down)]', icon: '↓', cond: 'BAJA'     },
            ].map(({ num, label, color, icon, cond }) => (
              <div
                key={label}
                onClick={() => setCondFilter(prev => prev === cond ? null : cond)}
                className={`bg-[var(--surface)] border rounded-xl p-3 flex flex-col items-center gap-1 cursor-pointer transition-all active:scale-95
                  ${condFilter === cond ? 'border-accent' : 'border-[var(--border-color)]'}`}
              >
                <span className={`text-2xl ${color}`}>{icon}</span>
                <span className={`font-bebas text-2xl ${color}`}>{num}</span>
                <span className="text-[10px] text-[var(--muted)] uppercase tracking-widest">{label}</span>
              </div>
            ))}
          </div>
        )}

        {/* Mobile rest timer */}
        <div className="px-4 pb-2 flex items-center gap-2">
          <span className="text-xs text-[var(--muted)] font-semibold uppercase tracking-widest">⏱ Descanso:</span>
          <div className="flex gap-1.5">
            {[{s:60,l:'1m'},{s:90,l:'1:30'},{s:120,l:'2m'},{s:180,l:'3m'}].map(({s,l}) => (
              <button
                key={s}
                onClick={() => startRestTimer(s)}
                className={`text-[10px] font-bold px-2.5 py-1 rounded-lg transition-all
                  ${restMax === s && restTimer !== null
                    ? 'bg-accent text-black'
                    : 'bg-[var(--surface)] text-[var(--muted)] border border-[var(--border-color)]'
                  }`}
              >{l}</button>
            ))}
          </div>
        </div>

        {/* Exercise list mobile */}
        <div className="px-4 pb-28 flex flex-col gap-3">
          {exercises.length === 0 ? (
            <div className="text-center py-12 text-[var(--muted)]">
              <div className="text-5xl mb-4">{search ? '🔍' : '🏋️'}</div>
              <p className="text-sm">{search ? `No se encontró "${search}"` : 'No hay ejercicios. Presiona + para agregar uno.'}</p>
            </div>
          ) : (
            exercises.map(ex => (
              <ExerciseCard
                key={ex.id}
                ex={ex}
                logs={logs[String(ex.id)] || []}
                onStartTimer={startRestTimer}
              />
            ))
          )}
        </div>
      </div>

      {/* FAB mobile */}
      <button
        className="md:hidden fixed bottom-6 right-6 w-14 h-14 rounded-full bg-accent text-black text-3xl flex items-center justify-center shadow-[0_4px_20px_rgba(200,255,0,0.4)] hover:scale-110 transition-all z-50"
        onClick={() => setShowModal(true)}
      >+</button>

      {/* Rest Timer FAB (when active) */}
      {restTimer !== null && (
        <div className="fixed bottom-8 right-8 z-50 bg-[var(--surface)]/80 backdrop-blur-xl border border-accent/20 rounded-2xl shadow-2xl px-4 py-3 flex items-center gap-3 md:bottom-8 md:right-8 bottom-24">
          <div className="w-10 h-10 bg-accent rounded-xl flex items-center justify-center text-black font-bold text-lg">⏱</div>
          <div>
            <p className="text-[10px] font-bold text-accent uppercase tracking-widest">Rest Active</p>
            <p className="font-bebas text-2xl tracking-widest text-[var(--text)]">
              {restTimer === 0 ? '¡Ya!' : formatTime(restTimer)}
            </p>
          </div>
          {/* Progress ring */}
          <div className="relative w-8 h-8">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
              <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none" stroke="var(--border-color)" strokeWidth="3" />
              <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none" stroke="var(--accent)" strokeWidth="3" strokeLinecap="round"
                strokeDasharray={`${Math.round((restTimer / restMax) * 100)}, 100`} />
            </svg>
          </div>
          <button
            className="bg-[rgba(255,51,102,0.2)] text-[var(--down)] p-1.5 rounded-xl hover:bg-[rgba(255,51,102,0.4)] transition-all"
            onClick={stopRestTimer}
          >✕</button>
        </div>
      )}

      {showModal && <AddExerciseModal onClose={() => setShowModal(false)} />}
    </>
  )
}
