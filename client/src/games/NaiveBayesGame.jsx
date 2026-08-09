import { useState, useMemo } from 'react'

// ── Email pool (hardcoded, 15 spam + 15 not spam) ────────────────

const SPAM_EMAILS = [
  { subject: 'You have WON a PRIZE!',                       keywords: ['WIN', 'PRIZE', 'CLAIM', 'FREE', 'URGENT'] },
  { subject: 'URGENT: Claim your FREE cash now',             keywords: ['URGENT', 'FREE', 'CASH', 'CLAIM', 'GUARANTEED'] },
  { subject: 'LIMITED time OFFER - EARN millions',           keywords: ['LIMITED', 'OFFER', 'EARN', 'MILLION', 'DEAL'] },
  { subject: 'Congratulations WINNER - click to collect',    keywords: ['WINNER', 'CLICK', 'FREE', 'CLAIM', 'PRIZE'] },
  { subject: 'Make money FAST - GUARANTEED results',         keywords: ['EARN', 'GUARANTEED', 'CASH', 'URGENT', 'WIN'] },
  { subject: 'You are our lucky WINNER this month',          keywords: ['WINNER', 'FREE', 'PRIZE', 'LIMITED', 'CLAIM'] },
  { subject: 'EXCLUSIVE DEAL - act now or miss out',         keywords: ['DEAL', 'LIMITED', 'URGENT', 'OFFER', 'CLICK'] },
  { subject: 'FREE gift waiting - CLAIM before midnight',    keywords: ['FREE', 'CLAIM', 'URGENT', 'WIN', 'PRIZE'] },
  { subject: 'Double your CASH with our GUARANTEED plan',    keywords: ['CASH', 'GUARANTEED', 'EARN', 'MILLION', 'DEAL'] },
  { subject: 'CLICK here to WIN your PRIZE today',           keywords: ['CLICK', 'WIN', 'PRIZE', 'FREE', 'URGENT'] },
  { subject: 'Special OFFER just for you - LIMITED spots',   keywords: ['OFFER', 'LIMITED', 'DEAL', 'EARN', 'CLICK'] },
  { subject: 'Your MILLION dollar opportunity awaits',       keywords: ['MILLION', 'EARN', 'GUARANTEED', 'CASH', 'WIN'] },
  { subject: 'Act fast - FREE CASH giveaway ending soon',    keywords: ['FREE', 'CASH', 'URGENT', 'CLAIM', 'LIMITED'] },
  { subject: 'WINNER selected - verify to CLAIM now',        keywords: ['WINNER', 'CLAIM', 'URGENT', 'PRIZE', 'CLICK'] },
  { subject: 'Unlock your GUARANTEED EARNINGS today',        keywords: ['GUARANTEED', 'EARN', 'CASH', 'MILLION', 'OFFER'] },
].map((e, i) => ({ id: `spam-${i}`, label: 'spam', ...e }))

const NOT_SPAM_EMAILS = [
  { subject: 'Team meeting agenda for Friday',               keywords: ['meeting', 'agenda', 'team', 'schedule', 'confirm'] },
  { subject: 'Invoice attached for last month',               keywords: ['invoice', 'budget', 'confirm', 'project', 'review'] },
  { subject: 'Project update - deadline reminder',            keywords: ['project', 'deadline', 'update', 'report', 'schedule'] },
  { subject: 'Please review the proposal',                    keywords: ['review', 'proposal', 'team', 'budget', 'confirm'] },
  { subject: 'Weekly report ready for review',                keywords: ['report', 'review', 'update', 'schedule', 'team'] },
  { subject: 'Budget approval needed by Friday',               keywords: ['budget', 'deadline', 'confirm', 'proposal', 'meeting'] },
  { subject: "Schedule change for tomorrow's meeting",         keywords: ['schedule', 'meeting', 'update', 'team', 'agenda'] },
  { subject: 'New project proposal attached',                 keywords: ['proposal', 'project', 'review', 'budget', 'deadline'] },
  { subject: 'Confirming our meeting for next week',           keywords: ['confirm', 'meeting', 'schedule', 'agenda', 'team'] },
  { subject: 'Q3 report - please review before deadline',      keywords: ['report', 'review', 'deadline', 'project', 'update'] },
  { subject: 'Team update on budget proposal',                 keywords: ['team', 'budget', 'proposal', 'update', 'confirm'] },
  { subject: 'Action required: invoice confirmation',          keywords: ['invoice', 'confirm', 'deadline', 'budget', 'review'] },
  { subject: 'Project deadline extended - new schedule',       keywords: ['deadline', 'schedule', 'project', 'update', 'team'] },
  { subject: 'Agenda for quarterly review meeting',            keywords: ['agenda', 'review', 'meeting', 'report', 'confirm'] },
  { subject: 'Proposal review session - please confirm',       keywords: ['proposal', 'review', 'confirm', 'meeting', 'schedule'] },
].map((e, i) => ({ id: `notspam-${i}`, label: 'not_spam', ...e }))

