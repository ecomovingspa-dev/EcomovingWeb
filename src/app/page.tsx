'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Crop, FileText, Image as ImageIcon, Layout, Lock, Unlock, Layers } from 'lucide-react';
import { motion } from 'framer-motion';
import { useWebContent, SectionContent, GridCell } from '@/hooks/useWebContent';
import EditorSEO from '@/components/EditorSEO';
import BibliotecaIA from '@/components/BibliotecaIA';
import CatalogHub from '@/components/CatalogHub';
import VisualGallery from '@/components/VisualGallery';

import SectionComposer from '@/components/SectionComposer';

export default function Home() {
  const { content, loading: contentLoading, refetch: refetchContent, updateSection } = useWebContent();
  const [isEditorSEOOpen, setIsEditorSEOOpen] = useState(false);
  const [isBibliotecaOpen, setIsBibliotecaOpen] = useState(false);
  const [isCatalogHubOpen, setIsCatalogHubOpen] = useState(false);
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const [designMode, setDesignMode] = useState(false);

  const handleComposerSave = async (newContent: any) => {
    // El Composer envía el objeto WebContent completo con las secciones actualizadas
    const success = await updateSection('sections' as any, newContent.sections);
    if (success) {
      setIsComposerOpen(false);
      refetchContent();
    }
  };
  const [lockedCells, setLockedCells] = useState<Record<string, boolean>>({});

  const [assets, setAssets] = useState<Record<string, string>>({
    hero: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?q=80&w=2013&auto=format&fit=crop',
  });

  useEffect(() => {
    const saved = localStorage.getItem('ecomoving_assets');
    if (saved) setAssets(JSON.parse(saved));
    const savedLocked = localStorage.getItem('ecomoving_locked');
    if (savedLocked) setLockedCells(JSON.parse(savedLocked));
  }, []);

  const toggleLock = (key: string) => {
    const newLocked = { ...lockedCells, [key]: !lockedCells[key] };
    setLockedCells(newLocked);
    localStorage.setItem('ecomoving_locked', JSON.stringify(newLocked));
  };

  const handleDrop = (e: React.DragEvent, key: string) => {
    e.preventDefault();
    if (lockedCells[key]) return;
    const url = e.dataTransfer.getData('image_url');
    if (url) {
      const newAssets = { ...assets, [key]: url };
      setAssets(newAssets);
      localStorage.setItem('ecomoving_assets', JSON.stringify(newAssets));
    }
  };

  // Renderizado de Sección Dinámica 12x5
  const renderDynamicSection = (section: any) => (
    <section key={section.id} style={{ background: section.bgColor || '#000', padding: '100px 0', overflow: 'hidden' }}>
      <div className='container'>
        {/* Cabecera Editorial Estandardizada */}
        <div style={{ marginBottom: '60px' }}>
          <span className='editorial-tag' style={{ color: 'var(--accent-gold)', display: 'block', fontSize: '0.8rem', letterSpacing: '4px', textTransform: 'uppercase', marginBottom: '15px', fontWeight: 600 }}>
            {section.subtitle || 'COLECCIÓN'}
          </span>
          <h2 className='editorial-title' style={{ fontSize: '3.5rem', fontFamily: 'var(--font-heading)', color: 'white', marginBottom: '20px', lineHeight: 1.1 }}>
            {section.title}
          </h2>
          <p style={{ color: '#888', fontSize: '1.2rem', maxWidth: '800px', lineHeight: 1.8, marginBottom: '40px' }}>
            {section.description}
          </p>

          {/* Área Secundaria (Título 2 y Descripción 2) */}
          {(section.title_2 || section.description_2) && (
            <div style={{ marginTop: '40px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '40px', maxWidth: '600px' }}>
              {section.title_2 && (
                <h3 style={{ fontSize: '1.5rem', color: 'white', marginBottom: '15px', fontFamily: 'var(--font-heading)' }}>
                  {section.title_2}
                </h3>
              )}
              {section.description_2 && (
                <p style={{ color: '#666', fontSize: '1rem', lineHeight: 1.6 }}>
                  {section.description_2}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Grilla Maestro 12x5 */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(12, 1fr)',
          gridAutoRows: '150px',
          gap: '10px',
          position: 'relative',
          padding: '20px',
          border: designMode ? '1px solid rgba(0,212,189,0.1)' : 'none',
          minHeight: '750px'
        }}>
          {/* Grilla Guía Visual (Coordinate System) */}
          {designMode && Array.from({ length: 60 }, (_, i) => {
            const col = (i % 12) + 1;
            const row = Math.floor(i / 12) + 1;
            return (
              <div key={`guide-${i}`} style={{
                border: '1px solid rgba(0,212,189,0.05)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '8px', color: 'rgba(0,212,189,0.2)', fontFamily: 'monospace'
              }}>
                C{col}-R{row}
              </div>
            );
          })}

          {/* Bloques de la Sección */}
          {(Array.isArray(section.blocks) ? section.blocks : [])
            .map((block: any) => {
              const [spanW, spanH] = block.span.split('x').map((n: string) => parseInt(n) || 1);
              const isText = block.type === 'text' || block.type === 'both';
              const isImage = block.type === 'image' || block.type === 'both' || !block.type;

              return (
                <div
                  key={block.id}
                  style={{
                    gridColumn: `${block.col} / span ${spanW}`,
                    gridRow: `${block.row} / span ${spanH}`,
                    zIndex: block.zIndex || 1,
                    position: 'relative',
                    border: designMode ? '2px solid var(--accent-turquoise)' : 'none',
                    background: block.bgColor || '#111',
                    overflow: 'hidden',
                    transition: 'all 0.3s ease',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    padding: isText ? '40px' : '0'
                  }}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => handleDrop(e, block.id)}
                >
                  {designMode && (
                    <div style={{ position: 'absolute', top: 5, left: 5, zIndex: 10, background: 'rgba(0,212,189,0.8)', color: 'black', fontSize: '10px', padding: '2px 5px', fontWeight: 'bold' }}>
                      {block.label} (Z:{block.zIndex})
                    </div>
                  )}

                  {isImage && (
                    <img
                      src={assets[block.id] || block.image || 'https://via.placeholder.com/600x400?text=Ecomoving+Item'}
                      style={{
                        position: isText ? 'absolute' : 'relative',
                        inset: 0,
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        opacity: block.type === 'both' ? 0.4 : 1,
                        zIndex: 1
                      }}
                      alt={block.label}
                    />
                  )}

                  {isText && (
                    <div style={{
                      zIndex: 2,
                      color: block.textColor || '#fff',
                      textAlign: 'center',
                      fontSize: '1.25rem',
                      fontWeight: 700,
                      lineHeight: 1.4,
                      wordBreak: 'break-word',
                      textShadow: block.type === 'both' ? '0 2px 10px rgba(0,0,0,0.8)' : 'none'
                    }}>
                      {block.textContent}
                    </div>
                  )}
                </div>
              );
            })}
        </div>
      </div>
    </section>
  );

  // Utilidad para asegurar que las secciones siempre sean un array válido
  const getSafeSections = (data: any) => {
    if (!data) return [];
    if (Array.isArray(data)) return data;
    if (typeof data === 'object') return Object.values(data);
    return [];
  };

  if (contentLoading) return <div className='loading-screen'>ECOMOVING...</div>;

  return (
    <main style={{ backgroundColor: '#0a0a0a' }}>
      <nav className='nav-premium'>
        <div className='nav-brand'>ECOMOVING</div>
        <div className='nav-links'>
          <button className='nav-btn-special' onClick={() => setIsCatalogHubOpen(true)}><Layout size={18} /> HUB</button>
          <button className='nav-btn-special' onClick={() => setIsBibliotecaOpen(true)}><ImageIcon size={18} /> IA</button>
          <button className='nav-btn-special' onClick={() => setIsEditorSEOOpen(true)}><FileText size={18} /> SEO</button>
          <button className='nav-btn-special' onClick={() => setDesignMode(!designMode)}><Crop size={18} /> {designMode ? 'VISTA FINAL' : 'DISEÑO'}</button>
          <button className='nav-btn-special' onClick={() => setIsComposerOpen(true)}><Layers size={18} /> COMPOSER</button>
        </div>
      </nav>

      {/* 1. HERO */}
      <section className='hero-wrapper' onDragOver={(e) => e.preventDefault()} onDrop={(e) => handleDrop(e, 'hero')}>
        <div className='hero-bg-image-container'>
          <img src={content.hero.background_image || assets.hero} className='hero-bg-image' alt='Ecomoving Hero' />
          <div className='visual-overlay' />
        </div>
        <div className='hero-content reveal'>
          <h1 className='hero-title'>{content.hero.title}</h1>
          <p className='hero-subtitle'>{content.hero.subtitle}</p>
          <Link href={content.hero.cta_link} className='btn-turquoise'>{content.hero.cta_text}</Link>
        </div>
      </section>

      {/* 2. SECCIONES DINÁMICAS */}
      {getSafeSections(content.sections)
        .sort((a, b) => (a.order || 0) - (b.order || 0))
        .map(section => renderDynamicSection(section))}

      {/* 8. FOOTER */}
      <footer className='footer-minimal'>
        <div className='reveal'>
          <h2 className='footer-brand'>ECOMOVING</h2>
          <p style={{ marginTop: '20px', color: '#666', fontSize: '0.9rem', letterSpacing: '2px' }}>
            SANTIAGO, CHILE<br />
            CONTACTO@ECOMOVING.CLUB
          </p>
        </div>
        <div className='copyright reveal'>
          &copy; 2026 ECOMOVING SPA. TODOS LOS DERECHOS RESERVADOS.
        </div>
      </footer>

      {/* PANELS OVERLAYS */}
      <EditorSEO isOpen={isEditorSEOOpen} onClose={() => setIsEditorSEOOpen(false)} onContentUpdate={refetchContent} />
      {isBibliotecaOpen && <BibliotecaIA onClose={() => setIsBibliotecaOpen(false)} />}
      <CatalogHub isOpen={isCatalogHubOpen} onClose={() => setIsCatalogHubOpen(false)} />
      <SectionComposer
        isOpen={isComposerOpen}
        onClose={() => setIsComposerOpen(false)}
        content={content}
        onSave={handleComposerSave}
      />

      <style jsx>{`
        .nav-premium {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px 60px;
          background: rgba(10,10,10,0.85);
          backdrop-filter: blur(20px);
          border-bottom: 1px solid rgba(255,255,255,0.05);
          position: fixed;
          top: 0;
          width: 100%;
          z-index: 1000;
        }
        .nav-brand {
          font-family: var(--font-heading);
          font-size: 1.5rem;
          letter-spacing: 5px;
          color: white;
        }
        .nav-links { display: flex; gap: 15px; }
        .nav-btn-special {
          background: rgba(255,255,255,0.02);
          border: 1px solid rgba(255,255,255,0.08);
          color: #888;
          padding: 10px 18px;
          border-radius: 4px;
          font-size: 11px;
          font-weight: 900;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
          transition: all 0.3s;
          letter-spacing: 2px;
        }
        .nav-btn-special:hover {
          color: var(--accent-turquoise);
          border-color: var(--accent-turquoise);
          background: rgba(0,212,189,0.05);
          transform: translateY(-2px);
        }
        .loading-screen {
          height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--accent-gold);
          font-family: var(--font-heading);
          font-size: 2rem;
          letter-spacing: 12px;
          background: #000;
        }
        .visual-overlay {
          position: absolute;
          inset: 0;
          background: radial-gradient(circle at center, transparent 0%, rgba(0,0,0,0.4) 100%);
          pointer-events: none;
        }
        /* --- Sección Header --- */
        .section-header {
          margin-bottom: 50px;
        }
        .section-desc {
          color: #888;
          font-size: 1.1rem;
          max-width: 700px;
          line-height: 1.8;
          margin-top: 15px;
        }
        /* --- Grilla de Diseño 12×3 --- */
        .section-design-grid {
          display: grid;
          grid-template-columns: repeat(12, 1fr);
          grid-template-rows: repeat(3, 200px);
          gap: 0;
          width: 100%;
        }
        .design-cell {
          position: relative;
          min-height: 200px;
          border: 1px solid transparent;
          transition: all 0.3s ease;
          overflow: hidden;
        }
        /* --- Modo Diseño Activo --- */
        .design-active .design-cell {
          border: 1px solid rgba(0, 212, 189, 0.25);
          background: rgba(0, 212, 189, 0.02);
        }
        .design-active .design-cell:hover {
          border-color: var(--accent-turquoise);
          background: rgba(0, 212, 189, 0.08);
          box-shadow: inset 0 0 30px rgba(0, 212, 189, 0.1);
        }
        .cell-coord {
          position: absolute;
          top: 4px;
          left: 4px;
          background: rgba(0, 212, 189, 0.85);
          color: #000;
          font-size: 9px;
          font-weight: 900;
          padding: 2px 6px;
          border-radius: 2px;
          z-index: 10;
          pointer-events: none;
          letter-spacing: 1px;
          font-family: monospace;
        }
      `}</style>
    </main>
  );
}