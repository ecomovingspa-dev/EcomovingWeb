'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Crop, FileText, Image as ImageIcon, Layout, X, ChevronRight, Info, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useWebContent } from '@/hooks/useWebContent';
import EditorSEO from '@/components/EditorSEO';
import BibliotecaIA from '@/components/BibliotecaIA';
import CatalogHub from '@/components/CatalogHub';
import ImageCropper from '@/components/ImageCropper';

export default function Home() {
  const { content, loading: contentLoading, refetch: refetchContent } = useWebContent();
  const [isEditorSEOOpen, setIsEditorSEOOpen] = useState(false);
  const [isBibliotecaOpen, setIsBibliotecaOpen] = useState(false);
  const [isCatalogHubOpen, setIsCatalogHubOpen] = useState(false);
  const [showGridLabels, setShowGridLabels] = useState(false);

  const [assets, setAssets] = useState({
    hero: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?q=80&w=2013&auto=format&fit=crop',
    mug_worked_1: 'https://images.unsplash.com/photo-1514228742587-6b1558fbed20?q=80&w=2070&auto=format&fit=crop',
    mug_worked_2: 'https://images.unsplash.com/photo-1517256673644-36ad11246d21?q=80&w=2070&auto=format&fit=crop',
    mug_worked_3: 'https://images.unsplash.com/photo-1572113110803-3122cdf44ca7?q=80&w=2070&auto=format&fit=crop',
    mug_worked_4: 'https://images-cdn.zecat.cl/generic_products/zu1u6mgcuun-1754672368.webp',
    mug_split_1: 'https://images-cdn.zecat.cl/generic_products/Jarro_Road_silver_Zecat_6jpg1626462668-1729448237.webp',
    mug_split_2: 'https://images-cdn.zecat.cl/generic_products/carrusel_mugbayo_5-1729448186.webp',
    mug_split_3: 'https://images-cdn.zecat.cl/generic_products/JarroChalten5-1729448898.webp',
    bottle_main: 'https://images-cdn.zecat.cl/generic_products/4BotellaWai3-1729515962.jpg',
    bottle_worked_1: 'https://images-cdn.zecat.cl/generic_products/BotellaIslandAzulTahgjpg1626461501-1729449258.webp',
    bottle_worked_2: 'https://images-cdn.zecat.cl/generic_products/BotellaTomsReUseMe13-1729443723.webp',
    scrolly1: 'https://images.unsplash.com/photo-1589118949245-7d38baf380d6?q=80&w=2070&auto=format&fit=crop',
    scrolly2: 'https://images.unsplash.com/photo-1622398925373-3f91b13f1938?q=80&w=2070&auto=format&fit=crop',
    scrolly3: 'https://images.unsplash.com/photo-1517256673644-36ad11246d21?q=80&w=2070&auto=format&fit=crop',
    bento1: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?q=80&w=2013&auto=format&fit=crop',
    bento2: 'https://images.unsplash.com/photo-1514228742587-6b1558fbed20?q=80&w=2070&auto=format&fit=crop',
    bento3: 'https://images.unsplash.com/photo-1517256673644-36ad11246d21?q=80&w=2070&auto=format&fit=crop',
    details_1: 'https://images-cdn.zecat.cl/generic_products/0uye4v7u0sh-1764623199.webp',
    details_2: 'https://images-cdn.zecat.cl/generic_products/pvsmw4maohg-1753730844.webp',
    details_3: 'https://images-cdn.zecat.cl/generic_products/0vuxbzcl3qdo-1761848436.webp'
  });

  useEffect(() => {
    const saved = localStorage.getItem('ecomoving_assets');
    if (saved) setAssets(JSON.parse(saved));
  }, []);

  const handleDrop = (e: React.DragEvent, key: string) => {
    e.preventDefault();
    const url = e.dataTransfer.getData('image_url');
    if (url) {
      const newAssets = { ...assets, [key]: url };
      setAssets(newAssets);
      localStorage.setItem('ecomoving_assets', JSON.stringify(newAssets));
    }
  };

  const renderGridInfo = (label: string) => (
    showGridLabels && (
      <div style={{
        position: 'absolute',
        top: '5px',
        left: '5px',
        background: 'rgba(0,212,189,0.8)',
        color: 'black',
        padding: '2px 8px',
        borderRadius: '2px',
        fontSize: '10px',
        fontWeight: 'bold',
        zIndex: 100,
        pointerEvents: 'none'
      }}>
        {label}
      </div>
    )
  );

  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth - 0.5) * 20;
      const y = (e.clientY / window.innerHeight - 0.5) * 20;
      setMousePos({ x, y });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  if (contentLoading) return <div className='loading-screen'>ECOMOVING...</div>;

  return (
    <main style={{ backgroundColor: '#0a0a0a' }}>
      <nav className='nav-premium'>
        <div className='nav-brand'>ECOMOVING</div>
        <div className='nav-links'>
          <button className='nav-btn-special' onClick={() => setIsCatalogHubOpen(true)}><Layout size={18} /> HUB</button>
          <button className='nav-btn-special' onClick={() => setIsBibliotecaOpen(true)}><ImageIcon size={18} /> IA</button>
          <button className='nav-btn-special' onClick={() => setIsEditorSEOOpen(true)}><FileText size={18} /> SEO</button>
          <button className='nav-btn-special' onClick={() => setShowGridLabels(!showGridLabels)}><Crop size={18} /> Rejas</button>
        </div>
      </nav>

      {/* 1. HERO - ARTE EN MOVIMIENTO */}
      <section className='hero-wrapper' onDragOver={(e) => e.preventDefault()} onDrop={(e) => handleDrop(e, 'hero')}>
        <div className='hero-bg-image-container'>
          <img src={content.hero.background_image || assets.hero} className='hero-bg-image' alt='Ecomoving Hero' />
          <div className='visual-overlay' />
        </div>
        <div className='hero-content reveal'>
          <h1 className='hero-title'>{content.hero.title}</h1>
          <p className='hero-subtitle'>{content.hero.subtitle}</p>
          <Link href='/catalogo' className='btn-turquoise'>{content.hero.cta_text}</Link>
        </div>
      </section>

      {/* 2. MANIFIESTO - REDISEÑO SPLIT */}
      <section className='section-padding container'>
        <div className='split-layout'>
          <div className='split-text reveal'>
            <span className='editorial-tag'>{content.mugs.title_2}</span>
            <h2 className='editorial-title'>EL <span className='highlight'>ORIGEN</span></h2>
            <p className='manifesto-text'>{content.mugs.description_2}</p>
          </div>
          <div className='split-grid'>
            <div className='split-item large reveal' onDragOver={(e) => e.preventDefault()} onDrop={(e) => handleDrop(e, 'mug_worked_1')}>
              {renderGridInfo('Cell 1')}
              <img src={assets.mug_worked_1} className='split-img' alt='Mug Detail' />
              <div className='split-tag'>Premium</div>
            </div>
            <div className='split-item reveal' onDragOver={(e) => e.preventDefault()} onDrop={(e) => handleDrop(e, 'mug_worked_2')}>
              {renderGridInfo('Cell 2')}
              <img src={assets.mug_worked_2} className='split-img' alt='Mug Detail' />
              <div className='split-tag'>Road</div>
            </div>
            <div className='split-item reveal' onDragOver={(e) => e.preventDefault()} onDrop={(e) => handleDrop(e, 'mug_worked_3')}>
              {renderGridInfo('Cell 3')}
              <img src={assets.mug_worked_3} className='split-img' alt='Mug Detail' />
              <div className='split-tag'>Minimal</div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. SECCIÓN MUGS - ACCORDION GALLERY */}
      <section className='section-padding' style={{ background: '#050505' }}>
        <div className='container'>
          <h2 className='editorial-title' style={{ textAlign: 'center', marginBottom: '60px' }}>COLECCIÓN <span className='highlight'>MUGS</span></h2>
          <div className='accordion-gallery'>
            <div className='accordion-item' style={{ backgroundImage: url() }} onDragOver={(e) => e.preventDefault()} onDrop={(e) => handleDrop(e, 'mug_split_1')}>
              <div className='accordion-content'>
                <div className='accordion-title'>EXECUTIVE</div>
                <div className='accordion-sub'>Diseño de Autor</div>
              </div>
            </div>
            <div className='accordion-item' style={{ backgroundImage: url() }} onDragOver={(e) => e.preventDefault()} onDrop={(e) => handleDrop(e, 'mug_split_2')}>
              <div className='accordion-content'>
                <div className='accordion-title'>MATE</div>
                <div className='accordion-sub'>Textura Sedosa</div>
              </div>
            </div>
            <div className='accordion-item' style={{ backgroundImage: url() }} onDragOver={(e) => e.preventDefault()} onDrop={(e) => handleDrop(e, 'mug_split_3')}>
              <div className='accordion-content'>
                <div className='accordion-title'>CHALTEN</div>
                <div className='accordion-sub'>Aventura Urbana</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. SECCIÓN BOTELLAS - FLUID FLOW & CINEMATIC */}
      <section className='section-padding container'>
        <div className='editorial-header' style={{ marginBottom: '80px' }}>
          <span className='editorial-tag'>CATÁLOGO 2026</span>
          <h2 className='editorial-title'>HIDRATACIÓN DE <span className='highlight'>LUJO</span></h2>
        </div>
        <div className='fluid-flow-grid'>
          <div className='flow-item tall reveal' onDragOver={(e) => e.preventDefault()} onDrop={(e) => handleDrop(e, 'bottle_main')}>
            <img src={assets.bottle_main} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt='Bottle Main' />
          </div>
          <div className='flow-item wide reveal' style={{ background: 'var(--accent-turquoise)', display: 'flex', alignItems: 'center', padding: '60px' }}>
            <h3 style={{ color: 'black', fontSize: '3rem', margin: 0 }}>FLUIDEZ<br />TÉRMICA</h3>
          </div>
          <div className='flow-item medium reveal' onDragOver={(e) => e.preventDefault()} onDrop={(e) => handleDrop(e, 'bottle_worked_1')}>
            <img src={assets.bottle_worked_1} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt='Bottle Worked' />
          </div>
          <div className='flow-item small reveal' onDragOver={(e) => e.preventDefault()} onDrop={(e) => handleDrop(e, 'bottle_worked_2')}>
            <img src={assets.bottle_worked_2} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt='Bottle Secondary' />
          </div>
        </div>
      </section>

      {/* 5. CINEMATIC SHOWCASE & SCROLLY */}
      <section className='scrolly-section'>
        <div className='sticky-visual'>
          <div className='product-stage' style={{ backgroundImage: url(), opacity: 0.8 }} />
          <div className='visual-overlay' />
        </div>
        <div className='scroll-content'>
          <div className='story-step'><div className='step-card'><span className='step-number'>01</span><h3 className='step-title'>CALIDAD</h3><p className='step-desc'>Materiales de grado alimenticio certificados.</p></div></div>
          <div className='story-step'><div className='step-card'><span className='step-number'>02</span><h3 className='step-title'>DISEÑO</h3><p className='step-desc'>Formas asimétricas que rompen lo convencional.</p></div></div>
          <div className='story-step'><div className='step-card'><span className='step-number'>03</span><h3 className='step-title'>EMPAQUE</h3><p className='step-desc'>Experiencia de unboxing premium garantizada.</p></div></div>
        </div>
      </section>

      {/* 6. BENTO GRID - SEMANTIC SEO */}
      <section className='section-padding' style={{ background: '#000' }}>
        <div className='container'>
          <h2 className='editorial-title' style={{ marginBottom: '60px' }}>ESTRATEGIA <span className='highlight'>VISUAL</span></h2>
          <div className='semantic-bento-grid'>
            <div className='bento-item col-span-8 row-span-2 reveal'>
              <img src={assets.bento1} className='bento-img' alt='Bento Detail' />
              <div className='overlay-content'><span className='editorial-tag'>DISEÑO</span><h3 className='editorial-title'>CURADURÍA</h3></div>
            </div>
            <div className='bento-item col-span-4 row-span-2 reveal' style={{ background: 'var(--accent-gold)', color: 'black', padding: '40px' }}>
              <h3 className='editorial-title' style={{ color: 'black' }}>EL<br />LUJO<br />ESTÁ<br />EN<br />EL<br />DETALLE</h3>
            </div>
            <div className='bento-item col-span-4 row-span-2 reveal'>
              <img src={assets.bento2} className='bento-img' alt='Bento Detail' />
            </div>
            <div className='bento-item col-span-8 row-span-1 reveal' style={{ background: '#111', padding: '40px', display: 'flex', alignItems: 'center' }}>
              <p style={{ fontSize: '1.5rem', color: '#888', margin: 0 }}>Innovación constante en técnicas de personalización láser y tampografía.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 7. MARQUEE DETAILS */}
      <section className='marquee-container'>
        <div className='marquee-content'>
          {[assets.details_1, assets.details_2, assets.details_3, assets.details_1, assets.details_2, assets.details_3].map((src, i) => (
            <div key={i} className='detail-card-large'>
              <img src={src} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt='Detail' />
              <div className='detail-overlay'>
                <h3 className='accordion-title' style={{ fontSize: '1.5rem' }}>Textura</h3>
                <p className='accordion-sub' style={{ border: 'none', padding: 0 }}>Ajuste Perfecto</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 8. FOOTER MINIMAL */}
      <footer className='footer-minimal'>
        <div className='reveal'>
          <h2 className='footer-brand'>ECOMOVING</h2>
          <p style={{ marginTop: '20px', color: '#666', fontSize: '0.9rem' }}>
            Santiago, Chile<br />
            contacto@ecomoving.club
          </p>
        </div>
        <div className='copyright reveal'>
          &copy; 2026 Ecomoving SPA. Todos los derechos reservados.
        </div>
      </footer>

      {/* PANELS OVERLAYS */}
      <EditorSEO isOpen={isEditorSEOOpen} onClose={() => setIsEditorSEOOpen(false)} onContentUpdate={refetchContent} />
      {isBibliotecaOpen && <BibliotecaIA onClose={() => setIsBibliotecaOpen(false)} />}
      <CatalogHub isOpen={isCatalogHubOpen} onClose={() => setIsCatalogHubOpen(false)} />
      
      <style jsx>{\`n        .nav-premium { display: flex; justify-content: space-between; align-items: center; padding: 20px 60px; background: rgba(0,0,0,0.8); backdrop-filter: blur(20px); border-bottom: 1px solid rgba(255,255,255,0.05); position: fixed; top: 0; width: 100%; z-index: 1000; }
        .nav-links { display: flex; gap: 20px; }
        .nav-btn-special { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.1); color: #888; padding: 10px 20px; border-radius: 4px; font-size: 12px; font-weight: 800; cursor: pointer; display: flex; alignItems: center; gap: 8px; transition: all 0.3s; }
        .nav-btn-special:hover { color: var(--accent-turquoise); border-color: var(--accent-turquoise); background: rgba(0,212,189,0.05); }
        .loading-screen { height: 100vh; display: flex; alignItems: center; justifyContent: center; color: var(--accent-gold); font-family: var(--font-heading); font-size: 2rem; letter-spacing: 12px; }
        .accordion-gallery { display: flex; gap: 10px; height: 600px; width: 100%; }
        .accordion-item { flex: 1; background-size: cover; background-position: center; transition: all 0.8s cubic-bezier(0.2, 0.8, 0.2, 1); cursor: pointer; position: relative; overflow: hidden; border-radius: 8px; filter: grayscale(1) brightness(0.6); }
        .accordion-item:hover { flex: 4; filter: grayscale(0) brightness(1); }
        .accordion-content { position: absolute; bottom: 40px; left: 40px; opacity: 0; transform: translateY(20px); transition: all 0.5s ease 0.2s; }
        .accordion-item:hover .accordion-content { opacity: 1; transform: translateY(0); }
      \}</style>
    </main>
  );
}