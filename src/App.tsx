import { Routes, Route, Navigate } from "react-router-dom"
import { BaseLayout } from "./components/layout/BaseLayout"
import { useTheme } from "./hooks/useTheme"
import { AuthProvider } from "./contexts/AuthContext"
import ProtectedRoute from "./components/auth/ProtectedRoute"

// Lazy load or simply import pages
import Dashboard from "./pages/Dashboard"
import CopiesList from "./pages/CopiesList"
import CopyDetail from "./pages/CopyDetail"
import Library from "./pages/Library"
import AdTypes from "./pages/AdTypes"
import HooksPage from "./pages/HooksPage"
import Templates from "./pages/Templates"
import SettingsPage from "./pages/Settings"
import Login from "./pages/Login"
import Register from "./pages/Register"

function App() {
  useTheme() // Initialize theme on load

  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        <Route element={<ProtectedRoute />}>
          <Route element={<BaseLayout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/copies" element={<CopiesList />} />
            <Route path="/copies/:id" element={<CopyDetail />} />
            <Route path="/library" element={<Library />} />
            <Route path="/ad-types" element={<AdTypes />} />
            <Route path="/hooks-library" element={<HooksPage />} />
            <Route path="/templates" element={<Templates />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  )
}

export default App
