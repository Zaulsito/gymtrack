import { useState, useEffect } from 'react'
import { auth } from './lib/firebase'
import { useApp } from './context/AppContext'
import { useAuth } from './hooks/useAuth'

import AuthScreen            from './components/auth/AuthScreen'
import VerifiedSuccess       from './components/auth/VerifiedSuccess'
import ResetPasswordPanel    from './components/auth/ResetPasswordPanel'
import Header                from './components/layout/Header'
import DemoBanner            from './components/layout/DemoBanner'
import Toast                 from './components/layout/Toast'
import ExerciseList          from './components/exercises/ExerciseList'
import CalendarScreen        from './components/calendar/CalendarScreen'
import ProfileScreen         from './components/profile/ProfileScreen'
import CompleteProfileScreen from './components/profile/CompleteProfileScreen'
import BodyWeightScreen      from './components/profile/BodyWeightScreen'
import StatsScreen           from './components/stats/StatsScreen'
import RoutinesScreen        from './components/routines/RoutinesScreen'
import NotificationsScreen   from './components/notifications/NotificationsScreen'
import ChangelogScreen       from './components/changelog/ChangelogScreen'
import { useNotifications }  from './hooks/useNotifications'
import PartnerScreen         from './components/partner/PartnerScreen'
import { PrivacyModal, WelcomeModal } from './components/modals/Modals'
import ShareModal from './components/modals/ShareModal'
import ImportModal from './components/modals/ImportModal'
import * as XLSX from 'xlsx'
import { formatDate } from './lib/utils'

export default function App() {
  const { state, currentUser, isDemoMode, exitDemoMode, showToast, myLogs, loadUserData, setCurrentUser } = useApp()
  useNotifications(state)
  const { authState, setAuthState, pendingUser, justVerified, setJustVerified } = useAuth()

  const [screen, setScreen] = useState(() => sessionStorage.getItem('gymtrack_screen') || null)
  const [modal,         setModal]         = useState(null)
  const [welcomeName,   setWelcomeName]   = useState('')
  const [showAuth,      setShowAuth]      = useState(false)
  const [showAuthPanel, setShowAuthPanel] = useState('login')
  const [showImport,    setShowImport]    = useState(false)
  const [showShare,     setShowShare]     = useState(false)
  const [resetCode,     setResetCode]     = useState(() => {
    const p = new URLSearchParams(window.location.search)
    return p.get('mode') === 'resetPassword' ? p.get('oobCode') : null
  })

  function navigateTo(s) {
    sessionStorage.setItem('gymtrack_screen', s || '')
    setScreen(s)
  }

  // Load theme on mount
  useEffect(() => {
    const COLORS = { default:'#e7ebd7', red:'#ff2d2d', pink:'#ff85c2', blue:'#4d8eff', cyan:'#00e5ff' }
    const saved = localStorage.getItem('gymtrack_theme') || 'default'
    document.body.classList.remove('theme-red','theme-pink','theme-blue','theme-cyan','theme-light')
    if (saved !== 'default') document.body.classList.add(`theme-${saved}`)
    const meta = document.querySelector('meta[name="theme-color"]')
    if (meta) meta.setAttribute('content', COLORS[saved] || '#c8ff00')
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
      const rows = [['Ejercicio','Máquina','Descripción','Peso','Reps','Segundos','Series','Tamaño','Fecha','Condición']]
      exs.forEach(ex => {
        const el = logs[String(ex.id)] || []
        if (!el.length) { rows.push([ex.name, ex.maquina||'-', ex.descripcion||'-', '-','-','-','-','-','-','SIN DATOS']); return }
        el.forEach((l, i) => rows.push([
          i===0?ex.name:'',
          i===0?(ex.maquina||'-'):'', i===0?(ex.descripcion||'-'):'',
          l.peso||'-', l.reps||'-', l.secs||'-', l.series||'-', l.tam||'-',
          l.fecha?formatDate(l.fecha):'-', l.cond||'-'
        ]))
      })
      const ws = XLSX.utils.aoa_to_sheet(rows)
      ws['!cols'] = [{wch:32},{wch:10},{wch:20},{wch:10},{wch:8},{wch:10},{wch:8},{wch:10},{wch:16},{wch:12}]
      XLSX.utils.book_append_sheet(wb, ws, cat.substring(0,31))
    })
    XLSX.writeFile(wb, `GymTrack_${new Date().toISOString().split('T')[0]}.xlsx`)
    showToast('✓ Excel exportado', 'ok')
  }

  if (resetCode) {
    return <ResetPasswordPanel
      oobCode={resetCode}
      onDone={() => {
        window.history.replaceState({}, '', window.location.pathname)
        setResetCode(null)
        setAuthState('unauthenticated')
      }}
    />
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
        onOpenProfile={() => navigateTo('profile')}
        onOpenCalendar={() => navigateTo('calendar')}
        onOpenPartner={() => navigateTo('partner')}
        onOpenBody={() => navigateTo('body')}
        onOpenStats={() => navigateTo('stats')}
        onOpenRoutines={() => navigateTo('routines')}
        onOpenNotifications={() => navigateTo('notifications')}
        onOpenChangelog={() => navigateTo('changelog')}
        onShare={() => setShowShare(true)}
        onExportExcel={exportExcel}
        onImportExcel={() => setShowImport(true)}
      />
      <DemoBanner onRegister={handleDemoRegister} />
      {!screen && <ExerciseList />}
      <Toast />

      {screen === 'calendar' && <CalendarScreen    onClose={() => navigateTo(null)} />}
      {screen === 'profile'  && <ProfileScreen      onClose={() => navigateTo(null)} />}
      {screen === 'partner'  && <PartnerScreen      onClose={() => navigateTo(null)} onRegister={() => { navigateTo(null); setShowAuthPanel('register'); setShowAuth(true) }} />}
      {screen === 'body'     && <BodyWeightScreen   onClose={() => navigateTo(null)} />}
      {screen === 'stats'    && <StatsScreen        onClose={() => navigateTo(null)} />}
      {screen === 'routines'       && <RoutinesScreen       onClose={() => navigateTo(null)} />}
      {screen === 'notifications'  && <NotificationsScreen  onClose={() => navigateTo(null)} />}
      {screen === 'changelog'      && <ChangelogScreen      onClose={() => navigateTo(null)} />}

      {modal === 'privacy' && <PrivacyModal  onClose={() => setModal(null)} />}
      {modal === 'welcome' && <WelcomeModal  firstName={welcomeName} onClose={() => setModal(null)} />}
      {showImport && <ImportModal onClose={() => setShowImport(false)} />}
      {showShare  && <ShareModal  onClose={() => setShowShare(false)}  />}
    </div>
  )
}
