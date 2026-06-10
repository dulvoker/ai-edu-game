import { Link } from 'react-router-dom'
import { tests } from '../data/content'

export default function TestsPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900">Tests</h1>
      <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-6">
        {tests.map((test) => (
          <Link
            key={test.id}
            to={`/tests/${test.id}`}
            className="block p-6 bg-white rounded-xl border border-gray-200 hover:border-blue-400 hover:shadow-md transition-all group"
          >
            <h2 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
              {test.title}
            </h2>
          </Link>
        ))}
      </div>
    </div>
  )
}
