
const https = require('https');

const commonNames = [
    'logo.jpg', 'logo.png', 'logo.svg', 'logo.webp',
    'logotipo.jpg', 'logotipo.png', 'logotipo.svg', 'logotipo.webp',
    'ecomoving.jpg', 'ecomoving.png', 'ecomoving.svg', 'ecomoving.webp',
    'logo-ecomoving.jpg', 'logo-ecomoving.png', 'logo-ecomoving.webp',
    'logotipo-ecomoving.jpg', 'logotipo-ecomoving.png', 'logotipo-ecomoving.webp',
    'logotipo_ecomoving.jpg', 'logotipo_ecomoving.png', 'logotipo_ecomoving.webp'
];

const buckets = ['logotipo_ecomoving', 'imagenes-marketing'];

async function guessLogo() {
    for (const b of buckets) {
        for (const name of commonNames) {
            const url = `https://xgdmyjzyejjmwdqkufhp.supabase.co/storage/v1/object/public/${b}/${name}`;
            const options = {
                rejectUnauthorized: false
            };
            https.get(url, options, (res) => {
                if (res.statusCode === 200) {
                    console.log(`FOUND in ${b}: ${url}`);
                }
                res.on('data', () => { });
            }).on('error', () => { });
        }
    }
}

guessLogo();
