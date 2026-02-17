'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import { Maximize2, X, ChevronLeft, ChevronRight } from 'lucide-react';

interface VisualGalleryProps {
    images?: string[];
    accentColor?: string;
}

export default function VisualGallery({ images, accentColor = '#00d4bd' }: VisualGalleryProps) {
    const [selectedImg, setSelectedImg] = useState<string | null>(null);
    const scrollRef = useRef<HTMLDivElement>(null);

    // Imágenes de muestra Premium si no hay cargadas
    const displayImages = images || [];

    // Si no hay imágenes, no mostrar nada
    if (displayImages.length === 0) return null;

    // Detectamos si es una galería pequeña para no usar efecto "Cinta" y evitar ver fotos repetidas
    const isSmallGallery = displayImages.length < 5;
    const infiniteImages = isSmallGallery ? displayImages : [...displayImages, ...displayImages];

    return (
        <div style={{ marginTop: '80px', position: 'relative', width: '100%', paddingBottom: '40px' }}>
            {/* Header Estilo Editorial */}
            <div style={{ padding: '0 20px', marginBottom: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <div>
                    <h4 style={{
                        color: accentColor,
                        fontSize: '10px',
                        fontWeight: '900',
                        letterSpacing: '5px',
                        textTransform: 'uppercase',
                        margin: 0
                    }}>
                        TRABAJOS REALIZADOS
                    </h4>
                    <p style={{ color: `${accentColor}99`, fontSize: '11px', margin: '5px 0 0 0', fontWeight: 600, letterSpacing: '2px' }}>PORTFOLIO EN MOVIMIENTO</p>
                </div>
                {!isSmallGallery && (
                    <div style={{ color: 'rgba(255,255,255,0.1)', fontSize: '3rem', fontWeight: 900, lineHeight: 0.8, fontFamily: 'var(--font-heading)' }}>
                        ∞
                    </div>
                )}
            </div>

            {/* CONTENEDOR DE IMÁGENES */}
            <div style={{
                width: isSmallGallery ? '100%' : '100vw',
                position: 'relative',
                left: isSmallGallery ? '0' : '50%',
                right: isSmallGallery ? '0' : '50%',
                marginLeft: isSmallGallery ? '0' : '-50vw',
                marginRight: isSmallGallery ? '0' : '-50vw',
                overflow: 'hidden',
                padding: '20px 0'
            }}>
                {!isSmallGallery && (
                    <div style={{
                        position: 'absolute', inset: 0, zIndex: 10,
                        background: 'linear-gradient(to right, #050505 0%, transparent 15%, transparent 85%, #050505 100%)',
                        pointerEvents: 'none'
                    }} />
                )}

                <motion.div
                    style={{
                        display: 'flex',
                        gap: '20px',
                        width: isSmallGallery ? '100%' : 'max-content',
                        justifyContent: isSmallGallery ? 'center' : 'flex-start',
                        flexWrap: isSmallGallery ? 'wrap' : 'nowrap'
                    }}
                    animate={isSmallGallery ? {} : { x: [0, -(displayImages.length * 370)] }}
                    transition={isSmallGallery ? {} : {
                        x: {
                            repeat: Infinity,
                            repeatType: "loop",
                            duration: displayImages.length * 8, // Velocidad adaptativa
                            ease: "linear"
                        }
                    }}
                >
                    {infiniteImages.map((src, idx) => (
                        <motion.div
                            key={idx}
                            whileHover={{ scale: 1.05, y: -10, zIndex: 5 }}
                            style={{
                                width: '350px',
                                height: '250px',
                                borderRadius: '20px',
                                overflow: 'hidden',
                                position: 'relative',
                                cursor: 'crosshair',
                                border: '1px solid rgba(255,255,255,0.05)',
                                background: '#111',
                                boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
                                flexShrink: 0
                            }}
                            onClick={() => setSelectedImg(src)}
                        >
                            {/* Overlay de info al hover */}
                            <motion.div
                                initial={{ opacity: 0 }}
                                whileHover={{ opacity: 1 }}
                                style={{
                                    position: 'absolute', inset: 0,
                                    background: `${accentColor}33`,
                                    backdropFilter: 'blur(5px)',
                                    zIndex: 2,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                                }}
                            >
                                <div style={{
                                    background: 'rgba(255,255,255,0.1)',
                                    border: '1px solid rgba(255,255,255,0.3)',
                                    borderRadius: '50%', padding: '15px'
                                }}>
                                    <Maximize2 size={24} color="white" />
                                </div>
                            </motion.div>

                            <img
                                src={src}
                                alt={`Portfolio Item ${idx}`}
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                        </motion.div>
                    ))}
                </motion.div>
            </div>

            {/* LIGHTBOX PREMIUM */}
            <AnimatePresence>
                {selectedImg && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setSelectedImg(null)}
                        style={{
                            position: 'fixed',
                            inset: 0,
                            zIndex: 9999,
                            background: 'rgba(0,0,0,0.95)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '40px',
                            backdropFilter: 'blur(20px)'
                        }}
                    >
                        <motion.button
                            style={{ position: 'absolute', top: '30px', right: '30px', background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}
                            whileHover={{ rotate: 90 }}
                        >
                            <X size={40} />
                        </motion.button>

                        <motion.img
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            src={selectedImg}
                            style={{
                                maxWidth: '100%',
                                maxHeight: '100%',
                                objectFit: 'contain',
                                borderRadius: '12px',
                                boxShadow: '0 0 100px rgba(0,212,189,0.3)'
                            }}
                        />
                    </motion.div>
                )}
            </AnimatePresence>

            <style jsx>{`
                .custom-scroll-hidden::-webkit-scrollbar { display: none; }
            `}</style>
        </div>
    );
}
