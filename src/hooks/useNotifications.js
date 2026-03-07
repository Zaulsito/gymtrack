import { useEffect, useRef } from 'react'

const ROUTINES = {
  ppl:         ['Push (Empuje)', 'Pull (Tracción)', 'Piernas', 'Push (Empuje)', 'Pull (Tracción)', 'Piernas', 'Descanso'],
  fullbody:    ['Full Body A', 'Full Body B', 'Full Body C', 'Full Body A', 'Full Body B', 'Full Body C', 'Descanso'],
  upper_lower: ['Tren Superior A', 'Tren Inferior A', 'Tren Superior B', 'Tren Inferior B', 'Descanso', 'Descanso', 'Descanso'],
  torso_pierna:['Torso A', 'Pierna A', 'Torso B', 'Pierna B', 'Descanso', 'Descanso', 'Descanso'],
  arnold:      ['Pecho + Espalda', 'Hombros + Brazos', 'Piernas', 'Pecho + Espalda', 'Hombros + Brazos', 'Piernas', 'Descanso'],
  bro_split:   ['Pecho', 'Espalda', 'Hombros', 'Brazos', 'Piernas', 'Descanso', 'Descanso'],
}

export function useNotifications(state) {
  const intervalRef = useRef(null)
  const swRef       = useRef(null)

  useEffect(() => {
    registerSW()
    return () => clearInterval(intervalRef.current)
  }, [])

  useEffect(() => {
    clearInterval(intervalRef.current)
    if (state?.notifEnabled && state?.notifTime) {
      startScheduler(state.notifTime, state.activeRoutine)
    }
  }, [state?.notifEnabled, state?.notifTime, state?.activeRoutine])

  async function registerSW() {
    if (!('serviceWorker' in navigator)) return
    try {
      const reg = await navigator.serviceWorker.register('/sw.js')
      swRef.current = reg
    } catch (e) { console.warn('SW error:', e) }
  }

  async function requestPermission() {
    if (!('Notification' in window)) return 'unsupported'
    if (Notification.permission === 'granted') return 'granted'
    const result = await Notification.requestPermission()
    return result
  }

  function getTodayMessage(activeRoutine) {
    if (!activeRoutine) return { title: '💪 ¡Hora de entrenar!', body: 'Abre GymTrack y registra tu sesión de hoy.' }
    const dayOfWeek = new Date().getDay() // 0=domingo
    const idx       = dayOfWeek === 0 ? 6 : dayOfWeek - 1
    const days      = ROUTINES[activeRoutine.id]
    const todayName = days ? days[idx] : activeRoutine.plan?.[idx % (activeRoutine.plan?.length || 1)]?.name
    if (!todayName || todayName === 'Descanso') {
      return { title: '😴 Día de descanso', body: 'Hoy toca recuperar. ¡Descansa bien para mañana!' }
    }
    return {
      title: `💪 Hoy toca: ${todayName}`,
      body:  `Rutina: ${activeRoutine.name} — ¡A darle! 🔥`
    }
  }

  function startScheduler(notifTime, activeRoutine) {
    // Revisa cada 30 segundos si es hora de notificar
    intervalRef.current = setInterval(() => {
      const now  = new Date()
      const hhmm = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`
      if (hhmm === notifTime) {
        const lastFired = localStorage.getItem('gymtrack_last_notif')
        const today     = now.toISOString().split('T')[0]
        if (lastFired === today) return // Ya notificó hoy
        localStorage.setItem('gymtrack_last_notif', today)
        fireNotification(activeRoutine)
      }
    }, 30000)
  }

  async function fireNotification(activeRoutine) {
    const { title, body } = getTodayMessage(activeRoutine)
    if (Notification.permission !== 'granted') return
    if (swRef.current) {
      const reg = await navigator.serviceWorker.ready
      reg.showNotification(title, {
        body,
        icon:    '/icon-512.png',
        badge:   '/icon-512.png',
        vibrate: [200, 100, 200],
      })
    } else {
      new Notification(title, { body, icon: '/icon-512.png' })
    }
  }

  return { requestPermission, getTodayMessage }
}
