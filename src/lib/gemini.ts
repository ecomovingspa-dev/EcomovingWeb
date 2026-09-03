import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
const genAI = API_KEY ? new GoogleGenerativeAI(API_KEY) : null;

export interface MarketingContent {
    subject: string;
    part1: string;
    part2: string;
    html: string;
    ctaLink?: string;
    ctaText?: string;
}

export interface WebSectionContent {
    title1: string;
    paragraph1: string;
    title2: string;
    paragraph2: string;
}

export const getMarketingHTMLTemplate = (subject: string, p1: string, p2: string, ctaLink: string = "https://www.ecomoving.cl", ctaText: string = "EXPLORAR PORTAFOLIO") => `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="utf-8">
    <!--[if mso]>
    <style type="text/css">
        body, table, td, a { font-family: Arial, Helvetica, sans-serif !important; }
    </style>
    <![endif]-->
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;700;900&display=swap');
        body { margin: 0; padding: 0; background-color: #f9f9f9; font-family: 'Outfit', sans-serif; color: #1a1a1a; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
        table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; border-collapse: collapse !important; }
        img { border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; display: block; }
        .wrapper { width: 100%; table-layout: fixed; background-color: #f9f9f9; padding-top: 40px; padding-bottom: 40px; }
        .main-container { width: 900px; max-width: 900px; background-color: #ffffff; border: 1px solid #eeeeee; border-radius: 8px; margin: 0 auto; }
        .h1 { font-family: 'Outfit', sans-serif; font-size: 26px; font-weight: 800; line-height: 1.2; margin: 0; letter-spacing: 2px; color: #000000; text-transform: uppercase; }
        .p { font-family: 'Outfit', sans-serif; font-size: 19px; line-height: 1.6; color: #333333; font-weight: 300; margin: 0; }
        .f-text { font-family: 'Outfit', sans-serif; font-size: 15px; color: #999999; letter-spacing: 2px; text-transform: uppercase; font-weight: 700; line-height: 2; }
        .f-contact { font-family: 'Outfit', sans-serif; font-size: 15px; color: #666666; font-weight: 300; line-height: 1.8; }
    </style>
</head>
<body style="margin:0; padding:0;">
    <center class="wrapper">
        <table width="900" border="0" cellpadding="0" cellspacing="0" class="main-container" style="background-color: #ffffff; border: 1px solid #eeeeee; border-radius: 8px;">
            <!-- Spacer Top -->
            <tr><td height="50" style="font-size:1px; line-height:1px;">&nbsp;</td></tr>
            
            <!-- Logo Section -->
            <tr>
                <td align="center">
                    <img src="/Logo_horizontal.png" alt="Ecomoving" width="250" style="width: 250px; display: block;" />
                </td>
            </tr>
            
            <!-- Spacer Logo to Title -->
            <tr><td height="50" style="font-size:1px; line-height:1px;">&nbsp;</td></tr>
            
            <!-- Title Section -->
            <tr>
                <td align="center" style="padding: 0 50px;">
                    <h1 class="h1">${p1}</h1>
                </td>
            </tr>
            
            <!-- Spacer Title to Image (50px exact) -->
            <tr><td height="50" style="font-size:1px; line-height:1px;">&nbsp;</td></tr>
            
            <!-- Image Section (Fila 3 - 650px) -->
            <tr>
                <td align="center">
                    <table width="650" border="0" cellpadding="0" cellspacing="0">
                        <tr>
                            <td align="center">
                                <img src="IMAGE_URL_PLACEHOLDER" alt="Ecomoving Showcase" width="650" style="width: 650px; display: block; border-radius: 4px;" />
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
            
            <!-- Spacer Image to Copy -->
            <tr><td height="50" style="font-size:1px; line-height:1px;">&nbsp;</td></tr>
            
            <!-- Copy Section -->
            <tr>
                <td align="center" style="padding: 0 80px;">
                    <p class="p">${p2}</p>
                </td>
            </tr>
            
            <!-- Spacer Copy to Button -->
            <tr><td height="50" style="font-size:1px; line-height:1px;">&nbsp;</td></tr>
            
            <!-- Button Section (Fondo Negro Sólido) -->
            <tr>
                <td align="center">
                    <table border="0" cellpadding="0" cellspacing="0" style="background-color: #000000; border-radius: 0;">
                        <tr>
                            <td align="center" style="padding: 12px 40px;">
                                <a href="${ctaLink}" target="_blank" style="font-family: 'Outfit', sans-serif; font-size: 15px; line-height: 25px; color: #ffffff; text-decoration: none; font-weight: 900; text-transform: uppercase; letter-spacing: 3px; display: block;">
                                    ${ctaText}
                                </a>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
            
            <!-- Spacer Button to Footer -->
            <tr><td height="50" style="font-size:1px; line-height:1px;">&nbsp;</td></tr>
            
            <!-- Footer Section -->
            <tr>
                <td align="center" style="padding: 50px; background-color: #fafafa; border-top: 1px solid #f0f0f0;">
                    <div class="f-text">ECOMOVING SPA &bull; SANTIAGO, CHILE</div>
                    <div style="height: 20px; line-height: 20px; border-top: 1px solid #eeeeee; margin-top: 20px; padding-top: 20px;">
                        <span class="f-contact">ventas@ecomoving.cl &nbsp;&bull;&nbsp; +56 9 7958 7293 &nbsp;&bull;&nbsp; +56 9 3924 6386</span>
                    </div>
                </td>
            </tr>
        </table>
    </center>
</body>
</html>`.trim();



