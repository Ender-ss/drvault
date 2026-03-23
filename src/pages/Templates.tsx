import { FileText, Plus } from "lucide-react"
import { Card } from "../components/ui/Card"
import { Button } from "../components/ui/Button"

export default function Templates() {
  const templates = [
    { title: "Estrutura F273 VSL", description: "O esqueleto principal para copies de saúde do funil F273." },
    { title: "Briefing de Edição Padrão", description: "Documento base para preencher e enviar aos editores de vídeo." },
    { title: "Planilha de Referências", description: "Template de Google Sheets para organizar links de b-rolls e referências médicas." },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Modelos</h1>
          <p className="text-[var(--color-text-muted)] mt-1">Templates e documentos de referência para a equipe</p>
        </div>
        <Button variant="brand"><Plus className="w-4 h-4 mr-2" /> Novo Modelo</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
        {templates.map((tpl) => (
          <Card key={tpl.title} className="p-6 hover:border-[var(--color-brand)]/50 transition-colors cursor-pointer group">
            <div className="h-12 w-12 rounded-lg bg-[var(--color-brand)]/10 flex items-center justify-center mb-4 group-hover:bg-[var(--color-brand)]/20 transition-colors">
              <FileText className="h-6 w-6 text-[var(--color-brand)]" />
            </div>
            <h3 className="text-lg font-semibold mb-2">{tpl.title}</h3>
            <p className="text-sm text-[var(--color-text-muted)] leading-relaxed">
              {tpl.description}
            </p>
          </Card>
        ))}
      </div>
    </div>
  )
}
