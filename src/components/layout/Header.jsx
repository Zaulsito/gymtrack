import { useState } from 'react'
import { signOut } from 'firebase/auth'
import { auth } from '../../lib/firebase'
import { useApp } from '../../context/AppContext'
import { THEMES } from '../../lib/utils'

export default function Header({ onOpenProfile, onOpenCalendar, onOpenPartner, onOpenBody, onOpenStats, onOpenRoutines, onOpenNotifications, onShare, onExportExcel, onImportExcel }) {
  const { state, currentUser, isDemoMode, exitDemoMode, theme, setTheme, showToast } = useApp()
  const [dropUser,  setDropUser]  = useState(false)
  const [dropTheme, setDropTheme] = useState(false)

  function doLogout() {
    if (isDemoMode) { exitDemoMode(); return }
    signOut(auth)
  }

  const photoURL = state?.photoURL
  const name     = state?.displayName || currentUser?.email?.split('@')[0] || 'Usuario'

  return (
    <header className="bg-[var(--surface)] border-b border-[var(--border-color)] px-6 flex items-center justify-between h-[60px] sticky top-0 z-[350]">
      <div className="font-bebas text-[1.8rem] tracking-widest text-accent">
        GYM<span className="text-[var(--text)]">TRACK</span>
      </div>

      <div className="flex gap-2 items-center">
        {/* Theme dropdown */}
        <div className="relative">
          <button
            className="bg-[var(--surface2)] border border-[var(--border-color)] rounded-lg text-[var(--text)] text-xs px-3 py-1.5 flex items-center gap-1.5 cursor-pointer hover:border-accent transition-colors"
            onClick={() => { setDropTheme(v => !v); setDropUser(false) }}
          >
            🎨 <span>{THEMES[theme]?.label || 'Verde'}</span> ▾
          </button>
          {dropTheme && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setDropTheme(false)} />
              <div className="absolute right-0 top-[calc(100%+6px)] bg-[var(--surface)] border border-[var(--border-color)] rounded-xl min-w-[160px] z-20 overflow-hidden shadow-2xl">
                {Object.entries(THEMES).map(([key, { label, color }]) => (
                  <button key={key} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[var(--text)] hover:bg-[var(--surface2)] text-left"
                    onClick={() => { setTheme(key); setDropTheme(false) }}>
                    <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: color }} />
                    {label}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* User dropdown */}
        <div className="relative">
          <button
            className="bg-[var(--surface2)] border border-[var(--border-color)] rounded-lg text-[var(--text)] text-xs px-3 py-1.5 flex items-center gap-2 cursor-pointer hover:border-accent transition-colors"
            onClick={() => { setDropUser(v => !v); setDropTheme(false) }}
          >
            <span className="w-[22px] h-[22px] rounded-full bg-[var(--surface2)] border border-accent flex items-center justify-center text-xs overflow-hidden flex-shrink-0">
              {photoURL
                ? <img src={photoURL} className="w-full h-full object-cover rounded-full" alt="" />
                : '👤'}
            </span>
            <span className="max-w-[80px] truncate">{name}</span> ▾
          </button>
          {dropUser && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setDropUser(false)} />
              <div className="absolute right-0 top-[calc(100%+6px)] bg-[var(--surface)] border border-[var(--border-color)] rounded-xl min-w-[180px] z-20 overflow-hidden shadow-2xl">
                {[
                  { icon: '👤', label: 'Mi Perfil',        action: onOpenProfile   },
                  { icon: '📅', label: 'Calendario',       action: onOpenCalendar  },
                  { icon: '📋', label: 'Rutinas',            action: onOpenRoutines      },
                  { icon: '🔔', label: 'Notificaciones',     action: onOpenNotifications },
                  { icon: '📊', label: 'Estadísticas',     action: onOpenStats     },
                  { icon: '📤', label: 'Compartir progreso',action: onShare         },
                  { icon: '🤝', label: 'Partner',          action: onOpenPartner   },
                  { icon: '⚖️', label: 'Peso corporal',    action: onOpenBody      },
                  { icon: '↓',  label: 'Exportar Excel',   action: onExportExcel   },
                  { icon: '↑',  label: 'Importar Excel',   action: onImportExcel   },
                ].map(({ icon, label, action }) => (
                  <button key={label} className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-[var(--text)] hover:bg-[var(--surface2)] text-left"
                    onClick={() => { action?.(); setDropUser(false) }}>
                    {icon} {label}
                  </button>
                ))}
                <div className="h-px bg-[var(--border-color)] mx-2" />
                <button className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-[var(--down)] hover:bg-[var(--surface2)] text-left"
                  onClick={() => { doLogout(); setDropUser(false) }}>
                  🚪 Cerrar sesión
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
