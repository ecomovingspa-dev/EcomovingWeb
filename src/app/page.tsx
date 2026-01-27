'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';


export default function Home() {
  const [assets, setAssets] = useState({
    hero: '/hero-image.jpg',
    // Mugs Section
    mug_split_1: '/product-03.jpg',
    mug_split_2: '/product-02.jpg',
    mug_split_3: 'https://images.unsplash.com/photo-1544724569-5f546fd6f2b5?q=80&w=1974&auto=format&fit=crop',
    mug_worked_1: 'https://images-cdn.zecat.cl/generic_products/zu1u6mgcuun-1754672368.webp',
    mug_worked_2: 'https://images-cdn.zecat.cl/generic_products/Jarro_Road_silver_Zecat_6jpg1626462668-1729448237.webp',
    mug_worked_3: 'https://images-cdn.zecat.cl/generic_products/carrusel_mugbayo_5-1729448186.webp',
    mug_worked_4: 'https://images-cdn.zecat.cl/generic_products/JarroChalten5-1729448898.webp',
    mug_worked_5: 'https://images-cdn.zecat.cl/generic_products/JarroBogotaNegro05Alta-1729448701.webp',

    // SECCIÓN BOTELLAS (REPRESENTATIVO ZECAT)
    bottle_split_1: 'https://images-cdn.zecat.cl/generic_products/BotellaAluNegraRojaLateral-1729449438.webp',
    bottle_split_2: 'https://d2xqp1jvb71b9m.cloudfront.net/generic_products/a32mg3eohoo-1751026035.webp',
    bottle_split_3: 'https://images-cdn.zecat.cl/generic_products/BotellaIslandAzulTahgjpg1626461501-1729449258.webp',
    bottle_split_4: 'https://images-cdn.zecat.cl/generic_products/BotellaRingAzul-1729449493.webp',
    bottle_worked_1: 'https://d2xqp1jvb71b9m.cloudfront.net/generic_products/skdfw5kxqld-1751982868.webp',
    bottle_worked_2: 'https://images-cdn.zecat.cl/generic_products/BotellaTomsReUseMe13-1729443723.webp',
    bottle_worked_3: 'https://images-cdn.zecat.cl/generic_products/BotellaGridGrisClaroGrisCla1-1729440942.webp',
    bottle_worked_4: 'https://d2xqp1jvb71b9m.cloudfront.net/generic_products/xfaz6of0jtq-1751661991.webp',
    bottle_worked_5: 'https://images-cdn.zecat.cl/generic_products/BotellaLikeAzulTAHG03-1729449314.webp',
    bottle_worked_6: 'https://images-cdn.zecat.cl/generic_products/2jauz2xblc3-1766517327.webp',

    // SECCIÓN CUADERNOS
    notebook_split_1: 'https://images-cdn.zecat.cl/generic_products/CuadernoRiderTahg01-1729441169.webp',
    notebook_split_2: 'https://images-cdn.zecat.cl/generic_products/CuadernoAriesGrisLateral-1729443312.webp',
    notebook_split_3: 'https://images-cdn.zecat.cl/generic_products/CuadernoPampaSpiritGrisFrent-1729448408.webp',
    notebook_worked_1: 'https://d2xqp1jvb71b9m.cloudfront.net/generic_products/h9os7lb2m7l-1752158679.webp',
    notebook_worked_2: 'https://images-cdn.zecat.cl/generic_products/SetCuadernoAnilladoYBiromeCa-1729440620.webp',
    notebook_worked_3: 'https://images-cdn.zecat.cl/generic_products/CuadernoAriesGrisLateral-1729443312.webp',

    // SECCIÓN MOCHILAS
    backpack_split_1: 'https://images-cdn.zecat.cl/generic_products/MochilaTritonNegro01-1729450371.webp',
    backpack_split_2: 'https://images-cdn.zecat.cl/generic_products/Mochila_Belfast_Tahg_Gris_Frentejpg1616781708-1729452814.webp',
    backpack_split_3: 'https://images-cdn.zecat.cl/generic_products/Mochila_Cozumel_Gris-1729450284.webp',
    backpack_worked_1: 'https://images-cdn.zecat.cl/generic_products/Mochila_Olimpo_Negra_Frentejpg1616782352-1729452445.webp',
    backpack_worked_2: 'https://images-cdn.zecat.cl/generic_products/bolso_sport_zecat_1-1729441234.webp',
    backpack_worked_3: 'https://images-cdn.zecat.cl/generic_products/Mochila_Alpine_Tahg_Azul_Frentejpg1616779313-1729452857.webp',

    // SECCIÓN BOLÍGRAFOS
    pen_split_1: 'https://images-cdn.zecat.cl/generic_products/BoligrafoGoldenMetal01-1729453255.webp',
    pen_split_2: 'https://images-cdn.zecat.cl/generic_products/Boligrafo04Verde-03jpg-1683060035.jpg',
    pen_split_3: 'https://images-cdn.zecat.cl/generic_products/jz46k9eoopk-1761250662.webp',
    pen_worked_1: 'https://images-cdn.zecat.cl/generic_products/pvsmw4maohg-1753730844.webp',
    pen_worked_2: 'https://images-cdn.zecat.cl/generic_products/0vuxbzcl3qdo-1761848436.webp',
    pen_worked_3: 'https://d2xqp1jvb71b9m.cloudfront.net/generic_products/08lp0jbujxok-1749126450.webp',

    bento4: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?q=80&w=2070&auto=format&fit=crop',
    bento5: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=1999&auto=format&fit=crop',
    bento6: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?q=80&w=1974&auto=format&fit=crop',
    bento7: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=2015&auto=format&fit=crop',
    bento8: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?q=80&w=2013&auto=format&fit=crop',
    bento9: 'https://images.unsplash.com/photo-1504933350103-e840ede978d4?q=80&w=2070&auto=format&fit=crop',

    asym_mugs: '/asym-mugs.jpg',
    asym_pen: '/asym-pen.jpg',
    asym_bottles: '/asym-bottles.jpg',
    detail_macro: 'https://images.unsplash.com/photo-1589118949245-7d38baf380d6?q=80&w=2070&auto=format&fit=crop',
    scrolly1: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?q=80&w=2026&auto=format&fit=crop',
    scrolly2: 'https://images.unsplash.com/photo-1525909002-1b05e0c869d8?q=80&w=1974&auto=format&fit=crop',
    scrolly3: 'https://images.unsplash.com/photo-1533154683836-84ea7a0bc310?q=80&w=1974&auto=format&fit=crop',
  });

  // Load from localStorage if exists
  useEffect(() => {
    const saved = localStorage.getItem('ecomoving_assets');
    if (saved) {
      setAssets(JSON.parse(saved));
    }
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

  // AI Parallax Hook
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

  const onDragOver = (e: React.DragEvent) => e.preventDefault();

  return (
    <main>
      {/* 1. Header Minimalista Flotante */}
      <nav className="nav-premium">
        <Link href="/" className="brand-logo">ECOMOVING</Link>
        <div className="nav-links hidden md:flex">
          <Link href="/catalogo" className="nav-item">Catálogo</Link>
          <Link href="#galeria" className="nav-item">Galería IA</Link>
          <Link href="#contacto" className="nav-item">Contacto</Link>
        </div>
      </nav>

      {/* 2. Hero Section - Impacto Visual */}
      <section className="hero-wrapper">
        {/* Imagen de Fondo Real */}
        <div
          className="hero-bg-image-container"
          onDragOver={onDragOver}
          onDrop={(e) => handleDrop(e, 'hero')}
        >
          <img
            src={assets.hero}
            alt="Regalos Corporativos Premium y Merchandising Personalizado"
            className="hero-bg-image"
          />
          <div className="drop-indicator">Suelta aquí para cambiar fondo</div>
        </div>

        <div className="hero-content reveal">
          <p className="hero-subtitle">Arte en Movimiento</p>
          <h1 className="hero-title">REGALOS <br /> CORPORATIVOS</h1>
          <Link href="/catalogo" className="btn-turquoise" aria-label="Ver catálogo de productos premium">
            Ver Catálogo
          </Link>
          {/* Rectángulo verde de prueba solicitado por el usuario */}
          <div style={{ width: '150px', height: '40px', backgroundColor: '#00d4bd', marginTop: '20px', borderRadius: '4px' }}></div>
        </div>
      </section>

      {/* SECCIÓN MUGS */}
      <section id="mugs" className="section-padding container">
        <div className="reveal">
          <div className="split-layout">
            <div className="split-text">
              <h2 className="hero-subtitle" style={{ fontSize: '1.5rem', marginBottom: '20px', textAlign: 'left' }}>
                Colección Mugs Premium
              </h2>
              <p className="manifesto-text">
                No solo creamos productos, diseñamos experiencias. Queremos ofrecerte piezas que cuentan historias.
                <br /><br />
                <span className="highlight">Exclusividad, vanguardia y elegancia</span> en cada detalle. Nuestra curatoría de productos base permite que tu marca se asiente sobre la mejor ingeniería material disponible.
              </p>
              <div style={{ marginTop: '40px' }}>
                <Link href="/catalogo" className="nav-item" style={{ color: 'var(--accent-turquoise)', fontWeight: 'bold' }}>
                  → Explora el catálogo digital
                </Link>
              </div>
            </div>

            <div className="split-grid">
              <div className="split-item large" onDragOver={onDragOver} onDrop={(e) => handleDrop(e, 'mug_split_1')}>
                <div className="split-tag">Retro</div>
                <img src={assets.mug_split_1} className="split-img" alt="Mug Retro" />
              </div>
              <div className="split-item" onDragOver={onDragOver} onDrop={(e) => handleDrop(e, 'mug_split_2')}>
                <div className="split-tag">Road</div>
                <img src={assets.mug_split_2} className="split-img" alt="Mug Road" />
              </div>
              <div className="split-item" onDragOver={onDragOver} onDrop={(e) => handleDrop(e, 'mug_split_3')}>
                <div className="split-tag">Bayo</div>
                <img src={assets.mug_split_3} className="split-img" alt="Mug Bayo" />
              </div>
            </div>
          </div>

          <div className="accordion-gallery">
            <div className="accordion-item" style={{ backgroundImage: `url('${assets.mug_worked_1}')` }} onDragOver={onDragOver} onDrop={(e) => handleDrop(e, 'mug_worked_1')}>
              <div className="accordion-content">
                <div className="accordion-title">CHALTEN</div>
                <div className="accordion-sub">Elegancia Térmica</div>
              </div>
            </div>
            <div className="accordion-item" style={{ backgroundImage: `url('${assets.mug_worked_2}')` }} onDragOver={onDragOver} onDrop={(e) => handleDrop(e, 'mug_worked_2')}>
              <div className="accordion-content">
                <div className="accordion-title">BOGOTA</div>
                <div className="accordion-sub">Estilo Ejecutivo</div>
              </div>
            </div>
            <div className="accordion-item" style={{ backgroundImage: `url('${assets.mug_worked_3}')` }} onDragOver={onDragOver} onDrop={(e) => handleDrop(e, 'mug_worked_3')}>
              <div className="accordion-content">
                <div className="accordion-title">ZEIT</div>
                <div className="accordion-sub">Diseño Pampa Spirit</div>
              </div>
            </div>
            <div className="accordion-item" style={{ backgroundImage: `url('${assets.mug_worked_4}')` }} onDragOver={onDragOver} onDrop={(e) => handleDrop(e, 'mug_worked_4')}>
              <div className="accordion-content">
                <div className="accordion-title">DATEN</div>
                <div className="accordion-sub">Mate & Wagner</div>
              </div>
            </div>
            <div className="accordion-item" style={{ backgroundImage: `url('${assets.mug_worked_5}')` }} onDragOver={onDragOver} onDrop={(e) => handleDrop(e, 'mug_worked_5')}>
              <div className="accordion-content">
                <div className="accordion-title">BRANCH</div>
                <div className="accordion-sub">Detalles en Bamboo</div>
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* SECCIÓN BOTELLAS - REDISEÑO 2026 MAJESTIC */}
      <section id="botellas" className="section-padding container">
        <div className="reveal">
          <div className="split-layout" style={{ gridTemplateColumns: 'minmax(300px, 4fr) 8fr', alignItems: 'flex-start' }}>
            <div className="split-text" style={{ position: 'sticky', top: '150px' }}>
              <h2 className="hero-subtitle" style={{ fontSize: '1.8rem', color: 'var(--accent-gold)', marginBottom: '30px', textAlign: 'left' }}>
                Hydratio Art 2026
              </h2>
              <p className="manifesto-text" style={{ fontSize: '1.3rem', color: '#ccc' }}>
                La ingeniería de fluidos se encuentra con la alta costura corporativa. Nuestras botellas térmicas no son solo contenedores; son declaraciones de principios.
                <br /><br />
                <span style={{ color: 'var(--accent-turquoise)', fontWeight: 'bold' }}>Pureza material y aislamiento infinito.</span>
                Cada pieza es sometida a un control de calidad que garantiza que tu marca viaje en lo más alto de la ingeniería material.
              </p>
              <div style={{ marginTop: '50px' }}>
                <Link href="/catalogo" className="btn-turquoise" style={{ padding: '18px 45px', borderRadius: '40px' }}>
                  Explora la Línea Premium
                </Link>
              </div>
            </div>

            {/* Catálogo con Fluid Flow Grid */}
            <div className="fluid-flow-grid">
              <div className="flow-item tall" onDragOver={onDragOver} onDrop={(e) => handleDrop(e, 'bottle_split_1')}>
                <img src={assets.bottle_split_1} className="split-img" alt="Botella Alu" />
                <div className="split-tag">ALU SPORT</div>
              </div>
              <div className="flow-item wide" onDragOver={onDragOver} onDrop={(e) => handleDrop(e, 'bottle_split_2')}>
                <img src={assets.bottle_split_2} className="split-img" alt="Botella Lin" />
                <div className="split-tag">LIN MATTE</div>
              </div>
              <div className="flow-item medium" onDragOver={onDragOver} onDrop={(e) => handleDrop(e, 'bottle_split_3')}>
                <img src={assets.bottle_split_3} className="split-img" alt="Botella Island" />
                <div className="split-tag">ISLAND ALUMINUM</div>
              </div>
              <div className="flow-item small" onDragOver={onDragOver} onDrop={(e) => handleDrop(e, 'bottle_split_4')}>
                <img src={assets.bottle_split_4} className="split-img" alt="Botella Ring" />
                <div className="split-tag">RING SYSTEM</div>
              </div>
            </div>
          </div>

          {/* Galería de Imágenes Trabajadas - Majestic Panorama 2026 */}
          <div style={{ marginTop: '150px', width: '100vw', marginLeft: 'calc(-50vw + 50%)', overflow: 'hidden' }}>
            <div style={{ textAlign: 'center', marginBottom: '80px' }}>
              <span style={{ letterSpacing: '12px', color: 'var(--accent-gold)', textTransform: 'uppercase', fontSize: '0.9rem', fontWeight: 'bold' }}>The Art of Hydration</span>
              <h3 style={{ fontSize: '4rem', marginTop: '20px', letterSpacing: '-2px' }}>MAJESTIC PANORAMA</h3>
            </div>

            <div className="cinematic-showcase" style={{ padding: '40px 0', minHeight: 'auto', gap: '20px', overflowX: 'auto', justifyContent: 'flex-start', paddingLeft: '5vw', paddingRight: '5vw' }}>
              <div className="cinematic-label" style={{ left: '50%', transform: 'translateX(-50%)', top: '20px', bottom: 'auto' }}>EXPOSICIÓN 2026</div>

              <div className="flow-item tall" style={{ minWidth: '350px', transform: 'none' }} onDragOver={onDragOver} onDrop={(e) => handleDrop(e, 'bottle_worked_1')}>
                <img src={assets.bottle_worked_1} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="M1" />
              </div>

              <div className="flow-item tall" style={{ minWidth: '450px', transform: 'translateY(-40px)' }} onDragOver={onDragOver} onDrop={(e) => handleDrop(e, 'bottle_worked_2')}>
                <img src={assets.bottle_worked_2} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="M2" />
              </div>

              <div className="flow-item tall" style={{ minWidth: '350px' }} onDragOver={onDragOver} onDrop={(e) => handleDrop(e, 'bottle_worked_3')}>
                <img src={assets.bottle_worked_3} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="M3" />
              </div>

              <div className="flow-item tall" style={{ minWidth: '550px', transform: 'translateY(40px)' }} onDragOver={onDragOver} onDrop={(e) => handleDrop(e, 'bottle_worked_4')}>
                <img src={assets.bottle_worked_4} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="M4" />
              </div>

              <div className="flow-item tall" style={{ minWidth: '400px', transform: 'translateY(-20px)' }} onDragOver={onDragOver} onDrop={(e) => handleDrop(e, 'bottle_worked_5')}>
                <img src={assets.bottle_worked_5} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="M5" />
              </div>

              <div className="flow-item tall" style={{ minWidth: '350px' }} onDragOver={onDragOver} onDrop={(e) => handleDrop(e, 'bottle_worked_6')}>
                <img src={assets.bottle_worked_6} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="M6" />
              </div>
            </div>
          </div>
        </div>
      </section>


      {/* SECCIÓN CUADERNOS & LIBRETAS - 2026 GLASS STACK */}
      <section id="cuadernos" className="section-padding container">
        <div className="reveal">
          <div className="split-layout">
            <div className="split-text">
              <h2 className="hero-subtitle" style={{ fontSize: '1.5rem', marginBottom: '20px', textAlign: 'left' }}>
                Escritura de Vanguardia
              </h2>
              <p className="manifesto-text">
                El pensamiento analógico potenciado por el diseño digital. Nuestras libretas y cuadernos son laboratorios de ideas con texturas que inspiran.
                <br /><br />
                <span className="highlight">Papers crafted for visionaries</span>. Cubiertas con acabados soft-touch y encuadernaciones que desafían la gravedad.
              </p>
            </div>

            <div className="split-grid">
              <div className="split-item large" onDragOver={onDragOver} onDrop={(e) => handleDrop(e, 'notebook_split_1')}>
                <div className="split-tag">Rider</div>
                <img src={assets.notebook_split_1} className="split-img" alt="Notebook Rider" />
              </div>
              <div className="split-item" onDragOver={onDragOver} onDrop={(e) => handleDrop(e, 'notebook_split_2')}>
                <div className="split-tag">Aries</div>
                <img src={assets.notebook_split_2} className="split-img" alt="Notebook Aries" />
              </div>
              <div className="split-item" onDragOver={onDragOver} onDrop={(e) => handleDrop(e, 'notebook_split_3')}>
                <div className="split-tag">Pampa</div>
                <img src={assets.notebook_split_3} className="split-img" alt="Notebook Pampa" />
              </div>
            </div>
          </div>

          <div style={{ marginTop: '100px' }}>
            <h3 style={{ textAlign: 'center', marginBottom: '40px', fontFamily: 'var(--font-heading)', color: 'var(--accent-gold)' }}>CURATED STACK</h3>
            <div className="glass-stack">
              <div className="stack-card" onDragOver={onDragOver} onDrop={(e) => handleDrop(e, 'notebook_worked_1')}>
                <img src={assets.notebook_worked_1} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              <div className="stack-card" onDragOver={onDragOver} onDrop={(e) => handleDrop(e, 'notebook_worked_2')}>
                <img src={assets.notebook_worked_2} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              <div className="stack-card" onDragOver={onDragOver} onDrop={(e) => handleDrop(e, 'notebook_worked_3')}>
                <img src={assets.notebook_worked_3} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECCIÓN MOCHILAS - 2026 INFINITE FLOW */}
      <section id="mochilas" className="section-padding container">
        <div className="reveal">
          <div className="split-layout" style={{ gridTemplateColumns: '7fr 5fr' }}>
            <div className="split-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
              <div className="split-item wide" style={{ gridColumn: 'span 2' }} onDragOver={onDragOver} onDrop={(e) => handleDrop(e, 'backpack_split_1')}>
                <div className="split-tag">Triton</div>
                <img src={assets.backpack_split_1} className="split-img" alt="Backpack Triton" />
              </div>
              <div className="split-item" onDragOver={onDragOver} onDrop={(e) => handleDrop(e, 'backpack_split_2')}>
                <div className="split-tag">Belfast</div>
                <img src={assets.backpack_split_2} className="split-img" alt="Backpack Belfast" />
              </div>
              <div className="split-item" onDragOver={onDragOver} onDrop={(e) => handleDrop(e, 'backpack_split_3')}>
                <div className="split-tag">Cozumel</div>
                <img src={assets.backpack_split_3} className="split-img" alt="Backpack Cozumel" />
              </div>
            </div>

            <div className="split-text">
              <h2 className="hero-subtitle" style={{ fontSize: '1.5rem', marginBottom: '20px', textAlign: 'left' }}>
                Mobility Ecosystems
              </h2>
              <p className="manifesto-text">
                Tu oficina, en cualquier lugar del mundo. Mochilas diseñadas para la era del nómada digital premium.
                <br /><br />
                <span className="highlight">Ergonomía y Blindaje</span>. Materiales hidrófobos y compartimentos de seguridad inteligentes.
              </p>
            </div>
          </div>

          <div style={{ marginTop: '120px', overflow: 'hidden' }}>
            <h3 style={{ textAlign: 'center', marginBottom: '60px', fontFamily: 'var(--font-heading)' }}>GALLERY IN MOTION</h3>
            <div className="marquee-auto-flow">
              {[assets.backpack_worked_1, assets.backpack_worked_2, assets.backpack_worked_3, assets.backpack_worked_1, assets.backpack_worked_2, assets.backpack_worked_3].map((img, i) => (
                <div key={i} className="flow-item tall" style={{ minWidth: '400px' }}>
                  <img src={img} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* SECCIÓN BOLÍGRAFOS - 2026 MINIMALIST RIBBON */}
      <section id="boligrafos" className="section-padding container">
        <div className="reveal">
          <div className="split-layout">
            <div className="split-text">
              <h2 className="hero-subtitle" style={{ fontSize: '1.5rem', marginBottom: '20px', textAlign: 'left' }}>
                Signature Instruments
              </h2>
              <p className="manifesto-text">
                La precisión de un reloj suizo en la palma de tu mano. Bolígrafos que deslizan sobre el papel con una suavidad magnética.
                <br /><br />
                <span className="highlight">Laser precision engineering</span>. El último detalle de una marca que no acepta menos que la perfección.
              </p>
            </div>
            <div className="split-grid">
              <div className="split-item tall" onDragOver={onDragOver} onDrop={(e) => handleDrop(e, 'pen_split_1')}>
                <div className="split-tag">Golden Metal</div>
                <img src={assets.pen_split_1} className="split-img" />
              </div>
              <div className="split-item" onDragOver={onDragOver} onDrop={(e) => handleDrop(e, 'pen_split_2')}>
                <div className="split-tag">Nature</div>
                <img src={assets.pen_split_2} className="split-img" />
              </div>
              <div className="split-item" onDragOver={onDragOver} onDrop={(e) => handleDrop(e, 'pen_split_3')}>
                <div className="split-tag">Tech</div>
                <img src={assets.pen_split_3} className="split-img" />
              </div>
            </div>
          </div>

          <div style={{ marginTop: '100px' }}>
            <h3 style={{ textAlign: 'center', marginBottom: '50px', fontFamily: 'var(--font-heading)', color: 'var(--accent-turquoise)' }}>PRECISION RIBBON</h3>
            <div className="pen-ribbon">
              <div className="ribbon-item" onDragOver={onDragOver} onDrop={(e) => handleDrop(e, 'pen_worked_1')}>
                <img src={assets.pen_worked_1} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              <div className="ribbon-item" onDragOver={onDragOver} onDrop={(e) => handleDrop(e, 'pen_worked_2')}>
                <img src={assets.pen_worked_2} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              <div className="ribbon-item" onDragOver={onDragOver} onDrop={(e) => handleDrop(e, 'pen_worked_3')}>
                <img src={assets.pen_worked_3} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECCIÓN PARALLAX IA - 2026 IMMERSIVE EXPERIENCE */}
      <section className="section-padding container">
        <div className="reveal" style={{ textAlign: 'center', marginBottom: '60px' }}>
          <h2 className="hero-title" style={{ fontSize: '3.5rem' }}>IMMERSE IN <span style={{ color: 'var(--accent-turquoise)' }}>2026</span></h2>
        </div>
        <div className="parallax-viewport">
          <div
            className="parallax-layer"
            style={{
              transform: `translate(${mousePos.x}px, ${mousePos.y}px)`,
              backgroundImage: `url('https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2072&auto=format&fit=crop')`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              filter: 'brightness(0.4)'
            }}
          ></div>
          <div
            className="parallax-layer"
            style={{
              transform: `translate(${mousePos.x * 1.5}px, ${mousePos.y * 1.5}px)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <div style={{ textAlign: 'center', padding: '0 20px' }}>
              <h3 style={{ fontSize: '4rem', color: 'var(--accent-gold)', textShadow: '0 0 50px rgba(0,0,0,0.5)' }}>ECOMOVING STUDIO</h3>
              <p style={{ fontSize: '1.2rem', color: 'white', maxWidth: '600px', margin: '20px auto' }}>Donde la inteligencia artificial y el diseño físico convergen para redefinir el futuro de tu marca.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Galería - Publicidad en Movimiento (Bento Grid) */}
      <section id="galeria" className="section-padding" style={{ backgroundColor: '#0f0f0f' }}>
        <div className="container">
          <h2 className="hero-subtitle" style={{ marginBottom: '30px', textAlign: 'center' }}>Nuestra visión a través de la publicidad</h2>

          <p className="manifesto-text" style={{ fontSize: '1.1rem', marginBottom: '60px', color: '#aaa', maxWidth: '700px' }}>
            Donde la estrategia converge con el arte. Hemos colaborado con marcas visionarias para traducir su esencia en campañas de alto impacto visual.
            Cada proyecto es un testimonio de innovación y precisión estética.
          </p>

          <div className="bento-grid">
            {/* ITEM 04 - Grande Destacado (2x2) */}
            <div
              className="bento-item span-2x2 reveal"
              onDragOver={onDragOver}
              onDrop={(e) => handleDrop(e, 'bento4')}
              style={{ backgroundImage: assets.bento4 ? `url('${assets.bento4}')` : 'none', backgroundSize: 'cover' }}
            >
              <div className="bento-content">
                <span className="bento-num">04</span>
                <span className="bento-label">Campaña Global</span>
              </div>
            </div>

            {/* ITEM 05 - Vertical (Span Row 2) */}
            <div
              className="bento-item span-row-2 reveal"
              onDragOver={onDragOver}
              onDrop={(e) => handleDrop(e, 'bento5')}
              style={{ animationDelay: '0.1s', backgroundImage: assets.bento5 ? `url('${assets.bento5}')` : 'none', backgroundSize: 'cover' }}
            >
              <div className="bento-content">
                <span className="bento-num">05</span>
                <span className="bento-label">Impacto</span>
              </div>
            </div>

            {/* ITEM 06 - Standard Box */}
            <div
              className="bento-item reveal"
              onDragOver={onDragOver}
              onDrop={(e) => handleDrop(e, 'bento6')}
              style={{ animationDelay: '0.2s', backgroundImage: assets.bento6 ? `url('${assets.bento6}')` : 'none', backgroundSize: 'cover' }}
            >
              <div className="bento-content">
                <span className="bento-num">06</span>
                <span className="bento-label">Social Media</span>
              </div>
            </div>

            {/* ITEM 07 - Standard Box */}
            <div
              className="bento-item reveal"
              onDragOver={onDragOver}
              onDrop={(e) => handleDrop(e, 'bento7')}
              style={{ animationDelay: '0.3s', backgroundImage: assets.bento7 ? `url('${assets.bento7}')` : 'none', backgroundSize: 'cover' }}
            >
              <div className="bento-content">
                <span className="bento-num">07</span>
                <span className="bento-label">Estrategia</span>
              </div>
            </div>

            {/* ITEM 08 - Wide (Span Col 2) */}
            <div
              className="bento-item span-col-2 reveal"
              onDragOver={onDragOver}
              onDrop={(e) => handleDrop(e, 'bento8')}
              style={{ animationDelay: '0.4s', backgroundImage: assets.bento8 ? `url('${assets.bento8}')` : 'none', backgroundSize: 'cover' }}
            >
              <div className="bento-content">
                <span className="bento-num">08</span>
                <span className="bento-label">Sostenibilidad</span>
              </div>
            </div>

            {/* ITEM 09 - Wide (Span Col 2) - Panorámica Final */}
            <div
              className="bento-item span-col-2 reveal"
              onDragOver={onDragOver}
              onDrop={(e) => handleDrop(e, 'bento9')}
              style={{ animationDelay: '0.5s', borderColor: 'var(--accent-gold)', backgroundImage: assets.bento9 ? `url('${assets.bento9}')` : 'none', backgroundSize: 'cover' }}
            >
              <div className="bento-content">
                <span className="bento-num" style={{ color: 'var(--accent-gold)' }}>09</span>
                <span className="bento-label" style={{ color: 'var(--accent-gold)' }}>MANIFIESTO VISUAL</span>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 6. Sección Multidimensional - Metamorfosis */}
      <section className="multi-dimension-section">
        <div className="asym-container">

          {/* Historia Introductiva */}
          <div className="reveal" style={{ position: 'relative', zIndex: 30, maxWidth: '800px', margin: '0 auto 120px auto', textAlign: 'center', pointerEvents: 'none' }}>
            <h2 style={{
              fontFamily: 'var(--font-heading)',
              color: 'var(--accent-gold)',
              fontSize: '3.5rem',
              lineHeight: '1.1',
              marginBottom: '30px',
              textShadow: '0 4px 30px rgba(0,0,0,0.9)'
            }}>
              TRANSFORMACIÓN<br />
              <span style={{ fontSize: '2rem', letterSpacing: '5px', color: '#fff' }}>DE OBJETO A ÍCONO</span>
            </h2>
            <p style={{
              fontFamily: 'var(--font-body)',
              fontSize: '1.25rem',
              lineHeight: '1.8',
              color: '#ddd',
              textShadow: '0 2px 10px rgba(0,0,0,0.9)',
              maxWidth: '700px',
              margin: '0 auto'
            }}>
              Todo comienza con la pureza de la forma. Un lienzo en blanco esperando identidad.
              A través de nuestra tecnología, revelamos la esencia de tu marca, creando no solo un regalo, sino un legado tangible.
              <br /><span style={{ color: 'var(--accent-turquoise)', fontStyle: 'italic', display: 'block', marginTop: '20px', fontSize: '1.1rem' }}>Observa la evolución.</span>
            </p>
          </div>

          {/* Textos de Fondo */}
          <div className="floating-text text-pos-1">PRESENTE</div>
          <div className="floating-text text-pos-2">FUTURO</div>

          {/* BLOQUE 1: El Resultado (After) - Heroico */}
          <div
            className="float-card card-large reveal"
            onDragOver={onDragOver}
            onDrop={(e) => handleDrop(e, 'asym_mugs')}
          >
            <div className="art-placeholder" style={{ padding: 0 }}>
              <img
                src={assets.asym_mugs}
                alt="Resultado Final Personalizado"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </div>
          </div>

          {/* BLOQUE 2: El Origen (Before) - Crudo/Minimal */}
          <div
            className="float-card card-tall reveal"
            style={{ animationDelay: '0.2s', right: '5%' }}
            onDragOver={onDragOver}
            onDrop={(e) => handleDrop(e, 'asym_pen')}
          >
            <div className="art-placeholder" style={{ padding: 0 }}>
              <img
                src={assets.asym_pen}
                alt="Lienzo en Blanco - Acero Puro"
                style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'grayscale(100%)' }}
              />
            </div>
          </div>

          {/* BLOQUE 3: Contexto - Wide */}
          <div
            className="float-card card-wide reveal"
            style={{ animationDelay: '0.4s' }}
            onDragOver={onDragOver}
            onDrop={(e) => handleDrop(e, 'asym_bottles')}
          >
            <div className="art-placeholder" style={{ padding: 0 }}>
              <img
                src={assets.asym_bottles}
                alt="Colección en Contexto"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </div>
          </div>

          {/* BLOQUE 4: El Detalle (Small - Agrandado) */}
          <div
            className="float-card card-small reveal"
            style={{ animationDelay: '0.6s' }}
            onDragOver={onDragOver}
            onDrop={(e) => handleDrop(e, 'detail_macro')}
          >
            <div className="art-placeholder" style={{ background: '#111', color: 'var(--accent-turquoise)', border: 'none' }}>
              <img
                src={assets.detail_macro} /* Necesitará imagen texture */
                alt="Detalle Laser"
                style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.7 }}
              />
              <span style={{ position: 'absolute', zIndex: 2, textShadow: '0 2px 4px #000' }}>#PRECISIÓN</span>
            </div>
          </div>

          {/* BLOQUE 5: Nuevo Elemento Flotante - Proceso */}
          <div className="float-card card-5 reveal" style={{ animationDelay: '0.3s' }}>
            <div className="art-placeholder" style={{ padding: 0 }}>
              <div style={{ width: '100%', height: '100%', background: '#222', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px dashed #444' }}>
                <span style={{ color: '#666' }}>Ingeniería</span>
              </div>
            </div>
          </div>

          {/* BLOQUE 6: Nuevo Elemento Flotante - Packaging */}
          <div className="float-card card-6 reveal" style={{ animationDelay: '0.5s' }}>
            <div className="art-placeholder" style={{ padding: 0 }}>
              <div style={{ width: '100%', height: '100%', background: '#151515', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ color: 'var(--accent-gold)' }}>Unboxing</span>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* 7. Detalles - 3 Columnas */}
      {/* 7. Detalles - Infinite Marquee Gallery */}
      <section className="section-padding" style={{ backgroundColor: '#000', color: 'white' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '80px' }}>
            <h2 className="hero-subtitle" style={{ color: 'var(--accent-gold)', fontSize: '2.5rem', marginBottom: '20px' }}>
              MAESTRÍA EN EL DETALLE
            </h2>
            <p className="manifesto-text" style={{ maxWidth: '800px', margin: '0 auto', fontSize: '1.1rem', color: '#999' }}>
              Cada curva, cada textura y cada acabado ha sido meticulosamente diseñado para superar lo convencional.
              La perfección no es un accidente, es el resultado de la obsesión por el detalle.
              <br /><span style={{ color: 'var(--accent-turquoise)', fontSize: '0.9rem', letterSpacing: '2px', textTransform: 'uppercase', marginTop: '10px', display: 'inline-block' }}>Desliza para explorar</span>
            </p>
          </div>
        </div>

        {/* Marquee Container Full Width */}
        <div className="marquee-container">
          <div className="marquee-content">
            <div
              className="detail-card-large"
              onDragOver={onDragOver}
              onDrop={(e) => handleDrop(e, 'scrolly1')}
            >
              <img src={assets.scrolly1} alt="Detalle Ergonomía" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              <div className="detail-overlay">
                <h3 style={{ fontFamily: 'var(--font-heading)', color: 'var(--accent-gold)', fontSize: '1.5rem' }}>Ergonomía</h3>
                <p style={{ fontSize: '0.9rem', color: '#ccc' }}>Diseño adaptativo</p>
              </div>
            </div>

            <div
              className="detail-card-large"
              onDragOver={onDragOver}
              onDrop={(e) => handleDrop(e, 'scrolly2')}
            >
              <img src={assets.scrolly2} alt="Detalle Térmico" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              <div className="detail-overlay">
                <h3 style={{ fontFamily: 'var(--font-heading)', color: 'var(--accent-gold)', fontSize: '1.5rem' }}>Termodinámica</h3>
                <p style={{ fontSize: '0.9rem', color: '#ccc' }}>24h Eficiencia</p>
              </div>
            </div>

            <div
              className="detail-card-large"
              onDragOver={onDragOver}
              onDrop={(e) => handleDrop(e, 'scrolly3')}
            >
              <img src={assets.scrolly3} alt="Detalle Láser" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              <div className="detail-overlay">
                <h3 style={{ fontFamily: 'var(--font-heading)', color: 'var(--accent-gold)', fontSize: '1.5rem' }}>Precisión Láser</h3>
                <p style={{ fontSize: '0.9rem', color: '#ccc' }}>Grabado eterno</p>
              </div>
            </div>

            {/* Set 2 (Duplicate for Loop) */}
            <div className="detail-card-large">
              <img src={assets.scrolly1} alt="Detalle Ergonomía" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              <div className="detail-overlay">
                <h3 style={{ fontFamily: 'var(--font-heading)', color: 'var(--accent-gold)', fontSize: '1.5rem' }}>Ergonomía</h3>
                <p style={{ fontSize: '0.9rem', color: '#ccc' }}>Diseño adaptativo</p>
              </div>
            </div>

            <div className="detail-card-large">
              <img src={assets.scrolly2} alt="Detalle Térmico" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              <div className="detail-overlay">
                <h3 style={{ fontFamily: 'var(--font-heading)', color: 'var(--accent-gold)', fontSize: '1.5rem' }}>Termodinámica</h3>
                <p style={{ fontSize: '0.9rem', color: '#ccc' }}>24h Eficiencia</p>
              </div>
            </div>

            <div className="detail-card-large">
              <img src={assets.scrolly3} alt="Detalle Láser" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              <div className="detail-overlay">
                <h3 style={{ fontFamily: 'var(--font-heading)', color: 'var(--accent-gold)', fontSize: '1.5rem' }}>Precisión Láser</h3>
                <p style={{ fontSize: '0.9rem', color: '#ccc' }}>Grabado eterno</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 8. Footer Minimalista */}
      <footer id="contacto" className="footer-minimal">
        <div>
          <h2 className="footer-brand">ECOMOVING</h2>
          <p style={{ marginTop: '20px', color: '#666', fontSize: '0.9rem' }}>
            Santiago, Chile<br />
            contacto@ecomoving.cl
          </p>
        </div>
        <div className="copyright">
          &copy; 2024 Ecomoving SPA. Todos los derechos reservados.
        </div>
      </footer>
    </main>
  );
}
