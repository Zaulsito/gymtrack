import { useEffect, useState, useRef } from 'react'
import { onAuthStateChanged, applyActionCode } from 'firebase/auth'
import { auth } from '../lib/firebase'
import { useApp } from '../context/AppContext'

export function useAuth() {
  const { setCurrentUser, loadUserData } = useApp()
  const [authState, setAuthState] = useState('loading')
  const [pendingUser, setPendingUser] = useState(null)
  const [justVerified, setJustVerified] = useState(false)
  const hasLoaded = useRef(false)

  // Handle Firebase email action on page load (verification link)
  useEffect(() => {
    const params  = new URLSearchParams(window.location.search)
    const mode    = params.get('mode')
    const oobCode = params.get('oobCode')
    if (mode === 'verifyEmail' && oobCode) {
      applyActionCode(auth, oobCode)
        .then(() => {
          window.history.replaceState({}, '', window.location.pathname)
          setJustVerified(true)
          if (auth.currentUser) auth.currentUser.reload()
        })
        .catch(() => {})
    }
  }, [])

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const isLegacy = user.email?.endsWith('@gymtrack.app')

        if (!user.emailVerified && !isLegacy) {
          setCurrentUser(user)
          setPendingUser(user)
          setAuthState('needsVerify')
          return
        }

        // Solo cargar datos una vez
        if (hasLoaded.current) return
        hasLoaded.current = true

        setCurrentUser(user)
        const { isNew } = await loadUserData(user)

        if (isNew) {
          setAuthState('completeProfile')
        } else {
          setAuthState('authenticated')
        }
      } else {
        hasLoaded.current = false
        setCurrentUser(null)
        setAuthState('unauthenticated')
      }
    })
    return () => unsub()
  }, [])

  return { authState, setAuthState, pendingUser, justVerified, setJustVerified }
}
