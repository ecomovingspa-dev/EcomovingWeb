import Link from 'next/link';

export default function Home() {
  return (
    <main className="main-wrapper">
      {/* 1. Header / Navbar */}
      <header className="site-header">
        <div className="container header-container">
          <div className="logo-container">
            <div className="placeholder-box logo-placeholder">
              <span>IMG #1 (Logo)</span>
            </div>
          </div>
          <nav className="main-nav">
            <Link href="#" className="nav-link">INICIO</Link>
            <Link href="#" className="nav-link">TIENDA</Link>
            <Link href="#" className="nav-link">ACERCA DE</Link>
            <Link href="#" className="nav-link">CONTACTO</Link>
          </nav>
        </div>
      </header>

      {/* 2. Hero Section - Fondo Oscuro */}
      <section className="hero-section">
        <div className="container animate-entry">
          <h1 className="hero-title">
            ¡Sumérgete en la elegancia de nuestros Mugs!
          </h1>

          {/* Grid de 4 Imagenes */}
          <div className="hero-grid">
            <div className="hero-item item-1">
              <div className="placeholder-box dark-placeholder">
                <span>IMG #2</span>
              </div>
            </div>
            <div className="hero-item item-2">
              <div className="placeholder-box dark-placeholder">
                <span>IMG #3</span>
              </div>
            </div>
            <div className="hero-item item-3">
              <div className="placeholder-box dark-placeholder">
                <span>IMG #4</span>
              </div>
            </div>
            <div className="hero-item item-4">
              <div className="placeholder-box dark-placeholder">
                <span>IMG #5</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Propuesta de Valor - Fondo Beige */}
      <section className="value-section">
        <div className="container value-container animate-entry">
          <h2 className="section-title">
            Hacemos que tu marca se viva en cada detalle.
          </h2>
          <p className="section-desc">
            Personalización de alto nivel para empresas que buscan diferenciarse.
            Calidad, diseño y funcionalidad en cada producto.
          </p>
          <a href="#" className="btn-primary">
            Ver Ejercicio
          </a>
        </div>
      </section>

      {/* 4. Galería / Showcase */}
      <section className="gallery-section">
        <div className="gallery-grid">
          <div className="gallery-item">
            <div className="placeholder-box"><span>IMG #6</span></div>
          </div>
          <div className="gallery-item">
            <div className="placeholder-box"><span>IMG #7</span></div>
          </div>
          <div className="gallery-item">
            <div className="placeholder-box"><span>IMG #8</span></div>
          </div>
          <div className="gallery-item">
            <div className="placeholder-box"><span>IMG #9</span></div>
          </div>
        </div>
      </section>

      {/* 5. Footer */}
      <footer className="site-footer">
        <div className="container footer-container">

          {/* Logo Footer */}
          <div className="footer-logo">
            <div className="logo-container">
              <div className="placeholder-box logo-placeholder"><span>IMG #10 (Logo)</span></div>
            </div>
          </div>

          {/* Enlaces */}
          <div className="footer-links">
            <Link href="#">TIENDA</Link>
            <Link href="#">ACERCA DE</Link>
            <Link href="#">CONTACTO</Link>
          </div>

          {/* Newsletter */}
          <div className="footer-newsletter">
            <p className="newsletter-title">Solicita nuestros catálogos</p>
            <form className="newsletter-form">
              <input
                type="email"
                placeholder="Tu correo aquí"
                className="newsletter-input"
              />
              <button className="newsletter-btn">
                ¡VAMOS!
              </button>
            </form>
          </div>

        </div>
      </footer>
    </main>
  );
}
