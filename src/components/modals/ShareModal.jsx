import { useEffect, useRef, useState } from 'react'
import { useApp } from '../../context/AppContext'

const MONTHS = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

const THEME_COLORS = {
  default: { accent: '#c8ff00', bg: '#0a0a0f', surface: '#13131a', text: '#e8e8f0', muted: '#6b6b8a' },
  red:     { accent: '#ff2d2d', bg: '#0f0a0a', surface: '#1a1010', text: '#e8e8f0', muted: '#6b6b8a' },
  pink:    { accent: '#ff85c2', bg: '#0f0a0d', surface: '#1a1018', text: '#e8e8f0', muted: '#6b6b8a' },
  blue:    { accent: '#4d8eff', bg: '#090b14', surface: '#0f1220', text: '#e8e8f0', muted: '#6b6b8a' },
  cyan:    { accent: '#00e5ff', bg: '#080f12', surface: '#0d181e', text: '#e8e8f0', muted: '#6b6b8a' },
  light:   { accent: '#2563eb', bg: '#f0f2f5', surface: '#ffffff', text: '#1a1a2e', muted: '#6b7280' },
}

export default function ShareModal({ onClose }) {
  const { state, myLogs } = useApp()
  const canvasRef  = useRef(null)
  const [imgUrl,   setImgUrl]   = useState(null)
  const [sharing,  setSharing]  = useState(false)
  const [canShare, setCanShare] = useState(false)

  const theme  = localStorage.getItem('gymtrack_theme') || 'default'
  const colors = THEME_COLORS[theme] || THEME_COLORS.default
  const logs   = myLogs()

  const now    = new Date()
  const month  = now.getMonth()
  const year   = now.getFullYear()
  const prefix = `${year}-${String(month+1).padStart(2,'0')}`

  const exercises   = state?.exercises || []
  const trainedDays = state?.trainedDays || {}
  const daysCount   = Object.keys(trainedDays).filter(k => k.startsWith(prefix)).length

  let sube = 0, baja = 0, mantiene = 0, bestEx = null, bestDelta = -Infinity
  exercises.forEach(ex => {
    const el = logs[String(ex.id)] || []
    el.filter(l => l.fecha?.startsWith(prefix)).forEach(l => {
      if (l.cond === 'SUBE') sube++
      else if (l.cond === 'BAJA') baja++
      else mantiene++
    })
    if (el.length >= 2) {
      const delta = (parseFloat(el[el.length-1].peso) || 0) - (parseFloat(el[0].peso) || 0)
      if (delta > bestDelta) { bestDelta = delta; bestEx = ex.name }
    }
  })

  // Racha
  let streak = 0
  let checkDate = new Date()
  while (true) {
    const ds = checkDate.toISOString().split('T')[0]
    if (trainedDays[ds]) { streak++; checkDate.setDate(checkDate.getDate() - 1) }
    else break
  }

  const displayName = state?.displayName || 'GymTracker'
  const username    = state?.username ? `@${state.username}` : ''
  const goal        = state?.goal || ''

  useEffect(() => {
    setCanShare(!!navigator.share)
    drawCanvas()
  }, [])

  function drawCanvas() {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const W = 1080, H = 1080
    canvas.width  = W
    canvas.height = H

    // BG
    ctx.fillStyle = colors.bg
    ctx.fillRect(0, 0, W, H)

    // Fondo gradiente sutil
    const grad = ctx.createRadialGradient(W*0.8, H*0.2, 0, W*0.8, H*0.2, W*0.7)
    grad.addColorStop(0, colors.accent + '18')
    grad.addColorStop(1, 'transparent')
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, W, H)

    // Línea superior accent
    ctx.fillStyle = colors.accent
    ctx.fillRect(0, 0, W, 8)

    // Logo/Brand
    ctx.font = 'bold 32px Arial'
    ctx.fillStyle = colors.muted
    ctx.letterSpacing = '8px'
    ctx.fillText('GYMTRACK', 60, 80)

    // Línea decorativa
    ctx.strokeStyle = colors.surface
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(60, 100)
    ctx.lineTo(W - 60, 100)
    ctx.stroke()

    // Nombre usuario
    ctx.font = 'bold 72px Arial'
    ctx.fillStyle = colors.text
    ctx.fillText(displayName, 60, 200)

    if (username) {
      ctx.font = '32px Arial'
      ctx.fillStyle = colors.accent
      ctx.fillText(username, 60, 250)
    }

    if (goal) {
      ctx.font = '28px Arial'
      ctx.fillStyle = colors.muted
      ctx.fillText(`Objetivo: ${goal}`, 60, 295)
    }

    // Mes
    ctx.font = 'bold 48px Arial'
    ctx.fillStyle = colors.accent
    ctx.fillText(`${MONTHS[month]} ${year}`, 60, 380)

    // Tarjetas de stats
    const cards = [
      { label: 'DÍAS\nENTRENADOS', value: String(daysCount), color: colors.accent },
      { label: 'EJERCICIOS\nSUBIERON',  value: String(sube),      color: '#39ff14'   },
      { label: 'RACHA\nACTUAL',         value: `${streak}d`,      color: colors.accent },
    ]

    cards.forEach((card, i) => {
      const x = 60 + i * 330
      const y = 430

      // Card bg
      ctx.fillStyle = colors.surface
      roundRect(ctx, x, y, 300, 200, 20)
      ctx.fill()

      // Border
      ctx.strokeStyle = colors.accent + '40'
      ctx.lineWidth = 2
      roundRect(ctx, x, y, 300, 200, 20)
      ctx.stroke()

      // Value
      ctx.font = 'bold 80px Arial'
      ctx.fillStyle = card.color
      ctx.textAlign = 'center'
      ctx.fillText(card.value, x + 150, y + 110)

      // Label
      ctx.font = '22px Arial'
      ctx.fillStyle = colors.muted
      const lines = card.label.split('\n')
      lines.forEach((line, li) => ctx.fillText(line, x + 150, y + 148 + li * 26))

      ctx.textAlign = 'left'
    })

    // Mejor ejercicio
    if (bestEx) {
      ctx.fillStyle = colors.surface
      roundRect(ctx, 60, 670, W - 120, 100, 16)
      ctx.fill()

      ctx.font = '26px Arial'
      ctx.fillStyle = colors.muted
      ctx.fillText('🏆  Mejor progreso del mes', 90, 710)

      ctx.font = 'bold 34px Arial'
      ctx.fillStyle = colors.text
      const truncated = bestEx.length > 35 ? bestEx.substring(0, 35) + '...' : bestEx
      ctx.fillText(truncated, 90, 752)
    }

    // Barra de progreso SUBE/MANTIENE/BAJA
    const total = sube + mantiene + baja
    if (total > 0) {
      const barX = 60, barY = 810, barW = W - 120, barH = 32
      ctx.fillStyle = colors.surface
      roundRect(ctx, barX, barY, barW, barH, barH/2)
      ctx.fill()

      let x = barX
      if (sube > 0) {
        ctx.fillStyle = '#39ff14'
        const w = (sube / total) * barW
        roundRect(ctx, x, barY, w, barH, barH/2)
        ctx.fill()
        x += w
      }
      if (mantiene > 0) {
        ctx.fillStyle = '#ffd700'
        const w = (mantiene / total) * barW
        ctx.fillRect(x, barY, w, barH)
        x += w
      }
      if (baja > 0) {
        ctx.fillStyle = '#ff3366'
        const w = (baja / total) * barW
        roundRect(ctx, x, barY, w, barH, barH/2)
        ctx.fill()
      }

      // Labels barra
      ctx.font = '24px Arial'
      ctx.fillStyle = '#39ff14'; ctx.fillText(`↑ ${sube} sube`, barX, barY + 65)
      ctx.fillStyle = '#ffd700'; ctx.fillText(`→ ${mantiene} mantiene`, barX + 220, barY + 65)
      ctx.fillStyle = '#ff3366'; ctx.fillText(`↓ ${baja} baja`, barX + 530, barY + 65)
    }

    // Footer
    ctx.fillStyle = colors.muted
    ctx.font = '24px Arial'
    ctx.textAlign = 'center'
    ctx.fillText('gymtrackv1.netlify.app', W/2, H - 40)
    ctx.textAlign = 'left'

    // Línea inferior
    ctx.fillStyle = colors.accent
    ctx.fillRect(0, H - 8, W, 8)

    setImgUrl(canvas.toDataURL('image/png'))
  }

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath()
    ctx.moveTo(x + r, y)
    ctx.lineTo(x + w - r, y)
    ctx.arcTo(x + w, y, x + w, y + r, r)
    ctx.lineTo(x + w, y + h - r)
    ctx.arcTo(x + w, y + h, x + w - r, y + h, r)
    ctx.lineTo(x + r, y + h)
    ctx.arcTo(x, y + h, x, y + h - r, r)
    ctx.lineTo(x, y + r)
    ctx.arcTo(x, y, x + r, y, r)
    ctx.closePath()
  }

  async function handleShare() {
    if (!imgUrl) return
    setSharing(true)
    try {
      const blob = await (await fetch(imgUrl)).blob()
      const file = new File([blob], 'gymtrack-progreso.png', { type: 'image/png' })
      if (navigator.share && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: 'Mi progreso en GymTrack',
          text: `${MONTHS[month]} ${year} — ${daysCount} días entrenados 💪`,
          files: [file],
        })
      } else {
        handleDownload()
      }
    } catch {}
    setSharing(false)
  }

  function handleDownload() {
    const a = document.createElement('a')
    a.href = imgUrl
    a.download = `gymtrack-${MONTHS[month].toLowerCase()}-${year}.png`
    a.click()
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="font-bebas text-2xl text-accent tracking-wider">📤 Compartir progreso</h2>
          <button className="text-[var(--muted)] hover:text-[var(--text)]" onClick={onClose}>✕</button>
        </div>

        {/* Canvas oculto */}
        <canvas ref={canvasRef} className="hidden" />

        {/* Preview */}
        {imgUrl && (
          <div className="rounded-xl overflow-hidden border border-[var(--border-color)]">
            <img src={imgUrl} alt="Tarjeta de progreso" className="w-full" />
          </div>
        )}

        {/* Botones */}
        <div className="flex gap-2">
          {canShare && (
            <button className="btn-accent flex-1 py-3 text-sm" onClick={handleShare} disabled={sharing}>
              {sharing ? 'Compartiendo...' : '📤 Compartir'}
            </button>
          )}
          <button className={`flex-1 py-3 text-sm ${canShare ? 'btn-outline' : 'btn-accent'}`} onClick={handleDownload}>
            ⬇ Descargar PNG
          </button>
        </div>
        <p className="text-xs text-[var(--muted)] text-center">
          La tarjeta se genera con los datos de {MONTHS[month]} {year}
        </p>
      </div>
    </div>
  )
}
