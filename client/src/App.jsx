import { useContext } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import ProfilePage from './pages/ProfilePage'
import { Toaster } from 'react-hot-toast'
import { AuthContext } from '../context/AuthContext'
import assets from "./assets/assets";

const App = () => {
  const { authUser, authLoading } = useContext(AuthContext);

  if (authLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-[url('/bgImage.svg')] bg-cover bg-center text-white">

        <img
          src={assets.logo_icon}
          alt="Lumo"
          className="w-16 animate-pulse"
        />

        <div className="w-8 h-8 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>

        <p className="text-sm text-gray-300 tracking-wide">
          Connecting to Lumo...
        </p>
      </div>
    );
  }

  return (
    <div className="bg-[url('/bgImage.svg')] bg-cover bg-center bg-no-repeat">
      <Toaster />
      <Routes>
        <Route path='/' element={authUser ? <HomePage /> : <Navigate to="/login" />} />
        <Route path='/login' element={!authUser ? <LoginPage /> : <Navigate to="/" />} />
        <Route path='/profile' element={authUser ? <ProfilePage /> : <Navigate to="/login" />} />
      </Routes>
    </div>
  )
}

export default App