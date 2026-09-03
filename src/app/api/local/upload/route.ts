import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(req: Request) {
    try {
        const formData = await req.formData();
        const file = formData.get('file') as File;
        const projectPath = formData.get('projectPath') as string;
        const tab = (formData.get('tab') as string) || 'grilla'; // grilla, marketing, catalog, premium

        if (!file || !projectPath) {
            return NextResponse.json({ error: 'Faltan parámetros' }, { status: 400 });
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        const filename = file.name;
        
        // Guardar de forma estandarizada en [projectPath]/public/[folder]
        const targetFolder = tab === 'catalog' ? 'productos' : tab;
        const targetDir = path.join(projectPath, 'public', targetFolder);

        // Crear directorio si no existe
        if (!fs.existsSync(targetDir)) {
            fs.mkdirSync(targetDir, { recursive: true });
        }

        const targetPath = path.join(targetDir, filename);
        fs.writeFileSync(targetPath, buffer);

        console.log(`[LOCAL-UPLOAD] Imagen guardada en: ${targetPath}`);

        return NextResponse.json({
            success: true,
            url: `/${targetFolder}/${filename}`,
            path: targetPath
        });
    } catch (e: any) {
        console.error('[LOCAL-UPLOAD-ERROR]', e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
