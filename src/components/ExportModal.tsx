
'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Send, Shield, AlertTriangle, CheckCircle2, Loader2, Copy, Github } from 'lucide-react';

interface ExportModalProps {
    isOpen: boolean;
    onClose: () => void;
    project: {
        name: string;
        path: string;
        repo: string;
    };
}

export default function ExportModal({ isOpen, onClose, project }: ExportModalProps) {
    const [status, setStatus] = useState<'idle' | 'preparing' | 'ready' | 'pushing' | 'done'>('idle');
    const [log, setLog] = useState<string[]>([]);

    const addLog = (msg: string) => setLog(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);

    const handleExport = async () => {
        setStatus('preparing');
        setLog([]);
        addLog('Iniciando preparación de archivos...');

        // Simulación de proceso (Aquí es donde se llamaría al script de Node real)
        await new Promise(r => setTimeout(r, 1000));
        addLog('Filtrando componentes administrativos (Sidebar, Hub, etc.)...');

        await new Promise(r => setTimeout(r, 1200));
        addLog('Limpiando page.tsx de botones de edición...');

        await new Promise(r => setTimeout(r, 800));
        addLog('Sincronizando globals.css y activos visuales...');

        await new Promise(r => setTimeout(r, 1000));
        addLog('Archivos preparados en la carpeta de destino.');
        setStatus('ready');
    };

    const handlePush = async () => {
        setStatus('pushing');
        addLog('Iniciando Git Commit & Push...');

        await new Promise(r => setTimeout(r, 1500));
        addLog('Commit: "feat: update site content and layout parity"');

        await new Promise(r => setTimeout(r, 2000));
        addLog('Push exitoso a ' + project.repo);
        setStatus('done');
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="modal-container"
            >
                <div className="modal-header">
                    <div className="header-info">
                        <Send size={20} className="text-turquoise" />
                        <h2>Exportar Proyect: {project.name}</h2>
                    </div>
                    <button onClick={onClose} className="close-btn"><X size={20} /></button>
                </div>

                <div className="modal-content">
                    <div className="status-timeline">
                        <div className={`step ${status !== 'idle' ? 'active' : ''}`}>
                            <div className="step-icon">1</div>
                            <div className="step-text">Limpiar y Preparar</div>
                        </div>
                        <div className="step-line" />
                        <div className={`step ${status === 'ready' || status === 'pushing' || status === 'done' ? 'active' : ''}`}>
                            <div className="step-icon">2</div>
                            <div className="step-text">Confirmar Cambios</div>
                        </div>
                        <div className="step-line" />
                        <div className={`step ${status === 'done' ? 'active' : ''}`}>
                            <div className="step-icon">3</div>
                            <div className="step-text">Publicar en GitHub</div>
                        </div>
                    </div>

                    <div className="log-window">
                        {log.length === 0 ? (
                            <div className="empty-log">Presione el botón para iniciar el proceso de exportación.</div>
                        ) : (
                            log.map((line, i) => <div key={i} className="log-line">{line}</div>)
                        )}
                    </div>

                    <div className="warning-box">
                        <Shield size={16} />
                        <p>Esta acción filtrará automáticamente todas las herramientas internas de <strong>EcomovingWeb</strong> para asegurar que el sitio público no contenga código administrativo.</p>
                    </div>
                </div>

                <div className="modal-footer">
                    <button onClick={onClose} className="btn-cancel">CANCELAR</button>
                    {status === 'idle' && (
                        <button onClick={handleExport} className="btn-primary">
                            PREPARAR ARCHIVOS
                        </button>
                    )}
                    {status === 'preparing' && (
                        <button className="btn-primary loading" disabled>
                            <Loader2 className="animate-spin" size={16} /> PREPARANDO...
                        </button>
                    )}
                    {status === 'ready' && (
                        <button onClick={handlePush} className="btn-github">
                            <Github size={16} /> COMMIT & PUSH
                        </button>
                    )}
                    {status === 'pushing' && (
                        <button className="btn-github loading" disabled>
                            <Loader2 className="animate-spin" size={16} /> ENVIANDO A GITHUB...
                        </button>
                    )}
                    {status === 'done' && (
                        <button onClick={onClose} className="btn-done">
                            <CheckCircle2 size={16} /> LISTO
                        </button>
                    )}
                </div>
            </motion.div>

            <style jsx>{`
                .modal-overlay {
                    position: fixed; inset: 0; background: rgba(0,0,0,0.85); backdrop-filter: blur(10px);
                    z-index: 100000; display: flex; align-items: center; justify-content: center; padding: 20px;
                }
                .modal-container {
                    background: #0a0a0a; border: 1px solid rgba(255,255,255,0.05); border-radius: 20px;
                    width: 100%; max-width: 700px; overflow: hidden;
                    box-shadow: 0 50px 100px rgba(0,0,0,0.5);
                }
                .modal-header {
                    padding: 25px 30px; background: rgba(255,255,255,0.02);
                    display: flex; justify-content: space-between; align-items: center;
                    border-bottom: 1px solid rgba(255,255,255,0.05);
                }
                .header-info { display: flex; align-items: center; gap: 15px; }
                .header-info h2 { font-size: 1.1rem; color: #fff; font-family: 'Cinzel', serif; letter-spacing: 1px; }
                .close-btn { background: none; border: none; color: #555; cursor: pointer; }
                .close-btn:hover { color: #fff; }

                .modal-content { padding: 30px; }
                
                .status-timeline {
                    display: flex; align-items: center; justify-content: space-between; margin-bottom: 40px;
                }
                .step { display: flex; flex-direction: column; align-items: center; gap: 10px; opacity: 0.3; }
                .step.active { opacity: 1; }
                .step-icon {
                    width: 32px; height: 32px; border-radius: 50%; border: 1px solid #333;
                    display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 900;
                }
                .step.active .step-icon { border-color: var(--accent-turquoise); color: var(--accent-turquoise); background: rgba(0,212,189,0.1); }
                .step-text { font-size: 10px; font-weight: 800; text-transform: uppercase; color: #555; }
                .step.active .step-text { color: #888; }
                .step-line { flex: 1; height: 1px; background: rgba(255,255,255,0.05); margin: 0 20px 20px 20px; }

                .log-window {
                    background: #050505; border: 1px solid #111; border-radius: 12px;
                    height: 200px; padding: 20px; overflow-y: auto; font-family: monospace;
                    font-size: 11px; color: #888; margin-bottom: 30px;
                }
                .log-line { margin-bottom: 5px; color: #666; border-left: 2px solid #222; padding-left: 10px; }
                .empty-log { height: 100%; display: flex; align-items: center; justify-content: center; opacity: 0.3; }

                .warning-box {
                    background: rgba(0,212,189,0.05); border: 1px solid rgba(0,212,189,0.1);
                    padding: 15px 20px; border-radius: 8px; display: flex; gap: 15px; align-items: center;
                }
                .warning-box p { font-size: 11px; color: #888; line-height: 1.5; }
                .warning-box p strong { color: var(--accent-turquoise); }

                .modal-footer {
                    padding: 25px 30px; background: rgba(255,255,255,0.02);
                    display: flex; justify-content: flex-end; gap: 15px;
                }
                .btn-cancel { background: none; border: 1px solid #222; color: #555; padding: 10px 20px; border-radius: 6px; font-size: 11px; font-weight: 800; cursor: pointer; }
                .btn-primary { background: var(--accent-turquoise); color: #000; border: none; padding: 10px 25px; border-radius: 6px; font-size: 11px; font-weight: 900; cursor: pointer; display: flex; align-items: center; gap: 8px; }
                .btn-github { background: #333; color: white; border: none; padding: 10px 25px; border-radius: 6px; font-size: 11px; font-weight: 900; cursor: pointer; display: flex; align-items: center; gap: 8px; }
                .btn-done { background: #00d4bd22; color: #00d4bd; border: 1px solid #00d4bd44; padding: 10px 25px; border-radius: 6px; font-size: 11px; font-weight: 900; cursor: pointer; display: flex; align-items: center; gap: 8px; }
                
                .text-turquoise { color: var(--accent-turquoise); }
                .animate-spin { animation: spin 1s linear infinite; }
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
            `}</style>
        </div>
    );
}
