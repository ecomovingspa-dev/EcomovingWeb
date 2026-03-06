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
        .hero { padding: 40px 50px 30px; text-align: center; background: #ffffff; }
        .logo { width: 150px; height: auto; display: block; margin: 0 auto; }
        .content { padding: 0 50px 60px; }
        .h1 { font-size: 35px; font-weight: 900; line-height: 1.15; margin-bottom: 24px; letter-spacing: -1px; color: #000000; text-transform: uppercase; text-align: center; }
        .p { font-size: 17px; line-height: 1.6; color: #333333; font-weight: 300; margin-bottom: 36px; text-align: left; max-height: 6.4em; overflow: hidden; }
        .img-box { margin: 0 0 40px; background: #ffffff; border: 1px solid #f0f0f0; line-height: 0; text-align: center; border-radius: 4px; overflow: hidden; }
        .img-box img { width: 100%; max-width: 600px; height: auto; display: block; margin: 0 auto; }
        .footer { padding: 36px 50px; background: #fafafa; text-align: center; border-top: 1px solid #f0f0f0; }
        .f-text { font-size: 10px; color: #999999; letter-spacing: 4px; text-transform: uppercase; font-weight: 700; }
    </style>
</head>
<body>
    <div class="wrapper">
        <div style="padding: 40px 50px 0; text-align: center;">
            <img src="https://xgdmyjzyejjmwdqkufhp.supabase.co/storage/v1/object/public/logo_ecomoving/Logo_horizontal.png" alt="Ecomoving" class="logo" width="150" />
        </div>
        <div class="hero">
            <div class="h1">${p1}</div>
        </div>
        <div class="content">
            <div class="p">${p2}</div>
            <div class="img-box">
                <img src="IMAGE_URL_PLACEHOLDER" alt="Ecomoving Premium" />
            </div>
        </div>
        <div class="footer">
            <div class="f-text">&copy; 2026 ECOMOVING SPA &bull; SANTIAGO</div>
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

    // PROTOCOLO @seo_mkt — Logic Gate: PRIMARY INPUT = CARACTERISTICAS_TECNICAS
    // El contexto siempre llega con el prefijo "CARACTERISTICAS_TECNICAS:" desde el Hub.
    // Si el contexto no existe o no tiene datos reales, se emite DATA_SOURCE_EMPTY.
    if (!context || !context.includes('CARACTERISTICAS_TECNICAS:') || context.replace('CARACTERISTICAS_TECNICAS:', '').trim() === '') {
        console.error("[SEO_MKT] Logic Gate activado: PRIMARY INPUT vacío o inválido.");
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
Protocolo ADN activo. Fidelidad absoluta a los datos técnicos.

PRIMARY INPUT — ÚNICA FUENTE DE VERDAD:
${context}

IMAGEN DEL PRODUCTO: Analiza la imagen para detectar forma, acabado, color y uso implícito. 
Si hay discrepancia entre la imagen y las specs, la imagen tiene prioridad sobre la forma; las specs tienen prioridad sobre el contenido técnico.

REGLAS DE ORO (@seo_mkt — sin excepciones):
1. PROHIBICIÓN ABSOLUTA DE NOMBRES: Nunca menciones nombres de marca, modelos o SKUs (ej. "SILLY", "YAMA", "W35"). Refiérete por categoría o esencia ("Este aliado de hidratación", "La pieza", "El instrumento").
2. FIDELIDAD TÉCNICA: Solo usa materiales, certificaciones e impactos presentes en el PRIMARY INPUT. Prohibido inventar.
3. TONO "CIERRE DE NEGOCIO": Directo, ejecutivo, sofisticado. Nunca informal ni entusiasta ("¡Te va a encantar!").
4. NARRATIVA RÍTMICA: Estilo Comercial de TV. Frases cortas, ritmo, alto impacto psicológico para el decisor B2B.
5. PROHIBIDO EL RELLENO: Si los datos técnicos no permiten construir una afirmación, simplemente no la hagas.

ESTRUCTURA DE SALIDA REQUERIDA (responde SOLO esto, sin texto adicional):
SUBJECT: [Asunto de email — MÁX 4 PALABRAS, tono ejecutivo, genera urgencia o exclusividad]
PART1: [Titular potente — máx 6 palabras, uppercase, sin nombre de producto]
PART2: [EXACTAMENTE 4 frases cortas. Cada frase en una línea separada. CRITERIO: extraer las 4 características MÁS BUSCADAS del producto según el PRIMARY INPUT (priorizar: temperatura, material, capacidad, sostenibilidad, diseño). Cada frase máx 12 palabras. Tono ejecutivo. Sin bullets ni numeración. Sin mencionar nombres de marca.]
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
