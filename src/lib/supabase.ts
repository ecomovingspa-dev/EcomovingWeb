import { createClient, SupabaseClient } from '@supabase/supabase-js';

const defaultUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const defaultKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const defaultClient = createClient(defaultUrl, defaultKey);

// Tiny Puertecillo Supabase credentials
const tinyUrl = 'https://xqybckftzuupkmbwocrj.supabase.co';
const tinyKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhxeWJja2Z0enV1cGttYndvY3JqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM2Mjg5MjYsImV4cCI6MjA5OTIwNDkyNn0.WnAdZ7cC0Q__a4g-x3rRdEKZLkjdNOR35HdqReKIrx0';

const tinyClient = createClient(tinyUrl, tinyKey);

export const getSupabaseClient = (projectId?: string): SupabaseClient => {
    if (projectId === 'tiny-puertecillo') {
        return tinyClient;
    }
    return defaultClient;
};

// Exportar cliente por defecto para compatibilidad hacia atrás
export const supabase = defaultClient;
