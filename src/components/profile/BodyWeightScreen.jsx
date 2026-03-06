import { useState } from 'react'
import { useApp } from '../../context/AppContext'

export default function BodyWeightScreen({ onClose }) {
  const { state, updateState, showToast } = useApp()

  const [newPeso, setNewPeso] = useState('')
  const [newFecha, setNewFecha] = useState(() => {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
  })

  const bodyWeights = state?.bodyWeights || []
  const weight      = state?.weight || ''
  const height      = state?.height || ''

  // IMC
  const imc     = (weight && height) ? (parseFloat(weight) / Math.pow(parseFloat(height) / 100, 2)).toFixed(1) : null
  const imcInfo = !imc ? null : parseFloat(imc) < 18.5
    ? { label: 'Bajo peso',  color: 'var(--hold)', pct: 15,  desc: 'Tu peso está por debajo del rango saludable.' }
    : parseFloat(imc) < 25
    ? { label: 'Normal',     color: 'var(--up)',   pct: 40,  desc: '¡Estás en el rango saludable! Sigue así.' }
    : parseFloat(imc) < 30
    ? { label: 'Sobrepeso',  color: '#ff9500',     pct: 65,  desc: 'Tu peso está por encima del rango saludable.' }
    : { label: 'Obesidad',   color: 'var(--down)', pct: 90,  desc: 'Se recomienda consultar con un profesional de salud.' }

  function addWeight() {
    if (!newPeso) { showToast('⚠ Ingresa tu peso', 'warn'); return }
    const entry   = { peso: parseFloat(newPeso), fecha: newFecha }
    const updated = [...bodyWeights, entry].sort((a, b) => a.fecha.localeCompare(b.fecha))
    // Actualizar también el peso del perfil con el último registro
    const lastPeso = updated[updated.length - 1].peso
    updateState(prev => ({ ...prev, bodyWeights: updated, weight: String(lastPeso) }))
    setNewPeso('')
    showToast('✓ Peso registrado y perfil actualizado', 'ok')
  }

  function removeWeight(idx) {
    const updated = bodyWeights.filter((_, i) => i !== idx)
    // Solo actualizar perfil si quedan registros
    if (updated.length > 0) {
      const lastPeso = updated[updated.length - 1].peso
      updateState(prev => ({ ...prev, bodyWeights: updated, weight: String(lastPeso) }))
    } else {
      updateState(prev => ({ ...prev, bodyWeights: updated }))
    }
  }

  // Gráfico
  function renderChart() {
    if (bodyWeights.length < 2) return null
    const W = 300, H = 100, pad = 20, padL = 36, padR = 10
    const vals = bodyWeights.map(l => l.peso)
    const minV = Math.min(...vals), maxV = Math.max(...vals)
    const range = maxV - minV || 1
    const xs = vals.map((_, i) => padL + (i / (vals.length - 1)) * (W - padL - padR))
    const ys = vals.map(v => pad + (1 - (v - minV) / range) * (H - pad * 1.5))

    let line = `M${xs[0]},${ys[0]}`
    for (let i = 1; i < xs.length; i++) {
      const cpx = (xs[i-1] + xs[i]) / 2
      line += ` C${cpx},${ys[i-1]} ${cpx},${ys[i]} ${xs[i]},${ys[i]}`
    }
    let area = `M${xs[0]},${H - 10}`
    xs.forEach((x, i) => { area += ` L${x},${ys[i]}` })
    area += ` L${xs[xs.length-1]},${H - 10} Z`

    const last  = vals[vals.length - 1]
    const first = vals[0]
    const diff  = (last - first).toFixed(1)
    const trend = last < first ? '↓' : last > first ? '↑' : '→'
    const tColor = last < first ? 'var(--up)' : last > first ? 'var(--down)' : 'var(--hold)'

    return (
      <div className="bg-[var(--surface2)] rounded-xl p-4 border border-[var(--border-color)]">
        <div className="flex items-center justify-between mb-3">
          <div className="text-[0.72rem] text-[var(--muted)] uppercase tracking-wider">📉 Evolución</div>
          <div className="text-sm font-semibold" style={{ color: tColor }}>
            {trend} {Math.abs(diff)} kg desde el inicio
          </div>
        </div>
        <svg viewBox={`0 0 ${W} ${H}`} height={H} className="w-full overflow-visible">
          <path d={area} fill="var(--accent)" fillOpacity="0.1" />
          <path d={line} fill="none" stroke="var(--accent)" strokeWidth="2.5" strokeLinecap="round" />
          {[minV, maxV].map((v, i) => (
            <text key={i} className="chart-label" x={padL - 4} y={i === 0 ? H - pad * 1.5 + 4 : pad + 4} textAnchor="end">{v}</text>
          ))}
          {bodyWeights.map((l, i) => (
            <g key={i}>
              <circle className="chart-dot" cx={xs[i]} cy={ys[i]} r={4} />
              <text className="chart-value" x={xs[i]} y={ys[i] - 8}>{vals[i]}</text>
              <text className="chart-label" x={xs[i]} y={H - 2}>
                {new Date(l.fecha + 'T12:00:00').toLocaleDateString('es-ES', { day:'numeric', month:'short' })}
              </text>
            </g>
          ))}
        </svg>
      </div>
    )
  }

  return (
    <div className="profile-screen">
      {/* Header */}
      <div className="sticky top-0 z-[290] bg-[var(--bg)] border-b border-[var(--border-color)] px-4 py-3 flex items-center gap-3">
        <button className="text-[var(--muted)] hover:text-[var(--text)] text-xl w-8" onClick={onClose}>←</button>
        <div>
          <h1 className="font-bebas text-xl tracking-widest text-accent leading-none">PESO CORPORAL</h1>
          <p className="text-xs text-[var(--muted)]">IMC y seguimiento de peso</p>
        </div>
      </div>

      <div className="p-6 max-w-[500px] mx-auto flex flex-col gap-6">

        {/* IMC Card */}
        {imcInfo ? (
          <div className="bg-[var(--surface)] border border-[var(--border-color)] rounded-2xl p-5 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs text-[var(--muted)] uppercase tracking-wider mb-1">Tu IMC actual</div>
                <div className="font-bebas text-5xl leading-none" style={{ color: imcInfo.color }}>{imc}</div>
                <div className="font-semibold text-base mt-1" style={{ color: imcInfo.color }}>{imcInfo.label}</div>
              </div>
              <div className="text-right text-sm text-[var(--muted)]">
                <div>{weight} kg</div>
                <div>{height} cm</div>
                <div className="mt-2 text-xs">Ideal: 18.5–24.9</div>
              </div>
            </div>
            {/* Barra */}
            <div className="relative h-4 rounded-full overflow-hidden" style={{ background: 'linear-gradient(to right, var(--hold) 0%, var(--up) 30%, #ff9500 65%, var(--down) 100%)' }}>
              <div className="absolute top-0.5 w-3 h-3 rounded-full bg-white border-2 border-[var(--bg)] shadow" style={{ left: `calc(${Math.min(imcInfo.pct, 95)}% - 6px)` }} />
            </div>
            <div className="flex justify-between text-[0.65rem] text-[var(--muted)]">
              <span>Bajo peso<br/>&lt;18.5</span>
              <span className="text-center">Normal<br/>18.5–24.9</span>
              <span className="text-center">Sobrepeso<br/>25–29.9</span>
              <span className="text-right">Obesidad<br/>≥30</span>
            </div>
            <p className="text-xs text-[var(--muted)] border-t border-[var(--border-color)] pt-3">{imcInfo.desc}</p>
            <p className="text-xs text-[var(--muted)] italic">⚠ El IMC no distingue entre grasa y músculo. Personas con alta masa muscular pueden tener un IMC elevado sin que indique riesgo para la salud.</p>
          </div>
        ) : (
          <div className="bg-[var(--surface)] border border-[var(--border-color)] rounded-2xl p-5 text-center text-[var(--muted)] text-sm">
            ⚠ Completa tu <strong>peso y altura</strong> en el perfil para ver tu IMC.
          </div>
        )}

        {/* Registrar peso */}
        <div className="flex flex-col gap-3">
          <div className="section-title">Registrar peso corporal</div>
          <div className="flex gap-2">
            <input
              className="input-field"
              type="number"
              placeholder="kg"
              value={newPeso}
              onChange={e => {
                const val = e.target.value.replace(/[^0-9]/g, '').slice(0, 3)
                if (val === '' || parseInt(val) <= 300) setNewPeso(val)
              }}
              onKeyDown={e => e.key === 'Enter' && addWeight()}
            />
            <input className="input-field" type="date" value={newFecha} onChange={e => setNewFecha(e.target.value)} />
            <button className="btn-accent px-4 text-sm whitespace-nowrap" onClick={addWeight}>+ Add</button>
          </div>
        </div>

        {/* Gráfico */}
        {renderChart()}

        {/* Historial */}
        {bodyWeights.length > 0 && (
          <div className="flex flex-col gap-2">
            <div className="section-title">Historial ({bodyWeights.length} registros)</div>
            {[...bodyWeights].reverse().map((w, i) => {
              const realIdx = bodyWeights.length - 1 - i
              const prev    = bodyWeights[realIdx - 1]
              const diff    = prev ? (w.peso - prev.peso).toFixed(1) : null
              const diffColor = diff === null ? '' : parseFloat(diff) < 0 ? 'var(--up)' : parseFloat(diff) > 0 ? 'var(--down)' : 'var(--hold)'
              return (
                <div key={i} className="flex items-center justify-between bg-[var(--surface2)] border border-[var(--border-color)] rounded-xl px-4 py-3">
                  <div>
                    <span className="font-bebas text-2xl text-accent">{w.peso}</span>
                    <span className="text-xs text-[var(--muted)] ml-1">kg</span>
                    {diff !== null && (
                      <span className="ml-2 text-xs font-semibold" style={{ color: diffColor }}>
                        {parseFloat(diff) > 0 ? '+' : ''}{diff} kg
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-[var(--muted)]">
                      {new Date(w.fecha + 'T12:00:00').toLocaleDateString('es-ES', { day:'numeric', month:'short', year:'numeric' })}
                    </span>
                    <button className="text-[var(--down)] text-sm hover:opacity-70" onClick={() => removeWeight(realIdx)}>✕</button>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {bodyWeights.length === 0 && (
          <div className="text-center py-8 text-[var(--muted)]">
            <div className="text-4xl mb-3">⚖️</div>
            <p className="text-sm">Aún no tienes registros.<br/>Agrega tu primer peso arriba.</p>
          </div>
        )}

      </div>
    </div>
  )
}
