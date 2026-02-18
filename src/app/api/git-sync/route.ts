
import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import util from 'util';

const execPromise = util.promisify(exec);

export async function POST() {
    try {
        // 1. Commit and push EcomovingWeb (Admin)
        console.log('Syncing EcomovingWeb...');
        await execPromise('git add . && git commit -m "sync: auto-deploy from admin dashboard" || echo "No changes to commit"');
        await execPromise('git push origin master');

        // 2. Commit and push ecomoving-site (Public) - if reachable
        // Note: This assumes the ecomoving-site folder is adjacent and accessible, which might be tricky due to permissions or paths.
        // However, the user is running this locally on Windows, so we can try absolute paths.
        // The path is c:\Users\Mario\Desktop\ecomoving-site
        console.log('Syncing ecomoving-site...');
        const publicSitePath = 'c:\\Users\\Mario\\Desktop\\ecomoving-site';
        try {
            await execPromise(`git -C "${publicSitePath}" add . && git -C "${publicSitePath}" commit -m "sync: auto-deploy from admin dashboard" || echo "No changes to commit"`);
            await execPromise(`git -C "${publicSitePath}" push origin main`);
        } catch (err) {
            console.warn('Could not sync ecomoving-site (public):', err);
            // We continue, as maybe only Admin changes needed syncing
        }

        return NextResponse.json({ success: true, message: 'Cambios sincronizados con GitHub correctamente.' });
    } catch (error: any) {
        console.error('Git Sync Error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
