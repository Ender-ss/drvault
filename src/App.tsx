import { Routes, Route } from "react-router-dom"
import { BaseLayout } from "./components/layout/BaseLayout"
import { useTheme } from "./hooks/useTheme"

// Lazy load or simply import pages
import Dashboard from "./pages/Dashboard"
import CopiesList from "./pages/CopiesList"
import CopyDetail from "./pages/CopyDetail"
import Library from "./pages/Library"
import AdTypes from "./pages/AdTypes"
import HooksPage from "./pages/HooksPage"
import Templates from "./pages/Templates"
import SettingsPage from "./pages/Settings"

function App() {
  useTheme() // Initialize theme on load

  return (
    <Routes>
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
    </Routes>
  )
}

export default App
