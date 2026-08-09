import { Link } from 'react-router-dom'
import GraphPulseCanvas from '../components/GraphPulseCanvas'

export default function HomePage() {
  return (
    <div className="relative pt-[76px] pb-16">
      <div
        className="absolute pointer-events-none opacity-90"
        style={{ top: -20, left: -28, right: -28, height: 380 }}
      >
        <GraphPulseCanvas width={1200} height={380} className="w-full h-full" />
      </div>

      <div className="relative max-w-[620px]">
        <span className="inline-flex items-center gap-2 rounded-md bg-[var(--accent-soft)] text-[var(--accent-ink)] text-[11.5px] font-bold uppercase tracking-[0.14em] pl-2 pr-2.5 py-[5px] mb-[22px]">
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)]" />
          five interactive algorithms, zero slides
        </span>

        <h1 className="font-display font-extrabold text-[46px] leading-[1.06] text-[var(--ink)]" style={{ textWrap: 'balance' }}>
          Learn how algorithms
          <br />
          think — by <em className="not-italic text-[var(--accent)]">running</em>
          <br />
          them yourself.
        </h1>

        <p className="mt-[22px] text-lg leading-[1.6] text-[var(--ink-soft)] max-w-[46ch]">
          Traverse a maze with BFS. Split creatures with a decision tree. Train an agent that
          learns from its own mistakes. Every concept here is something you operate, not something
          you read about.
        </p>

        <div className="flex gap-3 mt-8">
          <Link
            to="/games"
            className="font-display font-bold text-[13.5px] tracking-[0.01em] px-5 py-3 rounded-[7px] bg-[var(--accent)] text-[var(--on-accent)] inline-flex items-center gap-2 hover:-translate-y-px transition-transform"
          >
            Browse games →
          </Link>
          <Link
            to="/tests"
            className="font-display font-bold text-[13.5px] tracking-[0.01em] px-5 py-3 rounded-[7px] bg-[var(--surface)] text-[var(--ink)] shadow-[inset_0_0_0_1px_var(--line)] inline-flex items-center gap-2 hover:-translate-y-px transition-transform"
          >
            Take a test
          </Link>
        </div>
      </div>
    </div>
  )
}
