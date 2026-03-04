import { useState } from 'react'
import { useApp } from '../../context/AppContext'
import { today } from '../../lib/utils'

const MONTHS = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
const DAYS   = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb']

export default function CalendarScreen({ onClose }) {
  const { state, updateState, showToast } = useApp()
  const now = new Date()
  const [year,  setYear]  = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth())
  const [selectedDate, setSelectedDate] = useState(null)
  const [noteText, setNoteText] = useState('')

  const td        = state?.trainedDays || {}
  const todayStr  = today()
  const firstDay  = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const monthPrefix = `${year}-${String(month+1).padStart(2,'0')}`
  const trainedCount = Object.keys(td).filter(k => k.startsWith(monthPrefix)).length

  function prevMonth() { if (month === 0) { setMonth(11); setYear(y => y-1) } else setMonth(m => m-1) }
  function nextMonth() { if (month === 11) { setMonth(0);  setYear(y => y+1) } else setMonth(m => m+1) }

  function markToday() {
    if (!td[todayStr]) {
      updateState(prev => ({ ...prev, trainedDays: { ...prev.trainedDays, [todayStr]: { note: '' } } }))
      showToast('✓ Día marcado como entrenado 💪', 'ok')
    } else {
      showToast('Ya marcaste hoy como entrenado', '')
    }
  }

  function clickDay(dateStr) {
    setSelectedDate(dateStr)
    setNoteText(td[dateStr]?.note || '')
  }

  function saveNote() {
    updateState(prev => {
      const trainedDays = { ...prev.trainedDays }
      if (!trainedDays[selectedDate]) trainedDays[selectedDate] = { note: '' }
      trainedDays[selectedDate] = { ...trainedDays[selectedDate], note: noteText }
      return { ...prev, trainedDays }
    })
    setSelectedDate(null)
    showToast('✓ Nota guardada', 'ok')
  }

  function unmarkDay() {
    if (!confirm(`¿Anular el día ${selectedDate}?`)) return
    updateState(prev => {
      const trainedDays = { ...prev.trainedDays }
      delete trainedDays[selectedDate]
      return { ...prev, trainedDays }
    })
    setSelectedDate(null)
    showToast('✓ Día anulado', '')
  }

  return (
    <div className="profile-screen">
      <div className="bg-[var(--surface)] border-b border-[var(--border-color)] px-6 py-4 flex items-center gap-4 sticky top-0 z-10">
        <button className="text-accent text-xl" onClick={onClose}>←</button>
        <div className="font-bebas text-[1.4rem] tracking-widest">Calendario</div>
        <button className="btn-accent ml-auto text-sm py-1.5 px-4" onClick={markToday}>✓ Entrené hoy</button>
      </div>

      <div className="p-6 max-w-[500px] mx-auto">
        {/* Month nav */}
        <div className="flex items-center justify-between mb-4">
          <button className="bg-[var(--surface2)] border border-[var(--border-color)] rounded-lg px-3 py-1.5 text-[var(--text)] cursor-pointer" onClick={prevMonth}>‹</button>
          <div className="font-bebas text-xl tracking-widest">{MONTHS[month]} {year}</div>
          <button className="bg-[var(--surface2)] border border-[var(--border-color)] rounded-lg px-3 py-1.5 text-[var(--text)] cursor-pointer" onClick={nextMonth}>›</button>
        </div>

        {/* Day names */}
        <div className="grid grid-cols-7 gap-1 mb-1">
          {DAYS.map(d => <div key={d} className="text-center text-[0.65rem] text-[var(--muted)] uppercase py-1">{d}</div>)}
        </div>

        {/* Days grid */}
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: firstDay }).map((_, i) => <div key={`e${i}`} className="cal-day other-month" />)}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const d       = i + 1
            const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`
            const trained = !!td[dateStr]
            const isToday = dateStr === todayStr
            const hasNote = trained && !!td[dateStr]?.note
            return (
              <div
                key={d}
                className={`cal-day ${trained ? 'trained' : ''} ${isToday ? 'today' : ''} ${hasNote ? 'has-note' : ''}`}
                onClick={() => clickDay(dateStr)}
                title={hasNote ? td[dateStr].note : ''}
              >
                {d}
              </div>
            )
          })}
        </div>

        {/* Legend */}
        <div className="flex gap-4 mt-3 text-xs text-[var(--muted)]">
          <span className="flex items-center gap-1">
            <div className="w-2.5 h-2.5 rounded-sm bg-accent" /> Entrenado
          </span>
          <span>· = tiene nota</span>
        </div>

        {/* Stats */}
        <div className="mt-4 p-3 bg-[var(--surface2)] rounded-xl border border-[var(--border-color)]">
          <div className="text-xs text-[var(--muted)] uppercase tracking-wider mb-1">Este mes</div>
          <div className="font-bebas text-[1.8rem] text-accent">
            {trainedCount} <span className="text-base text-[var(--muted)] font-dm">días entrenados</span>
          </div>
        </div>

        {/* Note panel */}
        {selectedDate && (
          <div className="mt-4">
            <div className="section-title">Nota del día {selectedDate}</div>
            <textarea
              className="input-field resize-y min-h-[80px] mt-2"
              placeholder="¿Algo especial hoy? Lesión, logro, cómo te sentiste..."
              value={noteText}
              onChange={e => setNoteText(e.target.value)}
            />
            <div className="flex gap-2 mt-2 flex-wrap">
              <button className="btn-outline py-1.5 px-3 text-sm" onClick={() => setSelectedDate(null)}>Cancelar</button>
              {td[selectedDate] && (
                <button className="btn-danger py-1.5 px-3 text-sm" onClick={unmarkDay}>🗑 Anular día</button>
              )}
              <button className="btn-accent py-1.5 px-3 text-sm" onClick={saveNote}>Guardar nota</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
