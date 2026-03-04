import { useEffect, useState, useRef } from 'react'
import { onAuthStateChanged, applyActionCode } from 'firebase/auth'
import { auth } from '../lib/firebase'
import { useApp } from '../context/AppContext'

export function useAuth() {
  const { setCurrentUser, loadUserData } = useApp()
  const [authState, setAuthState] = useState('loading')
  const [pendingUser, setPendingUser] = useState(null)
  const [justVerified, setJustVerified] = useState(false)
  const loadUserDataRef = useRef(loadUserData)
  const initialized = useRef(false)

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
    if (initialized.current) return
    initialized.current = true

    const unsub = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const isLegacy = user.email?.endsWith('@gymtrack.app')

        if (!user.emailVerified && !isLegacy) {
          setCurrentUser(user)
          setPendingUser(user)
          setAuthState('needsVerify')
          return
        }

        setCurrentUser(user)
        const { isNew } = await loadUserDataRef.current(user)

        if (isNew) {
          setAuthState('completeProfile')
        } else {
          setAuthState('authenticated')
        }
      } else {
        setCurrentUser(null)
        setAuthState('unauthenticated')
      }
    })
    return () => unsub()
  }, [setCurrentUser])

  return { authState, setAuthState, pendingUser, justVerified, setJustVerified }
}
