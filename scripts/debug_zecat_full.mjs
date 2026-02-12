import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const ZECAT_API_BASE = 'https://api.zecat.cl/v1';
const ZECAT_TOKEN = process.env.NEXT_PUBLIC_ZECAT_TOKEN || '';

async function checkSingleProduct() {
    try {
        // Try searching for a known product to get its real ID
        const searchRes = await fetch(`${ZECAT_API_BASE}/generic_product?page=1&limit=1`, {
            headers: {
                'Authorization': `Bearer ${ZECAT_TOKEN}`,
            }
        });
        const searchData = await searchRes.json();
        if (searchData.data && searchData.data.length > 0) {
            const product = searchData.data[0];
            console.log(`Product: ${product.name} (ID: ${product.id})`);
            console.log(`Full Product JSON:`, JSON.stringify(product, null, 2));
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

checkSingleProduct();
