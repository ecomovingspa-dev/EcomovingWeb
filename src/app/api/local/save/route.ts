import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(request: Request) {
    try {
        const { projectPath, fileName, content } = await request.json();

        if (!projectPath || !fileName) {
            return NextResponse.json({ error: 'Faltan parámetros de ruta' }, { status: 400 });
        }

        // Aseguramos que la ruta sea absoluta y válida
        const targetPath = path.join(projectPath, fileName);
        
        // Verificamos si la carpeta existe, si no, la creamos recursivamente
        if (!fs.existsSync(projectPath)) {
            fs.mkdirSync(projectPath, { recursive: true });
        }

        // Si el contenido es un objeto, lo stringificamos como JSON
        const dataToSave = typeof content === 'string' ? content : JSON.stringify(content, null, 2);

        // Guardamos el archivo físicamente en el disco duro del usuario
        fs.writeFileSync(targetPath, dataToSave, 'utf8');

        console.log(`[LOCAL-SAVE] Archivo guardado con éxito en: ${targetPath}`);

        return NextResponse.json({ 
            success: true, 
            path: targetPath,
            message: 'Guardado físicamente en local con éxito' 
        });

    } catch (error: any) {
        console.error('[LOCAL-SAVE-ERROR]', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
