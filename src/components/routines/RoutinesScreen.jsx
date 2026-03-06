import { useState } from 'react'
import { useApp } from '../../context/AppContext'

const ROUTINES = [
  {
    id: 'ppl',
    name: 'Push / Pull / Piernas',
    days: 3,
    level: 'Intermedio',
    desc: 'Divide los ejercicios en empuje, tracción y piernas. Ideal para 3-6 días por semana.',
    plan: [
      { day: 'Día 1', name: 'Push (Empuje)', muscles: ['Pecho','Hombros','Tríceps'], emoji: '💪',
        exercises: ['Press de banca', 'Press inclinado', 'Aperturas', 'Press militar', 'Elevaciones laterales', 'Extensiones tríceps'] },
      { day: 'Día 2', name: 'Pull (Tracción)', muscles: ['Espalda','Bíceps'], emoji: '🏋️',
        exercises: ['Dominadas', 'Remo con barra', 'Jalón al pecho', 'Remo sentado', 'Curl de bíceps', 'Curl martillo'] },
      { day: 'Día 3', name: 'Piernas', muscles: ['Piernas','Glúteos','Abdomen'], emoji: '🦵',
        exercises: ['Sentadilla', 'Prensa', 'Extensiones de cuádriceps', 'Curl femoral', 'Peso muerto rumano', 'Plancha'] },
    ]
  },
  {
    id: 'fullbody',
    name: 'Full Body',
    days: 3,
    level: 'Principiante',
    desc: 'Trabaja todo el cuerpo en cada sesión. Perfecto para principiantes o días limitados.',
    plan: [
      { day: 'Día 1', name: 'Full Body A', muscles: ['Pecho','Espalda','Piernas','Hombros'], emoji: '🔥',
        exercises: ['Sentadilla', 'Press de banca', 'Dominadas', 'Press militar', 'Peso muerto', 'Plancha'] },
      { day: 'Día 2', name: 'Full Body B', muscles: ['Pecho','Espalda','Piernas','Brazos'], emoji: '⚡',
        exercises: ['Prensa', 'Aperturas', 'Remo con barra', 'Curl de bíceps', 'Extensiones tríceps', 'Elevaciones de talones'] },
      { day: 'Día 3', name: 'Full Body C', muscles: ['Hombros','Espalda','Piernas','Abdomen'], emoji: '💥',
        exercises: ['Peso muerto', 'Press Arnold', 'Jalón al pecho', 'Sentadilla búlgara', 'Curl femoral', 'Crunch abdominal'] },
    ]
  },
  {
    id: 'upper_lower',
    name: 'Upper / Lower',
    days: 4,
    level: 'Intermedio',
    desc: 'Alterna tren superior e inferior. Ideal para 4 días por semana.',
    plan: [
      { day: 'Día 1', name: 'Tren Superior A', muscles: ['Pecho','Espalda','Hombros'], emoji: '💪',
        exercises: ['Press de banca', 'Remo con barra', 'Press militar', 'Jalón al pecho', 'Aperturas', 'Elevaciones laterales'] },
      { day: 'Día 2', name: 'Tren Inferior A', muscles: ['Piernas','Glúteos'], emoji: '🦵',
        exercises: ['Sentadilla', 'Peso muerto rumano', 'Prensa', 'Extensiones', 'Curl femoral', 'Elevaciones de talones'] },
      { day: 'Día 3', name: 'Tren Superior B', muscles: ['Pecho','Espalda','Brazos'], emoji: '🏋️',
        exercises: ['Press inclinado', 'Dominadas', 'Curl de bíceps', 'Extensiones tríceps', 'Remo sentado', 'Fondos'] },
      { day: 'Día 4', name: 'Tren Inferior B', muscles: ['Piernas','Abdomen'], emoji: '🔥',
        exercises: ['Peso muerto', 'Sentadilla búlgara', 'Zancadas', 'Curl femoral', 'Plancha', 'Crunch abdominal'] },
    ]
  },
  {
    id: 'torso_pierna',
    name: 'Torso / Pierna',
    days: 4,
    level: 'Intermedio',
    desc: 'Combina pecho, espalda y hombros en un día; piernas y glúteos en otro.',
    plan: [
      { day: 'Día 1', name: 'Torso A', muscles: ['Pecho','Espalda','Hombros'], emoji: '💪',
        exercises: ['Press de banca', 'Jalón al pecho', 'Press Arnold', 'Remo con mancuerna', 'Elevaciones laterales', 'Aperturas'] },
      { day: 'Día 2', name: 'Pierna A', muscles: ['Cuádriceps','Femoral','Glúteos'], emoji: '🦵',
        exercises: ['Sentadilla', 'Peso muerto rumano', 'Prensa', 'Extensiones', 'Curl femoral', 'Hip thrust'] },
      { day: 'Día 3', name: 'Torso B', muscles: ['Pecho','Espalda','Brazos'], emoji: '🏋️',
        exercises: ['Press inclinado', 'Dominadas', 'Fondos', 'Curl de bíceps', 'Extensiones tríceps', 'Remo sentado'] },
      { day: 'Día 4', name: 'Pierna B', muscles: ['Piernas','Abdomen','Glúteos'], emoji: '🔥',
        exercises: ['Zancadas', 'Sentadilla búlgara', 'Peso muerto', 'Elevaciones de talones', 'Plancha', 'Crunch abdominal'] },
    ]
  },
  {
    id: 'arnold',
    name: 'Arnold Split',
    days: 6,
    level: 'Avanzado',
    desc: 'El split de Arnold Schwarzenegger. 6 días combinando grupos antagonistas.',
    plan: [
      { day: 'Día 1', name: 'Pecho + Espalda', muscles: ['Pecho','Espalda'], emoji: '🏆',
        exercises: ['Press de banca', 'Dominadas', 'Press inclinado', 'Remo con barra', 'Aperturas', 'Jalón al pecho'] },
      { day: 'Día 2', name: 'Hombros + Brazos', muscles: ['Hombros','Bíceps','Tríceps'], emoji: '💪',
        exercises: ['Press militar', 'Curl de bíceps', 'Extensiones tríceps', 'Elevaciones laterales', 'Curl martillo', 'Fondos'] },
      { day: 'Día 3', name: 'Piernas', muscles: ['Piernas','Glúteos','Abdomen'], emoji: '🦵',
        exercises: ['Sentadilla', 'Peso muerto', 'Prensa', 'Curl femoral', 'Elevaciones de talones', 'Plancha'] },
      { day: 'Día 4', name: 'Pecho + Espalda', muscles: ['Pecho','Espalda'], emoji: '🏆',
        exercises: ['Press de banca inclinado', 'Remo sentado', 'Fondos pecho', 'Dominadas', 'Pullover', 'Remo mancuerna'] },
      { day: 'Día 5', name: 'Hombros + Brazos', muscles: ['Hombros','Bíceps','Tríceps'], emoji: '💪',
        exercises: ['Press Arnold', 'Curl concentrado', 'Extensiones sobre la cabeza', 'Elevaciones frontales', 'Curl barra Z', 'Kickbacks'] },
      { day: 'Día 6', name: 'Piernas', muscles: ['Piernas','Glúteos','Abdomen'], emoji: '🦵',
        exercises: ['Sentadilla búlgara', 'Peso muerto rumano', 'Zancadas', 'Extensiones', 'Hip thrust', 'Crunch abdominal'] },
    ]
  },
  {
    id: 'bro_split',
    name: 'Bro Split',
    days: 5,
    level: 'Intermedio',
    desc: 'Un grupo muscular por día. El clásico de los gimnasios.',
    plan: [
      { day: 'Día 1', name: 'Pecho', muscles: ['Pecho','Tríceps'], emoji: '💪',
        exercises: ['Press de banca', 'Press inclinado', 'Press declinado', 'Aperturas', 'Fondos', 'Pullover'] },
      { day: 'Día 2', name: 'Espalda', muscles: ['Espalda','Bíceps'], emoji: '🏋️',
        exercises: ['Peso muerto', 'Remo con barra', 'Jalón al pecho', 'Dominadas', 'Remo sentado', 'Curl de bíceps'] },
      { day: 'Día 3', name: 'Hombros', muscles: ['Hombros','Trapecios'], emoji: '🔥',
        exercises: ['Press militar', 'Press Arnold', 'Elevaciones laterales', 'Elevaciones frontales', 'Pájaros', 'Encogimientos'] },
      { day: 'Día 4', name: 'Brazos', muscles: ['Bíceps','Tríceps','Antebrazos'], emoji: '💥',
        exercises: ['Curl barra', 'Extensiones tríceps', 'Curl martillo', 'Fondos', 'Curl concentrado', 'Kickbacks'] },
      { day: 'Día 5', name: 'Piernas', muscles: ['Piernas','Glúteos','Abdomen'], emoji: '🦵',
        exercises: ['Sentadilla', 'Prensa', 'Extensiones', 'Peso muerto rumano', 'Curl femoral', 'Plancha'] },
    ]
  },
]

