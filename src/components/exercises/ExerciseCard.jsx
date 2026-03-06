import { useState, useRef } from 'react'
import { useApp } from '../../context/AppContext'
import { today, formatDate, calcCondition, MAX_LOGS } from '../../lib/utils'
import ExerciseChart from './ExerciseChart'

function CondBadge({ cond }) {
  if (!cond) return null
  const cls  = cond === 'SUBE' ? 'badge-sube' : cond === 'BAJA' ? 'badge-baja' : 'badge-mantiene'
  const icon = cond === 'SUBE' ? '↑' : cond === 'BAJA' ? '↓' : '→'
  return <span className={cls}>{icon} {cond}</span>
}

function EditModal({ ex, onClose }) {
  const { state, updateState, showToast } = useApp()
  const [name,        setName]        = useState(ex.name)
  const [cat,         setCat]         = useState(ex.cat)
  const [extraType,   setExtraType]   = useState(ex.maquina ? 'maquina' : 'descripcion')
  const [extraValue,  setExtraValue]  = useState(ex.maquina || ex.descripcion || '')
  const [showTooltip, setShowTooltip] = useState(false)

  function save() {
    if (!name.trim()) { showToast('⚠ Ingresa el nombre', 'warn'); return }
    if (extraType === 'maquina' && extraValue && isNaN(Number(extraValue))) {
      showToast('⚠ El número de máquina debe ser un número', 'warn'); return
    }
    updateState(prev => ({
      ...prev,
      exercises: prev.exercises.map(e => e.id !== ex.id ? e : {
        ...e,
        name:        name.trim().toUpperCase(),
        cat,
        maquina:     extraType === 'maquina'     ? extraValue.trim() : '',
        descripcion: extraType === 'descripcion' ? extraValue.trim() : '',
      })
    }))
    showToast('✓ Ejercicio actualizado', 'ok')
    onClose()
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box">
        <h2 className="font-bebas text-[1.6rem] tracking-wider text-accent mb-4">Editar Ejercicio</h2>
        <div className="flex flex-col gap-4">

          <div className="flex flex-col gap-1">
            <label className="text-xs text-[var(--muted)] uppercase tracking-wider">Nombre</label>
            <input className="input-field" value={name} onChange={e => setName(e.target.value)} />
          </div>

          {/* ID no editable */}
          <div className="flex items-center gap-2 px-3 py-2 bg-[var(--surface2)] border border-[var(--border-color)] rounded-lg">
            <span className="text-xs text-[var(--muted)] uppercase tracking-wider">ID:</span>
            <span className="text-accent font-bold text-sm">#{ex.num}</span>
            <span className="text-xs text-[var(--muted)] ml-auto">no editable</span>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs text-[var(--muted)] uppercase tracking-wider">Categoría</label>
            <select className="input-field" value={cat} onChange={e => setCat(e.target.value)}>
              {(state?.categories || []).map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div className="flex flex-col gap-2 bg-[var(--surface2)] border border-[var(--border-color)] rounded-xl p-3">
            <div className="flex items-center gap-2">
              <select className="input-field flex-1" value={extraType} onChange={e => { setExtraType(e.target.value); setExtraValue('') }}>
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
                    Si usas máquinas de gimnasio, pon el número. Si no, agrega una descripción.
                  </div>
                )}
              </div>
            </div>
            {extraType === 'maquina'
              ? <input className="input-field" type="number" placeholder="Ej: 12" value={extraValue} onChange={e => setExtraValue(e.target.value)} />
              : <input className="input-field" type="text"   placeholder="Ej: Agarre neutro..." value={extraValue} onChange={e => setExtraValue(e.target.value)} />
            }
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button className="btn-outline flex-1 py-2.5" onClick={onClose}>Cancelar</button>
          <button className="btn-accent flex-1 py-2.5" onClick={save}>Guardar</button>
        </div>
      </div>
    </div>
  )
}

