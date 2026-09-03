'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { Crop, FileText, Image as ImageIcon, Layout, Lock, Unlock, Layers, Rocket, Send, CloudUpload, Monitor, Tablet, Smartphone, ShieldCheck, Save, Plus, Edit2, Trash2 } from 'lucide-react';
import { motion, AnimatePresence, useScroll, useSpring } from 'framer-motion';
import { useWebContent, SectionContent, GridCell, DynamicSection, WebContent } from '@/hooks/useWebContent';
import EditorSEO from '@/components/EditorSEO';
import BibliotecaIA from '@/components/BibliotecaIA';
import CatalogHub from '@/components/CatalogHub';
import VisualGallery from '@/components/VisualGallery';
import SectionComposer from '@/components/SectionComposer';
import ProjectLauncher from '@/components/ProjectLauncher';
import ExportModal from '@/components/ExportModal';
import BlockInspector from '@/components/BlockInspector';
import PeekCarousel from '@/components/PeekCarousel';


interface Project {
  id: string;
  name: string;
  repo: string;
  path: string;
  lastExport: string;
  type: 'public' | 'internal' | 'client';
  status: 'online' | 'ready' | 'draft';
}

const getVimeoId = (url: string) => {
  if (!url) return null;
  const match = url.match(/(?:vimeo\.com\/|player\.vimeo\.com\/video\/)(\d+)/);
  return match ? match[1] : null;
};

const resolveImageUrl = (img: string, projectPath?: string) => {
  if (!img) return '';
  if (img.startsWith('http://') || img.startsWith('https://') || img.startsWith('data:')) {
    return img;
  }
  if (projectPath && img.startsWith('/')) {
    if (img.startsWith('/api/local-asset')) return img;
    const normalizedPath = projectPath.replace(/\\/g, '/');
    return `/api/local-asset?path=${encodeURIComponent(normalizedPath + '/public' + img)}`;
  }
  return img;
};

