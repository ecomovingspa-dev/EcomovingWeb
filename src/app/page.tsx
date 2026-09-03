'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence, useScroll, useSpring } from 'framer-motion';
import { useWebContent } from '@/hooks/useWebContent';
import PeekCarousel from '@/components/PeekCarousel';
import Link from 'next/link';
import WhatsAppButton from '@/components/WhatsAppButton';

const getVimeoId = (url: string) => {
  if (!url) return null;
  const match = url.match(/(?:vimeo\.com\/|player\.vimeo\.com\/video\/)(\d+)/);
  return match ? match[1] : null;
};

const BentoBlock = ({ block, previewMode }: {
  block: any,
  previewMode?: string
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
      const [w, h] = (block.span || '12x8').split('x').map((n: string) => parseInt(n) || 12);
      finalSpan = `48x${h}`; 
    }
  }

  const cardRef = React.useRef<HTMLDivElement>(null);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const [mSpanW, mSpanH] = (block.mSpan || `${block.mCol ? (block.span || '1x1').split('x')[0] : 48}x${(block.span || '1x1').split('x')[1] || 8}`).split('x').map((n: string) => parseInt(n) || 1);
  const [tSpanW, tSpanH] = (block.tSpan || block.span || '1x1').split('x').map((n: string) => parseInt(n) || 1);
  const images = block.gallery && block.gallery.length > 0 ? block.gallery : [block.image].filter(Boolean);
  
  const [spanW, spanH] = finalSpan.split('x').map((n: string) => parseInt(n) || 1);
  const isVideo = block.type === 'video';
  const isImage = (block.type === 'image' || block.type === 'both' || !block.type) && !isVideo;

  const shadowStyles = {
    none: 'none',
    soft: '0 10px 30px rgba(0,0,0,0.3)',
    strong: '0 20px 60px rgba(0,0,0,0.6)',
    neon: `0 0 30px ${block.bgColor}88`
  };

  const posX = block.transform_posX ?? 50;
  const posY = block.transform_posY ?? 50;
  const aspectRatio = block.transform_aspectRatio || (block.isCircle ? '1/1' : 'auto');

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  const categoryLink = useMemo(() => {
    if (block.link) return block.link;
    const title = (block.blockTitle || block.label || '').toUpperCase();
    if (title.includes('HIDRATACI')) return '/catalogo?filter=01. HIDRATACIÓN';
    if (title.includes('ESCRITURA') || title.includes('OFICINA') || title.includes('TRABAJO')) return '/catalogo?filter=02. ESPACIO DE TRABAJO';
    if (title.includes('MOVIMIENTO') || title.includes('URBANO') || title.includes('TRANSPORTE') || title.includes('VIAJE')) return '/catalogo?filter=03. MOVIMIENTO URBANO';
    if (title.includes('TECH') || title.includes('INNOVATION')) return '/catalogo?filter=04. TECH INNOVATION';
    if (title.includes('GOURMET')) return '/catalogo?filter=05. GOURMET EXPERIENCE';
    if (title.includes('PREMIUM')) return '/catalogo?filter=PREMIUM';
    return '/catalogo';
  }, [block.link, block.blockTitle, block.label]);

  return (
    <motion.div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        gridColumn: `var(--final-col) / span var(--final-span-w)`,
        gridRow: `var(--final-row) / span var(--final-span-h)`,
        '--final-col': finalCol,
        '--final-row': finalRow,
        '--final-span-w': spanW,
        '--final-span-h': spanH,
        '--t-col': block.tCol || block.col || 1,
        '--t-row': block.tRow || block.row || 1,
        '--t-span-w': tSpanW,
        '--t-span-h': tSpanH,
        '--m-col': block.mCol || 1,
        '--m-row': block.mRow || 1,
        '--m-span-w': mSpanW,
        '--m-span-h': mSpanH,
        position: 'relative',
        borderRadius: block.isCircle ? '50%' : (block.borderRadius || '16px'),
        backgroundColor: block.bgColor || 'rgba(255,255,255,0.03)',
        overflow: 'hidden',
        border: (block.borderWidth || isHovered) ? `${block.borderWidth || 1}px solid ${isHovered ? 'var(--eco-accent-primary)' : (block.borderColor || 'rgba(255,255,255,0.1)')}` : 'none',
        boxShadow: isHovered ? '0 20px 60px rgba(0,212,189,0.1)' : (shadowStyles[block.shadow as keyof typeof shadowStyles] || shadowStyles.none),
        aspectRatio: aspectRatio,
        margin: '4px',
        transition: 'all 0.4s cubic-bezier(0.19, 1, 0.22, 1)'
      } as any}
      className="bento-block-mobile"
    >
      {isHovered && !block.isCircle && (
        <div
          style={{
            position: 'absolute', inset: 0, zIndex: 10,
            pointerEvents: 'none',
            background: `radial-gradient(500px circle at ${mousePos.x}px ${mousePos.y}px, rgba(0,212,189,0.1), transparent 45%)`,
            opacity: isHovered ? 1 : 0,
            transition: 'opacity 0.3s ease'
          }}
        />
      )}

      {isImage && (
        <div style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', overflow: 'hidden' }}>
          {block.galleryAnimation === 'peek' && images.length >= 2 ? (
            <PeekCarousel images={images} mode="peek" />
          ) : block.galleryAnimation === 'full-carousel' && images.length >= 2 ? (
            <PeekCarousel images={images} mode="full" />
          ) : (
            <AnimatePresence mode="wait">
              {images[currentIdx] ? (
                <motion.img
                  key={`${block.id}-${currentIdx}`}
                  initial={{ opacity: 0, scale: 1.1 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
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
                />
              ) : null}
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

      {(block.blockTitle || block.blockParagraph || true) && (
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

          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            style={{
              marginTop: 'auto', 
              padding: '10px 24px',
              backgroundColor: isHovered ? 'white' : 'var(--eco-accent-primary)',
              color: 'black',
              fontWeight: 900,
              fontSize: '11px',
              letterSpacing: '2px',
              textTransform: 'uppercase',
              borderRadius: '2px',
              boxShadow: isHovered ? '0 10px 30px rgba(0,212,189,0.5)' : '0 4px 15px rgba(0,212,189,0.4)',
              pointerEvents: 'auto',
              cursor: 'pointer',
              transition: 'all 0.3s cubic-bezier(0.19, 1, 0.22, 1)',
              display: (block.buttonText || block.link || block.buttonSku) ? 'block' : 'none'
            }}
            onClick={(e) => {
              e.stopPropagation();
              window.location.href = categoryLink;
            }}
          >
            {block.buttonText || 'VER COLECCIÓN'}
          </motion.div>
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

  const [previewMode, setPreviewMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const { content, loading: contentLoading } = useWebContent();

  useEffect(() => {
    if (typeof window !== 'undefined') {
       const updateMode = () => {
         if (window.innerWidth < 768) setPreviewMode('mobile');
         else if (window.innerWidth < 1024) setPreviewMode('tablet');
         else setPreviewMode('desktop');
       };
       updateMode();
       window.addEventListener('resize', updateMode);
       return () => window.removeEventListener('resize', updateMode);
    }
  }, []);

  const heroContent = useMemo(() => content?.hero || { title1: 'ECOMOVING', cta_text: 'EXPLORAR', cta_link: '#' }, [content]);

  const heroImages = useMemo(() => {
    return [
      (heroContent as any).background_image,
      (heroContent as any).background_image_2,
      (heroContent as any).background_image_3
    ].filter(Boolean);
  }, [heroContent]);

  const [currentHeroSlide, setCurrentHeroSlide] = useState(0);

  useEffect(() => {
    if (heroImages.length > 1) {
      const interval = setInterval(() => {
        setCurrentHeroSlide(prev => (prev + 1) % heroImages.length);
      }, 5500); 
      return () => clearInterval(interval);
    }
  }, [heroImages.length]);

  const masterSection = useMemo(() => {
    const source = content?.sections;
    if (Array.isArray(source)) {
      return source.find(s => s.id === 'infinite_grid') || (source.length === 1 ? source[0] : null);
    } 
    return (source as any)?.['infinite_grid'] || null;
  }, [content]);

  if (contentLoading) return <div className='loading-screen'>ECOMOVING SPA</div>;

  return (
    <main style={{ backgroundColor: 'var(--eco-bg-primary)', color: 'white', minHeight: '100vh', fontFamily: 'var(--font-body)', overflowX: 'hidden' }}>
      <motion.div
        style={{
          position: 'fixed', top: 0, left: 0, right: 0, height: '4px',
          background: 'var(--eco-accent-gradient)',
          transformOrigin: '0%', zIndex: 2000,
          scaleX
        }}
      />

      <section
        style={{
          height: '100vh',
          display: 'flex',
          alignItems: (heroContent as any).text_align_v === 'top' ? 'flex-start' : (heroContent as any).text_align_v === 'bottom' ? 'flex-end' : 'center',
          justifyContent: (heroContent as any).text_align_h === 'left' ? 'flex-start' : (heroContent as any).text_align_h === 'right' ? 'flex-end' : 'center',
          position: 'relative',
          overflow: 'hidden',
          padding: '120px 50px'
        }}
      >
        {/* BRAND BADGE - SUPERIOR CORNER */}
        <div style={{
          position: 'absolute',
          top: '40px',
          left: '50px',
          right: '50px',
          zIndex: 100,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          pointerEvents: 'none'
        }}>
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '15px',
              pointerEvents: 'auto'
            }}
          >
            <img 
              src="/Logo_horizontal.png" 
              alt="Ecomoving Logo" 
              style={{ maxHeight: '35px', width: 'auto', filter: 'brightness(1.5)' }} 
            />
            <div style={{ width: '1px', height: '15px', backgroundColor: 'rgba(255,255,255,0.2)' }} />
            <span style={{ 
              fontSize: '10px', 
              fontWeight: 800, 
              letterSpacing: '3px', 
              color: 'var(--eco-accent-primary)',
              fontFamily: 'var(--eco-font-heading)',
              textTransform: 'uppercase'
            }}>
              EST. 2026
            </span>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              pointerEvents: 'auto'
            }}
          >
            <div style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              backgroundColor: 'var(--eco-accent-primary)',
              boxShadow: '0 0 10px var(--eco-accent-primary)'
            }} className="engine-pulse" />
            <span style={{ 
              fontSize: '9px', 
              fontWeight: 900, 
              letterSpacing: '2px', 
              color: 'white',
              opacity: 0.6,
              fontFamily: 'var(--eco-font-heading)',
              textTransform: 'uppercase'
            }}>
              ECOMOVING_ENGINE_LIVE
            </span>
          </motion.div>
        </div>

        <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
          <AnimatePresence mode="popLayout">
            {heroImages[currentHeroSlide] && (
              <motion.img
                key={currentHeroSlide}
                initial={{ opacity: 0, scale: 1.05 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1.5, ease: [0.4, 0, 0.2, 1] }}
                src={heroImages[currentHeroSlide]}
                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
              />
            )}
          </AnimatePresence>
          <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle, transparent 20%, rgba(0,0,0,0.8) 120%)' }} />
        </div>

        <div style={{ position: 'relative', zIndex: 2, textAlign: (heroContent as any).text_align_h || 'center', maxWidth: '1000px', width: '100%' }}>
          {(heroContent as any).title1 && (
            <motion.h1
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1 }}
              style={{ fontSize: (heroContent as any).titleSize || 'clamp(3rem, 10vw, 6rem)', fontFamily: 'var(--font-heading)', lineHeight: (heroContent as any).titleLineHeight || 1, marginBottom: '20px', textShadow: '0 4px 20px rgba(0,0,0,0.8)' }}
            >
              {(heroContent as any).title1}
            </motion.h1>
          )}
          {(heroContent as any).paragraph1 && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1, delay: 0.5 }}
              style={{ fontSize: (heroContent as any).paragraphSize || 'clamp(1.1rem, 3vw, 1.5rem)', color: '#ccc', marginBottom: '40px', letterSpacing: '2px', textShadow: '0 2px 10px rgba(0,0,0,0.9)', lineHeight: (heroContent as any).paragraphLineHeight || 1.4 }}
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

      <section style={{ position: 'relative', zIndex: 5, padding: '0', backgroundColor: masterSection?.bgColor || 'transparent' }}>
        <div 
          className="bento-grid-mobile"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(48, 1fr)',
            gridAutoRows: 'var(--eco-grid-row-size, 15px)', // Variable para control dinámico
            gap: '0px', // Gap 0 para permitir que el margin de 4px de los bloques actúe como espaciado controlado
            maxWidth: '100%',
            margin: '0 auto',
            padding: '20px' // Padding de seguridad para el lienzo
          }}
        >
          {masterSection?.blocks?.map((block: any, idx: number) => (
            <BentoBlock 
              key={block.id || idx} 
              block={block} 
              previewMode={previewMode}
            />
          ))}
        </div>
      </section>

      <style jsx global>{`
        @keyframes engine-pulse {
          0% { opacity: 0.4; transform: scale(0.95); }
          50% { opacity: 1; transform: scale(1.1); box-shadow: 0 0 15px var(--eco-accent-primary); }
          100% { opacity: 0.4; transform: scale(0.95); }
        }
        .engine-pulse {
          animation: engine-pulse 2s infinite ease-in-out;
        }

        @media (max-width: 768px) {
          .bento-grid-mobile {
            grid-template-columns: repeat(48, 1fr) !important;
            gap: 0px !important; /* Mantenemos gap 0 para precisión */
          }
          .bento-block-mobile {
            grid-column: var(--final-col) / span var(--final-span-w) !important;
            grid-row: var(--final-row) / span var(--final-span-h) !important;
            aspect-ratio: auto !important;
          }
        }

        /* RESPONSIVE INDEPENDENCE ENGINE */
        @media (min-width: 769px) and (max-width: 1024px) {
           .bento-block-mobile { 
              --final-col: var(--t-col) !important;
              --final-row: var(--t-row) !important;
              --final-span-w: var(--t-span-w) !important;
              --final-span-h: var(--t-span-h) !important;
           }
        }
        @media (max-width: 768px) {
           .bento-block-mobile { 
              --final-col: var(--m-col) !important;
              --final-row: var(--m-row) !important;
              --final-span-w: var(--m-span-w) !important;
              --final-span-h: var(--m-span-h) !important;
           }
        }
      `}</style>

      {/* --- FOOTER --- */}
      <footer style={{ padding: '80px 0', textAlign: 'center', borderTop: '1px solid #111', background: '#000', position: 'relative', zIndex: 10 }}>
        <div style={{ marginBottom: '30px' }}>
          <img 
            src="/Logo_horizontal.png" 
            alt="Ecomoving Logo" 
            style={{ maxHeight: '60px', width: 'auto', filter: 'brightness(1.2)' }} 
          />
        </div>
        
        <div style={{ display: 'flex', justifyContent: 'center', gap: '40px', marginBottom: '40px', flexWrap: 'wrap' }}>
            <a href="https://wa.me/56979587293" style={{ color: 'var(--eco-accent-primary)', textDecoration: 'none', fontSize: '0.9rem', fontWeight: 600, letterSpacing: '2px', fontFamily: 'var(--eco-font-heading)' }}>
                WHATSAPP +56 9 7958 7293
            </a>
            <span style={{ color: '#333' }}>|</span>
            <a href="mailto:ventas@ecomoving.cl" style={{ color: 'white', textDecoration: 'none', fontSize: '0.9rem', fontWeight: 600, letterSpacing: '2px', fontFamily: 'var(--eco-font-heading)' }}>
                VENTAS@ECOMOVING.CL
            </a>
            <span style={{ color: '#333' }}>|</span>
            <span style={{ color: 'white', opacity: 0.6, fontSize: '0.9rem', fontWeight: 600, letterSpacing: '2px', fontFamily: 'var(--eco-font-heading)' }}>
                SANTIAGO, CHILE
            </span>
        </div>

        <div style={{ fontSize: '0.8rem', color: '#555', letterSpacing: '4px', marginBottom: '30px', textTransform: 'uppercase' }}>CHILE &bull; SUSTENTABILIDAD &bull; DISEÑO PREMIUM</div>
        <div style={{ fontSize: '0.7rem', color: '#222' }}>© 2026 ECOMOVING SpA. TODOS LOS DERECHOS RESERVADOS</div>
      </footer>

      <WhatsAppButton phone="+56979587293" />
    </main>
  );
}