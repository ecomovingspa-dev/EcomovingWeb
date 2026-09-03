
'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Rocket, Github, Globe, Settings, ArrowRight, ShieldCheck, Zap, FolderDot, Box, Layers, Cpu, Sparkles, Eye } from 'lucide-react';

interface Project {
    id: string;
    name: string;
    repo: string;
    path: string;
    lastExport: string;
    type: 'public' | 'internal' | 'client';
    status: 'online' | 'ready' | 'draft';
    stitchProjectId?: string;
    clientName?: string;
}

const PROJECTS: Project[] = [
    {
        id: 'ecomoving-public',
        name: 'Ecomoving | Sitio Público',
        repo: 'ecomovingspa-dev/ecomoving-site',
        path: 'c:/Users/Mario/Desktop/ecomoving-site',
        lastExport: 'Hace 20 minutos',
        type: 'public',
        status: 'online'
    },
    {
        id: 'tiny-puertecillo',
        name: 'Tiny Puertecillo SpA',
        repo: 'ecomovingspa-dev/tiny-puertecillo',
        path: 'c:/Users/Mario/Desktop/TinyPuertecillo',
        lastExport: 'En Revisión',
        type: 'client',
        status: 'draft',
        stitchProjectId: '4290871646268560517',
        clientName: 'Tiny Puertecillo SpA'
    },
    {
        id: 'portafolio',
        name: 'Portafolio',
        repo: 'local-only',
        path: 'c:/Users/Mario/Desktop/Portafolio',
        lastExport: 'Recién vinculado',
        type: 'client',
        status: 'ready'
    }
];