const BentoBlock = ({ block, designMode, assets, handleDrop, entryIndex, onClick, isSelected, previewMode, projectPath }: {
  block: any,
  designMode: boolean,
  assets: any,
  handleDrop: (e: React.DragEvent, id: string) => void,
  entryIndex: number,
  onClick?: () => void,
  isSelected?: boolean,
  previewMode?: string,
  projectPath?: string
}) => {
  const currentMode = previewMode || 'desktop';
  let finalCol = block.col || 1;
  let finalRow = block.row || 1;
  let finalSpan = block.span || '1x1';

  if (currentMode === 'tablet') {
    if (block.tCol !== undefined) finalCol = block.tCol;
    if (block.tRow !== undefined) finalRow = block.tRow;
    if (block.tSpan !== undefined) finalSpan = block.tSpan;
  } else if (currentMode === 'mobile') {
    if (block.mCol !== undefined) finalCol = block.mCol;
    if (block.mRow !== undefined) finalRow = block.mRow;
    if (block.mSpan !== undefined) {
      finalSpan = block.mSpan;
    } else {
      // Si no hay mSpan, adaptamos el span de escritorio (usualmente 12) a 48 por defecto
      const [w, h] = (block.span || '12x8').split('x').map((n: string) => parseInt(n) || 12);
      finalSpan = `48x${h}`; // Por defecto full width en móvil si no se ha configurado
    }
  }

  const cardRef = React.useRef<HTMLDivElement>(null);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  // ── PRIORIDAD: override manual (drag) > gallery del bloque > imagen del bloque ──
  const [mSpanW, mSpanH] = (block.mSpan || `${block.mCol ? (block.span || '1x1').split('x')[0] : 48}x${(block.span || '1x1').split('x')[1] || 8}`).split('x').map((n: string) => parseInt(n) || 1);
  const [tSpanW, tSpanH] = (block.tSpan || block.span || '1x1').split('x').map((n: string) => parseInt(n) || 1);
  const baseImages = block.gallery && block.gallery.length > 0 ? block.gallery : [block.image].filter(Boolean);
  // En modo 'peek', la galería tiene prioridad: el localStorage override es una sola imagen
  // y rompería el carrusel. Solo se aplica el override en modos de slideshow normales.
  const isPeek = ['peek', 'full-carousel'].includes(block.galleryAnimation || '') && baseImages.length >= 2;
  // Bugfix: ensure we actually have valid image URLs. If a block has NO images defined, fallback to a placeholder if design mode, else empty array.
  const validImages = baseImages.map((img: string) => img?.trim()).filter(Boolean);
  let images = (!isPeek && assets[block.id]) ? [assets[block.id]] : validImages;
  
  // Resolve relative paths for local development preview
  images = images.map((img: string) => resolveImageUrl(img, projectPath));
  
  if (images.length === 0) {
      images = designMode ? [] : [];
  }
  const [spanW, spanH] = finalSpan.split('x').map((n: string) => parseInt(n) || 1);
  const isVideo = block.type === 'video';
  const isText = block.type === 'text' || block.type === 'both';
  const isImage = (block.type === 'image' || block.type === 'both' || !block.type) && !isVideo;

  const shadowStyles = {
    none: 'none',
    soft: '0 10px 30px rgba(0,0,0,0.3)',
    strong: '0 20px 60px rgba(0,0,0,0.6)',
    neon: `0 0 30px ${block.bgColor}88`
  };

  const zoom = block.transform_zoom || 1;
  const posX = block.transform_posX ?? 50;
  const posY = block.transform_posY ?? 50;
  const aspectRatio = block.transform_aspectRatio || (block.isCircle ? '1/1' : 'auto');

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  useEffect(() => {
    if (images.length > 1) {
      const interval = setInterval(() => {
        setCurrentIdx((prev) => (prev + 1) % images.length);
      }, 4000);
      return () => clearInterval(interval);
    }
  }, [images.length]);

  const anim = useMemo(() => {
    const type = block.galleryAnimation || 'fade';
    const targetScale = isHovered ? zoom * 1.06 : zoom;

    switch (type) {
      case 'slide-h':
        return { initial: { opacity: 0, x: '100%' }, animate: { opacity: 1, x: 0, scale: targetScale }, exit: { opacity: 0, x: '-100%' } };
      case 'slide-v':
        return { initial: { opacity: 0, y: '100%' }, animate: { opacity: 1, y: 0, scale: targetScale }, exit: { opacity: 0, y: '-100%' } };
      case 'zoom':
        return { initial: { opacity: 0, scale: targetScale * 0.5 }, animate: { opacity: 1, scale: targetScale }, exit: { opacity: 0, scale: targetScale * 1.5 } };
      case 'none':
        return { initial: { opacity: 1, scale: targetScale }, animate: { opacity: 1, scale: targetScale }, exit: { opacity: 1, scale: targetScale } };
      case 'crossfade':
        return { initial: { opacity: 0, scale: targetScale }, animate: { opacity: 1, scale: targetScale }, exit: { opacity: 0, scale: targetScale } };
      default:
        // fade (con ligero scale/desfase)
        return { initial: { opacity: 0, scale: targetScale * 1.02 }, animate: { opacity: 1, scale: targetScale }, exit: { opacity: 0, scale: targetScale * 0.98 } };
    }
  }, [block.galleryAnimation, zoom, isHovered]);

  return (
    <motion.div
      ref={cardRef}
      layoutId={block.id}
      className="bento-block-mobile"
      // ── CONCEPTO PREMIUM: entrada escalonada desde abajo al hacer scroll ──
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ delay: (entryIndex % 6) * 0.08, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        gridColumn: `var(--final-col) / span var(--final-span-w)`,
        gridRow: `var(--final-row) / span var(--final-span-h)`,
        // CSS Variables for responsive power
        '--final-col': finalCol,
        '--final-row': finalRow,
        '--final-span-w': spanW,
        '--final-span-h': spanH,
        '--t-col': block.tCol ?? block.col ?? 1,
        '--t-row': block.tRow ?? block.row ?? 1,
        '--t-span-w': tSpanW,
        '--t-span-h': tSpanH,
        '--m-col': block.mCol ?? 1,
        '--m-row': block.mRow ?? block.row ?? 1,
        '--m-span-w': mSpanW,
        '--m-span-h': mSpanH,
        zIndex: block.zIndex || 1,
        position: 'relative',
        background: block.gradient
          ? `linear-gradient(135deg, ${block.bgColor}, ${block.bgColor}dd)`
          : (block.bgColor || '#111'),
        borderRadius: block.isCircle ? '50%' : (block.borderRadius || '12px'),
        aspectRatio: aspectRatio,
        ...({ '--mobile-aspect': `${spanW} / ${spanH}` } as any),
        boxShadow: isHovered
          ? (shadowStyles[block.shadow as keyof typeof shadowStyles] || '0 20px 60px rgba(0,0,0,0.5)')
          : (shadowStyles[block.shadow as keyof typeof shadowStyles] || shadowStyles.none),
        backdropFilter: block.blur ? `blur(${block.blur})` : 'none',
        overflow: 'hidden',
        display: 'flex', flexDirection: 'column',
        justifyContent: 'center', alignItems: 'center',
        padding: isText ? '40px' : '0',
        border: designMode
          ? isSelected
            ? '2px solid var(--eco-accent-primary)'
            : '1px dashed rgba(0,212,189,0.3)'
          : (isHovered
            ? `1px solid ${block.borderColor || 'rgba(255,255,255,0.10)'}`
            : `1px solid ${block.borderColor || 'rgba(255,255,255,0.03)'}`),
        cursor: designMode ? 'pointer' : (block.link ? 'pointer' : 'default'),
        margin: '4px',
        transition: 'border-color 0.4s ease, box-shadow 0.4s ease, transform 0.4s cubic-bezier(0.16,1,0.3,1)'
      }}
      whileHover={!designMode ? { scale: 1.012, y: -4 } : {}}
      onClick={designMode && onClick ? onClick : undefined}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => handleDrop(e, block.id)}
    >
      {/* ── CONCEPTO PREMIUM: Spotlight radial que sigue al cursor ── */}
      {!designMode && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 10,
            borderRadius: 'inherit',
            pointerEvents: 'none',
            background: `radial-gradient(500px circle at ${mousePos.x}px ${mousePos.y}px, rgba(255,255,255,0.055), transparent 45%)`,
            opacity: isHovered ? 1 : 0,
            transition: 'opacity 0.3s ease'
          }}
        />
      )}

      {designMode && block.label && (
        <div style={{ position: 'absolute', top: 10, left: 10, zIndex: 10, background: 'rgba(0,212,189,0.1)', color: '#00d4bd', fontSize: '9px', padding: '2px 6px', borderRadius: '4px', opacity: 0.8, textTransform: 'uppercase', letterSpacing: '1px' }}>
          {block.label}
        </div>
      )}

      {isImage && (
        <div style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', overflow: 'hidden' }}>
          {/* ── MODO CARRUSEL INTERACTIVO ── */}
          {block.galleryAnimation === 'peek' && images.length >= 2 ? (
            <PeekCarousel images={images} mode="peek" />
          ) : block.galleryAnimation === 'full-carousel' && images.length >= 2 ? (
            <PeekCarousel images={images} mode="full" />
          ) : (
            <AnimatePresence mode="wait">
              {images[currentIdx] ? (
                <motion.img
                  key={`${block.id}-${currentIdx}`}
                  initial={anim.initial}
                  animate={anim.animate}
                  exit={anim.exit}
                  transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
                  src={images[currentIdx]}
                  style={{
                    position: 'absolute',
                    width: '100%', height: '100%',
                    objectFit: 'cover',
                    objectPosition: `${posX}% ${posY}%`,
                    opacity: block.type === 'both' ? 0.4 : 1,
                    zIndex: 1,
                    transition: 'object-position 0.2s ease-out'
                  }}
                  alt={block.label}
                />
              ) : (
                <motion.div 
                  key="empty-image"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.02)' }}
                >
                  {designMode && <ImageIcon className="w-6 h-6 text-white/10" />}
                </motion.div>
              )}
            </AnimatePresence>
          )}
        </div>
      )}

      {isVideo && block.videoUrl && (() => {
        const vimeoId = getVimeoId(block.videoUrl);
        if (vimeoId) {
          return (
            <div style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', overflow: 'hidden', pointerEvents: 'none' }}>
              <iframe
                src={`https://player.vimeo.com/video/${vimeoId}?autoplay=1&loop=1&muted=1&background=1`}
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  width: '100%',
                  height: '100%',
                  transform: 'translate(-50%, -50%) scale(1.35)',
                  border: 'none',
                  pointerEvents: 'none'
                }}
                allow="autoplay; fullscreen"
                title="Vimeo Background Video"
              />
            </div>
          );
        } else {
          return (
            <div style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', overflow: 'hidden' }}>
              <video
                src={block.videoUrl}
                autoPlay
                loop
                muted
                playsInline
                style={{
                  position: 'absolute',
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover'
                }}
              />
            </div>
          );
        }
      })()}

      {/* CONTEXTO EDITORIAL */}
      {(block.blockTitle || block.blockParagraph || block.link) && (
        <div style={{
          position: 'absolute',
          top: block.textPadding ? (block.textPadding.includes(' ') ? block.textPadding.split(' ')[0] : block.textPadding) : '30px',
          left: block.textPadding ? (block.textPadding.includes(' ') ? block.textPadding.split(' ')[1] || block.textPadding.split(' ')[0] : block.textPadding) : '30px',
          right: block.textPadding ? (block.textPadding.includes(' ') ? block.textPadding.split(' ')[1] || block.textPadding.split(' ')[0] : block.textPadding) : '30px',
          bottom: block.textPadding ? (block.textPadding.includes(' ') ? block.textPadding.split(' ')[0] : block.textPadding) : '30px',
          zIndex: 20, pointerEvents: 'none',
          display: 'flex', flexDirection: 'column',
          alignItems: block.textAlign === 'center' ? 'center' : (block.textAlign === 'right' ? 'flex-end' : 'flex-start'),
          justifyContent: block.textVerticalAlign || 'flex-start',
          ...(block.textProtection && {
            background: block.textAlign === 'center' 
               ? 'radial-gradient(circle at center, rgba(0,0,0,0.45) 0%, transparent 80%)' 
               : `linear-gradient(${block.textAlign === 'right' ? 'to left' : 'to right'}, rgba(0,0,0,0.5) 0%, transparent 90%)`,
            borderRadius: '20px',
            padding: '20px'
          })
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
              fontFamily: 'var(--eco-font-display)',
              textShadow: block.textProtection 
                ? '0 0 20px rgba(0,0,0,0.9), 0 2px 4px rgba(0,0,0,0.8)' 
                : '0 4px 20px rgba(0,0,0,0.6)',
              lineHeight: block.titleLineHeight || 1.1,
              maxWidth: block.textMaxWidth || '90%'
            }}>
              {block.blockTitle}
            </h2>
          )}
          {block.blockTitle && block.blockParagraph && (
            <div style={{ width: '40px', height: '1px', backgroundColor: 'var(--eco-accent-primary)', margin: `0 0 ${block.textGap || '15px'} 0`, opacity: 0.8 }} />
          )}
          {block.blockParagraph && (
            <p style={{
              margin: '0 0 20px 0',
              color: block.textColor ? `${block.textColor}dd` : '#cccccc',
              fontSize: block.paragraphSize || '1rem', fontWeight: 400,
              textAlign: block.textAlign || 'left',
              lineHeight: block.lineHeight || '1.5',
              fontStyle: block.fontStyle || 'normal',
              maxWidth: block.textMaxWidth || '600px',
              textShadow: block.textProtection 
                ? '0 0 10px rgba(0,0,0,0.9), 0 1px 2px rgba(0,0,0,0.9)' 
                : '0 2px 10px rgba(0,0,0,0.8)'
            }}>
              {block.blockParagraph}
            </p>
          )}

          {/* Botón CTA inyectado por la IA */}
          {(block.link || block.buttonText) && (
            <div
              style={{
                marginTop: 'auto', // Lo empuja hacia abajo si es que hay espacio
                padding: '10px 24px',
                backgroundColor: 'var(--eco-accent-primary)',
                color: 'black',
                fontWeight: 800,
                fontSize: '12px',
                letterSpacing: '1.5px',
                textTransform: 'uppercase',
                borderRadius: '4px',
                boxShadow: '0 4px 15px rgba(0,212,189,0.4)',
                pointerEvents: 'auto', // Permite click a pesar del puntero padre
                transition: 'transform 0.2s',
              }}
              onClick={(e) => {
                if (!designMode && block.link) {
                  e.stopPropagation();
                  window.location.href = block.link;
                }
              }}
            >
              {block.buttonText || 'VER DETALLE'}
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
};

const adjustBlockHeightToImage = (block: any, imageUrl: string, previewMode: string): Promise<number | null> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = imageUrl;
    img.onload = () => {
      const aspect = img.naturalWidth / img.naturalHeight;
      if (!aspect || isNaN(aspect)) {
        resolve(null);
        return;
      }

      let currentSpan = block.span || '12x8';
      if (previewMode === 'tablet' && block.tSpan) currentSpan = block.tSpan;
      if (previewMode === 'mobile') {
        if (block.mSpan) {
          currentSpan = block.mSpan;
        } else {
          const [w, h] = (block.span || '12x8').split('x').map(Number);
          currentSpan = `48x${h}`;
        }
      }
      
      const [w, h] = currentSpan.split('x').map(Number);
      const spanW = w || 12;

      let containerWidth = 1200;
      if (previewMode === 'tablet') containerWidth = 768;
      if (previewMode === 'mobile') containerWidth = 375;
      
      const colWidth = containerWidth / 48;
      const blockWidthPx = spanW * colWidth;

      const idealHeightPx = blockWidthPx / aspect;
      const idealRows = Math.max(1, Math.round(idealHeightPx / 15));
      resolve(idealRows);
    };
    img.onerror = () => resolve(null);
  });
};

