
require('dotenv').config({ path: '.env.local' });

const apiKey = process.env.GEMINI_API_KEY;
const folderId = '1laOXyjpxlZJfCEsCBw29ISOCVw1OPou2';

async function listFiles() {
    try {
        console.log(`Listing files in folder: ${folderId} using Native Fetch...`);
        const url = `https://www.googleapis.com/drive/v3/files?q='${folderId}'+in+parents+and+trashed=false&fields=files(id,name,mimeType,webContentLink,thumbnailLink)&key=${apiKey}`;

        const response = await fetch(url);
        const data = await response.json();

        if (data.error) {
            console.error('API Error:', JSON.stringify(data.error, null, 2));
            return;
        }

        const files = data.files || [];
        if (files.length === 0) {
            console.log('No files found.');
        } else {
            console.log(`Found ${files.length} files:`);
            files.forEach(file => {
                console.log(`- ${file.name} (${file.id})`);
            });
        }
    } catch (err) {
        console.error('Error fetching Drive files:', err);
    }
}

listFiles();
