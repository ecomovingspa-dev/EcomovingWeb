import { NextResponse } from 'next/server';
import { execSync } from 'child_process';

export async function POST(request: Request) {
    try {
        const { projectPath, commitMessage } = await request.json();

        if (!projectPath) {
            return NextResponse.json({ error: 'Falta la ruta del proyecto' }, { status: 400 });
        }

        const msg = commitMessage || 'Manual update from La Fabrica Studio';

        console.log(`[GIT-SYNC] Iniciando despliegue para: ${projectPath}`);

        // Comandos secuenciales de GIT
        // 1. Add
        execSync('git add .', { cwd: projectPath });
        
        // 2. Commit (usamos try-catch por si no hay cambios)
        try {
            execSync(`git commit -m "${msg}"`, { cwd: projectPath });
        } catch (e) {
            console.log('[GIT-SYNC] No hay cambios pendientes para commit.');
        }

        // 3. Push
        execSync('git push', { cwd: projectPath });

        console.log(`[GIT-SYNC] Despliegue exitoso hacia GitHub desde: ${projectPath}`);

        return NextResponse.json({ 
            success: true, 
            message: 'Sincronización con GitHub completada con éxito 🚀' 
        });

    } catch (error: any) {
        console.error('[GIT-SYNC-ERROR]', error.message);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
