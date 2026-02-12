import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Inicializar Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(request: NextRequest) {
    try {
        const { action, text, context, section } = await request.json();

        if (!action) {
            return NextResponse.json({ error: 'Action is required' }, { status: 400 });
        }

        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

        let prompt = '';
        let systemContext = `Eres un Redactor SEO Estratégico de Élite para Ecomoving Chile. 
Tu especialidad es el Merchandising Corporativo y Regalos Empresariales de alto impacto.

REGLAS DE ORO:
1. MERCADO: Chile (B2B). Uso de términos como "Ventas Corporativas", "Regalos para Empresas", "Merchandising".
2. TONO: Profesional, elegante (Premium) pero versátil para productos masivos.
3. ESTILO: Directo, sin rellenos. Máximo impacto con el mínimo de palabras.
4. VOCABULARIO: Evita el abuso de la palabra "premium". Usa sinónimos como: calidad superior, excelencia, distinción, durabilidad, versatilidad.
5. CONTEXTO: Entiende que el usuario está editando una sección específica (Mugs, Botellas, etc.). Tus sugerencias DEBEN aludir directamente a esos productos y sus beneficios (ej: botellas térmicas, mugs de cerámica, mochilas ergonómicas).`;

        switch (action) {
            case 'analyze':
                prompt = `${systemContext}

Analiza este texto para la sección "${section || 'General'}":
"${text}"

Proporciona:
1. Puntuación SEO (0-100)
2. Fortalezas
3. Debilidades
4. Sugerencia de mejora

Responde en formato JSON:
{
  "score": number,
  "strengths": ["string"],
  "weaknesses": ["string"],
  "suggestions": ["string"]
}`;
                break;

            case 'improve':
                prompt = `${systemContext}

TAREA: Mejora el siguiente texto.
SECCIÓN ACTUAL: ${section || 'General'}
CONTEXTO DE CAMPO: ${context || 'Texto general'}

Texto original a mejorar:
"${text}"

REQUISITOS ADICIONALES:
- Si la sección es de un producto específico (Mugs, Botellas, etc.), la sugerencia DEBE aludir a ese producto.
- No inventes información, potencia el mensaje existente.

Responde en formato JSON:
{
  "improved": "texto mejorado",
  "keywords_used": ["keyword1", "keyword2"],
  "reason": "breve explicación del cambio"
}`;
                break;

            case 'generate':
                prompt = `${systemContext}

Genera un nuevo texto optimizado para SEO.
Sección: ${section}
Tipo de contenido: ${context || 'descripción'}

Requisitos:
- Máximo 2-3 oraciones para descripciones
- 5-8 palabras para títulos
- Incluir al menos 1 keyword principal
- Tono premium y profesional

Responde en formato JSON:
{
  "text": "texto generado",
  "keywords": ["keyword1", "keyword2"],
  "seo_tips": ["tip1", "tip2"]
}`;
                break;

            case 'auto_optimize':
                prompt = `${systemContext}

Optimiza TODOS los campos de texto de la siguiente sección para máximo impacto SEO y comercial. 
Debes mejorar la redacción, incluir palabras clave estratégicas de forma natural y mantener el tono premium.

Contenido actual de la sección:
${JSON.stringify(text)}

Requisitos por campo:
- Títulos: 5-10 palabras, impactantes y con keyword principal.
- Párrafos: 2-3 oraciones, informativos y persuasivos.

Responde en formato JSON:
{
  "optimized": { ...los mismos campos con el texto mejorado },
  "summary": "Resumen de las mejoras realizadas"
}`;
                break;

            case 'audit':
                prompt = `${systemContext}

Realiza una auditoría SEO completa de los siguientes textos de la landing page:

${text}

Proporciona:
1. Puntuación general (0-100)
2. Análisis por sección
3. Recomendaciones prioritarias (top 5)
4. Meta tags sugeridos (title y description)

Responde en formato JSON:
{
  "overall_score": number,
  "section_scores": {"hero": number, "mugs": number},
  "priority_recommendations": ["string"],
  "meta_tags": {
    "title": "string (máx 60 caracteres)",
    "description": "string (máx 160 caracteres)"
  }
}`;
                break;

            default:
                return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
        }

        const result = await model.generateContent(prompt);
        const response = result.response;
        const textResponse = response.text();

        // Intentar parsear como JSON
        try {
            const jsonMatch = textResponse.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const parsed = JSON.parse(jsonMatch[0]);
                return NextResponse.json({ success: true, data: parsed });
            }
        } catch {
            // Si no es JSON válido, devolver como texto
        }

        return NextResponse.json({ success: true, data: { raw: textResponse } });

    } catch (error) {
        console.error('SEO API Error:', error);
        return NextResponse.json(
            { error: 'Error processing SEO request', details: String(error) },
            { status: 500 }
        );
    }
}
