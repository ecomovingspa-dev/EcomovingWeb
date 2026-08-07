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

        let contentType = 'application/octet-stream';
        if (ext === 'png') contentType = 'image/png';
        else if (ext === 'webp') contentType = 'image/webp';
        else if (ext === 'gif') contentType = 'image/gif';
        else if (ext === 'jpg' || ext === 'jpeg') contentType = 'image/jpeg';
        else if (ext === 'css') contentType = 'text/css; charset=utf-8';
        else if (ext === 'js') contentType = 'application/javascript; charset=utf-8';

        return new Response(fileBuffer, {
            headers: {
                'Content-Type': contentType,
                'Cache-Control': 'no-cache, no-store, must-revalidate'
            }
        });

    } catch (error: any) {
        return new Response(error.message, { status: 500 });
    }
}
