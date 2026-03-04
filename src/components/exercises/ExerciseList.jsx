import { useState } from 'react'
import { useApp } from '../../context/AppContext'
import ExerciseCard from './ExerciseCard'
import AddExerciseModal from '../modals/AddExerciseModal'

export default function ExerciseList() {
  const { state, updateState, myLogs, currentUser, isDemoMode } = useApp()
  const [search,   setSearch]   = useState('')
  const [showModal, setShowModal] = useState(false)

  if (!state) return null

  const logs       = myLogs()
  const currentCat = state.currentCat || 'Todas'
  const allCats    = ['Todas', ...(state.categories || [])]

  let exercises = state.exercises || []
  if (currentCat !== 'Todas') exercises = exercises.filter(e => e.cat === currentCat)
  if (search) exercises = exercises.filter(e =>
    e.name.toLowerCase().includes(search.toLowerCase()) ||
    String(e.num).toLowerCase().includes(search.toLowerCase())
  )

  // Stats
  let sube = 0, baja = 0, mantiene = 0
  exercises.forEach(ex => {
    const exLogs = logs[String(ex.id)] || []
    if (exLogs.length) {
      const c = exLogs[exLogs.length - 1].cond
      if (c === 'SUBE') sube++
      else if (c === 'BAJA') baja++
      else mantiene++
    }
  })

  return (
    <>
      {/* Category bar */}
      <div className="px-6 py-3 flex gap-2 overflow-x-auto scrollbar-hide flex-wrap bg-[var(--bg)]">
        {allCats.map(cat => (
          <button key={cat}
            className={`px-4 py-1.5 rounded-lg border text-xs whitespace-nowrap transition-all
              ${currentCat === cat
                ? 'border-[var(--accent2)] text-[var(--accent2)] bg-[rgba(255,107,53,0.1)]'
                : 'border-[var(--border-color)] bg-[var(--surface)] text-[var(--muted)] hover:border-[var(--muted)] hover:text-[var(--text)]'
              }`}
            onClick={() => updateState({ currentCat: cat }, false)}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="px-4 py-2 bg-[var(--surface)] border-b border-[var(--border-color)]">
        <div className="flex items-center gap-2 bg-[var(--surface2)] border border-[var(--border-color)] rounded-xl px-3 py-2 focus-within:border-accent transition-colors">
          <span className="text-sm">🔍</span>
          <input
            className="flex-1 bg-transparent border-none outline-none text-[var(--text)] text-sm placeholder:text-[var(--muted)]"
            placeholder="Buscar ejercicio..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && (
            <button className="text-[var(--muted)] text-xs hover:text-[var(--text)]" onClick={() => setSearch('')}>✕</button>
          )}
        </div>
      </div>

      {/* Main content */}
      <main className="px-6 py-4 pb-24 max-w-[1200px] mx-auto">
        {exercises.length > 0 && (
          <div className="grid grid-cols-3 gap-3 mb-4">
            {[
              { num: sube,     label: '⬆ Sube',     color: 'text-[var(--up)]'   },
              { num: mantiene, label: '⬌ Mantiene',  color: 'text-[var(--hold)]' },
              { num: baja,     label: '⬇ Baja',      color: 'text-[var(--down)]' },
            ].map(({ num, label, color }) => (
              <div key={label} className="bg-[var(--surface2)] border border-[var(--border-color)] rounded-xl p-3 text-center">
                <div className={`font-bebas text-[1.8rem] ${color}`}>{num}</div>
                <div className="text-xs text-[var(--muted)]">{label}</div>
              </div>
            ))}
          </div>
        )}

        {exercises.length === 0 ? (
          <div className="text-center py-12 text-[var(--muted)]">
            <div className="text-5xl mb-4">{search ? '🔍' : '🏋️'}</div>
            <p>{search ? `No se encontró "${search}"` : 'No hay ejercicios en esta categoría.\nPresiona + para agregar uno.'}</p>
          </div>
        ) : (
          exercises.map(ex => (
            <ExerciseCard
              key={ex.id}
              ex={ex}
              logs={logs[String(ex.id)] || []}
            />
          ))
        )}
      </main>

      {/* FAB */}
      <button
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-accent text-black border-0 text-3xl flex items-center justify-center shadow-[0_4px_20px_rgba(200,255,0,0.3)] hover:scale-110 hover:shadow-[0_6px_30px_rgba(200,255,0,0.5)] transition-all z-50 cursor-pointer"
        onClick={() => setShowModal(true)}
      >
        +
      </button>

      {showModal && <AddExerciseModal onClose={() => setShowModal(false)} />}
    </>
  )
}
