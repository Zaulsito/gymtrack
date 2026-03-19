import { useState, useRef } from 'react'
import { useApp } from '../../context/AppContext'
import { today, formatDate, calcCondition, MAX_LOGS } from '../../lib/utils'
import ExerciseChart from './ExerciseChart'

const CAT_ICONS = {
  'Piernas':'🦵','Brazos':'💪','Cuerpo':'🧍','Caderas':'🍑',
  'Pecho':'🫀','Mancuernas':'🏋️','Abdominal':'⚡','Espalda':'🔙','Otros':'➕'
}

function CondBadge({ cond }) {
  if (!cond) return null
  const map = {
    SUBE:     { cls: 'badge-sube',     icon: '↑' },
    BAJA:     { cls: 'badge-baja',     icon: '↓' },
    MANTIENE: { cls: 'badge-mantiene', icon: '→' },
  }
  const { cls, icon } = map[cond] || {}
  return <span className={cls}>{icon} {cond}</span>
}

function EditModal({ ex, onClose }) {
  const { state, updateState, showToast } = useApp()
  const [name,        setName]        = useState(ex.name)
  const [cat,         setCat]         = useState(ex.cat)
  const [extraType,   setExtraType]   = useState(ex.maquina ? 'maquina' : 'descripcion')
  const [extraValue,  setExtraValue]  = useState(ex.maquina || ex.descripcion || '')
  const [showTooltip, setShowTooltip] = useState(false)
  const [photo,       setPhoto]       = useState(ex.photo || null)
  const [tecnica,     setTecnica]     = useState(ex.tecnica || '')
  const [loadingAI,   setLoadingAI]   = useState(false)
  const fileRef = useRef(null)

  async function handlePhoto(e) {
    const file = e.target.files[0]
    if (!file) return
    try {
      const { resizeImage } = await import('../../lib/utils')
      const base64 = await resizeImage(file, 600)
      setPhoto(base64)
    } catch { showToast('⚠ Error al procesar la imagen', 'warn') }
  }

  async function generateTecnica() {
    if (!import.meta.env.VITE_GROQ_KEY) { showToast('⚠ Falta VITE_GROQ_KEY', 'warn'); return }
    setLoadingAI(true)
    try {
      const isDev = import.meta.env.DEV
      const url   = isDev ? '/api/groq/openai/v1/chat/completions' : 'https://api.groq.com/openai/v1/chat/completions'
      const resp  = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${import.meta.env.VITE_GROQ_KEY}` },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile', max_tokens: 500,
          messages: [{ role: 'user', content: `Eres un entrenador personal experto. Para "${name}", proporciona en español: músculos, técnica (3-4 pasos), errores comunes, respiración. Máximo 200 palabras. Usa emojis.` }]
        })
      })
      const data = await resp.json()
      setTecnica(data.choices?.[0]?.message?.content || '')
    } catch { showToast('⚠ Error al generar técnica', 'warn') }
    setLoadingAI(false)
  }

  function save() {
    if (!name.trim()) { showToast('⚠ Ingresa el nombre', 'warn'); return }
    updateState(prev => ({
      ...prev,
      exercises: prev.exercises.map(e => e.id !== ex.id ? e : {
        ...e, name: name.trim().toUpperCase(), cat,
        maquina:     extraType === 'maquina'     ? extraValue.trim() : '',
        descripcion: extraType === 'descripcion' ? extraValue.trim() : '',
        photo, tecnica,
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
          <div><label className="text-xs text-[var(--muted)] uppercase tracking-wider">Nombre</label>
            <input className="input-field mt-1" value={name} onChange={e => setName(e.target.value)} /></div>
          <div className="flex items-center gap-2 px-3 py-2 bg-[var(--surface2)] border border-[var(--border-color)] rounded-lg">
            <span className="text-xs text-[var(--muted)] uppercase tracking-wider">ID:</span>
            <span className="text-accent font-bold text-sm">#{ex.num}</span>
            <span className="text-xs text-[var(--muted)] ml-auto">no editable</span>
          </div>
          <div><label className="text-xs text-[var(--muted)] uppercase tracking-wider">Categoría</label>
            <select className="input-field mt-1" value={cat} onChange={e => setCat(e.target.value)}>
              {(state?.categories || []).map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-2 bg-[var(--surface2)] border border-[var(--border-color)] rounded-xl p-3">
            <div className="flex items-center gap-2">
              <select className="input-field flex-1" value={extraType} onChange={e => { setExtraType(e.target.value); setExtraValue('') }}>
                <option value="maquina">🏋 Máquina</option>
                <option value="descripcion">📝 Descripción</option>
              </select>
              <div className="relative">
                <button className="w-5 h-5 rounded-full border border-[var(--muted)] text-[var(--muted)] text-[10px] font-bold flex items-center justify-center"
                  onMouseEnter={() => setShowTooltip(true)} onMouseLeave={() => setShowTooltip(false)}>!</button>
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
          <div className="flex flex-col gap-2">
            <label className="text-xs text-[var(--muted)] uppercase tracking-wider">📸 Foto de referencia</label>
            {photo ? (
              <div className="relative">
                <img src={photo} alt="Ref" className="w-full rounded-xl object-cover max-h-48" />
                <button className="absolute top-2 right-2 bg-[var(--down)] text-white text-xs px-2 py-1 rounded-lg" onClick={() => setPhoto(null)}>✕ Quitar</button>
              </div>
            ) : (
              <button className="btn-outline py-3 text-sm" onClick={() => fileRef.current?.click()}>📷 Subir foto</button>
            )}
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-xs text-[var(--muted)] uppercase tracking-wider">🤖 Técnica correcta</label>
            {tecnica && (
              <div className="bg-[var(--surface2)] border border-[var(--border-color)] rounded-xl p-3 text-xs text-[var(--text)] whitespace-pre-wrap leading-relaxed">{tecnica}</div>
            )}
            <button className="btn-outline py-2.5 text-sm flex items-center justify-center gap-2" onClick={generateTecnica} disabled={loadingAI}>
              {loadingAI ? <><span className="animate-spin">⏳</span> Generando...</> : <>{tecnica ? '🔄 Regenerar' : '✨ Generar técnica con IA'}</>}
            </button>
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

export default function ExerciseCard({ ex, logs = [], onStartTimer }) {
  const { updateState, showToast, logsKey } = useApp()
  const [showHistory, setShowHistory] = useState(false)
  const [showEdit,    setShowEdit]    = useState(false)
  const [peso,   setPeso]   = useState('')
  const [reps,   setReps]   = useState('')
  const [series, setSeries] = useState('')
  const [secs,   setSecs]   = useState('')
  const [tam,    setTam]    = useState('')
  const [fecha,  setFecha]  = useState(today())

  const lastLog   = logs.length ? logs[logs.length - 1] : null
  const lastCond  = lastLog?.cond || null
  const isFull    = logs.length >= MAX_LOGS

  const condColor = lastCond === 'SUBE' ? 'var(--up)' : lastCond === 'BAJA' ? 'var(--down)' : lastCond === 'MANTIENE' ? 'var(--hold)' : 'var(--border-color)'

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
    const msgs = { SUBE: '🔥 ¡Brutal! Superaste tu marca', BAJA: '💪 No te rindas', MANTIENE: '🎯 Consistencia es la clave' }
    showToast(msgs[cond] || '✓ Guardado', cond === 'SUBE' ? 'ok' : cond === 'BAJA' ? 'warn' : '')
    if (onStartTimer) onStartTimer(90)
    setPeso(''); setReps(''); setSeries(''); setTam(''); setSecs(''); setFecha(today())
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
    if (!confirm(`¿Eliminar "${ex.name}"? Esta acción no se puede deshacer.`)) return
    updateState(prev => {
      const uid  = logsKey()
      const next = { ...prev, exercises: prev.exercises.filter(e => e.id !== ex.id) }
      if (next.logs[uid]) delete next.logs[uid][String(ex.id)]
      return next
    })
  }

  return (
    <>
      {/* ── DESKTOP card (horizontal) ── */}
      <div
        className="hidden md:flex bg-[var(--surface)] hover:bg-[var(--surface2)] border border-[var(--border-color)] rounded-2xl p-4 items-center gap-6 transition-all group cursor-pointer"
        style={{ borderLeft: `3px solid ${condColor}` }}
        onClick={() => setShowHistory(v => !v)}
      >
        {/* Icon */}
        <div className="w-14 h-14 bg-[var(--surface2)] rounded-xl flex items-center justify-center text-2xl border border-[var(--border-color)] shrink-0">
          {CAT_ICONS[ex.cat] || '💪'}
        </div>

        {/* Name + cat */}
        <div className="flex-1 min-w-[180px]">
          <h4 className="font-bebas text-lg tracking-widest text-[var(--text)] uppercase">{ex.name}</h4>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-bold tracking-widest text-[var(--muted)] uppercase">{ex.cat}</span>
            {ex.maquina     && <span className="text-[10px] text-[var(--muted)]">· Máq. {ex.maquina}</span>}
            {ex.descripcion && <span className="text-[10px] text-[var(--muted)] italic">· {ex.descripcion}</span>}
          </div>
          {lastCond && (
            <div className="mt-1"><CondBadge cond={lastCond} /></div>
          )}
        </div>

        {/* Inputs */}
        <div className="flex items-center gap-4" onClick={e => e.stopPropagation()}>
          {[
            { label: '🏋 Peso (KG)', val: peso,   set: setPeso,   ph: lastLog?.peso   || '0', step: '0.5' },
            { label: '↩ Reps',       val: reps,    set: setReps,   ph: lastLog?.reps   || '0' },
            { label: '◈ Series',     val: series,  set: setSeries, ph: lastLog?.series || '0' },
            { label: '⏱ Segundos',   val: secs,    set: setSecs,   ph: lastLog?.secs   || '0' },
            { label: '📐 Tamaño',    val: tam,     set: setTam,    ph: lastLog?.tam    || '-', type: 'text' },
          ].map(({ label, val, set, ph, step, type }) => (
            <div key={label} className="flex flex-col gap-1">
              <label className="text-[9px] font-bold text-[var(--muted)] uppercase tracking-widest">{label}</label>
              <input
                type={type || 'number'}
                step={step}
                className="w-20 bg-[var(--bg)] border border-[var(--border-color)] rounded-xl px-3 py-2.5 text-accent font-bebas text-lg text-center focus:outline-none focus:border-accent transition-colors"
                value={val}
                placeholder={ph}
                onChange={e => set(e.target.value)}
              />
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 shrink-0" onClick={e => e.stopPropagation()}>
          <button
            className="bg-accent text-black font-bebas px-6 py-2.5 rounded-full text-sm tracking-widest hover:shadow-[0_0_15px_rgba(200,255,0,0.4)] active:scale-95 transition-all"
            onClick={addLog}
          >Guardar</button>
          <button
            className="p-2 text-[var(--muted)] hover:text-accent transition-colors"
            onClick={() => setShowEdit(true)}
            title="Editar"
          >✏️</button>
          <button
            className="p-2 text-[var(--muted)] hover:text-[var(--down)] transition-colors"
            onClick={deleteExercise}
            title="Eliminar"
          >🗑</button>
        </div>
      </div>

      {/* History desktop */}
      {showHistory && (
        <div className="hidden md:block bg-[var(--surface)] border border-[var(--border-color)] rounded-2xl p-5 -mt-1 border-t-0 rounded-t-none">
          {logs.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-xs min-w-[500px]" style={{ borderCollapse: 'collapse' }}>
                <thead>
                  <tr>{['#','Peso','Reps','Segs','Series','Tamaño','Fecha','Condición',''].map(h => (
                    <th key={h} className="text-[var(--muted)] font-medium text-left py-1.5 px-2 border-b border-[var(--border-color)] uppercase text-[0.7rem] tracking-wider">{h}</th>
                  ))}</tr>
                </thead>
                <tbody>
                  {logs.map((l, idx) => (
                    <tr key={idx} className={idx === logs.length - 1 ? 'bg-[rgba(200,255,0,0.04)]' : ''}>
                      <td className="py-2 px-2 text-[var(--muted)] text-[0.7rem]">{idx === logs.length - 1 ? '★' : idx + 1}</td>
                      <td className="py-2 px-2 font-bold">{l.peso || '-'}</td>
                      <td className="py-2 px-2">{l.reps || '-'}</td>
                      <td className="py-2 px-2">{l.secs ? `${l.secs}s` : '-'}</td>
                      <td className="py-2 px-2">{l.series || '-'}</td>
                      <td className="py-2 px-2">{l.tam || '-'}</td>
                      <td className="py-2 px-2 text-[var(--muted)]">{formatDate(l.fecha)}</td>
                      <td className="py-2 px-2"><CondBadge cond={l.cond} /></td>
                      <td className="py-2 px-2"><button className="btn-danger py-0.5 px-1.5 text-[0.7rem]" onClick={() => deleteLog(idx)}>✕</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : <p className="text-[var(--muted)] text-sm">Sin registros aún.</p>}
          <ExerciseChart logs={logs} />
          {ex.photo && (
            <div className="mt-3">
              <div className="text-[0.72rem] text-[var(--muted)] uppercase tracking-wider mb-2">📸 Referencia</div>
              <img src={ex.photo} alt="Ref" className="w-full rounded-xl object-cover max-h-52 border border-[var(--border-color)]" />
            </div>
          )}
          {ex.tecnica && (
            <div className="mt-3 bg-[var(--surface2)] border border-[var(--border-color)] rounded-xl p-3">
              <div className="text-[0.72rem] text-[var(--muted)] uppercase tracking-wider mb-2">🤖 Técnica correcta</div>
              <p className="text-xs text-[var(--text)] whitespace-pre-wrap leading-relaxed">{ex.tecnica}</p>
            </div>
          )}
        </div>
      )}

      {/* ── MOBILE card ── */}
      <div
        className="md:hidden bg-[var(--surface)] border border-[var(--border-color)] rounded-2xl overflow-hidden transition-all"
        style={{ borderLeft: `3px solid ${condColor}` }}
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-3">
          <div className="w-10 h-10 bg-[var(--surface2)] rounded-xl flex items-center justify-center text-lg border border-[var(--border-color)] shrink-0">
            {CAT_ICONS[ex.cat] || '💪'}
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-bebas text-base tracking-widest uppercase truncate">{ex.name}</h4>
            <div className="flex items-center gap-1 flex-wrap">
              <span className="text-[10px] text-[var(--muted)] uppercase">{ex.cat}</span>
              {ex.maquina && <span className="text-[10px] text-[var(--muted)]">· Máq. {ex.maquina}</span>}
              {lastCond && <CondBadge cond={lastCond} />}
            </div>
          </div>
          <button
            className="text-[var(--muted)] text-sm p-1"
            onClick={() => setShowHistory(v => !v)}
          >{showHistory ? '▲' : '▼'}</button>
        </div>

        {/* Inputs mobile */}
        <div className="px-4 pb-3 flex flex-col gap-3">
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: '🏋 Peso KG', val: peso,   set: setPeso,   ph: lastLog?.peso   || '0', step: '0.5' },
              { label: '↩ Reps',     val: reps,    set: setReps,   ph: lastLog?.reps   || '0' },
              { label: '◈ Series',   val: series,  set: setSeries, ph: lastLog?.series || '0' },
            ].map(({ label, val, set, ph, step }) => (
              <div key={label} className="flex flex-col gap-1">
                <label className="text-[9px] font-bold text-[var(--muted)] uppercase tracking-widest">{label}</label>
                <input
                  type="number" step={step}
                  className="w-full bg-[var(--bg)] border border-[var(--border-color)] rounded-xl h-12 text-center text-accent font-bebas text-xl focus:outline-none focus:border-accent transition-colors"
                  value={val}
                  placeholder={ph}
                  onChange={e => set(e.target.value)}
                />
              </div>
            ))}
          </div>

          <button
            className="w-full py-3 bg-accent text-black font-bebas text-base tracking-widest rounded-full active:scale-95 transition-all shadow-[0_0_15px_rgba(200,255,0,0.2)]"
            onClick={addLog}
          >Guardar</button>
        </div>

        {/* History mobile */}
        {showHistory && (
          <div className="border-t border-[var(--border-color)] px-4 py-3">
            {isFull && (
              <div className="flex items-center gap-2 mb-2 p-2 rounded-lg text-xs text-[var(--hold)] border border-[rgba(255,215,0,0.2)] bg-[rgba(255,215,0,0.08)]">
                ⚠ Límite de {MAX_LOGS} registros
              </div>
            )}
            {logs.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-xs min-w-[400px]" style={{ borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>{['#','Peso','Reps','Series','Fecha','Cond',''].map(h => (
                      <th key={h} className="text-[var(--muted)] font-medium text-left py-1.5 px-2 border-b border-[var(--border-color)] uppercase text-[0.65rem] tracking-wider">{h}</th>
                    ))}</tr>
                  </thead>
                  <tbody>
                    {logs.map((l, idx) => (
                      <tr key={idx} className={idx === logs.length - 1 ? 'bg-[rgba(200,255,0,0.04)]' : ''}>
                        <td className="py-1.5 px-2 text-[var(--muted)] text-[0.65rem]">{idx === logs.length - 1 ? '★' : idx + 1}</td>
                        <td className="py-1.5 px-2 font-bold">{l.peso || '-'}</td>
                        <td className="py-1.5 px-2">{l.reps || '-'}</td>
                        <td className="py-1.5 px-2">{l.series || '-'}</td>
                        <td className="py-1.5 px-2 text-[var(--muted)]">{formatDate(l.fecha)}</td>
                        <td className="py-1.5 px-2"><CondBadge cond={l.cond} /></td>
                        <td className="py-1.5 px-2"><button className="btn-danger py-0.5 px-1 text-[0.65rem]" onClick={() => deleteLog(idx)}>✕</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : <p className="text-[var(--muted)] text-sm py-1">Sin registros aún.</p>}

            <ExerciseChart logs={logs} />

            {ex.photo && (
              <div className="mt-3">
                <div className="text-[0.72rem] text-[var(--muted)] uppercase tracking-wider mb-2">📸 Referencia</div>
                <img src={ex.photo} alt="Ref" className="w-full rounded-xl object-cover max-h-40 border border-[var(--border-color)]" />
              </div>
            )}
            {ex.tecnica && (
              <div className="mt-3 bg-[var(--surface2)] border border-[var(--border-color)] rounded-xl p-3">
                <div className="text-[0.72rem] text-[var(--muted)] uppercase tracking-wider mb-2">🤖 Técnica</div>
                <p className="text-xs text-[var(--text)] whitespace-pre-wrap leading-relaxed">{ex.tecnica}</p>
              </div>
            )}

            {/* Extra mobile inputs */}
            <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-dashed border-[var(--border-color)]">
              <input className="input-field text-xs" placeholder="Segundos" value={secs}  onChange={e => setSecs(e.target.value)} />
              <input className="input-field text-xs" placeholder="Tamaño"   value={tam}   onChange={e => setTam(e.target.value)} />
              <input className="input-field text-xs" type="date"            value={fecha} onChange={e => setFecha(e.target.value)} />
            </div>

            <div className="flex gap-2 mt-3">
              <button className="btn-outline text-xs py-1 px-3" onClick={() => setShowEdit(true)}>✏ Editar</button>
              <button className="btn-danger  text-xs py-1 px-3" onClick={deleteExercise}>🗑 Eliminar</button>
            </div>
          </div>
        )}
      </div>

      {showEdit && <EditModal ex={ex} onClose={() => setShowEdit(false)} />}
    </>
  )
}
