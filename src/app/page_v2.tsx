'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { FileText, Image as ImageIcon, Layout } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import EditorSEO from '@/components/EditorSEO';
import BibliotecaIA from '@/components/BibliotecaIA';
import CatalogHub from '@/components/CatalogHub';
import { useWebContent } from '@/hooks/useWebContent';

export default function Home() {
  const { content, loading: contentLoading, refetch: refetchContent } = useWebContent();
  const [isEditorSEOOpen, setIsEditorSEOOpen] = useState(false);
  const [isBibliotecaOpen, setIsBibliotecaOpen] = useState(false);
  const [isCatalogHubOpen, setIsCatalogHubOpen] = useState(false);

  if (contentLoading) return <div>Cargando...</div>;

  return (
    <main>
      <nav className='nav-premium'>
        <button onClick={() => setIsEditorSEOOpen(true)}>SEO</button>
        <button onClick={() => setIsBibliotecaOpen(true)}>IA</button>
        <button onClick={() => setIsCatalogHubOpen(true)}>HUB</button>
      </nav>
      <h1>RESTAURANDO...</h1>
      <EditorSEO isOpen={isEditorSEOOpen} onClose={() => setIsEditorSEOOpen(false)} onContentUpdate={refetchContent} />
      {isBibliotecaOpen && <BibliotecaIA onClose={() => setIsBibliotecaOpen(false)} />}
      <CatalogHub isOpen={isCatalogHubOpen} onClose={() => setIsCatalogHubOpen(false)} />
    </main>
  );
}