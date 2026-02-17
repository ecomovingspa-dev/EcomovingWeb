
const https = require('https');

const url = 'https://xgdmyjzyejjmwdqkufhp.supabase.co/storage/v1/object/public/logotipo_ecomoving/Logotipo_horizontal.png';
const options = { rejectUnauthorized: false };

https.get(url, options, (res) => {
    console.log(`URL: ${url}`);
    console.log(`Status: ${res.statusCode}`);
    res.on('data', () => { });
}).on('error', (e) => {
    console.error('Error:', e);
});
