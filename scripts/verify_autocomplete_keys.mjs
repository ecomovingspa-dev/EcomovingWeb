import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const ZECAT_API_BASE = 'https://api.zecat.cl/v1';
const ZECAT_TOKEN = process.env.NEXT_PUBLIC_ZECAT_TOKEN || '';

async function verifyAutocomplete() {
    const res = await fetch(`${ZECAT_API_BASE}/generic_product/autocomplete?name=Mug`, {
        headers: { 'Authorization': `Bearer ${ZECAT_TOKEN}` }
    });
    const json = await res.json();
    console.log('Keys in autocomplete response:', Object.keys(json));
}
verifyAutocomplete();
