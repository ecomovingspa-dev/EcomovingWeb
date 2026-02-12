'use client';

import React, { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { X, Check, ZoomIn, ZoomOut } from 'lucide-react';

interface CropArea {
    x: number;
    y: number;
    width: number;
    height: number;
}

interface ImageCropperProps {
    imageSrc: string;
    aspectRatio?: number; // ej: 16/9, 4/3, 1 (cuadrado)
    initialCrop?: { x: number; y: number };
    initialZoom?: number;
    onCropComplete: (cropData: { crop: { x: number; y: number }; zoom: number; croppedAreaPixels: CropArea }) => void;
    onCancel: () => void;
}

export default function ImageCropper({
    imageSrc,
    aspectRatio = 4 / 3,
    initialCrop = { x: 0, y: 0 },
    initialZoom = 1,
    onCropComplete,
    onCancel
}: ImageCropperProps) {
    const [crop, setCrop] = useState(initialCrop);
    const [zoom, setZoom] = useState(initialZoom);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<CropArea | null>(null);

    const onCropChange = useCallback((newCrop: { x: number; y: number }) => {
        setCrop(newCrop);
    }, []);

    const onZoomChange = useCallback((newZoom: number) => {
        setZoom(newZoom);
    }, []);

    const onCropCompleteInternal = useCallback(
        (_croppedArea: CropArea, croppedAreaPixelsResult: CropArea) => {
            setCroppedAreaPixels(croppedAreaPixelsResult);
        },
        []
    );

    const handleConfirm = () => {
        // Siempre guardar, incluso si el usuario solo hizo zoom sin mover
        onCropComplete({
            crop,
            zoom,
            croppedAreaPixels: croppedAreaPixels || { x: 0, y: 0, width: 100, height: 100 }
        });
    };

    return (
        <div
            style={{
                position: 'fixed',
                inset: 0,
                zIndex: 9999,
                background: 'rgba(0, 0, 0, 0.95)',
                display: 'flex',
                flexDirection: 'column'
            }}
        >
            {/* Header */}
            <div
                style={{
                    padding: '20px 30px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    borderBottom: '1px solid #333'
                }}
            >
                <h3 style={{ margin: 0, fontFamily: 'var(--font-heading)', color: 'white', fontSize: '1.2rem' }}>
                    Ajustar Encuadre
                </h3>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                        onClick={onCancel}
                        style={{
                            background: '#333',
                            border: 'none',
                            color: 'white',
                            padding: '10px 20px',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            fontWeight: 'bold'
                        }}
                    >
                        <X size={18} /> Cancelar
                    </button>
                    <button
                        onClick={handleConfirm}
                        style={{
                            background: 'var(--accent-turquoise)',
                            border: 'none',
                            color: 'black',
                            padding: '10px 20px',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            fontWeight: 'bold'
                        }}
                    >
                        <Check size={18} /> Aplicar
                    </button>
                </div>
            </div>

            {/* Cropper Area */}
            <div style={{ flex: 1, position: 'relative' }}>
                <Cropper
                    image={imageSrc}
                    crop={crop}
                    zoom={zoom}
                    aspect={aspectRatio}
                    onCropChange={onCropChange}
                    onZoomChange={onZoomChange}
                    onCropComplete={onCropCompleteInternal}
                    style={{
                        containerStyle: {
                            background: '#111'
                        },
                        cropAreaStyle: {
                            border: '2px solid var(--accent-turquoise)'
                        }
                    }}
                />
            </div>

            {/* Zoom Controls */}
            <div
                style={{
                    padding: '20px 30px',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    gap: '20px',
                    borderTop: '1px solid #333',
                    background: '#0a0a0a'
                }}
            >
                <button
                    onClick={() => setZoom(Math.max(0.2, zoom - 0.1))}
                    style={{
                        background: '#222',
                        border: '1px solid #444',
                        color: 'white',
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}
                >
                    <ZoomOut size={20} />
                </button>

                <input
                    type="range"
                    min={0.2}
                    max={3}
                    step={0.01}
                    value={zoom}
                    onChange={(e) => setZoom(Number(e.target.value))}
                    style={{
                        width: '200px',
                        accentColor: 'var(--accent-turquoise)'
                    }}
                />

                <button
                    onClick={() => setZoom(Math.min(3, zoom + 0.1))}
                    style={{
                        background: '#222',
                        border: '1px solid #444',
                        color: 'white',
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}
                >
                    <ZoomIn size={20} />
                </button>

                <span style={{ color: '#888', fontSize: '0.9rem', marginLeft: '10px' }}>
                    Escala: {Math.round(zoom * 100)}% {zoom < 1 ? '(alejado)' : zoom > 1 ? '(acercado)' : ''}
                </span>
            </div>

            {/* Instructions */}
            <div
                style={{
                    padding: '15px 30px',
                    textAlign: 'center',
                    color: '#666',
                    fontSize: '0.85rem',
                    background: '#0a0a0a'
                }}
            >
                💡 Arrastra la imagen para posicionarla. Usa el slider para hacer zoom.
            </div>
        </div>
    );
}
