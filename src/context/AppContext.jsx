import { createContext, useContext, useState, useCallback, useRef } from 'react'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { emptyUserData, DEFAULT_CATS, DEMO_EXERCISES, DEMO_LOGS, DEMO_TRAINED_DAYS } from '../lib/utils'

const AppContext = createContext(null)

export function AppProvider({ children }) {
  const [state,       setState]      = useState(null)
  const [currentUser, setCurrentUser] = useState(null)
  const [isDemoMode,  setIsDemoMode]  = useState(false)
  const [toast,       setToast]       = useState({ msg: '', type: '', visible: false })
  const [theme,       setThemeState]  = useState(() => localStorage.getItem('gymtrack_theme') || 'default')
  const saveTimeout = useRef(null)
  const toastTimer  = useRef(null)

  const showToast = useCallback((msg, type = '') => {
    setToast({ msg, type, visible: true })
    clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(t => ({ ...t, visible: false })), 3000)
  }, [])

  const getDocRef = useCallback((user) => {
    const u = user || currentUser
    return doc(db, 'users', u.uid)
  }, [currentUser])

  const loadUserData = useCallback(async (user) => {
    try {
      const snap = await getDoc(doc(db, 'users', user.uid))
      if (snap.exists()) {
        const data = snap.data()
        if (!data.categories || !data.categories.length) data.categories = [...DEFAULT_CATS]
        if (!data.exercises)  data.exercises  = []
        if (!data.logs)       data.logs       = {}
        data.currentCat = 'Todas'
        if (!data.logs[user.uid]) {
          const oldKey = Object.keys(data.logs)[0]
          if (oldKey) {
            data.logs[user.uid] = data.logs[oldKey]
            delete data.logs[oldKey]
            await setDoc(doc(db, 'users', user.uid), data)
          } else {
            data.logs[user.uid] = {}
          }
        }
        setState(data)
        return { isNew: false, data }
      } else {
        const legacySnap = await getDoc(doc(db, 'gymtrack', 'data'))
        const emailName  = user.email.split('@')[0].toUpperCase()
        if (legacySnap.exists() && (emailName === 'YAMIR' || emailName === 'ALMENDRA')) {
          const legacy   = legacySnap.data()
          const userLogs = (legacy.logs && legacy.logs[emailName]) || {}
          const data = {
            categories: legacy.categories || [...DEFAULT_CATS],
            exercises:  legacy.exercises  || [],
            logs:       { [user.uid]: userLogs },
            nextId:     legacy.nextId || 1,
            currentCat: 'Todas',
            displayName: emailName,
          }
          await setDoc(doc(db, 'users', user.uid), data)
          setState(data)
          return { isNew: false, data }
        } else {
          const data = emptyUserData(user.displayName || user.email, {})
          await setDoc(doc(db, 'users', user.uid), data)
          setState(data)
          return { isNew: true, data }
        }
      }
    } catch (e) {
      console.error(e)
      const data = emptyUserData(user.displayName || '')
      setState(data)
      return { isNew: false, data }
    }
  }, [])

  const saveData = useCallback((newState) => {
    if (isDemoMode) return false
    const stateToSave = newState || state
    clearTimeout(saveTimeout.current)
    saveTimeout.current = setTimeout(async () => {
      try { await setDoc(doc(db, 'users', currentUser.uid), stateToSave) }
      catch { showToast('⚠ Error al guardar', 'warn') }
    }, 800)
    return true
  }, [isDemoMode, state, currentUser, showToast])

  const updateState = useCallback((updater, save = true) => {
    setState(prev => {
      const next = typeof updater === 'function' ? updater(prev) : { ...prev, ...updater }
      if (save && !isDemoMode) {
        clearTimeout(saveTimeout.current)
        saveTimeout.current = setTimeout(async () => {
          try { await setDoc(doc(db, 'users', currentUser.uid), next) }
          catch { showToast('⚠ Error al guardar', 'warn') }
        }, 800)
      }
      return next
    })
  }, [isDemoMode, currentUser, showToast])

  const enterDemoMode = useCallback(() => {
    setIsDemoMode(true)
    setState({
      categories:  ['Pecho','Piernas','Espalda','Brazos','Abdominal-Caderas','Hombros'],
      exercises:   DEMO_EXERCISES,
      logs:        { demo: DEMO_LOGS },
      nextId:      999,
      currentCat:  'Todas',
      displayName: 'Invitado Demo',
      username:    'demo',
      trainedDays: DEMO_TRAINED_DAYS,
      partners:    [],
    })
  }, [])

  const exitDemoMode = useCallback(() => {
    setIsDemoMode(false)
    setState(null)
  }, [])

  // ── THEME ──────────────────────────────────────────────────────────────────
  const setTheme = useCallback((theme) => {
    document.body.classList.remove('theme-red','theme-pink','theme-blue','theme-cyan')
    if (theme !== 'default') document.body.classList.add(`theme-${theme}`)
    localStorage.setItem('gymtrack_theme', theme)
    setThemeState(theme)
  }, [])

  const myLogs = useCallback(() => {
    if (!state) return {}
    if (isDemoMode) return state.logs?.demo || {}
    if (!currentUser) return {}
    if (!state.logs[currentUser.uid]) state.logs[currentUser.uid] = {}
    return state.logs[currentUser.uid]
  }, [state, currentUser, isDemoMode])

  const logsKey = useCallback(() => {
    if (isDemoMode) return 'demo'
    return currentUser?.uid || 'demo'
  }, [isDemoMode, currentUser])

  return (
    <AppContext.Provider value={{
      state, setState, updateState,
      currentUser, setCurrentUser,
      isDemoMode, enterDemoMode, exitDemoMode,
      toast, showToast,
      theme, setTheme,
      loadUserData, saveData, getDocRef,
      myLogs, logsKey,
    }}>
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  return useContext(AppContext)
}
