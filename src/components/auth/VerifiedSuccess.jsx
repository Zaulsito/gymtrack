export default function VerifiedSuccess({ onContinue }) {
  return (
    <div className="fixed inset-0 bg-[var(--bg)] z-[500] flex items-center justify-center p-6">
      <div className="w-full max-w-[360px] bg-[var(--surface)] border border-[var(--border-color)] rounded-2xl px-8 py-10 flex flex-col items-center gap-6 text-center">
        
        {/* Icono animado */}
        <div className="w-20 h-20 rounded-full bg-[rgba(57,255,20,0.1)] border-2 border-[var(--up)] flex items-center justify-center text-4xl"
          style={{ animation: 'pulse 2s infinite' }}>
          ✅
        </div>

        <div>
          <div className="font-bebas text-[2rem] tracking-widest text-[var(--up)] leading-none mb-2">
            ¡Correo verificado!
          </div>
          <p className="text-sm text-[var(--muted)] leading-relaxed">
            Tu cuenta ha sido verificada exitosamente. Ahora completa tu perfil para empezar a entrenar.
          </p>
        </div>

        <button className="btn-login w-full" onClick={onContinue}>
          COMPLETAR MI PERFIL 🚀
        </button>
      </div>
    </div>
  )
}
