'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Plus, Trash2, ChevronLeft, ChevronRight, FileText, Image as ImageIcon, 
    LayoutGrid, Type, Download, Sparkles, Printer, Save, Maximize, X, Loader2
} from 'lucide-react';

interface PortfolioBlock {
    id: string;
    type: 'image' | 'text' | 'bento';
    image?: string;
    title?: string;
    paragraph?: string;
    colSpan: number;
    rowSpan: number;
}

interface PortfolioPage {
    id: string;
    type: 'cover' | 'bento';
    blocks: PortfolioBlock[];
    content?: any;
}

interface PortfolioStudioProps {
    projectPath: string;
    initialData?: any;
    onSave: (data: any) => Promise<void>;
    onClose: () => void;
}

export default function PortfolioStudio({ projectPath, initialData, onSave, onClose }: PortfolioStudioProps) {
    const [pages, setPages] = useState<PortfolioPage[]>(initialData?.pages || [
        { 
            id: 'page-0', 
            type: 'cover', 
            blocks: [],
            content: { title: 'PORTAFOLIO ESTRATÉGICO', subtitle: 'ARQUITECTURA MODULAR DE ALTO DESEMPEÑO', year: '2024' } 
        }
    ]);
    const [currentPageIdx, setCurrentPageIdx] = useState(0);
    const [isSaving, setIsSaving] = useState(false);

    const addPage = (type: 'bento') => {
        const newPage: PortfolioPage = {
            id: `page-${Date.now()}`,
            type,
            blocks: [
                { id: `b-${Date.now()}-1`, type: 'image', colSpan: 8, rowSpan: 6 },
                { id: `b-${Date.now()}-2`, type: 'bento', colSpan: 4, rowSpan: 8 },
                { id: `b-${Date.now()}-3`, type: 'text', colSpan: 4, rowSpan: 6 },
                { id: `b-${Date.now()}-4`, type: 'image', colSpan: 4, rowSpan: 3 }
            ]
        };
        setPages([...pages, newPage]);
        setCurrentPageIdx(pages.length);
    };

    const handleInternalSave = async () => {
        setIsSaving(true);
        await onSave({ pages });
        setIsSaving(false);
    };

    const renderPage = (page: PortfolioPage) => {
        const pageStyle = {
            width: '825px',
            height: '1065px',
            background: 'white',
            color: 'black',
            position: 'relative' as const,
            boxShadow: '0 30px 60px rgba(0,0,0,0.5)',
            overflow: 'hidden',
            margin: '0 auto'
        };

        if (page.type === 'cover') {
            return (
                <div style={pageStyle} className="portfolio-page cover-page">
                    <div style={{ position: 'absolute', inset: 0, background: '#000', color: 'white' }}>
                        <div style={{ padding: '80px', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <img src="/Logo_horizontal.png" alt="Ecomoving" style={{ height: '40px', filter: 'brightness(1.5)' }} />
                                <div style={{ fontSize: '10px', letterSpacing: '4px', opacity: 0.5 }}>MEMORIA_TÉCNICA_v1.0</div>
                            </div>
                            
                            <div>
                                <motion.h1 
                                    initial={{ opacity: 0, y: 30 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    style={{ fontSize: '80px', fontWeight: 900, lineHeight: 0.9, letterSpacing: '-4px', marginBottom: '20px' }}>
                                    {page.content?.title || 'PORTAFOLIO'}
                                </motion.h1>
                                <div style={{ height: '1px', width: '100%', background: '#00d4bd', marginBottom: '30px' }} />
                                <p style={{ fontSize: '14px', letterSpacing: '8px', fontWeight: 700, opacity: 0.8 }}>{page.content?.subtitle}</p>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', fontSize: '12px', fontWeight: 900 }}>
                                <span>{page.content?.year || '2024'}</span>
                                <span>PORTAFOLIO INDEPENDIENTE • LA FÁBRICA</span>
                            </div>
                        </div>
                    </div>
                </div>
            );
        }

        if (page.type === 'bento') {
            return (
                <div style={pageStyle} className="portfolio-page bento-page">
                    <div style={{ padding: '60px', height: '100%', display: 'flex', flexDirection: 'column' }}>
                        <div style={{ borderBottom: '1px solid #eee', paddingBottom: '20px', marginBottom: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '10px', fontWeight: 900, letterSpacing: '3px' }}>TRABAJOS REALIZADOS</span>
                            <span style={{ fontSize: '10px', fontWeight: 900, color: '#00d4bd' }}>PÁG {currentPageIdx + 1} / {pages.length}</span>
                        </div>

                        <div style={{ 
                            flex: 1, display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', 
                            gridTemplateRows: 'repeat(12, 1fr)', gap: '15px' 
                        }}>
                            {page.blocks.map((block) => (
                                <div key={block.id} style={{ 
                                    gridColumn: `span ${block.colSpan}`, 
                                    gridRow: `span ${block.rowSpan}`,
                                    background: block.type === 'text' ? '#00d4bd' : '#f8f8f8',
                                    borderRadius: '4px',
                                    padding: block.type === 'text' ? '30px' : '0',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    justifyContent: block.type === 'text' ? 'center' : 'stretch',
                                    overflow: 'hidden'
                                }}>
                                    {block.type === 'image' && (
                                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <ImageIcon size={32} className="opacity-10" />
                                        </div>
                                    )}
                                    {block.type === 'text' && (
                                        <>
                                            <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 900 }}>MIMETISMO TÉCNICO</h3>
                                            <p style={{ fontSize: '10px', fontWeight: 700, marginTop: '10px', opacity: 0.8 }}>Eleva el producto a una atmósfera de autoridad.</p>
                                        </>
                                    )}
                                    {block.type === 'bento' && (
                                        <div style={{ padding: '20px', height: '100%', display: 'flex', flexDirection: 'column' }}>
                                            <div style={{ flex: 1, background: '#eee', borderRadius: '2px' }}></div>
                                            <div style={{ marginTop: '15px' }}>
                                                <h4 style={{ margin: 0, fontSize: '11px', fontWeight: 900 }}>ANÁLISIS DE IMPACTO</h4>
                                                <div style={{ height: '1px', width: '20px', background: '#00d4bd', margin: '8px 0' }}></div>
                                                <p style={{ margin: 0, fontSize: '9px', opacity: 0.5, lineHeight: 1.4 }}>Detalle técnico de materialidad y logística modular.</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>

                        <div style={{ marginTop: '40px', borderTop: '1px solid #eee', paddingTop: '20px', fontSize: '8px', fontWeight: 700, letterSpacing: '2px', textAlign: 'center' }}>
                            LA FÁBRICA • PORTAFOLIO SOBERANO
                        </div>
                    </div>
                </div>
            );
        }
    };

    return (
        <div className="fixed inset-0 bg-[#080808] z-[5000] flex flex-col font-sans">
            <div className="h-16 bg-black border-b border-white/5 flex items-center justify-between px-6">
                <div className="flex items-center gap-4">
                    <div className="p-2 bg-[#00d4bd] text-black rounded">
                        <FileText size={18} />
                    </div>
                    <div>
                        <h2 className="text-[11px] font-black tracking-[3px] text-white m-0">EDITOR DE PORTAFOLIO (CARTA)</h2>
                        <span className="text-[9px] text-white/30 font-bold tracking-[1px] uppercase">{projectPath}</span>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button 
                        onClick={handleInternalSave}
                        disabled={isSaving}
                        className="flex items-center gap-2 px-4 py-2 bg-[#00d4bd] text-black rounded-md text-[10px] font-black tracking-[2px] transition-all"
                    >
                        {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                        {isSaving ? 'GUARDANDO...' : 'GUARDAR PORTAFOLIO'}
                    </button>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-all">
                        <X size={20} className="text-white/50" />
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-hidden flex">
                <div className="w-64 bg-black border-r border-white/5 p-4 flex flex-col gap-4">
                    <div className="text-[9px] font-black text-white/30 tracking-[3px] mb-2 px-2 uppercase">Estructura Carta</div>
                    <div className="flex-1 overflow-y-auto flex flex-col gap-3 pr-2 custom-scrollbar">
                        {pages.map((p, i) => (
                            <button 
                                key={p.id}
                                onClick={() => setCurrentPageIdx(i)}
                                className={`w-full aspect-[1/1.29] rounded-lg border-2 transition-all p-3 text-left flex flex-col justify-between ${currentPageIdx === i ? 'border-[#00d4bd] bg-white/5' : 'border-white/5 bg-black'}`}
                            >
                                <span className={`text-[8px] font-black tracking-[1px] ${currentPageIdx === i ? 'text-[#00d4bd]' : 'text-white/30'}`}>PÁG {i + 1}</span>
                                <div className="flex-1 flex items-center justify-center">
                                    {p.type === 'cover' ? <FileText size={20} className="opacity-20" /> : <LayoutGrid size={20} className="opacity-20" />}
                                </div>
                            </button>
                        ))}
                        <button 
                            onClick={() => addPage('bento')}
                            className="w-full aspect-[1/1.29] rounded-lg border-2 border-dashed border-white/10 hover:border-[#00d4bd]/40 transition-all flex items-center justify-center"
                        >
                            <Plus size={20} className="text-white/20" />
                        </button>
                    </div>
                </div>

                <div className="flex-1 bg-[#0a0a0a] overflow-y-auto flex flex-col items-center py-12 px-6">
                    <div className="flex items-center gap-8">
                        <button disabled={currentPageIdx === 0} onClick={() => setCurrentPageIdx(currentPageIdx - 1)} className="p-3 bg-white/5 rounded-full disabled:opacity-10 text-white"><ChevronLeft size={24} /></button>
                        <AnimatePresence mode="wait">
                            <motion.div key={pages[currentPageIdx].id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                                {renderPage(pages[currentPageIdx])}
                            </motion.div>
                        </AnimatePresence>
                        <button disabled={currentPageIdx === pages.length - 1} onClick={() => setCurrentPageIdx(currentPageIdx + 1)} className="p-3 bg-white/5 rounded-full disabled:opacity-10 text-white"><ChevronRight size={24} /></button>
                    </div>
                </div>
            </div>
            <style jsx>{`
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
            `}</style>
        </div>
    );
}
