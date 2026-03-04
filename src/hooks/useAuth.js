import { useEffect, useState, useRef } from 'react'
import { onAuthStateChanged, applyActionCode } from 'firebase/auth'
import { auth } from '../lib/firebase'
import { useApp } from '../context/AppContext'

export function useAuth() {
  const { setCurrentUser, loadUserData } = useApp()
  const [authState, setAuthState] = useState('loading')
  const [pendingUser, setPendingUser] = useState(null)
  const [justVerified, setJustVerified] = useState(false)
  const processedUid = useRef(null)
  const nullTimer = useRef(null)

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
      // Cancelar timer de null si llega usuario
      clearTimeout(nullTimer.current)

      if (user) {
        const isLegacy = user.email?.endsWith('@gymtrack.app')

        if (!user.emailVerified && !isLegacy) {
          processedUid.current = null
          setCurrentUser(user)
          setPendingUser(user)
          setAuthState('needsVerify')
          return
        }

        // Evitar procesar el mismo usuario dos veces
        if (processedUid.current === user.uid) return
        processedUid.current = user.uid

        setCurrentUser(user)
        setAuthState('authenticated')
        const { isNew } = await loadUserData(user)
        if (isNew) setAuthState('completeProfile')

      } else {
        // Esperar 2s antes de marcar como deslogueado
        // Firebase hace null->user durante refresh de token
        nullTimer.current = setTimeout(() => {
          processedUid.current = null
          setCurrentUser(null)
          setAuthState('unauthenticated')
        }, 2000)
      }
    })

    return () => {
      unsub()
      clearTimeout(nullTimer.current)
    }
  }, [setCurrentUser, loadUserData])

  return { authState, setAuthState, pendingUser, justVerified, setJustVerified }
}
