'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ExternalLink, ChevronLeft, ChevronRight, Monitor, Smartphone, Maximize2, CheckCircle, Layers, Sparkles, Info } from 'lucide-react';

interface StitchScreen {
    id: string;
    title: string;
    screenshotUrl: string;
    htmlUrl: string;
    width: number;
    height: number;
    deviceType: string;
}

interface StitchViewerProps {
    projectId: string;
    projectName: string;
    isOpen: boolean;
    onClose: () => void;
    onSelect?: (screen: StitchScreen) => void;
}

// Pantallas del proyecto "Home - Tiny Puertecillo SpA" (id: 4290871646268560517)
// Leídas directamente desde el MCP de Stitch — actualizar si se agregan más screens
const TINY_PUERTECILLO_SCREENS: StitchScreen[] = [
    {
        id: 'ad76069079af44359cb96a61e3fda759',
        title: 'Home - Tiny Puertecillo Premium',
        screenshotUrl: 'https://lh3.googleusercontent.com/aida/ADBb0ujmcgAmmcRRTNc6SsH008uXKWu3KGlMWy3-_DyHxwVkWVC-wHs41Rx6uM38W01VtReVhVkQTtKq5946n2Mgm2LzjbrbxOoATqt2s8tbnvc9VPqmiLQkCXYaVMfBcHyEGTU9k9qEGh-hj83Az1rAiX6UB_yKWzXaipdQyX4GuiGNvJHV6UGBlv5-bgxFv35L5bTdZAJT1vfMJVYzsQzOV1ggvcxQxt31MU1npDlLh_k1hOMsUuScMvOjaHM',
        htmlUrl: 'https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ7Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpaCiVodG1sXzQ1YmQ3ZmY3YmM3NTQ1ZjY4MmRlOGVkOTQ1NTNmYjEyEgsSBxDs-L-z_hUYAZIBIwoKcHJvamVjdF9pZBIVQhM0MjkwODcxNjQ2MjY4NTYwNTE3&filename=&opi=89354086',
        width: 2560,
        height: 9328,
        deviceType: 'DESKTOP'
    },
    {
        id: 'e3b933fa36614e48a8c11fa1c1e04ff3',
        title: 'Home - Tiny Puertecillo SpA',
        screenshotUrl: 'https://lh3.googleusercontent.com/aida/ADBb0uiIGcje6gNuqDl81JTEy93OCY90-kbFUsdNGgVBmqQ8GbeJwL1z63R59lUDYt5ARdeQAnE2Bcce63e2MaCNHiD5HmwsZQ_yHpb-3-3_IdysyP17nFF2LJq8hcDGF5aes9OPvPhVEj2568toq7KbzuImScYJjSfxTyQo4F5oHtKZFy4Q5GBlcZwfqLDF_FI5x4oMzlnc4NXiHPcaHwhgVmoY9fjs-BC6rPX8kEEsOuwRUNIkPQx1NOkhBA',
        htmlUrl: 'https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ7Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpaCiVodG1sXzQ3YzA4ODAwNmRhODQwN2U4Zjc2MWRhNjIwN2I1YWU5EgsSBxDs-L-z_hUYAZIBIwoKcHJvamVjdF9pZBIVQhM0MjkwODcxNjQ2MjY4NTYwNTE3&filename=&opi=89354086',
        width: 2560,
        height: 7006,
        deviceType: 'DESKTOP'
    },
    {
        id: '1cf2c6cb822b4ebb9aaea3ee01616906',
        title: 'Tiny Puertecillo - Premium Landing Page',
        screenshotUrl: 'https://lh3.googleusercontent.com/aida/ADBb0ugWasbP6UOk6LJ6bTziJGvWnO-ivbduznR_xnNuS4ggLcd4bwS857zadS1UqsE8rFwogs5nvfNzVsTIo-ePKA1HmOMTyb-i3jyamR-dHSr_58-ZOyan4mFdveEEzlqXHJ8maIlMjxKC3zoGNdnae44b_On4ZSeOznCfXTFMlMdHgYWGyMhGT__CnFHID4mvclf7S1qOIonDXkirTcECVosdem2U6WM6zacz2kUpOxo94BQ_z2UKwLQKWYs',
        htmlUrl: 'https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ7Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpaCiVodG1sX2YzOTRmMGYwYTAyMDRjYzg4MzJlOTlmMTk1OWFjZTdjEgsSBxDs-L-z_hUYAZIBIwoKcHJvamVjdF9pZBIVQhM0MjkwODcxNjQ2MjY4NTYwNTE3&filename=&opi=89354086',
        width: 2560,
        height: 12760,
        deviceType: 'DESKTOP'
    },
    {
        id: '7833c08bb9874476b2318782303583c0',
        title: 'Tiny Puertecillo - Master Landing Page',
        screenshotUrl: 'https://lh3.googleusercontent.com/aida/ADBb0ugRhtRnxbcUC93nVuBmbvfQpXRz9o52oBt7mR4-1TjrP9H5L3g0McNBTAAfxwrINjp4kKxRZ1xjXptyJQniaIaraA3fI5w64vHTij7wup5Qt7Cd02CZJ3UvIWuRlYRTYpFu9W_tpD05w-0x-srrxD2SEfwcqYTVyNqkzrimTrqVGPeCkXAEJHnIGgZdevRfTNNp1I-nCJf7x5MRmBSfcvvu5McGY_G5FRjcLke4GHyg0xZJdMsvcO0eWA',
        htmlUrl: 'https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ7Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpaCiVodG1sX2NmODFkNzc5YmY1MzQ0MmZiMzg0N2U1NjdlMmY3YTQ2EgsSBxDs-L-z_hUYAZIBIwoKcHJvamVjdF9pZBIVQhM0MjkwODcxNjQ2MjY4NTYwNTE3&filename=&opi=89354086',
        width: 2560,
        height: 12464,
        deviceType: 'DESKTOP'
    },
    {
        id: '821b715efb4e47aaa5a608cd58d982e9',
        title: 'Las Tiny & Entorno',
        screenshotUrl: 'https://lh3.googleusercontent.com/aida/ADBb0uiFUAZU5gNc6-f6BbCY_UR06_VN8n0jatm8jNVmbYnefiGQ3pIhEgdirFFMExPHj4e0KFi_kVkCXE4cw_7I5T1tixrU_RqKic3tCNi98-4uzNavXSFi8gZtxoAEFFEQyThexSRY8qSSTBzyMqg0eOqyeRheZ2n5MEsoznqiClRxVsGRL7pP2zTXAa_sCMUKppUy4ej65AS-2j5EStgskvrcpiXOvAdqZ902UUXMGpf3K-k2wni8Bvnmgq4',
        htmlUrl: 'https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ7Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpaCiVodG1sXzAwMDY0ZTNkMjE5ZDU3YmUwNWMyZmY0NWE4M2E5ZDg0EgsSBxDs-L-z_hUYAZIBIwoKcHJvamVjdF9pZBIVQhM0MjkwODcxNjQ2MjY4NTYwNTE3&filename=&opi=89354086',
        width: 2560,
        height: 7816,
        deviceType: 'DESKTOP'
    },
    {
        id: '4a8fe670453548ef9f856a8cb7314f61',
        title: 'Las Tiny & Experiencia Premium',
        screenshotUrl: 'https://lh3.googleusercontent.com/aida/ADBb0uhGw311Z1TbgWLx_U6_0qXi_LRdPMsQLj0J4C2taxBxJUA0DAx0O0arDgGCTPbRGq0vDbHdwASlK9NwpAA-zTvYHcBeWNEM5LbhB0gSjP7uXEutmvjKbGsmtKkUPhZf0w-GPCB2zO2Gsxin6-UPUvxI4InYg3U41Jt5pf4JWRpT3PF_du3aAKBwZpWSkL7SWD20XHrw-Dgt4wgA6PeENuXxewyQHq7axBfx6M6lbgJejxVn4bqiJqExFA',
        htmlUrl: 'https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ7Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpaCiVodG1sX2JhYTkxNzM5M2UyNjQ3YmZhOWM3MWU5Y2YwM2M3ZTNmEgsSBxDs-L-z_hUYAZIBIwoKcHJvamVjdF9pZBIVQhM0MjkwODcxNjQ2MjY4NTYwNTE3&filename=&opi=89354086',
        width: 2560,
        height: 8500,
        deviceType: 'DESKTOP'
    },
    {
        id: '15c879c78b114dc398f45947daa8b37f',
        title: 'Experiencia & Reservas',
        screenshotUrl: 'https://lh3.googleusercontent.com/aida/ADBb0ugk8_BVL1ducM9NodNXrkn8hBgV_kAvJlfguL2l1pTVEhxprVeYNmyfL0Zw5kMWI76Ppo7f6WksxAKC3ani5exnjQDJ8XvisBBQns0es896w4xbs27LJhxFse5hUMMfgtmq8YAavG9BbORe4wmW9QzXm5wcnHY-Y5HzQuOXuXoKD8voZ9dcTC-lvd51_zQ6Btu97aBRJa8HFtKpXJ6DSzbhvJ8l6F2rp_9bKM4bkdtRDorFWA_6fS1Ydy0',
        htmlUrl: 'https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ7Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpaCiVodG1sXzhjZDUyNzZmYTU4ZDRlMDk5YjM2NjVjZDhjNGIxZDE0EgsSBxDs-L-z_hUYAZIBIwoKcHJvamVjdF9pZBIVQhM0MjkwODcxNjQ2MjY4NTYwNTE3&filename=&opi=89354086',
        width: 2560,
        height: 8586,
        deviceType: 'DESKTOP'
    }
];

