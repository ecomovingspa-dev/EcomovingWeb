const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function cleanRows() {
    console.log('--- Limpiando filas de web_contenido ---');

    // Lista de secciones permitidas
    const allowedSections = ['hero', 'sections'];

    // Obtener todas las secciones
    const { data: allRows, error: fetchError } = await supabase
        .from('web_contenido')
        .select('section');

    if (fetchError) {
        console.error('Error al obtener filas:', fetchError);
        return;
    }

    console.log('Secciones encontradas:', allRows.map(r => r.section));

    const rowsToDelete = allRows
        .map(r => r.section)
        .filter(s => !allowedSections.includes(s));

    if (rowsToDelete.length === 0) {
        console.log('No hay filas para eliminar.');
        return;
    }

    console.log('Eliminando:', rowsToDelete);

    const { error: deleteError } = await supabase
        .from('web_contenido')
        .delete()
        .in('section', rowsToDelete);

    if (deleteError) {
        console.error('Error al eliminar filas:', deleteError);
    } else {
        console.log('✅ Filas eliminadas correctamente.');
    }
}

cleanRows();
