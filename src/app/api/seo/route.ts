import { NextRequest, NextResponse } from 'next/server';
import { generateSEOQueryAI } from '@/lib/gemini';

/**
 * MOTOR DE SEO (@seo_mkt): Inteligencia Semántica centrada en Google AI Studio.
 * SISTEMA SALVAVIDAS: Fallback automático a Ollama local ante errores 429.
 */
export async function POST(request: NextRequest) {
    try {
        const { action, text, context, section } = await request.json();

        if (!action) {
            return NextResponse.json({ error: 'Action is required' }, { status: 400 });
        }

        let prompt = '';
        let systemContext = `Rol: Redactor SEO B2B para Ecomoving.
Regla: Prohibido usar frases genéricas pre-armadas. El texto debe ser único y basarse estrictamente en los datos técnicos y el contexto entregado.`;

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

RESPONDE EXCLUSIVAMENTE EN FORMATO JSON:
{
  "score": number,
  "strengths": ["string"],
  "weaknesses": ["string"],
  "suggestions": ["string"]
}`;
                break;

            case 'improve':
                prompt = `${systemContext}

INSTRUCCIONES PRINCIPALES DEL FRONTEND:
${context || 'Mejora este texto'}

Texto a procesar:
"${text}"

RESPONDE EXCLUSIVAMENTE CON EL TEXTO MEJORADO EN FORMATO JSON:
{
  "improved": "tu_texto_aqui"
}`;
                break;

            case 'generate':
                prompt = `${systemContext}

Genera un nuevo texto optimizado para SEO.
Sección: ${section}
Tipo de contenido: ${context || 'descripción'}

Requisitos:
- Máximo 2 - 3 oraciones para descripciones
- 5 - 8 palabras para títulos
- Incluir al menos 1 keyword principal
- Tono premium y profesional

RESPONDE EXCLUSIVAMENTE EN FORMATO JSON:
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
- Títulos: 5 - 10 palabras, impactantes y con keyword principal.
- Párrafos: 2 - 3 oraciones, informativos y persuasivos.

RESPONDE EXCLUSIVAMENTE EN FORMATO JSON:
{
  "optimized": { "...": "" },
  "summary": "Resumen de las mejoras realizadas"
}`;
                break;

            case 'audit':
                prompt = `${systemContext}

Realiza una auditoría SEO completa de los siguientes textos de la landing page:

${text}

Proporciona:
1. Puntuación general (0 - 100)
2. Análisis por sección
3. Recomendaciones prioritarias (top 5)
4. Meta tags sugeridos (title y description)

RESPONDE EXCLUSIVAMENTE EN FORMATO JSON:
{
  "overall_score": 0,
  "section_scores": { "hero": 0, "mugs": 0 },
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

        // Llamada al motor centralizado (Gemini con fallback a Ollama)
        const parsedData = await generateSEOQueryAI(prompt);

        if (parsedData) {
            return NextResponse.json({ success: true, data: parsedData });
        }

        return NextResponse.json({ error: 'AI engine failed to produce valid response' }, { status: 500 });

    } catch (error: any) {
        console.error('SEO API Error:', error);
        const errorMessage = error.message || String(error);
        const isQuotaError = errorMessage.includes('429');

        return NextResponse.json(
            { 
                error: isQuotaError ? 'Límite de IA excedido (Actuando Salvavidas Local)' : 'Error procesando solicitud de SEO', 
                details: errorMessage 
            },
            { status: isQuotaError ? 429 : 500 }
        );
    }
}

