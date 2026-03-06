import { useApp } from '../../context/AppContext'

const MONTHS = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

export default function StatsScreen({ onClose }) {
  const { state, myLogs } = useApp()
  const logs = myLogs()

  if (!state) return null

  const exercises   = state.exercises || []
  const trainedDays = state.trainedDays || {}
  const categories  = state.categories || []
  const bodyWeights = state.bodyWeights || []

  // ── Resumen mensual ────────────────────────────────────────────────────────
  const now    = new Date()
  const year   = now.getFullYear()
  const month  = now.getMonth()
  const prefix = `${year}-${String(month+1).padStart(2,'0')}`

  const daysThisMonth = Object.keys(trainedDays).filter(k => k.startsWith(prefix)).length
  let monthLogs = 0, monthSube = 0, monthBaja = 0, monthMantiene = 0, bestEx = null, bestDelta = -Infinity
  exercises.forEach(ex => {
    const exLogs = (logs[String(ex.id)] || []).filter(l => l.fecha?.startsWith(prefix))
    monthLogs += exLogs.length
    exLogs.forEach(l => {
      if (l.cond === 'SUBE') monthSube++
      else if (l.cond === 'BAJA') monthBaja++
      else monthMantiene++
    })
    const all = logs[String(ex.id)] || []
    if (all.length >= 2) {
      const delta = (parseFloat(all[all.length-1].peso) || 0) - (parseFloat(all[0].peso) || 0)
      if (delta > bestDelta) { bestDelta = delta; bestEx = ex.name }
    }
  })
  const motivation = daysThisMonth >= 15 ? '¡Bestia total! Más de la mitad del mes entrenando 🔥'
    : daysThisMonth >= 8 ? 'Buen ritmo, sigue construyendo el hábito 💪'
    : 'Cada día cuenta — el próximo mes será mejor 🌟'

  // ── Racha actual y récord ──────────────────────────────────────────────────
  const sortedDays = Object.keys(trainedDays).sort()
  let currentStreak = 0, bestStreak = 0, tempStreak = 0
  sortedDays.forEach((d, i) => {
    if (i === 0) { tempStreak = 1; return }
    const prev = new Date(sortedDays[i - 1] + 'T12:00:00')
    const curr = new Date(d + 'T12:00:00')
    const diff = (curr - prev) / 86400000
    if (diff === 1) tempStreak++
    else tempStreak = 1
    if (tempStreak > bestStreak) bestStreak = tempStreak
  })
  // Racha actual: contar desde hoy hacia atrás
  const todayStr = new Date().toISOString().split('T')[0]
  let streak = 0
  let checkDate = new Date()
  while (true) {
    const ds = checkDate.toISOString().split('T')[0]
    if (trainedDays[ds]) { streak++; checkDate.setDate(checkDate.getDate() - 1) }
    else break
  }
  currentStreak = streak
  if (bestStreak === 0 && sortedDays.length > 0) bestStreak = 1

  // ── Días entrenados por mes ────────────────────────────────────────────────
  const monthMap = {}
  sortedDays.forEach(d => {
    const key = d.substring(0, 7)
    monthMap[key] = (monthMap[key] || 0) + 1
  })
  const months = Object.entries(monthMap).sort().slice(-6)
  const maxDays = Math.max(...months.map(([,v]) => v), 1)

  // ── Ejercicios con más progreso ────────────────────────────────────────────
  const exProgress = exercises.map(ex => {
    const exLogs = logs[String(ex.id)] || []
    if (exLogs.length < 2) return null
    const first = (parseFloat(exLogs[0].peso) || 0) + (parseFloat(exLogs[0].secs) || 0) * 0.3
    const last  = (parseFloat(exLogs[exLogs.length-1].peso) || 0) + (parseFloat(exLogs[exLogs.length-1].secs) || 0) * 0.3
    const diff  = last - first
    return { name: ex.name, cat: ex.cat, diff, last, cond: exLogs[exLogs.length-1].cond }
  }).filter(Boolean).sort((a, b) => b.diff - a.diff)

  const topUp   = exProgress.filter(e => e.diff > 0).slice(0, 3)
  const topDown = exProgress.filter(e => e.diff < 0).slice(0, 3)

  // ── Stats por categoría ───────────────────────────────────────────────────
  const catStats = categories.map(cat => {
    const exs   = exercises.filter(e => e.cat === cat)
    const total = exs.length
    let sube = 0, baja = 0, mantiene = 0, sinDatos = 0
    exs.forEach(ex => {
      const el = logs[String(ex.id)] || []
      if (!el.length) { sinDatos++; return }
      const c = el[el.length-1].cond
      if (c === 'SUBE') sube++
      else if (c === 'BAJA') baja++
      else mantiene++
    })
    return { cat, total, sube, baja, mantiene, sinDatos }
  }).filter(c => c.total > 0)

  // ── Totales generales ──────────────────────────────────────────────────────
  const totalEntrenamientos = sortedDays.length
  const totalEjercicios     = exercises.length
  const totalRegistros      = exercises.reduce((acc, ex) => acc + (logs[String(ex.id)]?.length || 0), 0)
  const totalSube           = exercises.filter(ex => {
    const el = logs[String(ex.id)] || []
    return el.length && el[el.length-1].cond === 'SUBE'
  }).length

  // ── Peso corporal ──────────────────────────────────────────────────────────
  const pesoInicial = bodyWeights[0]?.peso
  const pesoActual  = bodyWeights[bodyWeights.length-1]?.peso
  const pesoDiff    = pesoInicial && pesoActual ? (pesoActual - pesoInicial).toFixed(1) : null

  return (
    <div className="profile-screen">
      {/* Header */}
      <div className="sticky top-0 z-[290] bg-[var(--bg)] border-b border-[var(--border-color)] px-4 py-3 flex items-center gap-3">
        <button className="text-[var(--muted)] hover:text-[var(--text)] text-xl w-8" onClick={onClose}>←</button>
        <div>
          <h1 className="font-bebas text-xl tracking-widest text-accent leading-none">ESTADÍSTICAS</h1>
          <p className="text-xs text-[var(--muted)]">Tu progreso general</p>
        </div>
      </div>

      <div className="p-6 max-w-[500px] mx-auto flex flex-col gap-6">

        {/* Resumen mensual */}
        <div className="bg-[var(--surface)] border border-[var(--border-color)] rounded-2xl p-5 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-bebas text-2xl text-accent tracking-wider leading-none">Resumen de {MONTHS[month]}</div>
              <div className="text-xs text-[var(--muted)]">{year}</div>
            </div>
            <div className="font-bebas text-4xl text-accent">{daysThisMonth}<span className="text-lg text-[var(--muted)]"> días</span></div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: 'Registros', value: monthLogs,     color: 'text-[var(--text)]' },
              { label: '⬆ Sube',   value: monthSube,     color: 'text-[var(--up)]'   },
              { label: '⬇ Baja',   value: monthBaja,     color: 'text-[var(--down)]' },
            ].map(({ label, value, color }) => (
              <div key={label} className="bg-[var(--surface2)] rounded-xl p-2 text-center">
                <div className={`font-bebas text-2xl ${color}`}>{value}</div>
                <div className="text-[0.65rem] text-[var(--muted)]">{label}</div>
              </div>
            ))}
          </div>
          {bestEx && (
            <div className="flex items-center justify-between text-xs border-t border-[var(--border-color)] pt-2">
              <span className="text-[var(--muted)]">🏆 Mejor progreso</span>
              <span className="text-accent font-semibold">{bestEx}</span>
            </div>
          )}
          <div className="bg-[var(--surface2)] rounded-xl p-3 text-center text-xs italic text-accent">"{motivation}"</div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'Entrenamientos', value: totalEntrenamientos, icon: '📅', color: 'text-accent' },
            { label: 'Ejercicios',     value: totalEjercicios,     icon: '🏋️', color: 'text-accent' },
            { label: 'Registros',      value: totalRegistros,      icon: '📝', color: 'text-[var(--up)]' },
            { label: 'En progreso',    value: totalSube,           icon: '⬆',  color: 'text-[var(--up)]' },
          ].map(({ label, value, icon, color }) => (
            <div key={label} className="bg-[var(--surface)] border border-[var(--border-color)] rounded-xl p-4 text-center">
              <div className="text-2xl mb-1">{icon}</div>
              <div className={`font-bebas text-3xl ${color}`}>{value}</div>
              <div className="text-xs text-[var(--muted)]">{label}</div>
            </div>
          ))}
        </div>

        {/* Racha */}
        <div className="bg-[var(--surface)] border border-[var(--border-color)] rounded-xl p-4">
          <div className="section-title mb-3">🔥 Racha de entrenamientos</div>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="font-bebas text-5xl text-accent">{currentStreak}</div>
              <div className="text-xs text-[var(--muted)]">días actuales</div>
            </div>
            <div className="text-center">
              <div className="font-bebas text-5xl text-[var(--hold)]">{bestStreak}</div>
              <div className="text-xs text-[var(--muted)]">mejor racha</div>
            </div>
          </div>
        </div>

        {/* Días por mes */}
        {months.length > 0 && (
          <div className="bg-[var(--surface)] border border-[var(--border-color)] rounded-xl p-4">
            <div className="section-title mb-3">📅 Días entrenados por mes</div>
            <div className="flex items-end gap-2 h-24">
              {months.map(([key, val]) => {
                const [y, m] = key.split('-')
                const label = new Date(parseInt(y), parseInt(m)-1).toLocaleDateString('es-ES', { month: 'short' })
                const h = Math.max((val / maxDays) * 80, 8)
                return (
                  <div key={key} className="flex-1 flex flex-col items-center gap-1">
                    <div className="text-xs text-accent font-semibold">{val}</div>
                    <div className="w-full rounded-t-md bg-accent transition-all" style={{ height: `${h}px`, opacity: 0.7 + (val/maxDays)*0.3 }} />
                    <div className="text-[0.6rem] text-[var(--muted)] capitalize">{label}</div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Más progreso */}
        {topUp.length > 0 && (
          <div className="bg-[var(--surface)] border border-[var(--border-color)] rounded-xl p-4">
            <div className="section-title mb-3">⬆ Mayor progreso</div>
            <div className="flex flex-col gap-2">
              {topUp.map((ex, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-semibold">{ex.name}</div>
                    <div className="text-xs text-[var(--muted)]">{ex.cat}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-[var(--up)]">+{ex.diff.toFixed(1)} kg</div>
                    <div className="text-xs text-[var(--muted)]">actual: {ex.last} kg</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Bajaron */}
        {topDown.length > 0 && (
          <div className="bg-[var(--surface)] border border-[var(--border-color)] rounded-xl p-4">
            <div className="section-title mb-3">⬇ Necesitan atención</div>
            <div className="flex flex-col gap-2">
              {topDown.map((ex, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-semibold">{ex.name}</div>
                    <div className="text-xs text-[var(--muted)]">{ex.cat}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-[var(--down)]">{ex.diff.toFixed(1)} kg</div>
                    <div className="text-xs text-[var(--muted)]">actual: {ex.last} kg</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Por categoría */}
        {catStats.length > 0 && (
          <div className="bg-[var(--surface)] border border-[var(--border-color)] rounded-xl p-4">
            <div className="section-title mb-3">📊 Por categoría</div>
            <div className="flex flex-col gap-3">
              {catStats.map(c => {
                const withData = c.sube + c.baja + c.mantiene
                return (
                  <div key={c.cat}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-semibold">{c.cat}</span>
                      <span className="text-[var(--muted)]">{c.total} ejercicios</span>
                    </div>
                    {withData > 0 && (
                      <div className="flex h-2 rounded-full overflow-hidden gap-px">
                        {c.sube     > 0 && <div style={{ flex: c.sube,     background: 'var(--up)'   }} />}
                        {c.mantiene > 0 && <div style={{ flex: c.mantiene, background: 'var(--hold)' }} />}
                        {c.baja     > 0 && <div style={{ flex: c.baja,     background: 'var(--down)' }} />}
                      </div>
                    )}
                    <div className="flex gap-3 text-[0.65rem] text-[var(--muted)] mt-1">
                      {c.sube     > 0 && <span className="text-[var(--up)]">↑{c.sube} sube</span>}
                      {c.mantiene > 0 && <span className="text-[var(--hold)]">→{c.mantiene} mantiene</span>}
                      {c.baja     > 0 && <span className="text-[var(--down)]">↓{c.baja} baja</span>}
                      {c.sinDatos > 0 && <span>·{c.sinDatos} sin datos</span>}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Peso corporal */}
        {pesoDiff !== null && (
          <div className="bg-[var(--surface)] border border-[var(--border-color)] rounded-xl p-4">
            <div className="section-title mb-3">⚖️ Evolución de peso corporal</div>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div>
                <div className="font-bebas text-2xl text-[var(--muted)]">{pesoInicial} kg</div>
                <div className="text-xs text-[var(--muted)]">inicio</div>
              </div>
              <div>
                <div className={`font-bebas text-2xl ${parseFloat(pesoDiff) < 0 ? 'text-[var(--up)]' : parseFloat(pesoDiff) > 0 ? 'text-[var(--down)]' : 'text-[var(--hold)]'}`}>
                  {parseFloat(pesoDiff) > 0 ? '+' : ''}{pesoDiff} kg
                </div>
                <div className="text-xs text-[var(--muted)]">cambio</div>
              </div>
              <div>
                <div className="font-bebas text-2xl text-accent">{pesoActual} kg</div>
                <div className="text-xs text-[var(--muted)]">actual</div>
              </div>
            </div>
          </div>
        )}

        {/* Sin datos */}
        {totalEntrenamientos === 0 && totalEjercicios === 0 && (
          <div className="text-center py-12 text-[var(--muted)]">
            <div className="text-5xl mb-4">📊</div>
            <p className="text-sm">Aún no hay datos suficientes.<br/>Registra entrenamientos y ejercicios para ver tus estadísticas.</p>
          </div>
        )}

      </div>
    </div>
  )
}
