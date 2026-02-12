import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const ZECAT_API_BASE = 'https://api.zecat.cl/v1';
const ZECAT_TOKEN = process.env.NEXT_PUBLIC_ZECAT_TOKEN || '';

async function verifyDetailFull() {
    const listRes = await fetch(`${ZECAT_API_BASE}/generic_product?page=1&limit=1`, {
        headers: { 'Authorization': `Bearer ${ZECAT_TOKEN}` }
    });
    const listJson = await listRes.json();
    if (listJson.generic_products && listJson.generic_products.length > 0) {
        const id = listJson.generic_products[0].id;
        console.log(`Testing detail for ID: ${id}`);
        const res = await fetch(`${ZECAT_API_BASE}/generic_product/${id}`, {
            headers: { 'Authorization': `Bearer ${ZECAT_TOKEN}` }
        });
        const json = await res.json();
        const p = json.generic_product;
        console.log('Product Description:', p.description);
        console.log('Subattributes:', JSON.stringify(p.subattributes || [], null, 2));
    }
}
verifyDetailFull();
