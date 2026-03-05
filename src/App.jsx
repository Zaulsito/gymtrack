import { useState, useEffect } from 'react'
import { auth } from './lib/firebase'
import { useApp } from './context/AppContext'
import { useAuth } from './hooks/useAuth'

import AuthScreen            from './components/auth/AuthScreen'
import VerifiedSuccess       from './components/auth/VerifiedSuccess'
import Header                from './components/layout/Header'
import DemoBanner            from './components/layout/DemoBanner'
import Toast                 from './components/layout/Toast'
import ExerciseList          from './components/exercises/ExerciseList'
import CalendarScreen        from './components/calendar/CalendarScreen'
import ProfileScreen         from './components/profile/ProfileScreen'
import CompleteProfileScreen from './components/profile/CompleteProfileScreen'
import PartnerScreen         from './components/partner/PartnerScreen'
import { SummaryModal, PrivacyModal, WelcomeModal } from './components/modals/Modals'
import ImportModal from './components/modals/ImportModal'
import * as XLSX from 'xlsx'
import { formatDate } from './lib/utils'

export default function App() {
  const { state, currentUser, isDemoMode, exitDemoMode, showToast, myLogs, loadUserData, setCurrentUser } = useApp()
  const { authState, setAuthState, pendingUser, justVerified, setJustVerified } = useAuth()

  const [screen,        setScreen]        = useState(null)
  const [modal,         setModal]         = useState(null)
  const [welcomeName,   setWelcomeName]   = useState('')
  const [showAuth,      setShowAuth]      = useState(false)
  const [showAuthPanel, setShowAuthPanel] = useState('login')
  const [showImport,    setShowImport]    = useState(false)

  // Load theme on mount
  useEffect(() => {
    const THEME_COLORS = {
      default: '#c8ff00', red: '#ff2d2d', pink: '#ff85c2',
      blue: '#4d8eff', cyan: '#00e5ff'
    }
    const saved = localStorage.getItem('gymtrack_theme') || 'default'
    document.body.classList.remove('theme-red','theme-pink','theme-blue','theme-cyan')
    if (saved !== 'default') document.body.classList.add(`theme-${saved}`)
    // Restaurar theme-color del navegador móvil
    const meta = document.querySelector('meta[name="theme-color"]')
    if (meta) meta.setAttribute('content', THEME_COLORS[saved] || '#c8ff00')
  }, [])

  function handleCompleteProfileDone(firstName) {
    setWelcomeName(firstName)
    setModal('welcome')
    setAuthState('authenticated')
  }

  function handleDemoRegister() {
    exitDemoMode()
    setShowAuthPanel('register')
    setShowAuth(true)
  }

  function exportExcel() {
    if (!state) return
    const wb   = XLSX.utils.book_new()
    const logs = myLogs()
    const cats = [...new Set(state.exercises.map(e => e.cat))]
    cats.forEach(cat => {
      const exs  = state.exercises.filter(e => e.cat === cat)
      const rows = [['Ejercicio','Máquina','Descripción','Peso','Reps','Series','Tamaño','Fecha','Condición']]
      exs.forEach(ex => {
        const el = logs[String(ex.id)] || []
        if (!el.length) { rows.push([ex.name, ex.maquina||'-', ex.descripcion||'-', '-','-','-','-','-','SIN DATOS']); return }
        el.forEach((l, i) => rows.push([
          i===0?ex.name:'',
          i===0?(ex.maquina||'-'):'', i===0?(ex.descripcion||'-'):'',
          l.peso||'-', l.reps||'-', l.series||'-', l.tam||'-',
          l.fecha?formatDate(l.fecha):'-', l.cond||'-'
        ]))
      })
      const ws = XLSX.utils.aoa_to_sheet(rows)
      ws['!cols'] = [{wch:32},{wch:10},{wch:20},{wch:10},{wch:8},{wch:8},{wch:10},{wch:16},{wch:12}]
      XLSX.utils.book_append_sheet(wb, ws, cat.substring(0,31))
    })
    XLSX.writeFile(wb, `GymTrack_${new Date().toISOString().split('T')[0]}.xlsx`)
    showToast('✓ Excel exportado', 'ok')
  }

  // ── RENDER ──────────────────────────────────────────────────────────────────
  if (authState === 'loading' && !isDemoMode) {
    return (
      <div className="fixed inset-0 bg-[var(--bg)] flex flex-col items-center justify-center gap-4">
        <div className="font-bebas text-4xl text-accent tracking-widest">GYMTRACK</div>
        <div className="spinner" />
      </div>
    )
  }

  if ((authState === 'unauthenticated' || showAuth) && !isDemoMode) {
    return (
      <>
        <AuthScreen
          initialPanel={showAuthPanel}
          onVerified={() => { setShowAuth(false); setAuthState('loading') }}
        />
        {modal === 'privacy' && <PrivacyModal onClose={() => setModal(null)} />}
      </>
    )
  }

  if (authState === 'needsVerify' && !isDemoMode) {
    return <AuthScreen
      initialPanel="verify"
      pendingUser={pendingUser}
      onVerified={async () => {
        const user = auth.currentUser
        if (user) {
          setCurrentUser(user)
          setJustVerified(true)
          const { isNew } = await loadUserData(user)
          if (isNew) setAuthState('completeProfile')
          else setAuthState('authenticated')
        }
      }}
    />
  }

  if (authState === 'completeProfile' && justVerified && !isDemoMode) {
    return <VerifiedSuccess onContinue={() => setJustVerified(false)} />
  }

  if (authState === 'completeProfile' && !isDemoMode) {
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
        onImportExcel={() => setShowImport(true)}
      />
      <DemoBanner onRegister={handleDemoRegister} />
      <ExerciseList />
      <Toast />

      {screen === 'calendar' && <CalendarScreen onClose={() => setScreen(null)} />}
      {screen === 'profile'  && <ProfileScreen  onClose={() => setScreen(null)} />}
      {screen === 'partner'  && <PartnerScreen  onClose={() => setScreen(null)} onRegister={() => { setScreen(null); setShowAuthPanel('register'); setShowAuth(true) }} />}

      {modal === 'summary' && <SummaryModal  onClose={() => setModal(null)} />}
      {modal === 'privacy' && <PrivacyModal  onClose={() => setModal(null)} />}
      {modal === 'welcome' && <WelcomeModal  firstName={welcomeName} onClose={() => setModal(null)} />}
      {showImport          && <ImportModal   onClose={() => setShowImport(false)} />}
    </div>
  )
}
