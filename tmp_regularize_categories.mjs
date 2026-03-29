import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

async function regularize() {
    console.log('--- STARTING CATEGORY REGULARIZATION ---');

    const mapping = [
        { from: ['BOTELLAS Y MUGS', 'TERMOS Y TAZAS'], to: '01. HIDRATACIÓN' },
        { from: ['CUADERNOS, LIBRETAS Y MEMO SET', 'BOLÍGRAFOS'], to: '02. ESPACIO DE TRABAJO' },
        { from: ['MOCHILAS, BOLSOS Y MORRALES'], to: '03. MOVIMIENTO URBANO' },
        { from: ['ECOLÓGICOS'], to: '04. TECH INNOVATION' },
        { from: ['HOGAR Y TIEMPO LIBRE'], to: '05. GOURMET EXPERIENCE' }
    ];

    for (const rule of mapping) {
        console.log(`Updating ${rule.from.join(', ')} to "${rule.to}"...`);
        const { data, error, count } = await supabase
            .from('productos')
            .update({ categoria: rule.to })
            .in('categoria', rule.from)
            .select('*');

        if (error) {
            console.error(`Error updating to ${rule.to}:`, error);
        } else {
            console.log(`Successfully updated ${data.length} products to "${rule.to}".`);
        }
    }

    // Final audit
    const { data: finalData, error: finalError } = await supabase
        .from('productos')
        .select('categoria');
    
    if (!finalError) {
        const uniqueCats = [...new Set(finalData.map(d => d.categoria))];
        console.log('\nFinal categories in "productos" table:');
        uniqueCats.sort().forEach(c => console.log(`- ${c}`));
    }

    console.log('\n--- REGULARIZATION COMPLETE ---');
}

regularize();
