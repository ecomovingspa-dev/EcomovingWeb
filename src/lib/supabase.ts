// Cliente Supabase Mockeado para independización total de base de datos externa
// Elimina todas las credenciales residuales y previene fallos de variables de entorno

export const getSupabaseClient = (projectId?: string): any => {
    const mockClient = {
        from: () => ({
            select: () => ({
                eq: () => ({
                    order: () => Promise.resolve({ data: [], error: null }),
                    limit: () => Promise.resolve({ data: [], error: null })
                }),
                order: () => Promise.resolve({ data: [], error: null }),
                limit: () => Promise.resolve({ data: [], error: null })
            }),
            insert: () => Promise.resolve({ data: [], error: null }),
            update: () => ({
                eq: () => Promise.resolve({ data: [], error: null })
            }),
            delete: () => ({
                eq: () => Promise.resolve({ data: [], error: null })
            })
        }),
        storage: {
            from: () => ({
                list: () => Promise.resolve({ data: [], error: null }),
                getPublicUrl: () => ({ data: { publicUrl: '' } }),
                upload: () => Promise.resolve({ data: {}, error: null }),
                remove: () => Promise.resolve({ data: {}, error: null })
            })
        },
        channel: () => ({
            on: () => ({
                subscribe: () => {}
            })
        }),
        removeChannel: () => {}
    };
    return mockClient;
};

// Cliente por defecto mockeado
export const supabase = getSupabaseClient();
