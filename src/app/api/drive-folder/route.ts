import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const cache = new Map<string, { data: any, timestamp: number }>();
const CACHE_TTL = 30000;

// MOTOR DE EXTRACCIÓN PARA DRIVE ECOMOVING
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const folderId = searchParams.get('folderId');

    if (!folderId) return NextResponse.json({ error: 'Missing Folder ID' }, { status: 400 });

    if (cache.has(folderId)) {
        const cached = cache.get(folderId)!;
        if (Date.now() - cached.timestamp < CACHE_TTL) return NextResponse.json(cached.data);
    }

    try {
        const url = `https://drive.google.com/drive/folders/${folderId}`;
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Accept-Language': 'es-ES,es;q=0.9',
            },
            cache: 'no-store'
        });

        if (!response.ok) throw new Error(`Drive inaccessible: ${response.status}`);

        const html = await response.text();
        const items: any[] = [];
        const seenIds = new Set();

        // TÉCNICA DE EXTRACCIÓN QUIRÚRGICA: Buscamos el array gigante de datos inyectados
        // Google guarda los items en un formato [ "ID", "Nombre", MimeType, ... ]
        const dataBlocks = html.match(/AF_initDataCallback\({key: 'ds:\d'[\s\S]*?data:([\s\S]*?)}\);/g) || [];

        for (const block of dataBlocks) {
            // Buscamos la estructura ["ID","Nombre"]
            const itemRegex = /"([^"]{28,40})","([^"]{1,100})"/g;
            let match;
            while ((match = itemRegex.exec(block)) !== null) {
                const id = match[1];
                let name = match[2];

                // Filtros de calidad (Evitar basura de la API de Google)
                if (id === folderId || seenIds.has(id)) continue;
                if (!id.match(/^[a-zA-Z0-9_-]{33}$/)) continue; // Los IDs reales siempre tienen 33 chars
                if (name.length < 2 || name.includes('http') || name.includes('/') || name.includes('google')) continue;
                if (name === id) continue;

                try { if (name.includes('\\')) name = JSON.parse(`"${name}"`); } catch (e) { }

                seenIds.add(id);
                // Detección de carpeta: Buscamos el mimetype 'folder' en los alrededores
                const context = block.substring(match.index, match.index + 500);
                const isFolder = context.includes('folder') || context.includes('vnd.google-apps.folder');

                items.push({
                    id,
                    name,
                    type: isFolder ? 'folder' : 'file',
                    thumbnail: isFolder ? null : `https://drive.google.com/thumbnail?id=${id}&sz=w1200`
                });
            }
        }

        // FALLBACK: Si no detectamos carpetas/nombres con el patrón anterior
        // Buscamos cualquier ID de 33 caracteres y le asignamos un placeholder.
        if (items.length === 0) {
            const idPattern = /"([a-zA-Z0-9_-]{33})"/g;
            let bruteMatch;
            while ((bruteMatch = idPattern.exec(html)) !== null) {
                const id = bruteMatch[1];
                if (id !== folderId && !seenIds.has(id)) {
                    seenIds.add(id);
                    items.push({
                        id,
                        name: 'Foto detectada',
                        type: 'file',
                        thumbnail: `https://drive.google.com/thumbnail?id=${id}&sz=w1200`
                    });
                }
            }
        }

        items.sort((a, b) => {
            if (a.type !== b.type) return a.type === 'folder' ? -1 : 1;
            return a.name.localeCompare(b.name);
        });

        const result = { items };
        cache.set(folderId, { data: result, timestamp: Date.now() });
        return NextResponse.json(result);

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
