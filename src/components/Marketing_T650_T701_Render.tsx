'use client';

import React, { useRef, useState } from 'react';
import html2canvas from 'html2canvas';
import { Download, Check, Loader2, ShieldCheck } from 'lucide-react';

/**
 * MASTER MARKETING RENDER V2 - ECOM-01 ENGINE (@seo_mkt)
 * OPTIMIZACIÓN DE MIMETISMO: INTEGRACIÓN DE SOMBRAS Y ELIMINACIÓN DE FONDOS.
 */
export default function Marketing_T650_T701_Render() {
    const renderRef = useRef<HTMLDivElement>(null);
    const [isExporting, setIsExporting] = useState(false);
    const [isDone, setIsDone] = useState(false);

    const products = [
        { name: 'T650 Celeste', url: '/marketing/alt_-promocional_publicitario_mug_acero_inoxidable_T650_celeste_1.jpg' },
        { name: 'T650 Rosa', url: '/marketing/alt_-promocional_publicitario_mug_acero_inoxidable_T650_rosa_1.jpg' },
        { name: 'T701 Gris 2025', url: '/marketing/alt_promocional_publicitario_Vaso_T701_gris_2025_1.jpg' },
        { name: 'T701 Rosa', url: '/marketing/alt_promocional_publicitario_Vaso_T701_rosa_1.jpg' },
    ];

    const handleDownload = async () => {
        if (!renderRef.current) return;
        setIsExporting(true);
        try {
            const canvas = await html2canvas(renderRef.current, {
                useCORS: true,
                scale: 2,
                backgroundColor: '#0a0a0a',
            });
            const imgData = canvas.toDataURL('image/jpeg', 0.95);
            const link = document.createElement('a');
            link.download = 'MCD_Ecomoving_Master_A1_Render.jpg';
            link.href = imgData;
            link.click();
            setIsDone(true);
            setTimeout(() => setIsDone(false), 3000);
        } catch (err) {
            console.error("Local Engine Error:", err);
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <div className="flex flex-col gap-8 bg-[#050505] p-10 rounded-3xl border border-white/5">
            <div 
                ref={renderRef}
                className="relative w-full h-[650px] overflow-hidden bg-[#0d0d0d] flex flex-col items-center justify-center font-sans"
            >
                {/* ATMÓSFERA BIOFÍLICA DE FONDO */}
                <div 
                    className="absolute inset-0 z-0 opacity-30 grayscale blur-[2px]"
                    style={{
                        backgroundImage: 'url("https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=2069")',
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                    }}
                />
                
                {/* SUPERFICIE DE NOGAL (MESA EJECUTIVA) */}
                <div className="absolute bottom-0 w-full h-[220px] z-10">
                    <div 
                        className="absolute inset-0 opacity-80 brightness-50"
                        style={{
                            backgroundImage: 'url("https://images.unsplash.com/photo-1582216168128-66228392576b?w=1200")',
                            backgroundSize: 'cover',
                            boxShadow: 'inset 0 40px 100px rgba(0,0,0,0.9)'
                        }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
                </div>

                {/* CONTENIDO ESTRATÉGICO SUPERIOR */}
                <div className="relative z-40 text-center mb-auto pt-16 pointer-events-none">
                    <div className="flex items-center justify-center gap-3 mb-6">
                        <div className="h-[1px] w-12 bg-emerald-500/50" />
                        <p className="text-[10px] tracking-[10px] text-emerald-400 font-black uppercase opacity-80">ECOM-01 / MASTER MCD</p>
                        <div className="h-[1px] w-12 bg-emerald-500/50" />
                    </div>
                    <h1 className="text-6xl md:text-7xl font-black text-white tracking-tighter leading-[0.85] mb-4">
                        OFFICE <span className="text-emerald-400">ZEN.</span>
                    </h1>
                    <p className="text-white/30 text-xs font-bold tracking-[6px] uppercase">Lujo Orgánico & Fidelidad de Stock</p>
                </div>

                {/* GRILLA DE PRODUCTOS (MIMETISMO INTEGRADO) */}
                <div className="relative z-30 w-full max-w-6xl px-12 flex justify-around items-end gap-4 pb-20 translate-y-8">
                    {products.map((prod, idx) => (
                        <div key={idx} className="group relative flex-1 flex flex-col items-center">
                            {/* SOMBRA DE CONTACTO MULTI-CAPA */}
                            <div className="absolute bottom-[20px] w-[80%] h-[15px] bg-black blur-xl rounded-full opacity-90 group-hover:opacity-100 transition-opacity" />
                            
                            {/* PRODUCTO CON MIX-BLEND PARA ELIMINAR FONDOS BLANCOS */}
                            <div className="relative overflow-hidden flex flex-col items-center">
                                <img 
                                    src={prod.url} 
                                    alt={prod.name}
                                    className="relative w-full max-w-[220px] h-auto object-contain transition-all duration-700 group-hover:scale-105 z-30"
                                    style={{ 
                                        mixBlendMode: 'multiply', // ELIMINA EL FONDO BLANCO DEL JPG
                                        filter: 'contrast(1.05) brightness(1.02)'
                                    }}
                                />
                                {/* REFUERZO DE LUZ LATERAL ARTIFICIAL */}
                                <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-40" />
                            </div>

                            {/* ETIQUETA TÉCNICA */}
                            <div className="absolute -bottom-6 opacity-0 group-hover:opacity-100 transition-all duration-500 bg-emerald-500 text-black px-3 py-1 rounded-sm">
                                <span className="text-[9px] tracking-[2px] uppercase font-black">{prod.name}</span>
                            </div>
                        </div>
                    ))}
                </div>

                {/* BADGE DE SEGURIDAD ADN */}
                <div className="absolute bottom-8 left-12 z-40 flex items-center gap-3 bg-black/40 backdrop-blur-xl border border-white/10 px-5 py-3 rounded-full">
                    <ShieldCheck size={16} className="text-emerald-400" />
                    <div className="flex flex-col">
                        <span className="text-[10px] text-white font-black tracking-widest leading-none">ADN VERIFIED_A1</span>
                        <span className="text-[8px] text-white/40 font-bold uppercase tracking-tight">Fidelidad 100% Sin Alucinación</span>
                    </div>
                </div>
                
                {/* LÍNEA DE CRUCE B2B */}
                <div className="absolute bottom-8 right-12 z-40">
                    <p className="text-[10px] text-white/20 font-black tracking-[4px] uppercase italic">Ecomoving SpA © 2026</p>
                </div>
            </div>

            {/* CONTROL PANEL */}
            <div className="flex flex-col items-center gap-4">
                <button
                    onClick={handleDownload}
                    disabled={isExporting}
                    className={`flex items-center gap-4 px-12 py-5 rounded-xl font-black text-[13px] tracking-[6px] uppercase transition-all duration-500 transform hover:-translate-y-1 shadow-2xl
                        ${isDone ? 'bg-emerald-500 text-black' : 'bg-emerald-400 text-black hover:bg-white'} 
                        ${isExporting ? 'opacity-50 cursor-wait' : ''}`}
                >
                    {isExporting ? <Loader2 className="animate-spin" size={20} /> : isDone ? <Check size={20} /> : <Download size={20} />}
                    {isExporting ? 'EXPORTANDO MASTER MCD...' : isDone ? 'RENDER REFRESHED' : 'DESCARGAR MASTER RENDER A1'}
                </button>
                <p className="text-[10px] text-white/30 uppercase tracking-[2px] font-bold">Motor Local ECOM-01 / Procesamiento en RAM Finalizado</p>
            </div>

            <style jsx>{`
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;900&display=swap');
                :global(body) { font-family: 'Inter', sans-serif; }
            `}</style>
        </div>
    );
}
