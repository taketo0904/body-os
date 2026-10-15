import type { ReactNode } from 'react'
import { useEffect } from 'react'

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <section className={`rounded-3xl bg-card border border-line/60 p-4 ${className}`}>{children}</section>
}

export function Title({ children, right }: { children: ReactNode; right?: ReactNode }) {
  return (
    <div className="flex items-center justify-between mb-3">
      <h2 className="text-[13px] font-semibold tracking-wider text-sub">{children}</h2>
      {right}
    </div>
  )
}

export function Ring({
  value,
  size = 120,
  stroke = 12,
  color = '#c6ff3d',
  children,
}: {
  value: number
  size?: number
  stroke?: number
  color?: string
  children?: ReactNode
}) {
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const v = Math.max(0, Math.min(1, value))
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} stroke="#232326" strokeWidth={stroke} fill="none" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={color}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - v)}
          style={{ transition: 'stroke-dashoffset .5s ease' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">{children}</div>
    </div>
  )
}

export function Bar({ value, color = '#c6ff3d' }: { value: number; color?: string }) {
  const over = value > 1
  return (
    <div className="h-2 rounded-full bg-[#232326] overflow-hidden">
      <div
        className="h-full rounded-full transition-all"
        style={{ width: `${Math.min(100, Math.max(0, value * 100))}%`, background: over ? '#ff453a' : color }}
      />
    </div>
  )
}

export function Btn({
  children,
  onClick,
  variant = 'primary',
  type = 'button',
  disabled,
  className = '',
}: {
  children: ReactNode
  onClick?: () => void
  variant?: 'primary' | 'ghost' | 'danger'
  type?: 'button' | 'submit'
  disabled?: boolean
  className?: string
}) {
  const styles = {
    primary: 'bg-accent text-black',
    ghost: 'bg-card2 text-white border border-line',
    danger: 'bg-[#2a1214] text-[#ff6b61] border border-[#4a1d20]',
  }[variant]
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`min-h-[48px] px-5 rounded-2xl font-semibold text-[15px] active:scale-[.98] transition disabled:opacity-40 ${styles} ${className}`}
    >
      {children}
    </button>
  )
}

export function Field({
  label,
  value,
  onChange,
  unit,
  inputMode = 'decimal',
  placeholder,
  error,
  type = 'text',
}: {
  label: string
  value: string
  onChange: (v: string) => void
  unit?: string
  inputMode?: 'decimal' | 'numeric' | 'text'
  placeholder?: string
  error?: string
  type?: string
}) {
  return (
    <label className="block">
      <span className="block text-[12px] text-sub mb-1.5">{label}</span>
      <div
        className={`flex items-center rounded-2xl bg-card2 border px-4 ${error ? 'border-[#ff453a]' : 'border-line focus-within:border-accent'}`}
      >
        <input
          type={type}
          inputMode={type === 'text' ? inputMode : undefined}
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          className="w-full min-h-[48px] bg-transparent outline-none tnum"
        />
        {unit && <span className="text-sub text-sm ml-2 shrink-0">{unit}</span>}
      </div>
      {error && <span className="block text-[12px] text-[#ff6b61] mt-1">{error}</span>}
    </label>
  )
}

export function Sheet({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: ReactNode }) {
  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [open])
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-end bg-black/70" onClick={onClose}>
      <div
        className="w-full max-h-[88%] overflow-y-auto rounded-t-3xl bg-card border-t border-line p-5 safe-bottom"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold">{title}</h3>
          <button onClick={onClose} aria-label="閉じる" className="w-10 h-10 -mr-2 rounded-full text-sub text-2xl">
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

export function Notice({ children, tone = 'info' }: { children: ReactNode; tone?: 'info' | 'error' | 'ok' }) {
  const c = { info: 'text-sub bg-card2', error: 'text-[#ff6b61] bg-[#2a1214]', ok: 'text-ok bg-[#10240f]' }[tone]
  return <div className={`rounded-2xl px-4 py-3 text-[13px] leading-relaxed ${c}`}>{children}</div>
}

export function Empty({ children }: { children: ReactNode }) {
  return <p className="text-sub text-sm text-center py-6">{children}</p>
}
