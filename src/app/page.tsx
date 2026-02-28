'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { Crop, FileText, Image as ImageIcon, Layout, Lock, Unlock, Layers, Rocket, Send, CloudUpload } from 'lucide-react';
import { motion, AnimatePresence, useScroll, useSpring } from 'framer-motion';
import { useWebContent, SectionContent, GridCell, DynamicSection, WebContent } from '@/hooks/useWebContent';
import EditorSEO from '@/components/EditorSEO';
import BibliotecaIA from '@/components/BibliotecaIA';
import CatalogHub from '@/components/CatalogHub';
import VisualGallery from '@/components/VisualGallery';
import SectionComposer from '@/components/SectionComposer';
import ProjectLauncher from '@/components/ProjectLauncher';
import ExportModal from '@/components/ExportModal';
import PremiumCollection from '@/components/PremiumLanding/PremiumCollection';

interface Project {
  id: string;
  name: string;
  repo: string;
  path: string;
  lastExport: string;
  type: 'public' | 'internal';
  status: 'online' | 'ready';
}

const BentoBlock = ({ block, designMode, assets, handleDrop }: {
  block: any,
  designMode: boolean,
  assets: any,
  handleDrop: (e: React.DragEvent, id: string) => void
}) => {
  const [currentIdx, setCurrentIdx] = useState(0);
  const images = block.gallery && block.gallery.length > 0 ? block.gallery : [block.image].filter(Boolean);
  const [spanW, spanH] = (block.span || '4x1').split('x').map((n: string) => parseInt(n) || 1);
  const isText = block.type === 'text' || block.type === 'both';
  const isImage = block.type === 'image' || block.type === 'both' || !block.type;

  const shadowStyles = {
    none: 'none',
    soft: '0 10px 30px rgba(0,0,0,0.3)',
    strong: '0 20px 60px rgba(0,0,0,0.6)',
    neon: `0 0 30px ${block.bgColor}88`
  };

  // Transformaciones Expertas Actualizadas (Zoom + Posición)
  const zoom = block.transform_zoom || 1;
  const posX = block.transform_posX ?? 50; // Default: 50% (Centro)
  const posY = block.transform_posY ?? 50; // Default: 50% (Centro)
  const aspectRatio = block.transform_aspectRatio || (block.isCircle ? '1/1' : 'auto');

  useEffect(() => {
    if (images.length > 1) {
      const interval = setInterval(() => {
        setCurrentIdx((prev) => (prev + 1) % images.length);
      }, 4000); // 4 segundos por diapositiva
      return () => clearInterval(interval);
    }
  }, [images.length]);

  // Definición dinámica de animaciones según block.galleryAnimation
  const anim = useMemo(() => {
    const type = block.galleryAnimation || 'fade';
    switch (type) {
      case 'slide-h':
        return {
          initial: { opacity: 0, x: 100 },
          animate: { opacity: 1, x: 0, scale: zoom },
          exit: { opacity: 0, x: -100 }
        };
      case 'slide-v':
        return {
          initial: { opacity: 0, y: 100 },
          animate: { opacity: 1, y: 0, scale: zoom },
          exit: { opacity: 0, y: -100 }
        };
      case 'zoom':
        return {
          initial: { opacity: 0, scale: zoom * 0.5 },
          animate: { opacity: 1, scale: zoom },
          exit: { opacity: 0, scale: zoom * 1.5 }
        };
      case 'none':
        return {
          initial: { opacity: 1, scale: zoom },
          animate: { opacity: 1, scale: zoom },
          exit: { opacity: 1, scale: zoom }
        };
      default: // fade
        return {
          initial: { opacity: 0, scale: 1.05 },
          animate: { opacity: 1, scale: zoom },
          exit: { opacity: 0, scale: 0.95 }
        };
    }
  }, [block.galleryAnimation, zoom]);

  return (
    <motion.div
      layoutId={block.id}
      style={{
        gridColumn: `${(block.col * 2) - 1} / span ${spanW * 2}`, // Escalamos a 48 columnas (2x)
        gridRow: `${(block.row * 6) - 5} / span ${spanH * 6}`,    // Escalamos a filas de 15px (6x para llegar a 90px)
        zIndex: block.zIndex || 1,
        position: 'relative',
        background: block.gradient
          ? `linear-gradient(135deg, ${block.bgColor}, ${block.bgColor}dd)`
          : (block.bgColor || '#111'),
        borderRadius: block.isCircle ? '50%' : (block.borderRadius || '12px'), // 12px según constructor.pdf
        aspectRatio: aspectRatio,
        boxShadow: shadowStyles[block.shadow as keyof typeof shadowStyles] || shadowStyles.none,
        backdropFilter: block.blur ? `blur(${block.blur})` : 'none',
        overflow: 'hidden',
        display: 'flex', flexDirection: 'column',
        justifyContent: 'center', alignItems: 'center',
        padding: isText ? '40px' : '0',
        border: designMode ? '1px solid var(--eco-accent-primary)' : (block.borderColor ? `1px solid ${block.borderColor}` : 'none'),
        cursor: block.link ? 'pointer' : 'default',
        margin: '4px', // Aire para que no se corten los bordes/curvas
        transition: 'all 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)'
      }}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => handleDrop(e, block.id)}
    >
      {designMode && (
        <div style={{ position: 'absolute', top: 10, left: 10, zIndex: 10, background: 'rgba(255,255,255,0.1)', color: 'white', fontSize: '9px', padding: '2px 6px', borderRadius: '4px', opacity: 0.5 }}>
          {block.label}
        </div>
      )}

      {isImage && (
        <div style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', overflow: 'hidden' }}>
          <AnimatePresence mode="wait">
            <motion.img
              key={`${block.id}-${currentIdx}`}
              initial={anim.initial}
              animate={anim.animate}
              exit={anim.exit}
              transition={{
                duration: 0.8,
                ease: [0.4, 0, 0.2, 1] // Curva suave profesional
              }}
              src={images[currentIdx] || assets[block.id] || 'https://via.placeholder.com/800x600?text=Ecomoving'}
              style={{
                width: '100%', height: '100%',
                objectFit: 'cover',
                // Posición dinámica controlada por el usuario (X%, Y%)
                objectPosition: `${posX}% ${posY}%`,
                opacity: block.type === 'both' ? 0.4 : 1,
                zIndex: 1,
                transition: 'object-position 0.2s ease-out' // Transición suave al arrastrar sliders
              }}
              alt={block.label}
            />
          </AnimatePresence>
        </div>
      )}

      {/* CONTEXTO EDITORIAL (Título y Párrafo flotante) */}
      {(block.blockTitle || block.blockParagraph) && (
        <div style={{
          position: 'absolute',
          top: '30px',
          left: '30px',
          right: '30px',
          bottom: '30px',
          zIndex: 20,
          pointerEvents: 'none',
          display: 'flex',
          flexDirection: 'column',
          alignItems: block.textAlign === 'center' ? 'center' : (block.textAlign === 'right' ? 'flex-end' : 'flex-start'),
          justifyContent: 'flex-start'
        }}>
          {block.blockTitle && (
            <h2 style={{
              margin: '0 0 15px 0',
              color: block.textColor || '#ffffff',
              fontSize: block.titleSize || '2rem',
              fontWeight: parseInt(block.fontWeight || '700'),
              textAlign: block.textAlign || 'left',
              textTransform: block.textTransform || 'none',
              letterSpacing: block.letterSpacing || 'normal',
              fontFamily: 'var(--eco-font-display)', // Forzamos Bebas Neue para títulos display
              textShadow: '0 4px 20px rgba(0,0,0,0.6)',
              lineHeight: 1.1,
              maxWidth: '90%'
            }}>
              {block.blockTitle}
            </h2>
          )}

          {block.blockTitle && block.blockParagraph && (
            <div style={{ width: '40px', height: '1px', backgroundColor: 'var(--eco-accent-primary)', margin: '0 0 15px 0', opacity: 0.8 }} />
          )}

          {block.blockParagraph && (
            <p style={{
              margin: 0,
              color: block.textColor ? `${block.textColor}dd` : '#cccccc',
              fontSize: '1rem',
              fontWeight: 400,
              textAlign: block.textAlign || 'left',
              lineHeight: block.lineHeight || '1.5',
              fontStyle: block.fontStyle || 'normal',
              maxWidth: '600px',
              textShadow: '0 2px 10px rgba(0,0,0,0.8)'
            }}>
              {block.blockParagraph}
            </p>
          )}
        </div>
      )}

    </motion.div>
  );
};

