import { useApp } from '../../context/AppContext'

export default function DemoBanner({ onRegister }) {
  const { isDemoMode } = useApp()
  if (!isDemoMode) return null

  return (
    <div className="flex items-center justify-between px-4 py-1.5 text-xs"
      style={{ background: 'linear-gradient(90deg, rgba(255,165,0,0.15), rgba(255,165,0,0.05))', borderBottom: '1px solid rgba(255,165,0,0.3)', color: '#ffb347' }}>
      <span>👀 Modo demo — los datos no se guardan</span>
      <button
        className="bg-[#ffb347] text-black rounded px-2 py-0.5 text-xs font-bold"
        onClick={onRegister}
      >
        Crear cuenta gratis
      </button>
    </div>
  )
}
