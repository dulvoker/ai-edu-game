import { useParams } from 'react-router-dom'
import { games } from '../data/content'
import SearchGame from '../games/SearchGame'
import DecisionTreeGame from '../games/DecisionTreeGame'
import TreeTraversalGame from '../games/TreeTraversalGame'

const GAME_COMPONENTS = {
  search: SearchGame,
  'decision-tree': DecisionTreeGame,
  'tree-traversal': TreeTraversalGame,
}

export default function GameDetailPage() {
  const { id } = useParams()
  const GameComponent = GAME_COMPONENTS[id]
  if (GameComponent) return <GameComponent />

  const game = games.find((g) => g.id === id)
  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900">{game?.title ?? id}</h1>
      {game && <p className="mt-2 text-gray-500">{game.description}</p>}
      <div className="mt-8 flex items-center justify-center h-64 bg-gray-100 rounded-xl border-2 border-dashed border-gray-300">
        <p className="text-gray-400 font-medium">Game coming soon</p>
      </div>
    </div>
  )
}
