
const fs = require('fs');
const content = fs.readFileSync('c:/Users/Mario/Desktop/EcomovingWeb/src/components/CatalogHub.tsx', 'utf8');

// Strategy: find a point deep in the file that is stable and rewrite from there to the end.
const anchor = 'onMouseEnter={(e) => { e.currentTarget.style.transform = \'translateY(-2px)\'; e.currentTarget.style.boxShadow = \'0 10px 30px rgba(0,212,189,0.3)\'; }}';
const anchorIndex = content.lastIndexOf(anchor);

if (anchorIndex === -1) {
    console.error("Anchor not found");
    process.exit(1);
}

const beforeAnchor = content.substring(0, anchorIndex + anchor.length);

const cleanTail = `
                                                                onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
                                                            >
                                                                PUBLICAR PRODUCTO
                                                            </button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: '#444', textTransform: 'uppercase', letterSpacing: '4px', fontSize: '13px' }}>
                                                        Selecciona un producto para comenzar la curación
                                                    </div>
                                                )}
                                            </div>
                                        </React.Fragment>
                                    ) : (
                                        <React.Fragment>
                                            {/* Left List: Sections */}
                                            <div className="custom-scroll" style={{ borderRight: '1px solid rgba(255,255,255,0.05)', overflowY: 'auto', padding: '32px 40px', backgroundColor: 'rgba(0,0,0,0.2)' }}>
                                                <p style={{ fontSize: '11px', color: 'var(--accent-gold)', fontWeight: '800', textTransform: 'uppercase', marginBottom: '32px', letterSpacing: '3px', fontFamily: 'var(--font-body)' }}>
                                                    SECCIONES WEB
                                                </p>
                                                {[
                                                    { id: 'mugs', label: 'Tazas y Mugs' },
                                                    { id: 'botellas', label: 'Botellas y Termos' },
                                                    { id: 'libretas', label: 'Libretas y Agendas' },
                                                    { id: 'mochilas', label: 'Mochilas y Bolsos' },
                                                    { id: 'ecologicos', label: 'Línea de Madera' },
                                                    { id: 'bolsas', label: 'Bolsas Reutilizables' },
                                                    { id: 'hero', label: 'Banner Principal' }
                                                ].map(sec => (
                                                    <motion.div
                                                        key={sec.id}
                                                        onClick={() => setSelectedGallerySection(sec.id)}
                                                        whileHover={{ scale: 1.02, x: 5 }}
                                                        style={{
                                                            padding: '20px',
                                                            backgroundColor: selectedGallerySection === sec.id ? 'rgba(0, 212, 189, 0.05)' : 'rgba(255, 255, 255, 0.01)',
                                                            borderRadius: '4px',
                                                            border: '1px solid',
                                                            borderColor: selectedGallerySection === sec.id ? 'var(--accent-turquoise)' : 'rgba(255, 255, 255, 0.03)',
                                                            cursor: 'pointer',
                                                            marginBottom: '15px',
                                                            transition: 'all 0.3s'
                                                        }}
                                                    >
                                                        <p style={{ margin: 0, fontSize: '14px', fontWeight: '600', color: selectedGallerySection === sec.id ? 'var(--accent-turquoise)' : 'white', letterSpacing: '1px', textTransform: 'uppercase' }}>{sec.label}</p>
                                                    </motion.div>
                                                ))}
                                            </div>

                                            {/* Right Detail: Gallery Grid */}
                                            <div className="custom-scroll" style={{ padding: '40px 60px', overflowY: 'auto', backgroundColor: '#050505' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
                                                    <div>
                                                        <h2 style={{ color: 'white', fontFamily: 'var(--font-heading)', fontSize: '28px', margin: 0, letterSpacing: '2px', textTransform: 'uppercase' }}>
                                                            GALERÍA DE <span style={{ color: 'var(--accent-gold)' }}>TRABAJOS REALIZADOS</span>
                                                        </h2>
                                                        <p style={{ color: '#666', fontSize: '14px', marginTop: '10px' }}>Gestiona las imágenes que se muestran en el carrusel de la sección.</p>
                                                    </div>
                                                    
                                                    <div style={{ display: 'flex', gap: '20px' }}>
                                                        <input
                                                            type="file"
                                                            multiple
                                                            accept="image/*"
                                                            id="gallery-upload"
                                                            style={{ display: 'none' }}
                                                            onChange={handleGalleryUpload}
                                                        />
                                                        <label
                                                            htmlFor="gallery-upload"
                                                            style={{
                                                                background: 'var(--accent-turquoise)',
                                                                color: 'black',
                                                                padding: '15px 30px',
                                                                borderRadius: '4px',
                                                                fontSize: '12px',
                                                                fontWeight: '900',
                                                                cursor: uploadingGallery ? 'not-allowed' : 'pointer',
                                                                letterSpacing: '2px',
                                                                textTransform: 'uppercase',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                gap: '10px'
                                                            }}
                                                        >
                                                            {uploadingGallery ? <Plus className="animate-spin" size={18} /> : <Plus size={18} />}
                                                            {uploadingGallery ? 'SUBIENDO...' : 'SUBIR IMÁGENES'}
                                                        </label>
                                                    </div>
                                                </div>

                                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '25px' }}>
                                                    {galleryImages.map((src, index) => (
                                                        <div key={index} style={{ position: 'relative', aspectRatio: '4/3', borderRadius: '8px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.05)', background: '#111' }}>
                                                            <img src={src} alt="Galería" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                            <button
                                                                onClick={() => handleRemoveGalleryImage(index)}
                                                                style={{
                                                                    position: 'absolute',
                                                                    top: '10px',
                                                                    right: '10px',
                                                                    background: 'rgba(239, 68, 68, 0.9)',
                                                                    color: 'white',
                                                                    border: 'none',
                                                                    borderRadius: '50%',
                                                                    width: '30px',
                                                                    height: '30px',
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    justifyContent: 'center',
                                                                    cursor: 'pointer',
                                                                    boxShadow: '0 4px 10px rgba(0,0,0,0.3)'
                                                                }}
                                                            >
                                                                <X size={16} />
                                                            </button>
                                                        </div>
                                                    ))}
                                                    {galleryImages.length === 0 && !uploadingGallery && (
                                                        <div style={{ gridColumn: '1 / -1', padding: '100px', textAlign: 'center', border: '2px dashed rgba(255,255,255,0.05)', borderRadius: '12px', color: '#444' }}>
                                                            <Plus size={60} style={{ marginBottom: '20px', opacity: 0.2 }} />
                                                            <p style={{ letterSpacing: '2px', textTransform: 'uppercase', fontSize: '12px' }}>No hay imágenes en esta galería</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </React.Fragment>
                                    )}
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            );
}
`;

fs.writeFileSync('c:/Users/Mario/Desktop/EcomovingWeb/src/components/CatalogHub.tsx', beforeAnchor + cleanTail);
console.log("File fixed successfully!");
