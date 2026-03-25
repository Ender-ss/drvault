import { Link, useLocation } from "react-router-dom"
import { LayoutDashboard, FileText, Library, Folder, Settings, Youtube, Anchor, LogOut } from "lucide-react"
import { cn } from "../../lib/utils"
import { useAuth } from "../../contexts/AuthContext"

const navItems = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Copies", href: "/copies", icon: FileText },
  { name: "Biblioteca", href: "/library", icon: Library },
  { name: "Tipos de Ads", href: "/ad-types", icon: Youtube },
  { name: "Hooks Library", href: "/hooks-library", icon: Anchor },
  { name: "Modelos", href: "/templates", icon: Folder },
  { name: "Configurações", href: "/settings", icon: Settings },
]

export function Sidebar() {
  const location = useLocation()
  const { user, logout } = useAuth()

  return (
    <div className="flex h-screen w-64 flex-col border-r border-[var(--color-border)] bg-[var(--color-surface)] py-6">
      <div className="px-6 pb-8">
        <h1 className="text-xl font-bold tracking-tight text-white flex gap-1 items-center">
          <span className="text-[var(--color-brand)]">DR</span>Vault
        </h1>
        <p className="text-xs text-[var(--color-text-muted)] mt-1">Direct Response Library</p>
      </div>
      
      <nav className="flex-1 space-y-1 px-4">
        {navItems.map((item) => {
          const isActive = location.pathname === item.href || (item.href !== "/" && location.pathname.startsWith(item.href))
          
          return (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                "group flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isActive 
                  ? "bg-[var(--color-brand)]/10 text-[var(--color-brand)]" 
                  : "text-[var(--color-text-muted)] hover:bg-[var(--color-surface-hover)] hover:text-white"
              )}
            >
              <item.icon
                className={cn(
                  "mr-3 h-5 w-5 flex-shrink-0",
                  isActive ? "text-[var(--color-brand)]" : "text-[var(--color-text-muted)] group-hover:text-white"
                )}
                aria-hidden="true"
              />
              {item.name}
            </Link>
          )
        })}
      </nav>

      <div className="mt-auto px-4 pt-6 border-t border-[var(--color-border)]">
        <div className="flex items-center gap-3 px-3 py-3 mb-2">
          <div className="w-8 h-8 rounded-full bg-[var(--color-brand)] flex items-center justify-center text-white font-bold text-xs">
            {user?.name?.[0]?.toUpperCase() || "U"}
          </div>
          <div className="overflow-hidden">
            <p className="text-sm font-semibold truncate text-white">{user?.name}</p>
            <p className="text-[10px] text-[var(--color-text-muted)] truncate">{user?.email}</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="w-full group flex items-center rounded-md px-3 py-2 text-sm font-medium text-red-400 hover:bg-red-400/10 hover:text-red-300 transition-colors"
        >
          <LogOut className="mr-3 h-5 w-5 flex-shrink-0" />
          Sair
        </button>
      </div>
    </div>
  )
}
