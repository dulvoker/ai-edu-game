import { useParams } from 'react-router-dom'
import { tests } from '../data/content'
import { quizData } from '../tests/quizData'
import QuizRunner from '../tests/QuizRunner'

export default function TestDetailPage() {
  const { id } = useParams()
  const quiz = quizData[id]

  if (quiz) {
    return <QuizRunner title={quiz.title} questions={quiz.questions} />
  }

  const test = tests.find((t) => t.id === id)
  const title = test ? test.title : id

  return (
    <div>
      <h1 className="font-display text-3xl font-bold text-[var(--ink)]">{title}</h1>
      <div className="mt-8 flex items-center justify-center h-64 rounded-[7px] border border-dashed border-[var(--line)] bg-[var(--surface)]">
        <p className="text-[var(--ink-faint)] font-medium">Test coming soon</p>
      </div>
    </div>
  )
}
