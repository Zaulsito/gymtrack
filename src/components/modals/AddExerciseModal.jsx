import { useState } from 'react'
import { useApp } from '../../context/AppContext'
import { today, calcCondition } from '../../lib/utils'
import ManageCatsModal from './ManageCatsModal'

export default function AddExerciseModal({ onClose }) {
  const { state, updateState, showToast, logsKey } = useApp()
  const [name,        setName]        = useState('')
  const [cat,         setCat]         = useState(state?.currentCat !== 'Todas' ? state.currentCat : (state?.categories?.[0] || ''))
  const [peso,        setPeso]        = useState('')
  const [reps,        setReps]        = useState('')
  const [series,      setSeries]      = useState('')
  const [tam,         setTam]         = useState('')
  const [extraType,   setExtraType]   = useState('maquina') // 'maquina' | 'descripcion'
  const [extraValue,  setExtraValue]  = useState('')
  const [showMore,    setShowMore]    = useState(false)
  const [showTooltip, setShowTooltip] = useState(false)
  const [showCatModal, setShowCatModal] = useState(false)

  const nextNum = (state?.exercises?.length || 0) + 1

  function addExercise() {
    if (!name.trim()) { showToast('⚠ Ingresa el nombre del ejercicio', 'warn'); return }
    if (extraType === 'maquina' && extraValue && isNaN(Number(extraValue))) {
      showToast('⚠ El número de máquina debe ser un número', 'warn'); return
    }
    updateState(prev => {
      const newId = prev.nextId
      const uid   = logsKey()
      const next  = { ...prev, nextId: newId + 1 }
      next.exercises = [...(next.exercises || []), {
        id:          newId,
        num:         String(nextNum),
        name:        name.trim().toUpperCase(),
        cat,
        maquina:     extraType === 'maquina'     ? extraValue.trim() : '',
        descripcion: extraType === 'descripcion' ? extraValue.trim() : '',
      }]
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

            {/* Nombre */}
            <div className="flex flex-col gap-1">
              <label className="text-xs text-[var(--muted)] uppercase tracking-wider">Nombre del ejercicio</label>
              <input className="input-field" placeholder="Ej: Press de Pierna Sentado" value={name} onChange={e => setName(e.target.value)} />
            </div>

            {/* ID automático — solo informativo */}
            <div className="flex items-center gap-2 px-3 py-2 bg-[var(--surface2)] border border-[var(--border-color)] rounded-lg">
              <span className="text-xs text-[var(--muted)] uppercase tracking-wider">ID asignado:</span>
              <span className="text-accent font-bold text-sm">#{nextNum}</span>
              <span className="text-xs text-[var(--muted)] ml-auto">automático</span>
            </div>

            {/* Categoría */}
            <div className="flex flex-col gap-1">
              <label className="text-xs text-[var(--muted)] uppercase tracking-wider">Categoría</label>
              <div className="flex gap-2">
                <select className="input-field flex-1" value={cat} onChange={e => setCat(e.target.value)}>
                  {(state?.categories || []).map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <button className="btn-outline px-3" onClick={() => setShowCatModal(true)} title="Gestionar categorías">⚙</button>
              </div>
            </div>

            {/* Añadir más toggle */}
            <button
              className="text-xs text-accent font-semibold text-left flex items-center gap-1"
              onClick={() => setShowMore(v => !v)}
            >
              {showMore ? '▴ Ocultar' : '▾ Añadir más'}
            </button>

            {/* Campo extra: Máquina o Descripción */}
            {showMore && (
              <div className="flex flex-col gap-2 bg-[var(--surface2)] border border-[var(--border-color)] rounded-xl p-3">
                <div className="flex items-center gap-2">
                  <select
                    className="input-field flex-1"
                    value={extraType}
                    onChange={e => { setExtraType(e.target.value); setExtraValue('') }}
                  >
                    <option value="maquina">🏋 Máquina</option>
                    <option value="descripcion">📝 Descripción</option>
                  </select>
                  <div className="relative flex-shrink-0">
                    <button
                      className="w-[20px] h-[20px] rounded-full border border-[var(--muted)] text-[var(--muted)] text-[10px] font-bold flex items-center justify-center"
                      onMouseEnter={() => setShowTooltip(true)}
                      onMouseLeave={() => setShowTooltip(false)}
                      onTouchStart={() => setShowTooltip(v => !v)}
                    >!</button>
                    {showTooltip && (
                      <div className="absolute right-0 top-6 z-50 w-60 bg-[var(--surface)] border border-[var(--border-color)] rounded-lg p-2 text-xs text-[var(--muted)] shadow-2xl">
                        Si usas máquinas de gimnasio, pon el número de la máquina. Si no, puedes agregar una descripción del ejercicio.
                      </div>
                    )}
                  </div>
                </div>

                {extraType === 'maquina' ? (
                  <input
                    className="input-field"
                    type="number"
                    placeholder="Ej: 12"
                    value={extraValue}
                    onChange={e => setExtraValue(e.target.value)}
                  />
                ) : (
                  <input
                    className="input-field"
                    type="text"
                    placeholder="Ej: Agarre neutro, con mancuernas..."
                    value={extraValue}
                    onChange={e => setExtraValue(e.target.value)}
                  />
                )}
              </div>
            )}

            {/* Primer registro */}
            <div className="border-t border-[var(--border-color)] pt-4">
              <div className="text-xs text-[var(--muted)] uppercase tracking-wider mb-3">Primer registro (opcional)</div>
              <div className="grid grid-cols-2 gap-2">
                <input className="input-field" placeholder="Peso (kg)"    value={peso}   onChange={e => setPeso(e.target.value)} />
                <input className="input-field" placeholder="Reps"          value={reps}   onChange={e => setReps(e.target.value)} />
                <input className="input-field" placeholder="Series"        value={series} onChange={e => setSeries(e.target.value)} />
                <input className="input-field" placeholder="Tamaño S/M/L"  value={tam}    onChange={e => setTam(e.target.value)} />
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
