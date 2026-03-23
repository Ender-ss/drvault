import { FileText, Image, Folder, CheckCircle } from "lucide-react"
import { Card } from "../components/ui/Card"
import { Badge } from "../components/ui/Badge"
import { mockCopies } from "../data/mock"

export default function Dashboard() {
  const stats = [
    { label: "Copies", value: "3", icon: FileText },
    { label: "Mídia", value: "14", icon: Image },
    { label: "Modelos", value: "2", icon: Folder },
    { label: "Validados", value: "3", icon: CheckCircle },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-[var(--color-text-muted)] mt-1">Visão geral da sua biblioteca de Direct Response</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[var(--color-text-muted)]">{stat.label}</p>
                <p className="text-3xl font-bold mt-2">{stat.value}</p>
              </div>
              <div className="p-3 bg-[var(--color-surface-hover)] rounded-lg">
                <stat.icon className="h-5 w-5 text-[var(--color-brand)]" />
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold tracking-tight">Copies Recentes</h2>
        <Card className="divide-y divide-[var(--color-border)]">
          {mockCopies.map((copy) => (
            <div key={copy.id} className="flex items-center justify-between p-4 hover:bg-[var(--color-surface-hover)] transition-colors">
              <div className="flex items-start gap-3">
                <div className="mt-1 bg-[var(--color-surface)] border border-[var(--color-border)] p-2 rounded-md">
                  <FileText className="h-4 w-4 text-[var(--color-text-muted)]" />
                </div>
                <div>
                  <h3 className="font-medium text-sm text-[var(--color-text)]">{copy.title}</h3>
                  <p className="text-xs text-[var(--color-text-muted)] mt-1">
                    {copy.authors.join(" e ")} · {copy.niche}
                  </p>
                </div>
              </div>
              <div>
                <Badge variant={copy.status === "Validado" ? "success" : "default"}>
                  {copy.status.toLowerCase()}
                </Badge>
              </div>
            </div>
          ))}
        </Card>
      </div>
    </div>
  )
}
