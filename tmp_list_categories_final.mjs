import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

async function run() {
    const { data, error } = await supabase.from('productos').select('categoria')
    if (error) {
        console.error(error)
        return
    }
    const cats = [...new Set(data.map(d => d.categoria))]
    console.log('Categories found in Supabase "productos" table:', JSON.stringify(cats, null, 2))
}
run()
