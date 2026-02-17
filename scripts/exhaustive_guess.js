
const https = require('https');

const commonNames = [
    'logo.jpg', 'logo.png', 'logo.svg', 'logo.webp',
    'logotipo.jpg', 'logotipo.png', 'logotipo.svg', 'logotipo.webp',
    'ecomoving.jpg', 'ecomoving.png', 'ecomoving.svg', 'ecomoving.webp',
    'logo-ecomoving.jpg', 'logo-ecomoving.png', 'logo-ecomoving.webp',
    'logotipo-ecomoving.jpg', 'logotipo-ecomoving.png', 'logotipo-ecomoving.webp',
    'white-logo.png', 'white-logo.jpg',
    'dark-logo.png', 'dark-logo.jpg',
    'logotipo_ecomoving.jpg', 'logotipo_ecomoving.png', 'logotipo_ecomoving.webp'
];

async function guessLogo() {
    for (const name of commonNames) {
        const url = `https://xgdmyjzyejjmwdqkufhp.supabase.co/storage/v1/object/public/logotipo_ecomoving/${name}`;
        https.get(url, (res) => {
            if (res.statusCode === 200) {
                console.log(`FOUND: ${url}`);
            }
            res.on('data', () => { });
        }).on('error', () => { });
    }
}

guessLogo();
