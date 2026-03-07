export const CHANGELOG = [
  {
    version: '1.9.0',
    date: '2026-03-07',
    title: 'Temas claros y arreglos visuales',
    changes: [
      '✨ Agregados temas claros: Gris, Rojo, Rosa, Azul y Celeste',
      '🎨 Selector de paleta rediseñado — más compacto en celular',
      '🔧 Barra de sistema ahora cambia al color del tema correctamente',
      '🔔 Notificaciones push según rutina activa',
      '📸 Foto de referencia por ejercicio',
      '🤖 Técnica correcta generada con IA (Groq)',
    ]
  },
  {
    version: '1.8.0',
    date: '2026-03-06',
    title: 'Rutinas predefinidas',
    changes: [
      '📋 6 rutinas predefinidas: PPL, Full Body, Upper/Lower, Torso/Pierna, Arnold Split, Bro Split',
      '💡 Muestra qué entrenar hoy según rutina activa',
      '🔔 Integración con notificaciones para recordatorio personalizado',
    ]
  },
  {
    version: '1.7.0',
    date: '2026-03-06',
    title: 'Modo claro y compartir progreso',
    changes: [
      '☀ Nuevo tema claro (Azul/Claro)',
      '📤 Compartir tarjeta de progreso mensual como imagen PNG',
      '🎨 Paleta actualizada con etiquetas Oscuro/Claro',
    ]
  },
  {
    version: '1.6.0',
    date: '2026-03-06',
    title: 'Estadísticas globales',
    changes: [
      '📊 Pantalla de estadísticas con resumen mensual integrado',
      '🔥 Racha actual y récord de días consecutivos',
      '📅 Gráfico de días entrenados por mes (últimos 6)',
      '⬆ Top 3 ejercicios con más progreso',
      '📊 Barras de progreso por categoría',
    ]
  },
  {
    version: '1.5.0',
    date: '2026-03-06',
    title: 'Peso corporal e IMC',
    changes: [
      '⚖ Nueva sección de peso corporal con historial y gráfico',
      '🧮 Cálculo automático de IMC con barra visual',
      '📝 Nota aclaratoria sobre masa muscular en el IMC',
      '🔒 Campo peso: solo enteros, máximo 300 kg',
      '🔒 Campo altura: solo enteros, máximo 240 cm',
      '🔄 Al registrar peso corporal, se actualiza automáticamente el perfil',
    ]
  },
  {
    version: '1.4.0',
    date: '2026-03-06',
    title: 'Temporizador de descanso',
    changes: [
      '⏱ Temporizador de descanso en cada ejercicio (1m, 1:30, 2m, 3m)',
      '🎨 Barra de progreso con colores: verde → amarillo → rojo',
      '📳 Vibración y sonido al terminar el descanso',
      '🕐 Formato MM:SS para tiempos mayores a 1 minuto',
    ]
  },
  {
    version: '1.3.0',
    date: '2026-03-06',
    title: 'Campo segundos y mejoras de registros',
    changes: [
      '⏱ Campo "Segundos" en registros (para planchas, isométricos)',
      '📈 Gráfico de evolución de segundos',
      '📊 MAX_LOGS aumentado de 3 a 10 registros por ejercicio',
      '🔍 Búsqueda por número de máquina',
      '📥 Excel actualizado con columna Segundos',
    ]
  },
  {
    version: '1.2.0',
    date: '2026-03-06',
    title: 'Drag & drop de categorías',
    changes: [
      '↕ Categorías reordenables por drag & drop (mouse y touch)',
      '"Todas" fija al inicio, el resto es movible',
      '💾 El orden se guarda automáticamente',
    ]
  },
  {
    version: '1.1.0',
    date: '2026-03-05',
    title: 'Partners y sistema social',
    changes: [
      '🤝 Sistema de partners — ver progreso de compañeros',
      '🔔 Notificaciones de invitación de partner',
      '🔒 Username cambiable cada 14 días',
      '📧 Verificación de email con auto-eliminación',
    ]
  },
  {
    version: '1.0.0',
    date: '2026-03-01',
    title: 'Lanzamiento inicial',
    changes: [
      '🏋 Registro de ejercicios con historial y gráficos',
      '📅 Calendario de entrenamientos con notas',
      '📊 Condición SUBE / BAJA / MANTIENE',
      '📤 Export / Import Excel',
      '🎨 Temas de color personalizables',
      '📱 PWA instalable',
      '🔐 Auth completo con recuperación de contraseña',
      '👤 Modo demo sin registro',
    ]
  },
]

export default function ChangelogScreen({ onClose }) {
  return (
    <div className="profile-screen">
      <div className="sticky top-0 z-[290] bg-[var(--bg)] border-b border-[var(--border-color)] px-4 py-3 flex items-center gap-3">
        <button className="text-[var(--muted)] hover:text-[var(--text)] text-xl w-8" onClick={onClose}>←</button>
        <div>
          <h1 className="font-bebas text-xl tracking-widest text-accent leading-none">ACTUALIZACIONES</h1>
          <p className="text-xs text-[var(--muted)]">Historial de cambios y mejoras</p>
        </div>
      </div>

      <div className="p-6 max-w-[500px] mx-auto flex flex-col gap-4">
        {CHANGELOG.map((entry, i) => (
          <div key={i} className={`bg-[var(--surface)] border rounded-xl overflow-hidden ${i === 0 ? 'border-accent' : 'border-[var(--border-color)]'}`}>
            <div className={`px-4 py-3 flex items-center justify-between ${i === 0 ? 'bg-[rgba(var(--accent-rgb),0.08)]' : ''}`}>
              <div className="flex items-center gap-2">
                <span className="font-bebas text-lg text-accent tracking-wider">v{entry.version}</span>
                {i === 0 && <span className="text-[0.6rem] bg-accent text-[var(--bg)] font-bold px-1.5 py-0.5 rounded-full">ÚLTIMO</span>}
              </div>
              <div className="text-right">
                <div className="text-xs font-semibold text-[var(--text)]">{entry.title}</div>
                <div className="text-[0.65rem] text-[var(--muted)]">{new Date(entry.date + 'T12:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
              </div>
            </div>
            <div className="px-4 py-3 flex flex-col gap-1.5 border-t border-[var(--border-color)]">
              {entry.changes.map((change, j) => (
                <div key={j} className="text-xs text-[var(--muted)] flex items-start gap-2">
                  <span className="mt-0.5 flex-shrink-0">·</span>
                  <span>{change}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
