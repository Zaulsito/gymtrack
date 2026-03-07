import { useState } from 'react'
import { useApp } from '../../context/AppContext'

export default function NotificationsScreen({ onClose }) {
  const { state, updateState, showToast } = useApp()
  const [notifTime,    setNotifTime]    = useState(state?.notifTime    || '18:00')
  const [notifEnabled, setNotifEnabled] = useState(state?.notifEnabled || false)
  const [permission,   setPermission]   = useState(Notification.permission || 'default')

  const activeRoutine  = state?.activeRoutine
  const supported      = 'Notification' in window

  async function handleToggle() {
    if (!notifEnabled) {
      // Activar — pedir permiso primero
      const perm = await Notification.requestPermission()
      setPermission(perm)
      if (perm !== 'granted') {
        showToast('⚠ Debes permitir notificaciones en tu navegador', 'warn')
        return
      }
      updateState(prev => ({ ...prev, notifEnabled: true, notifTime }))
      setNotifEnabled(true)
      showToast('✓ Notificaciones activadas', 'ok')
      // Mostrar notificación de prueba
      const reg = await navigator.serviceWorker?.ready
      if (reg) {
        reg.showNotification('✅ GymTrack activado', {
          body: `Te recordaremos entrenar a las ${notifTime} 💪`,
          icon: '/icon-512.png',
        })
      }
    } else {
      updateState(prev => ({ ...prev, notifEnabled: false }))
      setNotifEnabled(false)
      showToast('Notificaciones desactivadas', 'ok')
    }
  }

  function handleSaveTime() {
    updateState(prev => ({ ...prev, notifTime }))
    showToast(`✓ Hora guardada: ${notifTime}`, 'ok')
  }

  // Preview de qué dirá la notificación hoy
  function getTodayPreview() {
    if (!activeRoutine) return null
    const dayOfWeek = new Date().getDay()
    const idx       = dayOfWeek === 0 ? 6 : dayOfWeek - 1
    const todayPlan = activeRoutine.plan?.[idx % (activeRoutine.plan?.length || 1)]
    return todayPlan
  }
  const todayPlan = getTodayPreview()

  return (
    <div className="profile-screen">
      <div className="sticky top-0 z-[290] bg-[var(--bg)] border-b border-[var(--border-color)] px-4 py-3 flex items-center gap-3">
        <button className="text-[var(--muted)] hover:text-[var(--text)] text-xl w-8" onClick={onClose}>←</button>
        <div>
          <h1 className="font-bebas text-xl tracking-widest text-accent leading-none">NOTIFICACIONES</h1>
          <p className="text-xs text-[var(--muted)]">Recordatorio de entrenamiento</p>
        </div>
      </div>

      <div className="p-6 max-w-[500px] mx-auto flex flex-col gap-5">

        {/* No soportado */}
        {!supported && (
          <div className="bg-[rgba(255,51,102,0.08)] border border-[rgba(255,51,102,0.3)] rounded-xl p-4 text-sm text-[var(--down)]">
            ⚠ Tu navegador no soporta notificaciones. Instala la app como PWA para activarlas.
          </div>
        )}

        {/* Permiso denegado */}
        {supported && permission === 'denied' && (
          <div className="bg-[rgba(255,51,102,0.08)] border border-[rgba(255,51,102,0.3)] rounded-xl p-4 text-sm text-[var(--down)]">
            ⚠ Las notificaciones están bloqueadas en tu navegador. Ve a Ajustes del sitio y permite las notificaciones manualmente.
          </div>
        )}

        {/* Rutina activa */}
        {activeRoutine ? (
          <div className="bg-[var(--surface)] border border-[var(--border-color)] rounded-xl p-4">
            <div className="text-xs text-[var(--muted)] mb-1">📋 Rutina activa</div>
            <div className="font-semibold text-accent">{activeRoutine.name}</div>
            {todayPlan && (
              <div className="mt-2 flex items-center gap-2 text-sm">
                <span className="text-xl">{todayPlan.emoji}</span>
                <div>
                  <div className="font-semibold">Hoy: {todayPlan.name}</div>
                  <div className="text-xs text-[var(--muted)]">{todayPlan.muscles?.join(' · ')}</div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-[var(--surface)] border border-[var(--border-color)] rounded-xl p-4 text-sm text-[var(--muted)]">
            💡 Sin rutina activa — la notificación será genérica. Activa una rutina en <strong>📋 Rutinas</strong> para recordatorios personalizados.
          </div>
        )}

        {/* Hora */}
        <div className="bg-[var(--surface)] border border-[var(--border-color)] rounded-xl p-4 flex flex-col gap-3">
          <div className="section-title">⏰ Hora del recordatorio</div>
          <div className="flex gap-3 items-center">
            <input
              type="time"
              className="input-field flex-1 text-lg font-bebas tracking-wider"
              value={notifTime}
              onChange={e => setNotifTime(e.target.value)}
            />
            <button className="btn-outline px-4 py-2 text-sm" onClick={handleSaveTime}>
              Guardar
            </button>
          </div>
          <p className="text-xs text-[var(--muted)]">
            Recibirás un recordatorio cada día a esta hora con el entrenamiento que toca según tu rutina.
          </p>
        </div>

        {/* Toggle activar */}
        <div className="bg-[var(--surface)] border border-[var(--border-color)] rounded-xl p-4 flex items-center justify-between">
          <div>
            <div className="font-semibold text-sm">Recordatorio diario</div>
            <div className="text-xs text-[var(--muted)]">
              {notifEnabled ? `Activo · todos los días a las ${state?.notifTime || notifTime}` : 'Desactivado'}
            </div>
          </div>
          <button
            className={`relative w-14 h-7 rounded-full transition-colors duration-300 ${notifEnabled ? 'bg-accent' : 'bg-[var(--surface2)]'}`}
            onClick={handleToggle}
            disabled={!supported || permission === 'denied'}
          >
            <div className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow transition-all duration-300 ${notifEnabled ? 'left-8' : 'left-1'}`} />
          </button>
        </div>

        {/* Preview notificación */}
        {notifEnabled && (
          <div className="flex flex-col gap-2">
            <div className="section-title">👀 Preview de hoy</div>
            <div className="bg-[var(--surface2)] border border-[var(--border-color)] rounded-xl p-4">
              <div className="flex items-start gap-3">
                <img src="/icon-512.png" className="w-10 h-10 rounded-xl" />
                <div>
                  <div className="font-semibold text-sm">
                    {todayPlan ? `💪 Hoy toca: ${todayPlan.name}` : '💪 ¡Hora de entrenar!'}
                  </div>
                  <div className="text-xs text-[var(--muted)] mt-0.5">
                    {activeRoutine ? `Rutina: ${activeRoutine.name} — ¡A darle! 🔥` : 'Abre GymTrack y registra tu sesión de hoy.'}
                  </div>
                  <div className="text-xs text-[var(--muted)] mt-1">GymTrack · {notifTime}</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Nota sobre PWA */}
        <div className="bg-[var(--surface2)] border border-[var(--border-color)] rounded-xl p-4 text-xs text-[var(--muted)]">
          <p className="font-semibold text-[var(--text)] mb-1">📱 Para mejor experiencia</p>
          <p>Instala GymTrack como app en tu celular (Añadir a pantalla de inicio) para recibir notificaciones aunque el navegador esté cerrado.</p>
        </div>

      </div>
    </div>
  )
}
