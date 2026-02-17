
const https = require('https');

async function testUrl() {
    const url = 'https://xgdmyjzyejjmwdqkufhp.supabase.co/storage/v1/object/public/imagenes-marketing/imagen_1.jpg';
    https.get(url, (res) => {
        console.log(`URL: ${url}, Status: ${res.statusCode}`);
        res.on('data', () => { });
    }).on('error', (e) => {
        console.error('Error:', e);
    });
}

testUrl();
