import { useState, useRef, useEffect } from 'react'
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
  const [name, setName] = useState(ex.name)
  
  // Categoría con autocompletado y agregar nueva
  const [catInput, setCatInput] = useState(ex.cat || '')
  const [showCatSuggestions, setShowCatSuggestions] = useState(false)
  const catContainerRef = useRef(null)

  // Checkbox para número de máquina (entero)
  const [isMaquina, setIsMaquina] = useState(Boolean(ex.maquina))
  const [numMaquina, setNumMaquina] = useState(ex.maquina ? String(ex.maquina) : '')

  const [photo,       setPhoto]       = useState(ex.photo || null)
  const [tecnica,     setTecnica]     = useState(ex.tecnica || '')
  const [loadingAI,   setLoadingAI]   = useState(false)
  const fileRef = useRef(null)

  // Cerrar sugerencias al hacer clic fuera
  useEffect(() => {
    function handleClickOutside(e) {
      if (catContainerRef.current && !catContainerRef.current.contains(e.target)) {
        setShowCatSuggestions(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Filtrado de categorías
  const existingCats = state?.categories || []
  const filteredCats = existingCats.filter(c =>
    c.toLowerCase().includes(catInput.trim().toLowerCase())
  )
  const exactCatMatch = existingCats.some(c =>
    c.toLowerCase() === catInput.trim().toLowerCase()
  )

  function selectCategory(c) {
    setCatInput(c)
    setShowCatSuggestions(false)
  }

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
    if (!name.trim()) {
      showToast('⚠ Ingresa el nombre de la máquina o ejercicio', 'warn')
      return
    }
    const finalCat = catInput.trim()
    if (!finalCat) {
      showToast('⚠ Ingresa o selecciona una categoría', 'warn')
      return
    }
    if (isMaquina) {
      if (!numMaquina.trim()) {
        showToast('⚠ Ingresa el número de la máquina', 'warn')
        return
      }
      if (!/^\d+$/.test(numMaquina.trim())) {
        showToast('⚠ El número de máquina debe ser un número entero', 'warn')
        return
      }
    }

    updateState(prev => {
      const categories = prev.categories ? [...prev.categories] : []
      if (!categories.includes(finalCat)) {
        categories.push(finalCat)
      }
      return {
        ...prev,
        categories,
        exercises: prev.exercises.map(e => e.id !== ex.id ? e : {
          ...e,
          name: name.trim().toUpperCase(),
          cat: finalCat,
          maquina: isMaquina ? String(parseInt(numMaquina.trim(), 10)) : '',
          descripcion: '',
          photo,
          tecnica,
        })
      }
    })
    showToast('✓ Ejercicio actualizado', 'ok')
    onClose()
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box max-w-[480px]">
        <h2 className="font-bebas text-[1.7rem] tracking-wider text-accent mb-4">
          EDITAR EJERCICIO
        </h2>
        <div className="flex flex-col gap-4">
          
          {/* 1. Nombre de la máquina / ejercicio */}
          <div className="flex flex-col gap-1">
            <label className="text-xs text-[var(--muted)] uppercase tracking-wider font-semibold">
              Nombre de la máquina / ejercicio
            </label>
            <input
              className="input-field"
              placeholder="Ej: Press de Pierna Sentado"
              value={name}
              onChange={e => setName(e.target.value)}
            />
          </div>

          {/* 2. ID asignado: automático / no editable */}
          <div className="flex items-center gap-2 px-3 py-2 bg-[var(--surface2)] border border-[var(--border-color)] rounded-xl">
            <span className="text-xs text-[var(--muted)] uppercase tracking-wider">ID ASIGNADO:</span>
            <span className="text-accent font-bold text-sm">#{ex.num}</span>
            <span className="text-xs text-[var(--muted)] ml-auto font-mono text-[11px]">no editable</span>
          </div>

          {/* 3. Categoría con autocompletado y agregar nueva */}
          <div className="flex flex-col gap-1 relative" ref={catContainerRef}>
            <label className="text-xs text-[var(--muted)] uppercase tracking-wider font-semibold">
              Categoría
            </label>
            <input
              className="input-field"
              placeholder="Escribe o selecciona una categoría..."
              value={catInput}
              onChange={e => {
                setCatInput(e.target.value)
                setShowCatSuggestions(true)
              }}
              onFocus={() => setShowCatSuggestions(true)}
            />

            {/* Menú flotante de sugerencias */}
            {showCatSuggestions && (
              <div className="absolute left-0 right-0 top-[calc(100%+4px)] z-50 bg-[var(--surface)] border border-[var(--border-color)] rounded-xl shadow-2xl overflow-hidden max-h-48 overflow-y-auto">
                {filteredCats.map(c => (
                  <button
                    key={c}
                    type="button"
                    className="w-full text-left px-3 py-2 text-xs text-[var(--text)] hover:bg-[var(--surface2)] flex items-center justify-between transition-colors border-b border-[var(--border-color)] last:border-0"
                    onClick={() => selectCategory(c)}
                  >
                    <span>{c}</span>
                    {c.toLowerCase() === catInput.trim().toLowerCase() && (
                      <span className="text-accent text-[10px]">✓ Seleccionado</span>
                    )}
                  </button>
                ))}

                {/* Opción de agregar nueva categoría si no existe exactamente */}
                {catInput.trim() && !exactCatMatch && (
                  <button
                    type="button"
                    className="w-full text-left px-3 py-2 text-xs text-accent font-semibold bg-accent/10 hover:bg-accent/20 flex items-center gap-1.5 transition-colors"
                    onClick={() => selectCategory(catInput.trim())}
                  >
                    <span>＋</span>
                    <span>Agregar categoría "{catInput.trim()}"</span>
                  </button>
                )}

                {!filteredCats.length && !catInput.trim() && (
                  <div className="px-3 py-2 text-xs text-[var(--muted)]">Escribe para buscar o crear...</div>
                )}
              </div>
            )}
          </div>

          {/* 4. Checkbox número de máquina */}
          <div className="flex flex-col gap-2 p-3 bg-[var(--surface2)] border border-[var(--border-color)] rounded-xl">
            <label className="flex items-center gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isMaquina}
                onChange={e => {
                  setIsMaquina(e.target.checked)
                  if (!e.target.checked) setNumMaquina('')
                }}
                className="w-4 h-4 rounded accent-accent cursor-pointer"
              />
              <span className="text-xs font-semibold text-[var(--text)]">¿Es un número de máquina?</span>
            </label>

            {isMaquina && (
              <div className="flex flex-col gap-1 pt-2 border-t border-[var(--border-color)]">
                <label className="text-[10px] text-[var(--muted)] uppercase tracking-wider font-semibold">
                  Número de máquina (entero)
                </label>
                <input
                  className="input-field text-sm"
                  type="number"
                  step="1"
                  min="1"
                  placeholder="Ej: 14"
                  value={numMaquina}
                  onChange={e => {
                    const integerOnly = e.target.value.replace(/[^0-9]/g, '')
                    setNumMaquina(integerOnly)
                  }}
                  onKeyDown={e => {
                    if (e.key === '.' || e.key === ',' || e.key === 'e' || e.key === 'E' || e.key === '-' || e.key === '+') {
                      e.preventDefault()
                    }
                  }}
                />
              </div>
            )}
          </div>

          {/* 5. Foto de referencia */}
          <div className="flex flex-col gap-2">
            <label className="text-xs text-[var(--muted)] uppercase tracking-wider font-semibold">📸 Foto de referencia</label>
            {photo ? (
              <div className="relative">
                <img src={photo} alt="Ref" className="w-full rounded-xl object-cover max-h-48" />
                <button className="absolute top-2 right-2 bg-[var(--down)] text-white text-xs px-2 py-1 rounded-lg shadow-md" onClick={() => setPhoto(null)}>✕ Quitar</button>
              </div>
            ) : (
              <button className="btn-outline py-3 text-sm" onClick={() => fileRef.current?.click()}>📷 Subir foto</button>
            )}
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
          </div>

          {/* 6. Técnica con IA */}
          <div className="flex flex-col gap-2">
            <label className="text-xs text-[var(--muted)] uppercase tracking-wider font-semibold">🤖 Técnica correcta</label>
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

function EditLogModal({ log, exName, onClose, onSave }) {
  const [peso,   setPeso]   = useState(log.peso || '')
  const [reps,   setReps]   = useState(log.reps || '')
  const [secs,   setSecs]   = useState(log.secs || '')
  const [series, setSeries] = useState(log.series || '')
  const [tam,    setTam]    = useState(log.tam || '')
  const [fecha,  setFecha]  = useState(log.fecha || today())

  function handleSave() {
    if (!peso && !reps && !secs) {
      alert('Ingresa al menos peso, reps o segundos')
      return
    }
    onSave({
      peso:   peso.trim(),
      reps:   reps.trim(),
      secs:   secs.trim(),
      series: series.trim(),
      tam:    tam.trim(),
      fecha:  fecha || today(),
    })
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box max-w-[420px]">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-bebas text-[1.7rem] tracking-wider text-accent leading-none">EDITAR REGISTRO</h2>
            <p className="text-xs text-[var(--muted)] mt-0.5 uppercase tracking-wider">{exName}</p>
          </div>
          <button className="text-[var(--muted)] hover:text-[var(--text)] text-lg" onClick={onClose}>✕</button>
        </div>

        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-[var(--muted)] uppercase tracking-wider font-semibold">🏋 Peso (kg)</label>
              <input
                className="input-field"
                type="number"
                step="0.5"
                placeholder="0"
                value={peso}
                onChange={e => setPeso(e.target.value)}
                autoFocus
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-[var(--muted)] uppercase tracking-wider font-semibold">↩ Repeticiones</label>
              <input
                className="input-field"
                type="number"
                step="1"
                placeholder="0"
                value={reps}
                onChange={e => setReps(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-[var(--muted)] uppercase tracking-wider font-semibold">⏱ Segundos</label>
              <input
                className="input-field"
                type="number"
                step="1"
                placeholder="0"
                value={secs}
                onChange={e => setSecs(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-[var(--muted)] uppercase tracking-wider font-semibold">◈ Series</label>
              <input
                className="input-field"
                type="number"
                step="1"
                placeholder="0"
                value={series}
                onChange={e => setSeries(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-[var(--muted)] uppercase tracking-wider font-semibold">📐 Tamaño</label>
              <input
                className="input-field"
                type="text"
                placeholder="Ej: M / Ajuste 3"
                value={tam}
                onChange={e => setTam(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-[var(--muted)] uppercase tracking-wider font-semibold">📅 Fecha</label>
              <input
                className="input-field"
                type="date"
                value={fecha}
                onChange={e => setFecha(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button className="btn-outline flex-1 py-2.5" onClick={onClose}>Cancelar</button>
          <button className="btn-accent flex-1 py-2.5" onClick={handleSave}>Guardar Cambios</button>
        </div>
      </div>
    </div>
  )
}

export default function ExerciseCard({ ex, logs = [], onStartTimer }) {
  const { updateState, showToast, logsKey } = useApp()
  const [showHistory, setShowHistory] = useState(false)
  const [showEdit,    setShowEdit]    = useState(false)
  const [editingLogIdx, setEditingLogIdx] = useState(null)
  const [repMode,    setRepMode]      = useState('reps') // 'reps' | 'secs'
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

  function updateLog(idx, updatedLogData) {
    updateState(prev => {
      const uid = logsKey()
      const next = { ...prev }
      if (!next.logs[uid]) next.logs[uid] = {}
      const curArr = [...(next.logs[uid]?.[String(ex.id)] || [])]
      if (idx >= 0 && idx < curArr.length) {
        curArr[idx] = { ...curArr[idx], ...updatedLogData }
        // Recalcular condiciones de todos los logs secuencialmente
        const recomputedArr = curArr.map((item, i) => {
          const prior = curArr.slice(0, i)
          const cond = calcCondition(prior, item.peso, item.reps, item.secs)
          return { ...item, cond }
        })
        next.logs[uid][String(ex.id)] = recomputedArr

        if (updatedLogData.fecha) {
          if (!next.trainedDays) next.trainedDays = {}
          if (!next.trainedDays[updatedLogData.fecha]) {
            next.trainedDays[updatedLogData.fecha] = { note: '' }
          }
        }
      }
      return next
    })
    showToast('✓ Registro actualizado', 'ok')
    setEditingLogIdx(null)
  }

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
                      <td className="py-2 px-2" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center gap-1.5">
                          <button
                            className="p-1 rounded hover:bg-[var(--surface2)] text-[var(--muted)] hover:text-accent transition-colors"
                            onClick={() => setEditingLogIdx(idx)}
                            title="Editar registro"
                          >
                            ✏️
                          </button>
                          <button
                            className="btn-danger py-0.5 px-1.5 text-[0.7rem]"
                            onClick={() => deleteLog(idx)}
                            title="Eliminar registro"
                          >
                            ✕
                          </button>
                        </div>
                      </td>
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

        {/* Inputs mobile — siempre visibles */}
        <div className="px-4 pb-3 flex flex-col gap-2">
          {/* Fila 1: Peso, Reps/Segs (con toggle), Series */}
          <div className="grid grid-cols-3 gap-2">
            <div className="flex flex-col gap-1">
              <label className="text-[9px] font-bold text-[var(--muted)] uppercase tracking-widest">🏋 Peso KG</label>
              <input
                type="number" step="0.5"
                className="w-full bg-[var(--bg)] border border-[var(--border-color)] rounded-xl h-12 text-center text-accent font-bebas text-xl focus:outline-none focus:border-accent transition-colors"
                value={peso} placeholder={lastLog?.peso || '0'}
                onChange={e => setPeso(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1">
              {/* Toggle Reps / Segs */}
              <button
                className="text-[9px] font-bold uppercase tracking-widest flex items-center gap-1 self-start"
                onClick={() => setRepMode(m => m === 'reps' ? 'secs' : 'reps')}
              >
                <span className={repMode === 'reps' ? 'text-accent' : 'text-[var(--muted)]'}>↩ Reps</span>
                <span className="text-[var(--muted)]">/</span>
                <span className={repMode === 'secs' ? 'text-accent' : 'text-[var(--muted)]'}>⏱ Segs</span>
              </button>
              <input
                type="number"
                className="w-full bg-[var(--bg)] border border-[var(--border-color)] rounded-xl h-12 text-center text-accent font-bebas text-xl focus:outline-none focus:border-accent transition-colors"
                value={repMode === 'reps' ? reps : secs}
                placeholder={repMode === 'reps' ? (lastLog?.reps || '0') : (lastLog?.secs || '0')}
                onChange={e => repMode === 'reps' ? setReps(e.target.value) : setSecs(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[9px] font-bold text-[var(--muted)] uppercase tracking-widest">◈ Series</label>
              <input
                type="number"
                className="w-full bg-[var(--bg)] border border-[var(--border-color)] rounded-xl h-12 text-center text-accent font-bebas text-xl focus:outline-none focus:border-accent transition-colors"
                value={series} placeholder={lastLog?.series || '0'}
                onChange={e => setSeries(e.target.value)}
              />
            </div>
          </div>

          {/* Fila 2: Tamaño y Fecha */}
          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col gap-1">
              <label className="text-[9px] font-bold text-[var(--muted)] uppercase tracking-widest">📐 Tamaño</label>
              <input
                className="input-field text-sm py-2"
                placeholder={lastLog?.tam || 'Ej: Grande'}
                value={tam}
                onChange={e => setTam(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[9px] font-bold text-[var(--muted)] uppercase tracking-widest">📅 Fecha</label>
              <input
                className="input-field text-sm py-2"
                type="date"
                value={fecha}
                onChange={e => setFecha(e.target.value)}
              />
            </div>
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
                    <tr>{['#','Peso','Reps','Segs','Series','Tamaño','Fecha','Cond',''].map(h => (
                      <th key={h} className="text-[var(--muted)] font-medium text-left py-1.5 px-2 border-b border-[var(--border-color)] uppercase text-[0.65rem] tracking-wider">{h}</th>
                    ))}</tr>
                  </thead>
                  <tbody>
                    {logs.map((l, idx) => (
                      <tr key={idx} className={idx === logs.length - 1 ? 'bg-[rgba(200,255,0,0.04)]' : ''}>
                        <td className="py-1.5 px-2 text-[var(--muted)] text-[0.65rem]">{idx === logs.length - 1 ? '★' : idx + 1}</td>
                        <td className="py-1.5 px-2 font-bold">{l.peso || '-'}</td>
                        <td className="py-1.5 px-2">{l.reps || '-'}</td>
                        <td className="py-1.5 px-2">{l.secs ? `${l.secs}s` : '-'}</td>
                        <td className="py-1.5 px-2">{l.series || '-'}</td>
                        <td className="py-1.5 px-2">{l.tam || '-'}</td>
                        <td className="py-1.5 px-2 text-[var(--muted)]">{formatDate(l.fecha)}</td>
                        <td className="py-1.5 px-2"><CondBadge cond={l.cond} /></td>
                        <td className="py-1.5 px-2" onClick={e => e.stopPropagation()}>
                          <div className="flex items-center gap-1">
                            <button
                              className="p-1 rounded text-[var(--muted)] hover:text-accent transition-colors text-xs"
                              onClick={() => setEditingLogIdx(idx)}
                              title="Editar registro"
                            >
                              ✏️
                            </button>
                            <button
                              className="btn-danger py-0.5 px-1 text-[0.65rem]"
                              onClick={() => deleteLog(idx)}
                              title="Eliminar registro"
                            >
                              ✕
                            </button>
                          </div>
                        </td>
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

            <div className="flex gap-2 mt-3">
              <button className="btn-outline text-xs py-1 px-3" onClick={() => setShowEdit(true)}>✏ Editar</button>
              <button className="btn-danger  text-xs py-1 px-3" onClick={deleteExercise}>🗑 Eliminar</button>
            </div>
          </div>
        )}
      </div>

      {showEdit && <EditModal ex={ex} onClose={() => setShowEdit(false)} />}
      {editingLogIdx !== null && logs[editingLogIdx] && (
        <EditLogModal
          log={logs[editingLogIdx]}
          exName={ex.name}
          onClose={() => setEditingLogIdx(null)}
          onSave={data => updateLog(editingLogIdx, data)}
        />
      )}
    </>
  )
}
