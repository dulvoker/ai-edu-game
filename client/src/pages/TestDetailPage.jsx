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
      <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
      <div className="mt-8 flex items-center justify-center h-64 bg-gray-100 rounded-xl border-2 border-dashed border-gray-300">
        <p className="text-gray-400 font-medium">Test coming soon</p>
      </div>
    </div>
  )
}
