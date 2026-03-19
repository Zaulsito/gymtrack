import { useState } from 'react'
import { useApp } from '../../context/AppContext'

const DAYS_OF_WEEK = ['Lunes','Martes','Miércoles','Jueves','Viernes','Sábado','Domingo']

const PREDEFINED = [
  {
    id: 'ppl', name: 'Push / Pull / Piernas', days: 3, level: 'Intermedio',
    desc: 'Divide los ejercicios en empuje, tracción y piernas.',
    plan: [
      { day: 'Lunes',    name: 'Push (Empuje)',  muscles: ['Pecho','Hombros','Tríceps'], emoji: '💪', exercises: ['Press de banca','Press inclinado','Aperturas','Press militar','Elevaciones laterales','Extensiones tríceps'] },
      { day: 'Miércoles',name: 'Pull (Tracción)',muscles: ['Espalda','Bíceps'],          emoji: '🏋️', exercises: ['Dominadas','Remo con barra','Jalón al pecho','Remo sentado','Curl de bíceps','Curl martillo'] },
      { day: 'Viernes',  name: 'Piernas',        muscles: ['Piernas','Glúteos'],         emoji: '🦵', exercises: ['Sentadilla','Prensa','Extensiones','Curl femoral','Peso muerto rumano','Plancha'] },
    ]
  },
  {
    id: 'fullbody', name: 'Full Body', days: 3, level: 'Principiante',
    desc: 'Trabaja todo el cuerpo en cada sesión.',
    plan: [
      { day: 'Lunes',    name: 'Full Body A', muscles: ['Pecho','Espalda','Piernas'], emoji: '🔥', exercises: ['Sentadilla','Press de banca','Dominadas','Press militar','Peso muerto','Plancha'] },
      { day: 'Miércoles',name: 'Full Body B', muscles: ['Pecho','Espalda','Brazos'],  emoji: '⚡', exercises: ['Prensa','Aperturas','Remo con barra','Curl de bíceps','Extensiones tríceps','Elevaciones de talones'] },
      { day: 'Viernes',  name: 'Full Body C', muscles: ['Hombros','Espalda','Abdomen'],emoji: '💥', exercises: ['Peso muerto','Press Arnold','Jalón al pecho','Sentadilla búlgara','Curl femoral','Crunch'] },
    ]
  },
  {
    id: 'upper_lower', name: 'Upper / Lower', days: 4, level: 'Intermedio',
    desc: 'Alterna tren superior e inferior.',
    plan: [
      { day: 'Lunes',   name: 'Tren Superior A', muscles: ['Pecho','Espalda','Hombros'], emoji: '💪', exercises: ['Press de banca','Remo con barra','Press militar','Jalón al pecho','Aperturas','Elevaciones laterales'] },
      { day: 'Martes',  name: 'Tren Inferior A', muscles: ['Piernas','Glúteos'],          emoji: '🦵', exercises: ['Sentadilla','Peso muerto rumano','Prensa','Extensiones','Curl femoral','Elevaciones de talones'] },
      { day: 'Jueves',  name: 'Tren Superior B', muscles: ['Pecho','Espalda','Brazos'],   emoji: '🏋️', exercises: ['Press inclinado','Dominadas','Curl de bíceps','Extensiones tríceps','Remo sentado','Fondos'] },
      { day: 'Viernes', name: 'Tren Inferior B', muscles: ['Piernas','Abdomen'],           emoji: '🔥', exercises: ['Peso muerto','Sentadilla búlgara','Zancadas','Curl femoral','Plancha','Crunch abdominal'] },
    ]
  },
  {
    id: 'torso_pierna', name: 'Torso / Pierna', days: 4, level: 'Intermedio',
    desc: 'Combina pecho, espalda y hombros en un día.',
    plan: [
      { day: 'Lunes',   name: 'Torso A',  muscles: ['Pecho','Espalda','Hombros'],      emoji: '💪', exercises: ['Press de banca','Jalón al pecho','Press Arnold','Remo con mancuerna','Elevaciones laterales','Aperturas'] },
      { day: 'Martes',  name: 'Pierna A', muscles: ['Cuádriceps','Femoral','Glúteos'], emoji: '🦵', exercises: ['Sentadilla','Peso muerto rumano','Prensa','Extensiones','Curl femoral','Hip thrust'] },
      { day: 'Jueves',  name: 'Torso B',  muscles: ['Pecho','Espalda','Brazos'],       emoji: '🏋️', exercises: ['Press inclinado','Dominadas','Fondos','Curl de bíceps','Extensiones tríceps','Remo sentado'] },
      { day: 'Viernes', name: 'Pierna B', muscles: ['Piernas','Abdomen','Glúteos'],    emoji: '🔥', exercises: ['Zancadas','Sentadilla búlgara','Peso muerto','Elevaciones de talones','Plancha','Crunch'] },
    ]
  },
  {
    id: 'arnold', name: 'Arnold Split', days: 6, level: 'Avanzado',
    desc: 'El split de Arnold. 6 días combinando grupos antagonistas.',
    plan: [
      { day: 'Lunes',   name: 'Pecho + Espalda',  muscles: ['Pecho','Espalda'],             emoji: '🏆', exercises: ['Press de banca','Dominadas','Press inclinado','Remo con barra','Aperturas','Jalón al pecho'] },
      { day: 'Martes',  name: 'Hombros + Brazos', muscles: ['Hombros','Bíceps','Tríceps'],  emoji: '💪', exercises: ['Press militar','Curl de bíceps','Extensiones tríceps','Elevaciones laterales','Curl martillo','Fondos'] },
      { day: 'Miércoles',name: 'Piernas',         muscles: ['Piernas','Glúteos','Abdomen'], emoji: '🦵', exercises: ['Sentadilla','Peso muerto','Prensa','Curl femoral','Elevaciones de talones','Plancha'] },
      { day: 'Jueves',  name: 'Pecho + Espalda',  muscles: ['Pecho','Espalda'],             emoji: '🏆', exercises: ['Press inclinado','Remo sentado','Fondos pecho','Dominadas','Pullover','Remo mancuerna'] },
      { day: 'Viernes', name: 'Hombros + Brazos', muscles: ['Hombros','Bíceps','Tríceps'],  emoji: '💪', exercises: ['Press Arnold','Curl concentrado','Extensiones cabeza','Elevaciones frontales','Curl barra Z','Kickbacks'] },
      { day: 'Sábado',  name: 'Piernas',          muscles: ['Piernas','Glúteos','Abdomen'], emoji: '🦵', exercises: ['Sentadilla búlgara','Peso muerto rumano','Zancadas','Extensiones','Hip thrust','Crunch'] },
    ]
  },
  {
    id: 'bro_split', name: 'Bro Split', days: 5, level: 'Intermedio',
    desc: 'Un grupo muscular por día. El clásico de los gimnasios.',
    plan: [
      { day: 'Lunes',   name: 'Pecho',    muscles: ['Pecho','Tríceps'],           emoji: '💪', exercises: ['Press de banca','Press inclinado','Press declinado','Aperturas','Fondos','Pullover'] },
      { day: 'Martes',  name: 'Espalda',  muscles: ['Espalda','Bíceps'],          emoji: '🏋️', exercises: ['Peso muerto','Remo con barra','Jalón al pecho','Dominadas','Remo sentado','Curl de bíceps'] },
      { day: 'Miércoles',name: 'Hombros', muscles: ['Hombros','Trapecios'],       emoji: '🔥', exercises: ['Press militar','Press Arnold','Elevaciones laterales','Elevaciones frontales','Pájaros','Encogimientos'] },
      { day: 'Jueves',  name: 'Brazos',   muscles: ['Bíceps','Tríceps'],          emoji: '💥', exercises: ['Curl barra','Extensiones tríceps','Curl martillo','Fondos','Curl concentrado','Kickbacks'] },
      { day: 'Viernes', name: 'Piernas',  muscles: ['Piernas','Glúteos','Abdomen'],emoji: '🦵', exercises: ['Sentadilla','Prensa','Extensiones','Peso muerto rumano','Curl femoral','Plancha'] },
    ]
  },
]

