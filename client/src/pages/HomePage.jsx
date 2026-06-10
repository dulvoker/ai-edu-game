import { Link } from 'react-router-dom'

export default function HomePage() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <h1 className="text-5xl font-bold text-gray-900 tracking-tight">
        AI Edu Game
      </h1>
      <p className="mt-4 text-lg text-gray-500 max-w-md">
        Learn core AI concepts through interactive mini-games
      </p>
      <div className="mt-8 flex gap-4">
        <Link
          to="/games"
          className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          Browse Games
        </Link>
        <Link
          to="/tests"
          className="px-6 py-3 bg-white text-gray-700 font-medium rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
        >
          Take a Test
        </Link>
      </div>
    </div>
  )
}