export default function ProjectLauncher({ onSelect, onStitchPreview }: { onSelect: (project: Project) => void; onStitchPreview?: (project: Project) => void }) {
    const [hovered, setHovered] = useState<string | null>(null);
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

    const [projects, setProjects] = useState<Project[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newProjName, setNewProjName] = useState('Nuevo Entorno');
    const [newProjRepo, setNewProjRepo] = useState('');
    const [newProjPath, setNewProjPath] = useState('c:/Users/Mario/Desktop/NuevoEntorno');
    const [newProjTemplate, setNewProjTemplate] = useState<'web' | 'blank' | 'brochure'>('web');
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        const localCustom = localStorage.getItem('custom_projects');
        let customList = localCustom ? JSON.parse(localCustom) : [];
        
        // Filtrar con los predeterminados
        customList = customList.filter((cp: any) => !PROJECTS.some(p => p.path === cp.path));
        setProjects([...PROJECTS, ...customList]);
    }, []);

    const handleCreateProject = async () => {
        if (!newProjName.trim() || !newProjPath.trim()) {
            alert('Por favor complete los campos obligatorios (Nombre y Ruta Local).');
            return;
        }

        setIsSaving(true);
        try {
            // Intentar leer si ya existe el archivo en la ruta destino para no sobreescribir datos valiosos
            const readRes = await fetch('/api/local/read', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    projectPath: newProjPath.trim(),
                    fileName: 'web_content_sync.json'
                })
            });
            const readData = await readRes.json();
            const fileExists = readRes.ok && readData.success && readData.message !== 'File not found, returning empty schema';

            let initialContent: any = {};

            if (fileExists) {
                // Si ya existe, combinamos respetando el contenido actual
                initialContent = {
                    ...readData.content,
                    isBrochure: newProjTemplate === 'brochure',
                    hideHero: newProjTemplate === 'blank' || newProjTemplate === 'brochure',
                };
                if (newProjTemplate === 'brochure') {
                    initialContent.categories = readData.content.categories || [
                        "Escritura Regenerativa", 
                        "Movilidad Urbana RPET", 
                        "Tecnología Circular", 
                        "Innovación en Biomateriales"
                    ];
                }
            } else {
                // Si es un archivo nuevo, generamos la plantilla limpia según lo seleccionado
                if (newProjTemplate === 'brochure') {
                    initialContent = {
                        isBrochure: true,
                        hideHero: true,
                        categories: [
                            "Escritura Regenerativa", 
                            "Movilidad Urbana RPET", 
                            "Tecnología Circular", 
                            "Innovación en Biomateriales"
                        ],
                        hero: {
                            title1: "BROCHURE DIGITAL",
                            paragraph1: "Explora nuestro portafolio de productos.",
                            cta_text: "",
                            cta_link: "",
                            background_image: "",
                            hidden: true
                        },
                        sections: [
                            {
                                id: "infinite_grid",
                                order: 1,
                                title1: "LIENZO INFINITO",
                                paragraph1: "Lienzo de diseño libre.",
                                bgColor: "#000000",
                                blocks: [
                                    {
                                        id: "block_default_brochure",
                                        label: "ESCRITURA REGENERATIVA",
                                        type: "text",
                                        blockTitle: "MUESTRA DE ESCRITURA",
                                        blockParagraph: "Este es un bloque de muestra asignado a Escritura Regenerativa.",
                                        span: "24x15",
                                        col: 1,
                                        row: 1,
                                        zIndex: 1,
                                        borderRadius: "12px",
                                        bgColor: "#111111",
                                        textColor: "#ffffff",
                                        textAlign: "center",
                                        category: "Escritura Regenerativa"
                                    }
                                ]
                            }
                        ]
                    };
                } else if (newProjTemplate === 'blank') {
                    initialContent = {
                        hideHero: true,
                        hero: {
                            title1: "",
                            paragraph1: "",
                            cta_text: "",
                            cta_link: "",
                            background_image: "",
                            hidden: true
                        },
                        sections: [
                            {
                                id: "infinite_grid",
                                order: 1,
                                title1: "LIENZO INFINITO",
                                paragraph1: "Lienzo de diseño libre.",
                                bgColor: "#000000",
                                blocks: []
                            }
                        ]
                    };
                } else {
                    // Página Web tradicional
                    initialContent = {
                        hero: {
                            title1: "NUEVA PÁGINA WEB",
                            paragraph1: "DISEÑADA CON EL ECOMOVING ENGINE V2.0",
                            background_image: "/MKT-1775442852177.jpg",
                            cta_text: "EXPLORAR",
                            cta_link: "#"
                        },
                        sections: [
                            {
                                id: "infinite_grid",
                                order: 1,
                                title1: "LIENZO INFINITO",
                                paragraph1: "Comienza a añadir bloques.",
                                bgColor: "#000000",
                                blocks: [
                                    {
                                        id: "block_default",
                                        label: "BLOQUE DE BIENVENIDA",
                                        type: "text",
                                        blockTitle: "BIENVENIDO A TU NUEVA PÁGINA",
                                        blockParagraph: "Este es un bloque de muestra en tu grilla de 48 columnas.",
                                        span: "48x15",
                                        col: 1,
                                        row: 1,
                                        zIndex: 1,
                                        borderRadius: "12px",
                                        bgColor: "#111111",
                                        textColor: "#ffffff",
                                        textAlign: "center"
                                    }
                                ]
                            }
                        ]
                    };
                }
            }

            // Guardar archivo localmente usando la API de guardar
            const res = await fetch('/api/local/save', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    projectPath: newProjPath.trim(),
                    fileName: 'web_content_sync.json',
                    content: initialContent
                })
            });

            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.error || 'Error al guardar la plantilla del proyecto');
            }

            // Crear objeto del nuevo proyecto
            const newProject: Project = {
                id: `proj_${Date.now()}`,
                name: newProjName.trim(),
                repo: newProjRepo.trim() || 'local-only',
                path: newProjPath.trim(),
                lastExport: 'Recién inicializado',
                type: 'client',
                status: 'draft'
            };

            // Guardar en localStorage
            const localCustom = localStorage.getItem('custom_projects');
            const customList = localCustom ? JSON.parse(localCustom) : [];
            const updatedCustomList = [...customList, newProject];
            localStorage.setItem('custom_projects', JSON.stringify(updatedCustomList));

            // Actualizar estado y seleccionar
            setProjects([...PROJECTS, ...updatedCustomList]);
            setIsModalOpen(false);
            onSelect(newProject);
        } catch (e: any) {
            alert(`Error: ${e.message}`);
        } finally {
            setIsSaving(false);
        }
    };

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            setMousePosition({ x: e.clientX, y: e.clientY });
        };
        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, []);

    return (
        <div className="launcher-overlay">
            {/* Dynamic Background Effects */}
            <div className="bg-glow" style={{ left: mousePosition.x - 300, top: mousePosition.y - 300 }} />
            <div className="bg-grid" />

            <div className="launcher-container">
                <motion.div
                    initial={{ opacity: 0, y: -40, filter: 'blur(10px)' }}
                    animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                    transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                    className="launcher-header"
                >
                    <div className="brand-badge">
                        <Cpu size={12} className="mr-2 inline" style={{ marginRight: '8px' }} />
                        ECOMOVING ENGINE v2.0
                    </div>
                    <h1>La Fábrica</h1>
                    <p>Seleccione un entorno activo para inicializar la matriz de diseño y operaciones.</p>
                </motion.div>

                <div className="projects-grid">
                    {projects.map((project) => (
                        <motion.div
                            key={project.id}
                            className={`project-card ${hovered === project.id ? 'active' : ''}`}
                            onMouseEnter={() => setHovered(project.id)}
                            onMouseLeave={() => setHovered(null)}
                            onClick={() => onSelect(project)}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            whileHover={{ y: -10 }}
                        >
                            <div className="card-glow" />
                            <div className="project-type" style={project.type === 'client' ? { color: '#d4a843' } : {}}>
                                {project.type === 'public' ? <Globe size={14} /> : project.type === 'internal' ? <ShieldCheck size={14} /> : <Layers size={14} />}
                                {project.type.toUpperCase()}
                                {project.stitchProjectId && (
                                    <span className="stitch-badge"><Sparkles size={10} style={{ marginRight: 3 }} />STITCH</span>
                                )}
                            </div>

                            <div className="project-icon">
                                {project.type === 'public' ? <Zap size={32} /> : project.type === 'internal' ? <Rocket size={32} /> : <Layers size={32} />}
                            </div>

                            <div className="project-info">
                                <h3>{project.name}</h3>
                                <div className="repo-path">
                                    <Github size={12} /> {project.repo}
                                </div>
                            </div>

                            <div className="project-meta">
                                <div className="meta-item">
                                    <span className="label">ÚLTIMA EXPORTACIÓN</span>
                                    <span className="value">{project.lastExport}</span>
                                </div>
                                <div className="meta-item">
                                    <span className="label">ESTADO</span>
                                    <span className={`status-badge ${project.status}`}>
                                        {project.status.toUpperCase()}
                                    </span>
                                </div>
                            </div>

                            {project.stitchProjectId && onStitchPreview && (
                                <button
                                    className="btn-stitch-preview"
                                    onClick={(e) => { e.stopPropagation(); onStitchPreview(project); }}
                                >
                                    <Eye size={13} style={{ marginRight: 6 }} />
                                    PREVIEW STITCH
                                </button>
                            )}

                            {project.repo === 'local-only' && (
                                <button
                                    className="btn-stitch-preview"
                                    style={{
                                        borderColor: 'rgba(0, 212, 189, 0.4)',
                                        color: '#00d4bd',
                                        marginTop: '8px'
                                    }}
                                    onClick={async (e) => { 
                                        e.stopPropagation(); 
                                        try {
                                            const res = await fetch('/api/local/start-server', {
                                                method: 'POST',
                                                headers: { 'Content-Type': 'application/json' },
                                                body: JSON.stringify({ projectPath: project.path })
                                            });
                                            const data = await res.json();
                                            if (data.success) {
                                                alert('Iniciando servidor local y abriendo en el navegador...');
                                            } else {
                                                alert('Error: ' + data.error);
                                            }
                                        } catch (err) {
                                            alert('Error de conexión con la API.');
                                        }
                                    }}
                                >
                                    <Sparkles size={13} style={{ marginRight: 6 }} />
                                    ABRIR PROYECTO REAL (VITE)
                                </button>
                            )}

                            <div className="card-action">
                                <span>ABRIR ENTORNO</span>
                                <ArrowRight size={16} />
                            </div>
                        </motion.div>
                    ))}

                    <motion.div
                        className="project-card add-new"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: projects.length * 0.1 }}
                        whileHover={{ scale: 1.02, backgroundColor: 'rgba(255,255,255,0.02)' }}
                        onClick={() => setIsModalOpen(true)}
                    >
                        <div className="add-content">
                            <div className="project-icon outline-icon">
                                <FolderDot size={32} />
                            </div>
                            <h3>Nuevo Entorno</h3>
                            <p>Desplegar una nueva instancia o vincular repositorio existente.</p>
                            <button className="btn-add">INICIALIZAR</button>
                        </div>
                    </motion.div>
                </div>

                {/* Modal de Inicialización */}
                <AnimatePresence>
                    {isModalOpen && (
                        <div className="modal-overlay">
                            <motion.div 
                                className="modal-card"
                                initial={{ scale: 0.95, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.95, opacity: 0 }}
                                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            >
                                <h2>INICIALIZAR NUEVO ENTORNO</h2>
                                <p className="subtitle">Configure los parámetros del nuevo espacio de trabajo.</p>
                                
                                <div className="form-group">
                                    <label>Nombre del Proyecto</label>
                                    <input 
                                        type="text" 
                                        value={newProjName} 
                                        onChange={(e) => setNewProjName(e.target.value)} 
                                        placeholder="Nombre descriptivo"
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Repositorio GitHub (Opcional)</label>
                                    <input 
                                        type="text" 
                                        value={newProjRepo} 
                                        onChange={(e) => setNewProjRepo(e.target.value)} 
                                        placeholder="org/repo"
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Ruta Local Absoluta</label>
                                    <input 
                                        type="text" 
                                        value={newProjPath} 
                                        onChange={(e) => setNewProjPath(e.target.value)} 
                                        placeholder="c:/Users/Mario/Desktop/NombreProyecto"
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Estructura de Partida</label>
                                    <div className="template-selector">
                                        <div 
                                            className={`template-option ${newProjTemplate === 'web' ? 'active' : ''}`}
                                            onClick={() => {
                                                setNewProjTemplate('web');
                                                setNewProjName('Sitio Web');
                                                setNewProjPath('c:/Users/Mario/Desktop/NuevoEntorno');
                                            }}
                                        >
                                            <div className="option-title">Página Web</div>
                                            <div className="option-desc">Incluye sección Hero (encabezado) y Lienzo Infinito con bloques preestablecidos.</div>
                                        </div>
                                        <div 
                                            className={`template-option ${newProjTemplate === 'blank' ? 'active' : ''}`}
                                            onClick={() => {
                                                setNewProjTemplate('blank');
                                                setNewProjName('Lienzo en Blanco');
                                                setNewProjPath('c:/Users/Mario/Desktop/NuevoEntorno');
                                            }}
                                        >
                                            <div className="option-title">Lienzo en Blanco</div>
                                            <div className="option-desc">Sin Hero. Entorno libre y limpio desde el inicio para construir usando toda la grilla de 48 columnas.</div>
                                        </div>
                                        <div 
                                            className={`template-option ${newProjTemplate === 'brochure' ? 'active' : ''}`}
                                            onClick={() => {
                                                setNewProjTemplate('brochure');
                                                setNewProjName('Portafolio');
                                                setNewProjPath('c:/Users/Mario/Desktop/Portafolio');
                                            }}
                                        >
                                            <div className="option-title">Brochure / Portafolio</div>
                                            <div className="option-desc">Sin Hero. Incluye menú de categorías editables superior y filtrado de la grilla de proyectos.</div>
                                        </div>
                                    </div>
                                </div>

                                <div className="modal-actions">
                                    <button className="btn-cancel" onClick={() => setIsModalOpen(false)} disabled={isSaving}>CANCELAR</button>
                                    <button className="btn-confirm" onClick={handleCreateProject} disabled={isSaving}>
                                        {isSaving ? 'INICIALIZANDO...' : 'CREAR ENTORNO'}
                                    </button>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>

                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1 }}
                    className="launcher-footer"
                >
                    <div className="system-status">
                        <div className="status-indicator">
                            <div className="pulse-dot"></div>
                            <div className="pulse-ring"></div>
                        </div>
                        <span className="status-text">SYSLINK ACTIVO &bull; CONECTADO A GITHUB</span>
                    </div>
                </motion.div>
            </div>

            <style jsx>{`
                .launcher-overlay {
                    position: fixed;
                    inset: 0;
                    background-color: #030303;
                    z-index: 99999;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 40px;
                    overflow-y: auto;
                    font-family: 'Montserrat', sans-serif;
                }
                .bg-glow {
                    position: fixed;
                    width: 600px;
                    height: 600px;
                    background: radial-gradient(circle, rgba(0, 212, 189, 0.05) 0%, transparent 70%);
                    border-radius: 50%;
                    pointer-events: none;
                    z-index: 0;
                    transition: width 0.3s, height 0.3s;
                }
                .bg-grid {
                    position: fixed;
                    inset: 0;
                    background-image: 
                        linear-gradient(to right, rgba(255,255,255,0.02) 1px, transparent 1px),
                        linear-gradient(to bottom, rgba(255,255,255,0.02) 1px, transparent 1px);
                    background-size: 50px 50px;
                    pointer-events: none;
                    z-index: 0;
                    mask-image: radial-gradient(circle at center, black 40%, transparent 100%);
                    -webkit-mask-image: radial-gradient(circle at center, black 40%, transparent 100%);
                }
                .launcher-container {
                    width: 100%;
                    max-width: 1300px;
                    position: relative;
                    z-index: 10;
                }
                .launcher-header {
                    text-align: center;
                    margin-bottom: 80px;
                }
                .brand-badge {
                    display: inline-flex;
                    align-items: center;
                    padding: 8px 16px;
                    background: rgba(0, 212, 189, 0.05);
                    color: var(--accent-turquoise);
                    border: 1px solid rgba(0, 212, 189, 0.2);
                    border-radius: 6px;
                    font-size: 10px;
                    font-weight: 800;
                    letter-spacing: 4px;
                    margin-bottom: 25px;
                    backdrop-filter: blur(10px);
                    box-shadow: 0 0 20px rgba(0,212,189,0.1);
                }
                .launcher-header h1 {
                    font-family: 'Inter', sans-serif;
                    font-size: 4.5rem;
                    color: white;
                    margin-bottom: 15px;
                    letter-spacing: -2px;
                    font-weight: 900;
                    text-transform: uppercase;
                    background: linear-gradient(180deg, #FFFFFF 0%, #777777 100%);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                }
                .launcher-header p {
                    color: #666;
                    font-size: 1.1rem;
                    max-width: 600px;
                    margin: 0 auto;
                    font-weight: 500;
                    letter-spacing: 1px;
                }
                .projects-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
                    gap: 30px;
                }
                .project-card {
                    background: rgba(10, 10, 10, 0.6);
                    border: 1px solid rgba(255,255,255,0.03);
                    border-radius: 12px;
                    padding: 40px;
                    position: relative;
                    overflow: hidden;
                    cursor: pointer;
                    transition: all 0.5s cubic-bezier(0.16, 1, 0.3, 1);
                    display: flex;
                    flex-direction: column;
                    gap: 30px;
                    backdrop-filter: blur(20px);
                }
                .project-card:hover {
                    border-color: rgba(0, 212, 189, 0.3);
                    background: rgba(20, 20, 20, 0.8);
                    box-shadow: 0 30px 60px rgba(0,0,0,0.8), 0 0 40px rgba(0,212,189,0.05) inset;
                    transform: translateY(-5px);
                }
                .card-glow {
                    position: absolute;
                    top: 0; left: 0; right: 0; height: 150px;
                    background: radial-gradient(ellipse at top, rgba(0, 212, 189, 0.15), transparent 70%);
                    opacity: 0;
                    transition: opacity 0.5s;
                    pointer-events: none;
                }
                .project-card:hover .card-glow { opacity: 1; }
                
                .project-type {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    font-size: 9px;
                    font-weight: 900;
                    letter-spacing: 3px;
                    color: #666;
                    text-transform: uppercase;
                }
                .project-card:hover .project-type {
                    color: var(--accent-turquoise);
                }
                .project-icon {
                    width: 64px;
                    height: 64px;
                    background: rgba(255,255,255,0.02);
                    border-radius: 16px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: #888;
                    border: 1px solid rgba(255,255,255,0.05);
                    transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                }
                .project-card:hover .project-icon {
                    background: rgba(0, 212, 189, 0.1);
                    color: var(--accent-turquoise);
                    border-color: rgba(0, 212, 189, 0.3);
                    transform: scale(1.1) rotate(-5deg);
                    box-shadow: 0 10px 20px rgba(0,0,0,0.5);
                }
                .project-info h3 {
                    font-size: 1.5rem;
                    color: white;
                    margin-bottom: 10px;
                    font-family: 'Inter', sans-serif;
                    font-weight: 700;
                    letter-spacing: -0.5px;
                }
                .repo-path {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    font-size: 11px;
                    color: #555;
                    font-family: 'JetBrains Mono', monospace;
                }
                .project-meta {
                    display: flex;
                    gap: 40px;
                    padding-top: 30px;
                    border-top: 1px solid rgba(255,255,255,0.05);
                }
                .meta-item {
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                }
                .meta-item .label {
                    font-size: 9px;
                    font-weight: 800;
                    color: #555;
                    letter-spacing: 2px;
                    text-transform: uppercase;
                }
                .meta-item .value {
                    font-size: 12px;
                    color: #ccc;
                    font-weight: 600;
                }
                .status-badge {
                    font-size: 9px;
                    font-weight: 900;
                    padding: 4px 8px;
                    border-radius: 4px;
                    letter-spacing: 1px;
                }
                .status-badge.online { background: rgba(0, 212, 189, 0.1); color: var(--accent-turquoise); border: 1px solid rgba(0, 212, 189, 0.2); }
                .status-badge.ready { background: rgba(255, 255, 255, 0.05); color: #aaa; border: 1px solid rgba(255, 255, 255, 0.1); }
                .status-badge.draft { background: rgba(212, 168, 67, 0.1); color: #d4a843; border: 1px solid rgba(212, 168, 67, 0.25); }

                .stitch-badge {
                    display: inline-flex;
                    align-items: center;
                    background: rgba(100, 180, 255, 0.1);
                    color: #64b4ff;
                    border: 1px solid rgba(100, 180, 255, 0.2);
                    border-radius: 3px;
                    font-size: 8px;
                    font-weight: 900;
                    padding: 2px 6px;
                    letter-spacing: 1px;
                    margin-left: 8px;
                }

                .btn-stitch-preview {
                    display: flex;
                    align-items: center;
                    background: rgba(100, 180, 255, 0.05);
                    color: #64b4ff;
                    border: 1px solid rgba(100, 180, 255, 0.2);
                    border-radius: 6px;
                    font-size: 9px;
                    font-weight: 800;
                    padding: 8px 14px;
                    letter-spacing: 2px;
                    cursor: pointer;
                    transition: all 0.3s;
                    width: 100%;
                    justify-content: center;
                }
                .btn-stitch-preview:hover {
                    background: rgba(100, 180, 255, 0.15);
                    border-color: rgba(100, 180, 255, 0.5);
                    color: #a8d4ff;
                }
                

                .card-action {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    font-size: 11px;
                    font-weight: 900;
                    letter-spacing: 3px;
                    color: var(--accent-turquoise);
                    opacity: 0;
                    transform: translateX(-15px);
                    transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
                    margin-top: 10px;
                }
                .project-card:hover .card-action {
                    opacity: 1;
                    transform: translateX(0);
                }
                
                .add-new {
                    border: 1px dashed rgba(255,255,255,0.1);
                    background: transparent;
                    text-align: center;
                    justify-content: center;
                    padding: 0;
                }
                .add-new:hover {
                    border-style: solid;
                }
                .add-content {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 15px;
                    padding: 40px;
                    height: 100%;
                    justify-content: center;
                }
                .outline-icon {
                    background: transparent;
                    border: 1px dashed rgba(255,255,255,0.2);
                }
                .add-new:hover .outline-icon {
                    border-style: solid;
                    background: white;
                }
                .add-new h3 { font-size: 1.3rem; color: #888; font-family: 'Inter', sans-serif; font-weight: 700; }
                .add-new p { font-size: 12px; color: #444; line-height: 1.5; max-width: 80%; }
                .btn-add {
                    margin-top: 20px;
                    background: none;
                    border: 1px solid #333;
                    color: #888;
                    padding: 12px 24px;
                    border-radius: 4px;
                    font-size: 10px;
                    font-weight: 800;
                    letter-spacing: 2px;
                    cursor: pointer;
                    transition: 0.3s;
                }
                .add-new:hover .btn-add {
                    border-color: var(--accent-turquoise);
                    color: var(--accent-turquoise);
                    background: rgba(0, 212, 189, 0.05);
                }
                .launcher-footer {
                    margin-top: 100px;
                    display: flex;
                    justify-content: center;
                }
                .system-status {
                    display: flex;
                    align-items: center;
                    gap: 15px;
                    padding: 12px 24px;
                    background: rgba(0,0,0,0.5);
                    border: 1px solid rgba(255,255,255,0.05);
                    border-radius: 30px;
                    backdrop-filter: blur(10px);
                }
                .status-text {
                    font-size: 10px;
                    font-weight: 800;
                    color: #666;
                    letter-spacing: 3px;
                }
                .status-indicator {
                    position: relative;
                    width: 8px; height: 8px;
                }
                .pulse-dot {
                    position: absolute;
                    inset: 0;
                    background: var(--accent-turquoise);
                    border-radius: 50%;
                    z-index: 2;
                }
                .pulse-ring {
                    position: absolute;
                    inset: -4px;
                    border: 1px solid var(--accent-turquoise);
                    border-radius: 50%;
                    animation: pulseRing 2s cubic-bezier(0.215, 0.61, 0.355, 1) infinite;
                    z-index: 1;
                }
                @keyframes pulseRing {
                    0% { transform: scale(0.5); opacity: 1; }
                    100% { transform: scale(2.5); opacity: 0; }
                }

                /* MODAL STYLES */
                .modal-overlay {
                    position: fixed;
                    inset: 0;
                    background: rgba(0,0,0,0.85);
                    backdrop-filter: blur(20px);
                    z-index: 100000;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 20px;
                }
                .modal-card {
                    background: #000;
                    border: 1px solid rgba(0, 212, 189, 0.2);
                    box-shadow: 0 0 50px rgba(0, 212, 189, 0.1);
                    border-radius: 12px;
                    width: 100%;
                    max-width: 800px;
                    padding: 40px;
                    display: flex;
                    flex-direction: column;
                    gap: 20px;
                    text-align: left;
                }
                .modal-card h2 {
                    font-family: 'Inter', sans-serif;
                    font-size: 1.5rem;
                    font-weight: 900;
                    color: white;
                    letter-spacing: 1px;
                    margin: 0;
                }
                .modal-card .subtitle {
                    color: #555;
                    font-size: 0.9rem;
                    margin: -10px 0 10px 0;
                }
                .form-group {
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                }
                .form-group label {
                    font-size: 10px;
                    font-weight: 800;
                    color: #888;
                    letter-spacing: 1.5px;
                    text-transform: uppercase;
                }
                .form-group input {
                    background: rgba(255,255,255,0.03);
                    border: 1px solid rgba(255,255,255,0.08);
                    color: white;
                    padding: 12px 16px;
                    border-radius: 6px;
                    font-size: 13px;
                    font-family: 'Montserrat', sans-serif;
                    transition: 0.3s;
                }
                .form-group input:focus {
                    outline: none;
                    border-color: rgba(0, 212, 189, 0.5);
                    background: rgba(0, 212, 189, 0.02);
                }
                .template-selector {
                    display: grid;
                    grid-template-columns: 1fr 1fr 1fr;
                    gap: 15px;
                    margin-top: 5px;
                }
                .template-option {
                    background: rgba(255,255,255,0.02);
                    border: 1px solid rgba(255,255,255,0.05);
                    border-radius: 8px;
                    padding: 20px;
                    cursor: pointer;
                    transition: 0.3s;
                }
                .template-option:hover {
                    background: rgba(255,255,255,0.04);
                    border-color: rgba(255,255,255,0.1);
                }
                .template-option.active {
                    background: rgba(0, 212, 189, 0.04);
                    border-color: rgba(0, 212, 189, 0.4);
                }
                .option-title {
                    color: white;
                    font-weight: 700;
                    font-size: 14px;
                    margin-bottom: 5px;
                }
                .template-option.active .option-title {
                    color: #00d4bd;
                }
                .option-desc {
                    color: #555;
                    font-size: 11px;
                    line-height: 1.4;
                }
                .modal-actions {
                    display: flex;
                    justify-content: flex-end;
                    gap: 15px;
                    margin-top: 15px;
                }
                .btn-cancel {
                    background: none;
                    border: 1px solid rgba(255,255,255,0.1);
                    color: #888;
                    padding: 12px 24px;
                    border-radius: 4px;
                    font-size: 10px;
                    font-weight: 800;
                    letter-spacing: 2px;
                    cursor: pointer;
                    transition: 0.3s;
                }
                .btn-cancel:hover {
                    color: white;
                    border-color: rgba(255,255,255,0.3);
                }
                .btn-confirm {
                    background: #00d4bd;
                    border: 1px solid #00d4bd;
                    color: black;
                    padding: 12px 24px;
                    border-radius: 4px;
                    font-size: 10px;
                    font-weight: 800;
                    letter-spacing: 2px;
                    cursor: pointer;
                    transition: 0.3s;
                    box-shadow: 0 4px 15px rgba(0,212,189,0.3);
                }
                .btn-confirm:hover {
                    transform: translateY(-1px);
                    box-shadow: 0 6px 20px rgba(0,212,189,0.5);
                }
                .btn-confirm:disabled, .btn-cancel:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                }
            `}</style>
        </div>
    );
}
