import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
const genAI = API_KEY ? new GoogleGenerativeAI(API_KEY) : null;

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
<html lang="es">
<head>
    <meta charset="utf-8">
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;700;900&display=swap');
        body { margin: 0; padding: 0; background-color: #f9f9f9; font-family: 'Outfit', sans-serif; color: #1a1a1a; }
        .wrapper { max-width: 600px; margin: 40px auto; background: #ffffff; border: 1px solid #eeeeee; border-radius: 8px; overflow: hidden; box-shadow: 0 40px 80px rgba(0,0,0,0.05); }
        .hero { padding: 80px 50px 40px; text-align: center; background: #ffffff; position: relative; }
        .logo { width: 160px; height: auto; margin-bottom: 45px; display: block; margin: 0 auto; }
        .content { padding: 40px 50px 80px; }
        .h1 { font-size: 44px; font-weight: 900; line-height: 1.1; margin-bottom: 35px; letter-spacing: -2px; color: #000000; text-transform: uppercase; text-align: center; }
        .p { font-size: 19px; line-height: 1.8; color: #444444; font-weight: 300; margin-bottom: 50px; text-align: justify; }
        .img-box { margin: 50px 0; background: #ffffff; border: 1px solid #f0f0f0; line-height: 0; box-shadow: 0 10px 30px rgba(0,0,0,0.02); text-align: center; }
        .img-box img { width: 100%; max-width: 600px; height: auto; border-radius: 4px; display: block; margin: 0 auto; }
        .footer { padding: 50px; background: #fafafa; text-align: center; border-top: 1px solid #f0f0f0; }
        .f-text { font-size: 10px; color: #999999; letter-spacing: 4px; text-transform: uppercase; font-weight: 700; }
    </style>
</head>
<body>
    <div class="wrapper">
        <div class="header" style="padding: 60px 50px 0; text-align: center;">
            <img src="https://xgdmyjzyejjmwdqkufhp.supabase.co/storage/v1/object/public/logo_ecomoving/Logo_horizontal.png" alt="Ecomoving" class="logo" width="160" />
        </div>
        <div class="hero" style="padding: 40px 50px 40px; text-align: center;">
            <div class="h1">${p1}</div>
        </div>
        <div class="content">
            <div class="p">${p2}</div>
            <div class="img-box">
                <img src="IMAGE_URL_PLACEHOLDER" alt="Ecomoving Premium" />
            </div>
        </div>
        <div class="footer">
            <div class="f-text">&copy; 2026 ECOMOVING SPA &bull; SANTIAGO &bull; DUBAI &bull; MILÁN</div>
        </div>
    </div>
</body>
</html>`.trim();

export const generateMarketingAI = async (
    imageSource: string,
    context: string = ""
): Promise<MarketingContent> => {
    if (!genAI) throw new Error("API KEY MISSING");

    // PROTOCOLO @seo_mkt: Usamos gemini-2.0-flash (disponible y estable en este entorno)
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    // Validación según Logic Gate de @seo_mkt
    if (!context || context.trim() === "" || context.includes("Referencia: Analiza la imagen")) {
        // Si el contexto es vacío o no tieneSpecs (detectado por el fallback de CatalogHub)
        console.warn("[SEO_MKT] Intento de generación sin datos técnicos.");
        throw new Error("[FATAL_ERROR: DATA_SOURCE_EMPTY]");
    }

    const responseImg = await fetch(imageSource);
    const blob = await responseImg.blob();
    const base64Data = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
        reader.readAsDataURL(blob);
    });

    const prompt = `
Eres el Módulo de Inteligencia Semántica (@seo_mkt) de Ecomoving SpA. 
Tu misión: Transformar datos técnicos áridos en una NARRATIVA de "Comercial de TV" premium.

PRIMARY INPUT (Única fuente de verdad):
${context}

REGLAS DE ORO (@seo_mkt):
1. PROHIBICIÓN DE NOMBRES: Prohibido mencionar nombres específicos de productos (ej. "SILLY", "YAMA", "BOTELLA X", etc.) en el texto generado. Refiérete al objeto por su categoría o esencia (ej. "Esta pieza", "Tu aliado de hidratación", "Diseño en aluminio").
2. PRIORIDAD VISUAL: Si existe discrepancia entre el texto del PRIMARY INPUT y lo que observas en la IMAGEN, da prioridad absoluta a la IMAGEN.
3. FIDELIDAD TÉCNICA: No inventes materiales ni marcas. Usa solo los atributos técnicos del input.
4. NARRATIVA RÍTMICA: Estilo breve, sofisticado y de alto impacto psicológico. Sin listas.
5. REFERENCIA GENÉRICA: Enfócate 100% en lo que ves en la IMAGEN.
6. PROHIBIDO el copy-paste directo de las especificaciones.

ESTRUCTURA DE SALIDA REQUERIDA (NO RESPONDAS NADA MÁS):
SUBJECT: [Asunto de email de ultra-lujo]
PART1: [Titular poético y potente]
PART2: [Narrativa rítmica de 2 párrafos que respire exclusividad]
`;

    const maxRetries = 5;
    let lastError: any;

    for (let i = 0; i < maxRetries; i++) {
        try {
            const result = await model.generateContent([
                { text: prompt },
                { inlineData: { data: base64Data, mimeType: blob.type || "image/jpeg" } }
            ]);

            const text = result.response.text();
            const findField = (regexes: RegExp[]) => {
                for (const re of regexes) {
                    const match = text.match(re);
                    if (match && match[1]) return match[1].trim();
                }
                return null;
            };

            const subject = findField([/SUBJECT:\s*(.*)/i, /ASUNTO:\s*(.*)/i]) || "Ecomoving: Trascendencia Sostenible";
            const p1 = findField([/PART1:\s*([\s\S]*?)(?=PART2:|$)/i, /TITULAR:\s*([\s\S]*?)(?=CUERPO:|$)/i]) || "Ingeniería de Vanguarda";
            const p2 = findField([/PART2:\s*([\s\S]*)$/i, /CUERPO:\s*([\s\S]*)$/i]) || text;

            return {
                subject,
                part1: p1.replace(/\*/g, '').replace(/#/g, '').trim(),
                part2: p2.replace(/\*/g, '').replace(/#/g, '').trim(),
                html: getMarketingHTMLTemplate(subject, p1, p2)
            };
        } catch (error: any) {
            lastError = error;
            const isRateLimit = error?.message?.includes('429') || error?.status === 429 || error?.toString().includes('429');

            if (isRateLimit && i < maxRetries - 1) {
                const waitTime = Math.pow(2, i) * 4000; // 4s, 8s, 16s, 32s...
                console.warn(`[SEO_MKT] Saturación de API (429). Reintento ${i + 1}/${maxRetries} en ${waitTime / 1000}s...`);
                await new Promise(resolve => setTimeout(resolve, waitTime));
                continue;
            }

            console.error("[SEO_MKT] Error crítico en Gemini AI:", error);
            throw new Error(isRateLimit
                ? "El servicio de Google está altamente saturado en este momento. Hemos intentado 5 veces sin éxito. Por favor, espera 60 segundos antes de intentar un nuevo activo."
                : "Error en la conexión con la IA de Google. Verifica tu conexión.");
        }
    }
    throw lastError;
};

export const generateWebAI = async (img: string, ctx: string): Promise<WebSectionContent> => {
    if (!genAI) throw new Error("API KEY MISSING");
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const responseImg = await fetch(img);
    const blob = await responseImg.blob();
    const base64Data = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
        reader.readAsDataURL(blob);
    });

    const prompt = `
Eres el Arquitecto de Contenido Web (@constructor) de Ecomoving.
Genera contenido SEO premium para una sección de la página web basada en este producto.

INPUT:
${ctx}

SALIDA REQUERIDA (JSON ESTRICTO):
{
  "title1": "Título SEO IMPACTANTE (máx 6 palabras, SIN NOMBRE DE PRODUCTO)",
  "paragraph1": "Párrafo persuasivo de 3 líneas enfocado en beneficios B2B (Usa sustantivos genéricos, NO nombres propios)",
  "title2": "Frase de refuerzo potente (Sin nombres)",
  "paragraph2": "Subtexto descriptivo refinado"
}

REGLA CRÍTICA: Bajo ninguna circunstancia uses el nombre del producto proporcionado en el INPUT en el texto final. Si el INPUT dice "Producto: SILLY", tú escribe "La solución de hidratación definitiva".
`;

    const maxRetries = 5;
    for (let i = 0; i < maxRetries; i++) {
        try {
            const result = await model.generateContent([
                { text: prompt },
                { inlineData: { data: base64Data, mimeType: blob.type || "image/jpeg" } }
            ]);
            const text = result.response.text();
            const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
            return JSON.parse(cleanText);
        } catch (error: any) {
            const isRateLimit = error?.message?.includes('429') || error?.status === 429;
            if (i < maxRetries - 1 && isRateLimit) {
                const waitTime = Math.pow(2, i) * 4000;
                await new Promise(r => setTimeout(r, waitTime));
                continue;
            }
            console.error("[CONSTRUCTOR] Error en Web AI:", error);
            throw new Error(isRateLimit
                ? "Saturación persistente en los servidores de Google. Intentos agotados (5/5). Reintenta en 1 minuto."
                : "Saturación de IA. Por favor intenta en unos segundos.");
        }
    }
    return { title1: '', paragraph1: '', title2: '', paragraph2: '' };
};

export const generateSEOFilenameAI = async (img: string) => "optimized-filename";
