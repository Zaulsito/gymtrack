import { useApp } from '../../context/AppContext'
import { today } from '../../lib/utils'

const MONTHS = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

export function SummaryModal({ onClose }) {
  const { state, myLogs } = useApp()
  const now     = new Date()
  const year    = now.getFullYear()
  const month   = now.getMonth()
  const prefix  = `${year}-${String(month+1).padStart(2,'0')}`
  const td      = state?.trainedDays || {}
  const logs    = myLogs()

  const trainedDays = Object.keys(td).filter(k => k.startsWith(prefix)).length
  let totalLogs = 0, sube = 0, baja = 0, mantiene = 0, bestEx = null, bestDelta = -Infinity

  ;(state?.exercises || []).forEach(ex => {
    const exLogs = (logs[String(ex.id)] || []).filter(l => l.fecha?.startsWith(prefix))
    totalLogs += exLogs.length
    exLogs.forEach(l => {
      if (l.cond === 'SUBE') sube++
      else if (l.cond === 'BAJA') baja++
      else mantiene++
    })
    const all = logs[String(ex.id)] || []
    if (all.length >= 2) {
      const delta = (parseFloat(all[all.length-1].peso) || 0) - (parseFloat(all[0].peso) || 0)
      if (delta > bestDelta) { bestDelta = delta; bestEx = ex.name }
    }
  })

  const notes = Object.entries(td).filter(([k,v]) => k.startsWith(prefix) && v.note).length
  const motivation = trainedDays >= 15 ? '¡Bestia total! Más de la mitad del mes entrenando 🔥'
    : trainedDays >= 8 ? 'Buen ritmo, sigue construyendo el hábito 💪'
    : 'Cada día cuenta — el próximo mes será mejor 🌟'

  const stats = [
    { label: '📅 Días entrenados',        value: trainedDays, color: 'text-accent' },
    { label: '📝 Registros guardados',     value: totalLogs },
    { label: '⬆ Ejercicios que subieron', value: sube,      color: 'text-[var(--up)]' },
    { label: '⬇ Ejercicios que bajaron',  value: baja,      color: 'text-[var(--down)]' },
    { label: '⬌ Se mantuvieron',          value: mantiene,  color: 'text-[var(--hold)]' },
    { label: '📓 Días con nota',          value: notes },
  ]

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box max-h-[85vh] overflow-y-auto">
        <h2 className="font-bebas text-[1.6rem] tracking-wider text-accent mb-1">📊 Resumen Mensual</h2>
        <p className="text-xs text-[var(--muted)] mb-4">{MONTHS[month]} {year}</p>
        {stats.map(({ label, value, color }) => (
          <div key={label} className="flex justify-between items-center py-2.5 border-b border-[var(--border-color)]">
            <span className="text-sm text-[var(--muted)]">{label}</span>
            <span className={`font-semibold ${color || 'text-accent'}`}>{value}</span>
          </div>
        ))}
        {bestEx && (
          <div className="flex justify-between items-center py-2.5 border-b border-[var(--border-color)]">
            <span className="text-sm text-[var(--muted)]">🏆 Mejor progreso</span>
            <span className="font-semibold text-accent text-xs text-right max-w-[60%]">{bestEx}</span>
          </div>
        )}
        <div className="mt-4 p-3 bg-[var(--surface2)] rounded-xl border border-[var(--border-color)] text-center">
          <div className="text-xs text-[var(--muted)] mb-1">Motivación del mes</div>
          <div className="text-accent italic text-sm">"{motivation}"</div>
        </div>
        <button className="btn-accent w-full py-2.5 mt-4" onClick={onClose}>Cerrar</button>
      </div>
    </div>
  )
}

export function PrivacyModal({ onClose }) {
  const sections = [
    { title: '1. Datos que recopilamos', text: 'Recopilamos los datos que tú mismo nos proporcionas al registrarte: nombre, apellidos, nombre de usuario, correo electrónico, teléfono, peso, estatura, foto de perfil, objetivo de entrenamiento y nivel de experiencia. También guardamos los registros de ejercicios que ingresas (pesos, repeticiones, series).' },
    { title: '2. Cómo usamos tus datos', text: 'Tus datos se usan exclusivamente para ofrecerte el servicio de seguimiento de entrenamiento. No vendemos, compartimos ni cedemos tu información personal a terceros con fines comerciales.' },
    { title: '3. Almacenamiento y seguridad', text: 'Toda tu información se almacena de forma segura en Google Firebase, que cuenta con cifrado en tránsito y en reposo. Las contraseñas nunca se almacenan en texto plano.' },
    { title: '4. Foto de perfil', text: 'La foto de perfil que subas se almacena como dato en tu cuenta personal. Solo tú y tus partners vinculados pueden verla dentro de la aplicación.' },
    { title: '5. Sistema de partners', text: 'Al vincularte con un partner, este podrá ver tu lista de ejercicios, pesos registrados y progreso. No verá tu correo, teléfono ni contraseña.' },
    { title: '6. Eliminación de datos', text: 'Puedes solicitar la eliminación de tu cuenta desde Mi Perfil → Zona peligrosa. La eliminación se ejecuta tras 7 días.' },
    { title: '7. Menores de edad', text: 'GymTrack no está dirigido a menores de 13 años. Si eres menor, obtén el consentimiento de un adulto.' },
    { title: '8. Contacto', text: 'Si tienes preguntas sobre esta política, puedes contactarnos a través de la aplicación.' },
  ]

  return (
    <div className="modal-overlay" style={{ zIndex: 600 }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box max-h-[85vh] overflow-y-auto max-w-[500px]">
        <h2 className="font-bebas text-[1.6rem] tracking-wider text-accent mb-1">🔐 Política de Privacidad</h2>
        <p className="text-xs text-[var(--muted)] mb-4">Última actualización: Marzo 2026</p>
        <div className="text-sm leading-relaxed text-[var(--muted)] flex flex-col gap-3">
          {sections.map(({ title, text }) => (
            <div key={title}>
              <p className="text-[var(--text)] font-semibold mb-1">{title}</p>
              <p>{text}</p>
            </div>
          ))}
        </div>
        <button className="btn-accent w-full py-2.5 mt-4" onClick={onClose}>Entendido</button>
      </div>
    </div>
  )
}

export function WelcomeModal({ firstName, onClose }) {
  return (
    <div className="modal-overlay">
      <div className="modal-box text-center max-w-[360px]">
        <div className="text-5xl mb-3">🏆</div>
        <h2 className="font-bebas text-[1.8rem] text-accent mb-2">¡Bienvenido!</h2>
        <p className="text-[var(--muted)] text-sm leading-relaxed mb-5">
          ¡Hola {firstName}! 🎉 Tu cuenta está lista. Cada gran físico empezó con el primer registro. Hoy es ese día — ¡tú puedes! 💪
        </p>
        <button className="btn-login" onClick={onClose}>¡VAMOS! 💪</button>
      </div>
    </div>
  )
}
