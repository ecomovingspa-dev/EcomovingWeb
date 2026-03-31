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
                    <img src="https://xgdmyjzyejjmwdqkufhp.supabase.co/storage/v1/object/public/logo_ecomoving/Logo_horizontal.png" alt="Ecomoving" width="250" style="width: 250px; display: block;" />
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
            // PROTOCOLO @seo_mkt: Intentar con 2.0-flash, fallback a 1.5-flash en reintentos por 429
            const modelName = i < 2 ? "gemini-2.0-flash" : "gemini-1.5-flash";
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

            if (isRateLimit && i < maxRetries - 1) {
                const waitTime = Math.pow(2, i) * 5000; // Incrementamos ligeramente el cooldown
                console.warn(`[SEO_MKT] Saturación en ${i < 2 ? '2.0-flash' : '1.5-flash'}. Reintento ${i + 1}/${maxRetries} en ${waitTime / 1000}s...`);
                await new Promise(resolve => setTimeout(resolve, waitTime));
                continue;
            }

            console.error("[SEO_MKT] Error crítico en Gemini AI:", error);
            throw new Error(isRateLimit
                ? "El servicio de Google está temporalmente saturado. Hemos intentado alternar modelos sin éxito. Por favor, reintenta en 60 segundos."
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