// --- UTILIDAD: Retraso de cortesía ---
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

import { callOllama } from "./ollama";

export interface SEOContent {
    seo_title: string;
    seo_description: string;
    seo_keywords: string;
}

/**
 * MOTOR PRINCIPAL: Generación de SEO mediante Google AI Studio.
 * FALLBACK: Ollama local (Gemma 3) si falla por cuota (429).
 */
export const generateSEOAI = async (context: string): Promise<SEOContent> => {
    const prompt = `
Eres el Módulo de Inteligencia Semántica (@seo_mkt) de Ecomoving SpA.
TAREA: Genera metadatos SEO premium (Título, Descripción y Keywords) basados en la siguiente información.

INPUT:
${context}

REGLAS @seo_mkt:
1. TÍTULO (seo_title): Máximo 60 caracteres. Impactante, B2B, sin nombres de marca.
2. DESCRIPCIÓN (seo_description): Máximo 160 caracteres. Persuasiva, orientada a conversión ejecutiva.
3. KEYWORDS (seo_keywords): 5-8 términos de cola larga separados por coma.

RESPONDE EXCLUSIVAMENTE EN FORMATO JSON:
{
  "seo_title": "...",
  "seo_description": "...",
  "seo_keywords": "..."
}
`;

    try {
        if (!genAI) throw new Error("API KEY MISSING");
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const result = await model.generateContent(prompt);
        const text = result.response.text();
        const parsed = JSON.parse(text.replace(/```json/g, "").replace(/```/g, "").trim());
        
        return {
            seo_title: parsed.seo_title || parsed.title || '',
            seo_description: parsed.seo_description || parsed.description || '',
            seo_keywords: parsed.seo_keywords || parsed.keywords || ''
        };
    } catch (error: any) {
        const isRateLimit = error?.message?.includes('429') || error?.status === 429 || error?.toString().includes('429');
        
        if (isRateLimit) {
            console.warn("[SEO_FALLBACK] Gemini 429. Activando Salvavidas: Ollama local...");
            try {
                const parsed = await callOllama(prompt, { format: 'json', model: 'gemma3:4b' });
                return {
                    seo_title: parsed.seo_title || parsed.title || '',
                    seo_description: parsed.seo_description || parsed.description || '',
                    seo_keywords: parsed.seo_keywords || parsed.keywords || ''
                };
            } catch (ollamaError) {
                console.error("[OLLAMA_CRITICAL] Fallo total en salvavidas:", ollamaError);
            }
        }

        console.error("[GEMINI_SEO_ERROR] Fallo en motor principal:", error);
        return { 
            seo_title: 'Contenido Premium Ecomoving', 
            seo_description: 'Ecomoving ofrece soluciones de merchandising sustentable de alta gama.', 
            seo_keywords: 'merchandising, sustentable, corporativo' 
        };
    }
};


