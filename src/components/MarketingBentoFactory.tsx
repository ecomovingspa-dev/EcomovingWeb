'use client';

import React, { useState, useRef } from 'react';
import { Sparkles, Loader2, Search, Check, Save, Copy } from 'lucide-react';
import { supabase } from '@/lib/supabase';
// import html2canvas from 'html2canvas'; // Pendiente de asegurar si se prefiere

interface MarketingBentoFactoryProps {
    initialProduct?: any | null;
    initialImage?: string | null;
}

export default function MarketingBentoFactory({ initialProduct, initialImage }: MarketingBentoFactoryProps) {
    const [skuInput, setSkuInput] = useState(initialProduct ? (initialProduct.sku_externo || '') : '');
    const [isLoadingSku, setIsLoadingSku] = useState(false);
    const [product, setProduct] = useState<any | null>(initialProduct || null);

    // Selección de imágenes
    const [selectedImages, setSelectedImages] = useState<string[]>(initialImage ? [initialImage] : []);

    // MODO DISEÑO STATES
    const [bentoTemplate, setBentoTemplate] = useState<'1_square' | '2_squares' | '3_squares'>('1_square');
    const [bentoSlots, setBentoSlots] = useState<(string | null)[]>([initialImage || null, null, null]);

    // Recibir cambios desde Insumo en tiempo real
    React.useEffect(() => {
        if (initialProduct) {
            setProduct(initialProduct);
            setSkuInput(initialProduct.sku_externo || '');
        }
        if (initialImage) {
            setBentoSlots([initialImage, null, null]);
        }
    }, [initialProduct, initialImage]);

    // Estados IA 
    const [isGeneratingMkt, setIsGeneratingMkt] = useState(false);
    const [generatedTexts, setGeneratedTexts] = useState<any>(null);
    const [manualAsunto, setManualAsunto] = useState('');
    const [manualPart1, setManualPart1] = useState('');
    const [manualCuerpo, setManualCuerpo] = useState('');

    const [isSaving, setIsSaving] = useState(false);

    const [copiedContent, setCopiedContent] = useState<'subject' | 'body' | null>(null);
    const [generatedLayoutHtml, setGeneratedLayoutHtml] = useState<string | null>(null);
    const [draggedIdx, setDraggedIdx] = useState<number | null>(null);

    const [draggedGalleryItem, setDraggedGalleryItem] = useState<string | null>(null);

    const bentoRef = useRef<HTMLDivElement>(null);

    // 1. BUSCAR PRODUCTO POR SKU
    const handleSearchSku = async () => {
        if (!skuInput.trim()) return;
        setIsLoadingSku(true);
        setProduct(null);
        setSelectedImages([]);
        setGeneratedTexts(null);

        try {
            const searchSku = skuInput.trim().toUpperCase();

            const { data, error } = await supabase
                .from('productos')
                .select('*')
                .or(`sku_externo.ilike.%${searchSku}%,nombre.ilike.%${searchSku}%`)
                .limit(1)
                .single();

            if (error) throw error;
            if (data) {
                setProduct(data);
                if (data.imagen_principal) {
                    setSelectedImages([data.imagen_principal]);
                }
            }
        } catch (error) {
            console.error(error);
            alert("No se encontró el producto con ese código. Revisa en 'Catálogo' si existe.");
        } finally {
            setIsLoadingSku(false);
        }
    };

    // 2. LOGICA MODO DISEÑO (BENTO ESTRICTO CUADRADO B2B)
    const handleSetTemplate = (template: '1_square' | '2_squares' | '3_squares') => {
        setBentoTemplate(template);
        const sizes = { '1_square': 1, '2_squares': 2, '3_squares': 3 };
        const newSlots = Array(sizes[template]).fill(null);
        // Migramos los ya poblados a la nueva plantilla
        for (let i = 0; i < Math.min(bentoSlots.length, newSlots.length); i++) {
            newSlots[i] = bentoSlots[i];
        }
        setBentoSlots(newSlots);
    };

    const handleSelectImageToSlot = (url: string) => {
        // Encontrar primer vacio
        const emptyIdx = bentoSlots.findIndex(s => s === null);
        if (emptyIdx !== -1) {
            const newSlots = [...bentoSlots];
            newSlots[emptyIdx] = url;
            setBentoSlots(newSlots);
        } else {
            alert('La cuadrícula ya está llena. Arrastra una foto para reemplazarla o cambia la plantilla.');
        }
    };

    const handleDropToSlot = (targetIdx: number) => {
        if (draggedGalleryItem) {
            // Drop desde Galería
            const newSlots = [...bentoSlots];
            newSlots[targetIdx] = draggedGalleryItem;
            setBentoSlots(newSlots);
            setDraggedGalleryItem(null);
        } else if (draggedIdx !== null) {
            // Swap In-Place
            if (draggedIdx === targetIdx) return;
            const newSlots = [...bentoSlots];
            const temp = newSlots[draggedIdx];
            newSlots[draggedIdx] = newSlots[targetIdx];
            newSlots[targetIdx] = temp;
            setBentoSlots(newSlots);
            setDraggedIdx(null);
        }
    };

    // 3. GENERAR TEXTOS PARA MAIL Y BENTO
    const handleGenerateAI = async () => {
        const hasImage = bentoSlots.some(s => s !== null);
        if (!product || !hasImage) return;
        setIsGeneratingMkt(true);

        try {
            const res = await fetch('/api/generate-email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    technical_specs: product.features || product.technical_specs || ['Básico', 'Premium Merchandising'],
                    productName: product.nombre || product.sku_externo
                })
            });
            const dbResponse = await res.json();

            if (!dbResponse.success) throw new Error(dbResponse.details || dbResponse.error || "MKT API Error");

            setGeneratedTexts(dbResponse.data);
            setManualAsunto(dbResponse.data.email_subject || '');
            setManualPart1(dbResponse.data.part1 || '');
            setManualCuerpo(dbResponse.data.email_body || '');

            // Scroll suave hacia los resultados (después de 500ms al rendear)
            setTimeout(() => {
                bentoRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 500);

        } catch (error) {
            console.error(error);
            alert("Error al conversar con Gemini. Intenta otra vez.");
        } finally {
            setIsGeneratingMkt(false);
        }
    };

    const handleCopy = (type: 'subject' | 'body', text: string) => {
        navigator.clipboard.writeText(text);
        setCopiedContent(type);
        setTimeout(() => setCopiedContent(null), 2000);
    };

    const handleGenerateHTML = () => {
        const node = document.getElementById('bento-render-area');
        if (node && generatedTexts) {
            // Clonamos para mutar y limpiar badges visuales que no van en el correo final
            const clone = node.cloneNode(true) as HTMLElement;
            const badges = clone.querySelectorAll('.bento-badge');
            badges.forEach(b => b.remove());

            let bentoHtmlStr = clone.innerHTML;

            // Plantilla de Email B2B Estéticamente Idéntica a la Imagen de Referencia (Brand White + Clean Arial)
            // Agregado CSS en línea defensivo para Outlook y bordes sutiles para elevar el diseño
            const finalHtml = `
            <div style="width: 100%; font-family: 'Arial', sans-serif; background-color: #f6f8f9; padding: 40px 0;">
                <div style="max-width: 650px; margin: 0 auto; background-color: #ffffff; text-align: center; border-radius: 8px; box-shadow: 0 4px 15px rgba(0,0,0,0.03); border: 1px solid #eaedf0; overflow: hidden;">
                    <!-- BARRA SUPERIOR ESTATICA -->
                    <div style="height: 4px; background-color: #1c9a8a; width: 100%;"></div>

                    <!-- ENCABEZADO LOGO -->
                    <div style="margin-bottom: 25px; margin-top: 35px;">
                        <img src="https://ecomoving.cl/wp-content/uploads/2021/08/logo-ecomoving.png" alt="Ecomoving Corporativo" style="height: 48px; color: #1c9a8a; font-size: 24px; font-weight: bold;" />
                    </div>
                    
                    <!-- TITULAR (ASUNTO) -->
                    <h1 style="color: #0b3c42; font-size: 23px; font-weight: 900; margin: 0 40px 10px 40px; line-height: 1.3; font-family: 'Arial', sans-serif; text-transform: capitalize; letter-spacing: -0.3px;">
                        ${manualAsunto.toLowerCase()}
                    </h1>

                    <!-- PART 1 (SUBTITULO) -->
                    ${manualPart1 ? `
                    <div style="color: #1c9a8a; font-size: 13px; font-weight: 800; margin: 0 40px 25px 40px; text-transform: uppercase; letter-spacing: 2px; font-family: 'Arial', sans-serif;">
                        ${manualPart1}
                    </div>
                    ` : ''}
                    
                    <!-- LINEA SEPARADORA SUTIL -->
                    <hr style="border: none; border-top: 1px solid #f0f3f5; margin: 0 40px 30px 40px;" />

                    <!-- CUERPO Y MENSAJE SUPERIOR (ARMÓNICO) -->
                    <div style="color: #4a5568; font-size: 15px; line-height: 1.6; margin-bottom: 40px; padding: 0 45px; text-align: center; white-space: pre-wrap; font-family: 'Arial', sans-serif;">
                        ${manualCuerpo}
                    </div>

                    
                    <!-- BENTO COLLAGE (IMÁGENES) - MESA ROBUSTA -->
                    <div style="margin-bottom: 40px; width: 100%; padding: 0 30px; box-sizing: border-box; display: inline-block;">
                        <div style="max-width: 600px; margin: 0 auto;">
                            ${bentoHtmlStr}
                        </div>
                    </div>
                    
                    <!-- FOOTER INSTITUCIONAL -->
                    <hr style="border: none; border-top: 1px solid #eeeeee; margin: 50px 0 30px 0;" />
                    <div style="color: #666666; font-size: 11px; line-height: 1.6; padding-bottom: 30px; font-family: 'Arial', sans-serif;">
                        <p style="margin: 0;">Recibiste este mensaje porque eres parte de nuestra red de contactos preferenciales.</p>
                        <p style="margin: 4px 0; font-weight: bold; color: #333333;">Ecomoving SpA - Santiago, Chile</p>
                        <p style="margin: 0;"><a href="https://www.ecomoving.cl" style="color: #0000EE; text-decoration: underline;">www.ecomoving.cl</a> - +56 9 7958 7293 / +56 9 9392 46386</p>
                    </div>
                </div>
            </div>`;

            setGeneratedLayoutHtml(finalHtml);
        }
    };

    const handleDragStartInPlace = (idx: number) => setDraggedIdx(idx);
    const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); };

    const handleSaveToSupabase = async () => {
        if (!generatedLayoutHtml) return;
        const mainImage = bentoSlots.find(s => s !== null) || '';
        setIsSaving(true);
        try {
            const { data, error } = await supabase.from('marketing').insert([
                {
                    estado: 'BORRADOR',
                    cuerpo_html: generatedLayoutHtml,
                    asunto: manualAsunto,
                    cuerpo: manualCuerpo,

                    imagen_url: mainImage, // imagen de referencia principal
                    nombre_envio: product ? `Campaña ${product.nombre}` : 'Boletín Genérico',
                    activo: true
                }
            ]);

            if (error) {
                // Posiblemente no exista marketing_campaigns, lo informamos gracefully
                console.error("Supabase insert error:", error);
                throw error;
            }
            alert("¡Campaña guardada exitosamente en la Base de Datos!");
        } catch (err: any) {
            alert("Atención: Hubo un problema al guardar. " + (err.message || 'Error desconocido'));
        } finally {
            setIsSaving(false);
        }
    };

    // ============================================
    // RESULT RENDERER (BENTO CUADRADOS ESTRICTOS Y TABLAS ROBUSTAS PARA EMAIL)
    // ============================================
    const renderBentoLayout = () => {
        const renderCell = (idx: number) => {
            const imgUrl = bentoSlots[idx];
            return (
                <div
                    key={`bento-cell-${idx}`}
                    draggable={!!imgUrl}
                    onDragStart={() => { if (imgUrl) handleDragStartInPlace(idx); }}
                    onDragOver={handleDragOver}
                    onDrop={() => handleDropToSlot(idx)}
                    title={imgUrl ? "Arrastra para intercambiar fotos" : "Haz clic en una miniatura o arrastra aquí"}
                    style={{
                        backgroundColor: '#ffffff',
                        borderRadius: '6px',
                        border: draggedIdx === idx || (draggedGalleryItem && !imgUrl) ? '2px dashed #1c9a8a' : '1px solid #e2e8f0',
                        padding: '10px',
                        boxShadow: imgUrl ? '0 4px 10px rgba(0,0,0,0.03)' : 'none',
                        position: 'relative',
                        cursor: imgUrl ? 'grab' : 'default',
                        opacity: draggedIdx === idx ? 0.5 : 1,
                        transition: 'all 0.2s',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        aspectRatio: '1/1',
                        width: '100%',
                        boxSizing: 'border-box'
                    }}
                >
                    {imgUrl ? (
                        <img src={imgUrl} alt="Visual Principal" style={{ width: '100%', height: '100%', objectFit: 'contain', pointerEvents: 'none' }} />
                    ) : (
                        <span style={{ color: '#a0aec0', fontSize: '11px', fontWeight: 'bold' }}>FOTO {idx + 1}</span>
                    )}
                </div>
            );
        };

        if (bentoTemplate === '1_square') {
            return (
                <div style={{ maxWidth: '380px', margin: '0 auto', width: '100%' }}>
                    {renderCell(0)}
                </div>
            );
        }

        if (bentoTemplate === '2_squares') {
            return (
                <table width="100%" cellPadding={0} cellSpacing={0} style={{ maxWidth: '600px', margin: '0 auto', tableLayout: 'fixed' }}>
                    <tbody>
                        <tr>
                            <td align="center" valign="middle" style={{ padding: '0 12px', width: '50%' }}>{renderCell(0)}</td>
                            <td align="center" valign="middle" style={{ padding: '0 12px', width: '50%' }}>{renderCell(1)}</td>
                        </tr>
                    </tbody>
                </table>
            );
        }

        if (bentoTemplate === '3_squares') {
            return (
                <table width="100%" cellPadding={0} cellSpacing={0} style={{ maxWidth: '600px', margin: '0 auto', tableLayout: 'fixed' }}>
                    <tbody>
                        <tr>
                            <td align="center" valign="middle" style={{ padding: '0 8px', width: '33.33%' }}>{renderCell(0)}</td>
                            <td align="center" valign="middle" style={{ padding: '0 8px', width: '33.33%' }}>{renderCell(1)}</td>
                            <td align="center" valign="middle" style={{ padding: '0 8px', width: '33.33%' }}>{renderCell(2)}</td>
                        </tr>
                    </tbody>
                </table>
            );
        }
    };


    return (
        <div style={{ padding: "60px", overflowY: "auto", backgroundColor: "#050505", height: '100%', color: 'white' }}>
            <div style={{ maxWidth: "1200px", margin: "0 auto" }}>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "40px" }}>
                    <div>
                        <h2 style={{ fontFamily: "var(--font-heading)", fontSize: "32px", margin: 0, letterSpacing: "4px", textTransform: "uppercase" }}>
                            AI CONTENT <span style={{ color: "var(--accent-gold)" }}>FACTORY (BENTO)</span>
                        </h2>
                        <p style={{ color: '#666', fontSize: '12px', marginTop: '10px' }}>BUSCADOR INTELIGENTE POR SKU Y AUTO-CREADOR DE CAMPAÑAS DE CORREO CORPORATIVO.</p>
                    </div>
                </div>

                {/* 1. BUSCADOR */}
                <div style={{ display: "flex", gap: "15px", alignItems: 'center', background: 'rgba(255,255,255,0.02)', padding: '20px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)', marginBottom: '30px' }}>
                    <div style={{ position: 'relative', flex: 1 }}>
                        <Search size={16} color="#666" style={{ position: 'absolute', left: '15px', top: '15px' }} />
                        <input
                            type="text"
                            placeholder="ESCRIBE EL CÓDIGO SKU (ej. CORTAVIENTOS FORCE) O NOMBRE..."
                            value={skuInput}
                            onChange={(e) => setSkuInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearchSku()}
                            style={{ background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.1)', padding: '15px 15px 15px 45px', borderRadius: '4px', color: 'white', fontSize: '12px', width: '100%', outline: 'none', letterSpacing: '1px' }}
                        />
                    </div>
                    <button
                        onClick={handleSearchSku}
                        disabled={isLoadingSku || !skuInput}
                        style={{ background: "var(--accent-turquoise)", color: "black", padding: "15px 30px", borderRadius: "4px", fontSize: "11px", fontWeight: "900", cursor: "pointer", textTransform: "uppercase", display: 'flex', alignItems: 'center', gap: '8px' }}
                    >
                        {isLoadingSku ? <Loader2 className="animate-spin" size={16} /> : <Search size={16} />}
                        {isLoadingSku ? "BUSCANDO..." : "BUSCAR PRODUCTO"}
                    </button>
                </div>

                {/* 2. SI HAY PRODUCTO: MOSTRAR INFO Y GALERÍA */}
                {product && (
                    <div style={{ marginBottom: '40px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '20px' }}>
                            <h3 style={{ margin: 0, fontSize: '18px', color: 'white', fontWeight: '800' }}>{product.nombre}</h3>
                            <span style={{ fontSize: '10px', background: 'rgba(0,212,189,0.1)', color: 'var(--accent-turquoise)', padding: '4px 10px', borderRadius: '100px', fontWeight: '800' }}>{product.sku_externo}</span>
                        </div>

                        {/* SELECTOR DE PLANTILLAS CUADRADAS */}
                        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                            <button onClick={() => handleSetTemplate('1_square')} style={{ padding: '8px 15px', background: bentoTemplate === '1_square' ? 'var(--accent-turquoise)' : '#111', color: bentoTemplate === '1_square' ? 'black' : '#888', border: 'none', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer' }}>1 Bloque Cuadrado</button>
                            <button onClick={() => handleSetTemplate('2_squares')} style={{ padding: '8px 15px', background: bentoTemplate === '2_squares' ? 'var(--accent-turquoise)' : '#111', color: bentoTemplate === '2_squares' ? 'black' : '#888', border: 'none', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer' }}>2 Bloques Cuadrados</button>
                            <button onClick={() => handleSetTemplate('3_squares')} style={{ padding: '8px 15px', background: bentoTemplate === '3_squares' ? 'var(--accent-turquoise)' : '#111', color: bentoTemplate === '3_squares' ? 'black' : '#888', border: 'none', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer' }}>3 Bloques Cuadrados</button>
                        </div>

                        <p style={{ color: '#888', fontSize: '11px', marginBottom: '15px' }}>ARRASTRA TUS FOTOS DESDE AQUÍ HACIA LOS CAJILLEROS DE ABAJO, O CLICKEA PARA RELLENAR.</p>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '15px' }}>
                            {product.imagenes_galeria?.map((url: string, i: number) => {
                                return (
                                    <div
                                        key={i}
                                        draggable
                                        onDragStart={() => setDraggedGalleryItem(url)}
                                        onDragEnd={() => setDraggedGalleryItem(null)}
                                        onClick={() => handleSelectImageToSlot(url)}
                                        style={{
                                            aspectRatio: '1/1',
                                            background: '#fff', // Fondo blanco favorece a product shots PNG
                                            borderRadius: '6px',
                                            border: `2px solid rgba(255,255,255,0.05)`,
                                            cursor: 'grab',
                                            overflow: 'hidden',
                                            transition: 'all 0.2s',
                                            boxShadow: 'none'
                                        }}
                                        title="Click para agregar al primer cajón vacío, o arrastra hacia el diseño."
                                    >
                                        <img src={url} alt={`Preview ${i}`} style={{ width: '100%', height: '100%', objectFit: 'contain', pointerEvents: 'none' }} />
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                )}

                {/* 3. LIENZO BENTO MANUAL */}
                {product && (
                    <div style={{ marginTop: '40px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                            <h3 style={{ color: 'white', margin: 0, fontSize: '14px', letterSpacing: '1px', textTransform: 'uppercase' }}>LIENZO BENTO (ARRASTRA TUS FOTOS AQUÍ)</h3>
                        </div>

                        {/* CAJA RENDER DEL BENTO VISIBLE PARA ARMAR */}
                        <div style={{ display: 'flex', gap: '30px', alignItems: 'flex-start' }}>
                            <div style={{ flex: '0 0 500px' }}>
                                <div id="bento-render-area" style={{ background: '#0a0a0a', border: '1px solid #222', padding: '20px', borderRadius: '16px', overflow: 'hidden', pointerEvents: 'auto', display: 'flex', justifyContent: 'center' }}>
                                    {renderBentoLayout()}
                                </div>
                            </div>

                            {/* PANEL LATERAL DE GENERACIÓN Y GUARDADO */}
                            <div style={{ flex: 1 }}>
                                <div style={{ background: "rgba(0, 212, 189, 0.03)", border: "1px dashed rgba(0,212,189,0.2)", padding: "30px", borderRadius: "8px", marginBottom: '30px' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                        <div>
                                            <h3 style={{ color: "var(--accent-gold)", fontSize: "14px", margin: "0 0 5px 0", textTransform: 'uppercase', letterSpacing: '2px' }}>PASO FINAL: GENERANDO TEXTOS B2B</h3>
                                            <p style={{ margin: 0, fontSize: '11px', color: '#666' }}>Utiliza Gemini para generar los textos de la campaña basados en las fotos arrastradas (Mínimo 1 requerida).</p>
                                        </div>
                                        <button
                                            onClick={handleGenerateAI}
                                            disabled={isGeneratingMkt || !bentoSlots.some(s => s)}
                                            style={{ background: "rgba(0,212,189,0.1)", border: '1px solid var(--accent-turquoise)', opacity: bentoSlots.some(s => s) ? 1 : 0.5, color: "var(--accent-turquoise)", padding: "15px 30px", borderRadius: "4px", fontSize: "12px", fontWeight: "900", cursor: "pointer", textTransform: "uppercase", display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}
                                        >
                                            {isGeneratingMkt ? <Loader2 className="animate-spin" size={16} /> : <Sparkles size={16} />}
                                            {isGeneratingMkt ? "REDACTANDO Y ENSAMBLANDO..." : "BOTÓN MÁGICO B2B"}
                                        </button>
                                    </div>
                                </div>

                                {/* SI HAY TEXTOS GENERADOS SE MUESTRA EL RESULTADO DE IA Y GUARDADO */}
                                { (generatedTexts || bentoSlots.some(s => s)) && (
                                    <div ref={bentoRef} style={{ backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', padding: '30px', borderRadius: '16px' }}>
                                        <div style={{ marginBottom: '25px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <Sparkles size={20} color="var(--accent-gold)" />
                                            <h3 style={{ color: 'white', margin: 0, fontSize: '18px', letterSpacing: '1px' }}>EDITOR DE CAMPAÑA @SEO_MKT</h3>
                                        </div>

                                        <div style={{ marginBottom: '20px' }}>
                                            <label style={{ fontSize: '10px', color: '#666', fontWeight: '800', letterSpacing: '2px', display: 'block', marginBottom: '8px' }}>ASUNTO (Abre-puertas)</label>
                                            <input 
                                                type="text"
                                                value={manualAsunto}
                                                onChange={(e) => setManualAsunto(e.target.value)}
                                                placeholder="Ej: Estética Zen. El nuevo lujo es natural."
                                                style={{ backgroundColor: '#0a0a0a', border: '1px solid #222', padding: '15px', borderRadius: '8px', color: 'var(--accent-turquoise)', fontSize: '16px', fontWeight: '800', width: '100%', outline: 'none' }}
                                            />
                                        </div>

                                        <div style={{ marginBottom: '20px' }}>
                                            <label style={{ fontSize: '10px', color: '#666', fontWeight: '800', letterSpacing: '2px', display: 'block', marginBottom: '8px' }}>PART 1 (Titular secundario)</label>
                                            <input 
                                                type="text"
                                                value={manualPart1}
                                                onChange={(e) => setManualPart1(e.target.value)}
                                                placeholder="Ej: LUJO ORGÁNICO EN ARMONÍA"
                                                style={{ backgroundColor: '#0a0a0a', border: '1px solid #222', padding: '12px', borderRadius: '8px', color: 'white', fontSize: '12px', fontWeight: '700', width: '100%', outline: 'none', textTransform: 'uppercase' }}
                                            />
                                        </div>

                                        <div>
                                            <label style={{ fontSize: '10px', color: '#666', fontWeight: '800', letterSpacing: '2px', display: 'block', marginBottom: '8px' }}>CUERPO (Narrativa harmónica)</label>
                                            <textarea 
                                                value={manualCuerpo}
                                                onChange={(e) => setManualCuerpo(e.target.value)}
                                                placeholder="Escribe aquí el párrafo fluido..."
                                                rows={4}
                                                style={{ backgroundColor: '#0a0a0a', border: '1px solid #222', padding: '15px', borderRadius: '8px', color: '#ddd', fontSize: '14px', lineHeight: '1.7', width: '100%', outline: 'none', resize: 'vertical' }}
                                            />
                                        </div>


                                        <div style={{ marginTop: '30px', borderTop: '1px solid #333', paddingTop: '30px' }}>
                                            {!generatedLayoutHtml ? (
                                                <button
                                                    onClick={handleGenerateHTML}
                                                    style={{ width: '100%', background: "var(--accent-turquoise)", color: "black", padding: "15px 20px", borderRadius: "4px", fontSize: "11px", fontWeight: "900", cursor: "pointer", textTransform: "uppercase", display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                                                >
                                                    <Sparkles size={14} />
                                                    GENERAR PREVIEW Y PREPARAR CORREO HTML
                                                </button>
                                            ) : (
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                                    <p style={{ color: 'var(--accent-turquoise)', margin: 0, fontSize: '12px', fontWeight: '900', letterSpacing: '2px' }}>PREVISUALIZACIÓN DEL CORREO FINAL</p>

                                                    {/* MINIATURA DEL CORREO FINAL */}
                                                    <div
                                                        dangerouslySetInnerHTML={{ __html: generatedLayoutHtml }}
                                                        style={{ border: '1px solid #444', borderRadius: '8px', background: 'black', overflow: 'hidden', pointerEvents: 'none', zoom: 0.8 }}
                                                    />

                                                    <button
                                                        disabled={isSaving}
                                                        onClick={handleSaveToSupabase}
                                                        style={{ width: '100%', background: "var(--accent-gold)", color: "black", padding: "15px 20px", borderRadius: "4px", fontSize: "11px", fontWeight: "900", cursor: "pointer", textTransform: "uppercase", display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: '10px' }}
                                                    >
                                                        <Save size={14} />
                                                        {isSaving ? "GUARDANDO..." : "GUARDAR EN TABLA DE MARKETING (SUPABASE)"}
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
