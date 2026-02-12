
const folderId = '1laOXyjpxlZJfCEsCBw29ISOCVw1OPou2';

async function testPublicAccess() {
    try {
        console.log(`Intentando extraer IDs de la carpeta pública: ${folderId}`);
        const url = `https://drive.google.com/drive/folders/${folderId}`;

        const response = await fetch(url);
        const text = await response.text();

        // Buscamos patrones de IDs de archivos (normalmente empiezan con 1 y tienen unos 33 caracteres)
        // También buscamos patrones en los arrays de datos que Drive envía al cliente
        const regex = /"1[a-zA-Z0-9_-]{32}"/g;
        const matches = text.match(regex);

        if (matches) {
            const uniqueIds = [...new Set(matches.map(m => m.replace(/"/g, '')))];
            // Filtramos el folderId si aparece
            const fileIds = uniqueIds.filter(id => id !== folderId);
            console.log(`IDs encontrados: ${fileIds.length}`);
            console.log("IDs de archivos:", fileIds.slice(0, 10));
        } else {
            console.log("No se encontraron IDs con el patrón estándar.");
            // Busquemos cualquier cosa que parezca un ID en un contexto de archivo
            const broadRegex = /\["([a-zA-Z0-9_-]{33})",/g;
            const broadMatches = text.match(broadRegex);
            if (broadMatches) {
                const uniqueIds = [...new Set(broadMatches.map(m => m.match(/"([a-zA-Z0-9_-]{33})"/)[1]))];
                console.log("IDs encontrados (patrón amplio):", uniqueIds.filter(id => id !== folderId).slice(0, 10));
            }
        }
    } catch (err) {
        console.error('Error:', err);
    }
}

testPublicAccess();