export const generateMarketingAI = async (
    imageSource: string,
    context: string = "",
    ctaLink: string = "https://www.ecomoving.cl",
    ctaText: string = "EXPLORAR PORTAFOLIO"
): Promise<MarketingContent> => {
    if (!genAI) throw new Error("API KEY MISSING");

    // PROTOCOLO @seo_mkt — Logic Gate: MULTIMODAL FALLBACK
    const isLifestyle = !context || !context.includes('CARACTERISTICAS_TECNICAS:') || context.replace('CARACTERISTICAS_TECNICAS:', '').trim() === '';

    const responseImg = await fetch(imageSource);
    const blob = await responseImg.blob();
    const base64Data = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
        reader.readAsDataURL(blob);
    });

    const prompt = `
Eres el Módulo de Inteligencia Semántica (@seo_mkt) de Ecomoving SpA.
Protocolo ADN activo. Fidelidad estratégica a la identidad premium de la marca.

${isLifestyle ? 
`MODO CREATIVO VISUAL ACTIVADO:
No se han proporcionado características técnicas. 
TAREA: Analiza la composición de la imagen (lifestyle/colección). Detecta los productos presentes (mochilas, botellas, accesorios), los materiales (bambú, madera, metal mate) y el ecosistema visual.
Genera una narrativa de "Colección Premium" o "Ecosistema de Trabajo Eco-pro" basada únicamente en la visión.` 
: 
`PRIMARY INPUT — ÚNICA FUENTE DE VERDAD:
${context}`
}

IMAGEN DEL PRODUCTO/COLECCIÓN: Analiza la imagen para detectar forma, acabado, color y uso implícito. 
${isLifestyle ? 'Crea una propuesta de valor corporativa de alto impacto combinando todos los elementos visibles.' : 'Si hay discrepancia entre la imagen y las specs, la imagen tiene prioridad sobre la forma; las specs tienen prioridad sobre el contenido técnico.'}

REGLAS DE ORO (@seo_mkt — sin excepciones):
1. PROHIBICIÓN ABSOLUTA DE NOMBRES: Nunca menciones nombres de marca, modelos o SKUs. Refiérete por categoría o esencia ("Este aliado de hidratación", "La pieza", "La colección", "El ecosistema corporativo").
2. FIDELIDAD TÉCNICA: ${isLifestyle ? 'Básate en lo que se ve (madera, textil, metal, corcho).' : 'Solo usa materiales, certificaciones e impactos presentes en el PRIMARY INPUT. Prohibido inventar.'}
3. TONO "CIERRE DE NEGOCIO": Directo, ejecutivo, sofisticado. Nunca informal ni entusiasta ("¡Te va a encantar!").
4. NARRATIVA RÍTMICA: Estilo Comercial de TV. Frases cortas, ritmo, alto impacto psicológico para el decisor B2B.
5. PROHIBIDO EL RELLENO: Si no puedes construir una afirmación basada en la visión o los datos, simplemente no la hagas.

ESTRUCTURA DE SALIDA REQUERIDA (Responde EXACTAMENTE con estas etiquetas, evita negritas en las etiquetas si es posible):
SUBJECT: [MÁX 4-5 PALABRAS. Directo e intrigante.]
PART1: [MÁX 6-8 PALABRAS en mayúsculas. Sin nombre de producto.]
PART2: [MÁXIMO 1 PÁRRAFO FLUIDO Y ARMÓNICO. Estilo Comercial de TV.]

EJEMPLO DE SALIDA IDEAL:
SUBJECT: Tecnología que transforma
PART1: PRECISIÓN TÉRMICA SIN COMPROMISO
PART2: Esta solución avanzada mantiene la temperatura ideal durante jornadas extensas, combinando aislamiento de doble pared en acero inoxidable con un diseño ergonómico de alta capacidad. Su sello hermético y base antideslizante garantizan rendimiento superior, mientras su material reciclado refuerza el compromiso ambiental de su organización.
`;

    // --- BLINDAJE NIVEL 2: Sanitizador de salida post-generación ---
    const sanitizeOutput = (subject: string, part1: string, part2: string) => {
        // SUBJECT: flexibilización a 6 palabras para evitar cortes bruscos
        const sanitizedSubject = subject
            .replace(/[*#\-•]/g, '')
            .trim()
            .split(/\s+/)
            .slice(0, 6)
            .join(' ');

        // PART1: flexibilización a 10 palabras, uppercase
        const sanitizedPart1 = part1
            .replace(/[*#\-•]/g, '')
            .trim()
            .split(/\s+/)
            .slice(0, 10)
            .join(' ')
            .toUpperCase();

        const cleanPart2 = part2
            .replace(/^[\s\u2022\-*’‘\d\.]+/gm, '') 
            .replace(/[*#]/g, '')                         
            .replace(/\s+/g, ' ')                        
            .trim();

        return { subject: sanitizedSubject, part1: sanitizedPart1, part2: cleanPart2 };
    };

    const maxRetries = 5;
    let lastError: any;

    for (let i = 0; i < maxRetries; i++) {
        try {
            // Prioridad 1.5 Pro: 2.0 -> 1.5-pro -> 1.5-flash
            const modelName = i === 0 ? "gemini-2.0-flash" : i === 1 ? "gemini-1.5-pro" : "gemini-1.5-flash";
            const model = genAI.getGenerativeModel({ model: modelName });

            const result = await model.generateContent([
                { text: prompt },
                { inlineData: { data: base64Data, mimeType: blob.type || "image/jpeg" } }
            ]);

            const text = result.response.text();
            
            // Regex mejoradas para soportar markdown y variaciones de espaciado
            const findField = (regexes: RegExp[]) => {
                for (const re of regexes) {
                    const match = text.match(re);
                    if (match && match[1]) return match[1].trim();
                }
                return null;
            };

            const subject = findField([/\**SUBJECT:\**\s*(.*)/i, /\**ASUNTO:\**\s*(.*)/i, /SUBJECT:\s*(.*)/i]) || "Tecnología que transforma";
            const p1 = findField([/\**PART1:\**\s*([\s\S]*?)(?=\**PART2:\**|$)/i, /\**TITULAR:\**\s*([\s\S]*?)(?=\**CUERPO:\**|$)/i, /PART1:\s*([\s\S]*?)(?=PART2:|$)/i]) || "INGENIERÍA DE VANGUARDIA";
            const p2 = findField([/\**PART2:\**\s*([\s\S]*)$/i, /\**CUERPO:\**\s*([\s\S]*)$/i, /PART2:\s*([\s\S]*)$/i]) || text;

            const { subject: s, part1: p1s, part2: p2s } = sanitizeOutput(subject, p1, p2);

            return {
                subject: s,
                part1: p1s,
                part2: p2s,
                html: getMarketingHTMLTemplate(s, p1s, p2s, ctaLink, ctaText),
                ctaLink,
                ctaText
            };
        } catch (error: any) {
            lastError = error;
            const isRateLimit = error?.message?.includes('429') || error?.status === 429 || error?.toString().includes('429');

            if (isRateLimit) {
                if (i < maxRetries - 1) {
                    console.warn(`[SEO_MKT] Saturación. Aplicando delay de cortesía (3s) antes de reitento ${i + 1}...`);
                    await sleep(3000);
                    continue;
                } else {
                    // ÚLTIMO REINTENTO FALLIDO - ACTIVAR SALVAVIDAS OLLAMA
                    console.warn("[SEO_MKT] Límite superado. Activando Salvavidas: Ollama local...");
                    try {
                        const ollamaPrompt = `${prompt}\n\nTOMA EN CUENTA EL CONTEXTO: ${context}`;
                        const response = await callOllama(ollamaPrompt, { model: 'gemma3:4b' });
                        
                        // Parseo simplificado del texto libre de Ollama si no devuelve formato exacto
                        return {
                            subject: "Solución de Impacto",
                            part1: "ELEGANCIA CORPORATIVA",
                            part2: response.slice(0, 500),
                            html: getMarketingHTMLTemplate("Solución de Impacto", "ELEGANCIA CORPORATIVA", response.slice(0, 500), ctaLink, ctaText),
                            ctaLink,
                            ctaText
                        };
                    } catch (ollamaError) {
                        console.error("[OLLAMA_MKT_ERROR] Fallo total en salvavidas:", ollamaError);
                    }
                }
            }

            console.error("[SEO_MKT] Error crítico en Gemini AI:", error);
            throw new Error(isRateLimit
                ? "El servicio de Google está temporalmente saturado. Hemos intentado alternar modelos y el salvavidas Ollama. Por favor, reintenta en 60 segundos."
                : "Error en la conexión con la IA de Google. Verifica tu conexión.");
        }
    }
    throw lastError;
};

/**
 * MOTOR PRINCIPAL: Generación de contenido Web mediante Google AI Studio.
 * FALLBACK: Ollama local (Gemma 3) si falla por cuota (429).
 */
export const generateWebAI = async (img: string, ctx: string): Promise<WebSectionContent> => {
    const prompt = `
Eres el Arquitecto de Contenido Web (@constructor) de Ecomoving.
Genera contenido SEO premium para una sección de la página web basada en el contexto proporcionado.

INPUT:
${ctx}

SALIDA REQUERIDA (JSON ESTRICTO):
{
  "title1": "Título SEO IMPACTANTE (máx 6 palabras, SIN NOMBRE DE PRODUCTO)",
  "paragraph1": "Párrafo persuasivo de 3 líneas enfocado en beneficios B2B (Usa sustantivos genéricos, NO nombres propios)",
  "title2": "Frase de refuerzo potente (Sin nombres)",
  "paragraph2": "Subtexto descriptivo refinado"
}

REGLA CRÍTICA: Bajo ninguna circunstancia uses el nombre del producto proporcionado en el INPUT en el texto final.
`;

    try {
        if (!genAI) throw new Error("API KEY MISSING");
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const result = await model.generateContent(prompt);
        const text = result.response.text();
        const parsed = JSON.parse(text.replace(/```json/g, "").replace(/```/g, "").trim());
        
        return {
            title1: parsed.title1 || '',
            paragraph1: parsed.paragraph1 || '',
            title2: parsed.title2 || '',
            paragraph2: parsed.paragraph2 || ''
        };
    } catch (error: any) {
        const isRateLimit = error?.message?.includes('429') || error?.status === 429 || error?.toString().includes('429');
        
        if (isRateLimit) {
            console.warn("[WEB_FALLBACK] Gemini 429. Activando Salvavidas: Ollama local...");
            try {
                const parsed = await callOllama(prompt, { format: 'json', model: 'gemma3:4b' });
                return {
                    title1: parsed.title1 || '',
                    paragraph1: parsed.paragraph1 || '',
                    title2: parsed.title2 || '',
                    paragraph2: parsed.paragraph2 || ''
                };
            } catch (ollamaError) {
                console.error("[OLLAMA_WEB_ERROR] Error en salvavidas local:", ollamaError);
            }
        }

        console.error("[GEMINI_WEB_ERROR] Error en motor principal:", error);
        return { 
            title1: 'Solución Corporativa Premium', 
            paragraph1: 'Diseño y funcionalidad para elevar la identidad de su empresa.', 
            title2: 'Calidad Sin Compromiso', 
            paragraph2: 'Nuestros estándares aseguran durabilidad e impacto visual.' 
        };
    }
};


export const generateSEOFilenameAI = async (img: string) => "optimized-filename";

/**
 * MOTOR DE EMAILS (@seo_mkt): Generación de narrativa de email de alta fidelidad.
 * FALLBACK: Ollama local (Gemma 3) si falla por cuota (429).
 */
export const generateEmailAI = async (technical_specs: string[], productName: string): Promise<any> => {
    const prompt = `
Eres el Módulo de Inteligencia Semántica @seo_mkt de Ecomoving.
PRODUCT NAME: ${productName}
PRIMARY INPUT (Specs):
${technical_specs.join('\n')}

REGLAS: ÚNICO PÁRRAFO FLUIDO de 4 líneas. Tono ejecutivo.
ASUNTO: Abre-puertas B2B (máx 6 palabras).
PART1: TITULAR SECUNDARIO MAYÚSCULAS.

ESTRUCTURA JSON:
{
  "email_subject": "...",
  "part1": "...",
  "email_body": "..."
}
`;

    try {
        if (!genAI) throw new Error("API KEY MISSING");
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
        const result = await model.generateContent(prompt);
        const text = result.response.text();
        return JSON.parse(text.replace(/```json/g, '').replace(/```/g, '').trim());
    } catch (error: any) {
        const isRateLimit = error?.message?.includes('429') || error?.status === 429;
        if (isRateLimit) {
            console.warn("[EMAIL_FALLBACK] Gemini 429. Activando Salvavidas: Ollama local...");
            try {
                return await callOllama(prompt, { format: 'json', model: 'gemma3:4b' });
            } catch (ollamaError) {
                console.error("[OLLAMA_EMAIL_ERROR] Fallo total en salvavidas:", ollamaError);
            }
        }
        throw error;
    }
};

/**
 * MOTOR DE BANNERS (@seo_mkt): Generación de copys para Hero Banner 16:9.
 * FALLBACK: Ollama local (Gemma 3) si falla por cuota (429).
 */
export const generateBannerAI = async (technical_specs: string[]): Promise<any> => {
    const prompt = `
REGLAS HERO BANNER: 16:9. Extremadamente breve.
INPUT SPECS: ${technical_specs.join('\n')}

ESTRUCTURA JSON:
{
  "tag": "ETIQUETA (2 pal)",
  "slogan": "TITULAR (5 pal)",
  "sub_slogan": "SUBTITULAR (8 pal)",
  "cta": "BOTÓN (2 pal)"
}
`;

    try {
        if (!genAI) throw new Error("API KEY MISSING");
        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
        const result = await model.generateContent(prompt);
        const text = result.response.text();
        return JSON.parse(text.replace(/```json/g, '').replace(/```/g, '').trim());
    } catch (error: any) {
        const isRateLimit = error?.message?.includes('429') || error?.status === 429;
        if (isRateLimit) {
            console.warn("[BANNER_FALLBACK] Gemini 429. Activando Salvavidas: Ollama local...");
            try {
                return await callOllama(prompt, { format: 'json', model: 'gemma3:4b' });
            } catch (ollamaError) {
                console.error("[OLLAMA_BANNER_ERROR] Fallo total en salvavidas:", ollamaError);
            }
        }
        throw error;
    }
};

/**
 * MOTOR DE CONSULTAS SEO (@seo_mkt): Análisis, mejora y optimización.
 * FALLBACK: Ollama local (Gemma 3) si falla por cuota (429).
 */
export const generateSEOQueryAI = async (prompt: string): Promise<any> => {
    try {
        if (!genAI) throw new Error("API KEY MISSING");
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
        const result = await model.generateContent(prompt);
        const text = result.response.text();
        return JSON.parse(text.replace(/```json/g, '').replace(/```/g, '').trim());
    } catch (error: any) {
        const isRateLimit = error?.message?.includes('429') || error?.status === 429;
        if (isRateLimit) {
            console.warn("[SEO_QUERY_FALLBACK] Gemini 429. Activando Salvavidas: Ollama local...");
            try {
                return await callOllama(prompt, { format: 'json', model: 'gemma3:4b' });
            } catch (ollamaError) {
                console.error("[OLLAMA_SEO_QUERY_ERROR] Fallo total en salvavidas:", ollamaError);
            }
        }
        throw error;
    }
};

// --- NUEVO MOTOR DE ESTUDIO FOTOGRÁFICO IA (REPLICADO 1:1 DE GOOGLE STUDIO) ---
import { GoogleGenAI } from "@google/genai";

export const DEFAULT_IMAGE_PROMPT = `Fotografía de producto comercial profesional del [PRODUCTO_REAL] en todo su esplendor. Fotografía publicitaria de catálogo de lujo. Composición impecable siguiendo la regla de los tercios. Óptica: Lente Teleobjetivo de 85mm (Cero distorsión, perspectiva frontal plana), apertura f/8 para máxima nitidez. Iluminación: Estudio profesional con softboxes, luz de contorno (rim light), luz natural a 5500K con sombras de contacto suaves sobre la superficie. Entorno: Centro de mesa en oficina biofílica minimalista o espacio de Gerencia. Superficie: Madera de Nogal Premium o Piedra Neutra. Fondo: Entorno laboral ejecutivo con desenfoque suave (bokeh) y vegetación sutil. Restricciones: SIN accesorios, SIN computadoras, SIN distracciones. Ocupar todas las imagenes adjuntas con la restricción de no deformar o transformar el tamaño de los productos sin alucinar cambiando cualquier aspecto o caracteristicas de los productos. Protagonista: Foco absoluto en la textura del material (Acero Inoxidable/Acabado Mate). Estilo: Lujo Minimalista, Autoridad B2B de Alta Gama, Resolución 8k, Calidad comercial premium.`;

export const DEFAULT_ENHANCE_ONLY_PROMPT = `Retoque digital profesional de alta gama. Optimización de micro-contrastes, corrección de color cinematográfica y perfeccionamiento de la iluminación global. MANTÉN EL FONDO ORIGINAL EXACTAMENTE COMO ESTÁ. Integra los productos mediante sombras de contacto precisas y reflejos coherentes con el entorno. Acabado de revista de diseño.`;

export const generateStudioImage = async (
    base64Images: string[], 
    customPrompt: string, 
    includePeople: boolean = false,
    aspectRatio: string = '16:9',
    keepBackground: boolean = false
): Promise<string> => {
    if (!API_KEY) throw new Error("API KEY MISSING");
    const ai = new GoogleGenAI({ apiKey: API_KEY });

    const imageParts = base64Images.map(base64 => {
        const data = base64.split(',')[1] || base64;
        return {
            inlineData: {
                data: data,
                mimeType: 'image/jpeg'
            }
        };
    });

    let finalPrompt = "";
    
    if (keepBackground) {
        finalPrompt = `ACTÚA COMO DIRECTOR DE ARTE DE POSPRODUCCIÓN: ${customPrompt || DEFAULT_ENHANCE_ONLY_PROMPT}. 
        INSTRUCCIONES CRÍTICAS: 
        1. PROHIBIDO MODIFICAR EL FONDO ORIGINAL.
        2. Integra los nuevos productos en el fondo proporcionado.
        3. La iluminación de los productos debe igualar exactamente la temperatura de color y dirección de luz del fondo.
        4. Genera oclusión ambiental y sombras proyectadas realistas sobre las superficies existentes.`;
    } else {
        const peopleInstruction = includePeople 
            ? "Ambiente lifestyle de lujo con modelos humanos interactuando naturalmente con los productos. Los modelos deben vestir acorde al escenario y mostrar una actitud aspiracional."
            : "Bodegón publicitario de producto puro. Sin presencia humana. Enfoque en materiales, texturas y diseño industrial.";

        finalPrompt = `ACTÚA COMO UN EXPERTO DIRECTOR DE ARTE Y FOTÓGRAFO PUBLICITARIO: ${customPrompt || DEFAULT_IMAGE_PROMPT}. 
        ${peopleInstruction}
        REGLAS DE ORO PARA EL RENDER:
        - Composición de alta gama con enfoque en el producto.
        - Iluminación cinematográfica coherente con el escenario.
        - Utiliza una lente de 85mm f/1.8 para un desenfoque de fondo (bokeh) elegante si aplica.
        - Los objetos deben estar perfectamente integrados, con sombras de contacto y oclusión ambiental realistas.
        - MÁXIMA RESOLUCIÓN 4K, nitidez extrema, sin artefactos, calidad de impresión profesional.`;
    }

    try {
        const result = await (ai.models as any).generateContent({
            model: 'gemini-2.0-flash', 
            contents: [
                {
                    parts: [
                        ...imageParts,
                        { text: finalPrompt }
                    ]
                }
            ],
            config: {
                imageConfig: {
                    aspectRatio: aspectRatio
                }
            }
        } as any);

        const parts = (result as any).candidates?.[0]?.content?.parts || [];
        for (const part of parts) {
            if (part.inlineData) {
                return `data:image/png;base64,${part.inlineData.data}`;
            }
        }
        throw new Error("No se devolvió una imagen en la respuesta.");
    } catch (e: any) {
        console.error("Error en generateStudioImage:", e);
        throw e;
    }
};

export const generateStudioCopy = async (base64Image: string, context: string) => {
    if (!API_KEY) throw new Error("API KEY MISSING");
    const ai = new GoogleGenAI({ apiKey: API_KEY });
    
    const prompt = `
      ACTÚA COMO UN DIRECTOR CREATIVO DE UNA AGENCIA DE PUBLICIDAD DE ÉLITE.
      CONTEXTO ESTRATÉGICO: "${context}"
      Responde ÚNICAMENTE en formato JSON con claves: "title", "p1", "p2".
    `;

    try {
        const result = await (ai.models as any).generateContent({
          model: "gemini-2.0-flash",
          contents: [
            {
              parts: [
                { inlineData: { mimeType: "image/png", data: base64Image.split(',')[1] || base64Image } },
                { text: prompt }
              ]
            }
          ],
          config: { responseMimeType: "application/json", temperature: 1.0 }
        });

        const text = (result as any).response?.text() || (result as any).candidates?.[0]?.content?.parts?.[0]?.text || "";
        return JSON.parse(text.replace(/```json/g, "").replace(/```/g, "").trim());
    } catch (error: any) {
        const isRateLimit = error?.message?.includes('429') || error?.status === 429 || error?.toString().includes('429');
        if (isRateLimit) {
            console.warn("[STUDIO_COPY_FALLBACK] Gemini 429. Activando Salvavidas: Ollama local...");
            try {
                // Como es una imagen, mandamos el prompt como texto a Ollama
                const ollamaOutput = await callOllama(prompt, { format: 'json', model: 'gemma3:4b' });
                return {
                    title: ollamaOutput.title || "Visión Corporativa",
                    p1: ollamaOutput.p1 || "ELEGANCIA Y RENDIMIENTO",
                    p2: ollamaOutput.p2 || "Solución premium diseñada para entornos ejecutivos de alta exigencia."
                };
            } catch (ollamaError) {
                console.error("[OLLAMA_STUDIO_ERROR] Fallo total en salvavidas:", ollamaError);
            }
        }
        
        console.error("[GEMINI_STUDIO_COPY_ERROR]:", error);
        return { title: 'Ecomoving Studio', p1: 'DISEÑO PREMIUM', p2: 'Contenido generado localmente ante interrupción del servicio.' };
    }
};


