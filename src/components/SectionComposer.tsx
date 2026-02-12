'use client';

import React, { useState, useEffect } from 'react';
import { Layers, Plus, Save, Trash2, X, Move, ChevronDown, ChevronUp } from 'lucide-react';
import { WebContent, DynamicSection, LayoutBlock } from '@/hooks/useWebContent';

interface SectionComposerProps {
    isOpen: boolean;
    onClose: () => void;
    content: WebContent;
    onSave: (newContent: WebContent) => void;
}

export default function SectionComposer({ isOpen, onClose, content, onSave }: SectionComposerProps) {
    const [sections, setSections] = useState<DynamicSection[]>([]);
    const [activeSectionId, setActiveSectionId] = useState<string | null>(null);

    // Sincronizar estado interno cuando el contenido cambia o se abre el panel
    useEffect(() => {
        if (isOpen && content?.sections) {
            const rawSections = content.sections;
            const safeSections = Array.isArray(rawSections) ? rawSections :
                (typeof rawSections === 'object' ? Object.values(rawSections) : []);
            setSections(JSON.parse(JSON.stringify(safeSections))); // Copia profunda para evitar mutaciones
        }
    }, [isOpen, content?.sections]);

    if (!isOpen) return null;

    const addNewSection = () => {
        const newSection: DynamicSection = {
            id: `section_${Date.now()}`,
            order: sections.length + 1,
            title: 'NUEVA SECCIÓN SEO',
            title_2: 'SUBTÍTULO ESTRATÉGICO',
            description: 'Descripción optimizada para palabras clave orgánicas.',
            bgColor: '#050505',
            blocks: []
        };
        setSections([...sections, newSection]);
        setActiveSectionId(newSection.id);
    };

    const addBlock = (sectionId: string) => {
        const newSections = sections.map(s => {
            if (s.id !== sectionId) return s;
            const newBlock: LayoutBlock = {
                id: `block_${Date.now()}`,
                label: 'NUEVO BLOQUE',
                image: '',
                span: '4x2',
                col: 1,
                row: 1,
                zIndex: (s.blocks?.length || 0) + 1
            };
            return { ...s, blocks: [...(s.blocks || []), newBlock] };
        });
        setSections(newSections);
    };

    const updateBlock = (sectionId: string, blockId: string, updates: Partial<LayoutBlock>) => {
        setSections(sections.map(s => {
            if (s.id !== sectionId) return s;
            return {
                ...s,
                blocks: (s.blocks || []).map(b => b.id === blockId ? { ...b, ...updates } : b)
            };
        }));
    };

    const deleteSection = (id: string) => {
        setSections(sections.filter(s => s.id !== id));
    };

    const deleteBlock = (sectionId: string, blockId: string) => {
        setSections(sections.map(s => {
            if (s.id !== sectionId) return s;
            return { ...s, blocks: (s.blocks || []).filter(b => b.id !== blockId) };
        }));
    };

    return (
        <div style={{
            position: 'fixed',
            top: '80px',
            left: '20px',
            width: '350px',
            maxHeight: '80vh',
            backgroundColor: '#0a0a0a',
            border: '1px solid rgba(0, 212, 189, 0.3)',
            borderRadius: '12px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
            zIndex: 99999,
            display: 'flex',
            flexDirection: 'column',
            color: 'white',
            fontFamily: 'sans-serif'
        }}>
            {/* Header */}
            <div style={{
                padding: '15px',
                borderBottom: '1px solid #222',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: '#111',
                borderTopLeftRadius: '12px',
                borderTopRightRadius: '12px'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Layers size={18} style={{ color: '#00d4bd' }} />
                    <span style={{ fontSize: '11px', fontWeight: 900, letterSpacing: '2px' }}>SECTION COMPOSER</span>
                </div>
                <button
                    onClick={onClose}
                    style={{ background: 'none', border: 'none', color: '#666', cursor: 'pointer' }}
                >
                    <X size={20} />
                </button>
            </div>

            {/* Content */}
            <div style={{ padding: '20px', overflowY: 'auto', flex: 1 }} className="custom-scroll">
                <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                    <button
                        onClick={addNewSection}
                        style={{
                            flex: 1,
                            backgroundColor: '#111',
                            border: '1px solid #333',
                            color: 'white',
                            padding: '10px',
                            borderRadius: '6px',
                            fontSize: '11px',
                            fontWeight: 'bold',
                            cursor: 'pointer'
                        }}
                    >
                        <Plus size={14} style={{ verticalAlign: 'middle', marginRight: '5px' }} /> NUEVA SECCIÓN
                    </button>
                    <button
                        onClick={() => onSave({ ...content, sections })}
                        style={{
                            flex: 1,
                            backgroundColor: '#00d4bd',
                            border: 'none',
                            color: 'black',
                            padding: '10px',
                            borderRadius: '6px',
                            fontSize: '11px',
                            fontWeight: 'bold',
                            cursor: 'pointer'
                        }}
                    >
                        <Save size={14} style={{ verticalAlign: 'middle', marginRight: '5px' }} /> GUARDAR
                    </button>
                </div>

                {sections.map(section => (
                    <div key={section.id} style={{
                        backgroundColor: '#151515',
                        borderRadius: '8px',
                        marginBottom: '10px',
                        border: activeSectionId === section.id ? '1px solid #00d4bd' : '1px solid #222'
                    }}>
                        <div
                            onClick={() => setActiveSectionId(activeSectionId === section.id ? null : section.id)}
                            style={{ padding: '12px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                        >
                            <div>
                                <div style={{ fontSize: '9px', color: '#666', marginBottom: '2px' }}>ORDEN {section.order}</div>
                                <div style={{ fontSize: '12px', fontWeight: 'bold' }}>{section.title}</div>
                            </div>
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                <button
                                    onClick={(e) => { e.stopPropagation(); deleteSection(section.id); }}
                                    style={{ background: 'none', border: 'none', color: '#444', cursor: 'pointer' }}
                                >
                                    <Trash2 size={14} />
                                </button>
                                {activeSectionId === section.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                            </div>
                        </div>

                        {activeSectionId === section.id && (
                            <div style={{ padding: '15px', borderTop: '1px solid #222', backgroundColor: '#0c0c0c' }}>
                                <div style={{ marginBottom: '15px' }}>
                                    <label style={{ display: 'block', fontSize: '9px', color: '#555', marginBottom: '5px' }}>TÍTULO (H2)</label>
                                    <input
                                        style={{ width: '100%', backgroundColor: '#1a1a1a', border: '1px solid #333', color: 'white', padding: '8px', borderRadius: '4px', fontSize: '12px' }}
                                        value={section.title}
                                        onChange={(e) => setSections(sections.map(s => s.id === section.id ? { ...s, title: e.target.value } : s))}
                                    />
                                </div>
                                <div style={{ marginBottom: '15px' }}>
                                    <label style={{ display: 'block', fontSize: '9px', color: '#555', marginBottom: '5px' }}>DESCRIPCIÓN</label>
                                    <textarea
                                        style={{ width: '100%', backgroundColor: '#1a1a1a', border: '1px solid #333', color: 'white', padding: '8px', borderRadius: '4px', fontSize: '12px', resize: 'none' }}
                                        rows={3}
                                        value={section.description}
                                        onChange={(e) => setSections(sections.map(s => s.id === section.id ? { ...s, description: e.target.value } : s))}
                                    />
                                </div>

                                <div style={{ marginBottom: '15px' }}>
                                    <label style={{ display: 'block', fontSize: '9px', color: '#555', marginBottom: '5px' }}>FONDO DE SECCIÓN</label>
                                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                        <input
                                            type="color"
                                            value={section.bgColor || '#050505'}
                                            onChange={(e) => setSections(sections.map(s => s.id === section.id ? { ...s, bgColor: e.target.value } : s))}
                                            style={{ width: '40px', height: '30px', border: 'none', background: 'none', cursor: 'pointer', padding: 0 }}
                                        />
                                        <input
                                            type="text"
                                            value={section.bgColor || '#050505'}
                                            onChange={(e) => setSections(sections.map(s => s.id === section.id ? { ...s, bgColor: e.target.value } : s))}
                                            style={{ flex: 1, backgroundColor: '#1a1a1a', border: '1px solid #333', color: 'white', padding: '6px', borderRadius: '4px', fontSize: '11px' }}
                                        />
                                    </div>
                                </div>

                                <div style={{ borderTop: '1px solid #222', paddingTop: '15px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                        <span style={{ fontSize: '10px', fontWeight: 'bold', color: '#00d4bd' }}>BLOQUES 12x5</span>
                                        <button
                                            onClick={() => addBlock(section.id)}
                                            style={{ backgroundColor: 'rgba(0, 212, 189, 0.1)', border: '1px solid #00d4bd', color: '#00d4bd', fontSize: '9px', padding: '4px 10px', borderRadius: '4px', cursor: 'pointer' }}
                                        >
                                            + BLOQUE
                                        </button>
                                    </div>

                                    {(section.blocks || []).map(block => (
                                        <div key={block.id} style={{ backgroundColor: '#1a1a1a', padding: '10px', borderRadius: '6px', marginBottom: '8px', border: '1px solid #222' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                                <input
                                                    style={{ background: 'none', border: 'none', color: 'white', fontSize: '11px', fontWeight: 'bold', width: '80%' }}
                                                    value={block.label}
                                                    onChange={(e) => updateBlock(section.id, block.id, { label: e.target.value })}
                                                />
                                                <button
                                                    onClick={() => deleteBlock(section.id, block.id)}
                                                    style={{ background: 'none', border: 'none', color: '#444', cursor: 'pointer' }}
                                                >
                                                    <Trash2 size={12} />
                                                </button>
                                            </div>
                                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '5px' }}>
                                                <div style={{ textAlign: 'center' }}>
                                                    <div style={{ fontSize: '8px', color: '#555' }}>COL</div>
                                                    <input type="number" value={block.col || 1} onChange={(e) => updateBlock(section.id, block.id, { col: parseInt(e.target.value) || 1 })} style={{ width: '100%', background: '#000', border: '1px solid #333', color: 'white', fontSize: '10px', textAlign: 'center', padding: '2px' }} />
                                                </div>
                                                <div style={{ textAlign: 'center' }}>
                                                    <div style={{ fontSize: '8px', color: '#555' }}>ROW</div>
                                                    <input type="number" value={block.row || 1} onChange={(e) => updateBlock(section.id, block.id, { row: parseInt(e.target.value) || 1 })} style={{ width: '100%', background: '#000', border: '1px solid #333', color: 'white', fontSize: '10px', textAlign: 'center', padding: '2px' }} />
                                                </div>
                                                <div style={{ textAlign: 'center' }}>
                                                    <div style={{ fontSize: '8px', color: '#555' }}>SPAN</div>
                                                    <input type="text" value={block.span || '4x2'} onChange={(e) => updateBlock(section.id, block.id, { span: e.target.value })} style={{ width: '100%', background: '#000', border: '1px solid #333', color: 'white', fontSize: '10px', textAlign: 'center', padding: '2px' }} />
                                                </div>
                                                <div style={{ textAlign: 'center' }}>
                                                    <div style={{ fontSize: '8px', color: '#555' }}>CAPA</div>
                                                    <input type="number" value={block.zIndex || 1} onChange={(e) => updateBlock(section.id, block.id, { zIndex: parseInt(e.target.value) || 1 })} style={{ width: '100%', background: '#000', border: '1px solid #333', color: 'white', fontSize: '10px', textAlign: 'center', padding: '2px' }} />
                                                </div>
                                            </div>

                                            {/* CONFIGURACIÓN AVANZADA DEL BLOQUE */}
                                            <div style={{ marginTop: '10px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                                <div>
                                                    <label style={{ display: 'block', fontSize: '8px', color: '#555', marginBottom: '3px' }}>CONTENIDO</label>
                                                    <select
                                                        value={block.type || 'image'}
                                                        onChange={(e) => updateBlock(section.id, block.id, { type: e.target.value as any })}
                                                        style={{ width: '100%', background: '#000', border: '1px solid #333', color: 'white', fontSize: '10px', padding: '4px' }}
                                                    >
                                                        <option value="image">Solo Imagen</option>
                                                        <option value="text">Solo Texto</option>
                                                        <option value="both">Imagen + Texto</option>
                                                    </select>
                                                </div>
                                                <div>
                                                    <label style={{ display: 'block', fontSize: '8px', color: '#555', marginBottom: '3px' }}>FONDO BLOQUE</label>
                                                    <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
                                                        <input
                                                            type="color"
                                                            value={block.bgColor || '#111111'}
                                                            onChange={(e) => updateBlock(section.id, block.id, { bgColor: e.target.value })}
                                                            style={{ width: '25px', height: '20px', border: 'none', background: 'none', cursor: 'pointer', padding: 0 }}
                                                        />
                                                        <input
                                                            type="text"
                                                            value={block.bgColor || '#111111'}
                                                            onChange={(e) => updateBlock(section.id, block.id, { bgColor: e.target.value })}
                                                            style={{ flex: 1, backgroundColor: '#000', border: '1px solid #333', color: 'white', padding: '2px', fontSize: '9px' }}
                                                        />
                                                    </div>
                                                </div>
                                            </div>

                                            {(block.type === 'text' || block.type === 'both') && (
                                                <div style={{ marginTop: '10px', borderTop: '1px dashed #333', paddingTop: '10px' }}>
                                                    <label style={{ display: 'block', fontSize: '8px', color: '#555', marginBottom: '3px' }}>TEXTO DENTRO DEL BLOQUE</label>
                                                    <textarea
                                                        value={block.textContent || ''}
                                                        onChange={(e) => updateBlock(section.id, block.id, { textContent: e.target.value })}
                                                        style={{ width: '100%', background: '#000', border: '1px solid #333', color: 'white', fontSize: '10px', padding: '5px', resize: 'none' }}
                                                        rows={2}
                                                        placeholder="Escribe el mensaje aquí..."
                                                    />
                                                    <div style={{ marginTop: '5px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                        <label style={{ fontSize: '8px', color: '#555' }}>COLOR TEXTO:</label>
                                                        <input
                                                            type="color"
                                                            value={block.textColor || '#ffffff'}
                                                            onChange={(e) => updateBlock(section.id, block.id, { textColor: e.target.value })}
                                                            style={{ width: '20px', height: '15px', border: 'none', background: 'none', padding: 0 }}
                                                        />
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            <style jsx>{`
                .custom-scroll::-webkit-scrollbar { width: 5px; }
                .custom-scroll::-webkit-scrollbar-track { background: #000; }
                .custom-scroll::-webkit-scrollbar-thumb { background: #222; border-radius: 10px; }
                .custom-scroll::-webkit-scrollbar-thumb:hover { background: #333; }
            `}</style>
        </div>
    );
}
