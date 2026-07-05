import { NextRequest, NextResponse } from 'next/server';
import { generateBannerAI } from '@/lib/gemini';

export async function POST(request: NextRequest) {
    try {
        const { technical_specs } = await request.json();

        if (!technical_specs || technical_specs.length === 0) {
            return NextResponse.json({ error: '[FATAL_ERROR: DATA_SOURCE_EMPTY]' }, { status: 400 });
        }

        const parsed = await generateBannerAI(technical_specs);

        return NextResponse.json({ success: true, data: parsed });

    } catch (error: any) {
        console.error('generate-banner API Error:', error);
        const errorMessage = error.message || String(error);
        const isQuotaError = errorMessage.includes('429') || errorMessage.toLowerCase().includes('quota') || errorMessage.toLowerCase().includes('too many requests');
        
        return NextResponse.json(
            { 
                error: isQuotaError ? 'Límite de IA excedido (Actuando Salvavidas Local)' : 'Error processing Banner request', 
                details: errorMessage 
            },
            { status: isQuotaError ? 429 : 500 }
        );
    }
}
