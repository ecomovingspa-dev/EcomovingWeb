import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const ZECAT_API_BASE = 'https://api.zecat.cl/v1';
const ZECAT_TOKEN = process.env.NEXT_PUBLIC_ZECAT_TOKEN || '';

async function debug() {
    const res = await fetch(`${ZECAT_API_BASE}/generic_product?page=1&limit=5`, {
        headers: { 'Authorization': `Bearer ${ZECAT_TOKEN}` }
    });
    console.log('Status:', res.status);
    const text = await res.text();
    console.log('Response:', text);
}
debug();
