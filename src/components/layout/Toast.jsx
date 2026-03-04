import { useApp } from '../../context/AppContext'

export default function Toast() {
  const { toast } = useApp()

  return (
    <div className={`
      fixed bottom-20 left-1/2 -translate-x-1/2
      bg-[var(--surface2)] border border-[var(--border-color)]
      rounded-full px-5 py-2 text-sm text-[var(--text)]
      pointer-events-none z-[500] whitespace-nowrap
      transition-all duration-300
      ${toast.visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
      ${toast.type === 'ok'   ? 'border-[rgba(57,255,20,0.4)] text-[var(--up)]'   : ''}
      ${toast.type === 'warn' ? 'border-[rgba(255,215,0,0.4)] text-[var(--hold)]' : ''}
    `}>
      {toast.msg}
    </div>
  )
}
