import { useState } from 'react'
import { useApp } from '../../context/AppContext'
import { today, calcCondition, MAX_LOGS } from '../../lib/utils'
import ManageCatsModal from './ManageCatsModal'

export default function AddExerciseModal({ onClose }) {
  const { state, updateState, myLogs, currentUser, showToast } = useApp()
  const [name,   setName]   = useState('')
  const [num,    setNum]    = useState('')
  const [cat,    setCat]    = useState(state?.currentCat !== 'Todas' ? state.currentCat : (state?.categories?.[0] || ''))
  const [peso,   setPeso]   = useState('')
  const [reps,   setReps]   = useState('')
  const [series, setSeries] = useState('')
  const [tam,    setTam]    = useState('')
  const [showCatModal, setShowCatModal] = useState(false)

  function addExercise() {
    if (!name.trim()) { showToast('⚠ Ingresa el nombre del ejercicio', 'warn'); return }
    updateState(prev => {
      const newId   = prev.nextId
      const uid     = currentUser?.uid || Object.keys(prev.logs || {})[0] || 'demo'
      const next    = { ...prev, nextId: newId + 1 }
      next.exercises = [...(next.exercises || []), { id: newId, num: num || '?', name: name.trim().toUpperCase(), cat }]
      if (!next.logs) next.logs = {}
      if (!next.logs[uid]) next.logs[uid] = {}
      if (peso || reps) {
        const cond = calcCondition([], peso, reps)
        next.logs[uid][String(newId)] = [{ peso, reps, series, tam, fecha: today(), cond }]
      }
      next.currentCat = cat
      return next
    })
    showToast(peso || reps ? '🔥 Ejercicio agregado con primer registro' : '✓ Ejercicio agregado', 'ok')
    onClose()
  }

  return (
    <>
      <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
        <div className="modal-box">
          <h2 className="font-bebas text-[1.6rem] tracking-wider text-accent mb-5">Nuevo Ejercicio</h2>

          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs text-[var(--muted)] uppercase tracking-wider">Nombre del ejercicio</label>
              <input className="input-field" placeholder="Ej: Press de Pierna Sentado" value={name} onChange={e => setName(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-[var(--muted)] uppercase tracking-wider">Número / ID</label>
              <input className="input-field" placeholder="Ej: 1, 2, 10..." value={num} onChange={e => setNum(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-[var(--muted)] uppercase tracking-wider">Categoría</label>
              <div className="flex gap-2">
                <select className="input-field flex-1" value={cat} onChange={e => setCat(e.target.value)}>
                  {(state?.categories || []).map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <button className="btn-outline px-3" onClick={() => setShowCatModal(true)} title="Gestionar categorías">⚙</button>
              </div>
            </div>

            <div className="border-t border-[var(--border-color)] pt-4">
              <div className="text-xs text-[var(--muted)] uppercase tracking-wider mb-3">Primer registro (opcional)</div>
              <div className="grid grid-cols-2 gap-2">
                <input className="input-field" placeholder="Peso (kg)" value={peso}   onChange={e => setPeso(e.target.value)} />
                <input className="input-field" placeholder="Reps"       value={reps}   onChange={e => setReps(e.target.value)} />
                <input className="input-field" placeholder="Series"     value={series} onChange={e => setSeries(e.target.value)} />
                <input className="input-field" placeholder="Tamaño S/M/L" value={tam} onChange={e => setTam(e.target.value)} />
              </div>
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <button className="btn-outline flex-1 py-2.5" onClick={onClose}>Cancelar</button>
            <button className="btn-accent flex-1 py-2.5" onClick={addExercise}>Agregar</button>
          </div>
        </div>
      </div>
      {showCatModal && <ManageCatsModal onClose={() => setShowCatModal(false)} />}
    </>
  )
}
