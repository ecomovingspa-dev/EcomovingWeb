
const https = require('https');

const urls = [
    'https://xgdmyjzyejjmwdqkufhp.supabase.co/storage/v1/object/public/logotipo_ecomoving/logo.jpg',
    'https://xgdmyjzyejjmwdqkufhp.supabase.co/storage/v1/object/public/logotipo_ecomoving/logotipo.jpg',
    'https://xgdmyjzyejjmwdqkufhp.supabase.co/storage/v1/object/public/logotipo_ecomoving/logo_ecomoving.jpg',
    'https://xgdmyjzyejjmwdqkufhp.supabase.co/storage/v1/object/public/logotipo_ecomoving/ecomoving.jpg',
    'https://xgdmyjzyejjmwdqkufhp.supabase.co/storage/v1/object/public/logotipo_ecomoving/Logo.jpg',
    'https://xgdmyjzyejjmwdqkufhp.supabase.co/storage/v1/object/public/logotipo_ecomoving/Logotipo.jpg',
    'https://xgdmyjzyejjmwdqkufhp.supabase.co/storage/v1/object/public/logotipo_ecomoving/logotipo_ecomoving.jpg'
];

async function testUrls() {
    for (const url of urls) {
        https.get(url, (res) => {
            console.log(`URL: ${url}, Status: ${res.statusCode}`);
            res.on('data', () => { });
        }).on('error', (e) => {
            console.error('Error:', e);
        });
    }
}

testUrls();