export default function Home() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  const { content, loading: contentLoading, refetch: refetchContent, updateSection } = useWebContent();
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  // Tools State
  const [isEditorSEOOpen, setIsEditorSEOOpen] = useState(false);
  const [isBibliotecaOpen, setIsBibliotecaOpen] = useState(false);
  const [isCatalogHubOpen, setIsCatalogHubOpen] = useState(false);
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [designMode, setDesignMode] = useState(false);
  const [isDeploying, setIsDeploying] = useState(false);

  const [previewSections, setPreviewSections] = useState<DynamicSection[] | null>(null);

  // Asset State
  const [assets, setAssets] = useState<Record<string, string>>({
    hero: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?q=80&w=2013&auto=format&fit=crop',
  });

  const handleComposerChange = useCallback((newSections: DynamicSection[]) => {
    setPreviewSections(newSections);
  }, []);

  const handleComposerClose = useCallback(() => {
    setPreviewSections(null);
    setIsComposerOpen(false);
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem('ecomoving_assets');
    if (saved) setAssets(JSON.parse(saved));
  }, []);

  const handleDeploy = async () => {
    if (!confirm('¿Estás seguro de enviar los cambios a GitHub? Esto actualizará el sitio web público.')) return;
    setIsDeploying(true);
    try {
      const res = await fetch('/api/git-sync', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        alert('¡ÉXITO! ' + data.message);
      } else {
        alert('ERROR: ' + data.error);
      }
    } catch (err) {
      alert('Error de conexión con el servidor de despliegue.');
    } finally {
      setIsDeploying(false);
    }
  };

  const handleDrop = async (e: React.DragEvent, blockId: string) => {
    e.preventDefault();
    const url = e.dataTransfer.getData('image_url');
    if (!url) return;

    const newAssets = { ...assets, [blockId]: url };
    setAssets(newAssets);
    localStorage.setItem('ecomoving_assets', JSON.stringify(newAssets));
  };


  if (contentLoading) return <div className='loading-screen'>ECOMOVING SPA</div>;

  if (!selectedProject) {
    return <ProjectLauncher onSelect={(p) => setSelectedProject(p)} />;
  }

  // Fallback seguro para Hero si content no está listo
  const heroContent = content?.hero || { title1: 'ECOMOVING', cta_text: 'EXPLORAR', cta_link: '#' };

  return (
    <main style={{ backgroundColor: '#050505', color: 'white', minHeight: '100vh', fontFamily: 'var(--font-body)' }}>
      <motion.div
        style={{
          position: 'fixed', top: 0, left: 0, right: 0, height: '4px',
          background: 'var(--eco-accent-gradient)',
          transformOrigin: '0%', zIndex: 2000,
          scaleX
        }}
      />

      {/* --- NAV MASTER --- */}
      <nav className='nav-master'>
        <div className='logo-brand'>
          <img src="https://xgdmyjzyejjmwdqkufhp.supabase.co/storage/v1/object/public/logo_ecomoving/Logo_horizontal.png" alt="Ecomoving Logo" className="logo-img" />
        </div>
        <div className='nav-actions' style={{ display: 'flex', gap: '10px' }}>
          <button onClick={() => setSelectedProject(null)} className='nav-btn' style={{ background: 'rgba(255,100,100,0.1)', color: '#ff6b6b' }}><Rocket size={16} /> SALIR</button>

          <button
            onClick={handleDeploy}
            className='nav-btn'
            style={{ background: isDeploying ? 'rgba(0, 212, 189, 0.2)' : 'rgba(255,255,255,0.05)', color: isDeploying ? '#00d4bd' : '#aaa', borderColor: isDeploying ? '#00d4bd' : 'rgba(255,255,255,0.1)' }}
            disabled={isDeploying}
          >
            <CloudUpload size={16} className={isDeploying ? 'animate-bounce' : ''} />
            {isDeploying ? 'ENVIANDO...' : 'PUBLISH'}
          </button>

          <button onClick={() => setIsCatalogHubOpen(true)} className='nav-btn'><Layout size={16} /> HUB</button>
          <button onClick={() => setIsBibliotecaOpen(true)} className='nav-btn'><ImageIcon size={16} /> IA</button>
          <button onClick={() => setIsComposerOpen(true)} className='nav-btn'><Layers size={16} /> COMPOSER</button>
          <button onClick={() => setIsEditorSEOOpen(true)} className='nav-btn'><FileText size={16} /> SEO</button>

          {selectedProject.type === 'public' && (
            <button onClick={() => setIsExportModalOpen(true)} className='nav-btn' style={{ background: 'var(--accent-gold)11', color: 'var(--accent-gold)', borderColor: 'var(--accent-gold)33' }}><Send size={16} /> PREPARAR EXPORTACIÓN</button>
          )}

          <button onClick={() => setDesignMode(!designMode)} className='nav-btn'><Crop size={16} /> {designMode ? 'VISTA FINAL' : 'DISEÑO'}</button>
        </div>
      </nav>

      {/* --- HERO SECTION --- */}
      <section
        className='hero-premium'
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => handleDrop(e, 'hero')}
        style={{
          height: '100vh',
          display: 'flex',
          alignItems: (heroContent as any).text_align_v === 'top' ? 'flex-start' : (heroContent as any).text_align_v === 'bottom' ? 'flex-end' : 'center',
          justifyContent: (heroContent as any).text_align_h === 'left' ? 'flex-start' : (heroContent as any).text_align_h === 'right' ? 'flex-end' : 'center',
          position: 'relative',
          overflow: 'hidden',
          padding: '120px 50px' // Aire extra para cuando el texto se alinea a los bordes
        }}
      >
        <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
          {/* Se usa heroContent con un fallback seguro */}
          <img src={(heroContent as any).background_image || assets.hero} alt="Ecomoving" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle, transparent 20%, rgba(0,0,0,0.8) 120%)' }} />
        </div>
        <div style={{ position: 'relative', zIndex: 2, textAlign: (heroContent as any).text_align_h || 'center', maxWidth: '1000px', width: '100%' }}>
          {(heroContent as any).title1 && (
            <motion.h1
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1 }}
              style={{ fontSize: '5rem', fontFamily: 'var(--font-heading)', lineHeight: 1, marginBottom: '20px', textShadow: '0 4px 20px rgba(0,0,0,0.8)' }}
            >
              {(heroContent as any).title1}
            </motion.h1>
          )}
          {(heroContent as any).paragraph1 && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1, delay: 0.5 }}
              style={{ fontSize: '1.5rem', color: '#ccc', marginBottom: '40px', letterSpacing: '2px', textShadow: '0 2px 10px rgba(0,0,0,0.9)' }}
            >
              {(heroContent as any).paragraph1}
            </motion.p>
          )}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}>
            <Link href={(heroContent as any).cta_link || '/catalogo'} className='cta-luxury' style={{ display: 'inline-block', padding: '15px 40px', background: 'var(--eco-accent-primary)', color: '#000', fontWeight: 900, borderRadius: '2px', letterSpacing: '2px', textDecoration: 'none', boxShadow: '0 0 20px rgba(0,212,189,0.4)' }}>
              {(heroContent as any).cta_text || 'EXPLORAR CATÁLOGO'}
            </Link>
          </motion.div>
        </div>
      </section>

      {/* --- PREMIUM COLLECTION (BENTO VIP) --- */}
      <PremiumCollection />

      {/* --- INFINITE GRID CANVAS (24 COLUMNS) --- */}
      <section id="infinite-canvas" style={{
        minHeight: '100vh',
        background: '#0a0a0a',
        position: 'relative',
        padding: '0'
      }}>
        {/* Visual Guide for 48 Cols (visible only in Design Mode) */}
        {designMode && (
          <div style={{
            position: 'absolute', inset: 0,
            display: 'grid', gridTemplateColumns: 'repeat(48, 1fr)', gap: '0',
            pointerEvents: 'none', zIndex: 9999, opacity: 0.1
          }}>
            {Array.from({ length: 48 }).map((_, i) => (
              <div key={i} style={{ borderRight: '1px solid var(--eco-accent-primary)', height: '100%' }} />
            ))}
          </div>
        )}

        {/* --- AQUÍ EMPIEZA EL LIENZO INFINITO --- */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(48, 1fr)',
          gridAutoRows: '15px', // Micro-resolución de 15px para control total
          gridAutoFlow: 'dense',
          gap: '0px',
          padding: '20px', // Aire de seguridad para bordes y curvas
          width: '100%',
          maxWidth: '100%',
          backgroundColor: 'var(--eco-bg-primary)',
          overflow: 'visible'
        }}>

          {(() => {
            // 1. Buscar la sección maestra (Soporte Live Preview)
            const source = previewSections || content?.sections;
            let masterSection: any;

            if (Array.isArray(source)) {
              masterSection = source.find(s => s.id === 'infinite_grid');
              // Fallback array único
              if (!masterSection && source.length === 1) masterSection = source[0];
            } else {
              masterSection = (source as any)?.['infinite_grid'];
              // Fallback objeto único
              if (!masterSection && source) {
                const values = Object.values(source);
                if (values.length === 1) masterSection = values[0];
              }
            }

            if (masterSection && masterSection.blocks && masterSection.blocks.length > 0) {
              return masterSection.blocks.map((block: any) => (
                <BentoBlock
                  key={block.id}
                  block={block}
                  designMode={designMode}
                  assets={assets}
                  handleDrop={(e: any) => handleDrop(e, block.id)} // Pasamos el handleDrop real
                />
              ));
            } else {
              // Placeholder si está vacío
              return (
                <div style={{
                  gridColumn: '1 / -1',
                  display: 'none' // Lo ocultamos para darle prioridad al Premium Collection
                }} />
              );
            }
          })()}

        </div>
      </section>

      {/* --- FOOTER --- */}
      <footer style={{ padding: '80px 0', textAlign: 'center', borderTop: '1px solid #111', background: '#000' }}>
        <div style={{ marginBottom: '20px' }}>
          <img src="https://xgdmyjzyejjmwdqkufhp.supabase.co/storage/v1/object/public/logo_ecomoving/Logo_horizontal.png" alt="Ecomoving Logo" className="logo-img-footer" />
        </div>
        <div style={{ fontSize: '0.8rem', color: '#555', letterSpacing: '4px', marginBottom: '30px' }}>CHILE &bull; SUSTENTABILIDAD &bull; DISEÑO</div>
        <div style={{ fontSize: '0.7rem', color: '#333' }}>© 2026 TODOS LOS DERECHOS RESERVADOS</div>
      </footer>

      {/* --- TOOLS --- */}
      <SectionComposer
        isOpen={isComposerOpen}
        onClose={handleComposerClose}
        content={content}
        onSave={(newSections) => {
          // Si estamos en modo infinito, newSections[0] es nuestra grid maestra
          if (newSections.length > 0 && newSections[0].id === 'infinite_grid') {
            // Aquí deberíamos llamar a updateSection, pero por ahora solo cerramos
            // La lógica real de guardado debe implementarse en useWebContent para soportar este modo
            updateSection('sections', newSections);
          }
          handleComposerClose();
        }}
        onChange={handleComposerChange}
      />
      <EditorSEO isOpen={isEditorSEOOpen} onClose={() => setIsEditorSEOOpen(false)} onContentUpdate={refetchContent} />
      {isBibliotecaOpen && <BibliotecaIA onClose={() => setIsBibliotecaOpen(false)} />}
      <CatalogHub isOpen={isCatalogHubOpen} onClose={() => setIsCatalogHubOpen(false)} />
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        project={selectedProject}
      />

      <style jsx global>{`
        .nav-master {
          position: fixed; top: 0; width: 100%; z-index: 1000;
          display: flex; justify-content: space-between; align-items: center;
          padding: 20px 50px; background: rgba(0,0,0,0.8); backdrop-filter: blur(15px);
          border-bottom: 1px solid rgba(255,255,255,0.05);
        }
        .logo-brand { font-family: var(--font-heading); letter-spacing: 6px; font-weight: 900; }
        .nav-btn {
          background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1);
          color: #aaa; padding: 8px 16px; border-radius: 4px; font-size: 11px;
          cursor: pointer; display: flex; align-items: center; gap: 8px; transition: 0.3s;
        }
        .nav-btn:hover { color: var(--eco-accent-primary); border-color: var(--eco-accent-primary); }
        .cta-luxury:hover { transform: scale(1.05); box-shadow: var(--eco-accent-glow); }
        .loading-screen { height: 100vh; background: var(--eco-bg-primary); color: var(--eco-accent-primary); display: flex; align-items: center; justify-content: center; font-size: 2rem; letter-spacing: 15px; font-family: var(--eco-font-display); }
      `}</style>
    </main>
  );
}