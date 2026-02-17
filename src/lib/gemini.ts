/**
 * Servicio para interactuar con la API de Google Gemini (v1beta REST)
 * Orientado al Ecosistema Ecomoving (Web + Marketing)
 */

const API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
const BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models";
const MODEL_NAME = "gemini-2.5-flash";

export interface MarketingContent {
    subject: string;
    part1: string;
    part2: string;
    html: string;
}

export interface WebSectionContent {
    title1: string;
    paragraph1: string;
    title2: string;
    paragraph2: string;
}

export const getMarketingHTMLTemplate = (subject: string, p1: string, p2: string) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="background-color:#f4f7f9;font-family:'Helvetica Neue',Arial,sans-serif;margin:0;padding:0;">
  <div style="background-color:#ffffff;margin:20px auto;width:100%;max-width:600px;border-radius:16px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.05);">
    <!-- Logo -->
    <div style="padding:40px 40px 20px;text-align:center;">
      <img src="https://xgdmyjzyejjmwdqkufhp.supabase.co/storage/v1/object/public/logo_ecomoving/Logo_horizontal.png" alt="Ecomoving" width="200" style="width:200px;height:auto;display:inline-block;" />
    </div>
    <!-- Contenido -->
    <div style="padding:20px 40px 40px;text-align:center;">
      <h1 style="font-size:26px;font-weight:800;color:#111827;margin-bottom:24px;line-height:1.3;letter-spacing:-0.5px;">${p1}</h1>
      <p style="font-size:17px;line-height:1.7;color:#4b5563;margin-bottom:30px;">${p2}</p>
      <div style="margin:20px auto;width:100%;max-width:600px;border-radius:12px;overflow:hidden;background-color:#000;">
        <img src="IMAGE_URL_PLACEHOLDER" alt="Producto Ecomoving" width="600" style="width:100%;max-width:600px;height:auto;display:block;margin:0 auto;" />
      </div>
    </div>
    <!-- Pie de Página -->
    <div style="padding:30px 40px;text-align:center;border-top:1px solid #eee;background-color:#fafafa;">
      <p style="font-size:11px;color:#999;margin:0 0 12px 0;line-height:1.5;">Recibiste este mensaje porque eres parte de nuestra red de contactos preferenciales.</p>
      <p style="font-size:13px;color:#666;font-weight:700;margin:0 0 8px 0;">Ecomoving SpA &bull; Santiago, Chile</p>
      <p style="font-size:12px;color:#888;line-height:1.6;margin:0;">
        <a href="https://www.ecomoving.cl" style="color:#00d4bd;text-decoration:none;font-weight:600;">www.ecomoving.cl</a><br/>
        +56 9 7958 7293 / +56 9 9392 4638
      </p>
    </div>
  </div>
</body>
</html>`.trim();

export const generateMarketingAI = async (
    imageSource: string,
    context: string = ""
): Promise<MarketingContent> => {
    if (!API_KEY) throw new Error("GEMINI_API_KEY no está configurada.");

    const base64Data = await prepareImage(imageSource);

    const prompt = `
Analiza el producto en la imagen y genera una copia de marketing profesional en ESPAÑOL.
${context ? `### CONTEXTO ADICIONAL:\n${context}\n` : ''}

Formatea tu respuesta exactamente de esta manera (sin usar Markdown ni asteriscos en las etiquetas):
SUBJECT: [Un asunto corto y enganchador]
PART1: [Párrafo introductorio de 2-3 líneas]
PART2: [Párrafo de cierre o llamado a la acción de 2-3 líneas]

Reglas CRÍTICAS:
- Tono profesional y exclusivo.
- NO menciones marcas visibles en la imagen (son clientes previos).
- Céntrate en la calidad y utilidad del producto sustentable.
`;

    const text = await callGemini(base64Data, prompt);

    const subjectMatch = text.match(/SUBJECT:\s*(.*)/i);
    const part1Match = text.match(/PART1:\s*([\s\S]*?)(?=PART2:|$)/i);
    const part2Match = text.match(/PART2:\s*([\s\S]*)$/i);

    const subject = subjectMatch ? subjectMatch[1].trim() : "Exclusividad Ecomoving";
    const p1 = part1Match ? part1Match[1].trim() : "";
    const p2 = part2Match ? part2Match[1].trim() : "";

    const html = getMarketingHTMLTemplate(subject, p1, p2);

    return { subject, part1: p1, part2: p2, html };
};

/**
 * PATH B: Genera contenido para la Web (Hero/Secciones)
 */
export const generateWebAI = async (
    imageSource: string,
    context: string = ""
): Promise<WebSectionContent> => {
    if (!API_KEY) throw new Error("GEMINI_API_KEY no está configurada.");

    const base64Data = await prepareImage(imageSource);

    const prompt = `
