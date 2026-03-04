import { useEffect, useState } from 'react'
import { onAuthStateChanged, applyActionCode } from 'firebase/auth'
import { auth } from '../lib/firebase'
import { useApp } from '../context/AppContext'

export function useAuth() {
  const { setCurrentUser, loadUserData } = useApp()
  const [authState, setAuthState] = useState('loading') // loading | unauthenticated | needsVerify | authenticated
  const [pendingUser, setPendingUser] = useState(null)

  // Handle Firebase email action on page load (verification link)
  useEffect(() => {
    const params   = new URLSearchParams(window.location.search)
    const mode     = params.get('mode')
    const oobCode  = params.get('oobCode')
    if (mode === 'verifyEmail' && oobCode) {
      applyActionCode(auth, oobCode)
        .then(() => {
          window.history.replaceState({}, '', window.location.pathname)
          if (auth.currentUser) auth.currentUser.reload()
        })
        .catch(() => {})
    }
  }, [])

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const isLegacy = user.email?.endsWith('@gymtrack.app')

        // Needs email verification
        if (!user.emailVerified && !isLegacy) {
          setCurrentUser(user)
          setPendingUser(user)
          setAuthState('needsVerify')
          return
        }

        setCurrentUser(user)
        setAuthState('authenticated')
        const { isNew } = await loadUserData(user)
        if (isNew) setAuthState('completeProfile')
      } else {
        setCurrentUser(null)
        setAuthState('unauthenticated')
      }
    })
    return () => unsub()
  }, [setCurrentUser, loadUserData])

  return { authState, setAuthState, pendingUser }
}
