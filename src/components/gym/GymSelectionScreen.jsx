import { useState } from 'react'
import { useApp } from '../../context/AppContext'

export default function GymSelectionScreen({ onSelectGym, onLogout }) {
  const { showToast, currentUser, isDemoMode } = useApp()

  function handleSelectSmartFit() {
    showToast('✓ Sede Smart Fit seleccionada', 'ok')
    onSelectGym('smartfit')
  }

  function handleSelectOtros() {
    showToast('⚠ Próximamente: Actualmente GymTrack está configurado solo para Smart Fit', 'warn')
  }

  return (
    <div className="fixed inset-0 bg-[var(--bg)] z-[500] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Background ambient glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#FFB800] opacity-[0.05] blur-[120px] rounded-full pointer-events-none" />

      <div className="w-full max-w-[460px] bg-[var(--surface)] border border-[var(--border-color)] rounded-3xl p-6 sm:p-8 flex flex-col items-center gap-6 shadow-2xl relative z-10">
        
        {/* Brand Header */}
        <div className="text-center">
          <div className="font-bebas text-5xl tracking-widest text-accent leading-none">
            GYM<span className="text-[var(--text)]">TRACK</span>
          </div>
          <h2 className="font-bebas text-2xl tracking-wider text-[var(--text)] mt-3">
            ELIGE TU GIMNASIO
          </h2>
          <p className="text-xs text-[var(--muted)] mt-1 max-w-[320px] mx-auto leading-relaxed">
            Selecciona la cadena o centro de entrenamiento para calibrar tus máquinas, rutinas y ejercicios.
          </p>
        </div>

        {/* Gym Options Grid */}
        <div className="w-full flex flex-col gap-3.5">
          
          {/* Smart Fit Option (Active) */}
          <div
            onClick={handleSelectSmartFit}
            className="group relative bg-[var(--surface2)] hover:bg-[var(--surface)] border-2 border-[#FFB800]/50 hover:border-[#FFB800] rounded-2xl p-4 cursor-pointer transition-all duration-200 shadow-md hover:shadow-[0_8px_25px_rgba(255,184,0,0.15)] flex flex-col gap-2"
          >
            {/* Active Pill Badge */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="w-9 h-9 rounded-xl bg-[#FFB800]/15 border border-[#FFB800]/30 flex items-center justify-center text-xl">
                  🟡
                </span>
                <div>
                  <h3 className="font-bebas text-xl tracking-wider text-[var(--text)] group-hover:text-[#FFB800] transition-colors leading-none">
                    SMART FIT
                  </h3>
                  <span className="text-[10px] text-[var(--muted)] tracking-widest uppercase font-semibold">
                    Red Oficial
                  </span>
                </div>
              </div>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-[#FFB800]/15 text-[#FFB800] border border-[#FFB800]/30">
                <span className="w-1.5 h-1.5 rounded-full bg-[#FFB800] animate-pulse" />
                DISPONIBLE
              </span>
            </div>

            <p className="text-xs text-[var(--muted)] leading-relaxed pl-11">
              Máquinas numeradas, zonas musculares sincronizadas y seguimiento de series con timer en segundo plano.
            </p>

            <div className="mt-1 flex items-center justify-between pt-2 border-t border-[var(--border-color)] text-xs font-semibold text-[#FFB800]">
              <span>Ingresar con esta sede</span>
              <span className="group-hover:translate-x-1 transition-transform">→</span>
            </div>
          </div>

          {/* Otros Option (Inactive / Coming Soon) */}
          <div
            onClick={handleSelectOtros}
            className="relative bg-[var(--surface2)]/50 border border-[var(--border-color)] rounded-2xl p-4 cursor-not-allowed opacity-60 hover:opacity-75 transition-all flex flex-col gap-2"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="w-9 h-9 rounded-xl bg-[var(--surface)] border border-[var(--border-color)] flex items-center justify-center text-xl">
                  🏢
                </span>
                <div>
                  <h3 className="font-bebas text-xl tracking-wider text-[var(--muted)] leading-none">
                    OTROS
                  </h3>
                  <span className="text-[10px] text-[var(--muted)] tracking-widest uppercase">
                    Cadenas y gimnasios locales
                  </span>
                </div>
              </div>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-[var(--surface)] text-[var(--muted)] border border-[var(--border-color)]">
                🔒 PRÓXIMAMENTE
              </span>
            </div>

            <p className="text-xs text-[var(--muted)] leading-relaxed pl-11">
              Energy, Pacific, Sportlife, gimnasios de barrio y entrenamientos libres en casa.
            </p>

            <div className="mt-1 flex items-center justify-between pt-2 border-t border-[var(--border-color)] text-xs text-[var(--muted)]">
              <span>No disponible actualmente</span>
              <span className="text-xs">🔒</span>
            </div>
          </div>

        </div>

        {/* Footer info & Logout */}
        <div className="w-full flex items-center justify-between pt-2 border-t border-[var(--border-color)]">
          <span className="text-[11px] text-[var(--muted)] truncate max-w-[200px]">
            {isDemoMode ? 'Modo Demo' : currentUser?.email || 'Sesión iniciada'}
          </span>
          <button
            onClick={onLogout}
            className="text-xs text-[var(--muted)] hover:text-[var(--down)] transition-colors underline cursor-pointer"
          >
            Cerrar sesión
          </button>
        </div>

      </div>
    </div>
  )
}
