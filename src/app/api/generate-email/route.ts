import { NextRequest, NextResponse } from 'next/server';
import { generateEmailAI } from '@/lib/gemini';

export async function POST(request: NextRequest) {
    try {
        const { technical_specs, productName } = await request.json();

        if (!technical_specs || technical_specs.length === 0) {
            return NextResponse.json({ error: '[FATAL_ERROR: DATA_SOURCE_EMPTY]' }, { status: 400 });
        }

        const parsed = await generateEmailAI(technical_specs, productName);

        return NextResponse.json({ success: true, data: parsed });

    } catch (error: any) {
        console.error('generate-email API Error:', error);
        const errorMessage = error.message || String(error);
        const isQuotaError = errorMessage.includes('429') || errorMessage.toLowerCase().includes('quota') || errorMessage.toLowerCase().includes('too many requests');
        
        return NextResponse.json(
            { 
                error: isQuotaError ? 'Límite de IA excedido (Actuando Salvavidas Local)' : 'Error processing MKT request', 
                details: errorMessage 
            },
            { status: isQuotaError ? 429 : 500 }
        );
    }
}

