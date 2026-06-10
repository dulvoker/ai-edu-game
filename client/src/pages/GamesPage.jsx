import { Link } from 'react-router-dom'
import { games } from '../data/content'

export default function GamesPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900">Games</h1>
      <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-6">
        {games.map((game) => (
          <Link
            key={game.id}
            to={`/games/${game.id}`}
            className="block p-6 bg-white rounded-xl border border-gray-200 hover:border-blue-400 hover:shadow-md transition-all group"
          >
            <h2 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
              {game.title}
            </h2>
            <p className="mt-2 text-sm text-gray-500">{game.description}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}
