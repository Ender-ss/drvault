import { Link, useLocation } from "react-router-dom"
import { LayoutDashboard, FileText, Library, Folder, Settings, Youtube, Anchor } from "lucide-react"
import { cn } from "../../lib/utils"

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
    </div>
  )
}
