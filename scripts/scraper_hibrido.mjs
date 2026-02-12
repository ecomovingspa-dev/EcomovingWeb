import fs from 'fs';
import path from 'path';
import https from 'https';

// --- CONFIGURACIÓN ---
const JSON_INPUT = 'C:/Users/Mario/Desktop/catalogo_ecomoving/mug/datos_mug.json';
const BASE_OUTPUT = 'C:/Users/Mario/Desktop/catalogo_ecomoving/mug/catalogo_hibrido';

// --- UTILIDADES ---
if (!fs.existsSync(BASE_OUTPUT)) fs.mkdirSync(BASE_OUTPUT, { recursive: true });

async function fetchPage(url) {
    return new Promise((resolve, reject) => {
        https.get(url, { rejectUnauthorized: false }, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => resolve(data));
        }).on('error', reject);
    });
}

function downloadImage(url, dest) {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(dest);
        https.get(url, { rejectUnauthorized: false }, (response) => {
            if (response.statusCode !== 200) {
                reject(new Error(`Status: ${response.statusCode}`));
                return;
            }
            response.pipe(file);
            file.on('finish', () => { file.close(); resolve(); });
        }).on('error', (err) => { fs.unlink(dest, () => { }); reject(err); });
    });
}

// Parsea el texto de descripción buscando patrones "Clave : Valor"
function parseCharacteristics(text) {
    const chars = {};
    if (!text) return chars;

    // Decodificar entidades HTML básicas
    const cleanText = text.replace(/&nbsp;/g, ' ').replace(/&Oslash;/g, 'Ø').replace(/&iacute;/g, 'í').replace(/&oacute;/g, 'ó');

    const patterns = [
        { key: 'medidas', label: 'Medidas' },
        { key: 'capacidad', label: 'Capacidad' },
        { key: 'materiales', label: 'Materiales' },
        { key: 'presentacion', label: 'Presentación' }
    ];

    patterns.forEach(p => {
        const regex = new RegExp(`${p.label}\\s*:\\s*([^.]+)(\\.|$)`, 'i');
        const match = cleanText.match(regex);
        if (match) {
            chars[p.key] = match[1].trim();
        }
    });

    return chars;
}

// --- PROCESO PRINCIPAL ---
async function run() {
    try {
        const data = JSON.parse(fs.readFileSync(JSON_INPUT, 'utf8'));
        console.log(`🚀 Iniciando Scraper Híbrido para ${data.length} productos...`);

        for (const item of data) {
            console.log(`\n📦 [${item.code}] ${item.name}`);

            // 1. Crear estructura de carpetas
            const prodDir = path.join(BASE_OUTPUT, item.code);
            const miniDir = path.join(prodDir, 'mini');
            const hdDir = path.join(prodDir, 'hd');

            [prodDir, miniDir, hdDir].forEach(d => {
                if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
            });

            try {
                // 2. Descargar Miniatura (la que ya viene en el JSON)
                if (item.image_url) {
                    process.stdout.write(`   - Bajando Miniatura... `);
                    await downloadImage(item.image_url, path.join(miniDir, `${item.code}_thumb.jpg`));
                    console.log('✅');
                }

                // 3. Obtener Página de Producto para Características e Imágenes HD
                const html = await fetchPage(item.link);

                // 4. Descargar todas las imágenes HD
                const hdImgRegex = /data-src="([^"]+\/original\/[^"]+)"/g;
                let match;
                const hdUrls = new Set();
                while ((match = hdImgRegex.exec(html)) !== null) {
                    hdUrls.add(match[1].split('?')[0]);
                }

                if (hdUrls.size > 0) {
                    console.log(`   - Encontradas ${hdUrls.size} imágenes HD:`);
                    let i = 1;
                    for (const url of hdUrls) {
                        const filename = `${item.code}_hd_${i}.jpg`;
                        process.stdout.write(`     [${i}/${hdUrls.size}] ${filename}... `);
                        await downloadImage(url, path.join(hdDir, filename));
                        console.log('✅');
                        i++;
                    }
                }

                // 5. Extraer y estructurar datos técnicos
                const packingData = {
                    medidas_empaque: html.match(/class='packing-label'>Medidas:<\/div>\s*<div class='packing-value'>([^<]+)<\/div>/i)?.[1].trim() || 'N/A',
                    peso_total: html.match(/class='packing-label'>Peso total:<\/div>\s*<div class='packing-value'>([^<]+)<\/div>/i)?.[1].trim() || 'N/A',
                    volumen: html.match(/class='packing-label'>Volumen:<\/div>\s*<div class='packing-value'>([^<]+)<\/div>/i)?.[1].trim() || 'N/A'
                };

                const caracteristicasParsed = parseCharacteristics(item.description);

                const finalData = {
                    ...item,
                    especificaciones_tecnicas: caracteristicasParsed,
                    packing: packingData,
                    timestamp: new Date().toISOString()
                };

                fs.writeFileSync(path.join(prodDir, 'datos_producto.json'), JSON.stringify(finalData, null, 4));
                console.log(`   - Datos técnicos guardados ✅`);

            } catch (err) {
                console.error(`   ❌ Error procesando: ${err.message}`);
            }
        }

        console.log(`\n✅ ¡Proceso Completo! Catálogo guardado en: ${BASE_OUTPUT}`);

    } catch (err) {
        console.error('Error Fatal:', err);
    }
}

run();