Analiza la imagen y genera contenido SEO premium para una sección de la página web de Ecomoving.
${context ? `### CONTEXTO DEL PRODUCTO:\n${context}\n` : ''}

Formatea tu respuesta exactamente de esta manera:
TITLE_1: [Título principal impactante]
PARAGRAPH_1: [Descripción estratégica de la categoría o producto]
TITLE_2: [Título de refuerzo SEO para el bloque de color]
PARAGRAPH_2: [Texto descriptivo complementario para el bloque de color]

Reglas:
- Tono sofisticado, minimalista y orientado a 2026.
- TITLE_2 debe ser potente y corto para SEO.
- No uses hashtags.
`;

    const text = await callGemini(base64Data, prompt);

    const t1Match = text.match(/TITLE_1:\s*(.*)/i);
    const p1Match = text.match(/PARAGRAPH_1:\s*([\s\S]*?)(?=TITLE_2:|$)/i);
    const t2Match = text.match(/TITLE_2:\s*(.*)/i);
    const p2Match = text.match(/PARAGRAPH_2:\s*([\s\S]*)$/i);

    return {
        title1: t1Match ? t1Match[1].trim() : "",
        paragraph1: p1Match ? p1Match[1].trim() : "",
        title2: t2Match ? t2Match[1].trim() : "",
        paragraph2: p2Match ? p2Match[1].trim() : ""
    };
};

export interface ProductSpecs {
    description: string;
    specs: string[];
    category: string;
    is_premium: boolean;
    name_suggestion?: string;
}

/**
 * PATH C: Genera Ficha Técnica de Producto (Catálogo)
 */
export const generateProductSpecsAI = async (
    imageSource: string,
    context: string = ""
): Promise<ProductSpecs> => {
    if (!API_KEY) throw new Error("GEMINI_API_KEY no está configurada.");

    const base64Data = await prepareImage(imageSource);

    const prompt = `
Analiza la imagen de este producto de merchandising corporativo y genera una ficha técnica profesional.
${context ? `### CONTEXTO DEL USUARIO:\n${context}\n` : ''}

Responde EXACTAMENTE con este formato (parseable):

NAME: [Un nombre comercial corto y atractivo]
CATEGORY: [Sugerencia de categoría: MUG, BOTELLA, MOCHILA, TECNOLOGIA, ECOLOGICO, etc]
PREMIUM: [SI o NO - Basado en la calidad percibida de materiales y diseño]
DESCRIPTION: [Descripción persuasiva para venta corporativa (2 párrafos max)]
SPECS:
- [Material observable]
- [Característica técnica 1]
- [Característica técnica 2]
- [Característica técnica 3]
- [Dimensiones estimadas si es posible]

Reglas:
- Español neutro corporativo.
- Enfócate en la utilidad para branding.
- Sé preciso con los materiales (Acero Inoxidable, Bambú, RPET, etc).
`.trim();

    try {
        const text = await callGemini(base64Data, prompt);

        const nameMatch = text.match(/NAME:\s*(.*)/i);
        const catMatch = text.match(/CATEGORY:\s*(.*)/i);
        const premMatch = text.match(/PREMIUM:\s*(.*)/i);
        const descMatch = text.match(/DESCRIPTION:\s*([\s\S]*?)(?=SPECS:|$)/i);

        // Extract specs
        const specsPart = text.split('SPECS:')[1] || '';
        const specs = specsPart
            .split('\n')
            .map(line => line.trim())
            .filter(line => line.startsWith('-'))
            .map(line => line.substring(1).trim());

        return {
            name_suggestion: nameMatch ? nameMatch[1].trim() : "",
            category: catMatch ? catMatch[1].trim() : "OTROS",
            is_premium: premMatch ? premMatch[1].trim().toUpperCase() === 'SI' : false,
            description: descMatch ? descMatch[1].trim() : "",
            specs: specs.length > 0 ? specs : ["Material por definir", "Tamaño estándar"]
        };
    } catch (error) {
        console.error("Error generando specs:", error);
        throw error;
    }
};

/**
 * Genera un nombre de archivo optimizado para SEO analizando la imagen
 */
export const generateSEOFilenameAI = async (
    imageSource: string,
    section: string = "",
    productName: string = ""
): Promise<string> => {
    if (!API_KEY) throw new Error("GEMINI_API_KEY no está configurada.");

    const base64Data = await prepareImage(imageSource);

    const prompt = `
