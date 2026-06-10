import { NavLink } from 'react-router-dom'

export default function Navbar() {
  const linkClass = ({ isActive }) =>
    isActive
      ? 'text-blue-600 font-semibold'
      : 'text-gray-600 hover:text-blue-600 transition-colors'

  return (
    <nav className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="max-w-4xl mx-auto flex items-center gap-8">
        <NavLink to="/" className="text-gray-900 font-bold text-lg">
          AI Edu Game
        </NavLink>
        <NavLink to="/games" className={linkClass}>
          Games
        </NavLink>
        <NavLink to="/tests" className={linkClass}>
          Tests
        </NavLink>
      </div>
    </nav>
  )
}
