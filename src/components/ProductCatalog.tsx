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

    useEffect(() => {
        // Cargar productos aprobados desde Supabase
        fetchApprovedProducts();
    }, []);

    const fetchApprovedProducts = async () => {
        try {
            const { data, error } = await supabase
                .from('agent_buffer')
                .select('*')
                .eq('status', 'approved')
                .order('found_at', { ascending: false });

            if (error) {
                console.error('Error loading from Supabase:', error);
                // Fallback a catalog.json si Supabase falla
                const catalogData = await import('../data/catalog.json');
                setProducts(catalogData.default);
                return;
            }

            if (data && data.length > 0) {
                // Convertir formato de Supabase a formato Product
                const formattedProducts: Product[] = data.map((item: any) => {
                    // La categoría puede venir en la columna 'category' o dentro de technical_specs
                    const category = item.category || item.technical_specs?.category || 'Otros';

                    return {
                        id: item.id,
                        name: item.name,
                        description: (item.original_description && item.original_description !== item.name) ? item.original_description : '',
                        features: item.technical_specs?.specs || item.features || [],
                        image: item.images?.[0] || item.image || '',
                        images: item.images || [],
                        category: category,
                        wholesaler: item.wholesaler || 'Premium',
                        isPremium: item.technical_specs?.is_premium || false
                    };
                });

                console.log('✅ Productos cargados desde Supabase:', formattedProducts.length);
                setProducts(formattedProducts);
            } else {
                // Si no hay productos aprobados, usar catalog.json
                const catalogData = await import('../data/catalog.json');
                setProducts(catalogData.default);
            }
        } catch (error) {
            console.error('Error fetching products:', error);
            // Fallback a catalog.json
            const catalogData = await import('../data/catalog.json');
            setProducts(catalogData.default);
        }
    };

    const categories = ['Todos', 'Mug', 'Botellas', 'Cuadernos y Libretas', 'Mochilas', 'Tecnología', 'Bolígrafos'];
    const filteredProducts = products.filter(p => {
        const matchesCategory = filter === 'Todos' ||
            p.category.toLowerCase().trim() === filter.toLowerCase().trim();
        const matchesSearch = !externalSearch ||
            p.name.toLowerCase().includes(externalSearch.toLowerCase()) ||
            p.description.toLowerCase().includes(externalSearch.toLowerCase()) ||
            p.id.toLowerCase().includes(externalSearch.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    const saveToLocal = (newProducts: Product[]) => {
        setProducts(newProducts);
        localStorage.setItem('ecomoving_catalog', JSON.stringify(newProducts));
    };

    const handleLocalUpdate = (updatedProduct: Product) => {
        const newProducts = products.map(p => p.id === updatedProduct.id ? updatedProduct : p);
        setProducts(newProducts);
        setSelectedProduct(updatedProduct);
    };

    const handleSaveToSupabase = async () => {
        if (!selectedProduct) return;

        // Verificar si el ID es de Supabase (formato UUID)
        const isSupabaseProduct = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(selectedProduct.id);

        if (!isSupabaseProduct) {
            alert('Este producto es parte del catálogo base estático y no puede editarse en la base de datos directamente.');
            return;
        }

        try {
            const mainImg = activeImage || selectedProduct.image;
            const otherImgs = (selectedProduct.images || []).filter(img => img !== mainImg);
            const orderedImages = [mainImg, ...otherImgs].filter(Boolean);

            const { error } = await supabase
                .from('agent_buffer')
                .update({
                    name: selectedProduct.name,
                    // La columna 'category' podría no existir, la guardamos dentro de technical_specs
                    original_description: selectedProduct.description,
                    technical_specs: {
                        specs: selectedProduct.features,
                        category: selectedProduct.category
                    },
                    images: orderedImages,
                    wholesaler: selectedProduct.wholesaler
                })
                .eq('id', selectedProduct.id);

            if (error) {
                console.error('Supabase update error:', error);
                throw error;
            }
            alert('Producto actualizado exitosamente en el catálogo');
        } catch (error: any) {
            console.error('Error updating product:', error);
            alert(`Error al sincronizar con la base de datos: ${error.message || 'Error desconocido'}`);
        }
    };

    const handleDropOnNew = (e: React.DragEvent) => {
        e.preventDefault();
        const url = e.dataTransfer.getData('image_url');
        if (url) {
            const newProduct: Product = {
                id: Date.now().toString(),
                name: "Nuevo Producto",
                description: "Haz click para editar la descripción...",
                features: ["Característica 1", "Característica 2"],
                image: url,
                category: "General",
                wholesaler: "Mayorista"
            };
            saveToLocal([...products, newProduct]);
            setSelectedProduct(newProduct);
            setIsEditing(true);
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
                <div className="catalog-header">
                    <h2 className="catalog-title">CURADURÍA <span className="highlight">ESTRATÉGICA</span></h2>
                    <p className="catalog-subtitle">Merchandising que eleva la identidad corporativa. Desde pequeñas series hasta grandes volúmenes.</p>
                </div>

                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '40px' }}>
                    <div className="category-filter" style={{ marginBottom: 0 }}>
                        {['Todos', 'Mug', 'Botellas', 'Cuadernos y Libretas', 'Mochilas', 'Tecnología', 'Bolígrafos'].map(cat => (
                            <button
                                key={cat}
                                className={`filter-btn ${filter === cat ? 'active' : ''}`}
                                onClick={() => setFilter(cat)}
                            >
                                {cat}
                            </button>
                        ))}
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

                    {/* Slot para agregar nuevo producto */}
                    <div
                        className="add-product-slot"
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={handleDropOnNew}
                    >
                        <div className="add-content">
                            <div className="icon-circle">
                                <Plus size={32} />
                            </div>
                            <span>Añadir Producto</span>
                            <p>Suelta una imagen aquí</p>
                        </div>
                    </div>
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
                            layoutId={`card-${selectedProduct.id}`}
                            style={{
                                backgroundColor: '#0a0a0a',
                                width: '100%',
                                maxWidth: '1400px',
                                maxHeight: '90vh',
                                border: '1px solid rgba(255,255,255,0.05)',
                                borderRadius: '4px',
                                overflow: 'hidden',
                                position: 'relative',
                                boxShadow: '0 50px 100px rgba(0,0,0,0.9)',
                                display: 'grid',
                                gridTemplateColumns: '1.2fr 1fr'
                            }}
                            onClick={(e) => e.stopPropagation()}
                        >
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

                            <div className="modal-image-col" style={{
                                display: 'flex',
                                flexDirection: 'column',
                                background: '#000',
                                height: '100%',
                                maxHeight: '90vh',
                                overflow: 'hidden'
                            }}>
                                {/* Área de Imagen Principal */}
                                <div
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
                                    style={{
                                        flex: 1,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        position: 'relative',
                                        padding: '40px',
                                        minHeight: 0, // Importante para flexbox
                                        overflow: 'hidden'
                                    }}
                                >
                                    <motion.img
                                        key={activeImage || selectedProduct.image}
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ duration: 0.4 }}
                                        src={activeImage || selectedProduct.image}
                                        alt={selectedProduct.name}
                                        style={{
                                            maxWidth: '100%',
                                            maxHeight: '100%',
                                            objectFit: 'contain',
                                            filter: 'drop-shadow(0 20px 60px rgba(0,0,0,0.5))'
                                        }}
                                    />
                                    {isEditing && (
                                        <div className="image-edit-overlay">
                                            <ImageIcon size={48} style={{ marginBottom: '20px', opacity: 0.2 }} />
                                        </div>
                                    )}
                                </div>

                                {/* Galería de Miniaturas */}
                                <div style={{
                                    padding: '20px 40px',
                                    background: 'rgba(10, 10, 10, 0.8)',
                                    borderTop: '1px solid rgba(0, 212, 189, 0.2)',
                                    backdropFilter: 'blur(15px)',
                                    flexShrink: 0,
                                    zIndex: 10
                                }}>
                                    <p style={{ fontSize: '10px', color: 'var(--accent-gold)', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '15px', textAlign: 'center', opacity: 0.6 }}>Vistas de Producto</p>
                                    <div style={{
                                        display: 'flex',
                                        gap: '12px',
                                        justifyContent: 'center',
                                        alignItems: 'center',
                                        flexWrap: 'wrap'
                                    }}>
                                        {galleryImages.length > 0 ? galleryImages.map((img, idx) => (
                                            <motion.div
                                                key={idx}
                                                whileHover={{ scale: 1.1, y: -5 }}
                                                whileTap={{ scale: 0.95 }}
                                                onClick={() => {
                                                    setActiveImage(img);
                                                    if (adminMode) {
                                                        handleLocalUpdate({ ...selectedProduct, image: img });
                                                    }
                                                }}
                                                style={{
                                                    width: '65px',
                                                    height: '65px',
                                                    flexShrink: 0,
                                                    cursor: 'pointer',
                                                    border: (activeImage || selectedProduct.image) === img ? '2px solid var(--accent-turquoise)' : '1px solid rgba(255,255,255,0.1)',
                                                    borderRadius: '4px',
                                                    overflow: 'hidden',
                                                    opacity: (activeImage || selectedProduct.image) === img ? 1 : 0.4,
                                                    transition: 'all 0.3s ease',
                                                    background: '#111',
                                                    boxShadow: (activeImage || selectedProduct.image) === img ? '0 0 20px rgba(0,212,189,0.3)' : 'none',
                                                    position: 'relative'
                                                }}
                                            >
                                                <img
                                                    src={img}
                                                    alt={`${selectedProduct.name} - Vista ${idx + 1}`}
                                                    style={{
                                                        width: '100%',
                                                        height: '100%',
                                                        objectFit: 'cover'
                                                    }}
                                                />
                                                {selectedProduct.image === img && (
                                                    <div style={{
                                                        position: 'absolute',
                                                        bottom: 0,
                                                        left: 0,
                                                        right: 0,
                                                        background: 'var(--accent-gold)',
                                                        color: 'black',
                                                        fontSize: '8px',
                                                        fontWeight: '900',
                                                        textAlign: 'center',
                                                        padding: '2px 0',
                                                        textTransform: 'uppercase',
                                                        letterSpacing: '1px',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        gap: '4px'
                                                    }}>
                                                        <Star size={8} fill="black" /> PRINCIPAL
                                                    </div>
                                                )}
                                                {adminMode && activeImage === img && selectedProduct.image !== img && (
                                                    <div style={{
                                                        position: 'absolute',
                                                        top: 0,
                                                        right: 0,
                                                        background: 'var(--accent-turquoise)',
                                                        color: 'black',
                                                        padding: '4px',
                                                        borderRadius: '0 0 0 4px',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        boxShadow: '0 2px 10px rgba(0,0,0,0.3)'
                                                    }}>
                                                        <Edit3 size={10} />
                                                    </div>
                                                )}
                                            </motion.div>
                                        )) : (
                                            /* Fallback si galleryImages está vacío pero tenemos imagen principal */
                                            <motion.div
                                                whileHover={{ scale: 1.1, y: -5 }}
                                                whileTap={{ scale: 0.95 }}
                                                onClick={() => setActiveImage(selectedProduct.image)}
                                                style={{
                                                    width: '65px',
                                                    height: '65px',
                                                    flexShrink: 0,
                                                    cursor: 'pointer',
                                                    border: '2px solid var(--accent-turquoise)',
                                                    borderRadius: '4px',
                                                    overflow: 'hidden',
                                                    background: '#111',
                                                    boxShadow: '0 0 20px rgba(0,212,189,0.3)'
                                                }}
                                            >
                                                <img
                                                    src={selectedProduct.image}
                                                    alt={selectedProduct.name}
                                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                />
                                            </motion.div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="modal-content-scroll" style={{ padding: '80px', display: 'flex', flexDirection: 'column', backgroundColor: '#0a0a0a', overflowY: 'auto', borderLeft: '1px solid rgba(255,255,255,0.05)', maxHeight: '90vh' }}>
                                {isEditing ? (
                                    <div className="edit-form">
                                        <input
                                            className="edit-input-category"
                                            value={selectedProduct.category}
                                            onChange={(e) => handleLocalUpdate({ ...selectedProduct, category: e.target.value })}
                                            placeholder="Categoría"
                                        />
                                        <input
                                            className="edit-input-title"
                                            value={selectedProduct.name}
                                            onChange={(e) => handleLocalUpdate({ ...selectedProduct, name: e.target.value })}
                                            placeholder="Nombre del Producto"
                                        />

                                        <div className="features-edit">
                                            <h4>Características (un por línea)</h4>
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
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '35px' }}>
                                            <span className="category-tag" style={{ margin: 0, fontSize: '0.9rem', letterSpacing: '4px' }}>{selectedProduct.category}</span>
                                        </div>
                                        <h2 style={{
                                            fontSize: '1.5rem',
                                            lineHeight: '1.3',
                                            marginBottom: '20px',
                                            color: 'white',
                                            fontFamily: 'var(--font-heading)',
                                            letterSpacing: '1px',
                                            textTransform: 'uppercase',
                                            maxWidth: '900px'
                                        }}>
                                            {selectedProduct.name}
                                        </h2>

                                        <div style={{
                                            padding: '40px',
                                            background: 'rgba(0, 212, 189, 0.02)',
                                            border: '1px solid rgba(0, 212, 189, 0.08)',
                                            borderRadius: '4px',
                                            marginBottom: '40px',
                                            maxWidth: '1000px',
                                            width: '100%'
                                        }}>
                                            <div style={{
                                                display: 'inline-block',
                                                padding: '10px 20px',
                                                background: 'rgba(0, 212, 189, 0.05)',
                                                borderRadius: '2px',
                                                marginBottom: '35px',
                                                border: '1px solid rgba(0, 212, 189, 0.2)'
                                            }}>
                                                <h4 style={{
                                                    fontFamily: 'var(--font-heading)',
                                                    textTransform: 'uppercase',
                                                    fontSize: '0.75rem',
                                                    color: 'var(--accent-turquoise)',
                                                    margin: 0,
                                                    letterSpacing: '4px',
                                                    fontWeight: '800'
                                                }}>
                                                    Especificaciones Técnicas
                                                </h4>
                                            </div>
                                            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                                                {selectedProduct.features && selectedProduct.features.length > 0 ? (
                                                    selectedProduct.features.filter(f => f && !['Calidad Premium', 'Ecorresponsable'].includes(f.trim())).map((f, i) => (
                                                        <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '15px', color: '#ccc', marginBottom: '20px', fontSize: '1rem', fontWeight: '300', lineHeight: '1.6' }}>
                                                            <ChevronRight size={14} className="accent" style={{ marginTop: '5px', flexShrink: 0 }} /> {f}
                                                        </li>
                                                    ))
                                                ) : (
                                                    <li style={{ color: '#555', fontSize: '0.9rem', fontStyle: 'italic' }}>Consulte para más detalles técnicos.</li>
                                                )}
                                            </ul>
                                        </div>

                                        <button className="btn-contact" style={{ width: '100%', marginBottom: '60px' }}>Solicitar Cotización Personalizada</button>

                                        {/* Productos Relacionados */}
                                        {products.filter(p => p.category === selectedProduct.category && p.id !== selectedProduct.id).length > 0 && (
                                            <div className="related-products-section" style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '40px' }}>
                                                <h4 style={{
                                                    fontFamily: 'var(--font-heading)',
                                                    textTransform: 'uppercase',
                                                    fontSize: '0.7rem',
                                                    color: 'rgba(255,255,255,0.4)',
                                                    marginBottom: '25px',
                                                    letterSpacing: '3px'
                                                }}>Productos Relacionados</h4>
                                                <div style={{
                                                    display: 'grid',
                                                    gridTemplateColumns: 'repeat(2, 1fr)',
                                                    gap: '20px'
                                                }}>
                                                    {products
                                                        .filter(p => p.category === selectedProduct.category && p.id !== selectedProduct.id)
                                                        .slice(0, 4)
                                                        .map(related => (
                                                            <div
                                                                key={related.id}
                                                                className="related-item"
                                                                onClick={() => {
                                                                    setSelectedProduct(related);
                                                                    setActiveImage(related.image);
                                                                    // Enfocar arriba al cambiar
                                                                    const modalScroll = document.querySelector('.modal-content-scroll');
                                                                    if (modalScroll) modalScroll.scrollTop = 0;
                                                                }}
                                                                style={{
                                                                    cursor: 'pointer',
                                                                    background: 'rgba(255,255,255,0.02)',
                                                                    borderRadius: '4px',
                                                                    padding: '15px',
                                                                    border: '1px solid rgba(255,255,255,0.05)',
                                                                    transition: 'all 0.3s ease',
                                                                    display: 'flex',
                                                                    flexDirection: 'column',
                                                                    gap: '12px'
                                                                }}
                                                            >
                                                                <div style={{ aspectRatio: '1/1', overflow: 'hidden', borderRadius: '2px', background: '#000' }}>
                                                                    <img src={related.image} alt={related.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                                                                </div>
                                                                <span style={{ fontSize: '0.7rem', color: '#fff', opacity: 0.7, textTransform: 'uppercase', letterSpacing: '1px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                                    {related.name}
                                                                </span>
                                                            </div>
                                                        ))}
                                                </div>
                                            </div>
                                        )}
                                    </>
                                )}
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
                    margin-bottom: 60px;
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
                    padding: 25px;
                    text-align: center;
                }
                .product-meta h3 {
                    margin: 0;
                    font-size: 1.25rem;
                    color: white;
                    font-family: var(--font-heading);
                    letter-spacing: 2px;
                    text-transform: uppercase;
                }
                .product-meta p {
                    margin: 10px 0 0 0;
                    font-size: 0.75rem;
                    color: var(--text-muted);
                    text-transform: uppercase;
                    letter-spacing: 3px;
                }

                .add-product-slot {
                    background: #050505;
                    border: 1px dashed rgba(255,255,255,0.1);
                    aspect-ratio: 1/1;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.4s;
                    cursor: pointer;
                    border-radius: 4px;
                }
                .add-product-slot:hover {
                    border-color: var(--accent-turquoise);
                    background: rgba(0,212,189,0.02);
                }
                .add-content {
                    text-align: center;
                    color: #444;
                }
                .add-product-slot:hover .add-content {
                    color: var(--accent-turquoise);
                }
                .icon-circle {
                    width: 60px;
                    height: 60px;
                    border-radius: 50%;
                    border: 1px solid rgba(255,255,255,0.1);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin: 0 auto 20px auto;
                    transition: all 0.4s;
                }
                .add-product-slot:hover .icon-circle {
                    border-color: var(--accent-turquoise);
                    transform: scale(1.1);
                }
                .add-content span {
                    display: block;
                    font-family: var(--font-heading);
                    font-size: 1rem;
                    text-transform: uppercase;
                    letter-spacing: 3px;
                }
                .add-content p {
                    font-size: 0.8rem;
                    margin-top: 8px;
                    letter-spacing: 1px;
                }

                /* Modal */
                .modal-backdrop {
                    position: fixed;
                    inset: 0;
                    background: rgba(0,0,0,0.98);
                    backdrop-filter: blur(20px);
                    z-index: 10000;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 40px;
                }
                .modal-content {
                    background: #0a0a0a;
                    width: 100%;
                    max-width: 1400px;
                    max-height: 90vh;
                    border-radius: 0;
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
                    grid-template-columns: 1fr 1fr;
                    height: 90vh;
                }
                @media (max-width: 1024px) {
                    .modal-inner {
                        grid-template-columns: 1fr;
                        overflow-y: auto;
                    }
                    .modal-content {
                        max-height: 95vh;
                    }
                }
                .modal-image-col {
                    position: relative;
                    background: #000;
                    padding: 60px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                .modal-image-col img {
                    width: 100%;
                    height: 100%;
                    object-fit: contain;
                    filter: drop-shadow(0 20px 50px rgba(0,0,0,0.5));
                }
                .image-edit-overlay {
                    position: absolute;
                    inset: 40px;
                    background: rgba(0,212,189,0.05);
                    border: 2px dashed var(--accent-turquoise);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    text-align: center;
                    padding: 40px;
                    pointer-events: none;
                    color: var(--accent-turquoise);
                    font-family: var(--font-heading);
                    letter-spacing: 4px;
                    text-transform: uppercase;
                }
                .modal-text-col {
                    padding: 100px 80px;
                    display: flex;
                    flex-direction: column;
                    background: #0a0a0a;
                    overflow-y: auto;
                    border-left: 1px solid rgba(255,255,255,0.05);
                }
                .category-tag {
                    color: var(--accent-gold);
                    font-size: 0.8rem;
                    text-transform: uppercase;
                    letter-spacing: 5px;
                    margin-bottom: 30px;
                    display: block;
                    font-family: var(--font-body);
                    font-weight: 700;
                }
                .modal-text-col h2 {
                    font-size: 4rem;
                    line-height: 1.1;
                    margin-bottom: 40px;
                    color: white;
                    font-family: var(--font-heading);
                    letter-spacing: -2px;
                }
                .description {
                    color: #999;
                    font-size: 1.25rem;
                    line-height: 2;
                    margin-bottom: 60px;
                    font-weight: 300;
                }
                .features-list h4, .features-edit h4 {
                    font-family: var(--font-heading);
                    text-transform: uppercase;
                    font-size: 0.9rem;
                    color: var(--accent-gold);
                    margin-bottom: 30px;
                    letter-spacing: 4px;
                }
                .features-list ul {
                    list-style: none;
                    padding: 0;
                    margin: 0;
                }
                .features-list li {
                    display: flex;
                    align-items: center;
                    gap: 20px;
                    color: #ccc;
                    margin-bottom: 18px;
                    font-size: 1rem;
                    font-weight: 300;
                }
                .accent {
                    color: var(--accent-turquoise);
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
