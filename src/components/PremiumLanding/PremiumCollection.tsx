import React, { useEffect, useState, useRef } from 'react';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { ChevronRight, Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function PremiumCollection() {
    const [premiumProducts, setPremiumProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const containerRef = useRef<HTMLDivElement>(null);
    const router = useRouter();

    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start end", "end start"]
    });

    const translateY = useTransform(scrollYProgress, [0, 1], [100, -100]);
    const opacity = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0, 1, 1, 0]);

    useEffect(() => {
        fetchPremiumProducts();
    }, []);

    const fetchPremiumProducts = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('productos')
                .select('*')
                .eq('is_premium', true)
                .eq('status', 'approved')
                .limit(6); // Máximo 6 productos para mantener el estilo "cápsula"

            if (error) throw error;
            setPremiumProducts(data || []);
        } catch (error) {
            console.error('Error fetching premium products:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return null; // O un skeleton loader premium si prefieres

    if (premiumProducts.length === 0) return null; // No mostrar si no hay VIPs marcados

    return (
        <motion.section
            ref={containerRef}
            style={{ y: translateY, opacity }}
            className="premium-collection-wrapper"
        >
            <div className="premium-header">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="premium-badge"
                >
                    <Sparkles size={14} className="gold-sparkle" />
                    <span>THE CHOSEN COLLECTION</span>
                </motion.div>
                <motion.h2
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.1 }}
                >
                    Ingeniería superior. <br />Diseño sustentable.
                </motion.h2>
                <motion.p
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.2 }}
                >
                    Nuestra selección exclusiva de productos de alto impacto corporal y cero impacto ambiental.
                    Diseñados para marcas que lideran el mañana.
                </motion.p>
            </div>

            <div className="premium-bento-grid">
                {premiumProducts.map((product, idx) => (
                    <PremiumCard key={product.id} product={product} index={idx} router={router} />
                ))}
            </div>

            <style jsx>{`
                .premium-collection-wrapper {
                    padding: 120px 5vw;
                    max-width: 1800px;
                    margin: 0 auto;
                    position: relative;
                    z-index: 10;
                }
                .premium-header {
                    text-align: center;
                    max-width: 800px;
                    margin: 0 auto 80px auto;
                }
                .premium-badge {
                    display: inline-flex;
                    align-items: center;
                    gap: 8px;
                    padding: 8px 16px;
                    background: rgba(212, 175, 55, 0.05);
                    border: 1px solid rgba(212, 175, 55, 0.2);
                    border-radius: 30px;
                    color: var(--accent-gold);
                    font-size: 11px;
                    letter-spacing: 4px;
                    font-weight: 800;
                    margin-bottom: 24px;
                }
                .gold-sparkle { color: var(--accent-gold); }
                .premium-header h2 {
                    font-family: var(--font-heading);
                    font-size: clamp(2.5rem, 5vw, 4rem);
                    line-height: 1.1;
                    margin-bottom: 24px;
                    color: #fff;
                    letter-spacing: -1px;
                }
                .premium-header p {
                    font-size: 1.1rem;
                    color: #888;
                    line-height: 1.6;
                    max-width: 600px;
                    margin: 0 auto;
                    font-weight: 300;
                }
                .premium-bento-grid {
                    display: grid;
                    grid-template-columns: repeat(12, 1fr);
                    gap: 24px;
                    grid-auto-rows: minmax(100px, auto);
                }
            `}</style>
        </motion.section>
    );
}

