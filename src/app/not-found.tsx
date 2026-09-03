'use client';

import React from 'react';

export default function NotFound() {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      backgroundColor: '#0a0a0a',
      color: '#ffffff',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      textAlign: 'center',
      padding: '20px'
    }}>
      <h1 style={{ fontSize: '3rem', marginBottom: '10px', fontWeight: '900', letterSpacing: '-1px' }}>404</h1>
      <p style={{ fontSize: '1.2rem', color: '#888', marginBottom: '30px' }}>Página no encontrada</p>
      <a href="/" style={{
        padding: '10px 24px',
        backgroundColor: '#00d4bd',
        color: '#000000',
        borderRadius: '6px',
        fontWeight: '700',
        textDecoration: 'none',
        fontSize: '0.9rem',
        transition: 'all 0.2s'
      }}>
        Volver al Inicio
      </a>
    </div>
  );
}
