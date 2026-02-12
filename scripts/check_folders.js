
const folderId = '1laOXyjpxlZJfCEsCBw29ISOCVw1OPou2';

async function lookForOtherFolders() {
    try {
        console.log(`Buscando posibles carpetas relacionadas desde: ${folderId}`);
        const url = `https://drive.google.com/drive/folders/${folderId}`;

        const response = await fetch(url);
        const text = await response.text();

        // Buscamos patrones de IDs de carpetas (suelen ser de 33 caracteres y estar en contextos de carpetas)
        const regex = /folders\/([a-zA-Z0-9_-]{28,})/g;
        const matches = text.match(regex);

        if (matches) {
            const uniqueIds = [...new Set(matches.map(m => m.split('/')[1]))];
            console.log(`Carpetas encontradas en el código: ${uniqueIds.length}`);
            console.log("IDs de carpetas encontradas:", uniqueIds);
        } else {
            console.log("No se encontraron otros IDs de carpetas en el HTML.");
        }
    } catch (err) {
        console.error('Error:', err);
    }
}

lookForOtherFolders();
