import fs from 'fs';
import path from 'path';
import https from 'https';

const JSON_PATH = 'C:/Users/Mario/Desktop/catalogo_ecomoving/mug/datos_mug.json';
const OUTPUT_DIR = 'C:/Users/Mario/Desktop/catalogo_ecomoving/mug/imagenes_alta_resolucion';

if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

async function downloadImage(url, dest) {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(dest);
        https.get(url, { rejectUnauthorized: false }, (response) => {
            if (response.statusCode !== 200) {
                reject(new Error(`Failed to get '${url}' (Status: ${response.statusCode})`));
                return;
            }
            response.pipe(file);
            file.on('finish', () => {
                file.close();
                resolve();
            });
        }).on('error', (err) => {
            fs.unlink(dest, () => { });
            reject(err);
        });
    });
}

async function run() {
    try {
        const data = JSON.parse(fs.readFileSync(JSON_PATH, 'utf8'));
        console.log(`Encontrados ${data.length} productos en el JSON.`);

        for (const item of data) {
            if (item.image_url) {
                // Transformar URL de big_thumb a original
                // Ejemplo: .../big_thumb/nombre.jpg -> .../original/nombre.jpg
                const highResUrl = item.image_url.replace('/big_thumb/', '/original/').split('?')[0];
                const filename = `${item.code}.jpg`;
                const dest = path.join(OUTPUT_DIR, filename);

                console.log(`Descargando ${item.code} desde: ${highResUrl}`);
                try {
                    await downloadImage(highResUrl, dest);
                    console.log(`✅ Guardado: ${filename}`);
                } catch (err) {
                    console.error(`❌ Error con ${item.code}: ${err.message}`);

                    // Reintento con la URL original por si acaso el reemplazo falló
                    console.log(`Intentando con URL original de respaldo...`);
                    try {
                        await downloadImage(item.image_url, dest);
                        console.log(`⚠️ Guardada miniatura (original no disponible)`);
                    } catch (err2) {
                        console.error(`❌ Error fatal con ${item.code}`);
                    }
                }
            }
        }
        console.log('\n--- Proceso finalizado ---');
        console.log(`Las imágenes están en: ${OUTPUT_DIR}`);
    } catch (err) {
        console.error('Error procesando el archivo JSON:', err);
    }
}

run();
