import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(req: Request) {
    try {
        const { projectPath, fileName } = await req.json();

        if (!projectPath || !fileName) {
            return NextResponse.json({ error: 'Missing path or filename' }, { status: 400 });
        }

        const fullPath = path.join(projectPath, fileName);

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
