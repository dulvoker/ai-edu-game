import { useParams } from 'react-router-dom'

export default function GameDetailPage() {
  const { id } = useParams()
  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900">Game Detail Page</h1>
      <p className="mt-2 text-gray-600">Game ID: <span className="font-mono font-semibold">{id}</span></p>
    </div>
  )
}
