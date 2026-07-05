
import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import util from 'util';

const execPromise = util.promisify(exec);

export async function POST() {
    try {
        console.log('--- Iniciando Pipeline de Publicación desde Studio ---');
        
        // 1. Sincronizar Repositorio Admin (EcomovingWeb)
        // Guardamos los cambios del diseño actual antes de generar el build estático
        console.log('Sincronizando cambios técnicos en EcomovingWeb...');
        await execPromise('git add . && git commit -m "sync: auto-commit from studio publish button" || echo "No technical changes to commit"');
        await execPromise('git push').catch(err => console.warn('Push Admin omitido o fallido:', err.message));

        // 2. Ejecutar Protocolo de Publicación Estática (publish.ps1)
        // Este script maneja el aislamiento de rutas, npm run build, sync con ecomoving-site y push a producción.
        const scriptPath = 'c:\\Users\\Mario\\Desktop\\LaFabrica\\publish.ps1';
        console.log(`Ejecutando script oficial: ${scriptPath}`);
        
        const { stdout } = await execPromise(`powershell -ExecutionPolicy Bypass -File "${scriptPath}"`);
        console.log('Resultado del script:', stdout);

        return NextResponse.json({ 
            success: true, 
            message: 'Sitio publicado con éxito. Se ha sincronizado el repositorio Admin y se ha desplegado la versión estática a Producción.',
            logs: stdout.split('\n').slice(-5).join('\n') // Últimas líneas del log
        });
    } catch (error: any) {
        console.error('Error en el pipeline de publicación:', error);
        return NextResponse.json({ 
            success: false, 
            error: 'Fallo en el proceso de publicación.',
            details: error.message,
            stderr: error.stderr
        }, { status: 500 });
    }
}
