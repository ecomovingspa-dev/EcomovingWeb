import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(req: Request) {
    try {
        const { projectPath, fileName } = await req.json();

        if (!projectPath || !fileName) {
            return NextResponse.json({ error: 'Missing path or filename' }, { status: 400 });
        }

        let fullPath = path.join(projectPath, fileName);
        if (fileName === 'web_content_sync.json' || fileName === 'productos_db.json') {
            const publicPath = path.join(projectPath, 'public', fileName);
            if (fs.existsSync(path.join(projectPath, 'public')) || fs.existsSync(publicPath)) {
                fullPath = publicPath;
            }
        }

        if (!fs.existsSync(fullPath)) {
            // Si el archivo no existe, devolvemos un estado vacío pero exitoso para no romper el hook
            return NextResponse.json({ 
                success: true, 
                content: { hero: {}, sections: [] },
                message: 'File not found, returning empty schema' 
            });
        }

        const fileContent = fs.readFileSync(fullPath, 'utf8');
        const jsonContent = JSON.parse(fileContent);

        return NextResponse.json({ 
            success: true, 
            content: jsonContent 
        });

    } catch (error: any) {
        console.error('Local Read Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
