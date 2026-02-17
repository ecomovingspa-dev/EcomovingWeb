
const https = require('https');

const commonNames = [
    'Logo.jpg', 'Logo.png', 'Logo.svg', 'Logo.webp',
    'Logotipo.jpg', 'Logotipo.png', 'Logotipo.svg', 'Logotipo.webp',
    'Ecomoving.jpg', 'Ecomoving.png', 'Ecomoving.svg', 'Ecomoving.webp',
    'Ecomoving-Logo.jpg', 'Ecomoving-Logo.png', 'Ecomoving-Logo.webp',
    'Logo-Ecomoving.jpg', 'Logo-Ecomoving.png', 'Logo-Ecomoving.webp',
    'logotipo-oficial.jpg', 'logotipo-oficial.png', 'logotipo-oficial.webp'
];

async function guessLogo() {
    for (const name of commonNames) {
        const url = `https://xgdmyjzyejjmwdqkufhp.supabase.co/storage/v1/object/public/logotipo_ecomoving/${name}`;
        const options = { rejectUnauthorized: false };
        https.get(url, options, (res) => {
            if (res.statusCode === 200) {
                console.log(`FOUND: ${url}`);
            }
            res.on('data', () => { });
        }).on('error', () => { });
    }
}

guessLogo();
