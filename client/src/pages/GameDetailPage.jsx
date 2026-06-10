import { useParams } from 'react-router-dom'
import { games } from '../data/content'

export default function GameDetailPage() {
  const { id } = useParams()
  const game = games.find((g) => g.id === id)
  const title = game ? game.title : id

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
      {game && <p className="mt-2 text-gray-500">{game.description}</p>}
      <div className="mt-8 flex items-center justify-center h-64 bg-gray-100 rounded-xl border-2 border-dashed border-gray-300">
        <p className="text-gray-400 font-medium">Game coming soon</p>
      </div>
    </div>
  )
}
