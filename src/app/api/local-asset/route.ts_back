import { NextResponse } from 'next/server';
import fs from 'fs';

// Endpoint para servir archivos locales al navegador
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const filePath = searchParams.get('path');

    if (!filePath) return new Response('Missing path', { status: 400 });

    try {
        if (!fs.existsSync(filePath)) return new Response('Not found', { status: 404 });

        const fileBuffer = fs.readFileSync(filePath);
        const ext = filePath.split('.').pop()?.toLowerCase();

        let contentType = 'image/jpeg';
        if (ext === 'png') contentType = 'image/png';
        if (ext === 'webp') contentType = 'image/webp';
        if (ext === 'gif') contentType = 'image/gif';

        return new Response(fileBuffer, {
            headers: {
                'Content-Type': contentType,
                'Cache-Control': 'public, max-age=31536000, immutable'
            }
        });

    } catch (error: any) {
        return new Response(error.message, { status: 500 });
    }
}
