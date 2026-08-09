import { Outlet } from 'react-router-dom'
import Navbar from './Navbar'

export default function Layout() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="max-w-[1040px] mx-auto px-7 py-10">
        <Outlet />
      </main>
    </div>
  )
}