const EMOJIS = ['💪','🔥','⚡','🏋️','🦵','💥','🏆','🎯','🚀','⭐']
const LEVEL_COLORS = {
  'Principiante': 'text-[var(--up)] border-[rgba(57,255,20,0.3)] bg-[rgba(57,255,20,0.08)]',
  'Intermedio':   'text-[var(--hold)] border-[rgba(255,215,0,0.3)] bg-[rgba(255,215,0,0.08)]',
  'Avanzado':     'text-[var(--down)] border-[rgba(255,51,102,0.3)] bg-[rgba(255,51,102,0.08)]',
}

// ─── Bento Card (Desktop) ─────────────────────────────────────────────────
function BentoCard({ dayPlan, isToday, isRest, onClick }) {
  if (isRest) {
    return (
      <div className="bg-[var(--surface)] border border-[var(--border-color)] rounded-2xl p-5 flex flex-col items-center justify-center text-center opacity-60 min-h-[180px]">
        <span className="text-3xl mb-3">😴</span>
        <p className="font-bebas text-lg tracking-widest text-[var(--text)]">{dayPlan.day}</p>
        <p className="text-xs text-[var(--muted)] mt-1">Descanso</p>
      </div>
    )
  }

  return (
    <div
      onClick={onClick}
      className={`rounded-2xl p-5 cursor-pointer transition-all group relative overflow-hidden min-h-[180px] flex flex-col
        ${isToday
          ? 'bg-[var(--surface)] border-2 border-accent shadow-[0_0_30px_rgba(var(--accent-rgb,200,255,0),0.15)]'
          : 'bg-[var(--surface)] border border-[var(--border-color)] hover:border-accent/50'
        }`}
    >
      {isToday && (
        <span className="absolute top-3 right-3 bg-accent text-black font-bebas text-[10px] px-2 py-0.5 rounded-full tracking-widest">HOY</span>
      )}
      <p className={`font-bebas text-xl tracking-widest mb-0.5 ${isToday ? 'text-accent' : 'text-[var(--text)]'}`}>
        {dayPlan.day}
      </p>
      <p className="text-xs text-[var(--muted)] mb-4">{dayPlan.name !== dayPlan.day ? dayPlan.name : (dayPlan.muscles?.join(' + ') || '')}</p>

      <div className="flex flex-col gap-2 flex-1">
        {dayPlan.exercises.slice(0, 3).map((ex, i) => {
          const exName = typeof ex === 'string' ? ex : ex.name
          return (
            <div key={i} className="flex items-center gap-2 bg-[var(--surface2)] rounded-lg px-3 py-2">
              <span className="text-accent text-xs w-4 shrink-0">{i + 1}.</span>
              <span className="text-xs text-[var(--text)] truncate">{exName}</span>
            </div>
          )
        })}
        {dayPlan.exercises.length > 3 && (
          <p className="text-xs text-[var(--muted)] text-center mt-1">+{dayPlan.exercises.length - 3} más</p>
        )}
      </div>

      {isToday && (
        <button className="mt-4 w-full py-2.5 bg-accent text-black font-bebas text-sm tracking-widest rounded-xl flex items-center justify-center gap-2 hover:opacity-90 transition-opacity">
          ▶ Empezar
        </button>
      )}
    </div>
  )
}

