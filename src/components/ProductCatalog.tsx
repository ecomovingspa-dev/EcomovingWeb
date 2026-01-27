'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Info, Plus, ChevronRight, X, Edit3, Image as ImageIcon } from 'lucide-react';

interface Product {
    id: string;
    name: string;
    description: string;
    features: string[];
    image: string;
    category: string;
    wholesaler?: string;
}

export default function ProductCatalog({ adminMode = false }: { adminMode?: boolean }) {
    const [products, setProducts] = useState<Product[]>([]);
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [filter, setFilter] = useState('Todos');

    useEffect(() => {
        import('../data/catalog.json').then(data => {
            setProducts(data.default);
            localStorage.setItem('ecomoving_catalog', JSON.stringify(data.default));
        });
    }, []);

    const categories = ['Todos', 'Mug', 'Botellas', 'Libretas', 'Cuadernos', 'Mochilas', 'Bolígrafos'];
    const filteredProducts = filter === 'Todos' ? products : products.filter(p => p.category === filter);

    const saveToLocal = (newProducts: Product[]) => {
        setProducts(newProducts);
        localStorage.setItem('ecomoving_catalog', JSON.stringify(newProducts));
    };

    const handleUpdateProduct = (updatedProduct: Product) => {
        const newProducts = products.map(p => p.id === updatedProduct.id ? updatedProduct : p);
        saveToLocal(newProducts);
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

    const handleDelete = (id: string) => {
        if (confirm('¿Eliminar este producto del catálogo?')) {
            saveToLocal(products.filter(p => p.id !== id));
            setSelectedProduct(null);
        }
    };

    return (
        <div className="catalog-wrapper">
            <div className="container">
                <div className="catalog-header">
                    <h2 className="catalog-title">CATÁLOGO <span className="highlight">EXPLORER</span></h2>
                    <p className="catalog-subtitle">Explora nuestra curatoría de productos premium listos para tu marca.</p>
                </div>

                <div className="category-filter">
                    {categories.map(cat => (
                        <button
                            key={cat}
                            className={`filter-btn ${filter === cat ? 'active' : ''}`}
                            onClick={() => setFilter(cat)}
                        >
                            {cat}
                        </button>
                    ))}
                </div>

                <div className="catalog-grid">
                    {filteredProducts.map((product) => (
                        <motion.div
                            key={product.id}
                            layoutId={`card-${product.id}`}
                            className="product-card-premium"
                            onClick={() => {
                                setSelectedProduct(product);
                                setIsEditing(false);
                            }}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            whileHover={{ y: -10 }}
                        >
                            <div className="product-image-container">
                                <img src={product.image} alt={product.name} className="product-img" />
                                <div className="product-overlay">
                                    <div className="product-category">{product.category}</div>
                                    <Info className="info-icon" />
                                </div>
                            </div>
                            <div className="product-meta">
                                <h3>{product.name}</h3>
                                <p>{product.wholesaler}</p>
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
                        className="modal-backdrop"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setSelectedProduct(null)}
                    >
                        <motion.div
                            className="modal-content"
                            layoutId={`card-${selectedProduct.id}`}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="modal-actions">
                                <button className="action-btn" onClick={() => setIsEditing(!isEditing)}>
                                    <Edit3 size={18} /> {isEditing ? 'Guardar' : 'Editar'}
                                </button>
                                <button className="close-btn" onClick={() => setSelectedProduct(null)}>
                                    <X />
                                </button>
                            </div>

                            <div className="modal-inner">
                                <div className="modal-image-col">
                                    <img src={selectedProduct.image} alt={selectedProduct.name} />
                                    {isEditing && (
                                        <div className="image-edit-overlay">
                                            <p>Suelta nueva imagen aquí para cambiar</p>
                                        </div>
                                    )}
                                </div>
                                <div className="modal-text-col">
                                    {isEditing ? (
                                        <div className="edit-form">
                                            <input
                                                className="edit-input-category"
                                                value={selectedProduct.category}
                                                onChange={(e) => handleUpdateProduct({ ...selectedProduct, category: e.target.value })}
                                                placeholder="Categoría"
                                            />
                                            <input
                                                className="edit-input-title"
                                                value={selectedProduct.name}
                                                onChange={(e) => handleUpdateProduct({ ...selectedProduct, name: e.target.value })}
                                                placeholder="Nombre del Producto"
                                            />
                                            <textarea
                                                className="edit-input-desc"
                                                value={selectedProduct.description}
                                                onChange={(e) => handleUpdateProduct({ ...selectedProduct, description: e.target.value })}
                                                placeholder="Descripción detallada"
                                            />

                                            <div className="features-edit">
                                                <h4>Características (un por línea)</h4>
                                                <textarea
                                                    className="edit-input-features"
                                                    value={selectedProduct.features.join('\n')}
                                                    onChange={(e) => handleUpdateProduct({ ...selectedProduct, features: e.target.value.split('\n') })}
                                                />
                                            </div>

                                            <input
                                                className="edit-input-wholesaler"
                                                value={selectedProduct.wholesaler}
                                                onChange={(e) => handleUpdateProduct({ ...selectedProduct, wholesaler: e.target.value })}
                                                placeholder="Nombre del Mayorista"
                                            />

                                            <button className="delete-btn" onClick={() => handleDelete(selectedProduct.id)}>Eliminar Producto</button>
                                        </div>
                                    ) : (
                                        <>
                                            <span className="category-tag">{selectedProduct.category}</span>
                                            <h2>{selectedProduct.name}</h2>
                                            <p className="description">{selectedProduct.description}</p>

                                            <div className="features-list">
                                                <h4>Características Técnicas</h4>
                                                <ul>
                                                    {selectedProduct.features.map((f, i) => (
                                                        <li key={i}><ChevronRight size={14} className="accent" /> {f}</li>
                                                    ))}
                                                </ul>
                                            </div>

                                            <div className="wholesaler-info">
                                                <span>Suministrador:</span> {selectedProduct.wholesaler}
                                            </div>

                                            <button className="btn-contact">Solicitar Cotización</button>
                                        </>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <style jsx>{`
                .catalog-wrapper {
                    padding: 80px 0;
                    background-color: #050505;
                }
                .catalog-header {
                    text-align: center;
                    margin-bottom: 60px;
                }
                .catalog-title {
                    font-size: 3rem;
                    margin-bottom: 10px;
                    font-family: var(--font-heading);
                    letter-spacing: 4px;
                }
                .catalog-subtitle {
                    color: #666;
                    font-size: 1rem;
                    max-width: 600px;
                    margin: 0 auto;
                    text-transform: uppercase;
                    letter-spacing: 2px;
                }
                .category-filter {
                    display: flex;
                    justify-content: center;
                    gap: 15px;
                    margin-bottom: 50px;
                    flex-wrap: wrap;
                }
                .filter-btn {
                    background: none;
                    border: 1px solid #222;
                    color: #aaa;
                    padding: 10px 24px;
                    font-size: 0.85rem;
                    text-transform: uppercase;
                    letter-spacing: 2px;
                    cursor: pointer;
                    transition: all 0.3s;
                }
                .filter-btn:hover, .filter-btn.active {
                    color: var(--accent-turquoise);
                    border-color: var(--accent-turquoise);
                    background: rgba(0,212,189,0.05);
                }
                .highlight {
                    color: var(--accent-turquoise);
                }
                .catalog-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
                    gap: 30px;
                }
                .product-card-premium {
                    background: #0a0a0a;
                    border: 1px solid #1a1a1a;
                    border-radius: 4px;
                    overflow: hidden;
                    cursor: pointer;
                    transition: all 0.4s cubic-bezier(0.165, 0.84, 0.44, 1);
                }
                .product-card-premium:hover {
                    border-color: var(--accent-turquoise);
                    transform: translateY(-5px);
                    box-shadow: 0 20px 40px rgba(0,0,0,0.6);
                }
                .product-image-container {
                    position: relative;
                    aspect-ratio: 1/1;
                    overflow: hidden;
                }
                .product-img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                    transition: transform 1s ease;
                }
                .product-card-premium:hover .product-img {
                    transform: scale(1.1);
                }
                .product-overlay {
                    position: absolute;
                    inset: 0;
                    background: linear-gradient(to top, rgba(0,0,0,0.9) 0%, transparent 50%);
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-end;
                    padding: 20px;
                    opacity: 0.8;
                }
                .product-category {
                    background: rgba(255,255,255,0.1);
                    backdrop-filter: blur(5px);
                    color: white;
                    font-size: 9px;
                    font-weight: 700;
                    padding: 4px 10px;
                    text-transform: uppercase;
                    letter-spacing: 2px;
                }
                .info-icon {
                    color: var(--accent-turquoise);
                    width: 18px;
                }
                .product-meta {
                    padding: 20px;
                }
                .product-meta h3 {
                    margin: 0;
                    font-size: 1.1rem;
                    color: white;
                    font-family: var(--font-heading);
                    letter-spacing: 1px;
                }
                .product-meta p {
                    margin: 8px 0 0 0;
                    font-size: 0.7rem;
                    color: #555;
                    text-transform: uppercase;
                    letter-spacing: 2px;
                }

                .add-product-slot {
                    background: #050505;
                    border: 1px dashed #333;
                    aspect-ratio: 1/1;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.3s;
                    cursor: pointer;
                }
                .add-product-slot:hover {
                    border-color: var(--accent-turquoise);
                    background: #0a0a0a;
                }
                .add-content {
                    text-align: center;
                    color: #333;
                }
                .add-product-slot:hover .add-content {
                    color: var(--accent-turquoise);
                }
                .icon-circle {
                    width: 50px;
                    height: 50px;
                    border-radius: 50%;
                    border: 1px solid #222;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin: 0 auto 15px auto;
                }
                .add-content span {
                    display: block;
                    font-family: var(--font-heading);
                    font-size: 0.9rem;
                    text-transform: uppercase;
                    letter-spacing: 2px;
                }
                .add-content p {
                    font-size: 0.7rem;
                    margin-top: 5px;
                }

                /* Modal */
                .modal-backdrop {
                    position: fixed;
                    inset: 0;
                    background: rgba(0,0,0,0.95);
                    backdrop-filter: blur(15px);
                    z-index: 10000;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 20px;
                }
                .modal-content {
                    background: #0a0a0a;
                    width: 100%;
                    max-width: 1100px;
                    max-height: 90vh;
                    border-radius: 0;
                    overflow: hidden;
                    position: relative;
                    border: 1px solid #222;
                }
                .modal-actions {
                    position: absolute;
                    right: 20px;
                    top: 20px;
                    display: flex;
                    gap: 15px;
                    z-index: 100;
                }
                .action-btn {
                    background: rgba(255,255,255,0.05);
                    border: 1px solid #333;
                    color: white;
                    padding: 8px 15px;
                    font-size: 12px;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    transition: all 0.3s;
                }
                .action-btn:hover {
                    background: var(--accent-turquoise);
                    color: black;
                    border-color: var(--accent-turquoise);
                }
                .close-btn {
                    background: none;
                    border: none;
                    color: white;
                    cursor: pointer;
                }
                .modal-inner {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    height: 90vh;
                }
                @media (max-width: 900px) {
                    .modal-inner {
                        grid-template-columns: 1fr;
                        overflow-y: auto;
                    }
                }
                .modal-image-col {
                    position: relative;
                    background: #000;
                }
                .modal-image-col img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                }
                .image-edit-overlay {
                    position: absolute;
                    inset: 0;
                    background: rgba(0,212,189,0.2);
                    border: 4px dashed var(--accent-turquoise);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    text-align: center;
                    padding: 40px;
                    pointer-events: none;
                }
                .modal-text-col {
                    padding: 80px 60px;
                    display: flex;
                    flex-direction: column;
                    background: #0a0a0a;
                    overflow-y: auto;
                }
                .category-tag {
                    color: var(--accent-gold);
                    font-size: 0.75rem;
                    text-transform: uppercase;
                    letter-spacing: 4px;
                    margin-bottom: 20px;
                }
                .modal-text-col h2 {
                    font-size: 3.5rem;
                    line-height: 1;
                    margin-bottom: 30px;
                    color: white;
                    font-family: var(--font-heading);
                }
                .description {
                    color: #888;
                    font-size: 1.1rem;
                    line-height: 1.8;
                    margin-bottom: 40px;
                    font-weight: 300;
                }
                .features-list h4, .features-edit h4 {
                    font-family: var(--font-heading);
                    text-transform: uppercase;
                    font-size: 0.8rem;
                    color: #555;
                    margin-bottom: 20px;
                    letter-spacing: 3px;
                }
                .features-list ul {
                    list-style: none;
                    padding: 0;
                    margin: 0;
                }
                .features-list li {
                    display: flex;
                    align-items: center;
                    gap: 15px;
                    color: #aaa;
                    margin-bottom: 12px;
                    font-size: 0.9rem;
                }
                .accent {
                    color: var(--accent-turquoise);
                }
                .wholesaler-info {
                    margin-top: 60px;
                    font-size: 0.7rem;
                    color: #444;
                    padding-top: 30px;
                    border-top: 1px solid #1a1a1a;
                    text-transform: uppercase;
                    letter-spacing: 2px;
                }
                .wholesaler-info span {
                    color: #222;
                }
                .btn-contact {
                    margin-top: 40px;
                    background: var(--accent-turquoise);
                    color: black;
                    border: none;
                    padding: 18px 40px;
                    font-weight: 800;
                    text-transform: uppercase;
                    letter-spacing: 3px;
                    cursor: pointer;
                    transition: all 0.3s;
                    font-size: 0.8rem;
                }
                .btn-contact:hover {
                    background: white;
                    transform: translateY(-2px);
                    box-shadow: 0 10px 30px rgba(255,255,255,0.2);
                }

                /* Edit Mode Styles */
                .edit-form {
                    display: flex;
                    flex-direction: column;
                    gap: 15px;
                }
                .edit-input-category {
                    background: none;
                    border: 1px solid #333;
                    color: var(--accent-gold);
                    padding: 10px;
                    letter-spacing: 3px;
                    text-transform: uppercase;
                    font-size: 0.8rem;
                }
                .edit-input-title {
                    background: none;
                    border: 1px solid #333;
                    color: white;
                    font-size: 2.5rem;
                    padding: 10px;
                    font-family: var(--font-heading);
                }
                .edit-input-desc {
                    background: none;
                    border: 1px solid #333;
                    color: #888;
                    font-size: 1rem;
                    padding: 10px;
                    min-height: 100px;
                }
                .edit-input-features {
                    background: none;
                    border: 1px solid #333;
                    color: #aaa;
                    padding: 10px;
                    min-height: 150px;
                    width: 100%;
                }
                .edit-input-wholesaler {
                    background: none;
                    border: 1px solid #333;
                    color: #555;
                    padding: 10px;
                    font-size: 0.8rem;
                }
                .delete-btn {
                    margin-top: 20px;
                    background: #300;
                    color: #f66;
                    border: 1px solid #500;
                    padding: 10px;
                    cursor: pointer;
                    font-size: 0.7rem;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                }
                .delete-btn:hover {
                    background: #500;
                    color: white;
                }
            `}</style>
        </div>
    );
}
