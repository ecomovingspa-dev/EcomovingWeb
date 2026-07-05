import { NextRequest, NextResponse } from 'next/server';
import { generateSEOAI } from '@/lib/gemini';

export async function POST(request: NextRequest) {
    try {
        const { technical_specs } = await request.json();

        if (!technical_specs || technical_specs.length === 0) {
            return NextResponse.json({ error: '[FATAL_ERROR: DATA_SOURCE_EMPTY]' }, { status: 400 });
        }

        const context = Array.isArray(technical_specs) ? technical_specs.join('\n') : technical_specs;
        const seoData = await generateSEOAI(context);

        return NextResponse.json({ success: true, data: seoData });

    } catch (error: any) {
        console.error('generate-seo API Error:', error);
        const errorMessage = error.message || String(error);
        const isQuotaError = errorMessage.includes('429') || errorMessage.toLowerCase().includes('quota');
        
        return NextResponse.json(
            { 
                error: isQuotaError ? 'Límite de IA excedido (Quota Exceeded). Reintenta en 60s.' : 'Error processing SEO request', 
                details: errorMessage 
            },
            { status: isQuotaError ? 429 : 500 }
        );
    }
}

