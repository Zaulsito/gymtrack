import { useState, useEffect } from 'react'
import { signOut } from 'firebase/auth'
import { auth } from './lib/firebase'
import { useApp } from './context/AppContext'
import { useAuth } from './hooks/useAuth'

import AuthScreen            from './components/auth/AuthScreen'
import Header                from './components/layout/Header'
import DemoBanner            from './components/layout/DemoBanner'
import Toast                 from './components/layout/Toast'
import ExerciseList          from './components/exercises/ExerciseList'
import CalendarScreen        from './components/calendar/CalendarScreen'
import ProfileScreen         from './components/profile/ProfileScreen'
import CompleteProfileScreen from './components/profile/CompleteProfileScreen'
import PartnerScreen         from './components/partner/PartnerScreen'
import { SummaryModal, PrivacyModal, WelcomeModal } from './components/modals/Modals'
import * as XLSX from 'xlsx'
import { formatDate } from './lib/utils'

export default function App() {
  const { state, currentUser, exitDemoMode, showToast, myLogs } = useApp()
  const { authState, setAuthState, pendingUser } = useAuth()

  const [screen,  setScreen]  = useState(null) // calendar | profile | partner
  const [modal,   setModal]   = useState(null) // summary | privacy | welcome
  const [welcomeName, setWelcomeName] = useState('')
  const [showAuth, setShowAuth] = useState(false)

  // Load theme on mount
  useEffect(() => {
    const saved = localStorage.getItem('gymtrack_theme') || 'default'
    document.body.classList.remove('theme-red','theme-pink','theme-blue','theme-cyan')
    if (saved !== 'default') document.body.classList.add(`theme-${saved}`)
  }, [])

  function handleCompleteProfileDone(firstName) {
    setWelcomeName(firstName)
    setModal('welcome')
    setAuthState('authenticated')
  }

  function handleDemoRegister() {
    exitDemoMode()
    setShowAuth(true)
  }

  function exportExcel() {
    if (!state) return
    const wb   = XLSX.utils.book_new()
    const logs = myLogs()
    const cats = [...new Set(state.exercises.map(e => e.cat))]
    cats.forEach(cat => {
      const exs  = state.exercises.filter(e => e.cat === cat)
      const rows = [['N°','Ejercicio','Peso','Reps','Series','Tamaño','Fecha','Condición']]
      exs.forEach(ex => {
        const el = logs[String(ex.id)] || []
        if (!el.length) { rows.push([ex.num, ex.name, '-','-','-','-','-','SIN DATOS']); return }
        el.forEach((l, i) => rows.push([
          i===0?ex.num:'', i===0?ex.name:'',
          l.peso||'-', l.reps||'-', l.series||'-', l.tam||'-',
          l.fecha?formatDate(l.fecha):'-', l.cond||'-'
        ]))
      })
      const ws = XLSX.utils.aoa_to_sheet(rows)
      ws['!cols'] = [{wch:6},{wch:32},{wch:10},{wch:8},{wch:8},{wch:10},{wch:16},{wch:12}]
      XLSX.utils.book_append_sheet(wb, ws, cat.substring(0,31))
    })
    XLSX.writeFile(wb, `GymTrack_${new Date().toISOString().split('T')[0]}.xlsx`)
    showToast('✓ Excel exportado', 'ok')
  }

  // ── RENDER ─────────────────────────────────────────────────────────────────
  if (authState === 'loading') {
    return (
      <div className="fixed inset-0 bg-[var(--bg)] flex flex-col items-center justify-center gap-4">
        <div className="font-bebas text-4xl text-accent tracking-widest">GYMTRACK</div>
        <div className="spinner" />
      </div>
    )
  }

  if (authState === 'unauthenticated' || showAuth) {
    return (
      <>
        <AuthScreen onVerified={() => { setShowAuth(false); setAuthState('loading') }} />
        {modal === 'privacy' && <PrivacyModal onClose={() => setModal(null)} />}
      </>
    )
  }

  if (authState === 'needsVerify') {
    return <AuthScreen initialPanel="verify" pendingUser={pendingUser} onVerified={() => setAuthState('loading')} />
  }

  if (authState === 'completeProfile') {
    return <CompleteProfileScreen onDone={handleCompleteProfileDone} />
  }

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <Header
        onOpenProfile={() => setScreen('profile')}
        onOpenCalendar={() => setScreen('calendar')}
        onOpenSummary={() => setModal('summary')}
        onOpenPartner={() => setScreen('partner')}
        onExportExcel={exportExcel}
      />
      <DemoBanner onRegister={handleDemoRegister} />
      <ExerciseList />
      <Toast />

      {/* Screens */}
      {screen === 'calendar' && <CalendarScreen onClose={() => setScreen(null)} />}
      {screen === 'profile'  && <ProfileScreen  onClose={() => setScreen(null)} />}
      {screen === 'partner'  && <PartnerScreen  onClose={() => setScreen(null)} />}

      {/* Modals */}
      {modal === 'summary' && <SummaryModal  onClose={() => setModal(null)} />}
      {modal === 'privacy' && <PrivacyModal  onClose={() => setModal(null)} />}
      {modal === 'welcome' && <WelcomeModal  firstName={welcomeName} onClose={() => setModal(null)} />}
    </div>
  )
}
