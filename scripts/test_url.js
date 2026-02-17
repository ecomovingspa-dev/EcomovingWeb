
const fetch = require('node-fetch');

async function testUrl() {
    const url = 'https://xgdmyjzyejjmwdqkufhp.supabase.co/storage/v1/object/public/imagenes-marketing/imagen_1.jpg';
    try {
        const res = await fetch(url);
        console.log(`URL: ${url}, Status: ${res.status}`);
    } catch (e) {
        console.error('Fetch error:', e);
    }
}

testUrl();
