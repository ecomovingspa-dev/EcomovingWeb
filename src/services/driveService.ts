export interface DriveItem {
    id: string;
    name: string;
    type: 'file' | 'folder';
    thumbnail: string | null;
}

export async function fetchDriveItems(folderId: string): Promise<DriveItem[]> {
    try {
        // Llamamos a nuestro propio API route en el servidor para evitar CORS
        const response = await fetch(`/api/drive-folder?folderId=${folderId}`);
        if (!response.ok) throw new Error('Failed to fetch from drive-folder API');

        const data = await response.json();
        return data.items || [];
    } catch (err) {
        console.error('Error fetching drive items:', err);
        return [];
    }
}

// Mantener por compatibilidad temporal si es necesario, pero migrar a fetchDriveItems
export async function fetchDriveThumbnails(folderId: string): Promise<string[]> {
    const items = await fetchDriveItems(folderId);
    return items.filter(i => i.type === 'file' && i.thumbnail).map(i => i.thumbnail!);
}
