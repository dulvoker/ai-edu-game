import { NavLink } from 'react-router-dom'

export default function Navbar() {
  const linkClass = ({ isActive }) =>
    `px-3.5 py-2 rounded-md text-[13.5px] font-semibold tracking-[0.01em] transition-colors ${
      isActive
        ? 'text-[var(--ink)] bg-[var(--surface)] shadow-[inset_0_0_0_1px_var(--line)]'
        : 'text-[var(--ink-soft)] hover:text-[var(--ink)] hover:bg-[var(--surface)]'
    }`

  return (
    <nav className="border-b border-[var(--line)]">
      <div className="max-w-[1040px] mx-auto px-7 py-[22px] flex items-center justify-between">
        <NavLink to="/" className="flex items-baseline gap-2 no-underline">
          <span className="font-display text-[var(--accent)] font-extrabold text-xl leading-none">◆</span>
          <span className="font-display font-bold text-[16.5px] tracking-[-0.01em] text-[var(--ink)]">
            ai&nbsp;edu<span className="text-[var(--ink-faint)] font-medium">.game</span>
          </span>
        </NavLink>
        <div className="flex items-center gap-1.5">
          <NavLink to="/games" className={linkClass}>Games</NavLink>
          <NavLink to="/tests" className={linkClass}>Tests</NavLink>
        </div>
      </div>
    </nav>
  )
}
