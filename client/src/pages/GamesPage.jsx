import { Link } from 'react-router-dom'
import { games } from '../data/content'

// Small line-drawn icon + CS taxonomy tag per game — purely presentational
// metadata, kept out of content.js since nothing else needs it.
const META = {
  search: {
    tag: 'Graph traversal',
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <circle cx="4" cy="15" r="2" stroke="var(--ink-soft)" strokeWidth="1.5" />
        <circle cx="10" cy="4" r="2" stroke="var(--ink-soft)" strokeWidth="1.5" />
        <circle cx="16" cy="12" r="2" stroke="var(--accent)" strokeWidth="1.5" />
        <path d="M5.7 13.7 L8.5 5.7 M11.3 5.3 L14.7 10.5" stroke="var(--ink-faint)" strokeWidth="1.3" />
      </svg>
    ),
  },
  'decision-tree': {
    tag: 'Supervised · tree',
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <circle cx="10" cy="4" r="2" stroke="var(--ink-soft)" strokeWidth="1.5" />
        <circle cx="4" cy="16" r="2" stroke="var(--ink-soft)" strokeWidth="1.5" />
        <circle cx="16" cy="16" r="2" stroke="var(--accent)" strokeWidth="1.5" />
        <path d="M9 5.6 L5 14.4" stroke="var(--ink-faint)" strokeWidth="1.3" />
        <path d="M11 5.6 L15 14.4" stroke="var(--accent)" strokeWidth="1.3" />
      </svg>
    ),
  },
  'tree-traversal': {
    tag: 'Tree traversal',
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <circle cx="10" cy="4" r="2" stroke="var(--ink-soft)" strokeWidth="1.5" />
        <circle cx="4" cy="16" r="2" stroke="var(--ink-soft)" strokeWidth="1.5" />
        <circle cx="16" cy="16" r="2" stroke="var(--ink-soft)" strokeWidth="1.5" />
        <path d="M9 5.6 L5 14.4M11 5.6 L15 14.4" stroke="var(--ink-faint)" strokeWidth="1.3" />
        <path d="M3 16C6 6 14 6 17 16" stroke="var(--accent)" strokeWidth="1.3" strokeDasharray="1.5 2.5" fill="none" />
      </svg>
    ),
  },
  'reinforcement-learning': {
    tag: 'Sequential decision',
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <rect x="2.5" y="2.5" width="15" height="15" rx="1.5" stroke="var(--ink-faint)" strokeWidth="1.2" />
        <circle cx="6" cy="14" r="1.4" fill="var(--ink-soft)" />
        <path d="M6 14 L10 9 L14 6" stroke="var(--accent)" strokeWidth="1.3" strokeDasharray="1.4 2" />
        <path d="M13.3 5 L14.6 5.4 L14 6.7" stroke="var(--accent)" strokeWidth="1.2" fill="none" />
      </svg>
    ),
  },
  'naive-bayes': {
    tag: 'Supervised · probabilistic',
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <rect x="2.5" y="4.5" width="15" height="11" rx="1.5" stroke="var(--ink-faint)" strokeWidth="1.2" />
        <path d="M2.5 5.5 L10 11 L17.5 5.5" stroke="var(--ink-soft)" strokeWidth="1.2" fill="none" />
        <rect x="4.5" y="12.5" width="2" height="2" fill="var(--ink-faint)" />
        <rect x="7.5" y="11" width="2" height="3.5" fill="var(--accent)" />
      </svg>
    ),
  },
}

export default function GamesPage() {
  return (
    <div className="grid grid-cols-[108px_1fr] gap-x-7 py-2">
      <div className="text-[11.5px] font-bold uppercase tracking-[0.1em] text-[var(--ink-faint)] pt-1 sticky top-5 self-start font-display">
        Games
      </div>
      <div>
        <div className="mb-7 max-w-[56ch]">
          <h1 className="font-display text-[22px] font-bold text-[var(--ink)]">Five concepts, five playgrounds</h1>
          <p className="mt-2 text-[15px] leading-[1.55] text-[var(--ink-soft)]">
            Each one pairs a hands-on simulation with a full written explanation — the theory is
            never more than one click from the game that demonstrates it.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {games.map((game) => (
            <Link
              key={game.id}
              to={`/games/${game.id}`}
              className="group flex flex-col gap-3.5 rounded-[7px] border border-[var(--line)] bg-[var(--surface)] p-5 no-underline hover:border-[var(--accent)] hover:-translate-y-0.5 transition-all"
            >
              <div className="flex items-start justify-between gap-2.5">
                <div className="w-[34px] h-[34px] rounded-md bg-[var(--bg)] shadow-[inset_0_0_0_1px_var(--line)] flex items-center justify-center shrink-0">
                  {META[game.id]?.icon}
                </div>
                <span className="font-display text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--ink-faint)] pt-0.5 text-right">
                  {META[game.id]?.tag}
                </span>
              </div>
              <h3 className="font-display text-[16.5px] font-bold text-[var(--ink)]">{game.title}</h3>
              <p className="text-sm leading-[1.55] text-[var(--ink-soft)] flex-1 m-0">{game.description}</p>
              <span className="font-display text-xs font-bold text-[var(--accent-ink)] group-hover:text-[var(--accent)] flex items-center gap-1.5 transition-colors">
                Enter
                <svg width="12" height="10" viewBox="0 0 12 10" fill="none" className="group-hover:translate-x-1 transition-transform">
                  <path d="M1 5H11M11 5L7 1M11 5L7 9" stroke="currentColor" strokeWidth="1.4" />
                </svg>
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
