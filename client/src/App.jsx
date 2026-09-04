import { useContext } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import ProfilePage from './pages/ProfilePage'
import { Toaster } from 'react-hot-toast'
import { AuthContext } from '../context/AuthContext'
import lumoMark from "./assets/branding/lumo-mark.svg";

const App = () => {
  const { authUser, authLoading } = useContext(AuthContext);

  if (authLoading) {
    return (
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#0B0B0F] text-white">

        {/* Ambient background glow */}
        <div
          className="
          pointer-events-none
          absolute
          left-1/2
          top-1/2
          h-[420px]
          w-[420px]
          -translate-x-1/2
          -translate-y-1/2
          rounded-full
          bg-violet-600/[0.10]
          blur-[130px]
        "
        />

        <div
          className="
          relative
          z-10
          flex
          flex-col
          items-center
          gap-5
        "
        >
          <img
            src={lumoMark}
            alt="Lumo"
            className="
            h-20
            w-20
            object-contain
            animate-pulse
          "
          />

          <div className="flex flex-col items-center gap-3">

            <div
              className="
              h-6
              w-6
              animate-spin
              rounded-full
              border-2
              border-white/[0.12]
              border-t-violet-400
            "
            />

            <p
              className="
              text-xs
              font-medium
              tracking-[0.04em]
              text-zinc-500
            "
            >
              Connecting to Lumo...
            </p>

          </div>

        </div>

      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B0B0F] text-white">
      <Toaster />

      <Routes>
        <Route
          path="/"
          element={authUser ? <HomePage /> : <Navigate to="/login" />}
        />

        <Route
          path="/login"
          element={!authUser ? <LoginPage /> : <Navigate to="/" />}
        />

        <Route
          path="/profile"
          element={authUser ? <ProfilePage /> : <Navigate to="/login" />}
        />
      </Routes>
    </div>
  )
}

export default App