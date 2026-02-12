import fs from 'fs';
import path from 'path';
import https from 'https';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Cargar variables de entorno desde .env.local
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Error: Faltan variables de entorno en .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

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
function decodeHtml(text) {
    if (!text) return '';
    return text
        .replace(/&quot;/g, '"')
        .replace(/&apos;/g, "'")
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&amp;/g, '&')
        .replace(/&nbsp;/g, ' ')
        .replace(/&Oslash;/g, 'Ø')
        .replace(/&iacute;/g, 'í')
        .replace(/&oacute;/g, 'ó')
        .replace(/&aacute;/g, 'á')
        .replace(/&eacute;/g, 'é')
        .replace(/&uacute;/g, 'ú')
        .replace(/&ntilde;/g, 'ñ')
        .replace(/&bull;/g, '•')
        .replace(/&rdquo;/g, '"')
        .replace(/&ldquo;/g, '"')
        .replace(/&ndash;/g, '–');
}

function parseCharacteristics(text) {
    const chars = {};
    if (!text) return chars;

    const cleanText = decodeHtml(text);
    const patterns = [
        { key: 'medidas', label: 'Medidas' },
        { key: 'capacidad', label: 'Capacidad' },
        { key: 'materiales', label: 'Materiales' },
        { key: 'presentacion', label: 'Presentación' }
    ];
    patterns.forEach(p => {
        const regex = new RegExp(`${p.label}\\s*:\\s*([^.]+)(\\.|$)`, 'i');
        const match = cleanText.match(regex);
        if (match) chars[p.key] = match[1].trim();
    });
    return chars;
}

// --- PROCESO PRINCIPAL ---
async function run() {
    try {
        const data = JSON.parse(fs.readFileSync(JSON_INPUT, 'utf8'));
        console.log(`🚀 Iniciando Inyección a Supabase para ${data.length} productos...`);

        for (const item of data) {
            console.log(`\n📦 [${item.code}] ${item.name}`);

            try {
                // 1. Obtener Página de Producto para Características e Imágenes HD
                const html = await fetchPage(item.link);

                // 2. Extraer imágenes HD
                const hdImgRegex = /data-src="([^"]+\/original\/[^"]+)"/g;
                let match;
                const hdUrls = new Set();
                while ((match = hdImgRegex.exec(html)) !== null) {
                    hdUrls.add(match[1].split('?')[0]);
                }

                // 3. Extraer datos técnicos
                const packingData = {
                    medidas_empaque: html.match(/class='packing-label'>Medidas:<\/div>\s*<div class='packing-value'>([^<]+)<\/div>/i)?.[1].trim() || 'N/A',
                    peso_total: html.match(/class='packing-label'>Peso total:<\/div>\s*<div class='packing-value'>([^<]+)<\/div>/i)?.[1].trim() || 'N/A',
                    volumen: html.match(/class='packing-label'>Volumen:<\/div>\s*<div class='packing-value'>([^<]+)<\/div>/i)?.[1].trim() || 'N/A'
                };

                const caracteristicasParsed = parseCharacteristics(item.description);

                // 4. Inyectar en Supabase (agent_buffer)
                // Usamos upsert basado en external_id para evitar duplicados
                const { error } = await supabase
                    .from('agent_buffer')
                    .upsert({
                        wholesaler: 'Stocksur',
                        external_id: item.code,
                        name: decodeHtml(item.name),
                        original_description: decodeHtml(item.description),
                        images: Array.from(hdUrls),
                        technical_specs: {
                            ...caracteristicasParsed,
                            packing: packingData
                        },
                        status: 'pending'
                    }, { onConflict: 'external_id' });

                if (error) {
                    console.error(`   ❌ Error en Supabase: ${error.message}`);
                } else {
                    console.log(`   ✅ Inyectado en Buffer de Supabase`);
                }

            } catch (err) {
                console.error(`   ❌ Error procesando: ${err.message}`);
            }
        }

        console.log(`\n✅ ¡Inyección Completa!`);

    } catch (err) {
        console.error('Error Fatal:', err);
    }
}

run();
