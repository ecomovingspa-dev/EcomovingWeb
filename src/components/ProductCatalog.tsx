import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Info, Plus, ChevronRight, X, Edit3, Search, Image as ImageIcon, Trash2, Save, Check, Star } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Product {
    id: string;
    name: string;
    description: string;
    features: string[];
    image: string;
    images?: string[];
    category: string;
    wholesaler?: string;
    isPremium?: boolean;
}

export default function ProductCatalog({
    adminMode = false,
    externalSearch = ''
}: {
    adminMode?: boolean,
    externalSearch?: string
}) {
    const [products, setProducts] = useState<Product[]>([]);
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [activeImage, setActiveImage] = useState<string | null>(null);
    const [galleryImages, setGalleryImages] = useState<string[]>([]);
    const [isEditing, setIsEditing] = useState(false);
    const [filter, setFilter] = useState('Todos');
    const [isExpandingCategories, setIsExpandingCategories] = useState(false);
    const specialCategories = ['ECOLOGICOS', 'BOTELLAS, MUG Y TAZAS', 'CUADERNOS, LIBRETAS Y MEMO SET', 'MOCHILAS, BOLSOS Y MORRALES', 'BOLÍGRAFOS', 'ACCESORIOS'];

    useEffect(() => {
        // Cargar productos aprobados desde Supabase
        fetchApprovedProducts();
    }, []);

    const fetchApprovedProducts = async () => {
        try {
            // Carga desde la tabla unificada 'productos' (Solo los aprobados para el público)
            const { data, error } = await supabase
                .from('productos')
                .select('*')
                .eq('status', 'approved')
                .order('created_at', { ascending: false });

            if (error) throw error;

            if (data && data.length > 0) {
                const formattedProducts: Product[] = data.map((item: any) => ({
                    id: item.id,
                    name: item.nombre,
                    description: item.descripcion || '',
                    features: Array.isArray(item.features) ? item.features : [],
                    image: item.imagen_principal || '',
                    images: Array.isArray(item.imagenes_galeria) ? item.imagenes_galeria : [item.imagen_principal],
                    category: item.categoria || 'Otros',
                    wholesaler: item.wholesaler || 'Ecomoving',
                    isPremium: item.is_premium || false
                }));

                console.log('✅ Catálogo Vivo cargado desde Supabase:', formattedProducts.length);
                setProducts(formattedProducts);
            } else {
                // Si la tabla productos está vacía, fallback a catalog.json estático
                const catalogData = await import('../data/catalog.json');
                setProducts(catalogData.default);
            }
        } catch (error) {
            console.error('Error fetching products from unified table:', error);
            const catalogData = await import('../data/catalog.json');
            setProducts(catalogData.default);
        }
    };

    const categoriesList = ['ECOLOGICOS', 'BOTELLAS, MUG Y TAZAS', 'CUADERNOS, LIBRETAS Y MEMO SET', 'MOCHILAS, BOLSOS Y MORRALES', 'BOLÍGRAFOS', 'ACCESORIOS'];
    const filteredProducts = products.filter(p => {
        const pCat = (p.category || '').toUpperCase();
        const fCat = filter.toUpperCase().trim();

        if (fCat === 'TODOS') return (!externalSearch || p.name.toLowerCase().includes(externalSearch.toLowerCase()));

        // Filtro especial para Premium
        if (fCat === 'PREMIUM') {
            const matchesPremium = p.isPremium;
            const matchesSearch = !externalSearch ||
                p.name.toLowerCase().includes(externalSearch.toLowerCase()) ||
                p.description.toLowerCase().includes(externalSearch.toLowerCase());
            return matchesPremium && matchesSearch;
        }

        // Mapeo inteligente para retrocompatibilidad
        const categoryMap: Record<string, string[]> = {
            'ECOLOGICOS': ['ECOLOGICOS', 'ECO', 'MADERA', 'CORCHO'],
            'BOTELLAS, MUG Y TAZAS': ['BOTELLAS', 'MUG', 'TAZAS', 'BOTELLA', 'TAZA', 'VASO', 'TERMO'],
            'CUADERNOS, LIBRETAS Y MEMO SET': ['CUADERNOS', 'LIBRETAS', 'MEMO', 'LIBRETA', 'CUADERNO', 'NOTAS'],
            'MOCHILAS, BOLSOS Y MORRALES': ['MOCHILAS', 'BOLSOS', 'MORRALES', 'MOCHILA', 'BOLSO', 'MORRAL', 'MALETIN', 'CARPETA'],
            'BOLÍGRAFOS': ['BOLÍGRAFOS', 'BOLIGRAFO', 'LAPIZ', 'BOLIGRAFOS'],
            'ACCESORIOS': ['ACCESORIOS', 'RELOJ', 'TECNOLOGIA', 'LLAVERO', 'HERRAMIENTAS']
        };

        const alias = categoryMap[fCat] || [fCat];
        const matchesCategory = alias.some(a => pCat.includes(a));

        const matchesSearch = !externalSearch ||
            p.name.toLowerCase().includes(externalSearch.toLowerCase()) ||
            p.description.toLowerCase().includes(externalSearch.toLowerCase()) ||
            (p.id && p.id.toLowerCase().includes(externalSearch.toLowerCase()));

        return matchesCategory && matchesSearch;
    });



    const handleLocalUpdate = (updatedProduct: Product) => {
        const newProducts = products.map(p => p.id === updatedProduct.id ? updatedProduct : p);
        setProducts(newProducts);
        setSelectedProduct(updatedProduct);
    };

    const handleSaveToSupabase = async () => {
        if (!selectedProduct) return;

        try {
            const mainImg = activeImage || selectedProduct.image;
            const otherImgs = (selectedProduct.images || []).filter(img => img !== mainImg);
            const orderedImages = [mainImg, ...otherImgs].filter(Boolean);

            // Edición directa en la tabla unificada 'productos'
            const { error } = await supabase
                .from('productos')
                .update({
                    nombre: selectedProduct.name,
                    descripcion: selectedProduct.description,
                    categoria: selectedProduct.category,
                    imagen_principal: mainImg,
                    imagenes_galeria: orderedImages,
                    features: selectedProduct.features,
                    wholesaler: selectedProduct.wholesaler,
                    is_premium: selectedProduct.isPremium
                })
                .eq('id', selectedProduct.id);

            if (error) throw error;

            alert('Producto actualizado exitosamente en el catálogo');
        } catch (error: any) {
            console.error('Error updating product:', error);
            alert(`Error al sincronizar con la base de datos: ${error.message || 'Error desconocido'}`);
        } finally {
            setTimeout(() => setIsEditing(false), 500);
        }
    };



    const handleDelete = async (id: string) => {
        // Verificar si el ID es de Supabase (formato UUID)
        const isSupabaseProduct = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

        if (!isSupabaseProduct) {
            alert('Este producto es parte del catálogo base estático y no puede eliminarse de la base de datos.');
            return;
        }

        if (confirm('¿Estás seguro de que quieres eliminar este producto del catálogo PERMANENTEMENTE?')) {
            try {
                const { error } = await supabase
                    .from('productos')
                    .delete()
                    .eq('id', id);

                if (error) throw error;

                setProducts(products.filter(p => p.id !== id));
                setSelectedProduct(null);
                alert('Producto eliminado exitosamente');
            } catch (error) {
                console.error('Error deleting product from unified table:', error);
                alert('Error al eliminar el producto');
            }
        }
    };

    // Cargar imágenes de galería del producto
    const fetchGalleryImages = (product: Product) => {
        console.log('🔍 Cargando galería para:', product.name);
        console.log('🖼️ Imágenes disponibles:', product.images?.length || 0);

        if (product.images && product.images.length > 0) {
            // Usar todas las imágenes del producto
            const galleryImgs = product.images;
            console.log('✨ Mostrando', galleryImgs.length, 'imágenes en galería');
            setGalleryImages(galleryImgs);
        } else {
            // Si no hay imágenes adicionales, solo mostrar la principal
            console.log('⚠️ Solo imagen principal disponible');
            setGalleryImages([product.image]);
        }
    };

    // Load gallery images when product is selected
    useEffect(() => {
        if (selectedProduct) {
            fetchGalleryImages(selectedProduct);
        }
    }, [selectedProduct]);

    return (
        <div className="catalog-wrapper">

            <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '60px', marginTop: '40px', flexWrap: 'wrap' }}>
                {/* Dropdown de Categorías */}
                <div style={{ position: 'relative' }}>
                    <button
                        onClick={() => setIsExpandingCategories(!isExpandingCategories)}
                        style={{
                            backgroundColor: 'transparent',
                            border: '1px solid rgba(255,255,255,0.1)',
                            color: 'white',
                            fontSize: '11px',
                            fontWeight: '700',
                            letterSpacing: '2px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            padding: '15px 30px',
                            borderRadius: '2px',
                            textTransform: 'uppercase',
                            background: isExpandingCategories ? 'rgba(0,212,189,0.1)' : 'transparent'
                        }}
                    >
                        CATEGORIAS <ChevronRight size={14} style={{ transform: isExpandingCategories ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.3s' }} />
                    </button>

                    <AnimatePresence>
                        {isExpandingCategories && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 10 }}
                                style={{
                                    position: 'absolute',
                                    top: '100%',
                                    left: 0,
                                    width: '280px',
                                    backgroundColor: '#0a0a0a',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    borderRadius: '4px',
                                    marginTop: '10px',
                                    boxShadow: '0 20px 40px rgba(0,0,0,0.8)',
                                    maxHeight: '400px',
                                    overflowY: 'auto',
                                    zIndex: 1000
                                }}
                                className="custom-scroll"
                            >
                                <button
                                    onClick={() => { setFilter('Todos'); setIsExpandingCategories(false); }}
                                    style={{ width: '100%', padding: '15px 25px', textAlign: 'left', background: 'none', border: 'none', color: filter === 'Todos' ? 'var(--accent-turquoise)' : '#888', fontSize: '12px', fontWeight: '700', cursor: 'pointer', borderBottom: '1px solid rgba(255,255,255,0.05)' }}
                                >
                                    TODAS LAS CATEGORÍAS
                                </button>
                                {specialCategories.sort().map(cat => (
                                    <button
                                        key={cat}
                                        onClick={() => { setFilter(cat); setIsExpandingCategories(false); }}
                                        style={{ width: '100%', padding: '15px 25px', textAlign: 'left', background: 'none', border: 'none', color: filter === cat ? 'var(--accent-turquoise)' : '#888', fontSize: '11px', fontWeight: '600', cursor: 'pointer', borderBottom: '1px solid rgba(255,255,255,0.05)', textTransform: 'uppercase' }}
                                    >
                                        {cat}
                                    </button>
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                <div style={{ width: '1px', height: '30px', background: 'rgba(255,255,255,0.1)' }} />

                {/* Botones de Acceso Rápido */}
                <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
                    <button
                        onClick={() => setFilter('ECOLOGICOS')}
                        style={{
                            padding: '12px 25px',
                            borderRadius: '2px',
                            border: '1px solid',
                            borderColor: filter === 'ECOLOGICOS' ? 'var(--accent-gold)' : 'rgba(255,255,255,0.05)',
                            backgroundColor: filter === 'ECOLOGICOS' ? 'rgba(212, 175, 55, 0.1)' : 'transparent',
                            color: filter === 'ECOLOGICOS' ? 'var(--accent-gold)' : '#aaa',
                            fontSize: '11px',
                            fontWeight: '800',
                            cursor: 'pointer',
                            transition: 'all 0.3s',
                            letterSpacing: '2px',
                            textTransform: 'uppercase'
                        }}
                    >
                        PRODUCTOS ECO
                    </button>
                    <button
                        onClick={() => setFilter('PREMIUM')}
                        style={{
                            padding: '12px 25px',
                            borderRadius: '2px',
                            border: '1px solid',
                            borderColor: filter === 'PREMIUM' ? 'var(--accent-gold)' : 'rgba(255,255,255,0.05)',
                            backgroundColor: filter === 'PREMIUM' ? 'rgba(212, 175, 55, 0.1)' : 'transparent',
                            color: filter === 'PREMIUM' ? 'var(--accent-gold)' : '#aaa',
                            fontSize: '11px',
                            fontWeight: '800',
                            cursor: 'pointer',
                            transition: 'all 0.3s',
                            letterSpacing: '2px',
                            textTransform: 'uppercase'
                        }}
                    >
                        PRODUCTOS PREMIUM
                    </button>
                </div>
            </div>

            <div className="catalog-grid">
                {filteredProducts.map((product, index) => (
                    <button
                        key={product.id}
                        className={`product-card-button ${product.isPremium ? 'hero-visual' : ''}`}
                        onClick={() => {
                            console.log('CONSTRUCTOR: Opening product detail:', product.name);
                            setSelectedProduct(product);
                            setActiveImage(product.image);
                            setIsEditing(false);
                        }}
                    >
                        <div className="product-image-container">
                            <img src={product.image} alt={product.name} className="product-img" />
                            <div className="product-overlay">
                                <div className="product-category">
                                    {product.isPremium && <span className="premium-badge">SELECCIÓN PREMIUM</span>}
                                    {product.category}
                                </div>
                                <Info className="info-icon" />
                            </div>
                        </div>
                        <div className="product-meta">
                            <div className="product-meta-flex">
                                <h3>{product.name}</h3>
                                {adminMode && (
                                    <div className="admin-actions">
                                        <div
                                            className="admin-btn edit"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setSelectedProduct(product);
                                                setIsEditing(true);
                                            }}
                                        >
                                            <Edit3 size={16} />
                                        </div>
                                        <div
                                            className="admin-btn delete"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDelete(product.id);
                                            }}
                                        >
                                            <Trash2 size={16} />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </button>
                ))}
            </div>

            {/* Modal de Detalle / Edición */}
            <AnimatePresence>
                {selectedProduct && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setSelectedProduct(null)}
                        style={{
                            position: 'fixed',
                            inset: 0,
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            width: '100vw',
                            height: '100vh',
                            background: 'rgba(8, 8, 8, 0.96)',
                            backdropFilter: 'blur(16px)',
                            WebkitBackdropFilter: 'blur(16px)',
                            zIndex: 999999,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            onClick={(e) => e.stopPropagation()}
                            style={{
                                background: '#0A0A0A',
                                width: '1200px',
                                maxWidth: '95vw',
                                maxHeight: '92vh',
                                height: '92vh',
                                borderRadius: '4px',
                                overflow: 'hidden',
                                display: 'flex',
                                flexDirection: 'column',
                                position: 'relative',
                                border: '1px solid rgba(255,255,255,0.06)',
                                boxShadow: '0 40px 120px rgba(0,0,0,0.9)',
                            }}
                        >
                            {/* FILA SUPERIOR: Imagen izq | Info der */}
                            <div style={{ display: 'flex', flexDirection: 'row', flex: 1, overflow: 'hidden', minHeight: 0 }}>

                                {/* COLUMNA IZQUIERDA: Imagen principal + miniaturas */}
                                <div style={{ width: '480px', flexShrink: 0, display: 'flex', flexDirection: 'column', background: '#000', overflow: 'hidden' }}>

                                    {/* Visor imagen principal */}
                                    <div
                                        style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', background: '#050505', position: 'relative' }}
                                        onDragOver={(e) => { if (isEditing) e.preventDefault(); }}
                                        onDrop={(e) => {
                                            if (!isEditing) return;
                                            e.preventDefault();
                                            const url = e.dataTransfer.getData('image_url');
                                            if (url && selectedProduct) {
                                                const updated = { ...selectedProduct, image: url, images: [url, ...(selectedProduct.images || []).filter(i => i !== url)] };
                                                handleLocalUpdate(updated);
                                                setActiveImage(url);
                                            }
                                        }}
                                    >
                                        <motion.img
                                            key={activeImage || selectedProduct.image}
                                            initial={{ opacity: 0, scale: 0.98 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            src={activeImage || selectedProduct.image}
                                            alt={selectedProduct.name}
                                            style={{ width: '100%', height: '100%', objectFit: 'contain', filter: 'drop-shadow(0 20px 60px rgba(0,0,0,0.9))' }}
                                        />
                                        {isEditing && (
                                            <div className="image-edit-overlay">
                                                <ImageIcon size={48} style={{ marginBottom: '20px', opacity: 0.2 }} />
                                            </div>
                                        )}
                                    </div>

                                    {/* Fila doble de miniaturas */}
                                    <div style={{ height: '174px', flexShrink: 0, background: '#0a0a0a', borderTop: '1px solid rgba(255,255,255,0.05)', padding: '8px', overflowX: 'auto', overflowY: 'hidden' }}>
                                        <div style={{ display: 'grid', gridTemplateRows: 'repeat(2, 75px)', gridAutoFlow: 'column', gridAutoColumns: '75px', gap: '8px', height: '100%' }}>
                                            {(galleryImages.length > 0 ? galleryImages : [selectedProduct.image]).map((img, idx) => (
                                                <motion.div
                                                    key={idx}
                                                    whileHover={{ scale: 1.05 }}
                                                    whileTap={{ scale: 0.95 }}
                                                    onClick={(e) => { e.stopPropagation(); setActiveImage(img || ''); }}
                                                    style={{
                                                        width: '75px', height: '75px', overflow: 'hidden', cursor: 'pointer',
                                                        borderRadius: '2px', opacity: (activeImage || selectedProduct.image) === img ? 1 : 0.6,
                                                        border: (activeImage || selectedProduct.image) === img ? '1px solid #00E5A0' : '1px solid rgba(255,255,255,0.05)',
                                                        background: '#151515', transition: 'all 0.3s ease', flexShrink: 0
                                                    }}
                                                >
                                                    <img src={img || ''} alt={`${selectedProduct.name} - Vista ${idx + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                </motion.div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* COLUMNA DERECHA: Info del producto — crece al ancho disponible */}
                                <div style={{ flex: 1, background: '#080808', padding: '40px', overflowY: 'auto', display: 'flex', flexDirection: 'column', borderLeft: '1px solid rgba(255,255,255,0.03)', scrollbarWidth: 'none' }}>
                                    {isEditing ? (
                                        <div className="edit-form">
                                            <div className="edit-grid-system">
                                                <div className="edit-field-group">
                                                    <label>CATEGORÍA OFICIAL</label>
                                                    <select
                                                        className="edit-input-category"
                                                        value={selectedProduct.category}
                                                        onChange={(e) => {
                                                            if (selectedProduct) {
                                                                handleLocalUpdate({ ...selectedProduct, category: e.target.value });
                                                            }
                                                        }}
                                                    >
                                                        <option value="">Seleccionar...</option>
                                                        {specialCategories.map(cat => (
                                                            <option key={cat} value={cat}>{cat}</option>
                                                        ))}
                                                        <option value="Otros">Otros</option>
                                                    </select>
                                                </div>
                                                <div className="edit-field-group">
                                                    <label>NOMBRE PRODUCTO</label>
                                                    <input
                                                        className="edit-input-title-compact"
                                                        value={selectedProduct.name}
                                                        onChange={(e) => {
                                                            if (selectedProduct) {
                                                                handleLocalUpdate({ ...selectedProduct, name: e.target.value });
                                                            }
                                                        }}
                                                        placeholder="Nombre..."
                                                    />
                                                </div>
                                            </div>

                                            <div className="features-edit">
                                                <h4>Características (una por línea)</h4>
                                                <textarea
                                                    className="edit-input-features"
                                                    value={selectedProduct.features?.join('\n') || ''}
                                                    onChange={(e) => {
                                                        if (selectedProduct) {
                                                            handleLocalUpdate({ ...selectedProduct, features: e.target.value.split('\n') });
                                                        }
                                                    }}
                                                />
                                            </div>

                                            <input
                                                className="edit-input-wholesaler"
                                                value={selectedProduct.wholesaler || ''}
                                                onChange={(e) => {
                                                    if (selectedProduct) {
                                                        handleLocalUpdate({ ...selectedProduct, wholesaler: e.target.value });
                                                    }
                                                }}
                                                placeholder="Nombre del Mayorista"
                                            />

                                            <button className="delete-btn" onClick={() => selectedProduct && handleDelete(selectedProduct.id)}>Eliminar Producto</button>
                                        </div>
                                    ) : (
                                        <>
                                            <span className="category-tag">{selectedProduct.category}</span>
                                            <h2>{selectedProduct.name}</h2>

                                            <div className="specs-container">
                                                <h4 className="specs-header">Especificaciones Técnicas</h4>
                                                <ul className="specs-list">
                                                    {selectedProduct.features && selectedProduct.features.length > 0 ? (
                                                        selectedProduct.features.filter(f => f && !['Calidad Premium', 'Ecorresponsable'].includes(f.trim())).map((f, i) => (
                                                            <li key={i}>
                                                                <ChevronRight size={14} className="accent" /> {f}
                                                            </li>
                                                        ))
                                                    ) : (
                                                        <li className="specs-empty">Consulte para más detalles técnicos.</li>
                                                    )}
                                                </ul>
                                            </div>

                                            <button style={{ background: '#00E5A0', color: 'black', border: 'none', padding: '20px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '2px', cursor: 'pointer', transition: 'all 0.4s', fontSize: '0.75rem', borderRadius: '2px', marginTop: 'auto', width: '100%' }}>Solicitar Cotización Personalizada</button>
                                        </>
                                    )}
                                </div>

                            </div>{/* fin fila superior */}

                            {/* FILA INFERIOR: Productos Relacionados — ancho completo */}
                            {!isEditing && products.filter(p => p.category === selectedProduct.category && p.id !== selectedProduct.id).length > 0 && (
                                <div style={{ flexShrink: 0, borderTop: '1px solid rgba(255,255,255,0.06)', background: '#060606', padding: '20px 32px' }}>
                                    <h4 style={{ margin: '0 0 16px 0', fontSize: '0.6rem', fontWeight: 800, letterSpacing: '3px', textTransform: 'uppercase', color: '#444' }}>Productos Relacionados</h4>
                                    <div style={{ display: 'flex', flexDirection: 'row', gap: '12px', overflowX: 'auto', scrollbarWidth: 'none' }}>
                                        {products
                                            .filter(p => p.category === selectedProduct.category && p.id !== selectedProduct.id)
                                            .slice(0, 8)
                                            .map(related => (
                                                <div
                                                    key={related.id}
                                                    onClick={() => { setSelectedProduct(related); setActiveImage(related.image); }}
                                                    style={{ flexShrink: 0, width: '110px', cursor: 'pointer', background: '#111', borderRadius: '2px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.04)', transition: 'border-color 0.3s' }}
                                                    onMouseEnter={e => (e.currentTarget.style.borderColor = '#00E5A0')}
                                                    onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.04)')}
                                                >
                                                    <div style={{ width: '110px', height: '90px', overflow: 'hidden', background: '#0a0a0a' }}>
                                                        <img src={related.image} alt={related.name} style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.85 }} />
                                                    </div>
                                                    <div style={{ padding: '6px 8px' }}>
                                                        <span style={{ fontSize: '0.6rem', color: '#666', letterSpacing: '0.5px', textTransform: 'uppercase', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{related.name}</span>
                                                    </div>
                                                </div>
                                            ))}
                                    </div>
                                </div>
                            )}
                            <div style={{ position: 'absolute', right: '40px', top: '40px', display: 'flex', gap: '20px', zIndex: 100 }}>
                                {adminMode && (
                                    <button className="action-btn" onClick={() => {
                                        if (isEditing) {
                                            handleSaveToSupabase();
                                        }
                                        setIsEditing(!isEditing);
                                    }}>
                                        {isEditing ? <Save size={18} /> : <Edit3 size={18} />} {isEditing ? 'Guardar' : 'Editar'}
                                    </button>
                                )}
                                <button className="close-btn" onClick={() => setSelectedProduct(null)}>
                                    <X />
                                </button>
                            </div>
                        </motion.div >

                    </motion.div >
                )
                }
            </AnimatePresence >

            <style jsx>{`
                .catalog-wrapper {
                    padding: 80px 20px;
                    background-color: #0A0A0A;
                    min-height: 100vh;
                    font-family: 'DM Sans', sans-serif;
                }
                .catalog-grid {
                    display: grid;
                    grid-template-columns: repeat(48, 1fr);
                    gap: 22px;
                    max-width: 1440px;
                    margin: 0 auto;
                }
                .product-card-button {
                    grid-column: span 12;
                    background: #111;
                    border: 1px solid rgba(255,255,255,0.03);
                    border-radius: 4px;
                    overflow: hidden;
                    cursor: pointer;
                    padding: 0;
                    margin: 5px;
                    position: relative;
                    transition: all 0.6s cubic-bezier(0.16, 1, 0.3, 1);
                    outline: none;
                    text-align: left;
                }
                @media (max-width: 1200px) { .product-card-button { grid-column: span 16; } }
                @media (max-width: 900px) { .product-card-button { grid-column: span 24; } }
                @media (max-width: 600px) { .product-card-button { grid-column: span 48; } }

                .product-card-button:hover {
                    border-color: #00E5A0;
                    transform: translateY(-12px);
                    box-shadow: 0 40px 80px rgba(0,0,0,0.9);
                    background: #151515;
                }
                .product-image-container {
                    position: relative;
                    aspect-ratio: 1/1;
                    overflow: hidden;
                    background-color: #000;
                }
                .product-img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                    transition: transform 1.2s cubic-bezier(0.16, 1, 0.3, 1);
                    opacity: 0.8;
                }
                .product-card-button:hover .product-img {
                    transform: scale(1.08);
                    opacity: 1;
                }
                .product-overlay {
                    position: absolute;
                    inset: 0;
                    background: linear-gradient(to top, #0A0A0A 0%, transparent 60%);
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-end;
                    padding: 24px;
                }
                .product-category {
                    color: #A0A0A0;
                    font-size: 0.6rem;
                    font-weight: 800;
                    text-transform: uppercase;
                    letter-spacing: 3px;
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                }
                .premium-badge {
                    background: #00E5A0;
                    color: #000;
                    padding: 4px 12px;
                    border-radius: 2px;
                    font-size: 0.55rem;
                    font-weight: 900;
                }
                .info-icon {
                    color: #00E5A0;
                    width: 18px;
                    opacity: 0.3;
                    transition: opacity 0.3s;
                }
                .product-card-button:hover .info-icon {
                    opacity: 1;
                }
                .product-meta {
                    padding: 20px 24px;
                }
                .product-meta h3 {
                    margin: 0;
                    font-size: 0.85rem;
                    color: #FFFFFF;
                    font-family: 'Space Grotesk', sans-serif;
                    letter-spacing: 2px;
                    text-transform: uppercase;
                    line-height: 1.4;
                }
                .product-meta-flex {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                .admin-actions {
                    display: flex;
                    gap: 12px;
                }
                .admin-btn {
                    padding: 6px;
                    border-radius: 4px;
                    transition: all 0.3s;
                    cursor: pointer;
                }
                .admin-btn.edit { color: #00E5A0; }
                .admin-btn.delete { color: #ef4444; }
                .admin-btn:hover { background: rgba(255,255,255,0.05); }

                /* Modal Luxury */
                .modal-backdrop {
                    position: fixed;
                    inset: 0;
                    background: rgba(8, 8, 8, 0.96);
                    backdrop-filter: blur(16px);
                    z-index: 100000;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                .modal-content {
                    background: #0A0A0A;
                    width: 1200px;
                    height: 450px;
                    border-radius: 4px;
                    overflow-x: hidden;
                    overflow-y: auto;
                    position: relative;
                    border: 1px solid rgba(255,255,255,0.05);
                    box-shadow: 0 80px 160px rgba(0,0,0,1);
                    display: flex;
                    flex-direction: column;
                }
                .modal-content::-webkit-scrollbar { display: none; }
                .hero-visual {
                    border-color: rgba(0, 229, 160, 0.3) !important;
                }
                .modal-actions {
                    position: absolute;
                    right: 40px;
                    top: 40px;
                    display: flex;
                    gap: 20px;
                    z-index: 100;
                }
                .action-btn {
                    background: rgba(255, 255, 255, 0.03);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    color: white;
                    padding: 12px 24px;
                    font-size: 0.75rem;
                    text-transform: uppercase;
                    letter-spacing: 2px;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    transition: all 0.4s;
                    border-radius: 2px;
                    font-family: 'Space Grotesk', sans-serif;
                }
                .action-btn:hover {
                    background: #00E5A0;
                    color: black;
                    border-color: #00E5A0;
                    transform: translateY(-2px);
                }
                .close-btn {
                    background: none;
                    border: none;
                    color: white;
                    cursor: pointer;
                    opacity: 0.5;
                    transition: opacity 0.3s;
                }
                .close-btn:hover {
                    opacity: 1;
                }
                .modal-inner {
                    display: grid;
                    grid-template-columns: 600px 600px;
                    height: 450px;
                    width: 1200px;
                    overflow: hidden;
                    flex-shrink: 0;
                }
                .modal-image-stage {
                    position: relative;
                    background: #000;
                    height: 450px;
                    width: 600px;
                    display: flex;
                    flex-direction: column;
                    overflow: hidden;
                }
                .main-image-container {
                    width: 100%;
                    flex: 1;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    position: relative;
                    overflow: hidden;
                    background: #050505;
                }
                .modal-hero-image {
                    width: 100%;
                    height: 100%;
                    object-fit: contain;
                    filter: drop-shadow(0 40px 100px rgba(0, 0, 0, 0.9));
                }
                .image-edit-overlay {
                    position: absolute;
                    inset: 0;
                    background: rgba(0, 229, 160, 0.05);
                    border: 2px dashed #00E5A0;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    pointer-events: none;
                    z-index: 5;
                }
                .modal-thumbnails-panel {
                    width: 100%;
                    height: 174px;
                    background: #0a0a0a;
                    border-top: 1px solid rgba(255, 255, 255, 0.05);
                    padding: 8px;
                    overflow-x: auto;
                    overflow-y: hidden;
                    display: flex;
                    flex-direction: row;
                    flex-shrink: 0;
                    pointer-events: auto;
                    scrollbar-width: none;
                }
                .modal-thumbnails-panel::-webkit-scrollbar { display: none; }
                .thumbnails-scroll {
                    display: grid;
                    grid-template-rows: repeat(2, 1fr);
                    grid-auto-flow: column;
                    grid-auto-columns: 75px;
                    gap: 8px;
                    height: 100%;
                }
                .thumbnail-item {
                    width: 75px;
                    height: 75px;
                    flex-shrink: 0;
                    overflow: hidden;
                    cursor: pointer;
                    border-radius: 2px;
                    border: 1px solid rgba(255, 255, 255, 0.05);
                    opacity: 0.6;
                    transition: all 0.3s ease;
                    background: #151515;
                }
                .thumbnail-item.active {
                    opacity: 1;
                    border: 1px solid #00E5A0;
                    background: #1a1a1a;
                }
                .thumbnail-item img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                }
                .modal-text-col {
                    background: #080808;
                    padding: 40px;
                    height: 450px;
                    overflow-y: scroll;
                    border-left: 1px solid rgba(255, 255, 255, 0.03);
                    display: flex;
                    flex-direction: column;
                    scrollbar-width: none;
                }
                .modal-text-col::-webkit-scrollbar { display: none; }
                .modal-text-col h2 {
                    font-size: 1.8rem;
                    line-height: 1.1;
                    margin-bottom: 20px;
                    color: white;
                    font-family: 'Space Grotesk', sans-serif;
                    letter-spacing: -1px;
                }
                .category-tag {
                    color: #00E5A0;
                    font-size: 0.75rem;
                    text-transform: uppercase;
                    letter-spacing: 5px;
                    margin-bottom: 12px;
                    display: block;
                    font-weight: 800;
                }
                .specs-container {
                    margin-top: 20px;
                    margin-bottom: 30px;
                }
                .specs-header {
                    font-family: 'Space Grotesk', sans-serif;
                    text-transform: uppercase;
                    font-size: 0.7rem;
                    color: #555;
                    margin-bottom: 15px;
                    letter-spacing: 2px;
                }
                .specs-list {
                    list-style: none;
                    padding: 0;
                    margin: 0;
                }
                .specs-list li {
                    display: flex;
                    align-items: flex-start;
                    gap: 12px;
                    color: #888;
                    margin-bottom: 12px;
                    font-size: 0.9rem;
                    line-height: 1.4;
                }
                .btn-cotizar {
                    background: #00E5A0;
                    color: black;
                    border: none;
                    padding: 20px;
                    font-weight: 900;
                    text-transform: uppercase;
                    letter-spacing: 2px;
                    cursor: pointer;
                    transition: all 0.4s;
                    font-size: 0.75rem;
                    border-radius: 2px;
                }
                .btn-cotizar:hover {
                    background: white;
                    transform: translateY(-5px);
                }
                .modal-footer-related {
                    padding: 40px;
                    background: #050505;
                    border-top: 1px solid rgba(255,255,255,0.03);
                }
                .related-header {
                    font-family: 'Space Grotesk', sans-serif;
                    font-size: 0.7rem;
                    color: #555;
                    text-transform: uppercase;
                    letter-spacing: 3px;
                    margin-bottom: 24px;
                }
                .related-grid-full {
                    display: grid;
                    grid-template-columns: repeat(4, 1fr);
                    gap: 20px;
                }
                .related-card-footer {
                    cursor: pointer;
                    transition: all 0.3s;
                }
                .related-card-footer:hover {
                    transform: translateY(-5px);
                }
                .related-img-box {
                    aspect-ratio: 1/1;
                    background: #000;
                    border-radius: 2px;
                    overflow: hidden;
                    margin-bottom: 12px;
                    border: 1px solid rgba(255,255,255,0.05);
                }
                .related-img-box img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                    opacity: 0.7;
                    transition: opacity 0.3s;
                }
                .related-card-footer:hover .related-img-box img {
                    opacity: 1;
                }
                .related-name-footer {
                    display: block;
                    font-size: 0.65rem;
                    color: #888;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                }
                .edit-form {
                    display: flex;
                    flex-direction: column;
                    gap: 20px;
                }
                .edit-grid-system {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 20px;
                }
                .edit-field-group label {
                    display: block;
                    font-size: 10px;
                    color: #555;
                    margin-bottom: 8px;
                    font-weight: 800;
                    text-transform: uppercase;
                    letter-spacing: 2px;
                }
                .edit-input-title-compact, .edit-input-category {
                    width: 100%;
                    background: #000;
                    border: 1px solid #333;
                    color: white;
                    padding: 12px;
                    border-radius: 4px;
                    font-size: 14px;
                    outline: none;
                }
                .edit-input-features {
                    background: #000;
                    border: 1px solid #333;
                    color: #ccc;
                    padding: 15px;
                    min-height: 180px;
                    width: 100%;
                    outline: none;
                    font-family: 'DM Sans', sans-serif;
                    line-height: 1.6;
                }
                .edit-input-wholesaler {
                    background: #000;
                    border: 1px solid #333;
                    color: #888;
                    padding: 12px;
                    border-radius: 4px;
                    font-size: 12px;
                    outline: none;
                }
                .delete-btn {
                    margin-top: 20px;
                    background: rgba(239, 68, 68, 0.05);
                    color: #ef4444;
                    border: 1px solid rgba(239, 68, 68, 0.2);
                    padding: 15px;
                    cursor: pointer;
                    border-radius: 4px;
                    font-size: 0.7rem;
                    text-transform: uppercase;
                    letter-spacing: 2px;
                    transition: all 0.3s;
                }
                .delete-btn:hover {
                    background: #ef4444;
                    color: white;
                }
            `}</style>
        </div >
    );
}
