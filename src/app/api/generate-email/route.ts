import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY || '');

export async function POST(request: NextRequest) {
    try {
        const { technical_specs, productName } = await request.json();

        if (!technical_specs || technical_specs.length === 0) {
            return NextResponse.json({ error: '[FATAL_ERROR: DATA_SOURCE_EMPTY]' }, { status: 400 });
        }

        const model = genAI.getGenerativeModel({
            model: 'gemini-1.5-flash',
            generationConfig: { responseMimeType: "application/json" }
        });

        const prompt = `
Eres el Módulo de Inteligencia Semántica @seo_mkt de Ecomoving. Tu función es transformar datos técnicos en activos de autoridad comercial y narrativa de alto impacto (estilo Comercial de TV).

PRIMARY INPUT (Características Técnicas - Fuente de Verdad):
${technical_specs.join('\n')}

PRODUCT NAME: ${productName}

REGLAS CRÍTICAS (@seo_mkt):
1. TONO: "Cierre de Negocio". Ejecutivo, directo, seguro. Superioridad técnica.
2. NARRATIVA ARMÓNICA: Debe ser rítmica, breve y de alto impacto psicológico. 
3. CUERPO: Genera un ÚNICO PÁRRAFO FLUIDO (sin viñetas, sin números, sin itemizados). Máximo 4 líneas.
4. ASUNTO: Debe ser un abre-puertas corporativo (máx 5-6 palabras).
5. PART1: Un titular secundario en mayúsculas que refuerce la propuesta de valor (máx 6 palabras).
6. FIDELIDAD ABSOLUTA: Prohibido inventar materiales o certificaciones no presentes en el input.

ESTRUCTURA DE SALIDA (JSON ÚNICAMENTE):
{
  "email_subject": "Asunto potente",
  "part1": "TITULAR SECUNDARIO EN MAYÚSCULAS",
  "email_body": "Párrafo armónico y fluido de la narrativa."
}
`;

        const result = await model.generateContent(prompt);
        const textResponse = result.response.text();

        let parsed;
        try {
            const cleanText = textResponse.replace(/```json/g, '').replace(/```/g, '').trim();
            parsed = JSON.parse(cleanText);
        } catch (e) {
            const jsonMatch = textResponse.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                parsed = JSON.parse(jsonMatch[0]);
            } else {
                return NextResponse.json(
                    { error: 'Error processing MKT request', details: `Formato inválido. Respuesta:\n${textResponse}` },
                    { status: 500 }
                );
            }
        }

        return NextResponse.json({ success: true, data: parsed });

    } catch (error: any) {
        console.error('generate-email API Error:', error);
        return NextResponse.json(
            { error: 'Error processing MKT request', details: error.message || String(error) },
            { status: 500 }
        );
    }
}

