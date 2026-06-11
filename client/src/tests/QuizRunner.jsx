import { useState } from 'react'

// ── Per-question view ─────────────────────────────────────────

function QuestionView({ question, index, total, onAnswer }) {
  const [chosen, setChosen] = useState(null)  // index of clicked option

  const answered = chosen !== null
  const correct = question.correctIndex

  const handleChoose = (i) => {
    if (answered) return
    setChosen(i)
    onAnswer(i === correct)
  }

  const buttonStyle = (i) => {
    if (!answered) {
      return 'border-gray-200 bg-white text-gray-700 hover:border-blue-400 hover:bg-blue-50'
    }
    if (i === correct) return 'border-green-400 bg-green-50 text-green-800'
    if (i === chosen)  return 'border-red-400 bg-red-50 text-red-700'
    return 'border-gray-100 bg-gray-50 text-gray-400'
  }

  return (
    <div>
      {/* Progress */}
      <div className="mb-6 flex items-center justify-between">
        <p className="text-sm font-medium text-gray-500">
          Question {index + 1} of {total}
        </p>
        <div className="h-1.5 w-40 overflow-hidden rounded-full bg-gray-200">
          <div
            className="h-full rounded-full bg-blue-500 transition-all"
            style={{ width: `${((index + 1) / total) * 100}%` }}
          />
        </div>
      </div>

      {/* Question */}
      <h2 className="text-lg font-semibold text-gray-900">{question.question}</h2>

      {/* Options */}
      <div className="mt-5 space-y-3">
        {question.options.map((opt, i) => (
          <button
            key={i}
            onClick={() => handleChoose(i)}
            disabled={answered}
            className={`w-full rounded-xl border-2 px-4 py-3 text-left text-sm font-medium transition-colors ${buttonStyle(i)}`}
          >
            <span className="mr-3 font-bold">{opt.label})</span>
            {opt.text}
            {answered && i === correct && (
              <span className="ml-2 text-green-600">✓</span>
            )}
            {answered && i === chosen && i !== correct && (
              <span className="ml-2 text-red-500">✗</span>
            )}
          </button>
        ))}
      </div>

      {/* Explanation */}
      {answered && (
        <div className={`mt-5 rounded-xl border p-4 text-sm leading-relaxed ${
          chosen === correct
            ? 'border-green-200 bg-green-50 text-green-800'
            : 'border-blue-100 bg-blue-50 text-blue-800'
        }`}>
          <span className="font-semibold">
            {chosen === correct ? '✓ Correct! ' : 'Not quite — '}
          </span>
          {question.explanation}
        </div>
      )}
    </div>
  )
}

// ── Results screen ────────────────────────────────────────────

function ResultsScreen({ questions, answers, onRetry }) {
  const score = answers.filter(Boolean).length
  const total = questions.length
  const pct = Math.round((score / total) * 100)

  const scoreColor =
    pct === 100 ? 'text-green-600' :
    pct >= 50   ? 'text-yellow-600' :
                  'text-red-600'

  return (
    <div>
      {/* Score summary */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 text-center">
        <p className={`text-5xl font-bold ${scoreColor}`}>
          {score}/{total}
        </p>
        <p className="mt-1 text-gray-500">correct</p>
        <p className={`mt-2 text-sm font-medium ${scoreColor}`}>
          {pct === 100 ? '🎉 Perfect score!' :
           pct >= 75   ? 'Great work!' :
           pct >= 50   ? 'Good effort — review the explanations below.' :
                         'Keep practising!'}
        </p>
      </div>

      {/* Per-question breakdown */}
      <div className="mt-6 space-y-3">
        {questions.map((q, i) => {
          const wasCorrect = answers[i]
          const chosen = answers[i] === true
            ? q.correctIndex
            : null  // we only store pass/fail, so show correct answer either way

          return (
            <div
              key={i}
              className={`rounded-xl border-2 p-4 ${
                wasCorrect ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
              }`}
            >
              <div className="flex items-start gap-3">
                <span className={`mt-0.5 text-sm font-bold ${wasCorrect ? 'text-green-600' : 'text-red-500'}`}>
                  {wasCorrect ? '✓' : '✗'}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800">{q.question}</p>
                  <p className={`mt-1 text-xs font-medium ${wasCorrect ? 'text-green-700' : 'text-red-700'}`}>
                    Correct answer: {q.options[q.correctIndex].label}) {q.options[q.correctIndex].text}
                  </p>
                  <p className="mt-1 text-xs text-gray-500 leading-relaxed">{q.explanation}</p>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <button
        onClick={onRetry}
        className="mt-6 w-full rounded-xl bg-blue-600 py-3 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
      >
        Try again
      </button>
    </div>
  )
}

// ── Main QuizRunner ───────────────────────────────────────────

export default function QuizRunner({ title, questions }) {
  const [current, setCurrent] = useState(0)
  const [answers, setAnswers] = useState([])       // array of booleans
  const [answered, setAnswered] = useState(false)  // has the current question been answered
  const [done, setDone] = useState(false)

  const handleAnswer = (correct) => {
    setAnswers(prev => [...prev, correct])
    setAnswered(true)
  }

  const handleNext = () => {
    if (current + 1 >= questions.length) {
      setDone(true)
    } else {
      setCurrent(c => c + 1)
      setAnswered(false)
    }
  }

  const handleRetry = () => {
    setCurrent(0)
    setAnswers([])
    setAnswered(false)
    setDone(false)
  }

  if (done) {
    return (
      <div>
        <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
        <div className="mt-6">
          <ResultsScreen
            questions={questions}
            answers={answers}
            onRetry={handleRetry}
          />
        </div>
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
      <div className="mt-6 max-w-2xl">
        {/* Re-mount QuestionView when index changes so state resets cleanly */}
        <QuestionView
          key={current}
          question={questions[current]}
          index={current}
          total={questions.length}
          onAnswer={handleAnswer}
        />

        {answered && (
          <button
            onClick={handleNext}
            className="mt-6 rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
          >
            {current + 1 >= questions.length ? 'See results' : 'Next question →'}
          </button>
        )}
      </div>
    </div>
  )
}
