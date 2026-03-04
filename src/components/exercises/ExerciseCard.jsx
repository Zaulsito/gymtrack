import { useState } from 'react'
import { useApp } from '../../context/AppContext'
import { today, formatDate, calcCondition, MAX_LOGS } from '../../lib/utils'
import ExerciseChart from './ExerciseChart'

function CondBadge({ cond }) {
  if (!cond) return null
  const cls   = cond === 'SUBE' ? 'badge-sube' : cond === 'BAJA' ? 'badge-baja' : 'badge-mantiene'
  const icon  = cond === 'SUBE' ? '↑' : cond === 'BAJA' ? '↓' : '→'
  return <span className={cls}>{icon} {cond}</span>
}

export default function ExerciseCard({ ex, logs = [] }) {
  const { updateState, myLogs, isDemoMode, showToast } = useApp()
  const [expanded, setExpanded]   = useState(false)
  const [peso,   setPeso]   = useState('')
  const [reps,   setReps]   = useState('')
  const [series, setSeries] = useState('')
  const [tam,    setTam]    = useState('')
  const [fecha,  setFecha]  = useState(today())

  const lastCond  = logs.length ? logs[logs.length - 1].cond : null
  const condColor = lastCond === 'SUBE' ? 'var(--up)' : lastCond === 'BAJA' ? 'var(--down)' : lastCond === 'MANTIENE' ? 'var(--hold)' : 'var(--border-color)'
  const isFull    = logs.length >= MAX_LOGS

  function addLog() {
    if (!peso && !reps) { showToast('⚠ Ingresa al menos el peso o las reps', 'warn'); return }

    const cond = calcCondition(logs, peso, reps)
    const newLog = { peso, reps, series, tam, fecha: fecha || today(), cond }

    updateState(prev => {
      const uid  = Object.keys(prev.logs || {})[0] || 'demo'
      const next = { ...prev }
      if (!next.logs[uid]) next.logs[uid] = {}
      const arr  = [...(next.logs[uid][String(ex.id)] || []), newLog]
      let removed = false
      if (arr.length > MAX_LOGS) { arr.shift(); removed = true }
      next.logs[uid][String(ex.id)] = arr

      // Mark today as trained
      if (!next.trainedDays) next.trainedDays = {}
      if (!next.trainedDays[today()]) next.trainedDays[today()] = { note: '' }

      return next
    })

    const msgs = { SUBE: '🔥 ¡Brutal! Superaste tu marca', BAJA: '💪 No te rindas, mañana lo recuperas', MANTIENE: '🎯 Consistencia es la clave' }
    showToast(msgs[cond] || '✓ Guardado', cond === 'SUBE' ? 'ok' : cond === 'BAJA' ? 'warn' : '')
    setPeso(''); setReps(''); setSeries(''); setTam(''); setFecha(today())
    setExpanded(true)
  }

  function deleteLog(idx) {
    if (!confirm('¿Eliminar este registro?')) return
    updateState(prev => {
      const uid  = Object.keys(prev.logs || {})[0] || 'demo'
      const next = { ...prev }
      const arr  = [...(next.logs[uid]?.[String(ex.id)] || [])]
      arr.splice(idx, 1)
      next.logs[uid][String(ex.id)] = arr
      return next
    })
  }

  function deleteExercise() {
    if (!confirm('¿Eliminar este ejercicio?')) return
    updateState(prev => {
      const uid  = Object.keys(prev.logs || {})[0] || 'demo'
      const next = { ...prev, exercises: prev.exercises.filter(e => e.id !== ex.id) }
      if (next.logs[uid]) delete next.logs[uid][String(ex.id)]
      return next
    })
  }

  return (
    <div className="bg-[var(--surface)] border border-[var(--border-color)] rounded-xl mb-4 overflow-hidden transition-colors hover:border-[rgba(200,255,0,0.3)]"
      style={{ borderLeft: `3px solid ${condColor}` }}>

      {/* Header */}
      <div className="grid gap-3 items-center px-4 py-3.5 cursor-pointer"
        style={{ gridTemplateColumns: '40px 1fr auto' }}
        onClick={() => setExpanded(v => !v)}>
        <div className="font-bebas text-[1.4rem] text-accent text-center">{ex.num}</div>
        <div>
          <div className="font-semibold text-[0.95rem]">{ex.name}</div>
          <span className="text-xs text-[var(--muted)]">{ex.cat}</span>
        </div>
        <div className="flex items-center gap-2">
          {lastCond && <CondBadge cond={lastCond} />}
          <span className="text-[var(--muted)] transition-transform duration-300" style={{ display:'inline-block', transform: expanded ? 'rotate(180deg)' : 'none' }}>▾</span>
        </div>
      </div>

      {/* Body */}
      {expanded && (
        <div className="px-4 pb-4 border-t border-[var(--border-color)]">
          {/* Log table */}
          {logs.length > 0 ? (
            <div className="overflow-x-auto mt-3">
              <table className="w-full text-xs min-w-[500px]" style={{ borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    {['#','Peso','Reps','Series','Tamaño','Fecha','Condición',''].map(h => (
                      <th key={h} className="text-[var(--muted)] font-medium text-left py-1.5 px-2 border-b border-[var(--border-color)] uppercase text-[0.7rem] tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {logs.map((l, idx) => {
                    const isNewest = idx === logs.length - 1
                    const isOldest = idx === 0 && isFull
                    return (
                      <tr key={idx} className={isNewest ? 'bg-[rgba(200,255,0,0.04)]' : isOldest ? 'opacity-50' : ''}>
                        <td className="py-2 px-2 text-[var(--muted)] text-[0.7rem] whitespace-nowrap">
                          {isOldest ? '🗑 antiguo' : isNewest ? '★ actual' : idx + 1}
                        </td>
                        <td className="py-2 px-2 font-bold">{l.peso || '-'}</td>
                        <td className="py-2 px-2">{l.reps || '-'}</td>
                        <td className="py-2 px-2">{l.series || '-'}</td>
                        <td className="py-2 px-2">{l.tam || '-'}</td>
                        <td className="py-2 px-2 text-[var(--muted)] whitespace-nowrap">{formatDate(l.fecha)}</td>
                        <td className="py-2 px-2"><CondBadge cond={l.cond} /></td>
                        <td className="py-2 px-2">
                          <button className="btn-danger py-0.5 px-1.5 text-[0.7rem]" onClick={() => deleteLog(idx)}>✕</button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-[var(--muted)] text-sm py-2 mt-2">Sin registros aún.</p>
          )}

          {/* Chart */}
          <ExerciseChart logs={logs} />

          {/* Max logs warning */}
          {isFull && (
            <div className="flex items-center gap-2 mt-3 p-2 rounded-lg text-xs text-[var(--hold)] border border-[rgba(255,215,0,0.2)] bg-[rgba(255,215,0,0.08)]">
              ⚠ Límite de 3 registros — el más antiguo se eliminará al guardar uno nuevo.
            </div>
          )}

          {/* Add log row */}
          <div className="grid gap-2 mt-3 pt-3 border-t border-dashed border-[var(--border-color)]"
            style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(90px, 1fr))' }}>
            <input className="input-field" placeholder="Peso (kg)" value={peso}   onChange={e => setPeso(e.target.value)} />
            <input className="input-field" placeholder="Reps"       value={reps}   onChange={e => setReps(e.target.value)} />
            <input className="input-field" placeholder="Series"     value={series} onChange={e => setSeries(e.target.value)} />
            <input className="input-field" placeholder="Tamaño"     value={tam}    onChange={e => setTam(e.target.value)} />
            <input className="input-field" type="date"              value={fecha}  onChange={e => setFecha(e.target.value)} />
            <button className="btn-accent text-sm py-2" onClick={addLog}>✓ Guardar</button>
          </div>

          <div className="mt-3">
            <button className="btn-outline text-xs py-1 px-3" onClick={deleteExercise}>🗑 Eliminar ejercicio</button>
          </div>
        </div>
      )}
    </div>
  )
}
