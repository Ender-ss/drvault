import { useState, useEffect } from "react"
import { Save, Key, Palette, Layout as LayoutIcon } from "lucide-react"
import { Button } from "../components/ui/Button"
import { Input } from "../components/ui/Input"
import { getAiConfig, saveAiConfig, type AIProvider } from "../services/aiService"
import { useTheme } from "../hooks/useTheme"
import { useLayout } from "../hooks/useLayout"

export default function Settings() {
  const [provider, setProvider] = useState<AIProvider>("openrouter")
  const [apiKey, setApiKey] = useState("")
  const [model, setModel] = useState("")
  const [isSaved, setIsSaved] = useState(false)
  const { theme, setTheme } = useTheme()
  const { layoutMode, setLayoutMode } = useLayout()

  useEffect(() => {
    const config = getAiConfig()
    setProvider(config.provider)
    setApiKey(config.apiKey)
    setModel(config.model)
  }, [])

  const handleProviderChange = (p: AIProvider) => {
    setProvider(p)
    // auto set default models
    if (p === "openrouter") setModel("google/gemini-2.5-flash")
    if (p === "openai") setModel("gpt-4o-mini")
    if (p === "gemini") setModel("gemini-2.5-flash")
  }

  const handleSave = () => {
    saveAiConfig({ provider, apiKey, model })
    setIsSaved(true)
    setTimeout(() => setIsSaved(false), 2000)
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-3 mb-8">
        <h1 className="text-2xl font-bold tracking-tight">Configurações</h1>
      </div>

      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-6 shadow-sm">
        {/* THEME SECTION */}
        <div className="mb-10">
          <h2 className="text-lg font-bold flex items-center gap-2 mb-2">
            <Palette className="w-5 h-5 text-brand" /> Aparência e Tema
          </h2>
          <p className="text-sm text-[var(--color-text-muted)] mb-6">
            Escolha o tema visual (Template) de preferência para o projeto.
          </p>
          <div className="flex gap-4">
            <label className={`flex-1 flex flex-col items-center gap-3 p-4 rounded-lg border cursor-pointer transition-colors ${theme === "dark" ? "border-brand bg-[var(--color-brand)]/5" : "border-[var(--color-border)] hover:bg-[var(--color-surface-hover)]"}`}>
              <input type="radio" className="sr-only" checked={theme === "dark"} onChange={() => setTheme("dark")} />
              <div className="w-full h-20 bg-[#0d1117] rounded-md border border-[#30363d] p-2 flex flex-col gap-2">
                <div className="w-1/3 h-2 bg-[#21262d] rounded" />
                <div className="w-full h-full bg-[#161b22] rounded border border-[#30363d]" />
              </div>
              <span className="font-semibold text-sm">Template Dark</span>
            </label>
            
            <label className={`flex-1 flex flex-col items-center gap-3 p-4 rounded-lg border cursor-pointer transition-colors ${theme === "light" ? "border-brand bg-[var(--color-brand)]/5" : "border-[var(--color-border)] hover:bg-[var(--color-surface-hover)]"}`}>
              <input type="radio" className="sr-only" checked={theme === "light"} onChange={() => setTheme("light")} />
              <div className="w-full h-20 bg-[#f8fafc] rounded-md border border-[#e2e8f0] p-2 flex flex-col gap-2">
                <div className="w-1/3 h-2 bg-[#e2e8f0] rounded" />
                <div className="w-full h-full bg-[#ffffff] rounded border border-[#e2e8f0]" />
              </div>
              <span className="font-semibold text-sm">Template Light</span>
            </label>
          </div>
        </div>

        <div className="w-full h-px bg-[var(--color-border)] my-6" />

        {/* LAYOUT SECTION */}
        <div className="mb-10">
          <h2 className="text-lg font-bold flex items-center gap-2 mb-2">
            <LayoutIcon className="w-5 h-5 text-brand" /> Layout do Editor
          </h2>
          <p className="text-sm text-[var(--color-text-muted)] mb-6">
            Escolha como deseja visualizar o conteúdo (Português/Inglês) dentro do editor de copy.
          </p>
          <div className="flex gap-4">
            <label className={`flex-1 flex flex-col items-center gap-3 p-4 rounded-lg border cursor-pointer transition-colors ${layoutMode === "tabs" ? "border-brand bg-[var(--color-brand)]/5" : "border-[var(--color-border)] hover:bg-[var(--color-surface-hover)]"}`}>
              <input type="radio" className="sr-only" checked={layoutMode === "tabs"} onChange={() => setLayoutMode("tabs")} />
              <div className="w-full h-20 bg-[var(--color-surface-hover)] rounded-md border border-[var(--color-border)] p-2 flex flex-col gap-1">
                <div className="w-full h-3 bg-brand/20 rounded-t border-b border-[var(--color-border)] mb-1" />
                <div className="w-full h-full bg-[var(--color-surface)] rounded border border-[var(--color-border)]" />
              </div>
              <div className="text-center">
                <span className="font-semibold text-sm block">Modo Abas</span>
                <span className="text-[10px] text-[var(--color-text-muted)]">Troca manual de idioma</span>
              </div>
            </label>
            
            <label className={`flex-1 flex flex-col items-center gap-3 p-4 rounded-lg border cursor-pointer transition-colors ${layoutMode === "split" ? "border-brand bg-[var(--color-brand)]/5" : "border-[var(--color-border)] hover:bg-[var(--color-surface-hover)]"}`}>
              <input type="radio" className="sr-only" checked={layoutMode === "split"} onChange={() => setLayoutMode("split")} />
              <div className="w-full h-20 bg-[var(--color-surface-hover)] rounded-md border border-[var(--color-border)] p-2 flex gap-1">
                <div className="flex-1 h-full bg-[var(--color-surface)] rounded border border-[var(--color-border)]" />
                <div className="flex-1 h-full bg-[var(--color-surface)] rounded border border-[var(--color-border)]" />
              </div>
              <div className="text-center">
                <span className="font-semibold text-sm block">Lado a Lado</span>
                <span className="text-[10px] text-[var(--color-text-muted)]">PT / EN simultâneos</span>
              </div>
            </label>
          </div>
        </div>

        <div className="w-full h-px bg-[var(--color-border)] my-6" />

        {/* AI SECTION */}
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-bold flex items-center gap-2 mb-4">
              <Key className="w-5 h-5 text-brand" /> Integração de Inteligência Artificial
            </h2>
          <p className="text-sm text-[var(--color-text-muted)] mb-6">
            Configure sua chave de API para habilitar as funções de tradução automática e verificação de copy.
          </p>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Provedor de IA</label>
              <div className="flex flex-col gap-2">
                <label className="flex items-center gap-3 p-3 rounded-lg border border-[var(--color-border)] cursor-pointer hover:bg-[var(--color-surface-hover)] transition-colors">
                  <input type="radio" name="provider" value="openrouter" checked={provider === "openrouter"} onChange={() => handleProviderChange("openrouter")} className="accent-brand" />
                  <div>
                    <div className="font-semibold text-sm">OpenRouter (Recomendado)</div>
                    <div className="text-xs text-[var(--color-text-muted)]">Acesso unificado a diversos modelos (incluindo Gemini, Claude e Llama).</div>
                  </div>
                </label>
                <label className="flex items-center gap-3 p-3 rounded-lg border border-[var(--color-border)] cursor-pointer hover:bg-[var(--color-surface-hover)] transition-colors">
                  <input type="radio" name="provider" value="openai" checked={provider === "openai"} onChange={() => handleProviderChange("openai")} className="accent-brand" />
                  <div>
                    <div className="font-semibold text-sm">OpenAI (ChatGPT)</div>
                    <div className="text-xs text-[var(--color-text-muted)]">Utilize a chave oficial da OpenAI.</div>
                  </div>
                </label>
                <label className="flex items-center gap-3 p-3 rounded-lg border border-[var(--color-border)] cursor-pointer hover:bg-[var(--color-surface-hover)] transition-colors">
                  <input type="radio" name="provider" value="gemini" checked={provider === "gemini"} onChange={() => handleProviderChange("gemini")} className="accent-brand" />
                  <div>
                    <div className="font-semibold text-sm">Google Gemini</div>
                    <div className="text-xs text-[var(--color-text-muted)]">Utilize a sua chave gratuita do Google AI Studio.</div>
                  </div>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Chave de API (API Key)</label>
              <Input
                type="password"
                placeholder="sk-..."
                value={apiKey}
                onChange={e => setApiKey(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Modelo da IA</label>
              <Input
                type="text"
                placeholder="Ex: gpt-4o-mini"
                value={model}
                onChange={e => setModel(e.target.value)}
              />
              <p className="text-xs text-[var(--color-text-muted)] mt-1">
                Padrões: openai (gpt-4o-mini), openrouter (google/gemini-2.5-flash), gemini (gemini-2.5-flash).
              </p>
            </div>
          </div>
        </div>

        </div> {/* fechamento do space-y-6 */}

        <div className="pt-6 mt-6 border-t border-[var(--color-border)] flex justify-end">
          <Button variant="brand" onClick={handleSave}>
            {isSaved ? <span className="flex items-center gap-2">Salvo!</span> : <span className="flex items-center gap-2"><Save className="w-4 h-4" /> Salvar Configurações</span>}
          </Button>
        </div>
      </div>
    </div>
  )
}
