import { Link } from 'react-router-dom'
import { tests } from '../data/content'

export default function TestsPage() {
  return (
    <div className="grid grid-cols-[108px_1fr] gap-x-7 py-2">
      <div className="text-[11.5px] font-bold uppercase tracking-[0.1em] text-[var(--ink-faint)] pt-1 sticky top-5 self-start font-display">
        Tests
      </div>
      <div>
        <div className="mb-7 max-w-[56ch]">
          <h1 className="font-display text-[22px] font-bold text-[var(--ink)]">Check what actually stuck</h1>
          <p className="mt-2 text-[15px] leading-[1.55] text-[var(--ink-soft)]">
            Short multiple-choice quizzes for each concept, with an explanation attached to every answer.
          </p>
        </div>

        <div className="flex flex-col border-t border-[var(--line)]">
          {tests.map((test, i) => (
            <Link
              key={test.id}
              to={`/tests/${test.id}`}
              className="group flex items-center justify-between gap-5 py-[18px] px-1 border-b border-[var(--line)] no-underline"
            >
              <div className="flex items-baseline gap-3.5">
                <span className="font-display text-xs text-[var(--ink-faint)] w-[22px] tabular-nums">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span className="font-display text-[15.5px] font-bold text-[var(--ink)] group-hover:text-[var(--accent)] transition-colors">
                  {test.title}
                </span>
                {test.description && (
                  <span className="text-[13.5px] text-[var(--ink-soft)]">{test.description}</span>
                )}
              </div>
              <span className="text-[var(--ink-faint)]">→</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
