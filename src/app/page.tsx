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

  useEffect(() => {
    if (images.length > 1) {
      const interval = setInterval(() => {
        setCurrentIdx((prev) => (prev + 1) % images.length);
      }, 4000); // 4 segundos por diapositiva
      return () => clearInterval(interval);
    }
  }, [images.length]);

  return (
    <motion.div
      layoutId={block.id}
      initial={{ opacity: 0, scale: 0.9 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      style={{
        gridColumn: `${block.col} / span ${spanW}`,
        gridRow: `${block.row} / span ${spanH}`,
        zIndex: block.zIndex || 1,
        position: 'relative',
        background: block.gradient
          ? `linear-gradient(135deg, ${block.bgColor}, ${block.bgColor}dd)`
          : (block.bgColor || '#111'),
        borderRadius: block.isCircle ? '50%' : (block.borderRadius || '32px'),
        aspectRatio: block.isCircle ? '1/1' : 'auto',
        boxShadow: shadowStyles[block.shadow as keyof typeof shadowStyles] || shadowStyles.none,
        backdropFilter: block.blur ? `blur(${block.blur})` : 'none',
        overflow: 'hidden',
        display: 'flex', flexDirection: 'column',
        justifyContent: 'center', alignItems: 'center',
        padding: isText ? '40px' : '0',
        border: designMode ? '2px solid #00d4bd' : (block.borderColor ? `1px solid ${block.borderColor}` : 'none'),
        cursor: block.link ? 'pointer' : 'default'
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
        <div style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
          <AnimatePresence mode="wait">
            <motion.img
              key={`${block.id}-${currentIdx}`}
              initial={{ opacity: 0, scale: 1.1 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 1.2, ease: "easeInOut" }}
              src={assets[block.id] || images[currentIdx] || 'https://via.placeholder.com/800x600?text=Ecomoving'}
              style={{
                width: '100%', height: '100%', objectFit: 'cover',
                opacity: block.type === 'both' ? 0.4 : 1,
                zIndex: 1
              }}
              alt={block.label}
            />
          </AnimatePresence>
        </div>
      )}

      {isText && (
        <div style={{
          zIndex: 2, color: block.textColor || '#fff',
          textAlign: block.textAlign || 'center',
          fontSize: block.fontSize || '1.4rem',
          fontWeight: 800, width: '100%',
          textShadow: '0 2px 15px rgba(0,0,0,0.5)',
          writingMode: block.writingMode || 'horizontal-tb',
          transform: block.writingMode && block.writingMode !== 'horizontal-tb' ? 'rotate(180deg)' : 'none',
          padding: '20px'
        }}>
          {block.textContent}
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
  const [previewContent, setPreviewContent] = useState<WebContent | null>(null);
  const activeContent = previewContent || content;

  const [isEditorSEOOpen, setIsEditorSEOOpen] = useState(false);
  const [isBibliotecaOpen, setIsBibliotecaOpen] = useState(false);
  const [isCatalogHubOpen, setIsCatalogHubOpen] = useState(false);
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [designMode, setDesignMode] = useState(false);
  const [isDeploying, setIsDeploying] = useState(false);

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

  const handleComposerChange = useCallback((newSections: DynamicSection[]) => {
    setPreviewContent(prev => ({ ...(prev || content), sections: newSections }));
  }, [content]);

  const handleComposerClose = useCallback(() => {
    setIsComposerOpen(false);
    setPreviewContent(null);
  }, []);

  const [assets, setAssets] = useState<Record<string, string>>({
    hero: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?q=80&w=2013&auto=format&fit=crop',
  });

  useEffect(() => {
    const saved = localStorage.getItem('ecomoving_assets');
    if (saved) setAssets(JSON.parse(saved));
  }, []);

  const handleDrop = async (e: React.DragEvent, blockId: string) => {
    e.preventDefault();
    const url = e.dataTransfer.getData('image_url');
    if (!url) return;

    const newAssets = { ...assets, [blockId]: url };
    setAssets(newAssets);
    localStorage.setItem('ecomoving_assets', JSON.stringify(newAssets));

    const updatedSections = activeContent.sections.map(section => {
      const hasBlock = section.blocks?.some(b => b.id === blockId);
      if (!hasBlock) return section;

      return {
        ...section,
        blocks: section.blocks.map(b => b.id === blockId ? { ...b, image: url } : b)
      };
    });

    if (JSON.stringify(updatedSections) !== JSON.stringify(activeContent.sections)) {
      await updateSection('sections', updatedSections);
    }
  };

  const sections = useMemo(() => {
    const raw = activeContent.sections;
    const array = Array.isArray(raw) ? raw : (typeof raw === 'object' ? Object.values(raw) : []);

    const categoryOrder = [
      'ECOLOGICOS',
      'BOTELLAS, MUG Y TAZAS',
      'CUADERNOS, LIBRETAS Y MEMO SET',
      'MOCHILAS, BOLSOS Y MORRALES',
      'BOLÍGRAFOS',
      'ACCESORIOS'
    ];

    return [...array].sort((a: any, b: any) => {
      const indexA = categoryOrder.findIndex(cat => (a.title1 || a.title || '').toUpperCase().includes(cat));
      const indexB = categoryOrder.findIndex(cat => (b.title1 || b.title || '').toUpperCase().includes(cat));

      if (indexA !== -1 && indexB !== -1) return indexA - indexB;
      if (indexA !== -1) return -1;
      if (indexB !== -1) return 1;

      return (a.order || 0) - (b.order || 0);
    });
  }, [activeContent.sections]);

  const renderDynamicSection = (section: any) => {
    const sectionAccent = section.blocks?.find((b: any) => b.bgColor)?.bgColor || section.titleColor || '#00d4bd';

    return (
      <section key={section.id} id={section.id} style={{ background: section.bgColor || '#000', padding: '120px 0', overflow: 'hidden' }}>
        <div className='container'>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8 }}
            style={{ marginBottom: '80px' }}
          >
            <h2 className='editorial-title' style={{
              fontSize: section.titleSize || '4.5rem',
              fontFamily: 'var(--font-heading)',
              color: section.titleColor || 'white',
              marginBottom: '30px',
              lineHeight: 1.1,
              position: 'relative',
              display: 'inline-block'
            }}>
              {section.title1}
              <div style={{
                position: 'absolute',
                bottom: '-15px',
                left: 0,
                width: '240px',
                height: '6px',
                background: `linear-gradient(to right, ${sectionAccent}, transparent)`,
                borderRadius: '3px'
              }} />
            </h2>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(24, 1fr)', gap: '12px', marginTop: '40px' }}>
              <div style={{
                gridColumn: `${section.descCol || 1} / span ${section.descSpan || 12}`,
                display: 'flex',
                flexDirection: 'column',
                gap: '20px'
              }}>
                <p style={{
                  color: section.descColor || '#888',
                  fontSize: section.descSize || '1.2rem',
                  textAlign: section.descAlign || 'left',
                  lineHeight: 1.8,
                  transition: 'all 0.5s ease',
                  marginTop: 0
                }}>
                  {section.paragraph1}
                </p>

                {section.title2 && (
                  <h3 style={{
                    fontSize: '1.5rem',
                    color: section.titleColor || 'white',
                    marginTop: '20px',
                    marginBottom: '10px',
                    opacity: 0.9,
                    fontFamily: 'var(--font-heading)'
                  }}>
                    {section.title2}
                  </h3>
                )}

                {section.paragraph2 && (
                  <p style={{
                    fontSize: '1.1rem',
                    color: section.descColor || '#666',
                    lineHeight: 1.6,
                    textAlign: section.descAlign || 'left'
                  }}>
                    {section.paragraph2}
                  </p>
                )}
              </div>
            </div>
          </motion.div>

          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(24, 1fr)', gridAutoRows: 'minmax(75px, auto)',
            gap: '10px', position: 'relative', padding: '20px',
            minHeight: '620px', marginBottom: '80px'
          }}>
            {designMode && Array.from({ length: 192 }, (_, i) => {
              const col = (i % 24) + 1;
              const row = Math.floor(i / 24) + 1;
              return (
                <div key={`guide-${i}`} style={{
                  gridColumn: col, gridRow: row,
                  border: '1px dashed rgba(0, 212, 189, 0.15)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '8px', color: 'rgba(255,255,255,0.25)', pointerEvents: 'none',
                  minHeight: '75px'
                }}>
                  C{col}-R{row}
                </div>
              );
            })}

            {(section.blocks || []).map((block: any) => (
              <BentoBlock
                key={block.id}
                block={block}
                designMode={designMode}
                assets={assets}
                handleDrop={handleDrop}
              />
            ))}
          </div>

          <VisualGallery
            images={section.gallery}
            accentColor={sectionAccent}
          />
        </div>
      </section>
    );
  };

  if (contentLoading) return <div className='loading-screen'>ECOMOVING SPA</div>;

  if (!selectedProject) {
    return <ProjectLauncher onSelect={(p) => setSelectedProject(p)} />;
  }

  return (
    <main style={{ backgroundColor: '#050505', color: 'white', minHeight: '100vh' }}>
      <motion.div
        style={{
          position: 'fixed', top: 0, left: 0, right: 0, height: '4px',
          background: 'linear-gradient(to right, #00d4bd, #efb810)',
          transformOrigin: '0%', zIndex: 2000,
          scaleX
        }}
      />

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

      <section className='hero-premium' onDragOver={(e) => e.preventDefault()} onDrop={(e) => handleDrop(e, 'hero')} style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
          <img src={activeContent.hero.background_image || assets.hero} alt="Ecomoving" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle, transparent 20%, #000 100%)' }} />
        </div>
        <div style={{ position: 'relative', zIndex: 2, textAlign: 'center', maxWidth: '1000px', padding: '0 20px' }}>
          <motion.h1
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1 }}
            style={{ fontSize: '5rem', fontFamily: 'var(--font-heading)', lineHeight: 1, marginBottom: '20px' }}
          >
            {(activeContent.hero as any).title1 || (activeContent.hero as any).title}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.5 }}
            style={{ fontSize: '1.5rem', color: '#888', marginBottom: '40px', letterSpacing: '2px' }}
          >
            {(activeContent.hero as any).paragraph1 || (activeContent.hero as any).subtitle}
          </motion.p>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}>
            <Link href={activeContent.hero.cta_link} className='cta-luxury' style={{ display: 'inline-block', padding: '15px 40px', background: '#00d4bd', color: '#000', fontWeight: 900, borderRadius: '50px', letterSpacing: '2px', textDecoration: 'none' }}>
              {activeContent.hero.cta_text}
            </Link>
          </motion.div>
        </div>
      </section>

      {sections.map(s => renderDynamicSection(s))}

      <footer style={{ padding: '80px 0', textAlign: 'center', borderTop: '1px solid #111', background: '#000' }}>
        <div style={{ marginBottom: '20px' }}>
          <img src="https://xgdmyjzyejjmwdqkufhp.supabase.co/storage/v1/object/public/logo_ecomoving/Logo_horizontal.png" alt="Ecomoving Logo" className="logo-img-footer" />
        </div>
        <div style={{ fontSize: '0.8rem', color: '#555', letterSpacing: '4px', marginBottom: '30px' }}>CHILE &bull; SUSTENTABILIDAD &bull; DISEÑO</div>
        <div style={{ fontSize: '0.7rem', color: '#333' }}>© 2026 TODOS LOS DERECHOS RESERVADOS</div>
      </footer>

      <SectionComposer
        isOpen={isComposerOpen}
        onClose={handleComposerClose}
        content={content}
        onSave={(newSections) => {
          updateSection('sections', newSections);
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
        .nav-btn:hover { color: #00d4bd; border-color: #00d4bd; }
        .cta-luxury:hover { transform: scale(1.05); box-shadow: 0 0 30px rgba(0,212,189,0.4); }
        .loading-screen { height: 100vh; background: #000; color: #00d4bd; display: flex; align-items: center; justify-content: center; font-size: 2rem; letter-spacing: 15px; font-family: var(--font-heading); }
      `}</style>
    </main>
  );
}