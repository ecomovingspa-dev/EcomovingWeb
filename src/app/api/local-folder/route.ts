import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

// Endpoint para el Explorador Local de Ecomoving
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const folderPath = searchParams.get('path') || 'C:\\Users\\Mario\\Desktop';
    const search = searchParams.get('search'); // Nuevo parámetro para búsqueda por SKU

    // Validación de seguridad básica para el entorno local (normalizada)
    const normalizedPath = folderPath.replace(/\\/g, '/').toLowerCase();
    const cleanPrefix = 'c:/users/mario'.toLowerCase();

    if (!normalizedPath.startsWith(cleanPrefix)) {
        return NextResponse.json({ error: 'Acceso restringido a carpetas de usuario' }, { status: 403 });
    }

    try {
        if (!fs.existsSync(folderPath)) {
            return NextResponse.json({ items: [] });
        }

        const entries = fs.readdirSync(folderPath, { withFileTypes: true });

        let items = entries.map(entry => {
            const fullPath = path.join(folderPath, entry.name);
            const isDirectory = entry.isDirectory();

            // Filtros de archivos basura
            if (entry.name.startsWith('.') || entry.name === 'System Volume Information') return null;

            // Si hay búsqueda, filtramos por SKU contenido en el nombre
            if (search && !isDirectory) {
                const cleanSearch = search.trim().toLowerCase();
                const cleanName = entry.name.toLowerCase();
                if (!cleanName.includes(cleanSearch)) return null;
            }

            return {
                id: fullPath,
                name: entry.name,
                type: isDirectory ? 'folder' : 'file',
                thumbnail: isDirectory ? null : `/api/local-asset?path=${encodeURIComponent(fullPath)}`
            };
        }).filter(Boolean);

        // Si es una búsqueda, limitamos resultados para no saturar
        if (search) items = items.slice(0, 50);

        // Ordenar: Carpetas primero
        items.sort((a: any, b: any) => {
            if (a.type !== b.type) return a.type === 'folder' ? -1 : 1;
            return a.name.localeCompare(b.name);
        });

        return NextResponse.json({ items });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
