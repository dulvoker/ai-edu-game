import { useParams } from 'react-router-dom'
import { games } from '../data/content'
import SearchGame from '../games/SearchGame'
import DecisionTreeGame from '../games/DecisionTreeGame'
import TreeTraversalGame from '../games/TreeTraversalGame'
import RLGame from '../games/RLGame'
import NaiveBayesGame from '../games/NaiveBayesGame'

const GAME_COMPONENTS = {
  search: SearchGame,
  'decision-tree': DecisionTreeGame,
  'tree-traversal': TreeTraversalGame,
  'reinforcement-learning': RLGame,
  'naive-bayes': NaiveBayesGame,
}

export default function GameDetailPage() {
  const { id } = useParams()
  const GameComponent = GAME_COMPONENTS[id]
  if (GameComponent) return <GameComponent />

  const game = games.find((g) => g.id === id)
  return (
    <div>
      <h1 className="font-display text-3xl font-bold text-[var(--ink)]">{game?.title ?? id}</h1>
      {game && <p className="mt-2 text-[var(--ink-soft)]">{game.description}</p>}
      <div className="mt-8 flex items-center justify-center h-64 rounded-[7px] border border-dashed border-[var(--line)] bg-[var(--surface)]">
        <p className="text-[var(--ink-faint)] font-medium">Game coming soon</p>
      </div>
    </div>
  )
}
