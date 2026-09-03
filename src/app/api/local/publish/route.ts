import { NextResponse } from 'next/server';
import { exec } from 'child_process';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
    try {
        const { projectPath } = await request.json();

        console.log(`[PUBLISH] Ejecutando script de publicación para: ${projectPath}`);
        
        const scriptPath = 'C:\\Users\\Mario\\Desktop\\LaFabrica\\publish.ps1';
        
        return new Promise((resolve) => {
            exec(`powershell -ExecutionPolicy Bypass -File "${scriptPath}"`, { cwd: 'C:\\Users\\Mario\\Desktop\\LaFabrica' }, (error, stdout, stderr) => {
                if (error) {
                    console.error('[PUBLISH-ERROR]', error.message, stderr);
                    resolve(NextResponse.json({ error: error.message, details: stderr }, { status: 500 }));
                } else {
                    console.log('[PUBLISH-SUCCESS]', stdout);
                    resolve(NextResponse.json({ 
                        success: true, 
                        message: 'Sitio web compilado, respaldado y publicado en GitHub con éxito 🚀',
                        log: stdout 
                    }));
                }
            });
        });

    } catch (error: any) {
        console.error('[PUBLISH-ERROR]', error.message);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