export default function ExerciseCard({ ex, logs = [] }) {
  const { updateState, showToast, logsKey } = useApp()
  const [expanded,  setExpanded]  = useState(false)
  const [showEdit,  setShowEdit]  = useState(false)
  const [timerSecs, setTimerSecs] = useState(null)  // null = off, >0 = running
  const [timerMax,  setTimerMax]  = useState(90)
  const timerRef = useRef(null)

  function startTimer(secs) {
    clearInterval(timerRef.current)
    setTimerMax(secs)
    setTimerSecs(secs)
    timerRef.current = setInterval(() => {
      setTimerSecs(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current)
          // Vibrar al terminar
          if (navigator.vibrate) navigator.vibrate([300, 100, 300])
          // Sonido al terminar
          try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)()
            const osc = ctx.createOscillator()
            const gain = ctx.createGain()
            osc.connect(gain); gain.connect(ctx.destination)
            osc.frequency.value = 880
            gain.gain.setValueAtTime(0.3, ctx.currentTime)
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8)
            osc.start(); osc.stop(ctx.currentTime + 0.8)
          } catch {}
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  function stopTimer() {
    clearInterval(timerRef.current)
    setTimerSecs(null)
  }
  const [peso,      setPeso]      = useState('')
  const [reps,      setReps]      = useState('')
  const [series,    setSeries]    = useState('')
  const [tam,       setTam]       = useState('')
  const [secs,      setSecs]      = useState('')
  const [fecha,     setFecha]     = useState(today())

  const lastCond  = logs.length ? logs[logs.length - 1].cond : null
  const condColor = lastCond === 'SUBE' ? 'var(--up)' : lastCond === 'BAJA' ? 'var(--down)' : lastCond === 'MANTIENE' ? 'var(--hold)' : 'var(--border-color)'
  const isFull    = logs.length >= MAX_LOGS

  function addLog() {
    if (!peso && !reps && !secs) { showToast('⚠ Ingresa al menos peso, reps o segundos', 'warn'); return }
    const cond   = calcCondition(logs, peso, reps, secs)
    const newLog = { peso, reps, series, tam, secs, fecha: fecha || today(), cond }
    updateState(prev => {
      const uid  = logsKey()
      const next = { ...prev }
      if (!next.logs[uid]) next.logs[uid] = {}
      const arr  = [...(next.logs[uid][String(ex.id)] || []), newLog]
      if (arr.length > MAX_LOGS) arr.shift()
      next.logs[uid][String(ex.id)] = arr
      if (!next.trainedDays) next.trainedDays = {}
      if (!next.trainedDays[today()]) next.trainedDays[today()] = { note: '' }
      return next
    })
    const msgs = { SUBE: '🔥 ¡Brutal! Superaste tu marca', BAJA: '💪 No te rindas, mañana lo recuperas', MANTIENE: '🎯 Consistencia es la clave' }
    showToast(msgs[cond] || '✓ Guardado', cond === 'SUBE' ? 'ok' : cond === 'BAJA' ? 'warn' : '')
    setPeso(''); setReps(''); setSeries(''); setTam(''); setSecs(''); setFecha(today())
    setExpanded(true)
  }

  function deleteLog(idx) {
    if (!confirm('¿Eliminar este registro?')) return
    updateState(prev => {
      const uid  = logsKey()
      const next = { ...prev }
      const arr  = [...(next.logs[uid]?.[String(ex.id)] || [])]
      arr.splice(idx, 1)
      next.logs[uid][String(ex.id)] = arr
      return next
    })
  }

  function deleteExercise() {
    if (!confirm(`¿Eliminar el ejercicio "${ex.name}"? Esta acción no se puede deshacer.`)) return
    updateState(prev => {
      const uid  = logsKey()
      const next = { ...prev, exercises: prev.exercises.filter(e => e.id !== ex.id) }
      if (next.logs[uid]) delete next.logs[uid][String(ex.id)]
      return next
    })
  }

  return (
    <>
      <div className="bg-[var(--surface)] border border-[var(--border-color)] rounded-xl mb-4 overflow-hidden transition-colors hover:border-[rgba(200,255,0,0.3)]"
        style={{ borderLeft: `3px solid ${condColor}` }}>

        {/* Header */}
        <div className="grid gap-3 items-center px-4 py-3.5 cursor-pointer"
          style={{ gridTemplateColumns: '40px 1fr auto' }}
          onClick={() => setExpanded(v => !v)}>
          <div className="font-bebas text-[1.4rem] text-accent text-center">{ex.num}</div>
          <div>
            <div className="font-semibold text-[0.95rem]">{ex.name}</div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-[var(--muted)]">{ex.cat}</span>
              {ex.maquina     && <span className="text-xs text-[var(--muted)]">🏋 Máq. {ex.maquina}</span>}
              {ex.descripcion && <span className="text-xs text-[var(--muted)] italic">{ex.descripcion}</span>}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {lastCond && <CondBadge cond={lastCond} />}
            <span className="text-[var(--muted)] transition-transform duration-300" style={{ display:'inline-block', transform: expanded ? 'rotate(180deg)' : 'none' }}>▾</span>
          </div>
        </div>

        {/* Body */}
        {expanded && (
          <div className="px-4 pb-4 border-t border-[var(--border-color)]">
            {logs.length > 0 ? (
              <div className="overflow-x-auto mt-3">
                <table className="w-full text-xs min-w-[500px]" style={{ borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      {['#','Peso','Reps','Segs','Series','Tamaño','Fecha','Condición',''].map(h => (
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
                          <td className="py-2 px-2">{l.secs ? `${l.secs}s` : '-'}</td>
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

            <ExerciseChart logs={logs} />

            {isFull && (
              <div className="flex items-center gap-2 mt-3 p-2 rounded-lg text-xs text-[var(--hold)] border border-[rgba(255,215,0,0.2)] bg-[rgba(255,215,0,0.08)]">
                ⚠ Límite de {MAX_LOGS} registros — el más antiguo se eliminará al guardar uno nuevo.
              </div>
            )}

            <div className="grid gap-2 mt-3 pt-3 border-t border-dashed border-[var(--border-color)]"
              style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(90px, 1fr))' }}>
              <input className="input-field" placeholder="Peso (kg)" value={peso}   onChange={e => setPeso(e.target.value)} />
              <input className="input-field" placeholder="Reps"       value={reps}   onChange={e => setReps(e.target.value)} />
              <input className="input-field" placeholder="Segundos"   value={secs}   onChange={e => setSecs(e.target.value)} />
              <input className="input-field" placeholder="Series"     value={series} onChange={e => setSeries(e.target.value)} />
              <input className="input-field" placeholder="Tamaño"     value={tam}    onChange={e => setTam(e.target.value)} />
              <input className="input-field" type="date"              value={fecha}  onChange={e => setFecha(e.target.value)} />
              <button className="btn-accent text-sm py-2" onClick={addLog}>✓ Guardar</button>
            </div>

            <div className="flex gap-2 mt-3">
              <button className="btn-outline text-xs py-1 px-3" onClick={() => setShowEdit(true)}>✏ Editar ejercicio</button>
              <button className="btn-danger  text-xs py-1 px-3" onClick={deleteExercise}>🗑 Eliminar ejercicio</button>
            </div>

            {/* Timer de descanso */}
            <div className="mt-3 pt-3 border-t border-dashed border-[var(--border-color)]">
              {timerSecs === null ? (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-[var(--muted)]">⏱ Descanso:</span>
                  {[{s:60,l:'1m'},{s:90,l:'1:30'},{s:120,l:'2m'},{s:180,l:'3m'}].map(({s,l}) => (
                    <button key={s} className="btn-outline text-xs py-1 px-3" onClick={() => startTimer(s)}>
                      {l}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  {/* Barra de progreso */}
                  <div className="flex-1 bg-[var(--surface)] rounded-full h-2 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-1000"
                      style={{
                        width: `${(timerSecs / timerMax) * 100}%`,
                        background: timerSecs <= 10 ? 'var(--down)' : timerSecs <= 30 ? 'var(--hold)' : 'var(--accent)'
                      }}
                    />
                  </div>
                  <span
                    className="font-bebas text-xl w-16 text-right"
                    style={{ color: timerSecs <= 10 ? 'var(--down)' : timerSecs <= 30 ? 'var(--hold)' : 'var(--accent)' }}
                  >
                    {timerSecs === 0 ? '¡Ya!' : timerSecs >= 60 ? `${Math.floor(timerSecs/60)}:${String(timerSecs%60).padStart(2,'0')}` : `${timerSecs}s`}
                  </span>
                  <button className="btn-danger text-xs py-1 px-2" onClick={stopTimer}>✕</button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {showEdit && <EditModal ex={ex} onClose={() => setShowEdit(false)} />}
    </>
  )
}