// ─── Mini form peso/series/reps ───────────────────────────────────────────────
function ExLogForm({ exName, onConfirm, onCancel }) {
  const [series, setSeries] = useState('')
  const [reps,   setReps]   = useState('')
  const [peso,   setPeso]   = useState('')
  const [secs,   setSecs]   = useState('')

  return (
    <div className="bg-[var(--surface2)] border border-accent/30 rounded-xl p-3 mt-2">
      <p className="text-xs font-semibold text-accent mb-2 uppercase tracking-wider">🎯 {exName}</p>
      <div className="grid grid-cols-2 gap-2 mb-2">
        <div>
          <label className="text-[10px] text-[var(--muted)] uppercase tracking-wider">Series</label>
          <input className="input-field py-1.5 text-sm mt-0.5" placeholder="Ej: 4" value={series} onChange={e => setSeries(e.target.value)} />
        </div>
        <div>
          <label className="text-[10px] text-[var(--muted)] uppercase tracking-wider">Reps</label>
          <input className="input-field py-1.5 text-sm mt-0.5" placeholder="Ej: 10" value={reps} onChange={e => setReps(e.target.value)} />
        </div>
        <div>
          <label className="text-[10px] text-[var(--muted)] uppercase tracking-wider">Peso (kg)</label>
          <input className="input-field py-1.5 text-sm mt-0.5" placeholder="Ej: 80" value={peso} onChange={e => setPeso(e.target.value)} />
        </div>
        <div>
          <label className="text-[10px] text-[var(--muted)] uppercase tracking-wider">Segundos</label>
          <input className="input-field py-1.5 text-sm mt-0.5" placeholder="Ej: 45" value={secs} onChange={e => setSecs(e.target.value)} />
        </div>
      </div>
      <div className="flex gap-2">
        <button className="btn-outline text-xs py-1.5 flex-1" onClick={onCancel}>Cancelar</button>
        <button className="btn-accent text-xs py-1.5 flex-1" onClick={() => onConfirm({ name: exName, series, reps, peso, secs })}>
          ✓ Agregar
        </button>
      </div>
    </div>
  )
}

