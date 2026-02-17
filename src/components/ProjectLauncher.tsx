
'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Rocket, Github, Globe, Settings, ArrowRight, ShieldCheck, Zap, FolderDot } from 'lucide-react';

interface Project {
    id: string;
    name: string;
    repo: string;
    path: string;
    lastExport: string;
    type: 'public' | 'internal';
    status: 'online' | 'ready';
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
        id: 'ecomoving-admin',
        name: 'Ecomoving | Admin Control Hub',
        repo: 'ecomovingspa-dev/EcomovingWeb',
        path: 'c:/Users/Mario/Desktop/EcomovingWeb',
        lastExport: 'Original',
        type: 'internal',
        status: 'ready'
    }
];

export default function ProjectLauncher({ onSelect }: { onSelect: (project: Project) => void }) {
    const [hovered, setHovered] = useState<string | null>(null);

    return (
        <div className="launcher-overlay">
            <div className="launcher-container">
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="launcher-header"
                >
                    <div className="brand-badge">ECOMOVING ENGINE v2.0</div>
                    <h1>Manejador de Proyectos</h1>
                    <p>Seleccione el entorno de trabajo para comenzar la sesión de diseño y exportación.</p>
                </motion.div>

                <div className="projects-grid">
                    {PROJECTS.map((project) => (
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
                            <div className="project-type">
                                {project.type === 'public' ? <Globe size={14} /> : <ShieldCheck size={14} />}
                                {project.type.toUpperCase()}
                            </div>

                            <div className="project-icon">
                                {project.type === 'public' ? <Zap size={32} /> : <Rocket size={32} />}
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

                            <div className="card-action">
                                <span>ABRIR ENTORNO</span>
                                <ArrowRight size={16} />
                            </div>
                        </motion.div>
                    ))}

                    <motion.div className="project-card add-new">
                        <div className="project-icon">
                            <FolderDot size={32} />
                        </div>
                        <h3>Nuevo Proyecto</h3>
                        <p>Vincular un nuevo repositorio de GitHub o carpeta local.</p>
                        <button className="btn-add">CONFIGURAR</button>
                    </motion.div>
                </div>

                <div className="launcher-footer">
                    <div className="system-status">
                        <div className="pulse-dot"></div>
                        Sincronización con GitHub Activa
                    </div>
                </div>
            </div>

            <style jsx>{`
                .launcher-overlay {
                    position: fixed;
                    inset: 0;
                    background: radial-gradient(circle at center, #0a0a0a 0%, #000 100%);
                    z-index: 99999;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 40px;
                    overflow-y: auto;
                    font-family: 'Montserrat', sans-serif;
                }
                .launcher-container {
                    width: 100%;
                    max-width: 1200px;
                }
                .launcher-header {
                    text-align: center;
                    margin-bottom: 60px;
                }
                .brand-badge {
                    display: inline-block;
                    padding: 6px 12px;
                    background: rgba(0, 212, 189, 0.1);
                    color: var(--accent-turquoise);
                    border: 1px solid rgba(0, 212, 189, 0.2);
                    border-radius: 4px;
                    font-size: 10px;
                    font-weight: 800;
                    letter-spacing: 2px;
                    margin-bottom: 20px;
                }
                .launcher-header h1 {
                    font-family: 'Cinzel', serif;
                    font-size: 3.5rem;
                    color: white;
                    margin-bottom: 15px;
                    letter-spacing: -1px;
                }
                .launcher-header p {
                    color: #666;
                    font-size: 1.1rem;
                    max-width: 600px;
                    margin: 0 auto;
                }
                .projects-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
                    gap: 30px;
                }
                .project-card {
                    background: #080808;
                    border: 1px solid rgba(255,255,255,0.05);
                    border-radius: 20px;
                    padding: 40px;
                    position: relative;
                    overflow: hidden;
                    cursor: pointer;
                    transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
                    display: flex;
                    flex-direction: column;
                    gap: 30px;
                }
                .project-card:hover {
                    border-color: rgba(0, 212, 189, 0.4);
                    background: #0c0c0c;
                    box-shadow: 0 40px 80px rgba(0,0,0,0.6);
                }
                .card-glow {
                    position: absolute;
                    top: 0; left: 0; right: 0; height: 100px;
                    background: linear-gradient(to bottom, rgba(0, 212, 189, 0.05), transparent);
                    opacity: 0;
                    transition: opacity 0.4s;
                }
                .project-card:hover .card-glow { opacity: 1; }
                
                .project-type {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    font-size: 9px;
                    font-weight: 900;
                    letter-spacing: 2px;
                    color: #555;
                }
                .project-icon {
                    width: 70px;
                    height: 70px;
                    background: #111;
                    border-radius: 16px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                    border: 1px solid rgba(255,255,255,0.05);
                }
                .project-card:hover .project-icon {
                    background: var(--accent-turquoise);
                    color: black;
                    transform: scale(1.05) rotate(-5deg);
                }
                .project-info h3 {
                    font-size: 1.6rem;
                    color: white;
                    margin-bottom: 8px;
                    font-family: 'Cinzel', serif;
                }
                .repo-path {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    font-size: 11px;
                    color: #444;
                }
                .project-meta {
                    display: flex;
                    gap: 30px;
                    padding-top: 30px;
                    border-top: 1px solid rgba(255,255,255,0.03);
                }
                .meta-item {
                    display: flex;
                    flex-direction: column;
                    gap: 5px;
                }
                .meta-item .label {
                    font-size: 8px;
                    font-weight: 800;
                    color: #444;
                    letter-spacing: 1px;
                }
                .meta-item .value {
                    font-size: 12px;
                    color: #999;
                    font-weight: 600;
                }
                .status-badge {
                    font-size: 9px;
                    font-weight: 900;
                    padding: 2px 6px;
                    border-radius: 4px;
                }
                .status-badge.online { background: rgba(0, 212, 189, 0.1); color: var(--accent-turquoise); }
                .status-badge.ready { background: rgba(255, 255, 255, 0.05); color: #888; }
                
                .card-action {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    font-size: 11px;
                    font-weight: 900;
                    letter-spacing: 2px;
                    color: var(--accent-turquoise);
                    opacity: 0;
                    transform: translateX(-10px);
                    transition: all 0.4s;
                }
                .project-card:hover .card-action {
                    opacity: 1;
                    transform: translateX(0);
                }
                
                .add-new {
                    border: 1px dashed rgba(255,255,255,0.1);
                    background: transparent;
                    align-items: center;
                    justify-content: center;
                    text-align: center;
                    gap: 15px;
                }
                .add-new h3 { font-size: 1.2rem; color: #444; }
                .add-new p { font-size: 11px; color: #333; }
                .btn-add {
                    margin-top: 20px;
                    background: none;
                    border: 1px solid #222;
                    color: #555;
                    padding: 10px 20px;
                    border-radius: 4px;
                    font-size: 10px;
                    font-weight: 800;
                    cursor: pointer;
                    transition: 0.3s;
                }
                .btn-add:hover {
                    border-color: #444;
                    color: white;
                }
                .launcher-footer {
                    margin-top: 80px;
                    display: flex;
                    justify-content: center;
                }
                .system-status {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    font-size: 10px;
                    font-weight: 700;
                    color: #333;
                    text-transform: uppercase;
                    letter-spacing: 2px;
                }
                .pulse-dot {
                    width: 6px;
                    height: 6px;
                    background: var(--accent-turquoise);
                    border-radius: 50%;
                    box-shadow: 0 0 10px var(--accent-turquoise);
                    animation: pulse 2s infinite;
                }
                @keyframes pulse {
                    0% { transform: scale(1); opacity: 1; }
                    50% { transform: scale(1.5); opacity: 0.5; }
                    100% { transform: scale(1); opacity: 1; }
                }
            `}</style>
        </div>
    );
}
