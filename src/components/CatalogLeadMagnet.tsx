import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Mail, User, Briefcase, CheckCircle, Download } from 'lucide-react';

export default function CatalogLeadMagnet() {
    const [status, setStatus] = useState<'idle' | 'loading' | 'success'>('idle');
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        company: ''
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.email) return;

        setStatus('loading');

        // Simular envío a Supabase o email service
        setTimeout(() => {
            setStatus('success');
            console.log('Lead captured:', formData);
        }, 1500);
    };

    return (
        <section className="lead-magnet-container">
            <div className="lead-magnet-card">
                <AnimatePresence mode="wait">
                    {status !== 'success' ? (
                        <motion.div
                            key="form"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="lead-inner"
                        >
                            <div className="lead-header">
                                <h3 className="lead-title">OBTÉN NUESTRO CATÁLOGO 2026</h3>
                            </div>

                            <form onSubmit={handleSubmit} className="lead-form">
                                <div className="input-group">
                                    <div className="input-wrapper">
                                        <User size={16} className="input-icon" />
                                        <input
                                            type="text"
                                            placeholder="Nombre"
                                            required
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            className="lead-input"
                                        />
                                    </div>
                                    <div className="input-wrapper">
                                        <Mail size={16} className="input-icon" />
                                        <input
                                            type="email"
                                            placeholder="Email Corporativo"
                                            required
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                            className="lead-input"
                                        />
                                    </div>
                                    <div className="input-wrapper">
                                        <Briefcase size={16} className="input-icon" />
                                        <input
                                            type="text"
                                            placeholder="Empresa"
                                            value={formData.company}
                                            onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                                            className="lead-input"
                                        />
                                    </div>
                                </div>

                                <motion.button
                                    whileHover={{ scale: 1.01 }}
                                    whileTap={{ scale: 0.99 }}
                                    type="submit"
                                    className="lead-submit"
                                    disabled={status === 'loading'}
                                >
                                    {status === 'loading' ? 'PROCESANDO...' : 'SOLICITAR ACCESO AL CATÁLOGO'}
                                    <Send size={14} style={{ marginLeft: '12px', opacity: 0.7 }} />
                                </motion.button>
                            </form>

                            <div className="lead-footer-trend">
                                TENDENCIA 2026 &nbsp;&bull;&nbsp; ECOMOVING PREMIUM &nbsp;&bull;&nbsp; CATÁLOGO ESTRATÉGICO
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="success"
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="lead-success"
                        >
                            <CheckCircle size={40} className="success-icon" />
                            <h3 className="success-title">ACCESO CONCEDIDO</h3>
                            <p className="success-subtitle">El catálogo exclusivo 2026 ha sido enviado a <strong>{formData.email}</strong>.</p>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <style jsx>{`
                .lead-magnet-container {
                    padding: 100px 0;
                    display: flex;
                    justify-content: center;
                    border-top: 1px solid rgba(255, 255, 255, 0.02);
                }
                .lead-magnet-card {
                    background: rgba(8, 8, 8, 0.4);
                    backdrop-filter: blur(30px);
                    border: 1px solid rgba(255, 255, 255, 0.03);
                    padding: 100px 80px;
                    width: 100%;
                    max-width: 1200px;
                    border-radius: 2px;
                    position: relative;
                    overflow: hidden;
                    box-shadow: 0 60px 120px rgba(0,0,0,0.9);
                }
                .lead-magnet-card::after {
                    content: '';
                    position: absolute;
                    top: -50%;
                    left: -50%;
                    width: 200%;
                    height: 200%;
                    background: radial-gradient(circle, rgba(0, 212, 189, 0.05) 0%, transparent 60%);
                    z-index: 0;
                    pointer-events: none;
                }
                .lead-magnet-card::before {
                    content: '';
                    position: absolute;
                    top: 0; left: 0; right: 0;
                    height: 1px;
                    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
                    opacity: 0.2;
                }
                .lead-inner {
                    text-align: center;
                    position: relative;
                    z-index: 1;
                }
                .lead-title {
                    font-family: var(--font-heading);
                    font-size: 3rem;
                    color: white;
                    letter-spacing: 15px;
                    margin-bottom: 60px;
                    line-height: 1.1;
                    font-weight: 200;
                    background: linear-gradient(to right, #fff 20%, var(--accent-turquoise) 100%);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                }
                .lead-subtitle {
                    color: #777;
                    font-size: 0.9rem;
                    letter-spacing: 3px;
                    margin-bottom: 60px;
                    max-width: 600px;
                    margin-left: auto;
                    margin-right: auto;
                    text-transform: uppercase;
                    font-weight: 300;
                }

                .lead-form {
                    display: flex;
                    flex-direction: column;
                    gap: 30px;
                }
                .input-group {
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: 20px;
                }
                @media (max-width: 900px) {
                    .input-group {
                        grid-template-columns: 1fr;
                    }
                    .lead-magnet-card {
                        padding: 60px 40px;
                    }
                    .lead-title {
                        font-size: 1.8rem;
                        letter-spacing: 6px;
                    }
                }
                .input-wrapper {
                    position: relative;
                    display: flex;
                    align-items: center;
                }
                .input-icon {
                    position: absolute;
                    left: 20px;
                    color: #333;
                    transition: all 0.3s;
                }
                .lead-input {
                    width: 100%;
                    background: transparent;
                    border: 1px solid rgba(255, 255, 255, 0.05);
                    padding: 24px 20px 24px 55px;
                    color: white;
                    font-size: 0.85rem;
                    border-radius: 0;
                    outline: none;
                    transition: all 0.5s;
                    font-family: var(--font-body);
                    letter-spacing: 2px;
                    text-transform: uppercase;
                }
                .lead-input:focus {
                    border-color: rgba(255, 255, 255, 0.2);
                    background: rgba(255, 255, 255, 0.01);
                }
                .lead-input:focus + .input-icon {
                    color: white;
                    opacity: 0.5;
                }
                .lead-submit {
                    background: white;
                    color: black;
                    border: none;
                    padding: 26px 50px;
                    font-weight: 900;
                    text-transform: uppercase;
                    letter-spacing: 5px;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 0.9rem;
                    border-radius: 0;
                    transition: all 0.6s cubic-bezier(0.16, 1, 0.3, 1);
                    margin-top: 20px;
                }
                .lead-submit:hover:not(:disabled) {
                    background: #eee;
                    box-shadow: 0 20px 60px rgba(255, 255, 255, 0.05);
                    transform: translateY(-2px);
                }
                .lead-submit:disabled {
                    opacity: 0.2;
                    cursor: not-allowed;
                }
                .lead-footer-trend {
                    margin-top: 80px;
                    padding-top: 40px;
                    border-top: 1px solid rgba(255, 255, 255, 0.02);
                    color: #444;
                    font-size: 0.65rem;
                    letter-spacing: 8px;
                    text-transform: uppercase;
                    font-weight: 900;
                    transition: color 1s;
                }
                .lead-footer-trend:hover {
                    color: #888;
                }
                .lead-success {
                    text-align: center;
                    padding: 80px 0;
                }
                .success-icon {
                    color: white;
                    margin-bottom: 40px;
                    opacity: 0.2;
                }
                .success-title {
                    font-family: var(--font-heading);
                    font-size: 3rem;
                    color: white;
                    letter-spacing: 15px;
                    margin-bottom: 30px;
                    font-weight: 200;
                }
                .success-subtitle {
                    color: #666;
                    font-size: 1.1rem;
                    max-width: 500px;
                    margin: 0 auto;
                    line-height: 2.2;
                    letter-spacing: 2px;
                    font-weight: 300;
                }
            `}</style>
        </section>
    );
}