export default function Home() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  const [previewMode, setPreviewMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');

  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const { content, loading: contentLoading, refetch: refetchContent, updateSection } = useWebContent(selectedProject?.path || '', selectedProject?.id || '');
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleSaveLocal = async () => {
    if (!selectedProject) return;
    setIsSaving(true);
    setSaveStatus('idle');
    try {
      const res = await fetch('/api/local/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectPath: selectedProject.path,
          fileName: 'web_content_sync.json',
          content: content
        })
      });
      if (res.ok) {
        setSaveStatus('success');
        refetchContent();
      } else {
        setSaveStatus('error');
      }
    } catch (e) {
      setSaveStatus('error');
    }
    setIsSaving(false);
    setTimeout(() => setSaveStatus('idle'), 3000);
  };

  // Tools State
  const [isEditorSEOOpen, setIsEditorSEOOpen] = useState(false);
  const [isBibliotecaOpen, setIsBibliotecaOpen] = useState(false);
  const [isCatalogHubOpen, setIsCatalogHubOpen] = useState(false);
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [designMode, setDesignMode] = useState(false);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [currentHeroSlide, setCurrentHeroSlide] = useState(0);

  const [activeCategory, setActiveCategory] = useState('Todas');
  const [editingCategoryIdx, setEditingCategoryIdx] = useState<number | null>(null);
  const [editingCategoryVal, setEditingCategoryVal] = useState('');

  useEffect(() => {
    setActiveCategory('Todas');
  }, [selectedProject]);

  const [previewSections, setPreviewSections] = useState<DynamicSection[] | null>(null);

  const [isProduction, setIsProduction] = useState(false);
  const [isAdminBypass, setIsAdminBypass] = useState(false);

  useEffect(() => {
    // Studio mode is always admin authorized
    setIsProduction(false);
    setIsAdminBypass(true);
  }, []);

  // Asset State
  const [assets, setAssets] = useState<Record<string, string>>({
    hero: '',
  });

  const handleComposerChange = useCallback((newSections: DynamicSection[]) => {
    setPreviewSections(newSections);
  }, []);

  // ── INDEPENDENCIA AUTOMÁTICA: Popular campos responsive si faltan ──
  useEffect(() => {
    if (content?.sections && !previewSections) {
      const source = content.sections;
      const ms = source.find((s: any) => s.id === 'infinite_grid');
      if (ms && ms.blocks) {
        let changed = false;
        const newBlocks = ms.blocks.map((b: any) => {
          const updates: any = {};
          if (b.tCol === undefined) { updates.tCol = b.col || 1; changed = true; }
          if (b.tRow === undefined) { updates.tRow = b.row || 1; changed = true; }
          if (b.tSpan === undefined) { updates.tSpan = b.span || '1x1'; changed = true; }
          if (b.mCol === undefined) { updates.mCol = b.col || 1; changed = true; }
          if (b.mRow === undefined) { updates.mRow = b.row || 1; changed = true; }
          if (b.mSpan === undefined) { updates.mSpan = b.span || '1x1'; changed = true; }
          return changed ? { ...b, ...updates } : b;
        });

        if (changed) {
          const newSections = source.map((s: any) => s.id === ms.id ? { ...s, blocks: newBlocks } : s);
          setPreviewSections(newSections);
          updateSection('sections', newSections);
        }
      }
    }
  }, [content, previewSections, updateSection]);

  const handleComposerClose = useCallback(() => {
    setPreviewSections(null);
    setIsComposerOpen(false);
  }, []);

  // ── Inspector: actualizar un bloque y guardar en Supabase ──
  const handleBlockUpdate = useCallback(async (blockId: string, updates: Partial<any>) => {
    const source = previewSections || content?.sections;
    if (!Array.isArray(source)) return;

    // ── AUTOMATIC PROPORTIONAL RESIZING ──
    let finalUpdates = { ...updates };
    
    // Buscar el bloque actual en el estado
    let currentBlock: any = null;
    source.forEach((s: any) => {
      if (s.blocks) {
        const found = s.blocks.find((b: any) => b.id === blockId);
        if (found) currentBlock = found;
      }
    });

    if (currentBlock) {
      const [prevW, prevH] = (currentBlock.span || '12x8').split('x').map(Number);
      
      let manualHeightChange = false;
      if (updates.span) {
        const [newW, newH] = updates.span.split('x').map(Number);
        if (newH !== undefined && newH !== prevH) {
          manualHeightChange = true;
        }
      }
      
      const targetImage = updates.image || currentBlock.image;
      
      // Solo auto-redimensionar altura si cambia la imagen o cambia el tamaño (ancho/span).
      // Evitamos reajustar si solo se está moviendo el bloque (cambio de col o row).
      const isImageUpdating = 'image' in updates;
      const isSpanUpdating = 'span' in updates;

      if (targetImage && !manualHeightChange && (isImageUpdating || isSpanUpdating)) {
        const idealRows = await adjustBlockHeightToImage(currentBlock, targetImage, previewMode);
        if (idealRows) {
          // Obtener el ancho correspondiente al modo responsive activo
          const currentSpan = (previewMode === 'tablet' ? currentBlock.tSpan : previewMode === 'mobile' ? currentBlock.mSpan : null) || currentBlock.span || '12x8';
          const [w] = (updates.span || currentSpan).split('x');
          finalUpdates.span = `${w}x${idealRows}`;
        }
      }
    }

    // ── RESPONSIVE MAPPER ──
    const mappedUpdates: any = { ...finalUpdates };
    if (previewMode === 'tablet') {
      if ('col' in finalUpdates) { mappedUpdates.tCol = finalUpdates.col; delete mappedUpdates.col; }
      if ('row' in finalUpdates) { mappedUpdates.tRow = finalUpdates.row; delete mappedUpdates.row; }
      if ('span' in finalUpdates) { mappedUpdates.tSpan = finalUpdates.span; delete mappedUpdates.span; }
    } else if (previewMode === 'mobile') {
      if ('col' in finalUpdates) { mappedUpdates.mCol = finalUpdates.col; delete mappedUpdates.col; }
      if ('row' in finalUpdates) { mappedUpdates.mRow = finalUpdates.row; delete mappedUpdates.row; }
      if ('span' in finalUpdates) { mappedUpdates.mSpan = finalUpdates.span; delete mappedUpdates.span; }
    }

    const newSections = source.map((s: any) => {
      if (!s.blocks) return s;
      return { ...s, blocks: s.blocks.map((b: any) => b.id === blockId ? { ...b, ...mappedUpdates } : b) };
    });
    setPreviewSections(newSections);
    updateSection('sections', newSections);
  }, [previewSections, content, updateSection, previewMode]);

  const handleBlockDelete = useCallback((blockId: string) => {
    const source = previewSections || content?.sections;
    if (!Array.isArray(source)) return;
    const newSections = source.map((s: any) => ({
      ...s, blocks: (s.blocks || []).filter((b: any) => b.id !== blockId)
    }));
    setPreviewSections(newSections);
    updateSection('sections', newSections);
    setSelectedBlockId(null);
  }, [previewSections, content, updateSection]);

  // ── Agregar bloque nuevo ──
  const handleAddBlock = useCallback(() => {
    let source = previewSections || content?.sections;
    if (!Array.isArray(source)) source = [];
    
    // Buscar la sección de la grilla o crearla si está vacío
    let ms = source.find((s: any) => s.id === 'infinite_grid' || (s.title1 && s.title1.includes('LIENZO')));
    
    if (!ms && source.length === 0) {
      // Si todo está vacío, inicializamos la estructura base
      ms = { 
        id: 'infinite_grid', 
        order: 1, 
        title1: 'LIENZO INFINITO', 
        paragraph1: 'Grid maestra de 48 columnas.', 
        bgColor: '#0c0c0c', 
        blocks: [] 
      };
      source = [ms];
    } else if (!ms && source.length > 0) {
      ms = source[0];
    }

    if (!ms) return;

    const blocks = ms.blocks || [];
    const nextRow = blocks.reduce((acc: number, b: any) => {
      const [, h] = (b.span || '4x2').split('x').map(Number);
      return Math.max(acc, (b.row || 1) + (h || 2) + 3);
    }, 1);

    const newBlock = {
      id: `block_${Date.now()}`,
      label: 'NUEVO BLOQUE', 
      type: 'image' as const,
      span: '24x20', 
      col: 1, 
      row: nextRow,
      // INDEPENDENCIA AUTOMÁTICA DESDE EL INICIO
      tCol: 1,
      tRow: nextRow,
      tSpan: '48x20', // Tablet default span (full width usually better)
      mCol: 1,
      mRow: nextRow,
      mSpan: '48x15', // Mobile default span
      zIndex: 1, 
      opacity: 1, 
      borderRadius: '24px', 
      shadow: 'none' as const,
      textAlign: 'center' as const, 
      gallery: []
    };

    const newSections = source.map((s: any) =>
      s.id === ms.id ? { ...s, blocks: [...(s.blocks || []), newBlock] } : s
    );

    setPreviewSections(newSections);
    updateSection('sections', newSections);
    setSelectedBlockId(newBlock.id);
  }, [previewSections, content, updateSection]);

  // ── Duplicar bloque seleccionado ──
  const handleDuplicateBlock = useCallback((blockId: string) => {
    let source = previewSections || content?.sections;
    if (!Array.isArray(source)) return;

    let foundBlock: any = null;
    let foundSectionId: string = '';

    for (const section of source) {
      if (Array.isArray(section.blocks)) {
        const blk = section.blocks.find((b: any) => b.id === blockId);
        if (blk) {
          foundBlock = blk;
          foundSectionId = section.id;
          break;
        }
      }
    }

    if (!foundBlock || !foundSectionId) return;

    const [, h] = (foundBlock.span || '4x2').split('x').map(Number);
    const newRow = (foundBlock.row || 1) + (h || 2) + 2;

    const duplicatedBlock = {
      ...foundBlock,
      id: `block_dup_${Date.now()}`,
      label: foundBlock.label ? `${foundBlock.label} (Copia)` : 'COPIA BLOQUE',
      row: newRow,
      tRow: foundBlock.tRow !== undefined ? foundBlock.tRow + (h || 2) + 2 : newRow,
      mRow: foundBlock.mRow !== undefined ? foundBlock.mRow + (h || 2) + 2 : newRow,
    };

    const newSections = source.map((s: any) =>
      s.id === foundSectionId ? { ...s, blocks: [...(s.blocks || []), duplicatedBlock] } : s
    );

    setPreviewSections(newSections);
    updateSection('sections', newSections);
    setSelectedBlockId(duplicatedBlock.id);
  }, [previewSections, content, updateSection]);

  // ── Cambiar color de fondo del lienzo ──
  const handleCanvasBgChange = useCallback((color: string) => {
    const source = previewSections || content?.sections;
    if (!Array.isArray(source)) return;
    const newSections = source.map((s: any) =>
      s.id === 'infinite_grid' || (source.length === 1) ? { ...s, bgColor: color } : s
    );
    setPreviewSections(newSections);
    updateSection('sections', newSections);
  }, [previewSections, content, updateSection]);

  /* 
  useEffect(() => {
    const saved = localStorage.getItem('ecomoving_assets');
    if (saved) {
      try {
        setAssets(JSON.parse(saved));
      } catch {
        localStorage.removeItem('ecomoving_assets');
      }
    }
  }, []);
  */

  // ── Purga de huérfanos: cuando cambia el contenido, limpia keys obsoletas del localStorage ──
  useEffect(() => {
    const source = previewSections || content?.sections;
    let blocks: any[] | undefined;
    if (Array.isArray(source)) {
      const ms = source.find((s: any) => s.id === 'infinite_grid') || (source.length === 1 ? source[0] : null);
      blocks = ms?.blocks;
    } else if (source) {
      const ms = (source as any)['infinite_grid'] || (Object.values(source).length === 1 ? Object.values(source)[0] : null);
      blocks = (ms as any)?.blocks;
    }
    if (!blocks || blocks.length === 0) return;
    const saved = localStorage.getItem('ecomoving_assets');
    if (!saved) return;
    try {
      const stored: Record<string, string> = JSON.parse(saved);
      const validIds = new Set(['hero', ...blocks.map((b: any) => b.id)]);
      const cleaned = Object.fromEntries(Object.entries(stored).filter(([k]) => validIds.has(k)));
      if (Object.keys(cleaned).length !== Object.keys(stored).length) {
        localStorage.setItem('ecomoving_assets', JSON.stringify(cleaned));
        setAssets(cleaned);
      }
    } catch { /* safe to ignore */ }
  }, [content, previewSections]);

  const handleAddCategory = () => {
    const name = prompt('Ingrese el nombre de la nueva categoría:');
    if (!name || !name.trim()) return;
    const currentCats = content?.categories || ["Escritura Regenerativa", "Movilidad Urbana RPET", "Tecnología Circular", "Innovación en Biomateriales"];
    if (currentCats.map((c: string) => c.toLowerCase()).includes(name.trim().toLowerCase())) {
      alert('Esta categoría ya existe.');
      return;
    }
    const updated = [...currentCats, name.trim()];
    updateSection('categories', updated);
  };

  const handleRenameCategory = (idx: number, newVal: string) => {
    setEditingCategoryIdx(null);
    if (!newVal || !newVal.trim()) return;
    const currentCats = [...(content?.categories || ["Escritura Regenerativa", "Movilidad Urbana RPET", "Tecnología Circular", "Innovación en Biomateriales"])];
    const oldVal = currentCats[idx];
    if (oldVal === newVal.trim()) return;

    currentCats[idx] = newVal.trim();
    updateSection('categories', currentCats);

    // Actualizar también la categoría de los bloques asociados a este nombre
    const source = previewSections || content?.sections;
    if (Array.isArray(source)) {
      const newSections = source.map((s: any) => {
        if (!s.blocks) return s;
        return {
          ...s,
          blocks: s.blocks.map((b: any) => {
            const bCat = b.category || b.label || '';
            if (bCat.trim().toLowerCase() === oldVal.trim().toLowerCase()) {
              return { ...b, category: newVal.trim(), label: newVal.trim().toUpperCase() };
            }
            return b;
          })
        };
      });
      setPreviewSections(newSections);
      updateSection('sections', newSections);
    }

    if (activeCategory === oldVal) {
      setActiveCategory(newVal.trim());
    }
  };

  const handleDeleteCategory = (catToDelete: string) => {
    if (!confirm(`¿Está seguro de eliminar la categoría "${catToDelete}"? Los bloques asociados no se borrarán pero quedarán sin categoría asignada.`)) return;
    const currentCats = content?.categories || ["Escritura Regenerativa", "Movilidad Urbana RPET", "Tecnología Circular", "Innovación en Biomateriales"];
    const updated = currentCats.filter((c: string) => c !== catToDelete);
    updateSection('categories', updated);

    if (activeCategory === catToDelete) {
      setActiveCategory('Todas');
    }
  };

  const handleDrop = async (e: React.DragEvent, blockId: string) => {
    e.preventDefault();
    const url = e.dataTransfer.getData('image_url')?.trim();
    if (!url) return;

    // 1. Actualización Visual Inmediata (Local)
    const newAssets = { ...assets, [blockId]: url };
    setAssets(newAssets);

    // 2. Delegar a handleBlockUpdate para proporcionalidad automática
    await handleBlockUpdate(blockId, { image: url, gallery: [url] });
    console.log(`[Constructor] Imagen persistida con redimensión proporcional en bloque ${blockId}: ${url}`);
  };


  const heroContent = content?.hero || { title1: 'ECOMOVING', cta_text: 'EXPLORAR', cta_link: '#' };

  const heroImages = useMemo(() => {
    return [
      (heroContent as any).background_image || assets.hero,
      (heroContent as any).background_image_2,
      (heroContent as any).background_image_3
    ].filter(Boolean);
  }, [heroContent, assets.hero]);

  useEffect(() => {
    if (heroImages.length > 1) {
      const interval = setInterval(() => {
        setCurrentHeroSlide(prev => (prev + 1) % heroImages.length);
      }, 5500); // 5.5s transición premium
      return () => clearInterval(interval);
    }
  }, [heroImages.length]);

  if (contentLoading && selectedProject) return <div className='loading-screen'>ECOMOVING SPA</div>;

 
  if (!selectedProject && !isProduction) {
    return <ProjectLauncher onSelect={(p) => setSelectedProject(p)} />;
  }

  const showAdminUI = !isProduction || isAdminBypass;

  // 1. Buscar la sección maestra (Soporte Live Preview)
  const source = previewSections || content?.sections;
  let masterSection: any;

  if (Array.isArray(source)) {
    masterSection = source.find(s => s.id === 'infinite_grid');
    if (!masterSection && source.length === 1) masterSection = source[0];
  } else {
    masterSection = (source as any)?.['infinite_grid'];
    if (!masterSection && source) {
      const values = Object.values(source);
      if (values.length === 1) masterSection = values[0];
    }
  }

  const hasBlocks = (masterSection && masterSection.blocks && masterSection.blocks.length > 0) || designMode || !!content?.hideHero || !!content?.hero?.hidden;

  return (
    <main className={designMode ? 'design-mode' : ''} style={{ backgroundColor: 'var(--eco-bg-primary)', color: 'white', minHeight: '100vh', fontFamily: 'var(--font-body)' }}>
      <motion.div
        style={{
          position: 'fixed', top: 0, left: 0, right: 0, height: '4px',
          background: 'var(--eco-accent-gradient)',
          transformOrigin: '0%', zIndex: 2000,
          scaleX
        }}
      />

 
      {/* --- NAV MASTER (Solo Admin) --- */}
      {showAdminUI && (
        <nav className='nav-master'>
          <div className='logo-brand' style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <img 
              src={selectedProject?.id === 'tiny-puertecillo'
                ? "https://xqybckftzuupkmbwocrj.supabase.co/storage/v1/object/public/logo/logo_negro_clean.png"
                : "/Logo_horizontal.png"
              } 
              alt="Logo" 
              className="logo-img" 
              style={selectedProject?.id === 'tiny-puertecillo' ? { height: '32px', filter: 'invert(1)' } : {}}
            />
            <span style={{ 
              fontSize: '10px', 
              background: selectedProject?.id === 'tiny-puertecillo' ? '#964828' : 'var(--eco-accent-primary)', 
              color: 'white', 
              padding: '2px 8px', 
              borderRadius: '4px', 
              fontWeight: 900, 
              letterSpacing: '1px' 
            }}>
              STUDIO
            </span>
          </div>
          {selectedProject?.id === 'tiny-puertecillo' && (
            <style dangerouslySetInnerHTML={{__html: `
              .device-preview-wrapper {
                --eco-bg-primary: #fff9ef !important;
                --eco-bg-secondary: #f9f3ea !important;
                --eco-bg-subtle: #f3ede4 !important;
                --eco-accent-primary: #163428 !important;
                --eco-accent-secondary: #964828 !important;
                --eco-accent-gradient: linear-gradient(135deg, #163428 0%, #964828 100%) !important;
                --eco-text-primary: #1d1b16 !important;
                --eco-text-secondary: #5e5a51 !important;
                --font-heading: 'Noto Serif', serif !important;
                --font-body: 'Manrope', sans-serif !important;
                background-color: #fff9ef !important;
                color: #1d1b16 !important;
              }
              .device-preview-wrapper .hero-premium {
                background-color: #fff9ef !important;
                color: #1d1b16 !important;
              }
              .device-preview-wrapper .cta-luxury {
                background: #163428 !important;
                color: #fff9ef !important;
                box-shadow: 0 4px 15px rgba(22, 52, 40, 0.3) !important;
              }
            `}} />
          )}
          <div className='nav-actions' style={{ display: 'flex', gap: '10px' }}>
            <button onClick={() => setSelectedProject(null)} className='nav-btn' style={{ background: 'rgba(255,100,100,0.1)', color: '#ff6b6b' }}><Rocket size={16} /> SALIR</button>


            <button
              onClick={handleSaveLocal}
              className='nav-btn'
              style={{ 
                background: isSaving ? 'rgba(0, 212, 189, 0.2)' : saveStatus === 'success' ? 'rgba(0, 212, 189, 0.15)' : 'rgba(255,255,255,0.05)', 
                color: isSaving || saveStatus === 'success' ? '#00d4bd' : '#aaa', 
                borderColor: isSaving || saveStatus === 'success' ? '#00d4bd' : 'rgba(255,255,255,0.1)' 
              }}
              disabled={isSaving}
            >
              <ShieldCheck size={16} />
              {isSaving ? 'GUARDANDO...' : saveStatus === 'success' ? 'GUARDADO' : 'GUARDAR LOCAL'}
            </button>

            <button onClick={() => setIsCatalogHubOpen(true)} className='nav-btn'><Layout size={16} /> HUB</button>
            <button onClick={() => setIsBibliotecaOpen(true)} className='nav-btn'><ImageIcon size={16} /> BIBLIOTECA</button>
            <button onClick={() => setIsEditorSEOOpen(true)} className='nav-btn'><FileText size={16} /> SEO</button>
            
            {/* SIMULADOR DISPOSITIVOS */}
            <div style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.1)', overflow: 'hidden', marginLeft: '10px' }}>
              <button onClick={() => setPreviewMode('desktop')} className='nav-btn' style={{ border: 'none', borderRadius: 0, backgroundColor: previewMode === 'desktop' ? 'rgba(0,212,189,0.2)' : 'transparent', color: previewMode === 'desktop' ? '#00d4bd' : '#aaa' }} title="Desktop View">
                <Monitor size={16} />
              </button>
              <button onClick={() => setPreviewMode('tablet')} className='nav-btn' style={{ border: 'none', borderLeft: '1px solid rgba(255,255,255,0.1)', borderRadius: 0, backgroundColor: previewMode === 'tablet' ? 'rgba(0,212,189,0.2)' : 'transparent', color: previewMode === 'tablet' ? '#00d4bd' : '#aaa' }} title="Tablet View">
                <Tablet size={16} />
              </button>
              <button onClick={() => setPreviewMode('mobile')} className='nav-btn' style={{ border: 'none', borderLeft: '1px solid rgba(255,255,255,0.1)', borderRadius: 0, backgroundColor: previewMode === 'mobile' ? 'rgba(0,212,189,0.2)' : 'transparent', color: previewMode === 'mobile' ? '#00d4bd' : '#aaa' }} title="Mobile View">
                <Smartphone size={16} />
              </button>
            </div>

            {selectedProject?.type === 'public' && (
              <button onClick={() => setIsExportModalOpen(true)} className='nav-btn' style={{ background: 'var(--accent-gold)11', color: 'var(--accent-gold)', borderColor: 'var(--accent-gold)33', marginLeft: '10px' }}><Send size={16} /> EXPORTAR</button>
            )}
            <button onClick={() => { setDesignMode(!designMode); setSelectedBlockId(null); }} className='nav-btn'
              style={designMode ? { background: 'rgba(0,212,189,0.15)', color: '#00d4bd', borderColor: 'rgba(0,212,189,0.5)', marginLeft: '10px' } : { marginLeft: '10px' }}>
              <Crop size={16} /> {designMode ? '● DISEÑO' : 'DISEÑO'}
            </button>
          </div>
        </nav>
      )}

      <div style={{ padding: showAdminUI ? '80px 0 0 0' : '0', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', backgroundColor: previewMode !== 'desktop' ? '#111' : 'transparent' }}>
        {/* Vínculo directo de estilos CSS del proyecto activo */}
        {selectedProject?.path && (
          <link 
            rel="stylesheet" 
            href={`/api/local-asset?path=${encodeURIComponent(selectedProject.path.replace(/\\/g, '/') + '/src/index.css')}`} 
          />
        )}
        <div 
          className={`device-preview-wrapper ${previewMode} ${designMode ? 'design-active' : ''}`}
          style={{
            width: previewMode === 'desktop' ? '100%' : previewMode === 'tablet' ? '768px' : '375px',
            backgroundColor: 'var(--eco-bg-primary)',
            transition: 'width 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
            minHeight: '100vh',
            transformOrigin: 'top center',
            overflowX: 'hidden',
            boxShadow: previewMode !== 'desktop' ? '0 30px 60px rgba(0,0,0,0.8)' : 'none',
            border: previewMode === 'mobile' ? '8px solid #333' : previewMode === 'tablet' ? '4px solid #222' : 'none',
            borderRadius: previewMode === 'mobile' ? '40px' : previewMode === 'tablet' ? '20px' : '0',
            marginTop: previewMode !== 'desktop' ? '30px' : '0',
            marginBottom: previewMode !== 'desktop' ? '50px' : '0',
            position: 'relative'
          }}
        >
          {previewMode === 'mobile' && (
            <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: '120px', height: '20px', backgroundColor: '#333', borderBottomLeftRadius: '10px', borderBottomRightRadius: '10px', zIndex: 9999 }}></div>
          )}

      {/* --- HERO SECTION --- */}
      {(!content?.hideHero && !content?.hero?.hidden) && (
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
            <AnimatePresence mode="popLayout">
              {(heroImages[currentHeroSlide] || assets.hero) ? (
                <motion.img
                  key={currentHeroSlide}
                  initial={{ opacity: 0, scale: 1.05 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 1.5, ease: [0.4, 0, 0.2, 1] }}
                  src={heroImages[currentHeroSlide] || assets.hero}
                  alt="Ecomoving"
                  style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : null}
            </AnimatePresence>
            <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle, transparent 20%, rgba(0,0,0,0.8) 120%)' }} />
          </div>

          {/* Indicadores de Slide */}
          {heroImages.length > 1 && (
            <div style={{ position: 'absolute', bottom: '40px', left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: '10px', zIndex: 10 }}>
              {heroImages.map((_, idx) => (
                <div
                  key={idx}
                  onClick={() => setCurrentHeroSlide(idx)}
                  style={{
                    width: idx === currentHeroSlide ? '30px' : '8px',
                    height: '4px',
                    borderRadius: '2px',
                    background: idx === currentHeroSlide ? 'var(--eco-accent-primary)' : 'rgba(255,255,255,0.3)',
                    cursor: 'pointer',
                    transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)'
                  }}
                />
              ))}
            </div>
          )}
          <div style={{ position: 'relative', zIndex: 2, textAlign: (heroContent as any).text_align_h || 'center', maxWidth: '1000px', width: '100%' }}>
            {(heroContent as any).title1 && (
              <motion.h1
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1 }}
                style={{ fontSize: (heroContent as any).titleSize || '5rem', fontFamily: 'var(--font-heading)', lineHeight: (heroContent as any).titleLineHeight || 1, marginBottom: '20px', textShadow: '0 4px 20px rgba(0,0,0,0.8)' }}
              >
                {(heroContent as any).title1}
              </motion.h1>
            )}
            {(heroContent as any).paragraph1 && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1, delay: 0.5 }}
                style={{ fontSize: (heroContent as any).paragraphSize || '1.5rem', color: '#ccc', marginBottom: '40px', letterSpacing: '2px', textShadow: '0 2px 10px rgba(0,0,0,0.9)', lineHeight: (heroContent as any).paragraphLineHeight || 1.4 }}
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
      )}

      {/* --- MENÚ DE CATEGORÍAS (Para Brochure / Portafolio) --- */}
      {content?.isBrochure && (
        <>
          <header className="navbar" style={{
            position: 'sticky',
            top: showAdminUI ? '75px' : '0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '16px 40px',
            background: 'var(--glass-bg)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            borderBottom: '1px solid var(--glass-border)',
            zIndex: 100
          }}>
            {/* Left Side: Logo */}
            <div className="logo" style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
              <img 
                src="/Logo_horizontal.png" 
                alt="Ecomoving SpA" 
                style={{ height: '36px', width: 'auto', display: 'block' }} 
              />
            </div>

            {/* Center: Filters at the same level as the logo */}
            <nav className="filters-nav-inline" aria-label="Filtros de categoría" style={{ flexGrow: 1, display: 'flex', justifyContent: 'center', margin: '0 20px' }}>
              <div className="filters" style={{ margin: 0, padding: '4px', borderRadius: '12px', display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '4px' }}>
                {['Todas', ...(content.categories || ["Escritura Regenerativa", "Movilidad Urbana RPET", "Tecnología Circular", "Innovación en Biomateriales"])].map((cat: string, idx: number) => {
                  const isSelected = activeCategory === cat;
                  const isAll = cat === 'Todas';
                  return (
                    <div
                      key={cat}
                      className="category-btn-wrapper"
                      style={{
                        position: 'relative',
                        display: 'inline-flex',
                        alignItems: 'center',
                      }}
                    >
                      <button
                        className={`filter-btn ${isSelected ? 'active' : ''}`}
                        onClick={() => setActiveCategory(cat)}
                        style={{
                          padding: isAll ? '8px 16px' : (designMode ? '8px 34px 8px 16px' : '8px 16px'),
                          fontSize: '0.85rem',
                          fontWeight: 500,
                          borderRadius: '8px',
                          border: isSelected ? '1px solid #00d4bd' : '1px solid rgba(255,255,255,0.05)',
                          background: isSelected ? 'rgba(0, 212, 189, 0.15)' : 'rgba(255,255,255,0.02)',
                          color: isSelected ? '#00d4bd' : '#ccc',
                          cursor: 'pointer',
                          transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}
                      >
                        {cat}
                      </button>
                      
                      {!isAll && designMode && (
                        <div
                          className="category-actions"
                          style={{
                            position: 'absolute',
                            right: '6px',
                            display: 'flex',
                            gap: '2px',
                            alignItems: 'center',
                          }}
                        >
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              const val = prompt('Renombrar categoría:', cat);
                              if (val) handleRenameCategory(idx - 1, val);
                            }}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: 'rgba(255,255,255,0.4)',
                              cursor: 'pointer',
                              padding: '2px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              borderRadius: '4px',
                            }}
                            title="Renombrar"
                          >
                            <Edit2 size={10} />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteCategory(cat);
                            }}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: 'rgba(255,100,100,0.6)',
                              cursor: 'pointer',
                              padding: '2px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              borderRadius: '4px',
                            }}
                            title="Eliminar"
                          >
                            <Trash2 size={10} />
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
                {designMode && (
                  <button
                    onClick={handleAddCategory}
                    className="filter-btn-add"
                    style={{
                      padding: '8px 12px',
                      fontSize: '0.85rem',
                      borderRadius: '8px',
                      background: 'rgba(0, 212, 189, 0.1)',
                      color: '#00d4bd',
                      border: '1px dashed rgba(0, 212, 189, 0.3)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      marginLeft: '4px'
                    }}
                    title="Añadir Categoría"
                  >
                    <Plus size={12} /> Añadir
                  </button>
                )}
              </div>
            </nav>

            {/* Right Side: Theme Toggle */}
            <div className="nav-actions" style={{ flexShrink: 0 }}>
              <button className="theme-toggle" aria-label="Cambiar tema">
                ☀️
              </button>
            </div>
          </header>

          {/* Centered Title block below the navbar menu bar */}
          <div className="brochure-title-banner" style={{
            textAlign: 'center',
            padding: '40px 20px 20px 20px',
            background: 'transparent'
          }}>
            <h1 style={{
              fontSize: '2.4rem',
              fontWeight: 900,
              letterSpacing: '8px',
              textTransform: 'uppercase',
              color: 'var(--text-primary)',
              background: 'linear-gradient(135deg, var(--text-primary) 30%, var(--accent))',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              margin: 0,
              fontFamily: 'Outfit, sans-serif'
            }}>
              BROCHURE DIGITAL
            </h1>
          </div>
        </>
      )}



      {/* --- INFINITE GRID CANVAS (24 COLUMNS) --- */}
      <section id="infinite-canvas" style={{
        minHeight: hasBlocks ? '100vh' : '0', // Ocultamos la franja negra si no hay bloques
        display: hasBlocks ? 'block' : 'none', // Directamente lo desaparecemos visualmente
        background: masterSection?.bgColor || 'var(--eco-bg-primary)', // Match con el fondo de la página
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
        <div className="responsive-grid" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(48, 1fr)',
          gridAutoRows: '15px', // Micro-resolución de 15px para control total
          gridAutoFlow: 'dense',
          gap: '0px',
          padding: hasBlocks ? '20px' : '0',
          width: '100%',
          maxWidth: '100%',
          backgroundColor: 'transparent',
          backgroundImage: designMode ? `
            linear-gradient(to right, rgba(255, 255, 255, 0.05) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255, 255, 255, 0.05) 1px, transparent 1px)
          ` : 'none',
          backgroundSize: designMode ? 'calc(100% / 48) 15px' : 'auto',
          overflow: 'visible'
        }}>

           {hasBlocks && (() => {
             const rawBlocks = masterSection.blocks || [];
             const minRow = rawBlocks.length > 0 ? Math.min(...rawBlocks.map((b: any) => b.row || 1)) : 1;
             const shiftOffset = (content?.isBrochure || content?.hideHero) && minRow > 1 ? minRow - 1 : 0;

             return [...rawBlocks]
              .filter((block: any) => {
                if (!content?.isBrochure || activeCategory === 'Todas') return true;
                const blockCat = (block.category || block.label || '').trim().toLowerCase();
                const activeCat = activeCategory.trim().toLowerCase();
                return blockCat === activeCat;
              })
              .sort((a: any, b: any) => {
                if (a.row !== b.row) return (a.row || 0) - (b.row || 0);
                return (a.col || 0) - (b.col || 0);
              }).map((block: any, idx: number) => {
                const shiftedBlock = {
                  ...block,
                  row: block.row - shiftOffset
                };
                return (
                  <BentoBlock
                    key={shiftedBlock.id}
                    block={shiftedBlock}
                    designMode={designMode}
                    assets={assets}
                    entryIndex={idx}
                    isSelected={selectedBlockId === shiftedBlock.id}
                    previewMode={previewMode}
                    projectPath={selectedProject?.path}
                    onClick={() => setSelectedBlockId(selectedBlockId === shiftedBlock.id ? null : shiftedBlock.id)}
                    handleDrop={(e: any) => handleDrop(e, shiftedBlock.id)}
                  />
                );
              });
           })()}

        </div>
      </section>


      
      </div> {/* CLOSING WRAPPER DIV */}
      </div> {/* CLOSING OUTER PADDING DIV */}

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
      <EditorSEO isOpen={isEditorSEOOpen} onClose={() => setIsEditorSEOOpen(false)} onContentUpdate={(section, newContent) => {
        updateSection(section as any, newContent);
        if (section === 'sections') {
          setPreviewSections(newContent);
        }
      }} selectedBlockId={selectedBlockId} />
      {isBibliotecaOpen && (
        <BibliotecaIA 
          onClose={() => setIsBibliotecaOpen(false)} 
          projectId={selectedProject?.id}
          projectPath={selectedProject?.path}
        />
      )}
      <CatalogHub
        isOpen={isCatalogHubOpen}
        onClose={() => setIsCatalogHubOpen(false)}
        projectId={selectedProject?.id}
        projectPath={selectedProject?.path || ''}
        parentContent={content}
        parentUpdateSection={updateSection}
      />
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        project={selectedProject as any}
      />

      {/* ── INSPECTOR ÚNICO — siempre visible en design mode ── */}
      <AnimatePresence>
        {designMode && (() => {
          const source = previewSections || content?.sections;
          const ms = Array.isArray(source)
            ? (source.find((s: any) => s.id === 'infinite_grid') || (source.length === 1 ? source[0] : null))
            : null;
          const allBlocks: any[] = ms?.blocks || [];
          const inspectedBlock = selectedBlockId ? (allBlocks.find((b: any) => b.id === selectedBlockId) || null) : null;
          
          // Mapear coordenadas actuales para el Inspector si estamos en responsive
          let mappedBlock = inspectedBlock ? { ...inspectedBlock } : null;
          if (mappedBlock) {
             if (previewMode === 'tablet') {
               if (mappedBlock.tCol !== undefined) mappedBlock.col = mappedBlock.tCol;
               if (mappedBlock.tRow !== undefined) mappedBlock.row = mappedBlock.tRow;
               if (mappedBlock.tSpan !== undefined) mappedBlock.span = mappedBlock.tSpan;
             } else if (previewMode === 'mobile') {
               if (mappedBlock.mCol !== undefined) mappedBlock.col = mappedBlock.mCol;
               if (mappedBlock.mRow !== undefined) mappedBlock.row = mappedBlock.mRow;
               if (mappedBlock.mSpan !== undefined) mappedBlock.span = mappedBlock.mSpan;
             }
          }

          return (
            <BlockInspector
              block={mappedBlock}
              allBlocks={allBlocks}
              canvasBgColor={ms?.bgColor || '#000000'}
              categories={content?.categories}
              onAddCategory={handleAddCategory}
              onRenameCategory={handleRenameCategory}
              onDeleteCategory={handleDeleteCategory}
              onClose={() => setDesignMode(false)}
              onUpdate={handleBlockUpdate}
              onDelete={handleBlockDelete}
              onDuplicate={handleDuplicateBlock}
              onAddBlock={handleAddBlock}
              onSelectBlock={(id) => setSelectedBlockId(id || null)}
              onCanvasBgChange={handleCanvasBgChange}
              projectId={selectedProject?.id}
              projectPath={selectedProject?.path}
            />
          );
        })()}
      </AnimatePresence>

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

        /* --- RESPONSIVE MOBILE FIXES --- */
        @media (max-width: 768px) {
          .nav-master {
            flex-direction: column;
            padding: 15px 20px;
            gap: 15px;
            position: relative; 
          }
          .nav-actions {
            flex-wrap: wrap;
            justify-content: center;
          }
        }
        
        /* Mobile Breakpoint: Only padding and font changes */
        @media (max-width: 768px) {
           .hero-premium { padding: 120px 20px !important; }
           .hero-premium h1 { font-size: 3rem !important; }
           .hero-premium p { font-size: 1.1rem !important; }
        }

        /* Simulator Mobile: Preserve the Grid for Design */
        .device-preview-wrapper.mobile .hero-premium { padding: 80px 20px !important; }
        .device-preview-wrapper.mobile .hero-premium h1 { font-size: 2.22rem !important; }
        .device-preview-wrapper.mobile .hero-premium p { font-size: 1rem !important; }
        /* Grid is preserved as in Tablet, allowing precise editing */

        /* Simulator Tablet: Preserve the Grid in Tablet View */
        .device-preview-wrapper.tablet .hero-premium { padding: 120px 40px !important; }
        .device-preview-wrapper.tablet .hero-premium h1 { font-size: 4rem !important; }
        /* No longer unsetting grid for tablet, so design stays in place */

        /* Real Tablet: Preserve the Grid */
        @media (min-width: 769px) and (max-width: 1024px) {
           .hero-premium { padding: 120px 40px !important; }
           .hero-premium h1 { font-size: 4rem !important; }
        }

        /* RESPONSIVE INDEPENDENCE ENGINE (Auto-switch in public site) */
        @media (min-width: 769px) and (max-width: 1024px) {
           main:not(.design-mode) .bento-block-mobile { 
              --final-col: var(--t-col) !important;
              --final-row: var(--t-row) !important;
              --final-span-w: var(--t-span-w) !important;
              --final-span-h: var(--t-span-h) !important;
           }
        }
        @media (max-width: 768px) {
           main:not(.design-mode) .bento-block-mobile { 
              --final-col: var(--m-col) !important;
              --final-row: var(--m-row) !important;
              --final-span-w: var(--m-span-w) !important;
              --final-span-h: var(--m-span-h) !important;
           }
        }

        /* Simulator Sync */
        .device-preview-wrapper.tablet:not(.design-active) .bento-block-mobile {
              --final-col: var(--t-col) !important;
              --final-row: var(--t-row) !important;
              --final-span-w: var(--t-span-w) !important;
              --final-span-h: var(--t-span-h) !important;
        }
        .device-preview-wrapper.mobile:not(.design-active) .bento-block-mobile {
              --final-col: var(--m-col) !important;
              --final-row: var(--m-row) !important;
              --final-span-w: var(--m-span-w) !important;
              --final-span-h: var(--m-span-h) !important;
        }
      `}</style>
    </main>
  );
}