const ALL_EMAILS = [...SPAM_EMAILS, ...NOT_SPAM_EMAILS]

const TRAIN_COUNT = 10
const TEST_COUNT = 5

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// A fresh, balanced session: shuffle the pool, take a training set and a
// test set (kept separate so the classifier is never tested on what it
// just trained on).
function newSession() {
  const shuffled = shuffle(ALL_EMAILS)
  return {
    train: shuffled.slice(0, TRAIN_COUNT),
    test: shuffled.slice(TRAIN_COUNT, TRAIN_COUNT + TEST_COUNT),
  }
}

// ── Naive Bayes model ────────────────────────────────────────────
// Bernoulli-style: for each word, we track how many labelled emails of
// each class contain it. Laplace (add-1) smoothing over the two possible
// outcomes (word present / absent) means denominators add 2.

function emptyModel() {
  return { spamCount: 0, notSpamCount: 0, wordSpam: {}, wordNotSpam: {} }
}

function updateModel(model, email, label) {
  const wordSpam = { ...model.wordSpam }
  const wordNotSpam = { ...model.wordNotSpam }
  for (const w of email.keywords) {
    if (label === 'spam') wordSpam[w] = (wordSpam[w] ?? 0) + 1
    else wordNotSpam[w] = (wordNotSpam[w] ?? 0) + 1
  }
  return {
    spamCount: model.spamCount + (label === 'spam' ? 1 : 0),
    notSpamCount: model.notSpamCount + (label === 'spam' ? 0 : 1),
    wordSpam,
    wordNotSpam,
  }
}

function wordProb(model, word, label) {
  const count = (label === 'spam' ? model.wordSpam : model.wordNotSpam)[word] ?? 0
  const total = label === 'spam' ? model.spamCount : model.notSpamCount
  return (count + 1) / (total + 2)
}

function seenWords(model) {
  return [...new Set([...Object.keys(model.wordSpam), ...Object.keys(model.wordNotSpam)])].sort()
}

function classify(model, email) {
  const totalLabeled = model.spamCount + model.notSpamCount
  const pSpam = model.spamCount / totalLabeled
  const pNotSpam = model.notSpamCount / totalLabeled

  const wordProbs = email.keywords.map(w => ({
    word: w,
    pSpam: wordProb(model, w, 'spam'),
    pNotSpam: wordProb(model, w, 'not_spam'),
  }))

  const scoreSpam = wordProbs.reduce((acc, w) => acc * w.pSpam, pSpam)
  const scoreNotSpam = wordProbs.reduce((acc, w) => acc * w.pNotSpam, pNotSpam)

  return {
    pSpam, pNotSpam, wordProbs, scoreSpam, scoreNotSpam,
    verdict: scoreSpam >= scoreNotSpam ? 'spam' : 'not_spam',
  }
}

// ── Small display helpers ────────────────────────────────────────

