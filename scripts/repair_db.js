
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function repairDB() {
    console.log('Iniciando reparación de DB...');

    // 1. Obtener la sección 'mugs' (legacy)
    const { data: mugsRow } = await supabase
        .from('web_contenido')
        .select('*')
        .eq('section', 'mugs')
        .single();

    // 2. Obtener la sección 'sections' (dinámica)
    const { data: sectionsRow } = await supabase
        .from('web_contenido')
        .select('*')
        .eq('section', 'sections')
        .single();

    if (!sectionsRow) {
        console.error('No se encontró la fila "sections" en web_contenido');
        return;
    }

    let sections = sectionsRow.content;
    if (!Array.isArray(sections)) {
        sections = Object.values(sections);
    }

    // 3. Buscar si ya existe la sección de mugs en el array dinámico
    let mugSection = sections.find(s => s.id === 'section_mugs' || s.id === 'mugs');

    if (mugSection) {
        console.log('Sección de mugs ya existe en el array dinámico. Actualizando...');
    } else {
        console.log('Creando nueva sección de mugs en el array dinámico...');
        mugSection = {
            id: 'section_mugs',
            order: 1,
            title: 'MUGS PERSONALIZADOS Y TAZAS CORPORATIVAS PREMIUM',
            title_2: 'CURATORÍA DE MATERIALES',
            description: 'Descubre nuestra línea de mugs cerámicos y térmicos con acabados de alta gama.',
            description_2: 'Cada mug es seleccionado por su balance entre ingeniería térmica y tacto premium.',
            bgColor: '#050505',
            blocks: []
        };
        sections.push(mugSection);
    }

    // 4. Si tenemos datos en la sección legacy, migrarlos
    if (mugsRow && mugsRow.content) {
        const legacy = mugsRow.content;
        mugSection.title = legacy.title || mugSection.title;
        mugSection.title_2 = legacy.title_2 || mugSection.title_2;
        mugSection.description = legacy.description || mugSection.description;
        mugSection.description_2 = legacy.description_2 || mugSection.description_2;

        // Convertir cells a blocks si es necesario
        if (legacy.cells && Array.isArray(legacy.cells) && (!mugSection.blocks || mugSection.blocks.length === 0)) {
            mugSection.blocks = legacy.cells.map((cell, index) => ({
                id: cell.id || `block_mug_${index}`,
                label: cell.label || 'Mug Item',
                type: 'image',
                image: cell.image || '',
                span: cell.span || '4x2',
                col: (index % 3) * 4 + 1,
                row: Math.floor(index / 3) * 2 + 1,
                zIndex: 1
            }));
            console.log(`Migrados ${mugSection.blocks.length} bloques desde la sección legacy.`);
        }
    }

    // 5. Corregir títulos que sean JSON strings
    sections = sections.map(s => {
        if (typeof s.title === 'string' && s.title.startsWith('{')) {
            try {
                const parsed = JSON.parse(s.title);
                return {
                    ...s,
                    title: parsed.title || s.title,
                    description: parsed.description || s.description,
                    subtitle: parsed.subtitle || s.subtitle || s.title_2
                };
            } catch (e) {
                return s;
            }
        }
        return s;
    });

    // 6. Guardar de nuevo en Supabase
    const { error: updateError } = await supabase
        .from('web_contenido')
        .upsert({
            section: 'sections',
            content: sections,
            updated_by: 'repair_script',
            updated_at: new Date().toISOString()
        }, { onConflict: 'section' });

    if (updateError) {
        console.error('Error al actualizar secciones:', updateError);
    } else {
        console.log('DB reparada correctamente.');
    }
}

repairDB();