// ─── Editor de rutina personalizada ──────────────────────────────────────────
function CustomRoutineEditor({ routine, exercises, onSave, onCancel }) {
  const isEdit = !!routine

  // Normalizar ejercicios existentes a objetos
  function normalizeExercises(exList) {
    return (exList || []).map(e => typeof e === 'string' ? { name: e, series: '', reps: '', peso: '', secs: '' } : e)
  }

  const [name, setName] = useState(routine?.name || '')
  const [days, setDays] = useState(
    routine?.plan?.map(d => ({ day: d.day, exercises: normalizeExercises(d.exercises) }))
    || [{ day: 'Lunes', exercises: [] }]
  )
  const [showExPicker,  setShowExPicker]  = useState(null) // dayIdx
  const [pendingEx,     setPendingEx]     = useState(null) // { dayIdx, name }
  const [manualInput,   setManualInput]   = useState('')
  const [search,        setSearch]        = useState('')

  function addDay() {
    const used = days.map(d => d.day)
    const next = DAYS_OF_WEEK.find(d => !used.includes(d)) || 'Lunes'
    setDays(prev => [...prev, { day: next, exercises: [] }])
  }

  function removeDay(i) { setDays(prev => prev.filter((_, idx) => idx !== i)) }

  function updateDayName(i, val) {
    setDays(prev => prev.map((d, idx) => idx === i ? { ...d, day: val } : d))
  }

  function startAddEx(dayIdx, exName) {
    if (!exName.trim()) return
    setShowExPicker(null)
    setPendingEx({ dayIdx, name: exName.trim() })
  }

  function confirmAddEx(dayIdx, exObj) {
    setDays(prev => prev.map((d, idx) =>
      idx === dayIdx ? { ...d, exercises: [...d.exercises, exObj] } : d
    ))
    setPendingEx(null)
    setManualInput('')
    setSearch('')
  }

  function removeEx(dayIdx, exIdx) {
    setDays(prev => prev.map((d, idx) =>
      idx === dayIdx ? { ...d, exercises: d.exercises.filter((_, i) => i !== exIdx) } : d
    ))
  }

  function handleSave() {
    if (!name.trim() || days.length === 0) return
    const plan = days.map(d => ({
      day: d.day, name: d.day, muscles: [],
      emoji: EMOJIS[Math.floor(Math.random() * EMOJIS.length)],
      exercises: d.exercises,
    }))
    onSave({ name: name.trim(), plan })
  }

  const filteredEx = exercises.filter(e => e.name.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="profile-screen">
      <div className="sticky top-0 z-[290] bg-[var(--bg)] border-b border-[var(--border-color)] px-4 py-3 flex items-center gap-3">
        <button className="text-[var(--muted)] hover:text-[var(--text)] text-xl w-8" onClick={onCancel}>←</button>
        <h1 className="font-bebas text-xl tracking-widest text-accent flex-1">{isEdit ? 'EDITAR RUTINA' : 'NUEVA RUTINA'}</h1>
        <button className="btn-accent text-xs py-1.5 px-4" onClick={handleSave} disabled={!name.trim() || days.length === 0}>
          Guardar
        </button>
      </div>

      <div className="p-4 max-w-[500px] mx-auto flex flex-col gap-4 pb-10">
        <div>
          <label className="section-title block mb-2">Nombre de la rutina</label>
          <input className="input-field" placeholder="Ej: Mi rutina semanal..." value={name} onChange={e => setName(e.target.value)} />
        </div>

        <div>
          <label className="section-title block mb-2">Días y ejercicios</label>
          <div className="flex flex-col gap-3">
            {days.map((d, dayIdx) => (
              <div key={dayIdx} className="bg-[var(--surface)] border border-[var(--border-color)] rounded-xl overflow-hidden">
                <div className="flex items-center gap-2 px-3 py-2 border-b border-[var(--border-color)] bg-[var(--surface2)]">
                  <select className="input-field py-1 text-sm font-semibold flex-1" value={d.day} onChange={e => updateDayName(dayIdx, e.target.value)}>
                    {DAYS_OF_WEEK.map(day => <option key={day} value={day}>{day}</option>)}
                  </select>
                  <button className="text-[var(--down)] text-sm px-2" onClick={() => removeDay(dayIdx)}>✕</button>
                </div>

                <div className="px-3 py-2 flex flex-col gap-1">
                  {d.exercises.length === 0 && <p className="text-xs text-[var(--muted)] py-1">Sin ejercicios aún</p>}
                  {d.exercises.map((ex, exIdx) => {
                    const exName = typeof ex === 'string' ? ex : ex.name
                    const exInfo = typeof ex === 'object' ? ex : {}
                    const tags = [
                      exInfo.series && `${exInfo.series} series`,
                      exInfo.reps   && `${exInfo.reps} reps`,
                      exInfo.peso   && `${exInfo.peso} kg`,
                      exInfo.secs   && `${exInfo.secs} seg`,
                    ].filter(Boolean).join(' · ')
                    return (
                      <div key={exIdx} className="flex items-start gap-2 py-1.5 border-b border-[var(--border-color)] last:border-0">
                        <span className="text-accent text-xs w-5 mt-0.5 shrink-0">{exIdx + 1}.</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-[var(--text)] truncate">{exName}</p>
                          {tags && <p className="text-xs text-[var(--muted)]">{tags}</p>}
                        </div>
                        <button className="text-[var(--muted)] hover:text-[var(--down)] text-xs shrink-0" onClick={() => removeEx(dayIdx, exIdx)}>✕</button>
                      </div>
                    )
                  })}

                  {/* Form de peso/series pendiente */}
                  {pendingEx?.dayIdx === dayIdx && (
                    <ExLogForm
                      exName={pendingEx.name}
                      onConfirm={(exObj) => confirmAddEx(dayIdx, exObj)}
                      onCancel={() => { setPendingEx(null); setManualInput('') }}
                    />
                  )}

                  {showExPicker === dayIdx && !pendingEx ? (
                    <div className="mt-2 border border-[var(--border-color)] rounded-lg overflow-hidden">
                      <div className="p-2 bg-[var(--surface2)] border-b border-[var(--border-color)]">
                        <input className="input-field text-xs py-1" placeholder="🔍 Buscar en mis ejercicios..." value={search} onChange={e => setSearch(e.target.value)} autoFocus />
                      </div>
                      {filteredEx.length > 0 && (
                        <div className="max-h-36 overflow-y-auto">
                          {filteredEx.map(ex => (
                            <button key={ex.id} className="w-full text-left px-3 py-2 text-sm hover:bg-[var(--surface2)] border-b border-[var(--border-color)] last:border-0 flex items-center gap-2"
                              onClick={() => startAddEx(dayIdx, ex.name)}>
                              <span className="text-accent text-xs">+</span>
                              <span className="flex-1">{ex.name}</span>
                              <span className="text-[var(--muted)] text-xs">{ex.cat}</span>
                            </button>
                          ))}
                        </div>
                      )}
                      {filteredEx.length === 0 && search && (
                        <div className="px-3 py-2 text-xs text-[var(--muted)]">Sin resultados en tu lista</div>
                      )}
                      <div className="flex gap-2 p-2 bg-[var(--surface2)] border-t border-[var(--border-color)]">
                        <input className="input-field text-xs py-1 flex-1" placeholder="O escribe uno manualmente..." value={manualInput}
                          onChange={e => setManualInput(e.target.value)}
                          onKeyDown={e => { if (e.key === 'Enter' && manualInput.trim()) startAddEx(dayIdx, manualInput) }} />
                        <button className="btn-accent text-xs px-3 py-1" onClick={() => { if (manualInput.trim()) startAddEx(dayIdx, manualInput) }}>＋</button>
                      </div>
                      <button className="w-full py-2 text-xs text-[var(--muted)] hover:text-[var(--text)] bg-[var(--surface2)]"
                        onClick={() => { setShowExPicker(null); setSearch(''); setManualInput('') }}>Cerrar</button>
                    </div>
                  ) : !pendingEx && (
                    <button className="mt-1 w-full py-1.5 text-xs text-accent border border-dashed border-accent rounded-lg hover:opacity-80 transition-opacity"
                      onClick={() => { setShowExPicker(dayIdx); setSearch('') }}>
                      ＋ Agregar ejercicio
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
          <button className="btn-outline w-full mt-3 text-sm" onClick={addDay} disabled={days.length >= 7}>＋ Agregar día</button>
        </div>
      </div>
    </div>
  )
}

// ─── Vista detalle ────────────────────────────────────────────────────────────
function RoutineDetail({ routine, isCustom, activeRoutineId, onActivate, onDeactivate, onEdit, onDelete, onBack }) {
  const [expandDay, setExpandDay] = useState(null)
  const todayName = DAYS_OF_WEEK[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1]

  return (
    <div className="profile-screen">
      <div className="sticky top-0 z-[290] bg-[var(--bg)] border-b border-[var(--border-color)] px-4 py-3 flex items-center gap-3">
        <button className="text-[var(--muted)] hover:text-[var(--text)] text-xl w-8" onClick={onBack}>←</button>
        <div className="flex-1">
          <h1 className="font-bebas text-xl tracking-widest text-accent leading-none">{routine.name}</h1>
          <p className="text-xs text-[var(--muted)]">{routine.plan.length} días{isCustom && ' · Personalizada'}{!isCustom && ` · ${routine.level}`}</p>
        </div>
        <div className="flex gap-2">
          {isCustom && <button className="btn-outline text-xs py-1.5 px-3" onClick={onEdit}>✏️</button>}
          {activeRoutineId === routine.id
            ? <button className="btn-danger text-xs py-1.5 px-3" onClick={onDeactivate}>Desactivar</button>
            : <button className="btn-accent text-xs py-1.5 px-3" onClick={() => onActivate(routine)}>✓ Activar</button>
          }
        </div>
      </div>

      {/* Desktop bento grid */}
      <div className="hidden md:block p-6">
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 max-w-5xl mx-auto">
          {DAYS_OF_WEEK.map(day => {
            const dayPlan = routine.plan.find(d => d.day === day)
            const isToday = day === todayName
            if (!dayPlan) {
              return (
                <div key={day} className="bg-[var(--surface)] border border-[var(--border-color)]/40 rounded-2xl p-5 flex flex-col items-center justify-center text-center opacity-40 min-h-[180px]">
                  <span className="text-3xl mb-3">😴</span>
                  <p className="font-bebas text-lg tracking-widest text-[var(--text)]">{day}</p>
                  <p className="text-xs text-[var(--muted)] mt-1">Descanso</p>
                </div>
              )
            }
            return <BentoCard key={day} dayPlan={{ ...dayPlan, day }} isToday={isToday} onClick={() => setExpandDay(expandDay === day ? null : day)} />
          })}
        </div>
      </div>

      {/* Mobile accordion list */}
      <div className="md:hidden p-4 max-w-[500px] mx-auto flex flex-col gap-3 pb-10">
        {routine.desc && <p className="text-sm text-[var(--muted)]">{routine.desc}</p>}
        {routine.plan.map((d, i) => {
          const isToday = d.day === todayName
          return (
            <div key={i} className={`bg-[var(--surface)] border rounded-xl overflow-hidden transition-all ${isToday ? 'border-accent shadow-[0_0_20px_rgba(200,255,0,0.1)]' : 'border-[var(--border-color)]'}`}>
              <button className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-[var(--surface2)] transition-colors"
                onClick={() => setExpandDay(expandDay === i ? null : i)}>
                {isToday && <span className="bg-accent text-black font-bebas text-[9px] px-1.5 py-0.5 rounded-full">HOY</span>}
                <span className="text-xl">{d.emoji || '💪'}</span>
                <div className="flex-1">
                  <div className="font-semibold text-sm">{d.day}{d.name && d.name !== d.day ? ` — ${d.name}` : ''}</div>
                  {d.muscles?.length > 0 && <div className="text-xs text-[var(--muted)]">{d.muscles.join(' · ')}</div>}
                  <div className="text-xs text-[var(--muted)]">{d.exercises.length} ejercicios</div>
                </div>
                <span className="text-[var(--muted)] text-xs">{expandDay === i ? '▲' : '▼'}</span>
              </button>
              {expandDay === i && (
                <div className="border-t border-[var(--border-color)] px-4 py-3 flex flex-col gap-2">
                  {d.exercises.map((ex, j) => {
                    const exName = typeof ex === 'string' ? ex : ex.name
                    const exInfo = typeof ex === 'object' ? ex : {}
                    const tags = [
                      exInfo.series && `${exInfo.series} series`,
                      exInfo.reps   && `${exInfo.reps} reps`,
                      exInfo.peso   && `${exInfo.peso} kg`,
                      exInfo.secs   && `${exInfo.secs} seg`,
                    ].filter(Boolean).join(' · ')
                    return (
                      <div key={j} className="flex items-start gap-2 py-0.5">
                        <span className="text-accent text-xs w-5 mt-0.5 shrink-0">{j + 1}.</span>
                        <div>
                          <p className="text-sm">{exName}</p>
                          {tags && <p className="text-xs text-[var(--muted)]">{tags}</p>}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
        {isCustom && <button className="btn-danger w-full mt-2 text-sm" onClick={onDelete}>🗑 Eliminar rutina</button>}
      </div>
    </div>
  )
}

// ─── Pantalla principal ───────────────────────────────────────────────────────
export default function RoutinesScreen({ onClose }) {
  const { state, updateState, showToast } = useApp()

  const [view,          setView]          = useState('list')
  const [selected,      setSelected]      = useState(null)
  const [editingCustom, setEditingCustom] = useState(null)
  const [expandDay,     setExpandDay]     = useState(null)

  const customRoutines  = state?.customRoutines || []
  const activeRoutineId = state?.activeRoutine?.id || null
  const todayName       = DAYS_OF_WEEK[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1]

  function activateRoutine(routine) {
    updateState(prev => ({ ...prev, activeRoutine: { id: routine.id, name: routine.name, plan: routine.plan } }))
    showToast(`✓ Rutina "${routine.name}" activada`, 'ok')
  }

  function deactivateRoutine() {
    updateState(prev => ({ ...prev, activeRoutine: null }))
    showToast('Rutina desactivada', 'ok')
  }

  function saveCustomRoutine(data) {
    if (editingCustom) {
      const updated = customRoutines.map(r => r.id === editingCustom.id ? { ...r, ...data } : r)
      updateState(prev => ({ ...prev, customRoutines: updated }))
      if (activeRoutineId === editingCustom.id) {
        updateState(prev => ({ ...prev, activeRoutine: { id: editingCustom.id, name: data.name, plan: data.plan } }))
      }
      showToast('✓ Rutina actualizada', 'ok')
    } else {
      const newRoutine = { id: 'custom_' + Date.now(), ...data }
      updateState(prev => ({ ...prev, customRoutines: [...(prev.customRoutines || []), newRoutine] }))
      showToast('✓ Rutina creada', 'ok')
    }
    setView('list')
    setEditingCustom(null)
  }

  function deleteCustomRoutine(id) {
    updateState(prev => ({
      ...prev,
      customRoutines: (prev.customRoutines || []).filter(r => r.id !== id),
      activeRoutine: prev.activeRoutine?.id === id ? null : prev.activeRoutine,
    }))
    showToast('Rutina eliminada', 'ok')
    setView('list')
    setSelected(null)
  }

  // Hoy toca
  const activeRoutineData = (() => {
    if (!activeRoutineId) return null
    const routine = customRoutines.find(r => r.id === activeRoutineId) || PREDEFINED.find(r => r.id === activeRoutineId)
    if (!routine) return null
    const todayPlan = routine.plan.find(d => d.day === todayName)
    return { routine, todayPlan }
  })()

  if (view === 'editor') {
    return (
      <CustomRoutineEditor
        routine={editingCustom}
        exercises={state?.exercises || []}
        onSave={saveCustomRoutine}
        onCancel={() => setView(editingCustom ? 'detail' : 'list')}
      />
    )
  }

  if (view === 'detail' && selected) {
    return (
      <RoutineDetail
        routine={selected}
        isCustom={!!selected.isCustom}
        activeRoutineId={activeRoutineId}
        onActivate={activateRoutine}
        onDeactivate={deactivateRoutine}
        onEdit={() => { setEditingCustom(selected); setView('editor') }}
        onDelete={() => deleteCustomRoutine(selected.id)}
        onBack={() => { setView('list'); setSelected(null) }}
      />
    )
  }

  // ── BENTO GRID DESKTOP (rutina activa) ──
  const showBento = activeRoutineData && view === 'list'

  return (
    <div className="profile-screen">
      {/* Header */}
      <div className="sticky top-0 z-[290] bg-[var(--bg)] border-b border-[var(--border-color)] px-4 py-3 flex items-center gap-3">
        <button className="text-[var(--muted)] hover:text-[var(--text)] text-xl w-8" onClick={onClose}>←</button>
        <div className="flex-1">
          <p className="text-[10px] text-accent uppercase tracking-widest font-semibold">Tu Programa</p>
          <h1 className="font-bebas text-xl tracking-widest text-[var(--text)] leading-none">
            {activeRoutineData ? activeRoutineData.routine.name : 'RUTINAS'}
          </h1>
        </div>
        <button className="btn-accent text-xs py-1.5 px-3" onClick={() => { setEditingCustom(null); setView('editor') }}>
          ＋ Nueva
        </button>
      </div>

      {/* ── DESKTOP: Bento Grid de la rutina activa ── */}
      {showBento && (
        <div className="hidden md:block px-6 pt-6 pb-2 max-w-5xl mx-auto">
          <div className="mb-6">
            <p className="text-xs text-accent uppercase tracking-widest font-semibold mb-1">Ciclo Actual</p>
            <h2 className="font-bebas text-4xl tracking-widest text-[var(--text)]">{activeRoutineData.routine.name}</h2>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {DAYS_OF_WEEK.map(day => {
              const dayPlan = activeRoutineData.routine.plan.find(d => d.day === day)
              const isToday = day === todayName
              if (!dayPlan) {
                return (
                  <div key={day} className="bg-[var(--surface)] border border-[var(--border-color)]/40 rounded-2xl p-5 flex flex-col items-center justify-center text-center opacity-40 min-h-[160px]">
                    <span className="text-3xl mb-2">😴</span>
                    <p className="font-bebas text-base tracking-widest">{day}</p>
                    <p className="text-xs text-[var(--muted)]">Descanso</p>
                  </div>
                )
              }
              return <BentoCard key={day} dayPlan={{ ...dayPlan, day }} isToday={isToday} />
            })}
            {/* Nueva rutina cell */}
            <div
              className="bg-[var(--surface)] border border-dashed border-accent/40 rounded-2xl p-5 flex flex-col items-center justify-center cursor-pointer hover:border-accent transition-all group min-h-[160px]"
              onClick={() => { setEditingCustom(null); setView('editor') }}
            >
              <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center text-accent group-hover:scale-110 transition-transform mb-3">
                <span className="text-xl">＋</span>
              </div>
              <p className="font-bebas text-base tracking-widest text-[var(--text)]">Nueva Rutina</p>
              <p className="text-xs text-[var(--muted)]">Crea un nuevo ciclo</p>
            </div>
          </div>

          {/* Stats bar */}
          <div className="mt-8 grid grid-cols-3 gap-6 p-6 bg-[var(--surface)] rounded-2xl border border-[var(--border-color)] relative overflow-hidden">
            <div className="absolute left-0 top-0 w-1 h-full bg-gradient-to-b from-accent to-[var(--accent2)]" />
            <div>
              <p className="text-xs text-[var(--muted)] uppercase tracking-widest mb-1">Días en rutina</p>
              <p className="font-bebas text-4xl text-[var(--text)]">{activeRoutineData.routine.plan.length}</p>
              <p className="text-xs text-[var(--muted)] mt-1">de 7 días semanales</p>
            </div>
            <div>
              <p className="text-xs text-[var(--muted)] uppercase tracking-widest mb-1">Ejercicios totales</p>
              <p className="font-bebas text-4xl text-[var(--text)]">
                {activeRoutineData.routine.plan.reduce((acc, d) => acc + d.exercises.length, 0)}
              </p>
              <p className="text-xs text-[var(--muted)] mt-1">en toda la semana</p>
            </div>
            <div>
              <p className="text-xs text-[var(--muted)] uppercase tracking-widest mb-1">Hoy toca</p>
              <p className="font-bebas text-2xl text-accent">
                {activeRoutineData.todayPlan ? activeRoutineData.todayPlan.name || activeRoutineData.todayPlan.day : 'Descanso 😴'}
              </p>
              {activeRoutineData.todayPlan && (
                <p className="text-xs text-[var(--muted)] mt-1">{activeRoutineData.todayPlan.exercises.length} ejercicios</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── MOBILE: Rutina activa banner + lista acordeón ── */}
      <div className={`md:hidden p-4 max-w-[500px] mx-auto flex flex-col gap-4 pb-10 ${showBento ? '' : ''}`}>

        {/* Banner rutina activa */}
        {activeRoutineData && (
          <div className="bg-[rgba(200,255,0,0.08)] border border-accent/30 rounded-xl p-4">
            <p className="text-[10px] text-accent uppercase tracking-widest mb-1">✅ Rutina activa</p>
            <p className="font-bebas text-lg text-[var(--text)] tracking-widest">{activeRoutineData.routine.name}</p>
            {activeRoutineData.todayPlan && (
              <div className="mt-2 pt-2 border-t border-accent/20 flex items-center gap-2">
                <span className="text-lg">{activeRoutineData.todayPlan.emoji || '💪'}</span>
                <div>
                  <p className="text-sm font-semibold text-[var(--text)]">Hoy — {activeRoutineData.todayPlan.name || activeRoutineData.todayPlan.day}</p>
                  <p className="text-xs text-[var(--muted)]">{activeRoutineData.todayPlan.exercises.length} ejercicios</p>
                </div>
              </div>
            )}
            {!activeRoutineData.todayPlan && (
              <p className="text-sm text-[var(--muted)] mt-1">😴 Hoy es día de descanso</p>
            )}
            <button className="btn-danger w-full mt-3 py-1.5 text-xs" onClick={deactivateRoutine}>Desactivar</button>
          </div>
        )}

        {/* Lista de días (acordeón) si hay rutina activa */}
        {activeRoutineData && (
          <div className="flex flex-col gap-2">
            <p className="section-title mb-1">ESTA SEMANA</p>
            {activeRoutineData.routine.plan.map((d, i) => {
              const isToday = d.day === todayName
              return (
                <div key={i} className={`bg-[var(--surface)] border rounded-xl overflow-hidden ${isToday ? 'border-accent' : 'border-[var(--border-color)]'}`}>
                  <button
                    className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-[var(--surface2)] transition-colors"
                    onClick={() => setExpandDay(expandDay === i ? null : i)}
                  >
                    <span className="text-xl">{d.emoji || '💪'}</span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm">{d.day}</span>
                        {isToday && <span className="bg-accent text-black font-bebas text-[9px] px-1.5 rounded-full">HOY</span>}
                      </div>
                      <div className="text-xs text-[var(--muted)]">{d.name !== d.day ? d.name : ''} · {d.exercises.length} ejercicios</div>
                    </div>
                    <span className="text-[var(--muted)] text-xs">{expandDay === i ? '▲' : '▼'}</span>
                  </button>
                  {expandDay === i && (
                    <div className="border-t border-[var(--border-color)] px-4 py-3 flex flex-col gap-2">
                      {d.exercises.map((ex, j) => {
                          const exName = typeof ex === 'string' ? ex : ex.name
                          const exInfo = typeof ex === 'object' ? ex : {}
                          const tags = [
                            exInfo.series && `${exInfo.series} series`,
                            exInfo.reps   && `${exInfo.reps} reps`,
                            exInfo.peso   && `${exInfo.peso} kg`,
                            exInfo.secs   && `${exInfo.secs} seg`,
                          ].filter(Boolean).join(' · ')
                          return (
                            <div key={j} className="flex items-start gap-2 py-0.5">
                              <span className="text-accent text-xs w-5 mt-0.5 shrink-0">{j + 1}.</span>
                              <div>
                                <p className="text-sm">{exName}</p>
                                {tags && <p className="text-xs text-[var(--muted)]">{tags}</p>}
                              </div>
                            </div>
                          )
                        })}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* Mis rutinas */}
        <div>
          <p className="section-title mb-3">MIS RUTINAS</p>
          {customRoutines.length === 0 ? (
            <div className="bg-[var(--surface)] border border-dashed border-[var(--border-color)] rounded-xl p-6 text-center">
              <p className="text-2xl mb-2">📋</p>
              <p className="text-sm text-[var(--muted)]">No tienes rutinas personalizadas aún</p>
              <button className="btn-accent text-xs py-1.5 px-4 mt-3" onClick={() => { setEditingCustom(null); setView('editor') }}>
                ＋ Crear mi primera rutina
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {customRoutines.map(r => (
                <div key={r.id} className={`bg-[var(--surface)] border rounded-xl overflow-hidden ${activeRoutineId === r.id ? 'border-accent' : 'border-[var(--border-color)]'}`}>
                  <div className="flex items-center">
                    <button className="flex-1 text-left px-4 py-4 hover:bg-[var(--surface2)] transition-colors"
                      onClick={() => { setSelected({ ...r, isCustom: true }); setView('detail') }}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-bebas text-lg text-accent tracking-wider">{r.name}</span>
                            {activeRoutineId === r.id && <span className="text-xs text-accent">✓ Activa</span>}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs border rounded-full px-2 py-0.5 text-[var(--muted)] border-[var(--border-color)]">📅 {r.plan.length} días</span>
                            <span className="text-xs border rounded-full px-2 py-0.5 text-accent border-accent bg-[rgba(200,255,0,0.08)]">✨ Personalizada</span>
                          </div>
                        </div>
                        <span className="text-[var(--muted)] mt-1">›</span>
                      </div>
                    </button>
                    <button
                      className="px-4 py-4 text-[var(--down)] hover:bg-[rgba(255,51,102,0.1)] transition-colors border-l border-[var(--border-color)]"
                      onClick={() => deleteCustomRoutine(r.id)}
                    >🗑</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Rutinas predefinidas */}
        <div>
          <p className="section-title mb-3">RUTINAS PREDEFINIDAS</p>
          <div className="flex flex-col gap-3">
            {PREDEFINED.map(r => (
              <div key={r.id} className={`bg-[var(--surface)] border rounded-xl overflow-hidden ${activeRoutineId === r.id ? 'border-accent' : 'border-[var(--border-color)]'}`}>
                <button className="w-full text-left px-4 py-4 hover:bg-[var(--surface2)] transition-colors"
                  onClick={() => { setSelected(r); setView('detail') }}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bebas text-lg text-accent tracking-wider">{r.name}</span>
                        {activeRoutineId === r.id && <span className="text-xs text-accent">✓ Activa</span>}
                      </div>
                      <p className="text-xs text-[var(--muted)] mb-2">{r.desc}</p>
                      <div className="flex items-center gap-2">
                        <span className="text-xs border rounded-full px-2 py-0.5 text-[var(--muted)] border-[var(--border-color)]">📅 {r.days} días</span>
                        <span className={`text-xs border rounded-full px-2 py-0.5 ${LEVEL_COLORS[r.level]}`}>{r.level}</span>
                      </div>
                    </div>
                    <span className="text-[var(--muted)] mt-1">›</span>
                  </div>
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── DESKTOP lista cuando no hay rutina activa ── */}
      {!showBento && (
        <div className="hidden md:block px-6 pt-6 pb-10 max-w-5xl mx-auto">
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Mis rutinas */}
            {customRoutines.map(r => (
              <div key={r.id} className={`bg-[var(--surface)] border rounded-2xl p-5 hover:border-accent transition-all group relative ${activeRoutineId === r.id ? 'border-accent' : 'border-[var(--border-color)]'}`}>
                <button
                  className="absolute top-3 right-3 w-7 h-7 rounded-full bg-[rgba(255,51,102,0.1)] text-[var(--down)] hover:bg-[rgba(255,51,102,0.25)] transition-colors flex items-center justify-center text-sm"
                  onClick={() => deleteCustomRoutine(r.id)}
                >✕</button>
                <div className="cursor-pointer" onClick={() => { setSelected({ ...r, isCustom: true }); setView('detail') }}>
                  <div className="flex items-center gap-2 mb-2 pr-8">
                    <span className="font-bebas text-xl text-accent tracking-wider flex-1">{r.name}</span>
                    {activeRoutineId === r.id && <span className="text-xs text-accent">✓</span>}
                  </div>
                  <p className="text-xs text-[var(--muted)] mb-3">{r.plan.length} días · Personalizada</p>
                  <div className="flex flex-col gap-1">
                    {r.plan.slice(0, 3).map((d, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs text-[var(--muted)]">
                        <span className="text-accent">·</span>{d.day}
                      </div>
                    ))}
                    {r.plan.length > 3 && <span className="text-xs text-[var(--muted)]">+{r.plan.length - 3} días más</span>}
                  </div>
                </div>
              </div>
            ))}

            {/* Predefinidas */}
            {PREDEFINED.map(r => (
              <div key={r.id} className={`bg-[var(--surface)] border rounded-2xl p-5 cursor-pointer hover:border-accent transition-all ${activeRoutineId === r.id ? 'border-accent' : 'border-[var(--border-color)]'}`}
                onClick={() => { setSelected(r); setView('detail') }}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-bebas text-xl text-accent tracking-wider flex-1">{r.name}</span>
                  {activeRoutineId === r.id && <span className="text-xs text-accent">✓</span>}
                </div>
                <p className="text-xs text-[var(--muted)] mb-3">{r.desc}</p>
                <div className="flex items-center gap-2">
                  <span className="text-xs border rounded-full px-2 py-0.5 text-[var(--muted)] border-[var(--border-color)]">📅 {r.days} días</span>
                  <span className={`text-xs border rounded-full px-2 py-0.5 ${LEVEL_COLORS[r.level]}`}>{r.level}</span>
                </div>
              </div>
            ))}

            {/* Nueva rutina */}
            <div className="bg-[var(--surface)] border border-dashed border-accent/40 rounded-2xl p-5 flex flex-col items-center justify-center cursor-pointer hover:border-accent transition-all group"
              onClick={() => { setEditingCustom(null); setView('editor') }}>
              <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center text-accent group-hover:scale-110 transition-transform mb-3">
                <span className="text-xl">＋</span>
              </div>
              <p className="font-bebas text-lg tracking-widest text-[var(--text)]">Nueva Rutina</p>
              <p className="text-xs text-[var(--muted)]">Crea un nuevo ciclo</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
