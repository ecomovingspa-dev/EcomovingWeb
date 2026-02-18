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
            // Intentar cargar desde la nueva tabla 'productos' (Catálogo Vivo Optimizado)
            const { data, error } = await supabase
                .from('productos')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) {
                console.warn('Error loading from "productos" table, falling back to buffer/json:', error);

                // Fallback 1: agent_buffer aprobado
                const { data: bufferData, error: bufferError } = await supabase
                    .from('agent_buffer')
                    .select('*')
                    .eq('status', 'approved')
                    .order('found_at', { ascending: false });

                if (bufferError || !bufferData || bufferData.length === 0) {
                    // Fallback 2: catalog.json
                    const catalogData = await import('../data/catalog.json');
                    setProducts(catalogData.default);
                    return;
                }

                const formatted = bufferData.map((item: any) => ({
                    id: item.id,
                    name: item.name,
                    description: (item.original_description && item.original_description !== item.name) ? item.original_description : '',
                    features: item.technical_specs?.specs || item.features || [],
                    image: item.images?.[0] || item.image || '',
                    images: item.images || [],
                    category: item.category || item.technical_specs?.category || 'Otros',
                    wholesaler: item.wholesaler || 'Premium',
                    isPremium: item.technical_specs?.is_premium || false
                }));
                setProducts(formatted);
                return;
            }

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
                // Si la tabla productos está vacía, usar el buffer aprobado
                const { data: bufferData } = await supabase
                    .from('agent_buffer')
                    .select('*')
                    .eq('status', 'approved');

                if (bufferData && bufferData.length > 0) {
                    const formatted = bufferData.map((item: any) => ({
                        id: item.id,
                        name: item.name,
                        description: item.original_description || '',
                        features: item.technical_specs?.specs || [],
                        image: item.images?.[0] || '',
                        images: item.images || [],
                        category: item.category || 'Otros',
                        wholesaler: item.wholesaler || 'Premium',
                        isPremium: item.technical_specs?.is_premium || false
                    }));
                    setProducts(formatted);
                } else {
                    const catalogData = await import('../data/catalog.json');
                    setProducts(catalogData.default);
                }
            }
        } catch (error) {
            console.error('Error fetching products:', error);
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

            // Determinar si el producto viene de 'productos' o del buffer
            const { data: isLive } = await supabase
                .from('productos')
                .select('id')
                .eq('id', selectedProduct.id)
                .maybeSingle();

            if (isLive) {
                const { error } = await supabase
                    .from('productos')
                    .update({
                        nombre: selectedProduct.name,
                        descripcion: selectedProduct.description,
                        categoria: selectedProduct.category,
                        imagen_principal: mainImg,
                        imagenes_galeria: orderedImages,
                        features: selectedProduct.features,
                        wholesaler: selectedProduct.wholesaler
                    })
                    .eq('id', selectedProduct.id);

                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from('agent_buffer')
                    .update({
                        name: selectedProduct.name,
                        original_description: selectedProduct.description,
                        technical_specs: {
                            specs: selectedProduct.features,
                            category: selectedProduct.category
                        },
                        images: orderedImages,
                        wholesaler: selectedProduct.wholesaler
                    })
                    .eq('id', selectedProduct.id);

                if (error) throw error;
            }

            alert('Producto actualizado exitosamente en el catálogo');
        } catch (error: any) {
            console.error('Error updating product:', error);
            alert(`Error al sincronizar con la base de datos: ${error.message || 'Error desconocido'}`);
        }
    };



    const handleDelete = async (id: string) => {
        // Verificar si el ID es de Supabase (formato UUID)
        const isSupabaseProduct = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

        if (!isSupabaseProduct) {
            alert('Este producto es parte del catálogo base estático y no puede eliminarse de la base de datos.');
            return;
        }

        if (confirm('¿Estás seguro de que quieres eliminar este producto del catálogo final?')) {
            try {
                const { error } = await supabase
                    .from('agent_buffer')
                    .update({ status: 'rejected' })
                    .eq('id', id);

                if (error) throw error;

                setProducts(products.filter(p => p.id !== id));
                setSelectedProduct(null);
                alert('Producto eliminado del catálogo');
            } catch (error) {
                console.error('Error deleting product:', error);
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
            <div className="container">

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
                        <motion.div
                            key={product.id}
                            layoutId={`card-${product.id}`}
                            className={`product-card-premium ${product.isPremium ? 'hero-visual' : ''}`}
                            onClick={() => {
                                setSelectedProduct(product);
                                setActiveImage(product.image);
                                setIsEditing(false);
                            }}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            whileHover={{ y: -10 }}
                        >
                            <div className="product-image-container">
                                <img src={product.image} alt={product.name} className="product-img" />
                                <div className="product-overlay">
                                    <div className="product-category">
                                        {product.isPremium && <span className="premium-badge">Selección Premium</span>}
                                        {product.category}
                                    </div>
                                    <Info className="info-icon" />
                                </div>
                            </div>
                            <div className="product-meta">
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <h3>{product.name}</h3>
                                    {adminMode && (
                                        <div style={{ display: 'flex', gap: '10px' }}>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setSelectedProduct(product);
                                                    setIsEditing(true);
                                                }}
                                                style={{ background: 'none', border: 'none', color: 'var(--accent-turquoise)', cursor: 'pointer', padding: '5px' }}
                                            >
                                                <Edit3 size={16} />
                                            </button>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDelete(product.id);
                                                }}
                                                style={{ background: 'none', border: 'none', color: '#ff4444', cursor: 'pointer', padding: '5px' }}
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    ))}


                </div>
            </div>

            {/* Modal de Detalle / Edición */}
            <AnimatePresence>
                {selectedProduct && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        style={{
                            position: 'fixed',
                            inset: 0,
                            backgroundColor: 'rgba(0,0,0,0.92)',
                            backdropFilter: 'blur(30px)',
                            zIndex: 100000,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '40px'
                        }}
                        onClick={() => setSelectedProduct(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="modal-content"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="modal-inner">
                                <div className="modal-image-stage">
                                    <div
                                        className="main-image-container"
                                        onDragOver={(e) => {
                                            if (isEditing) e.preventDefault();
                                        }}
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
                                            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                                            src={activeImage || selectedProduct.image}
                                            alt={selectedProduct.name}
                                            className="modal-hero-image"
                                        />
                                        {isEditing && (
                                            <div className="image-edit-overlay">
                                                <ImageIcon size={48} style={{ marginBottom: '20px', opacity: 0.2 }} />
                                            </div>
                                        )}

                                        {/* Galería de Miniaturas como Overlay */}
                                        <div className="modal-thumbnails-overlay">
                                            <div className="thumbnails-scroll">
                                                {(galleryImages.length > 0 ? galleryImages : [selectedProduct.image]).map((img, idx) => (
                                                    <motion.div
                                                        key={idx}
                                                        whileHover={{ scale: 1.1 }}
                                                        whileTap={{ scale: 0.9 }}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setActiveImage(img);
                                                        }}
                                                        className={`thumbnail-item ${(activeImage || selectedProduct.image) === img ? 'active' : ''}`}
                                                    >
                                                        <img src={img} alt={`${selectedProduct.name} - Vista ${idx + 1}`} />
                                                    </motion.div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="modal-text-col">
                                    {isEditing ? (
                                        <div className="edit-form">
                                            <div style={{ marginBottom: '15px' }}>
                                                <label style={{ display: 'block', fontSize: '10px', color: '#666', marginBottom: '5px', fontWeight: '800' }}>CATEGORÍA OFICIAL</label>
                                                <select
                                                    className="edit-input-category"
                                                    value={selectedProduct.category}
                                                    onChange={(e) => handleLocalUpdate({ ...selectedProduct, category: e.target.value })}
                                                    style={{ width: '100%', backgroundColor: '#111', border: '1px solid #333', color: 'white', padding: '12px', borderRadius: '6px', fontSize: '13px' }}
                                                >
                                                    <option value="">Seleccionar Categoría...</option>
                                                    {specialCategories.map(cat => (
                                                        <option key={cat} value={cat}>{cat}</option>
                                                    ))}
                                                    <option value="Otros">Otros</option>
                                                </select>
                                            </div>
                                            <input
                                                className="edit-input-title"
                                                value={selectedProduct.name}
                                                onChange={(e) => handleLocalUpdate({ ...selectedProduct, name: e.target.value })}
                                                placeholder="Nombre del Producto"
                                            />

                                            <div className="features-edit">
                                                <h4>Características (una por línea)</h4>
                                                <textarea
                                                    className="edit-input-features"
                                                    value={selectedProduct.features.join('\n')}
                                                    onChange={(e) => handleLocalUpdate({ ...selectedProduct, features: e.target.value.split('\n') })}
                                                />
                                            </div>

                                            <input
                                                className="edit-input-wholesaler"
                                                value={selectedProduct.wholesaler}
                                                onChange={(e) => handleLocalUpdate({ ...selectedProduct, wholesaler: e.target.value })}
                                                placeholder="Nombre del Mayorista"
                                            />

                                            <button className="delete-btn" onClick={() => handleDelete(selectedProduct.id)}>Eliminar Producto</button>
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

                                            <button className="btn-cotizar">Solicitar Cotización Personalizada</button>
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Productos Relacionados al Ancho */}
                            {!isEditing && products.filter(p => p.category === selectedProduct.category && p.id !== selectedProduct.id).length > 0 && (
                                <div className="modal-footer-related">
                                    <h4 className="related-header">Productos Relacionados</h4>
                                    <div className="related-grid-full">
                                        {products
                                            .filter(p => p.category === selectedProduct.category && p.id !== selectedProduct.id)
                                            .slice(0, 4)
                                            .map(related => (
                                                <div
                                                    key={related.id}
                                                    className="related-card-footer"
                                                    onClick={() => {
                                                        setSelectedProduct(related);
                                                        setActiveImage(related.image);
                                                        const modalScroll = document.querySelector('.modal-content');
                                                        if (modalScroll) modalScroll.scrollTop = 0;
                                                    }}
                                                >
                                                    <div className="related-img-box">
                                                        <img src={related.image} alt={related.name} />
                                                    </div>
                                                    <span className="related-name-footer">
                                                        {related.name}
                                                    </span>
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
                        </motion.div>

                    </motion.div>
                )}
            </AnimatePresence>

            <style jsx>{`
                .catalog-wrapper {
                    padding: 60px 0;
                    background-color: #050505;
                }
                .catalog-header {
                    text-align: center;
                    margin-bottom: 40px;
                }
                .catalog-title {
                    font-size: 4rem;
                    margin-bottom: 10px;
                    font-family: var(--font-heading);
                    letter-spacing: 8px;
                    color: white;
                }
                .catalog-subtitle {
                    color: var(--text-muted);
                    font-size: 0.9rem;
                    max-width: 600px;
                    margin: 0 auto;
                    text-transform: uppercase;
                    letter-spacing: 4px;
                    font-family: var(--font-body);
                }
                .category-filter {
                    display: flex;
                    justify-content: center;
                    gap: 15px;
                    width: 100%;
                    flex-wrap: wrap;
                }
                .filter-btn {
                    background: none;
                    border: 1px solid rgba(255,255,255,0.05);
                    color: var(--text-muted);
                    padding: 12px 28px;
                    font-size: 0.8rem;
                    text-transform: uppercase;
                    letter-spacing: 2px;
                    cursor: pointer;
                    transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                    border-radius: 2px;
                    font-family: var(--font-body);
                }
                .filter-btn:hover, .filter-btn.active {
                    color: var(--accent-turquoise);
                    border-color: var(--accent-turquoise);
                    background: rgba(0,212,189,0.05);
                    transform: translateY(-2px);
                }
                .highlight {
                    color: var(--accent-gold);
                }
                .catalog-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
                    gap: 40px;
                }
                .product-card-premium {
                    background: #0a0a0a;
                    border: 1px solid rgba(255,255,255,0.03);
                    border-radius: 4px;
                    overflow: hidden;
                    cursor: pointer;
                    transition: all 0.5s cubic-bezier(0.165, 0.84, 0.44, 1);
                    position: relative;
                }
                .product-card-premium::after {
                    content: '';
                    position: absolute;
                    inset: 0;
                    border: 1px solid rgba(212, 175, 55, 0);
                    margin: 10px;
                    pointer-events: none;
                    transition: border-color 0.5s ease;
                }
                .product-card-premium:hover {
                    border-color: rgba(255,255,255,0.1);
                    transform: translateY(-10px);
                    box-shadow: 0 30px 60px rgba(0,0,0,0.8);
                }
                .product-card-premium:hover::after {
                    border-color: rgba(212, 175, 55, 0.2);
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
                    transition: transform 1.2s cubic-bezier(0.23, 1, 0.32, 1);
                    opacity: 0.85;
                }
                .product-card-premium:hover .product-img {
                    transform: scale(1.1);
                    opacity: 1;
                }
                .product-overlay {
                    position: absolute;
                    inset: 0;
                    background: linear-gradient(to top, rgba(0,0,0,0.95) 0%, transparent 60%);
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-end;
                    padding: 25px;
                    opacity: 0.9;
                }
                .product-category {
                    color: var(--accent-gold);
                    font-size: 0.65rem;
                    font-weight: 700;
                    text-transform: uppercase;
                    letter-spacing: 3px;
                    display: flex;
                    flex-direction: column;
                    gap: 5px;
                }
                .premium-badge {
                    background: var(--accent-gold);
                    color: black;
                    padding: 4px 10px;
                    border-radius: 2px;
                    font-size: 0.6rem;
                    letter-spacing: 1px;
                    width: fit-content;
                }
                .hero-visual {
                    border: 1px solid rgba(212, 175, 55, 0.3);
                    box-shadow: 0 0 30px rgba(212, 175, 55, 0.1);
                }
                .info-icon {
                    color: var(--accent-turquoise);
                    width: 20px;
                    opacity: 0.6;
                    transition: opacity 0.3s;
                }
                .product-card-premium:hover .info-icon {
                    opacity: 1;
                }
                .product-meta {
                    padding: 15px 20px;
                    text-align: center;
                }
                .product-meta h3 {
                    margin: 0;
                    font-size: 1rem;
                    color: white;
                    font-family: var(--font-heading);
                    letter-spacing: 1.5px;
                    text-transform: uppercase;
                }
                .product-meta p {
                    margin: 10px 0 0 0;
                    font-size: 0.75rem;
                    color: var(--text-muted);
                    text-transform: uppercase;
                    letter-spacing: 3px;
                }



                /* Modal */
                .modal-backdrop {
                    position: fixed;
                    inset: 0;
                    background: rgba(0,0,0,0.99);
                    backdrop-filter: blur(30px);
                    z-index: 10000;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 60px;
                }
                .modal-content {
                    background: #000;
                    width: 100%;
                    max-width: 1360px;
                    max-height: 75vh;
                    height: auto;
                    border-radius: 12px;
                    overflow: hidden;
                    position: relative;
                    border: 1px solid rgba(255,255,255,0.05);
                    box-shadow: 0 50px 100px rgba(0,0,0,0.9);
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
                    background: rgba(255,255,255,0.03);
                    border: 1px solid rgba(255,255,255,0.1);
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
                }
                .action-btn:hover {
                    background: var(--accent-turquoise);
                    color: black;
                    border-color: var(--accent-turquoise);
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
                    grid-template-columns: 1.2fr 0.8fr;
                    height: 100%;
                    min-height: 80vh;
                }
                @media (max-width: 1024px) {
                    .modal-inner {
                        grid-template-columns: 1fr;
                        overflow-y: auto;
                    }
                }
                
                .modal-image-stage {
                    position: relative;
                    background: #000;
                    height: 100%;
                    display: flex;
                    flex-direction: column;
                    overflow: hidden;
                }
                .main-image-container {
                    flex: 1;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    position: relative;
                    padding: 60px;
                    overflow: hidden;
                }
                .modal-hero-image {
                    max-width: 50%;
                    max-height: 50%;
                    object-fit: contain;
                    filter: drop-shadow(0 40px 100px rgba(0,0,0,0.9));
                }
                .image-edit-overlay {
                    position: absolute;
                    inset: 0;
                    background: rgba(0,212,189,0.05);
                    border: 2px dashed var(--accent-turquoise);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    pointer-events: none;
                    z-index: 5;
                }
                
                .modal-thumbnails-overlay {
                    position: absolute;
                    bottom: 40px;
                    left: 50%;
                    transform: translateX(-50%);
                    z-index: 20;
                    pointer-events: none;
                }
                .thumbnails-scroll {
                    display: flex;
                    gap: 15px;
                    padding: 15px 30px;
                    background: rgba(15, 15, 15, 0.4);
                    backdrop-filter: blur(40px);
                    border-radius: 100px;
                    border: 1px solid rgba(255, 255, 255, 0.05);
                    pointer-events: auto;
                    box-shadow: 0 20px 50px rgba(0,0,0,0.5);
                }
                .thumbnail-item {
                    width: 40px;
                    height: 40px;
                    border-radius: 6px;
                    overflow: hidden;
                    cursor: pointer;
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    opacity: 0.4;
                    transition: all 0.5s cubic-bezier(0.16, 1, 0.3, 1);
                    background: #111;
                }
                .thumbnail-item.active {
                    opacity: 1;
                    border: 2px solid white;
                    transform: scale(1.1);
                }
                .thumbnail-item img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                }

                .modal-text-col {
                    background: #080808;
                    padding: 60px 50px;
                    height: 100%;
                    overflow-y: auto;
                    border-left: 1px solid rgba(255,255,255,0.03);
                    display: flex;
                    flex-direction: column;
                }
                .modal-text-col h2 {
                    font-size: 3.8rem;
                    line-height: 1.1;
                    margin-bottom: 40px;
                    color: white;
                    font-family: var(--font-heading);
                    letter-spacing: -2px;
                }

                .category-tag {
                    color: var(--accent-gold);
                    font-size: 0.8rem;
                    text-transform: uppercase;
                    letter-spacing: 5px;
                    margin-bottom: 25px;
                    display: block;
                    font-weight: 700;
                }
                
                .specs-container {
                    margin-bottom: 60px;
                    padding: 40px;
                    background: rgba(255, 255, 255, 0.01);
                    border: 1px solid rgba(255, 255, 255, 0.03);
                    border-radius: 4px;
                }
                .specs-header {
                    font-family: var(--font-heading);
                    text-transform: uppercase;
                    font-size: 0.8rem;
                    color: var(--accent-turquoise);
                    margin-bottom: 30px;
                    letter-spacing: 4px;
                }
                .specs-list {
                    list-style: none;
                    padding: 0;
                    margin: 0;
                }
                .specs-list li {
                    display: flex;
                    align-items: flex-start;
                    gap: 15px;
                    color: #999;
                    margin-bottom: 20px;
                    font-size: 1rem;
                    line-height: 1.6;
                }
                .btn-cotizar {
                    background: white;
                    color: black;
                    border: none;
                    padding: 25px;
                    font-weight: 900;
                    text-transform: uppercase;
                    letter-spacing: 4px;
                    cursor: pointer;
                    transition: all 0.5s cubic-bezier(0.16, 1, 0.3, 1);
                    font-size: 0.85rem;
                }
                .btn-cotizar:hover {
                    background: var(--accent-turquoise);
                    transform: translateY(-5px);
                }

                .modal-footer-related {
                    padding: 60px 80px;
                    background: rgba(255,255,255,0.01);
                    border-top: 1px solid rgba(255,255,255,0.05);
                }
                .related-header {
                    font-family: var(--font-heading);
                    text-transform: uppercase;
                    font-size: 0.8rem;
                    color: rgba(255,255,255,0.4);
                    margin-bottom: 40px;
                    letter-spacing: 4px;
                }
                .related-grid-full {
                    display: grid;
                    grid-template-columns: repeat(4, 1fr);
                    gap: 30px;
                }
                .related-card-footer {
                    cursor: pointer;
                    transition: all 0.4s cubic-bezier(0.165, 0.84, 0.44, 1);
                }
                .related-card-footer:hover {
                    transform: translateY(-10px);
                }
                .related-img-box {
                    aspect-ratio: 1/1;
                    overflow: hidden;
                    border-radius: 4px;
                    background: #050505;
                    border: 1px solid rgba(255,255,255,0.05);
                    margin-bottom: 15px;
                }
                .related-img-box img {
                    width: 100%;
                    height: 100%;
                    object-fit: contain;
                }
                .related-name-footer {
                    display: block;
                    font-size: 0.75rem;
                    color: #fff;
                    opacity: 0.6;
                    text-transform: uppercase;
                    letter-spacing: 2px;
                    text-align: center;
                }

                .wholesaler-info {
                    margin-top: 80px;
                    font-size: 0.8rem;
                    color: #555;
                    padding-top: 40px;
                    border-top: 1px solid rgba(255,255,255,0.05);
                    text-transform: uppercase;
                    letter-spacing: 3px;
                }
                .btn-contact {
                    margin-top: 50px;
                    background: var(--accent-turquoise);
                    color: black;
                    border: none;
                    padding: 22px 50px;
                    font-weight: 800;
                    text-transform: uppercase;
                    letter-spacing: 4px;
                    cursor: pointer;
                    transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                    font-size: 0.9rem;
                    border-radius: 2px;
                }
                .btn-contact:hover {
                    background: white;
                    transform: translateY(-5px);
                    box-shadow: 0 15px 40px rgba(0,212,189,0.3);
                }

                /* Edit Mode Styles */
                .edit-form {
                    display: flex;
                    flex-direction: column;
                    gap: 20px;
                }
                .edit-input-category {
                    background: rgba(255,255,255,0.02);
                    border: 1px solid rgba(255,255,255,0.1);
                    color: var(--accent-gold);
                    padding: 15px;
                    letter-spacing: 4px;
                    text-transform: uppercase;
                    font-size: 0.9rem;
                    outline: none;
                }
                .edit-input-title {
                    background: rgba(255,255,255,0.02);
                    border: 1px solid rgba(255,255,255,0.1);
                    color: white;
                    font-size: 3rem;
                    padding: 15px;
                    font-family: var(--font-heading);
                    outline: none;
                }
                .edit-input-desc {
                    background: rgba(255,255,255,0.02);
                    border: 1px solid rgba(255,255,255,0.1);
                    color: #aaa;
                    font-size: 1.1rem;
                    padding: 15px;
                    min-height: 150px;
                    outline: none;
                    line-height: 1.8;
                }
                .edit-input-features {
                    background: rgba(255,255,255,0.02);
                    border: 1px solid rgba(255,255,255,0.1);
                    color: #ccc;
                    padding: 15px;
                    min-height: 200px;
                    width: 100%;
                    outline: none;
                    font-family: var(--font-body);
                }
                .edit-input-wholesaler {
                    background: rgba(255,255,255,0.02);
                    border: 1px solid rgba(255,255,255,0.1);
                    color: #777;
                    padding: 15px;
                    font-size: 0.9rem;
                    outline: none;
                }
                .delete-btn {
                    margin-top: 40px;
                    background: rgba(239, 68, 68, 0.05);
                    color: #ef4444;
                    border: 1px solid rgba(239, 68, 68, 0.2);
                    padding: 15px;
                    cursor: pointer;
                    font-size: 0.8rem;
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