function KeywordBadge({ word }) {
  const isSpammy = SPAM_EMAILS.some(e => e.keywords.includes(word)) &&
    !NOT_SPAM_EMAILS.some(e => e.keywords.includes(word))
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${
      isSpammy ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-blue-50 text-blue-700 border border-blue-200'
    }`}>
      {word}
    </span>
  )
}

function ProbabilityTable({ model }) {
  const words = seenWords(model)
  if (words.length === 0) {
    return <p className="text-xs text-gray-400 italic">Label an email to start building the probability table.</p>
  }
  return (
    <div className="overflow-hidden rounded-xl border border-gray-200">
      <table className="w-full text-xs">
        <thead>
          <tr className="bg-gray-50 text-gray-500">
            <th className="px-3 py-2 text-left font-medium">Word</th>
            <th className="px-3 py-2 text-right font-medium">P(word | spam)</th>
            <th className="px-3 py-2 text-right font-medium">P(word | not spam)</th>
          </tr>
        </thead>
        <tbody>
          {words.map(w => {
            const pSpam = wordProb(model, w, 'spam')
            const pNotSpam = wordProb(model, w, 'not_spam')
            const spamHigher = pSpam > pNotSpam
            const notSpamHigher = pNotSpam > pSpam
            return (
              <tr key={w} className="border-t border-gray-100">
                <td className="px-3 py-1.5 font-mono font-semibold text-gray-700">{w}</td>
                <td className={`px-3 py-1.5 text-right font-mono transition-colors ${spamHigher ? 'text-red-600 font-bold' : 'text-gray-500'}`}>
                  {pSpam.toFixed(3)}
                </td>
                <td className={`px-3 py-1.5 text-right font-mono transition-colors ${notSpamHigher ? 'text-green-600 font-bold' : 'text-gray-500'}`}>
                  {pNotSpam.toFixed(3)}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

// ── Tutorial ──────────────────────────────────────────────────

function Tutorial({ onDismiss }) {
  return (
    <div className="max-w-2xl">
      <h1 className="text-3xl font-bold text-gray-900">Naive Bayes Spam Filter</h1>
      <div className="mt-6 space-y-4">
        <div className="rounded-xl border border-blue-100 bg-blue-50 p-5">
          <h2 className="font-semibold text-blue-800">What is Naive Bayes?</h2>
          <p className="mt-2 text-sm leading-relaxed text-blue-700">
            A Naive Bayes classifier decides between two categories — here, <strong>spam</strong> and{' '}
            <strong>not spam</strong> — by looking at which words an email contains and asking: "words like this
            showed up in spam X% of the time, and in normal email Y% of the time — which is more likely?"
          </p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <h2 className="mb-2 font-semibold text-gray-800">Why "naive"?</h2>
          <p className="text-sm leading-relaxed text-gray-600">
            It's called <em>naive</em> because it assumes every word's presence is completely independent of every
            other word — it never asks "do these two words tend to appear together?", it just multiplies each
            word's individual probability. That's a simplification of reality, but it works surprisingly well in
            practice and is easy to compute.
          </p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <h2 className="mb-2 font-semibold text-gray-800">What you'll do</h2>
          <p className="text-sm leading-relaxed text-gray-600">
            First, you'll <strong>train</strong> the filter by labelling emails as Spam or Not Spam yourself,
            watching the word-probability table update live. Then you'll <strong>test</strong> it on new emails and
            watch the classifier work through the math step by step to reach a verdict.
          </p>
        </div>
      </div>
      <button onClick={onDismiss}
        className="mt-6 rounded-lg bg-blue-600 px-6 py-3 font-medium text-white hover:bg-blue-700 transition-colors">
        Got it, let's play
      </button>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────

export default function NaiveBayesGame() {
  const [showTutorial, setShowTutorial] = useState(true)
  const [session, setSession] = useState(newSession)

  // 'train' | 'test' | 'results'
  const [phase, setPhase] = useState('train')

  const [trainIdx, setTrainIdx] = useState(0)
  const [model, setModel] = useState(emptyModel)

  const [testIdx, setTestIdx] = useState(0)
  const [testRevealed, setTestRevealed] = useState(false)
  const [testResults, setTestResults] = useState([]) // { email, result, correct }

  const currentTrainEmail = session.train[trainIdx]
  const currentTestEmail = session.test[testIdx]

  const testResult = useMemo(
    () => (phase === 'test' && currentTestEmail ? classify(model, currentTestEmail) : null),
    [phase, currentTestEmail, model]
  )

  // ── Handlers ─────────────────────────────────────────────────

  const handleLabel = (label) => {
    setModel(m => updateModel(m, currentTrainEmail, label))
    if (trainIdx + 1 >= session.train.length) {
      setPhase('training-done')
    } else {
      setTrainIdx(i => i + 1)
    }
  }

  const handleStartTesting = () => {
    setPhase('test')
    setTestIdx(0)
    setTestRevealed(false)
    setTestResults([])
  }

  const handleReveal = () => setTestRevealed(true)

  const handleNextTestEmail = () => {
    const correct = testResult.verdict === currentTestEmail.label
    setTestResults(r => [...r, { email: currentTestEmail, result: testResult, correct }])
    if (testIdx + 1 >= session.test.length) {
      setPhase('results')
    } else {
      setTestIdx(i => i + 1)
      setTestRevealed(false)
    }
  }

  const handlePlayAgain = () => {
    setSession(newSession())
    setPhase('train')
    setTrainIdx(0)
    setModel(emptyModel())
    setTestIdx(0)
    setTestRevealed(false)
    setTestResults([])
  }

  if (showTutorial) return <Tutorial onDismiss={() => setShowTutorial(false)} />

  // ── Render ────────────────────────────────────────────────────

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900">Naive Bayes Spam Filter</h1>
      <p className="mt-1 text-sm text-gray-400">
        {phase === 'train' || phase === 'training-done'
          ? 'Phase 1 — Train the filter'
          : phase === 'test'
          ? 'Phase 2 — Test the filter'
          : 'Results'}
      </p>

      {/* ── Phase 1: Training ── */}
      {(phase === 'train' || phase === 'training-done') && (
        <div className="mt-6 flex gap-6 items-start flex-wrap xl:flex-nowrap">
          <div className="flex-1 min-w-0" style={{ maxWidth: 420 }}>
            {phase === 'train' && currentTrainEmail && (
              <>
                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-400">
                  Email {trainIdx + 1} of {session.train.length}
                </p>
                <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                  <p className="text-sm font-semibold text-gray-800">{currentTrainEmail.subject}</p>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {currentTrainEmail.keywords.map(w => <KeywordBadge key={w} word={w} />)}
                  </div>
                </div>
                <p className="mt-3 text-xs text-gray-400">How would you label this email?</p>
                <div className="mt-2 flex gap-2">
                  <button onClick={() => handleLabel('spam')}
                    className="flex-1 rounded-lg border-2 border-red-200 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-700 hover:bg-red-100 transition-colors">
                    🚫 Spam
                  </button>
                  <button onClick={() => handleLabel('not_spam')}
                    className="flex-1 rounded-lg border-2 border-green-200 bg-green-50 px-4 py-2.5 text-sm font-semibold text-green-700 hover:bg-green-100 transition-colors">
                    ✅ Not Spam
                  </button>
                </div>
              </>
            )}

            {phase === 'training-done' && (
              <div className="rounded-xl border border-green-200 bg-green-50 p-5">
                <p className="font-semibold text-green-800">Training complete!</p>
                <p className="mt-1 text-sm text-green-700">
                  You labelled {model.spamCount} spam and {model.notSpamCount} not-spam emails.
                  The filter has learned word probabilities from your labels — now let's see how it does on new emails.
                </p>
                <button onClick={handleStartTesting}
                  className="mt-4 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition-colors">
                  Start Testing →
                </button>
              </div>
            )}
          </div>

          <div className="shrink-0 w-full xl:w-auto" style={{ minWidth: 320 }}>
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-400">
              Word probabilities (Laplace-smoothed)
            </p>
            <ProbabilityTable model={model} />
            <p className="mt-2 text-xs text-gray-400">
              P(spam) = {model.spamCount}/{model.spamCount + model.notSpamCount || '—'} · P(not spam) = {model.notSpamCount}/{model.spamCount + model.notSpamCount || '—'}
            </p>
          </div>
        </div>
      )}

      {/* ── Phase 2: Testing ── */}
      {phase === 'test' && currentTestEmail && testResult && (
        <div className="mt-6 max-w-2xl">
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-400">
            Test email {testIdx + 1} of {session.test.length}
          </p>
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-semibold text-gray-800">{currentTestEmail.subject}</p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {currentTestEmail.keywords.map(w => <KeywordBadge key={w} word={w} />)}
            </div>
          </div>

          {/* Step-by-step calculation */}
          <div className="mt-4 rounded-xl border border-gray-200 bg-gray-900 p-4 font-mono text-xs leading-relaxed text-gray-100 overflow-x-auto">
            <p className="text-gray-400">// priors</p>
            <p>P(spam)     = {model.spamCount}/{model.spamCount + model.notSpamCount} = {testResult.pSpam.toFixed(3)}</p>
            <p>P(not spam) = {model.notSpamCount}/{model.spamCount + model.notSpamCount} = {testResult.pNotSpam.toFixed(3)}</p>
            <p className="mt-3 text-gray-400">// per-word likelihoods</p>
            {testResult.wordProbs.map(w => (
              <p key={w.word}>
                P({w.word} | spam) = {w.pSpam.toFixed(3)}   P({w.word} | not spam) = {w.pNotSpam.toFixed(3)}
              </p>
            ))}
            <p className="mt-3 text-gray-400">// combined score = prior × ∏ word likelihoods</p>
            <p>
              Score(spam)     = {testResult.pSpam.toFixed(3)} × {testResult.wordProbs.map(w => w.pSpam.toFixed(3)).join(' × ')} = {testResult.scoreSpam.toExponential(3)}
            </p>
            <p>
              Score(not spam) = {testResult.pNotSpam.toFixed(3)} × {testResult.wordProbs.map(w => w.pNotSpam.toFixed(3)).join(' × ')} = {testResult.scoreNotSpam.toExponential(3)}
            </p>
            <p className={`mt-3 font-bold ${testResult.verdict === 'spam' ? 'text-red-400' : 'text-green-400'}`}>
              Classified as: {testResult.verdict === 'spam' ? 'SPAM' : 'NOT SPAM'}
            </p>
          </div>

          {!testRevealed ? (
            <button onClick={handleReveal}
              className="mt-4 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition-colors">
              Reveal ground truth
            </button>
          ) : (
            <div className={`mt-4 rounded-xl border-2 p-4 flex items-center justify-between ${
              testResult.verdict === currentTestEmail.label
                ? 'border-green-300 bg-green-50'
                : 'border-red-300 bg-red-50'
            }`}>
              <p className="text-sm">
                <span className="font-semibold text-gray-700">Actual label:</span>{' '}
                <span className="font-bold">{currentTestEmail.label === 'spam' ? 'SPAM' : 'NOT SPAM'}</span>{' '}
                {testResult.verdict === currentTestEmail.label
                  ? <span className="text-green-700 font-bold">✓ Correct</span>
                  : <span className="text-red-700 font-bold">✗ Incorrect</span>}
              </p>
              <button onClick={handleNextTestEmail}
                className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition-colors">
                Next Email →
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── Results ── */}
      {phase === 'results' && (
        <div className="mt-6 max-w-xl">
          <div className="flex items-baseline gap-2">
            <span className={`text-4xl font-bold ${
              testResults.filter(r => r.correct).length === testResults.length ? 'text-green-600' : 'text-blue-600'
            }`}>
              {testResults.filter(r => r.correct).length}/{testResults.length}
            </span>
            <span className="text-sm font-medium text-gray-500">Classifier accuracy</span>
          </div>

          <div className="mt-5 space-y-2">
            {testResults.map((r, i) => (
              <div key={i} className={`flex items-center justify-between rounded-lg border px-4 py-2.5 text-sm ${
                r.correct ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
              }`}>
                <span className="text-gray-700">{r.email.subject}</span>
                <span className="flex items-center gap-2 shrink-0">
                  <span className="text-xs text-gray-400">
                    predicted {r.result.verdict === 'spam' ? 'SPAM' : 'NOT SPAM'}, actual {r.email.label === 'spam' ? 'SPAM' : 'NOT SPAM'}
                  </span>
                  {r.correct ? <span className="text-green-600 font-bold">✓</span> : <span className="text-red-600 font-bold">✗</span>}
                </span>
              </div>
            ))}
          </div>

          <button onClick={handlePlayAgain}
            className="mt-5 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition-colors">
            Play Again
          </button>
        </div>
      )}
    </div>
  )
}
