import { useState, useRef, useEffect } from 'react'
import { useApp } from '../../context/AppContext'
import { today, calcCondition } from '../../lib/utils'

const AVAILABLE_METRICS = [
  { id: 'peso',   label: 'Peso',     placeholder: 'Peso (kg)',   type: 'number', step: '0.5' },
  { id: 'tiempo', label: 'Tiempo',   placeholder: 'Tiempo',      type: 'text' },
  { id: 'reps',   label: 'Reps',     placeholder: 'Reps',        type: 'number', step: '1' },
  { id: 'series', label: 'Series',   placeholder: 'Series',      type: 'number', step: '1' },
  { id: 'secs',   label: 'Segundos', placeholder: 'Segundos',    type: 'number', step: '1' },
  { id: 'tam',    label: 'Tamaño',   placeholder: 'Tamaño S/M/L',type: 'text' },
]

export default function AddExerciseModal({ onClose }) {
  const { state, updateState, showToast, logsKey } = useApp()

  // 1. Nombre de la máquina / ejercicio
  const [name, setName] = useState('')

  // 2. Categoría con autocompletado y agregar nueva
  const initialCat = state?.currentCat && state.currentCat !== 'Todas'
    ? state.currentCat
    : (state?.categories?.[0] || 'Pecho')
  const [catInput, setCatInput] = useState(initialCat)
  const [showCatSuggestions, setShowCatSuggestions] = useState(false)
  const catContainerRef = useRef(null)

  // 3. Checkbox para número de máquina
  const [isMaquina, setIsMaquina] = useState(false)
  const [numMaquina, setNumMaquina] = useState('')

  // 4. Primer registro (Campos predeterminados activos con opción de añadir con '+')
  const [activeMetrics, setActiveMetrics] = useState(['peso', 'tiempo', 'reps', 'series', 'secs', 'tam'])
  const [logValues, setLogValues] = useState({
    peso: '',
    tiempo: '',
    reps: '',
    series: '',
    secs: '',
    tam: '',
  })

  const nextNum = (state?.exercises?.length || 0) + 1

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

  function addField(fieldId) {
    if (!activeMetrics.includes(fieldId)) {
      setActiveMetrics(prev => [...prev, fieldId])
    }
  }

  function removeField(fieldId) {
    setActiveMetrics(prev => prev.filter(id => id !== fieldId))
    setLogValues(prev => ({ ...prev, [fieldId]: '' }))
  }

  function handleLogChange(fieldId, val) {
    setLogValues(prev => ({ ...prev, [fieldId]: val }))
  }

  function addExercise() {
    // 1. Validación de nombre
    if (!name.trim()) {
      showToast('⚠ Ingresa el nombre de la máquina o ejercicio', 'warn')
      return
    }

    // 2. Validación de categoría
    const finalCat = catInput.trim()
    if (!finalCat) {
      showToast('⚠ Ingresa o selecciona una categoría', 'warn')
      return
    }

    // 3. Validación de número de máquina si el check está activo
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

    // 4. Validación de primer registro (NO es opcional)
    const hasLogData = Object.values(logValues).some(v => v && String(v).trim().length > 0)
    if (!hasLogData) {
      showToast('⚠ El primer registro es obligatorio. Ingresa al menos un valor.', 'warn')
      return
    }

    updateState(prev => {
      const newId = prev.nextId || ((prev.exercises?.length || 0) + 1)
      const uid   = logsKey()
      const next  = { ...prev, nextId: newId + 1 }

      // Agregar categoría a la lista si es nueva
      const categories = prev.categories ? [...prev.categories] : []
      if (!categories.includes(finalCat)) {
        categories.push(finalCat)
      }
      next.categories = categories

      // Agregar ejercicio
      next.exercises = [...(next.exercises || []), {
        id:          newId,
        num:         String(nextNum),
        name:        name.trim().toUpperCase(),
        cat:         finalCat,
        maquina:     isMaquina ? String(parseInt(numMaquina.trim(), 10)) : '',
        descripcion: '',
      }]

      // Crear primer registro
      if (!next.logs) next.logs = {}
      if (!next.logs[uid]) next.logs[uid] = {}

      const cond = calcCondition([], logValues.peso, logValues.reps, logValues.secs || logValues.tiempo)
      next.logs[uid][String(newId)] = [{
        peso:   logValues.peso.trim(),
        reps:   logValues.reps.trim(),
        secs:   (logValues.secs || logValues.tiempo || '').trim(),
        series: logValues.series.trim(),
        tam:    logValues.tam.trim(),
        fecha:  today(),
        cond,
      }]

      next.currentCat = finalCat
      return next
    })

    showToast('✓ Ejercicio y primer registro agregados con éxito', 'ok')
    onClose()
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box max-w-[480px]">
        <h2 className="font-bebas text-[1.7rem] tracking-wider text-accent mb-4">
          NUEVO EJERCICIO
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
              autoFocus
            />
          </div>

          {/* 2. ID asignado: automático */}
          <div className="flex items-center gap-2 px-3 py-2 bg-[var(--surface2)] border border-[var(--border-color)] rounded-xl">
            <span className="text-xs text-[var(--muted)] uppercase tracking-wider">ID ASIGNADO:</span>
            <span className="text-accent font-bold text-sm">#{nextNum}</span>
            <span className="text-xs text-[var(--muted)] ml-auto font-mono">automático</span>
          </div>

          {/* 3. Categoría escribible con sugerencias y opción de agregar (sin engranaje) */}
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

          {/* 4. Checkbox número de máquina (reemplaza Añadir más) */}
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
                    if (['.', ',', 'e', 'E', '+', '-'].includes(e.key)) {
                      e.preventDefault()
                    }
                  }}
                />
              </div>
            )}
          </div>

          {/* 5. Primer Registro (Obligatorio) con campos predeterminados y opción de añadir con '+' */}
          <div className="border-t border-[var(--border-color)] pt-3 flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <div className="text-xs text-[var(--muted)] uppercase tracking-wider font-bold">
                Primer Registro <span className="text-accent text-[10px] font-normal tracking-normal">(obligatorio)</span>
              </div>
            </div>

            {/* Opciones con signo '+' para añadir métricas si alguna no está activa */}
            <div className="flex flex-wrap gap-1.5 items-center">
              <span className="text-[10px] text-[var(--muted)] uppercase font-semibold mr-1">Campos:</span>
              {AVAILABLE_METRICS.map(m => {
                const isActive = activeMetrics.includes(m.id)
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => isActive ? removeField(m.id) : addField(m.id)}
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all border ${
                      isActive
                        ? 'bg-accent/15 border-accent text-accent hover:bg-accent/25'
                        : 'bg-[var(--surface2)] border-[var(--border-color)] text-[var(--muted)] hover:border-accent hover:text-[var(--text)]'
                    }`}
                  >
                    <span>{isActive ? '✓' : '＋'}</span>
                    <span>{m.label}</span>
                  </button>
                )
              })}
            </div>

            {/* Grid con los campos activos predeterminados */}
            <div className="grid grid-cols-2 gap-2 mt-1">
              {AVAILABLE_METRICS.filter(m => activeMetrics.includes(m.id)).map(m => (
                <div key={m.id} className="relative flex items-center">
                  <input
                    className="input-field text-sm pr-6"
                    type={m.type}
                    step={m.step}
                    min={m.type === 'number' ? '0' : undefined}
                    placeholder={m.placeholder}
                    value={logValues[m.id]}
                    onChange={e => handleLogChange(m.id, e.target.value)}
                  />
                  <button
                    type="button"
                    title={`Quitar campo ${m.label}`}
                    onClick={() => removeField(m.id)}
                    className="absolute right-2 text-[var(--muted)] hover:text-[var(--down)] text-xs p-1"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Botones de acción */}
        <div className="flex gap-3 mt-6">
          <button className="btn-outline flex-1 py-2.5" onClick={onClose}>
            Cancelar
          </button>
          <button className="btn-accent flex-1 py-2.5 font-bold" onClick={addExercise}>
            Agregar
          </button>
        </div>
      </div>
    </div>
  )
}
