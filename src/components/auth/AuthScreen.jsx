import { useState } from 'react'
import { LoginPanel, RegisterPanel, VerifyPanel } from './AuthPanels'

export default function AuthScreen({ initialPanel = 'login', pendingUser, onVerified }) {
  const [panel, setPanel] = useState(pendingUser ? 'verify' : initialPanel)
  const [verifyUser, setVerifyUser] = useState(pendingUser || null)

  function handleVerify(user) {
    setVerifyUser(user)
    setPanel('verify')
  }

  return (
    <div className="fixed inset-0 bg-[var(--bg)] z-[500] flex items-center justify-center p-6">
      <div className="w-full max-w-[360px] bg-[var(--surface)] border border-[var(--border-color)] rounded-2xl px-8 py-10 flex flex-col items-center gap-6">
        {/* Logo */}
        <div className="text-center">
          <div className="font-bebas text-5xl tracking-widest text-accent leading-none">
            GYM<span className="text-[var(--text)]">TRACK</span>
          </div>
          <div className="text-xs text-[var(--muted)] mt-2">Tu seguimiento de gimnasio 💪</div>
        </div>

        {panel === 'login'    && <LoginPanel    onGoRegister={() => setPanel('register')} />}
        {panel === 'register' && <RegisterPanel onGoLogin={() => setPanel('login')} onVerify={handleVerify} />}
        {panel === 'verify'   && <VerifyPanel   user={verifyUser} onVerified={onVerified} onBack={() => setPanel('login')} />}
      </div>
    </div>
  )
}
