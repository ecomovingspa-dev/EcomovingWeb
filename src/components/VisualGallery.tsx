
'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface VisualGalleryProps {
    images: string[];
}

export default function VisualGallery({ images }: VisualGalleryProps) {
    if (!images || images.length === 0) return null;

    return (
        <div style={{ marginTop: '40px', overflow: 'hidden', padding: '20px 0' }}>
            <p style={{ color: 'var(--accent-gold)', fontSize: '10px', fontWeight: '800', letterSpacing: '4px', textTransform: 'uppercase', marginBottom: '25px' }}>
                Galería de Trabajos Realizados
            </p>
            <div style={{
                display: 'flex',
                gap: '20px',
                overflowX: 'auto',
                paddingBottom: '20px',
                scrollbarWidth: 'none',
                msOverflowStyle: 'none'
            }} className="custom-scroll-hidden">
                {images.map((src, idx) => (
                    <motion.div
                        key={idx}
                        whileHover={{ scale: 1.05, y: -5 }}
                        style={{
                            flex: '0 0 300px',
                            height: '225px',
                            borderRadius: '4px',
                            overflow: 'hidden',
                            border: '1px solid rgba(255,255,255,0.05)',
                            background: '#111',
                            boxShadow: '0 10px 30px rgba(0,0,0,0.3)'
                        }}
                    >
                        <img
                            src={src}
                            alt={`Trabajo realizado ${idx + 1}`}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                    </motion.div>
                ))}
            </div>
            <style jsx>{`
                .custom-scroll-hidden::-webkit-scrollbar {
                    display: none;
                }
            `}</style>
        </div>
    );
}