const PremiumCard = ({ product, index, router }: { product: any, index: number, router: any }) => {
    const cardRef = useRef<HTMLDivElement>(null);
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
    const [isHovered, setIsHovered] = useState(false);

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!cardRef.current) return;
        const rect = cardRef.current.getBoundingClientRect();
        setMousePos({
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
        });
    };

    // Lógica para variar el tamaño en la grilla Bento (12 columnas total)
    let gridCol = 'span 4';
    let gridRow = 'span 4';
    let minH = '450px';

    if (index === 0) { gridCol = 'span 8'; gridRow = 'span 6'; minH = '600px'; } // Destacado Grande Left
    else if (index === 1) { gridCol = 'span 4'; gridRow = 'span 3'; minH = '300px'; } // Pequeño Right Top
    else if (index === 2) { gridCol = 'span 4'; gridRow = 'span 3'; minH = '300px'; } // Pequeño Right Bottom
    else if (index === 3) { gridCol = 'span 4'; gridRow = 'span 4'; } // Normal
    else if (index === 4) { gridCol = 'span 4'; gridRow = 'span 4'; } // Normal
    else if (index === 5) { gridCol = 'span 4'; gridRow = 'span 4'; } // Normal

    const image = product.imagen_principal || (product.imagenes_galeria && product.imagenes_galeria[0]) || '';

    return (
        <motion.div
            ref={cardRef}
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ delay: index * 0.1, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="premium-card"
            style={{
                gridColumn: gridCol,
                gridRow: gridRow,
                minHeight: minH
            }}
            onMouseMove={handleMouseMove}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onClick={() => router.push(`/catalogo?sku=${product.sku_externo}`)}
        >
            {/* Spotlight Effect */}
            <div
                className="spotlight"
                style={{
                    background: `radial-gradient(600px circle at ${mousePos.x}px ${mousePos.y}px, rgba(255,255,255,0.06), transparent 40%)`,
                    opacity: isHovered ? 1 : 0
                }}
            />

            <div className="card-content">
                <div className="image-container">
                    <img src={image} alt={product.nombre} className="product-image" />
                </div>

                <div className="info-overlay">
                    <div className="info-text">
                        <span className="category">{product.categoria}</span>
                        <h3>{product.nombre}</h3>
                    </div>
                    <div className="action-btn">
                        <ChevronRight size={20} />
                    </div>
                </div>
            </div>

            <style jsx>{`
                .premium-card {
                    position: relative;
                    border-radius: 20px;
                    background: rgba(10, 10, 10, 0.4);
                    border: 1px solid rgba(255, 255, 255, 0.03);
                    overflow: hidden;
                    cursor: pointer;
                    backdrop-filter: blur(20px);
                    -webkit-backdrop-filter: blur(20px);
                    transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.4s ease;
                }
                .premium-card:hover {
                    transform: translateY(-5px) scale(1.01);
                    border-color: rgba(255, 255, 255, 0.1);
                }
                .spotlight {
                    position: absolute;
                    inset: 0;
                    z-index: 10;
                    border-radius: 20px;
                    pointer-events: none;
                    transition: opacity 0.3s ease;
                }
                .card-content {
                    position: relative;
                    width: 100%;
                    height: 100%;
                    z-index: 5;
                    display: flex;
                    flex-direction: column;
                }
                .image-container {
                    flex: 1;
                    width: 100%;
                    position: relative;
                    overflow: hidden;
                    padding: 40px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                .product-image {
                    max-width: 100%;
                    max-height: 100%;
                    object-fit: contain;
                    transition: transform 0.7s cubic-bezier(0.16, 1, 0.3, 1);
                    filter: drop-shadow(0 20px 30px rgba(0,0,0,0.5));
                }
                .premium-card:hover .product-image {
                    transform: scale(1.08);
                }
                .info-overlay {
                    padding: 30px;
                    background: linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0) 100%);
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-end;
                    position: absolute;
                    bottom: 0;
                    left: 0;
                    right: 0;
                    opacity: 0.8;
                    transition: opacity 0.3s ease;
                }
                .premium-card:hover .info-overlay {
                    opacity: 1;
                }
                .info-text {
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                }
                .category {
                    font-size: 10px;
                    letter-spacing: 2px;
                    text-transform: uppercase;
                    color: var(--accent-gold);
                    font-weight: 700;
                }
                .info-text h3 {
                    margin: 0;
                    font-size: 1.5rem;
                    color: white;
                    font-family: var(--font-heading);
                    text-transform: uppercase;
                    letter-spacing: 1px;
                }
                .action-btn {
                    width: 40px;
                    height: 40px;
                    border-radius: 50%;
                    background: rgba(255,255,255,0.05);
                    border: 1px solid rgba(255,255,255,0.1);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                    transition: all 0.3s ease;
                }
                .premium-card:hover .action-btn {
                    background: white;
                    color: black;
                    transform: translateX(5px);
                }
                
                @media (max-width: 1024px) {
                    .premium-card {
                        grid-column: span 6 !important;
                    }
                }
                @media (max-width: 768px) {
                    .premium-card {
                        grid-column: span 12 !important;
                        min-height: 400px !important;
                    }
                }
            `}</style>
        </motion.div>
    );
}