const LEVEL_COLORS = {
  'Principiante': 'text-[var(--up)] border-[rgba(57,255,20,0.3)] bg-[rgba(57,255,20,0.08)]',
  'Intermedio':   'text-[var(--hold)] border-[rgba(255,215,0,0.3)] bg-[rgba(255,215,0,0.08)]',
  'Avanzado':     'text-[var(--down)] border-[rgba(255,51,102,0.3)] bg-[rgba(255,51,102,0.08)]',
}

export default function RoutinesScreen({ onClose }) {
  const { state, updateState, showToast } = useApp()
  const [selected,   setSelected]   = useState(null)
  const [expandDay,  setExpandDay]  = useState(null)

  const activeRoutineId = state?.activeRoutine?.id || null

  function activateRoutine(routine) {
    updateState(prev => ({ ...prev, activeRoutine: { id: routine.id, name: routine.name, plan: routine.plan } }))
    showToast(`✓ Rutina "${routine.name}" activada`, 'ok')
  }

  function deactivateRoutine() {
    updateState(prev => ({ ...prev, activeRoutine: null }))
    showToast('Rutina desactivada', 'ok')
  }

  // Vista detalle
  if (selected) {
    return (
      <div className="profile-screen">
        <div className="sticky top-0 z-[290] bg-[var(--bg)] border-b border-[var(--border-color)] px-4 py-3 flex items-center gap-3">
          <button className="text-[var(--muted)] hover:text-[var(--text)] text-xl w-8" onClick={() => setSelected(null)}>←</button>
          <div className="flex-1">
            <h1 className="font-bebas text-xl tracking-widest text-accent leading-none">{selected.name}</h1>
            <p className="text-xs text-[var(--muted)]">{selected.days} días · {selected.level}</p>
          </div>
          {activeRoutineId === selected.id ? (
            <button className="btn-danger text-xs py-1.5 px-3" onClick={deactivateRoutine}>Desactivar</button>
          ) : (
            <button className="btn-accent text-xs py-1.5 px-3" onClick={() => activateRoutine(selected)}>✓ Activar</button>
          )}
        </div>

        <div className="p-6 max-w-[500px] mx-auto flex flex-col gap-4">
          <p className="text-sm text-[var(--muted)]">{selected.desc}</p>

          {selected.plan.map((d, i) => (
            <div key={i} className="bg-[var(--surface)] border border-[var(--border-color)] rounded-xl overflow-hidden">
              <button
                className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-[var(--surface2)] transition-colors"
                onClick={() => setExpandDay(expandDay === i ? null : i)}
              >
                <span className="text-2xl">{d.emoji}</span>
                <div className="flex-1">
                  <div className="font-semibold text-sm">{d.day} — {d.name}</div>
                  <div className="text-xs text-[var(--muted)]">{d.muscles.join(' · ')}</div>
                </div>
                <span className="text-[var(--muted)] text-xs">{expandDay === i ? '▲' : '▼'}</span>
              </button>

              {expandDay === i && (
                <div className="border-t border-[var(--border-color)] px-4 py-3 flex flex-col gap-2">
                  {d.exercises.map((ex, j) => (
                    <div key={j} className="flex items-center gap-2 text-sm">
                      <span className="text-accent text-xs w-5">{j+1}.</span>
                      <span>{ex}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    )
  }

  // Vista lista
  return (
    <div className="profile-screen">
      <div className="sticky top-0 z-[290] bg-[var(--bg)] border-b border-[var(--border-color)] px-4 py-3 flex items-center gap-3">
        <button className="text-[var(--muted)] hover:text-[var(--text)] text-xl w-8" onClick={onClose}>←</button>
        <div>
          <h1 className="font-bebas text-xl tracking-widest text-accent leading-none">RUTINAS</h1>
          <p className="text-xs text-[var(--muted)]">Planes de entrenamiento predefinidos</p>
        </div>
      </div>

      <div className="p-6 max-w-[500px] mx-auto flex flex-col gap-4">

        {/* Rutina activa */}
        {activeRoutineId && (
          <div className="bg-[rgba(200,255,0,0.08)] border border-[rgba(200,255,0,0.3)] rounded-xl p-4">
            <div className="text-xs text-[var(--muted)] mb-1">✅ Rutina activa</div>
            <div className="font-semibold text-accent">{state.activeRoutine.name}</div>

            {/* Qué entrenar hoy */}
            {(() => {
              const dayOfWeek = new Date().getDay()
              const idx = dayOfWeek === 0 ? 6 : dayOfWeek - 1
              const routine = ROUTINES.find(r => r.id === activeRoutineId)
              if (!routine) return null
              const todayPlan = routine.plan[idx % routine.plan.length]
              return (
                <div className="mt-3 pt-3 border-t border-[rgba(200,255,0,0.2)]">
                  <div className="text-xs text-[var(--muted)] mb-1">💡 Hoy toca</div>
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{todayPlan.emoji}</span>
                    <div>
                      <div className="font-semibold text-sm">{todayPlan.name}</div>
                      <div className="text-xs text-[var(--muted)]">{todayPlan.muscles.join(' · ')}</div>
                    </div>
                  </div>
                </div>
              )
            })()}

            <button className="btn-danger w-full mt-3 py-1.5 text-xs" onClick={deactivateRoutine}>Desactivar rutina</button>
          </div>
        )}

        {/* Lista de rutinas */}
        {ROUTINES.map(r => (
          <div
            key={r.id}
            className={`bg-[var(--surface)] border rounded-xl overflow-hidden transition-all ${activeRoutineId === r.id ? 'border-accent' : 'border-[var(--border-color)]'}`}
          >
            <button className="w-full text-left px-4 py-4 hover:bg-[var(--surface2)] transition-colors" onClick={() => setSelected(r)}>
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
  )
}