Analiza la imagen del producto y genera un NOMBRE DE ARCHIVO estrategico para SEO.
${section ? `CATEGORIA/SECCION: ${section}\n` : ''}
${productName ? `NOMBRE PRODUCTO: ${productName}\n` : ''}

REGLAS:
- Solo minusculas, numeros y guiones (-).
- Sin acentos, sin ñ, sin espacios.
- Debe ser descriptivo (ej: mug-termico-acero-premium).
- Usa palabras clave de alto impacto para merchandising.
- Responde SOLO el texto del nombre, sin extensiones (ej: .jpg) ni explicaciones.
`.trim();

    const text = await callGemini(base64Data, prompt);
    // Limpieza de seguridad por si la IA devuelve algo extra
    return text.trim().toLowerCase()
        .replace(/[^a-z0-9-]/g, '-')
        .replace(/-+/g, '-')
        .replace(/(^-|-$)/g, '');
};

// --- Helpers ---

async function prepareImage(imageSource: string): Promise<string> {
    return imageSource;
}

async function callGemini(imageSource: string, prompt: string): Promise<string> {
    if (!API_KEY) {
        throw new Error("La API Key de Gemini no está configurada.");
    }

    try {
        // 1. Obtener la imagen (sea URL o Data URL)
        const responseImg = await fetch(imageSource);
        const blob = await responseImg.blob();

        // 2. Detectar tipo MIME real (png, jpeg, webp, etc.)
        const mimeType = blob.type || "image/jpeg";

        // 3. Convertir a Base64
        const base64Data = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => {
                const res = reader.result as string;
                const base64 = res.split(',')[1];
                resolve(base64);
            };
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });

        console.log(`[Gemini] Imagen: ${(blob.size / 1024).toFixed(1)}KB | MIME: ${mimeType} | Base64: ${(base64Data.length / 1024).toFixed(1)}KB`);

        // 4. Llamar a Gemini API con retry para errores 429
        const MAX_RETRIES = 3;
        let lastError: Error | null = null;

        for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
            const response = await fetch(`${BASE_URL}/${MODEL_NAME}:generateContent?key=${API_KEY}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    contents: [{
                        parts: [
                            { text: prompt },
                            {
                                inline_data: {
                                    mime_type: mimeType,
                                    data: base64Data
                                }
                            }
                        ]
                    }],
                    generationConfig: {
                        temperature: 0.7,
                        topK: 40,
                        topP: 0.95,
                        maxOutputTokens: 2048,
                    }
                })
            });

            if (response.ok) {
                const result = await response.json();
                const text = result.candidates?.[0]?.content?.parts?.[0]?.text;
                if (!text) throw new Error("La IA no devolvió ninguna respuesta válida.");
                return text;
            }

            // Si es 429, reintentar con espera
            if (response.status === 429 && attempt < MAX_RETRIES) {
                const waitSeconds = attempt * 3; // 3s, 6s, 9s
                console.warn(`[Gemini] Error 429 (intento ${attempt}/${MAX_RETRIES}). Reintentando en ${waitSeconds}s...`);
                await new Promise(r => setTimeout(r, waitSeconds * 1000));
                continue;
            }

            // Otro error o último intento
            let errorMessage = "Error en la API de Gemini";
            try {
                const errorData = await response.json();
                console.error("Gemini API Error Detail:", JSON.stringify(errorData, null, 2));
                errorMessage = errorData.error?.message || errorMessage;
            } catch (e) {
                const textError = await response.text();
                console.error("Gemini API Raw Error:", textError);
                errorMessage = `Error ${response.status}: ${textError}`;
            }
            lastError = new Error(errorMessage);
        }

        throw lastError || new Error("Error desconocido en Gemini API");

    } catch (err: any) {
        console.error("Error en callGemini:", err);
        throw err;
    }
}
