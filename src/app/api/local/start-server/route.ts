import { NextResponse } from 'next/server';
import { exec } from 'child_process';

export async function POST(request: Request) {
    try {
        const { projectPath } = await request.json();

        if (!projectPath) {
            return NextResponse.json({ error: 'Falta la ruta del proyecto' }, { status: 400 });
        }

        // Iniciamos el servidor de Vite en la carpeta del proyecto
        // Usamos shell: true para ejecutarlo en segundo plano sin bloquear el hilo
        exec('npm run dev', { cwd: projectPath });

        // Esperamos 2 segundos para dar tiempo a levantar el servidor y abrimos en el navegador
        setTimeout(() => {
            exec('start http://localhost:5173');
        }, 2000);

        return NextResponse.json({ 
            success: true, 
            message: 'Iniciando servidor Vite y abriendo http://localhost:5173/' 
        });

    } catch (error: any) {
        console.error('[START-SERVER-ERROR]', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
