// src/lib/ollama.ts

export interface OllamaResponse {
  model: string;
  created_at: string;
  response: string;
  done: boolean;
}

/**
 * Servicio centralizado para comunicación con Ollama en La Fábrica.
 * Reemplaza definitivamente la dependencia de Gemini para el flujo local.
 */
export const callOllama = async (prompt: string, options: { model?: string, format?: "json" } = {}) => {
  // Usamos gemma3:4b como cerebro predeterminado (Ligero y eficiente)
  const model = options.model || "gemma3:4b";
  
  try {
    const response = await fetch("http://localhost:11434/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: model,
        prompt: prompt,
        stream: false,
        format: options.format === "json" ? "json" : undefined,
        options: {
          temperature: 0.7,
          num_ctx: 32000, // Ajustado para el contexto de Gemma 4
          top_p: 0.9
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Ollama API Error (${response.status}): ${errorText}`);
    }

    const data: OllamaResponse = await response.json();
    
    if (options.format === "json") {
      try {
        // Limpiamos posibles caracteres extraños de la respuesta (Markdown blocks, etc.)
        const cleaned = data.response.replace(/```json\n?|```/g, '').trim();
        return JSON.parse(cleaned);
      } catch (e) {
        console.warn("Retrying JSON parse with raw response...");
        try {
            return JSON.parse(data.response);
        } catch (e2) {
            console.error("Fallo total al parsear JSON de Ollama:", data.response);
            return { error: "PARSING_ERROR", raw: data.response };
        }
      }
    }

    return data.response;
  } catch (error) {
    console.error("[OLLAMA_LOCAL_CLIENT_ERROR]", error);
    throw error;
  }
};

/**
 * Utilidad para verificar si Ollama está respondiendo.
 */
export const checkOllamaStatus = async () => {
  try {
    const res = await fetch("http://localhost:11434/api/tags");
    return res.ok;
  } catch {
    return false;
  }
};
