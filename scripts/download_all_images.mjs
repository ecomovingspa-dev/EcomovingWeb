import fs from 'fs';
import path from 'path';
import https from 'https';

const JSON_PATH = 'C:/Users/Mario/Desktop/catalogo_ecomoving/mug/datos_mug.json';
const BASE_OUTPUT_DIR = 'C:/Users/Mario/Desktop/catalogo_ecomoving/mug/imagenes_completas';

if (!fs.existsSync(BASE_OUTPUT_DIR)) {
    fs.mkdirSync(BASE_OUTPUT_DIR, { recursive: true });
}

async function fetchPage(url) {
    return new Promise((resolve, reject) => {
        https.get(url, { rejectUnauthorized: false }, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => resolve(data));
        }).on('error', reject);
    });
}

async function downloadImage(url, dest) {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(dest);
        https.get(url, { rejectUnauthorized: false }, (response) => {
            if (response.statusCode !== 200) {
                reject(new Error(`Status: ${response.statusCode}`));
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
        console.log(`Procesando ${data.length} productos para descargar TODAS sus imágenes...`);

        for (const item of data) {
            console.log(`\n--- Producto: ${item.code} ---`);
            const productFolder = path.join(BASE_OUTPUT_DIR, item.code);
            if (!fs.existsSync(productFolder)) fs.mkdirSync(productFolder);

            try {
                const html = await fetchPage(item.link);
                // Buscar URLs de imágenes originales en el HTML
                // Patrón: data-src="https://.../original/nombre.jpg"
                const imgRegex = /data-src="([^"]+\/original\/[^"]+)"/g;
                let match;
                const foundUrls = new Set();

                while ((match = imgRegex.exec(html)) !== null) {
                    foundUrls.add(match[1]);
                }

                if (foundUrls.size === 0) {
                    console.log(`⚠️ No se encontraron imágenes adicionales. Bajando principal...`);
                    const mainUrl = item.image_url.replace('/big_thumb/', '/original/').split('?')[0];
                    await downloadImage(mainUrl, path.join(productFolder, `${item.code}_main.jpg`));
                } else {
                    console.log(`Encontradas ${foundUrls.size} imágenes.`);
                    let i = 1;
                    for (const url of foundUrls) {
                        const cleanUrl = url.split('?')[0];
                        const ext = path.extname(cleanUrl) || '.jpg';
                        const dest = path.join(productFolder, `${item.code}_${i}${ext}`);
                        process.stdout.write(`Descargando imagen ${i}... `);
                        await downloadImage(cleanUrl, dest);
                        console.log('✅');
                        i++;
                    }
                }
            } catch (err) {
                console.error(`❌ Error procesando ${item.code}: ${err.message}`);
            }
        }
        console.log(`\n--- ¡LISTO! ---`);
        console.log(`Las imágenes están organizadas por carpeta en: ${BASE_OUTPUT_DIR}`);
    } catch (err) {
        console.error('Error:', err);
    }
}

run();
