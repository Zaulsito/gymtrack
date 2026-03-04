import { formatDate } from '../../lib/utils'

export default function ExerciseChart({ logs }) {
  const points = logs.filter(l => parseFloat(l.peso) > 0)
  if (points.length < 2) return null

  const W = 300, H = 80, pad = 20, padL = 32, padR = 10
  const vals = points.map(l => parseFloat(l.peso))
  const minV = Math.min(...vals)
  const maxV = Math.max(...vals)
  const range = maxV - minV || 1

  const xs = points.map((_, i) => padL + (i / (points.length - 1)) * (W - padL - padR))
  const ys = vals.map(v => pad + (1 - (v - minV) / range) * (H - pad * 1.5))

  let area = `M${xs[0]},${H - 10}`
  xs.forEach((x, i) => { area += ` L${x},${ys[i]}` })
  area += ` L${xs[xs.length-1]},${H - 10} Z`

  let line = `M${xs[0]},${ys[0]}`
  for (let i = 1; i < xs.length; i++) {
    const cpx = (xs[i-1] + xs[i]) / 2
    line += ` C${cpx},${ys[i-1]} ${cpx},${ys[i]} ${xs[i]},${ys[i]}`
  }

  const trend      = vals[vals.length-1] > vals[0] ? '↑' : vals[vals.length-1] < vals[0] ? '↓' : '→'
  const trendColor = vals[vals.length-1] > vals[0] ? 'var(--up)' : vals[vals.length-1] < vals[0] ? 'var(--down)' : 'var(--hold)'

  return (
    <div className="mt-3 bg-[var(--surface2)] rounded-xl p-3 border border-[var(--border-color)]">
      <div className="text-[0.72rem] text-[var(--muted)] uppercase tracking-wider mb-2">
        📈 Evolución del peso <span style={{ color: trendColor }}>{trend}</span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} height={H} className="w-full overflow-visible">
        <path d={area} fill="var(--accent)" fillOpacity="0.12" />
        <path d={line} fill="none" stroke="var(--accent)" strokeWidth="2.5" strokeLinecap="round" />
        {[minV, maxV].map((v, i) => (
          <text key={i} className="chart-label" x={padL - 4} y={i === 0 ? H - pad * 1.5 + 4 : pad + 4} textAnchor="end">{v}</text>
        ))}
        {points.map((l, i) => (
          <g key={i}>
            <circle className="chart-dot" cx={xs[i]} cy={ys[i]} r={4} />
            <text className="chart-value" x={xs[i]} y={ys[i] - 8}>{vals[i]}</text>
            <text className="chart-label" x={xs[i]} y={H - 2}>{formatDate(l.fecha).split(' ').slice(0,2).join(' ')}</text>
          </g>
        ))}
      </svg>
    </div>
  )
}
