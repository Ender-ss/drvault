export type AIProvider = "openrouter" | "openai" | "gemini"

export interface AIConfig {
  provider: AIProvider
  apiKey: string
  model: string
}

const STORAGE_KEY = 'drvault_ai_config'

export function getAiConfig(): AIConfig {
  const data = localStorage.getItem(STORAGE_KEY)
  if (data) {
    try {
      const parsed = JSON.parse(data)
      // allow fallback if previously saved just string
      if (typeof parsed === 'object') return parsed
    } catch (e) {
      console.warn("Error parsing ai_config:", e)
    }
  }
  // Try fallback to the old key if it exists
  const oldKey = localStorage.getItem('drvault_openrouter_key')
  return { provider: "openrouter", apiKey: oldKey || "", model: "google/gemini-2.5-flash" }
}

export function saveAiConfig(config: AIConfig) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config))
}

// Keep the old getApiKey for backwards compatibility inside CopyDetail prompt
export function getApiKey(): string | null {
  const config = getAiConfig()
  return config.apiKey || null
}

export function saveApiKey(key: string) {
  const config = getAiConfig()
  config.apiKey = key
  saveAiConfig(config)
}

export function removeApiKey() {
  localStorage.removeItem(STORAGE_KEY)
  localStorage.removeItem('drvault_openrouter_key')
}

// Unified call endpoint
export async function callAI(messages: {role: string, content: string}[], config: AIConfig): Promise<string> {
  const { provider, apiKey, model } = config
  if (!apiKey) throw new Error("Chave de API não configurada. Configure na aba Configurações.")

  if (provider === "gemini") {
    // Gemini API natively
    
    // V1Beta supports systemInstruction
    const sysMsg = messages.find(m => m.role === "system")
    const userMsgs = messages.filter(m => m.role !== "system").map(m => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }]
    }))

    const body: any = { contents: userMsgs }
    if (sysMsg) {
      body.systemInstruction = { parts: [{ text: sysMsg.content }] }
    }

    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model || 'gemini-2.5-flash'}:generateContent?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    })
    
    if (!res.ok) throw new Error(`Gemini Error: ${await res.text()}`)
    const data = await res.json()
    return data.candidates?.[0]?.content?.parts?.[0]?.text || ""
  }

  // Both OpenAI and OpenRouter use OpenAI-compatible API
  const url = provider === "openai" ? "https://api.openai.com/v1/chat/completions" : "https://openrouter.ai/api/v1/chat/completions"
  
  const headers: Record<string, string> = {
    "Authorization": `Bearer ${apiKey}`,
    "Content-Type": "application/json"
  }

  if (provider === "openrouter") {
    headers["HTTP-Referer"] = window.location.origin
    headers["X-Title"] = "DRVault"
  }

  const res = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify({
      model: model || (provider === "openai" ? "gpt-4o-mini" : "google/gemini-2.5-flash"),
      messages
    })
  })

  if (!res.ok) throw new Error(`${provider.toUpperCase()} Error: ${await res.text()}`)
  const data = await res.json()
  return data.choices?.[0]?.message?.content || ""
}

export async function translateText(text: string, _apiKey?: string): Promise<string> {
  if (!text) return ""
  const config = getAiConfig()
  const messages = [
    {
      role: "system",
      content: "You are an expert copywriter and translator specializing in direct response marketing. Translate the following Portuguese copy into persuasive, natural-sounding English. Return strictly the translated text, without quotes, explanations, or additional formatting."
    },
    { role: "user", content: text }
  ]
  return callAI(messages, config)
}

export async function verifyTranslation(originalPT: string, translatedEN: string, _apiKey?: string): Promise<string> {
  if (!originalPT || !translatedEN) return ""
  const config = getAiConfig()
  const messages = [
    {
      role: "system",
      content: "You are a direct response copy QA expert. I will provide a Portuguese original text and its English translation. Evaluate the translation for persuasiveness, correct terminology, and natural flow. Provide a short, constructive feedback (in Portuguese) followed by an improved English version if necessary. Keep your feedback concise (max 3-4 sentences), and put the suggested improved text inside an [IMPROVED_EN]...[/IMPROVED_EN] block, or say 'A tradução atual está excelente' if no improvements are needed."
    },
    { role: "user", content: `Original (PT):\n${originalPT}\n\nTradução Atual (EN):\n${translatedEN}` }
  ]
  return callAI(messages, config)
}