// Mapa de screens por projectId — extensible a futuros proyectos
const SCREENS_BY_PROJECT: Record<string, StitchScreen[]> = {
    '4290871646268560517': TINY_PUERTECILLO_SCREENS,
};

export default function StitchViewer({ projectId, projectName, isOpen, onClose, onSelect }: StitchViewerProps) {
    const [activeIndex, setActiveIndex] = useState(0);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [fullscreen, setFullscreen] = useState(false);
    const [imageLoaded, setImageLoaded] = useState(false);

    const screens = SCREENS_BY_PROJECT[projectId] || [];
    const active = screens[activeIndex];

    useEffect(() => {
        setImageLoaded(false);
    }, [activeIndex]);

    useEffect(() => {
        if (isOpen) {
            setActiveIndex(0);
            setSelectedId(null);
        }
    }, [isOpen]);

    if (!isOpen || screens.length === 0) return null;

    const handleSelect = (screen: StitchScreen) => {
        setSelectedId(screen.id);
        if (onSelect) onSelect(screen);
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    className="sv-overlay"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                >
                    {/* Sidebar de miniaturas */}
                    <motion.div
                        className="sv-sidebar"
                        initial={{ x: -320 }}
                        animate={{ x: 0 }}
                        exit={{ x: -320 }}
                        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                    >
                        <div className="sv-sidebar-header">
                            <div className="sv-brand">
                                <Sparkles size={14} style={{ color: '#64b4ff', marginRight: 8 }} />
                                <span>STITCH VIEWER</span>
                            </div>
                            <h2>{projectName}</h2>
                            <p className="sv-count">{screens.length} pantallas disponibles</p>
                        </div>

                        <div className="sv-thumbnails">
                            {screens.map((screen, index) => (
                                <button
                                    key={screen.id}
                                    className={`sv-thumb ${activeIndex === index ? 'active' : ''} ${selectedId === screen.id ? 'selected' : ''}`}
                                    onClick={() => { setActiveIndex(index); setImageLoaded(false); }}
                                >
                                    <div className="sv-thumb-img-wrap">
                                        <img
                                            src={screen.screenshotUrl}
                                            alt={screen.title}
                                            className="sv-thumb-img"
                                            loading="lazy"
                                        />
                                        {selectedId === screen.id && (
                                            <div className="sv-selected-overlay">
                                                <CheckCircle size={20} />
                                            </div>
                                        )}
                                    </div>
                                    <div className="sv-thumb-info">
                                        <span className="sv-thumb-title">{screen.title}</span>
                                        <span className="sv-thumb-meta">
                                            {screen.deviceType === 'MOBILE' ? <Smartphone size={10} /> : <Monitor size={10} />}
                                            {screen.width}×{screen.height}px
                                        </span>
                                    </div>
                                </button>
                            ))}
                        </div>

                        <div className="sv-sidebar-footer">
                            <button
                                className="sv-btn-select"
                                onClick={() => handleSelect(active)}
                            >
                                <CheckCircle size={14} style={{ marginRight: 6 }} />
                                SELECCIONAR ESTA PANTALLA
                            </button>
                            <button className="sv-btn-close" onClick={onClose}>
                                <X size={14} style={{ marginRight: 6 }} />
                                CERRAR VISOR
                            </button>
                        </div>
                    </motion.div>

                    {/* Área de previsualización */}
                    <div className="sv-preview-area">
                        {/* Header */}
                        <div className="sv-preview-header">
                            <div className="sv-preview-title">
                                <Layers size={16} style={{ color: '#64b4ff', marginRight: 8 }} />
                                <span>{active?.title}</span>
                            </div>
                            <div className="sv-preview-actions">
                                <div className="sv-device-badge">
                                    {active?.deviceType === 'MOBILE' ? <Smartphone size={12} /> : <Monitor size={12} />}
                                    {active?.deviceType}
                                </div>
                                <button
                                    className="sv-icon-btn"
                                    onClick={() => setFullscreen(!fullscreen)}
                                    title="Pantalla completa"
                                >
                                    <Maximize2 size={14} />
                                </button>
                                <a
                                    href={active?.htmlUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="sv-icon-btn"
                                    title="Abrir HTML en nueva pestaña"
                                >
                                    <ExternalLink size={14} />
                                </a>
                                <button className="sv-icon-btn" onClick={onClose}>
                                    <X size={14} />
                                </button>
                            </div>
                        </div>

                        {/* Imagen de preview */}
                        <div className={`sv-img-container ${fullscreen ? 'fullscreen' : ''}`}>
                            {!imageLoaded && (
                                <div className="sv-img-loader">
                                    <div className="sv-spinner" />
                                    <p>Cargando diseño Stitch...</p>
                                </div>
                            )}
                            <img
                                key={active?.id}
                                src={active?.screenshotUrl}
                                alt={active?.title}
                                className={`sv-img ${imageLoaded ? 'visible' : 'hidden'}`}
                                onLoad={() => setImageLoaded(true)}
                            />
                        </div>

                        {/* Navegación inferior */}
                        <div className="sv-nav-bar">
                            <button
                                className="sv-nav-btn"
                                onClick={() => setActiveIndex(Math.max(0, activeIndex - 1))}
                                disabled={activeIndex === 0}
                            >
                                <ChevronLeft size={16} />
                            </button>
                            <div className="sv-nav-dots">
                                {screens.map((_, i) => (
                                    <button
                                        key={i}
                                        className={`sv-dot ${i === activeIndex ? 'active' : ''}`}
                                        onClick={() => setActiveIndex(i)}
                                    />
                                ))}
                            </div>
                            <button
                                className="sv-nav-btn"
                                onClick={() => setActiveIndex(Math.min(screens.length - 1, activeIndex + 1))}
                                disabled={activeIndex === screens.length - 1}
                            >
                                <ChevronRight size={16} />
                            </button>
                        </div>
                    </div>

                    <style jsx>{`
                        .sv-overlay {
                            position: fixed;
                            inset: 0;
                            z-index: 999999;
                            display: flex;
                            background: #050505;
                            font-family: 'Montserrat', sans-serif;
                        }
                        .sv-sidebar {
                            width: 280px;
                            min-width: 280px;
                            background: rgba(8, 8, 8, 0.98);
                            border-right: 1px solid rgba(255,255,255,0.05);
                            display: flex;
                            flex-direction: column;
                            overflow: hidden;
                        }
                        .sv-sidebar-header {
                            padding: 24px 20px 16px;
                            border-bottom: 1px solid rgba(255,255,255,0.05);
                        }
                        .sv-brand {
                            display: flex;
                            align-items: center;
                            font-size: 9px;
                            font-weight: 900;
                            letter-spacing: 3px;
                            color: #64b4ff;
                            margin-bottom: 10px;
                        }
                        .sv-sidebar-header h2 {
                            font-size: 13px;
                            font-weight: 700;
                            color: #fff;
                            margin: 0 0 4px;
                            font-family: 'Inter', sans-serif;
                        }
                        .sv-count {
                            font-size: 10px;
                            color: #555;
                            margin: 0;
                        }
                        .sv-thumbnails {
                            flex: 1;
                            overflow-y: auto;
                            padding: 12px;
                            display: flex;
                            flex-direction: column;
                            gap: 8px;
                        }
                        .sv-thumbnails::-webkit-scrollbar { width: 4px; }
                        .sv-thumbnails::-webkit-scrollbar-track { background: transparent; }
                        .sv-thumbnails::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 2px; }
                        .sv-thumb {
                            background: none;
                            border: 1px solid rgba(255,255,255,0.05);
                            border-radius: 8px;
                            padding: 8px;
                            cursor: pointer;
                            transition: all 0.2s;
                            text-align: left;
                            display: flex;
                            flex-direction: column;
                            gap: 8px;
                        }
                        .sv-thumb:hover { border-color: rgba(100,180,255,0.3); background: rgba(100,180,255,0.03); }
                        .sv-thumb.active { border-color: rgba(100,180,255,0.5); background: rgba(100,180,255,0.06); }
                        .sv-thumb.selected { border-color: rgba(0,212,189,0.5); background: rgba(0,212,189,0.05); }
                        .sv-thumb-img-wrap {
                            width: 100%;
                            aspect-ratio: 16/9;
                            border-radius: 5px;
                            overflow: hidden;
                            background: #111;
                            position: relative;
                        }
                        .sv-thumb-img {
                            width: 100%;
                            height: 100%;
                            object-fit: cover;
                            object-position: top;
                        }
                        .sv-selected-overlay {
                            position: absolute;
                            inset: 0;
                            background: rgba(0,212,189,0.3);
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            color: #00d4bd;
                        }
                        .sv-thumb-info {
                            display: flex;
                            flex-direction: column;
                            gap: 3px;
                        }
                        .sv-thumb-title {
                            font-size: 10px;
                            font-weight: 700;
                            color: #ccc;
                            line-height: 1.3;
                        }
                        .sv-thumb-meta {
                            font-size: 9px;
                            color: #555;
                            display: flex;
                            align-items: center;
                            gap: 4px;
                        }
                        .sv-sidebar-footer {
                            padding: 16px;
                            border-top: 1px solid rgba(255,255,255,0.05);
                            display: flex;
                            flex-direction: column;
                            gap: 8px;
                        }
                        .sv-btn-select {
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            background: rgba(0,212,189,0.1);
                            color: #00d4bd;
                            border: 1px solid rgba(0,212,189,0.3);
                            border-radius: 6px;
                            padding: 10px;
                            font-size: 9px;
                            font-weight: 900;
                            letter-spacing: 2px;
                            cursor: pointer;
                            transition: 0.3s;
                        }
                        .sv-btn-select:hover { background: rgba(0,212,189,0.2); }
                        .sv-btn-close {
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            background: none;
                            color: #555;
                            border: 1px solid rgba(255,255,255,0.07);
                            border-radius: 6px;
                            padding: 8px;
                            font-size: 9px;
                            font-weight: 800;
                            letter-spacing: 2px;
                            cursor: pointer;
                            transition: 0.3s;
                        }
                        .sv-btn-close:hover { color: #aaa; border-color: rgba(255,255,255,0.15); }
                        .sv-preview-area {
                            flex: 1;
                            display: flex;
                            flex-direction: column;
                            overflow: hidden;
                        }
                        .sv-preview-header {
                            display: flex;
                            align-items: center;
                            justify-content: space-between;
                            padding: 14px 20px;
                            border-bottom: 1px solid rgba(255,255,255,0.05);
                            background: rgba(8,8,8,0.7);
                            backdrop-filter: blur(10px);
                        }
                        .sv-preview-title {
                            display: flex;
                            align-items: center;
                            font-size: 12px;
                            font-weight: 700;
                            color: #ccc;
                            font-family: 'Inter', sans-serif;
                        }
                        .sv-preview-actions {
                            display: flex;
                            align-items: center;
                            gap: 8px;
                        }
                        .sv-device-badge {
                            display: flex;
                            align-items: center;
                            gap: 5px;
                            font-size: 9px;
                            font-weight: 800;
                            color: #555;
                            letter-spacing: 2px;
                            padding: 4px 10px;
                            background: rgba(255,255,255,0.03);
                            border: 1px solid rgba(255,255,255,0.06);
                            border-radius: 4px;
                        }
                        .sv-icon-btn {
                            width: 32px;
                            height: 32px;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            background: rgba(255,255,255,0.03);
                            border: 1px solid rgba(255,255,255,0.07);
                            border-radius: 6px;
                            color: #666;
                            cursor: pointer;
                            transition: 0.2s;
                            text-decoration: none;
                        }
                        .sv-icon-btn:hover { background: rgba(255,255,255,0.06); color: #aaa; }
                        .sv-img-container {
                            flex: 1;
                            overflow: auto;
                            background: #0a0a0a;
                            position: relative;
                            display: flex;
                            align-items: flex-start;
                            justify-content: center;
                            padding: 20px;
                        }
                        .sv-img-container.fullscreen {
                            padding: 0;
                        }
                        .sv-img-loader {
                            position: absolute;
                            inset: 0;
                            display: flex;
                            flex-direction: column;
                            align-items: center;
                            justify-content: center;
                            gap: 16px;
                            color: #444;
                            font-size: 12px;
                        }
                        .sv-spinner {
                            width: 32px;
                            height: 32px;
                            border: 2px solid rgba(100,180,255,0.2);
                            border-top-color: #64b4ff;
                            border-radius: 50%;
                            animation: sv-spin 0.8s linear infinite;
                        }
                        @keyframes sv-spin { to { transform: rotate(360deg); } }
                        .sv-img {
                            max-width: 100%;
                            border-radius: 8px;
                            box-shadow: 0 20px 60px rgba(0,0,0,0.8);
                            transition: opacity 0.3s;
                        }
                        .sv-img.visible { opacity: 1; }
                        .sv-img.hidden { opacity: 0; }
                        .sv-nav-bar {
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            gap: 16px;
                            padding: 14px;
                            border-top: 1px solid rgba(255,255,255,0.05);
                            background: rgba(8,8,8,0.7);
                        }
                        .sv-nav-btn {
                            width: 36px;
                            height: 36px;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            background: rgba(255,255,255,0.03);
                            border: 1px solid rgba(255,255,255,0.07);
                            border-radius: 6px;
                            color: #555;
                            cursor: pointer;
                            transition: 0.2s;
                        }
                        .sv-nav-btn:hover:not(:disabled) { color: #aaa; background: rgba(255,255,255,0.06); }
                        .sv-nav-btn:disabled { opacity: 0.3; cursor: not-allowed; }
                        .sv-nav-dots {
                            display: flex;
                            gap: 6px;
                        }
                        .sv-dot {
                            width: 6px;
                            height: 6px;
                            border-radius: 50%;
                            background: rgba(255,255,255,0.15);
                            border: none;
                            cursor: pointer;
                            transition: 0.2s;
                        }
                        .sv-dot.active { background: #64b4ff; transform: scale(1.3); }
                        .sv-dot:hover { background: rgba(255,255,255,0.35); }
                    `}</style>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
