'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, Trash2, Download, Layers, Loader2, Save, Image as ImageIcon, Check, Star, RefreshCw, Plus, Sparkles, Send, Globe, RotateCw, FlipHorizontal, Maximize2, Minimize2, Square, RectangleHorizontal, RectangleVertical, ChevronRight, Cloud, FolderOpen } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { generateMarketingAI, generateWebAI, generateSEOFilenameAI, MarketingContent, WebSectionContent, getMarketingHTMLTemplate } from '@/lib/gemini';
import { useWebContent } from '@/hooks/useWebContent';
import { fetchDriveItems, DriveItem } from '@/services/driveService';
import MarketingBentoFactory from './MarketingBentoFactory';

interface PendingProduct {
    id: string;
    wholesaler: string;
    sku_externo: string; // Alineado con DB
    nombre: string;       // Alineado con DB
    descripcion: string;  // Alineado con DB
    images: string[];
    technical_specs: any; // Mapeado a 'features' en DB
    found_at: string;
    status: string;
    category?: string;
    is_premium?: boolean;
    seo_title?: string;
    seo_keywords?: string;
    seo_description?: string;
    for_marketing?: boolean;
}

interface CatalogHubProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function CatalogHub({ isOpen, onClose }: CatalogHubProps) {
    const [pendingProducts, setPendingProducts] = useState<PendingProduct[]>([]);
    const [selectedProduct, setSelectedProduct] = useState<PendingProduct | null>(null);

    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [customCategories, setCustomCategories] = useState<string[]>(['ECOLÓGICOS', 'BOTELLAS, MUGS Y TAZAS', 'CUADERNOS, LIBRETAS Y MEMO SET', 'MOCHILAS, BOLSOS Y MORRALES', 'BOLÍGRAFOS', 'ACCESORIOS']);
    const [isAddingCategory, setIsAddingCategory] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState('');


    const handleAddCategory = () => {
        if (!newCategoryName.trim()) return;
        const normalized = newCategoryName.trim().toUpperCase();
        if (!customCategories.includes(normalized)) {
            setCustomCategories(prev => [...prev, normalized]);
        }
        setNewCategoryName('');
        setIsAddingCategory(false);
    };
    const [activeManualImage, setActiveManualImage] = useState<string | null>(null); // Para nuevo producto
    const [catalogViewerImage, setCatalogViewerImage] = useState<string | null>(null); // LOCAL: Used strictly for viewing in Catalog tab
    const [updatedProductIds, setUpdatedProductIds] = useState<Set<string>>(new Set());
    const [insumoProductSearch, setInsumoProductSearch] = useState('');
    const [insumoSearchResults, setInsumoSearchResults] = useState<PendingProduct[]>([]);
    const [activeImage, setActiveImage] = useState<string | null>(null); // GLOBAL: Used for Hero tab preview
    const [marketingImage, setMarketingImage] = useState<string | null>(null); // EXCLUSIVO: Tab Marketing
    const [pendingFiles, setPendingFiles] = useState<Record<string, File>>({});
    const [isSaving, setIsSaving] = useState(false);
    const [isGeneratingSEO, setIsGeneratingSEO] = useState(false);
    const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<'insumo' | 'catalog' | 'gallery' | 'hero' | 'marketing'>('insumo');
    const [marketingSkuInput, setMarketingSkuInput] = useState('');
    const [marketingProductContext, setMarketingProductContext] = useState<{ nombre: string; caracteristicas: string[] } | null>(null);
    const [isSearchingSku, setIsSearchingSku] = useState(false);
    const [insumoFile, setInsumoFile] = useState<File | null>(null);
    const [insumoFiles, setInsumoFiles] = useState<File[]>([]);
    const [insumoPreview, setInsumoPreview] = useState<string | null>(null);
    const [insumoPreviews, setInsumoPreviews] = useState<string[]>([]);
    const [insumoOptimizedBlob, setInsumoOptimizedBlob] = useState<Blob | null>(null);
    const [insumoOptimizedBlobs, setInsumoOptimizedBlobs] = useState<Blob[]>([]);
    const [insumoSavingPercentage, setInsumoSavingPercentage] = useState<number>(0);
    const [insumoDestination, setInsumoDestination] = useState<'catalog' | 'gallery' | 'hero' | 'marketing'>('catalog');
    const [insumoCatalogAction, setInsumoCatalogAction] = useState<'new' | 'update'>('new');
    const [insumoUpdateMode, setInsumoUpdateMode] = useState<'append' | 'replace'>('append');
    const [insumoTransform, setInsumoTransform] = useState({
        zoom: 1,
        rotation: 0,
        flipX: false,
        aspectRatio: 'original' as any,
        offsetX: 0,
        offsetY: 0
    });
    const [isRoutingInsumo, setIsRoutingInsumo] = useState(false);
    const [insumoSource, setInsumoSource] = useState<'local' | 'drive'>('local');
    const [driveSource, setDriveSource] = useState<'google' | 'local'>('google');
    const [driveFolderId, setDriveFolderId] = useState('1Cf7jz-1Ufhewjxib2dKw_9PsOhWNSzp4');
    const [driveItems, setDriveItems] = useState<DriveItem[]>([]);
    const [driveNavigationStack, setDriveNavigationStack] = useState<string[]>([]);
    const [isFetchingDrive, setIsFetchingDrive] = useState(false);

    // Estados para Gestión de GRILLA
    const [selectedGallerySection, setSelectedGallerySection] = useState<string>('');
    const [galleryImages, setGalleryImages] = useState<string[]>([]);
    const [uploadingGallery, setUploadingGallery] = useState(false);
    const [smartMatches, setSmartMatches] = useState<any[]>([]);
    const [isSearchingMatches, setIsSearchingMatches] = useState(false);

    // Biblioteca de Marketing para REUSO en HERO
    const [marketingLibraryImages, setMarketingLibraryImages] = useState<string[]>([]);
    const [marketingLibraryLoading, setMarketingLibraryLoading] = useState(false);

    // Contexto Hero Text Edit
    const [heroForm, setHeroForm] = useState({
        title1: '',
        paragraph1: '',
        cta_text: 'EXPLORAR CATÁLOGO',
        cta_link: '/catalogo',
        text_align_h: 'center',
        text_align_v: 'center'
    });

    // AI CONTENT FACTORY STATE
    const [isGeneratingAI, setIsGeneratingAI] = useState(false);
    const [generatedMarketing, setGeneratedMarketing] = useState<MarketingContent | null>(null);
    const [generatedWeb, setGeneratedWeb] = useState<WebSectionContent | null>(null);
    const [aiStatus, setAiStatus] = useState('');

    const { content, updateSection } = useWebContent(); // Using sections from here

    // Ensure we select a valid section on load
    useEffect(() => {
        if (content && content.sections && content.sections.length > 0) {
            // If nothing selected or selection invalid, pick first
            const isValid = selectedGallerySection && content.sections.some((s: any) => s.id === selectedGallerySection || s.title1 === selectedGallerySection);

            if (!isValid) {
                const first = content.sections[0];
                setSelectedGallerySection(first.id || first.title1);
            }
        } else if (!selectedGallerySection && customCategories.length > 0) {
            setSelectedGallerySection(customCategories[0]);
        }
    }, [content.sections, selectedGallerySection]);

    // Persistencia de Folder ID de Drive y Carga Automática
    useEffect(() => {
        const savedFolderId = localStorage.getItem('ecomoving_drive_folder_id');
        if (savedFolderId) {
            setDriveFolderId(savedFolderId);
        }
    }, []);

    useEffect(() => {
        if (driveFolderId) {
            localStorage.setItem('ecomoving_drive_folder_id', driveFolderId);
        }
    }, [driveFolderId]);

    useEffect(() => {
        if (!selectedProduct) {
            setSmartMatches([]);
            return;
        }

        const sku = selectedProduct.sku_externo?.trim();
        if (!sku || sku.length < 2) {
            setSmartMatches([]);
            return;
        }

        const findMatches = async () => {
            setIsSearchingMatches(true);
            try {
                const resp = await fetch(`/api/local-folder?search=${encodeURIComponent(sku)}`);
                const data = await resp.json();
                setSmartMatches(data.items || []);
            } catch (err) {
                console.error('Error in smart match:', err);
                setSmartMatches([]);
            } finally {
                setIsSearchingMatches(false);
            }
        };

        const timer = setTimeout(findMatches, 300);
        return () => clearTimeout(timer);
    }, [selectedProduct?.id, selectedProduct?.sku_externo]);


    // Actualizar estados locales de categorías para filtrado
    const [selectedCategory, setSelectedCategory] = useState<string>('TODAS');
    const [isExpandingCategories, setIsExpandingCategories] = useState(false);
    const specialCategories = ['ECOLÓGICOS', 'BOTELLAS, MUGS Y TAZAS', 'CUADERNOS, LIBRETAS Y MEMO SET', 'MOCHILAS, BOLSOS Y MORRALES', 'BOLÍGRAFOS', 'ACCESORIOS'];




    const wholesalers = ['CATÁLOGO'];

    const slugifyForSEO = (text: string) => {
        if (!text) return "";
        return text
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "") // Quitar acentos
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)+/g, '') + ".webp";
    };

    const mapProductFromDB = (item: any): PendingProduct => {
        const images = Array.isArray(item.imagenes_galeria) ? item.imagenes_galeria : (Array.isArray(item.images) ? item.images : [item.imagen_principal || item.image]);
        const validImages = images.filter(Boolean);

        return {
            id: item.id,
            wholesaler: item.wholesaler || 'Ecomoving',
            sku_externo: item.sku_externo || item.external_id || item.id_externo || '',
            nombre: item.nombre || item.name || '',
            descripcion: item.descripcion || item.original_description || '',
            images: validImages,
            category: item.categoria || item.category || 'Otros',
            is_premium: item.is_premium || false,
            technical_specs: Array.isArray(item.features) ? item.features : [],
            found_at: item.created_at || item.found_at || new Date().toISOString(),
            status: item.status || 'approved',
            seo_title: item.seo_title || '',
            seo_keywords: item.seo_keywords || '',
            seo_description: item.seo_description || '',
            for_marketing: item.for_marketing || false
        };
    };

    // Búsqueda de productos dentro de Insumos para Actualización
    useEffect(() => {
        if (!insumoProductSearch.trim()) {
            setInsumoSearchResults([]);
            return;
        }
        const lowerSearch = insumoProductSearch.toLowerCase();
        const results = pendingProducts.filter(p =>
            p.nombre.toLowerCase().includes(lowerSearch) ||
            p.sku_externo.toLowerCase().includes(lowerSearch)
        ).slice(0, 5);
        setInsumoSearchResults(results);
    }, [insumoProductSearch, pendingProducts]);

    const fetchPendingProducts = async () => {
        setLoading(true);
        try {
            // Ahora solo consultamos 'productos', que contiene tanto los aprobados como los pendientes (travasije)
            const { data, error } = await supabase
                .from('productos')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;

            const mappedData = (data || []).map(mapProductFromDB);

            setPendingProducts(mappedData);
            // Selección automática eliminada por @seo_mkt: No mostrar productos por defecto
            // if (mappedData.length > 0 && !selectedProduct) {
            //     setSelectedProduct(mappedData[0]);
            //     setCatalogViewerImage(mappedData[0].images[0]);
            // }
        } catch (error) {
            console.error('Error al cargar datos del catálogo unificado:', error);
        } finally {
            setLoading(false);
        }
    };
    // Cargar productos del buffer
    useEffect(() => {
        if (isOpen) {
            fetchPendingProducts();
        }
    }, [isOpen, activeTab]);

    const handleInsumoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        const fileArray = Array.from(files);
        setInsumoFiles(fileArray);
        setInsumoFile(fileArray[0]); // Set first as active for transformation
        setLoading(true);

        try {
            const target = insumoDestination === 'marketing' ? 'email' : 'web';
            const blobs: Blob[] = [];
            const previews: string[] = [];

            for (const file of fileArray) {
                // For now, only the first image gets the transformation applied via UI. 
                // Others are optimized with default transformation (or same if desired).
                // User can select another image in UI to transform it (TODO).
                const { blob } = await optimizeImage(file, target, file === fileArray[0] ? insumoTransform : { zoom: 1, rotation: 0, flipX: false, aspectRatio: 'original', offsetX: 0, offsetY: 0 });
                blobs.push(blob);
                previews.push(URL.createObjectURL(blob));
            }

            setInsumoOptimizedBlobs(blobs);
            setInsumoPreviews(previews);
            setInsumoOptimizedBlob(blobs[0]);
            setInsumoPreview(previews[0]);

            // Calcular ahorro del primero para feedback inmediato
            const originalSize = fileArray[0].size;
            const optimizedSize = blobs[0].size;
            const saving = Math.round(((originalSize - optimizedSize) / originalSize) * 100);
            setInsumoSavingPercentage(saving);
        } catch (err) {
            console.error('Error optimizando insumo:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleCancelInsumo = () => {
        insumoPreviews.forEach(p => URL.revokeObjectURL(p));
        setInsumoFile(null);
        setInsumoFiles([]);
        setInsumoPreview(null);
        setInsumoPreviews([]);
        setInsumoOptimizedBlob(null);
        setInsumoOptimizedBlobs([]);
        setInsumoSavingPercentage(0);
        setInsumoProductSearch('');
        setInsumoSearchResults([]);
        setInsumoTransform({
            zoom: 1,
            rotation: 0,
            flipX: false,
            aspectRatio: 'original' as any,
            offsetX: 0,
            offsetY: 0
        });
    };

    const handleDriveFetch = async (targetFolderId?: string) => {
        const idToFetch = targetFolderId || (driveSource === 'local' ? 'C:\\Users\\Mario\\Desktop' : driveFolderId);
        if (!idToFetch.trim()) return;

        setIsFetchingDrive(true);
        try {
            const apiEndpoint = driveSource === 'local' ? `/api/local-folder?path=${encodeURIComponent(idToFetch)}` : `/api/drive-folder?folderId=${idToFetch}`;
            const response = await fetch(apiEndpoint);
            const data = await response.json();

            if (data.error) throw new Error(data.error);
            setDriveItems(data.items || []);
        } catch (err: any) {
            console.error('Error fetching drive/local items:', err);
            alert('Error al acceder al origen: ' + err.message);
        } finally {
            setIsFetchingDrive(false);
        }
    };

    const handleDriveNavigate = (id: string) => {
        setDriveNavigationStack(prev => [...prev, driveSource === 'local' ? (driveItems[0]?.id.split('\\').slice(0, -1).join('\\')) || 'C:\\Users\\Mario\\Desktop' : driveFolderId]);
        if (driveSource !== 'local') setDriveFolderId(id);
        handleDriveFetch(id);
    };

    const handleDriveBack = () => {
        if (driveNavigationStack.length === 0) return;
        const newStack = [...driveNavigationStack];
        const parentId = newStack.pop()!;
        setDriveNavigationStack(newStack);
        setDriveFolderId(parentId);
        handleDriveFetch(parentId);
    };

    const handleSelectDriveImage = async (url: string) => {
        setLoading(true);
        try {
            // Si es local, la URL ya apunta a /api/local-asset, si es drive pasa por el proxy
            const finalUrl = driveSource === 'local' ? url : `/api/drive-proxy?url=${encodeURIComponent(url)}`;
            const response = await fetch(finalUrl);
            if (!response.ok) {
                console.error('Error al obtener la imagen:', response.statusText);
                setLoading(false);
                return;
            }
            const blob = await response.blob();
            const file = new File([blob], `drive-image-${Date.now()}.jpg`, { type: 'image/jpeg' });

            setInsumoFiles([file]);
            setInsumoFile(file);

            const target = insumoDestination === 'marketing' ? 'email' : 'web';
            const { blob: optimizedBlob } = await optimizeImage(file, target, insumoTransform);

            const previewUrl = URL.createObjectURL(optimizedBlob);
            setInsumoOptimizedBlobs([optimizedBlob]);
            setInsumoPreviews([previewUrl]);
            setInsumoOptimizedBlob(optimizedBlob);
            setInsumoPreview(previewUrl);

            const originalSize = file.size;
            const optimizedSize = optimizedBlob.size;
            const saving = Math.round(((originalSize - optimizedSize) / originalSize) * 100);
            setInsumoSavingPercentage(saving);

        } catch (err) {
            console.error('Error selecting drive image:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (insumoFile) {
            const timer = setTimeout(async () => {
                setLoading(true);
                try {
                    const target = insumoDestination === 'marketing' ? 'email' : 'web';
                    const { blob } = await optimizeImage(insumoFile, target, insumoTransform);
                    setInsumoOptimizedBlob(blob);

                    // Sincronizar con el array de blobs para cuando se envíen todos
                    const index = insumoFiles.indexOf(insumoFile);
                    if (index !== -1) {
                        setInsumoOptimizedBlobs(prev => {
                            const next = [...prev];
                            next[index] = blob;
                            return next;
                        });
                    }

                    if (insumoPreview) URL.revokeObjectURL(insumoPreview);
                    const newUrl = URL.createObjectURL(blob);
                    setInsumoPreview(newUrl);

                    // Sincronizar preview en el array
                    if (index !== -1) {
                        setInsumoPreviews(prev => {
                            const next = [...prev];
                            next[index] = newUrl;
                            return next;
                        });
                    }

                    const saving = Math.round(((insumoFile.size - blob.size) / insumoFile.size) * 100);
                    setInsumoSavingPercentage(saving);
                } catch (err) {
                    console.error('Error re-optimizando:', err);
                } finally {
                    setLoading(false);
                }
            }, 300);
            return () => clearTimeout(timer);
        }
    }, [insumoTransform, insumoFile]);

    const handleInsumoSend = async () => {
        if (insumoOptimizedBlobs.length === 0) {
            alert('Carga al menos una imagen');
            return;
        }

        if (insumoDestination === 'catalog' && insumoCatalogAction === 'update' && !selectedProduct) {
            alert('Atención: Debes buscar y validar (con el click) un producto existente en la lista antes de enviar la actualización.');
            return;
        }

        setIsRoutingInsumo(true);
        try {
            const publicUrls: string[] = [];
            const timestamp = Date.now();
            const extension = insumoDestination === 'marketing' ? 'jpg' : 'webp';
            const folder = insumoDestination === 'gallery' ? 'grilla' : insumoDestination === 'catalog' ? 'catalogo' : insumoDestination;

            for (let i = 0; i < insumoOptimizedBlobs.length; i++) {
                const blob = insumoOptimizedBlobs[i];
                const fileName = `INSUMO-${timestamp}-${i}.${extension}`;

                // Si es marketing, NO subimos todavía al storage (evitar guardado prematuro)
                // Nota: El flujo de marketing parece estar diseñado para una sola imagen "preparada"
                if (insumoDestination === 'marketing' && i === 0) {
                    const localUrl = URL.createObjectURL(blob);
                    // @seo_mkt: Imagen EXCLUSIVA del tab Marketing — no contamina Hero ni Grilla
                    setMarketingImage(localUrl);
                    setActiveImage(null); // Asegurar que Hero/Grilla no la vean
                    // Limpiar insumo
                    insumoPreviews.forEach(url => URL.revokeObjectURL(url));
                    setInsumoFile(null);
                    setInsumoFiles([]);
                    setInsumoPreview(null);
                    setInsumoPreviews([]);
                    setInsumoOptimizedBlob(null);
                    setInsumoOptimizedBlobs([]);
                    setInsumoSavingPercentage(0);
                    setActiveTab('marketing');
                    setIsRoutingInsumo(false);
                    return;
                }

                // Para otros destinos, subimos al storage
                const filePath = `${folder}/${fileName}`;
                const { error } = await supabase.storage
                    .from('imagenes-marketing')
                    .upload(filePath, blob, { contentType: extension === 'jpg' ? 'image/jpeg' : 'image/webp' });

                if (error) throw error;

                const { data: { publicUrl: uploadedUrl } } = supabase.storage
                    .from('imagenes-marketing')
                    .getPublicUrl(filePath);

                publicUrls.push(uploadedUrl);
            }

            if (publicUrls.length > 0) {
                setActiveImage(publicUrls[0]); // Mantener la primera como activa para previsualizaciones
            }

            if (insumoDestination === 'catalog') {
                if (insumoCatalogAction === 'update' && selectedProduct) {
                    // Actualizar producto seleccionado
                    const updatedImages = insumoUpdateMode === 'replace'
                        ? publicUrls
                        : [...selectedProduct.images, ...publicUrls];

                    handleUpdateProduct({ images: updatedImages });
                    setCatalogViewerImage(publicUrls[0]);
                    setUpdatedProductIds(prev => new Set(prev).add(selectedProduct.id));
                    setActiveTab('catalog');
                    alert(`¡Producto ${selectedProduct.nombre} actualizado (${insumoUpdateMode === 'replace' ? 'Reemplazo' : 'Anexo'}) correctamente!`);
                } else {
                    // Preparar el form de "Nuevo Producto"
                    setCatalogViewerImage(publicUrls[0]);
                    setSelectedProduct({
                        id: `new-${Date.now()}`,
                        nombre: '',
                        descripcion: '',
                        images: publicUrls,
                        wholesaler: 'Stocksur',
                        category: 'Mug',
                        sku_externo: `MAN-${Date.now().toString().slice(-6)}`,
                        is_premium: false,
                        technical_specs: [],
                        status: 'PENDING',
                        found_at: new Date().toISOString()
                    });
                    setActiveManualImage(publicUrls[0]);
                    setActiveTab('catalog');
                }
            } else if (insumoDestination === 'gallery') {
                setActiveTab('gallery');
                fetchGallery(selectedGallerySection);
            } else if (insumoDestination === 'hero') {
                setActiveTab('hero');
            } else if (insumoDestination === 'marketing') {
                setActiveTab('marketing');
            }

            // Protocolo @constructor: Limpiador de imagen post-envío
            insumoPreviews.forEach(url => URL.revokeObjectURL(url));
            setInsumoFile(null);
            setInsumoFiles([]);
            setInsumoPreview(null);
            setInsumoPreviews([]);
            setInsumoOptimizedBlob(null);
            setInsumoOptimizedBlobs([]);
            setInsumoSavingPercentage(0);
            if (insumoDestination === 'catalog') {
                setActiveImage(null);
            }

            alert(`¡${publicUrls.length} imágenes enviadas a ${insumoDestination.toUpperCase()} con éxito!`);
        } catch (err) {
            console.error('Error enviando insumo:', err);
            alert('Error al enviar el insumo');
        } finally {
            setIsRoutingInsumo(false);
        }
    };

    const handleProductSelect = (p: PendingProduct) => {
        setSelectedProduct(p);
        setCatalogViewerImage(p.images[0]);
        setActiveImage(null);
    };

    const fetchMarketingStorage = async () => {
        setMarketingLibraryLoading(true);
        try {
            // Listamos archivos del bucket 'imagenes-marketing'
            // El bucket contiene archivos MKT-xxx.jpg o INSUMO-xxx.jpg
            const { data, error } = await supabase.storage
                .from('imagenes-marketing')
                .list('', {
                    limit: 100,
                    offset: 0,
                    sortBy: { column: 'created_at', order: 'desc' }
                });

            if (error) throw error;

            if (data) {
                const urls = data
                    .filter(f => f.name.endsWith('.jpg') || f.name.endsWith('.jpeg'))
                    .map(f => {
                        const { data: { publicUrl } } = supabase.storage
                            .from('imagenes-marketing')
                            .getPublicUrl(f.name);
                        return publicUrl;
                    });
                setMarketingLibraryImages(urls);
            }
        } catch (err) {
            console.error('Error cargando biblioteca de marketing:', err);
        } finally {
            setMarketingLibraryLoading(false);
        }
    };

    // Efecto para cargar biblioteca al entrar a Hero
    useEffect(() => {
        if (isOpen && activeTab === 'hero') {
            fetchMarketingStorage();
            if (content && content.hero) {
                setHeroForm({
                    title1: content.hero.title1 || '',
                    paragraph1: content.hero.paragraph1 || '',
                    cta_text: content.hero.cta_text || 'EXPLORAR CATÁLOGO',
                    cta_link: content.hero.cta_link || '/catalogo',
                    text_align_h: content.hero.text_align_h || 'center',
                    text_align_v: content.hero.text_align_v || 'center'
                });
            }
        }
    }, [isOpen, activeTab, content]);

    // Funciones para Gestión de GRILLA
    const fetchGallery = async (section: string) => {
        try {
            const { data, error } = await supabase
                .from('web_contenido')
                .select('content')
                .eq('section', 'gallery')
                .single();

            if (error && error.code !== 'PGRST116') throw error;

            const contentData = data?.content || { sections: [] };
            const currentSection = contentData.sections?.find((s: any) => s.id === section || s.title1 === section);
            setGalleryImages(currentSection?.gallery || []);
        } catch (err) {
            console.error('Error fetching gallery section:', err);
        }
    };



    useEffect(() => {
        if (activeTab === 'gallery') {
            fetchGallery(selectedGallerySection);
        }
    }, [activeTab, selectedGallerySection, content]);

    const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        setUploadingGallery(true);
        const newImages = [...galleryImages];

        try {
            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                console.log(`?? Optimizando imagen de galería ${i + 1}/${files.length}...`);

                const { blob: optimizedBlob } = await optimizeImage(file);
                const fileName = `GALLERY-${selectedGallerySection.toUpperCase()}-${Date.now()}-${i}.webp`;

                const { data: uploadData, error: uploadError } = await supabase.storage
                    .from('imagenes-marketing')
                    .upload(`grilla/${fileName}`, optimizedBlob, { contentType: 'image/webp' });

                if (uploadError) throw uploadError;

                const { data: { publicUrl } } = supabase.storage
                    .from('imagenes-marketing')
                    .getPublicUrl(`grilla/${fileName}`);

                newImages.push(publicUrl);
            }

            // Actualizar Supabase
            const { data: currentData } = await supabase
                .from('web_contenido')
                .select('content')
                .eq('section', selectedGallerySection)
                .single();

            const updatedContent = {
                ...(currentData?.content || {}),
                gallery: newImages
            };

            const { error: updateError } = await supabase
                .from('web_contenido')
                .upsert({
                    section: selectedGallerySection,
                    content: updatedContent,
                    updated_by: 'CatalogHub-Gallery'
                }, { onConflict: 'section' });

            if (updateError) throw updateError;

            setGalleryImages(newImages);
            alert('íGalería actualizada con íxito!');
        } catch (err) {
            console.error('Error uploading gallery:', err);
            alert('Error al subir imÍgenes a la galería');
        } finally {
            setUploadingGallery(false);
        }
    };

    const handleAssignToGrilla = async () => {
        if (!activeImage || !selectedGallerySection) {
            alert('Selecciona una imagen y una sección');
            return;
        }

        setIsSaving(true);
        try {
            const { data: current } = await supabase
                .from('web_contenido')
                .select('content')
                .eq('section', 'gallery')
                .single();

            const content = current?.content || { sections: [] };
            const updatedSections = (content.sections || []).map((sec: any) => {
                if (sec.id === selectedGallerySection || sec.title1 === selectedGallerySection) {
                    const currentGallery = Array.isArray(sec.gallery) ? sec.gallery : [];
                    return { ...sec, gallery: [...currentGallery, activeImage] };
                }
                return sec;
            });

            const { error } = await supabase
                .from('web_contenido')
                .upsert({
                    section: 'gallery',
                    content: { ...content, sections: updatedSections },
                    updated_by: 'CatalogHub'
                }, { onConflict: 'section' });

            if (error) throw error;
            alert('Imagen asignada a la sección con éxito');
            setActiveImage(null); // Limpiador post-guardado
            fetchGallery(selectedGallerySection);
        } catch (err) {
            console.error('Error asignando a grilla:', err);
            alert('Error al asignar imagen');
        } finally {
            setIsSaving(false);
        }
    };

    const handleRemoveGalleryImage = async (index: number) => {
        const newImages = galleryImages.filter((_, i) => i !== index);

        try {
            const { data: currentData } = await supabase
                .from('web_contenido')
                .select('content')
                .eq('section', 'gallery')
                .single();

            const content = currentData?.content || { sections: [] };
            const updatedSections = (content.sections || []).map((sec: any) => {
                if (sec.id === selectedGallerySection || sec.title1 === selectedGallerySection) {
                    return { ...sec, gallery: newImages };
                }
                return sec;
            });

            const { error: updateError } = await supabase
                .from('web_contenido')
                .upsert({
                    section: 'gallery',
                    content: { ...content, sections: updatedSections },
                    updated_by: 'CatalogHub-Gallery'
                }, { onConflict: 'section' });

            if (updateError) throw updateError;
            setGalleryImages(newImages);
        } catch (err) {
            console.error('Error removing gallery image:', err);
        }
    };





    const handlePublish = async () => {
        if (!selectedProduct || !selectedProduct.nombre || !catalogViewerImage) {
            alert('El Título y al menos una imagen son obligatorios para guardar.');
            return;
        }

        setIsSaving(true);
        let finalMainImage = '';
        const finalImageUrls: string[] = [];

        try {
            // OPTIMIZACIÓN DE TODAS LAS IMÁGENES
            const imagesToProcess = selectedProduct.images || [];
            if (catalogViewerImage && !imagesToProcess.includes(catalogViewerImage)) {
                imagesToProcess.unshift(catalogViewerImage);
            }

            for (const imgPath of imagesToProcess) {
                const isExternal = !imgPath.includes('supabase.co');
                const isBlob = imgPath.startsWith('blob:');

                if (isExternal || isBlob) {
                    try {
                        let blob: Blob;
                        if (isBlob) {
                            const file = pendingFiles[imgPath];
                            if (file) {
                                const result = await optimizeImage(file);
                                blob = result.blob;
                            } else {
                                const res = await fetch(imgPath);
                                const originalBlob = await res.blob();
                                const result = await optimizeImage(new File([originalBlob], 'image.jpg', { type: originalBlob.type }));
                                blob = result.blob;
                            }
                        } else {
                            const res = await fetch(imgPath);
                            if (!res.ok) throw new Error('No se pudo descargar la imagen externa');
                            const originalBlob = await res.blob();
                            const result = await optimizeImage(new File([originalBlob], 'image.jpg', { type: originalBlob.type }));
                            blob = result.blob;
                        }

                        const fileName = `PROD-${selectedProduct.sku_externo}-${Date.now()}-${Math.random().toString(36).substring(2, 8)}.webp`;
                        const filePath = `catalogo/${fileName}`;

                        const { error: uploadError } = await supabase.storage
                            .from('imagenes-marketing')
                            .upload(filePath, blob, { contentType: 'image/webp' });

                        if (uploadError) throw uploadError;

                        const { data: { publicUrl } } = supabase.storage
                            .from('imagenes-marketing')
                            .getPublicUrl(filePath);

                        finalImageUrls.push(publicUrl);
                        if (imgPath === catalogViewerImage) finalMainImage = publicUrl;
                    } catch (optError: any) {
                        console.error('Fallo la optimización automática para', imgPath, optError);
                        // Si falla pero es blob, no podemos enviarla a Supabase DB porque es inválida
                        if (!isBlob) {
                            finalImageUrls.push(imgPath);
                            if (imgPath === catalogViewerImage) finalMainImage = imgPath;
                        }
                    }
                } else {
                    finalImageUrls.push(imgPath);
                    if (imgPath === catalogViewerImage) finalMainImage = imgPath;
                }
            }

            // Garantizar que siempre haya una finalMainImage
            if (!finalMainImage && finalImageUrls.length > 0) finalMainImage = finalImageUrls[0];

            // 1. Marcar como aprobado en la tabla 'productos' con TODOS los metadatos actualizados
            const productData = {
                status: 'approved',
                wholesaler: selectedProduct.wholesaler || 'Manual',
                sku_externo: selectedProduct.sku_externo || `MAN-${Date.now().toString().slice(-6)}`,
                nombre: (selectedProduct.nombre || '').trim(),
                descripcion: (selectedProduct.descripcion || '').trim(),
                categoria: (selectedProduct.category || 'OTRO').trim().toUpperCase(),
                features: selectedProduct.technical_specs || [],
                is_premium: selectedProduct.is_premium || false,
                seo_title: selectedProduct.seo_title || '',
                seo_keywords: selectedProduct.seo_keywords || '',
                seo_description: selectedProduct.seo_description || '',
                for_marketing: selectedProduct.for_marketing || false,
                imagen_principal: finalMainImage || '',
                imagenes_galeria: [finalMainImage, ...finalImageUrls.filter((i: string) => i !== finalMainImage)].filter(Boolean)
            };

            if (selectedProduct.id.startsWith('new-')) {
                const newId = crypto.randomUUID();
                const insertData = {
                    ...productData,
                    id: newId,
                    created_at: new Date().toISOString()
                };
                const { error } = await supabase
                    .from('productos')
                    .insert([insertData]);
                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from('productos')
                    .update(productData)
                    .eq('id', selectedProduct.id);
                if (error) throw error;
            }

            // Actualizar UI
            fetchPendingProducts(); // Recargar para limpiar
            setSelectedProduct(null);
            setCatalogViewerImage(null);

            alert('¡Producto Publicado y Optimizado en el catálogo vivo!');
        } catch (error: any) {
            console.error('Error al publicar:', error);
            alert(`Error al publicar el producto: ${error.message || 'Error desconocido'}`);
        } finally {
            setIsSaving(false);
        }
    };


    const optimizeImage = async (
        file: File,
        target: 'web' | 'email' = 'web',
        transform = { zoom: 1, rotation: 0, flipX: false, aspectRatio: 'original' as any, offsetX: 0, offsetY: 0 }
    ): Promise<{ blob: Blob, width: number, height: number }> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (event) => {
                const img = new Image();
                img.src = event.target?.result as string;
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    if (!ctx) return reject('No se pudo obtener el contexto del canvas');

                    // 1. Determinar dimensiones base según Target
                    const MAX_WIDTH = target === 'web' ? 1600 : 800;
                    const QUALITY = target === 'web' ? 0.82 : 0.75;
                    const MIME_TYPE = target === 'email' ? 'image/jpeg' : 'image/webp';

                    let baseWidth = img.width;
                    let baseHeight = img.height;

                    if (img.width > MAX_WIDTH) {
                        const scaleFactor = MAX_WIDTH / img.width;
                        baseWidth = MAX_WIDTH;
                        baseHeight = img.height * scaleFactor;
                    }

                    // 2. Determinar dimensiones de salida según Aspect Ratio
                    let finalWidth = baseWidth;
                    let finalHeight = baseHeight;

                    if (transform.aspectRatio === '1:1') {
                        const side = Math.min(baseWidth, baseHeight);
                        finalWidth = side;
                        finalHeight = side;
                    } else if (transform.aspectRatio === '16:9') {
                        finalHeight = (finalWidth * 9) / 16;
                    } else if (transform.aspectRatio === '9:16') {
                        finalWidth = (finalHeight * 9) / 16;
                    }

                    canvas.width = finalWidth;
                    canvas.height = finalHeight;

                    // Para JPEG necesitamos fondo blanco (no transparencia), se aplica antes de dibujar la imagen
                    if (MIME_TYPE === 'image/jpeg') {
                        ctx.fillStyle = '#FFFFFF';
                        ctx.fillRect(0, 0, finalWidth, finalHeight);
                    }

                    // 3. Aplicar Transformaciones
                    ctx.save();
                    ctx.translate((canvas.width / 2) + transform.offsetX, (canvas.height / 2) + transform.offsetY);

                    if (transform.flipX) ctx.scale(-1, 1);
                    ctx.rotate((transform.rotation * Math.PI) / 180);

                    const drawScale = transform.zoom * (baseWidth / img.width);
                    ctx.scale(drawScale, drawScale);

                    ctx.imageSmoothingEnabled = true;
                    ctx.imageSmoothingQuality = 'high';

                    ctx.drawImage(img, -img.width / 2, -img.height / 2);
                    ctx.restore();

                    canvas.toBlob((blob) => {
                        if (blob) {
                            resolve({ blob, width: finalWidth, height: finalHeight });
                        } else {
                            reject('Error al generar blob');
                        }
                    }, MIME_TYPE, QUALITY);
                };
            };
            reader.onerror = (e) => reject(e);
        });
    };








    const handleOpenNew = () => {
        const newProduct: PendingProduct = {
            id: `new-${Date.now()}`,
            nombre: '',
            descripcion: '',
            images: [],
            wholesaler: 'Stocksur',
            category: 'Mug',
            sku_externo: `MAN-${Date.now().toString().slice(-6)}`,
            is_premium: false,
            technical_specs: [],
            status: 'PENDING',
            found_at: new Date().toISOString()
        };
        setSelectedProduct(newProduct);
        setActiveManualImage(null);
    };

    const handleUpdateProduct = (updates: Partial<PendingProduct>) => {
        if (!selectedProduct) return;
        const updated = { ...selectedProduct, ...updates };
        setSelectedProduct(updated);
        setPendingProducts(prev => prev.map(p => p.id === updated.id ? updated : p));
    };

    const handleSetAsHero = async (slideIndex: number) => {
        if (!activeImage) {
            alert('Primero selecciona o carga una imagen');
            return;
        }

        setIsSaving(true);
        try {
            const heroKey = slideIndex === 0 ? 'background_image' : `background_image_${slideIndex + 1}`;

            // Protocolo @constructor: Usar el hook oficial para sincronización reactiva inmediata
            const success = await updateSection('hero', {
                [heroKey]: activeImage,
                // Solo actualizamos el título si hay un producto seleccionado
                ...(slideIndex === 0 && selectedProduct ? { title1: (selectedProduct.seo_title || selectedProduct.nombre).toUpperCase() } : {})
            });

            if (success) {
                alert(`¡Slide Hero ${slideIndex + 1} actualizado con éxito!`);
                setActiveImage(null); // Limpiador post-guardado
                setCatalogViewerImage(null);
            } else {
                throw new Error('No se pudo actualizar la sección Hero');
            }
        } catch (err) {
            console.error('Error setting hero:', err);
            alert('Error al actualizar el Hero');
        } finally {
            setIsSaving(false);
        }
    };

    const handleSaveHeroTexts = async () => {
        setIsSaving(true);
        try {
            const success = await updateSection('hero', {
                ...content.hero,
                title1: heroForm.title1,
                paragraph1: heroForm.paragraph1,
                cta_text: heroForm.cta_text,
                cta_link: heroForm.cta_link,
                text_align_h: heroForm.text_align_h,
                text_align_v: heroForm.text_align_v
            });
            if (success) {
                alert('¡Textos y layout del Hero guardados con éxito!');
            } else {
                throw new Error('Fallo al actualizar el texto');
            }
        } catch (err) {
            console.error(err);
            alert('Error al guardar configuración del Hero');
        } finally {
            setIsSaving(false);
        }
    };

    const handleGenerateHeroAI = async () => {
        setIsGeneratingAI(true);
        setAiStatus('⚡ Conectando con IA @seo_mkt...');
        try {
            const productContext = selectedProduct ? selectedProduct.nombre : 'Merchandising Sustentable Premium';
            const descContext = selectedProduct ? selectedProduct.descripcion : 'Soluciones ecológicas corporativas para fidelizar clientes.';

            const response = await fetch('/api/generate-seo', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    technical_specs: [productContext, descContext]
                })
            });

            if (!response.ok) throw new Error('Error IA');
            const resultData = await response.json();
            const aiData = resultData.data || {};

            setHeroForm(prev => ({
                ...prev,
                title1: aiData.seo_title ? aiData.seo_title.toUpperCase() : "SOLUCIONES ECO",
                paragraph1: aiData.seo_description || "Descubre el merchandising del futuro."
            }));

            alert('¡Textos SEO-Hero generados con éxito! Puedes ajustar las cajas antes de guardar.');
        } catch (err) {
            console.error(err);
            alert('Error regenerando textos.');
        } finally {
            setIsGeneratingAI(false);
            setAiStatus('');
        }
    };

    // @seo_mkt: Búsqueda de producto por SKU — busca en sku_externo e ilike en nombre
    const handleSkuSearch = async (sku: string) => {
        const skuClean = sku.trim().toUpperCase();
        if (!skuClean) {
            setMarketingProductContext(null);
            return;
        }
        setIsSearchingSku(true);
        try {
            // Query 1: búsqueda directa por sku_externo (case-insensitive)
            const { data: bySkuData } = await supabase
                .from('productos')
                .select('nombre, sku_externo, caracteristicas, features')
                .ilike('sku_externo', skuClean)
                .limit(1);

            let found = bySkuData && bySkuData.length > 0 ? bySkuData[0] : null;

            // Query 2: fallback por nombre si no encontró por SKU
            if (!found) {
                const { data: byNameData } = await supabase
                    .from('productos')
                    .select('nombre, sku_externo, caracteristicas, features')
                    .ilike('nombre', `%${skuClean}%`)
                    .limit(1);
                found = byNameData && byNameData.length > 0 ? byNameData[0] : null;
            }

            if (!found) {
                setMarketingProductContext(null);
            } else {
                const specs: string[] = Array.isArray(found.caracteristicas)
                    ? found.caracteristicas.filter((s: any) => typeof s === 'string' && s.trim())
                    : typeof found.caracteristicas === 'string' && found.caracteristicas.trim()
                        ? [found.caracteristicas]
                        : Array.isArray(found.features)
                            ? found.features.filter((s: any) => typeof s === 'string' && s.trim())
                            : [];
                setMarketingProductContext({ nombre: found.nombre, caracteristicas: specs });
            }
        } catch (e) {
            console.error('[SKU_SEARCH]', e);
            setMarketingProductContext(null);
        } finally {
            setIsSearchingSku(false);
        }
    };

    const handleGenerateMarketingAI = async () => {
        if (!marketingImage) {
            alert('Primero envía una imagen desde la pestaña INSUMO');
            return;
        }

        const skuClean = marketingSkuInput.trim().toUpperCase();
        if (!skuClean) {
            alert('Ingresa el SKU del producto para generar contenido de marketing');
            return;
        }

        setIsGeneratingAI(true);
        setAiStatus('⚡ Consultando base de datos...');
        try {
            // PRIMARY INPUT: columna `caracteristicas` desde Supabase — ilike para ser case-insensitive
            const { data: skuResults } = await supabase
                .from('productos')
                .select('nombre, sku_externo, caracteristicas, features')
                .ilike('sku_externo', skuClean)
                .limit(1);

            const data = skuResults && skuResults.length > 0 ? skuResults[0] : null;

            if (!data) {
                throw new Error(`[FATAL_ERROR: DATA_SOURCE_EMPTY] — SKU "${skuClean}" no encontrado en la base de datos`);
            }

            // Normalizar caracteristicas (puede ser array de texto o JSON)
            const specs: string[] = Array.isArray(data.caracteristicas)
                ? data.caracteristicas.filter((s: any) => typeof s === 'string' && s.trim())
                : typeof data.caracteristicas === 'string' && data.caracteristicas.trim()
                    ? [data.caracteristicas]
                    : Array.isArray(data.features)
                        ? data.features.filter((s: any) => typeof s === 'string' && s.trim())
                        : [];

            if (specs.length === 0) {
                throw new Error(`[FATAL_ERROR: DATA_SOURCE_EMPTY] — El producto "${data.nombre}" no tiene características técnicas cargadas`);
            }

            // Actualizar el contexto de producto encontrado en UI
            setMarketingProductContext({ nombre: data.nombre, caracteristicas: specs });

            setAiStatus('🧠 Procesando con @seo_mkt...');
            const context = `CARACTERISTICAS_TECNICAS:\n${specs.join('\n')}`;
            const content = await generateMarketingAI(marketingImage, context);

            setGeneratedMarketing(content);
            setAiStatus('✨ Contenido generado con éxito');
        } catch (err: any) {
            console.error("[SEO_MKT] Error crítico:", err);
            setAiStatus('❌ ' + (err.message || 'Error'));
            alert(err.message || 'Error al generar contenido');
        } finally {
            setIsGeneratingAI(false);
            setTimeout(() => setAiStatus(''), 6000);
        }
    };

    const handleMarketingChange = (field: keyof MarketingContent, value: string) => {
        if (!generatedMarketing) return;
        const updated = { ...generatedMarketing, [field]: value };
        // Sincronizamos el HTML automíticamente al editar texto
        updated.html = getMarketingHTMLTemplate(updated.subject, updated.part1, updated.part2);
        setGeneratedMarketing(updated);
    };

    const handleSaveMarketingAI = async () => {
        if (!generatedMarketing) return;

        // @seo_mkt: Usar marketingImage exclusiva
        const imageToUse = marketingImage || null;

        if (!imageToUse) {
            alert("No hay imagen de marketing. Envía una imagen desde Insumo primero.");
            return;
        }

        setIsSaving(true);
        try {
            let finalImageUrl = imageToUse;

            // Protocolo @seo_mkt: TODAS las imágenes de marketing DEBEN ser JPG
            // Si es un Blob o una URL WebP, forzamos la conversión/subida
            const isBlob = imageToUse.startsWith('blob:');
            const isWebP = imageToUse.toLowerCase().endsWith('.webp') || !imageToUse.toLowerCase().includes('.jp');

            if (isBlob || isWebP) {
                const response = await fetch(imageToUse);
                const originalBlob = await response.blob();

                let blobToUpload = originalBlob;

                // Si no es JPEG, convertir usando un canvas temporal
                if (originalBlob.type !== 'image/jpeg') {
                    blobToUpload = await new Promise<Blob>((resolve, reject) => {
                        const img = new Image();
                        img.crossOrigin = "anonymous";
                        img.onload = () => {
                            const canvas = document.createElement('canvas');
                            canvas.width = img.width;
                            canvas.height = img.height;
                            const ctx = canvas.getContext('2d');
                            if (!ctx) return reject(new Error('Canvas context fail'));
                            ctx.fillStyle = '#FFFFFF';
                            ctx.fillRect(0, 0, canvas.width, canvas.height);
                            ctx.drawImage(img, 0, 0);
                            canvas.toBlob(b => b ? resolve(b) : reject(new Error('Blob fail')), 'image/jpeg', 0.9);
                        };
                        img.onerror = () => reject(new Error('Image load fail'));
                        img.src = URL.createObjectURL(originalBlob);
                    });
                }

                const fileName = `MKT-${Date.now()}.jpg`;
                const { error: uploadError } = await supabase.storage
                    .from('imagenes-marketing')
                    .upload(fileName, blobToUpload, { contentType: 'image/jpeg' });

                if (uploadError) throw uploadError;

                const { data: { publicUrl } } = supabase.storage
                    .from('imagenes-marketing')
                    .getPublicUrl(fileName);

                finalImageUrl = publicUrl;
            }

            const { data: lastMsg } = await supabase
                .from("marketing")
                .select("nombre_envio")
                .order("nombre_envio", { ascending: false })
                .limit(1)
                .maybeSingle();

            const nextNumber = (lastMsg?.nombre_envio || 0) + 1;
            // Asegurar que usamos la imagen correcta en el HTML final
            const finalHtml = generatedMarketing.html.replace('IMAGE_URL_PLACEHOLDER', finalImageUrl);

            // Extraer nombre de archivo de la URL
            const nombreImagen = finalImageUrl.split('/').pop() || `campaña-${nextNumber}.jpg`;

            const { error } = await supabase
                .from("marketing")
                .insert([{
                    nombre_envio: nextNumber,
                    asunto: generatedMarketing.subject,
                    cuerpo_html: finalHtml,
                    cuerpo: `${generatedMarketing.part1}\n\n${generatedMarketing.part2}`,
                    imagen_url: finalImageUrl,
                    nombre_imagen: nombreImagen,
                    activo: true
                }]);

            if (error) throw error;
            alert('¡Mensaje de marketing guardado correctamente!');
            setGeneratedMarketing(null);
            // Si era un blob, liberamos memoria
            if (imageToUse && imageToUse.startsWith('blob:')) URL.revokeObjectURL(imageToUse);
            setActiveImage(null); // Protocolo @constructor: Limpiar tras guardar
            setMarketingImage(null); // @seo_mkt: Limpiar imagen marketing post-guardado
            setMarketingSkuInput('');
            setMarketingProductContext(null);
        } catch (err: any) {
            console.error(err);
            alert('Error al guardar marketing: ' + err.message);
        } finally {
            setIsSaving(false);
        }
    };

    const handleGenerateWebAI = async () => {
        if (!selectedProduct || !activeImage) {
            alert('Selecciona una imagen primero');
            return;
        }
        setIsGeneratingAI(true);
        setAiStatus('?? Generando contenido SEO para la Web...');
        try {
            const context = `Producto: ${selectedProduct.nombre}\nCategoría: ${selectedProduct.category}`;
            const content = await generateWebAI(activeImage, context);
            setGeneratedWeb(content);
            setAiStatus('? Contenido Web generado');
        } catch (err: any) {
            console.error(err);
            setAiStatus('? Error: ' + err.message);
        } finally {
            setIsGeneratingAI(false);
            setTimeout(() => setAiStatus(''), 3000);
        }
    };

    const handleApplyWebAI = async () => {
        if (!generatedWeb || !selectedProduct) return;
        handleUpdateProduct({
            seo_title: generatedWeb.title1,
            seo_description: generatedWeb.paragraph1,
            // Guardamos el refuerzo SEO en technical_specs para que SectionComposer lo capte
            technical_specs: [
                ...selectedProduct.technical_specs,
                `TITULO_COLOR_BLOCK: ${generatedWeb.title2}`,
                `DESCRIPCION_COLOR_BLOCK: ${generatedWeb.paragraph2}`
            ]
        });
        alert('Contenido aplicado. Recuerda guardar cambios.');
        setGeneratedWeb(null);
    };


    const handleReject = async () => {
        if (!selectedProduct) return;

        if (confirm('¿Estás seguro de que quieres eliminar este producto PERMANENTEMENTE del catálogo?')) {
            try {
                const { error } = await supabase
                    .from('productos')
                    .delete()
                    .eq('id', selectedProduct.id);

                if (error) throw error;

                setPendingProducts(prev => prev.filter(p => p.id !== selectedProduct.id));
                setSelectedProduct(null);
            } catch (error) {
                console.error('Error al eliminar:', error);
            }
        }
    };

    const handleRemoveImage = (e: React.MouseEvent, imgUrl: string) => {
        e.stopPropagation();
        if (!selectedProduct) return;
        const newImages = selectedProduct.images.filter(i => i !== imgUrl);
        const updated = { ...selectedProduct, images: newImages };
        setSelectedProduct(updated);
        setPendingProducts(prev => prev.map(p => p.id === updated.id ? updated : p));
        if (activeImage === imgUrl) {
            setActiveImage(newImages[0] || null);
        }
        if (catalogViewerImage === imgUrl) {
            setCatalogViewerImage(newImages[0] || null);
        }
    };

    const filteredProducts = pendingProducts.filter(p => {
        const searchLower = search.toLowerCase();
        const matchesSearch = p.nombre.toLowerCase().includes(searchLower) ||
            p.sku_externo.toLowerCase().includes(searchLower) ||
            p.category?.toLowerCase().includes(searchLower);

        if (selectedCategory !== 'TODAS') {
            return matchesSearch && p.category?.toUpperCase() === selectedCategory.toUpperCase();
        }

        return matchesSearch;
    });

    useEffect(() => {
        if (!isOpen) return;

        // Protocolo @seo_mkt: Solo auto-seleccionar si hay un filtro ACTIVO (búsqueda o categoría específica)
        const hasActiveFilter = search.trim().length > 0 || selectedCategory !== 'TODAS';

        if (filteredProducts.length > 0) {
            // Solo actualizamos si lo seleccionado ya no está en el filtro
            const currentSelectedExists = selectedProduct && filteredProducts.some(p => p.id === selectedProduct.id);

            if (!currentSelectedExists) {
                if (hasActiveFilter) {
                    const first = filteredProducts[0];
                    setSelectedProduct(first);
                    setCatalogViewerImage(first.images[0]);
                } else {
                    // Si no hay filtro activo y no hay selección previa válida, mantenemos limpio
                    setSelectedProduct(null);
                    setCatalogViewerImage(null);
                }
            }
        } else {
            setSelectedProduct(null);
            setCatalogViewerImage(null);
        }
    }, [search, selectedCategory, pendingProducts.length, isOpen]);

    const handleAutoGenerateSEO = async () => {
        if (!selectedProduct || !selectedProduct.technical_specs || selectedProduct.technical_specs.length === 0) {
            alert("No hay características técnicas para analizar. Por favor, asegúrate de que el producto tenga especificaciones.");
            return;
        }

        setIsGeneratingSEO(true);
        try {
            const response = await fetch('/api/generate-seo', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ technical_specs: selectedProduct.technical_specs })
            });
            const result = await response.json();
            if (result.success && result.data) {
                handleUpdateProduct({
                    seo_title: result.data.seo_title || selectedProduct.seo_title,
                    seo_keywords: result.data.seo_keywords || selectedProduct.seo_keywords,
                    seo_description: result.data.seo_description || selectedProduct.seo_description
                });
            } else {
                alert(`Error al generar SEO: ${result.error || "Formato inválido"}\n\nDetalles: ${result.details || "Sin detalles"}`);
            }
        } catch (e) {
            alert("Error de conexión al generar SEO.");
            console.error(e);
        } finally {
            setIsGeneratingSEO(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    style={{
                        position: 'fixed',
                        inset: 0,
                        backgroundColor: 'rgba(0,0,0,0.92)',
                        backdropFilter: 'blur(30px)',
                        zIndex: 100000,
                        display: 'flex',
                        alignItems: 'flex-start',
                        justifyContent: 'center',
                        padding: '15px 40px'
                    }}
                >
                    <motion.div
                        initial={{ scale: 0.98, opacity: 0, y: 30 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.98, opacity: 0, y: 30 }}
                        transition={{ type: 'spring', damping: 30, stiffness: 200 }}
                        style={{
                            width: '98vw',
                            height: '92vh',
                            backgroundColor: 'rgba(5, 5, 5, 0.9)',
                            backdropFilter: 'blur(40px) saturate(180%)',
                            borderRadius: '12px',
                            border: '1px solid rgba(255, 255, 255, 0.05)',
                            display: 'flex',
                            flexDirection: 'column',
                            overflow: 'hidden',
                            boxShadow: '0 50px 100px -20px rgba(0, 0, 0, 0.8), 0 0 80px rgba(0, 212, 189, 0.05)',
                        }}
                    >
                        {/* Header Premium */}
                        <div style={{ padding: '15px 60px 5px 60px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(0,0,0,0.4)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '30px' }}>
                                <h1 style={{ margin: 0, fontSize: '30px', fontWeight: '400', color: 'white', display: 'flex', alignItems: 'center', gap: '20px', letterSpacing: '4px', fontFamily: 'var(--font-heading)' }}>
                                    <div style={{ padding: '8px', background: 'var(--accent-turquoise)', borderRadius: '4px', display: 'flex' }}>
                                        <Layers style={{ color: 'black', width: '20px', height: '20px' }} />
                                    </div>
                                    ECOMOVING <span style={{ color: 'var(--accent-gold)' }}>HUB</span>
                                </h1>

                                <div style={{ display: 'flex', gap: '30px', borderLeft: '1px solid rgba(255,255,255,0.1)', paddingLeft: '30px', marginLeft: '10px' }}>

                                    <button
                                        onClick={() => setActiveTab('insumo')}
                                        style={{ background: 'none', border: 'none', color: activeTab === 'insumo' ? 'var(--accent-turquoise)' : '#555', fontSize: '12px', fontWeight: '800', cursor: 'pointer', letterSpacing: '2px', textTransform: 'uppercase', padding: '10px 0', borderBottom: activeTab === 'insumo' ? '2px solid var(--accent-turquoise)' : '2px solid transparent', transition: 'all 0.3s' }}
                                    >
                                        INSUMO
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('catalog')}
                                        style={{ background: 'none', border: 'none', color: activeTab === 'catalog' ? 'var(--accent-turquoise)' : '#555', fontSize: '12px', fontWeight: '800', cursor: 'pointer', letterSpacing: '2px', textTransform: 'uppercase', padding: '10px 0', borderBottom: activeTab === 'catalog' ? '2px solid var(--accent-turquoise)' : '2px solid transparent', transition: 'all 0.3s' }}
                                    >
                                        CATÁLOGO
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('gallery')}
                                        style={{ background: 'none', border: 'none', color: activeTab === 'gallery' ? 'var(--accent-turquoise)' : '#555', fontSize: '12px', fontWeight: '800', cursor: 'pointer', letterSpacing: '2px', textTransform: 'uppercase', padding: '10px 0', borderBottom: activeTab === 'gallery' ? '2px solid var(--accent-turquoise)' : '2px solid transparent', transition: 'all 0.3s' }}
                                    >
                                        GRILLA
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('hero')}
                                        style={{ background: 'none', border: 'none', color: activeTab === 'hero' ? 'var(--accent-turquoise)' : '#555', fontSize: '12px', fontWeight: '800', cursor: 'pointer', letterSpacing: '2px', textTransform: 'uppercase', padding: '10px 0', borderBottom: activeTab === 'hero' ? '2px solid var(--accent-turquoise)' : '2px solid transparent', transition: 'all 0.3s' }}
                                    >
                                        HERO
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('marketing')}
                                        style={{ background: 'none', border: 'none', color: activeTab === 'marketing' ? 'var(--accent-turquoise)' : '#555', fontSize: '12px', fontWeight: '800', cursor: 'pointer', letterSpacing: '2px', textTransform: 'uppercase', padding: '10px 0', borderBottom: activeTab === 'marketing' ? '2px solid var(--accent-turquoise)' : '2px solid transparent', transition: 'all 0.3s' }}
                                    >
                                        MARKETING
                                    </button>
                                </div>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '30px' }}>
                                <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', padding: '14px', borderRadius: '50%', cursor: 'pointer', color: '#999', transition: 'all 0.3s' }}>
                                    <X size={26} />
                                </button>
                            </div>
                        </div>

                        {activeTab === 'insumo' && (
                            <div style={{ height: '650px', padding: '20px 40px', backgroundColor: '#050505', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 350px', gap: '40px', maxWidth: '1800px', margin: '0 auto', width: '100%', height: '100%' }}>

                                    {/* COLUMNA IZQUIERDA: Altura Fija Bloqueada */}
                                    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '15px', minWidth: 0 }}>

                                        {/* HEADER LOCAL: Fila 1 */}
                                        <div style={{ flexShrink: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                                                <h2 style={{ margin: 0, color: 'white', letterSpacing: '2px', fontSize: '20px', fontWeight: '300' }}>PUERTA DE <span style={{ color: 'var(--accent-turquoise)', fontWeight: '700' }}>ENTRADA</span></h2>
                                                <div style={{ display: 'flex', gap: '5px', background: 'rgba(255,255,255,0.03)', padding: '4px', borderRadius: '4px' }}>
                                                    <button
                                                        onClick={() => setInsumoSource('local')}
                                                        style={{ padding: '8px 20px', borderRadius: '4px', border: '1px solid', borderColor: insumoSource === 'local' ? 'var(--accent-turquoise)' : 'rgba(255,255,255,0.05)', backgroundColor: insumoSource === 'local' ? 'rgba(0, 212, 189, 0.1)' : 'transparent', color: insumoSource === 'local' ? 'var(--accent-turquoise)' : '#555', fontSize: '10px', fontWeight: '900', cursor: 'pointer', transition: 'all 0.3s', display: 'flex', alignItems: 'center', gap: '8px' }}
                                                    >
                                                        <Cloud size={12} /> LOCAL
                                                    </button>
                                                    <button
                                                        onClick={() => setInsumoSource('drive')}
                                                        style={{ padding: '8px 20px', borderRadius: '4px', border: '1px solid', borderColor: insumoSource === 'drive' ? 'var(--accent-gold)' : 'rgba(255,255,255,0.05)', backgroundColor: insumoSource === 'drive' ? 'rgba(212,175,55,0.1)' : 'transparent', color: insumoSource === 'drive' ? 'var(--accent-gold)' : '#555', fontSize: '10px', fontWeight: '900', cursor: 'pointer', transition: 'all 0.3s', display: 'flex', alignItems: 'center', gap: '8px' }}
                                                    >
                                                        <Star size={12} fill={insumoSource === 'drive' ? 'var(--accent-gold)' : 'none'} />
                                                        DRIVE ECOMOVING
                                                    </button>
                                                </div>

                                                {insumoPreviews.length > 0 && (
                                                    <button
                                                        onClick={handleCancelInsumo}
                                                        style={{
                                                            padding: '8px 15px',
                                                            borderRadius: '4px',
                                                            border: '1px solid rgba(255, 71, 87, 0.3)',
                                                            backgroundColor: 'rgba(255, 71, 87, 0.1)',
                                                            color: '#ff4757',
                                                            fontSize: '10px',
                                                            fontWeight: '900',
                                                            cursor: 'pointer',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '8px',
                                                            transition: 'all 0.3s'
                                                        }}
                                                        onMouseEnter={(e) => {
                                                            e.currentTarget.style.backgroundColor = 'rgba(255, 71, 87, 0.2)';
                                                            e.currentTarget.style.borderColor = 'rgba(255, 71, 87, 0.5)';
                                                        }}
                                                        onMouseLeave={(e) => {
                                                            e.currentTarget.style.backgroundColor = 'rgba(255, 71, 87, 0.1)';
                                                            e.currentTarget.style.borderColor = 'rgba(255, 71, 87, 0.3)';
                                                        }}
                                                    >
                                                        <X size={12} /> CANCELAR
                                                    </button>
                                                )}
                                            </div>
                                            {insumoSavingPercentage > 0 && (
                                                <div style={{ background: 'rgba(0, 212, 189, 0.1)', padding: '8px 15px', borderRadius: '4px', border: '1px solid var(--accent-turquoise)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                    <span style={{ fontSize: '9px', fontWeight: '800', color: 'var(--accent-turquoise)', letterSpacing: '2px' }}>AHORRO:</span>
                                                    <span style={{ fontSize: '16px', fontWeight: '900', color: 'var(--accent-turquoise)' }}>{insumoSavingPercentage}%</span>
                                                </div>
                                            )}
                                        </div>

                                        {/* VISOR FIJO: 380px (Ajuste para visibilidad total de herramientas) */}
                                        <div style={{
                                            height: '380px',
                                            backgroundColor: '#0a0a0a',
                                            borderRadius: '8px',
                                            border: '1px solid rgba(255,255,255,0.1)',
                                            position: 'relative',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            overflow: 'hidden'
                                        }}>
                                            {insumoSource === 'local' ? (
                                                insumoPreviews.length > 0 ? (
                                                    <div style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '20px' }}>
                                                        <img
                                                            src={insumoPreview || ''}
                                                            style={{ maxWidth: '80%', maxHeight: '70%', objectFit: 'contain' }}
                                                        />
                                                        {insumoPreviews.length > 1 && (
                                                            <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', padding: '10px', width: '100%', justifyContent: 'flex-start' }} className="custom-scroll">
                                                                {insumoPreviews.map((p, idx) => (
                                                                    <img
                                                                        key={idx}
                                                                        src={p}
                                                                        onClick={() => {
                                                                            setInsumoPreview(p);
                                                                            setInsumoOptimizedBlob(insumoOptimizedBlobs[idx]);
                                                                            setInsumoFile(insumoFiles[idx]);
                                                                        }}
                                                                        style={{
                                                                            flexShrink: 0,
                                                                            width: '50px',
                                                                            height: '50px',
                                                                            objectFit: 'cover',
                                                                            borderRadius: '2px',
                                                                            border: insumoPreview === p ? '2px solid var(--accent-turquoise)' : '1px solid rgba(255,255,255,0.1)',
                                                                            cursor: 'pointer'
                                                                        }}
                                                                    />
                                                                ))}
                                                            </div>
                                                        )}
                                                        <div style={{ position: 'absolute', top: '20px', right: '20px', background: 'var(--accent-gold)', color: 'black', padding: '5px 12px', borderRadius: '4px', fontSize: '10px', fontWeight: '900', letterSpacing: '1px' }}>
                                                            {insumoPreviews.length} ARCHIVOS
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div style={{ textAlign: 'center', opacity: 0.2 }}>
                                                        <label htmlFor="insumo-file" style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
                                                            <Download size={60} />
                                                            <span style={{ fontSize: '12px', fontWeight: '800', letterSpacing: '4px' }}>SUBIR ARCHIVOS BRUTOS (MULTIPLE)</span>
                                                        </label>
                                                        <input id="insumo-file" type="file" hidden onChange={handleInsumoUpload} accept="image/*" multiple />
                                                    </div>
                                                )
                                            ) : (
                                                <div style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', flexDirection: 'column', padding: '20px' }}>
                                                    {driveItems.length > 0 || driveNavigationStack.length > 0 ? (
                                                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '20px', height: '100%' }}>
                                                            <div style={{ display: 'flex', gap: '20px', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '15px' }}>
                                                                <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                                                                    {driveNavigationStack.length > 0 ? (
                                                                        <button onClick={handleDriveBack} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: 'var(--accent-turquoise)', padding: '8px 15px', borderRadius: '4px', cursor: 'pointer', fontSize: '10px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px' }}>← VOLVER</button>
                                                                    ) : (
                                                                        <button onClick={() => setDriveItems([])} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: '#999', padding: '8px 15px', borderRadius: '4px', cursor: 'pointer', fontSize: '10px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px' }}>← CAMBIAR CARPETA</button>
                                                                    )}
                                                                    <div style={{ display: 'flex', gap: '5px', background: 'rgba(0,0,0,0.3)', padding: '3px', borderRadius: '6px', marginRight: '15px' }}>
                                                                        <button
                                                                            onClick={() => { setDriveSource('google'); setDriveItems([]); setDriveNavigationStack([]); }}
                                                                            style={{ padding: '6px 12px', borderRadius: '4px', border: 'none', cursor: 'pointer', fontSize: '9px', fontWeight: '800', background: driveSource === 'google' ? 'var(--accent-gold)' : 'transparent', color: driveSource === 'google' ? 'black' : '#888' }}
                                                                        >GOOGLE DRIVE</button>
                                                                        <button
                                                                            onClick={() => { setDriveSource('local'); handleDriveFetch(); }}
                                                                            style={{ padding: '6px 12px', borderRadius: '4px', border: 'none', cursor: 'pointer', fontSize: '9px', fontWeight: '800', background: driveSource === 'local' ? 'var(--accent-gold)' : 'transparent', color: driveSource === 'local' ? 'black' : '#888' }}
                                                                        >PC LOCAL</button>
                                                                    </div>
                                                                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                                        <span style={{ fontSize: '10px', color: driveSource === 'local' ? 'var(--accent-turquoise)' : 'var(--accent-gold)', fontWeight: '900', letterSpacing: '2px' }}>{driveSource === 'local' ? 'LOCAL EXPLORER' : 'GDRIVE EXPLORER'}</span>
                                                                        <span style={{ fontSize: '9px', color: '#555', fontWeight: '600' }}>{driveItems.length} ELEMENTOS</span>
                                                                    </div>
                                                                </div>
                                                                <button
                                                                    onClick={() => handleDriveFetch()}
                                                                    disabled={isFetchingDrive}
                                                                    style={{ background: 'none', border: '1px solid var(--accent-turquoise)', color: 'var(--accent-turquoise)', padding: '8px 15px', borderRadius: '4px', cursor: 'pointer', fontSize: '10px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px' }}
                                                                >
                                                                    {isFetchingDrive ? <RefreshCw className="animate-spin" size={12} /> : <RefreshCw size={12} />}
                                                                    ACTUALIZAR
                                                                </button>
                                                            </div>

                                                            <div key={driveFolderId} style={{ position: 'relative', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '20px', overflowY: 'auto', padding: '10px', minHeight: '200px' }} className="custom-scroll">
                                                                {isFetchingDrive && (
                                                                    <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 5, borderRadius: '8px', backdropFilter: 'blur(2px)' }}>
                                                                        <Loader2 className="animate-spin" size={30} color="var(--accent-turquoise)" />
                                                                    </div>
                                                                )}
                                                                {driveItems.map((item, idx) => (
                                                                    <div
                                                                        key={item.id}
                                                                        onClick={() => item.type === 'folder' ? handleDriveNavigate(item.id) : handleSelectDriveImage(item.thumbnail!)}
                                                                        style={{
                                                                            display: 'flex',
                                                                            flexDirection: 'column',
                                                                            gap: '10px',
                                                                            cursor: 'pointer',
                                                                            padding: '10px',
                                                                            borderRadius: '8px',
                                                                            background: 'rgba(255,255,255,0.02)',
                                                                            border: '1px solid rgba(255,255,255,0.05)',
                                                                            transition: 'all 0.3s'
                                                                        }}
                                                                        onMouseEnter={(e) => {
                                                                            e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                                                                            e.currentTarget.style.borderColor = item.type === 'folder' ? 'var(--accent-gold)' : 'var(--accent-turquoise)';
                                                                        }}
                                                                        onMouseLeave={(e) => {
                                                                            e.currentTarget.style.background = 'rgba(255,255,255,0.02)';
                                                                            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)';
                                                                        }}
                                                                    >
                                                                        <div style={{ aspectRatio: '1/1', borderRadius: '4px', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.2)' }}>
                                                                            {item.type === 'folder' ? (
                                                                                <FolderOpen size={40} color="var(--accent-gold)" style={{ opacity: 0.7 }} />
                                                                            ) : (
                                                                                <img
                                                                                    src={driveSource === 'local' ? item.thumbnail! : `/api/drive-proxy?url=${encodeURIComponent(item.thumbnail!)}`}
                                                                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                                                    onError={(e) => {
                                                                                        (e.target as HTMLImageElement).src = 'https://via.placeholder.com/150?text=IMG+ERROR';
                                                                                    }}
                                                                                />
                                                                            )}
                                                                        </div>
                                                                        <span style={{
                                                                            fontSize: '10px',
                                                                            color: item.type === 'folder' ? 'var(--accent-gold)' : '#ccc',
                                                                            fontWeight: item.type === 'folder' ? '800' : '500',
                                                                            textAlign: 'center',
                                                                            overflow: 'hidden',
                                                                            textOverflow: 'ellipsis',
                                                                            whiteSpace: 'nowrap',
                                                                            display: 'block'
                                                                        }}>
                                                                            {item.name}
                                                                        </span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '30px' }}>
                                                            <div style={{ width: '80%', maxWidth: '400px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                                                <label style={{ fontSize: '10px', color: 'var(--accent-gold)', fontWeight: '900', letterSpacing: '2px', textAlign: 'center' }}>ID DE CARPETA GOOGLE DRIVE</label>
                                                                <div style={{ display: 'flex', gap: '10px' }}>
                                                                    <input
                                                                        value={driveFolderId}
                                                                        onChange={(e) => setDriveFolderId(e.target.value)}
                                                                        placeholder="Ej: 1a2b3c4d5e6f7g..."
                                                                        style={{ flex: 1, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.1)', padding: '15px', borderRadius: '4px', color: 'white', fontSize: '14px', outline: 'none' }}
                                                                    />
                                                                    <button
                                                                        onClick={() => handleDriveFetch()}
                                                                        disabled={isFetchingDrive || !driveFolderId}
                                                                        style={{ background: 'var(--accent-gold)', color: 'black', border: 'none', padding: '0 20px', borderRadius: '4px', fontWeight: '900', cursor: 'pointer' }}
                                                                    >
                                                                        {isFetchingDrive ? <Loader2 className="animate-spin" size={16} /> : <Search size={16} />}
                                                                    </button>
                                                                </div>
                                                                <p style={{ fontSize: '9px', color: '#555', textAlign: 'center', lineHeight: '1.4' }}>
                                                                    Pega el ID de la carpeta compartida para explorar sus activos directamente.<br />
                                                                    Asegúrate de que la carpeta sea accesible con el enlace.
                                                                </p>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            {loading && (
                                                <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '20px', zIndex: 10 }}>
                                                    <Loader2 className="animate-spin" size={40} color="var(--accent-turquoise)" />
                                                    <span style={{ color: 'var(--accent-turquoise)', fontSize: '10px', fontWeight: '800', letterSpacing: '3px' }}>OPTIMIZANDO...</span>
                                                </div>
                                            )}
                                        </div>

                                        {/* BARRA DE HERRAMIENTAS: Fila 3 (Anclaje Garantizado) */}
                                        <div style={{
                                            flexShrink: 0,
                                            marginTop: 'auto',
                                            display: 'flex',
                                            gap: '15px',
                                            justifyContent: 'center',
                                            padding: '10px 0',
                                            background: 'rgba(255,255,255,0.02)',
                                            borderRadius: '4px'
                                        }}>
                                            <button
                                                onClick={() => setInsumoTransform(prev => ({ ...prev, rotation: prev.rotation - 90 }))}
                                                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.15)', padding: '12px 20px', borderRadius: '4px', cursor: 'pointer', color: 'white', display: 'flex', alignItems: 'center', gap: '10px' }}
                                            >
                                                <RotateCw size={16} /> <span style={{ fontSize: '9px', fontWeight: '800' }}>ROTAR</span>
                                            </button>
                                            <button
                                                onClick={() => setInsumoTransform(prev => ({ ...prev, flipX: !prev.flipX }))}
                                                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.15)', padding: '12px 20px', borderRadius: '4px', cursor: 'pointer', color: 'white', display: 'flex', alignItems: 'center', gap: '10px' }}
                                            >
                                                <FlipHorizontal size={16} /> <span style={{ fontSize: '9px', fontWeight: '800' }}>VOLTEAR</span>
                                            </button>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(255,255,255,0.03)', padding: '0 15px', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.1)' }}>
                                                <span style={{ fontSize: '9px', fontWeight: '800', color: '#666' }}>ZOOM:</span>
                                                <input
                                                    type="range" min="0.5" max="3" step="0.1"
                                                    value={insumoTransform.zoom}
                                                    onChange={(e) => setInsumoTransform(prev => ({ ...prev, zoom: parseFloat(e.target.value) }))}
                                                    style={{ width: '80px', accentColor: 'var(--accent-turquoise)' }}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* PANEL DE CONTROL RUTEADOR */}
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '30px', background: 'rgba(255,255,255,0.01)', padding: '30px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.03)', height: '100%' }}>
                                        <div>
                                            <label style={{ display: 'block', fontSize: '11px', color: 'var(--accent-gold)', marginBottom: '15px', fontWeight: '800', letterSpacing: '3px', textTransform: 'uppercase' }}>DESTINO DEL ACTIVO</label>
                                            <select
                                                value={insumoDestination}
                                                onChange={(e) => setInsumoDestination(e.target.value as any)}
                                                style={{ width: '100%', background: '#000', border: '1px solid #333', padding: '20px', color: 'white', fontSize: '14px', borderRadius: '4px', outline: 'none', appearance: 'none' }}
                                            >
                                                <option value="catalog">CATÁLOGO</option>
                                                <option value="gallery">GRILLA</option>
                                                <option value="hero">HERO</option>
                                                <option value="marketing">MARKETING</option>
                                            </select>
                                        </div>

                                        {insumoDestination === 'catalog' && (
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                                <label style={{ display: 'block', fontSize: '11px', color: 'var(--accent-gold)', fontWeight: '800', letterSpacing: '3px', textTransform: 'uppercase' }}>TIPO DE ACCIÓN</label>
                                                <div style={{ display: 'flex', gap: '10px' }}>
                                                    <button
                                                        onClick={() => setInsumoCatalogAction('new')}
                                                        style={{ flex: 1, padding: '15px', background: insumoCatalogAction === 'new' ? 'var(--accent-turquoise)' : 'rgba(255,255,255,0.05)', color: insumoCatalogAction === 'new' ? 'black' : 'white', border: 'none', borderRadius: '4px', fontSize: '10px', fontWeight: '900', letterSpacing: '1px', cursor: 'pointer', transition: 'all 0.3s' }}
                                                    >
                                                        NUEVO PRODUCTO
                                                    </button>
                                                    <button
                                                        onClick={() => setInsumoCatalogAction('update')}
                                                        style={{ flex: 1, padding: '15px', background: insumoCatalogAction === 'update' ? 'var(--accent-turquoise)' : 'rgba(255,255,255,0.05)', color: insumoCatalogAction === 'update' ? 'black' : 'white', border: 'none', borderRadius: '4px', fontSize: '10px', fontWeight: '900', letterSpacing: '1px', cursor: 'pointer', transition: 'all 0.3s' }}
                                                    >
                                                        ACTUALIZAR PRODUCTO
                                                    </button>
                                                </div>
                                                {insumoCatalogAction === 'update' && (
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', padding: '15px', background: 'rgba(212, 175, 55, 0.05)', border: '1px solid rgba(212, 175, 55, 0.2)', borderRadius: '4px' }}>
                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                            <label style={{ fontSize: '9px', color: 'rgba(255,255,255,0.4)', fontWeight: '800', letterSpacing: '1px' }}>BUSCAR PRODUCTO PARA ACTUALIZAR:</label>
                                                            <div style={{ position: 'relative' }}>
                                                                <input
                                                                    type="text"
                                                                    placeholder="Nombre o SKU..."
                                                                    value={insumoProductSearch}
                                                                    onChange={(e) => setInsumoProductSearch(e.target.value)}
                                                                    style={{ width: '100%', background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.1)', padding: '10px 12px', borderRadius: '4px', color: 'white', fontSize: '11px', outline: 'none' }}
                                                                />
                                                                {insumoSearchResults.length > 0 && (
                                                                    <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#111', border: '1px solid #333', borderRadius: '4px', zIndex: 100, marginTop: '5px', boxShadow: '0 10px 30px rgba(0,0,0,0.8)' }}>
                                                                        {insumoSearchResults.map(p => (
                                                                            <div
                                                                                key={p.id}
                                                                                onClick={() => {
                                                                                    setSelectedProduct(p);
                                                                                    setCatalogViewerImage(p.images[0]);
                                                                                    setInsumoProductSearch('');
                                                                                    setInsumoSearchResults([]);
                                                                                }}
                                                                                style={{ padding: '10px 15px', borderBottom: '1px solid rgba(255,255,255,0.05)', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                                                                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'}
                                                                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                                                            >
                                                                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                                                    <span style={{ fontSize: '11px', color: 'white', fontWeight: '700' }}>{p.nombre}</span>
                                                                                    <span style={{ fontSize: '9px', color: '#666' }}>{p.sku_externo}</span>
                                                                                </div>
                                                                                {updatedProductIds.has(p.id) && <Check size={12} color="var(--accent-turquoise)" />}
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>

                                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '5px', padding: '10px', background: 'rgba(0,0,0,0.2)', borderRadius: '2px' }}>
                                                            <span style={{ fontSize: '9px', color: 'var(--accent-gold)', fontWeight: '800', letterSpacing: '1px', textTransform: 'uppercase' }}>OBJETIVO: </span>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                                <span style={{ fontSize: '11px', color: 'white', fontWeight: '700' }}>
                                                                    {selectedProduct ? selectedProduct.nombre : 'NINGUNO'}
                                                                </span>
                                                                {selectedProduct && updatedProductIds.has(selectedProduct.id) && (
                                                                    <div style={{ background: 'var(--accent-turquoise)', borderRadius: '50%', width: '14px', height: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                                        <Check size={8} color="black" />
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <div style={{ marginTop: '10px', display: 'flex', gap: '10px' }}>
                                                            <button
                                                                onClick={() => setInsumoUpdateMode('append')}
                                                                style={{ flex: 1, padding: '12px 8px', fontSize: '9px', fontWeight: '800', borderRadius: '2px', border: '1px solid', borderColor: insumoUpdateMode === 'append' ? 'var(--accent-gold)' : '#333', background: insumoUpdateMode === 'append' ? 'rgba(212, 175, 55, 0.1)' : 'rgba(0,0,0,0.5)', color: insumoUpdateMode === 'append' ? 'var(--accent-gold)' : '#666', cursor: 'pointer', transition: 'all 0.3s' }}
                                                            >
                                                                AÑADIR A GALERÍA
                                                            </button>
                                                            <button
                                                                onClick={() => setInsumoUpdateMode('replace')}
                                                                style={{ flex: 1, padding: '12px 8px', fontSize: '9px', fontWeight: '800', borderRadius: '2px', border: '1px solid', borderColor: insumoUpdateMode === 'replace' ? '#ef4444' : '#333', background: insumoUpdateMode === 'replace' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(0,0,0,0.5)', color: insumoUpdateMode === 'replace' ? '#ef4444' : '#666', cursor: 'pointer', transition: 'all 0.3s' }}
                                                            >
                                                                REEMPLAZAR TODO
                                                            </button>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        <button
                                            onClick={handleInsumoSend}
                                            disabled={!insumoPreview || isRoutingInsumo}
                                            style={{
                                                marginTop: 'auto',
                                                background: !insumoPreview ? '#222' : 'var(--accent-turquoise)',
                                                color: 'black',
                                                padding: '25px',
                                                borderRadius: '4px',
                                                border: 'none',
                                                fontSize: '14px',
                                                fontWeight: '900',
                                                letterSpacing: '3px',
                                                cursor: !insumoPreview ? 'not-allowed' : 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                gap: '15px',
                                                transition: 'all 0.3s'
                                            }}
                                        >
                                            {isRoutingInsumo ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />}
                                            ENVIAR ACTIVO
                                        </button>

                                        <div style={{ padding: '20px', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '4px', background: 'rgba(0,0,0,0.3)' }}>
                                            <p style={{ fontSize: '10px', color: '#444', lineHeight: '1.6', margin: 0 }}>
                                                Al pulsar <strong style={{ color: '#666' }}>ENVIAR</strong>, el sistema guardará la imagen optimizada en la carpeta correspondiente de Supabase y te redirigirá a la pestaña seleccionada para completar la configuración.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'catalog' && (
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <div style={{ padding: '0 60px 18px 60px', backgroundColor: 'rgba(0,0,0,0.2)', display: 'flex', gap: '40px', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>

                                    <div style={{ flex: 1, position: 'relative' }}>
                                        <Search style={{ position: 'absolute', left: '25px', top: '50%', transform: 'translateY(-50%)', width: '20px', height: '20px', color: '#444' }} />
                                        <input
                                            type="text"
                                            placeholder="Buscar por nombre, SKU o categoría..."
                                            value={search}
                                            onChange={(e) => setSearch(e.target.value)}
                                            style={{ width: '100%', padding: '18px 25px 18px 65px', backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '2px', color: 'white', fontSize: '17px', outline: 'none', letterSpacing: '1px', fontFamily: 'var(--font-body)' }}
                                        />
                                        {search.length > 0 && filteredProducts.length > 0 && (
                                            <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#111', border: '1px solid #333', borderRadius: '4px', zIndex: 100, marginTop: '5px', boxShadow: '0 10px 40px rgba(0,0,0,0.8)', maxHeight: '300px', overflowY: 'auto' }} className="custom-scroll">
                                                {filteredProducts.map(p => (
                                                    <div
                                                        key={p.id}
                                                        onClick={() => {
                                                            setSelectedProduct(p);
                                                            setCatalogViewerImage(p.images[0]);
                                                            setSearch(''); // Limpiar búsqueda al seleccionar
                                                        }}
                                                        style={{ padding: '15px 20px', borderBottom: '1px solid rgba(255,255,255,0.05)', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                                                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'}
                                                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                                    >
                                                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                            <span style={{ fontSize: '13px', color: 'white', fontWeight: '700' }}>{p.nombre}</span>
                                                            <span style={{ fontSize: '10px', color: '#666' }}>{p.sku_externo} - {p.category || 'SIN CATEGORÍA'}</span>
                                                        </div>
                                                        {selectedProduct?.id === p.id && <Check size={16} color="var(--accent-turquoise)" />}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        <div style={{ flex: 1, display: 'grid', gridTemplateColumns: activeTab === 'gallery' ? '300px 1fr' : '1fr', overflow: 'hidden' }}>


                            {activeTab === 'catalog' && (
                                <React.Fragment>


                                    {/* Right Detail */}
                                    <div className="custom-scroll" style={{ padding: '30px 60px', overflowY: 'auto', backgroundColor: '#050505' }}>
                                        {selectedProduct ? (
                                            <div style={{ display: 'flex', flexDirection: 'column', height: '100%', maxWidth: '1600px', margin: '0 auto', width: '100%' }}>
                                                <div style={{ padding: '0 0 20px 0', borderBottom: '1px solid rgba(255,255,255,0.05)', marginBottom: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                                                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                                                <input
                                                                    value={selectedProduct?.nombre || ''}
                                                                    onChange={(e) => handleUpdateProduct({ nombre: e.target.value })}
                                                                    style={{ background: 'none', border: 'none', color: 'white', fontSize: '32px', fontWeight: '800', fontFamily: 'var(--font-heading)', width: '600px', outline: 'none', letterSpacing: '2px', textTransform: 'uppercase' }}
                                                                />
                                                                {updatedProductIds.has(selectedProduct?.id) && (
                                                                    <div style={{ background: 'var(--accent-turquoise)', borderRadius: '50%', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 15px rgba(0, 212, 189, 0.3)' }}>
                                                                        <Check size={14} color="black" />
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <span style={{ fontSize: '10px', color: '#444', fontWeight: '800', letterSpacing: '2px', marginTop: '5px' }}>MODIFICANDO PRODUCTO LOCALMENTE | REF: {selectedProduct?.id}</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div style={{ display: 'grid', gridTemplateColumns: '350px 1.2fr 1.5fr', gap: '40px', flex: 1 }}>
                                                    {/* Columna Izquierda: Visual (Main) */}
                                                    <div style={{ gridColumn: '1', gridRow: '1', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                                        <div>
                                                            <div style={{
                                                                width: '100%',
                                                                height: '35vh',
                                                                backgroundColor: '#000',
                                                                borderRadius: '2px',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                overflow: 'hidden',
                                                                border: '1px solid rgba(255,255,255,0.05)',
                                                                position: 'relative',
                                                                boxShadow: '0 30px 60px rgba(0,0,0,0.5)'
                                                            }}>

                                                                <img
                                                                    src={catalogViewerImage || (selectedProduct?.images && selectedProduct.images.length > 0 ? selectedProduct.images[0] : '')}
                                                                    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Columna Inferior Expandida: Miniaturas (Abarcando Col 1 y 2) */}
                                                    <div style={{ gridColumn: '1 / span 2', gridRow: '2', marginTop: '5px' }}>
                                                        <div style={{
                                                            display: 'grid',
                                                            gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))',
                                                            gap: '12px',
                                                            padding: '10px',
                                                            background: 'rgba(255,255,255,0.01)',
                                                            borderRadius: '4px',
                                                            border: '1px solid rgba(255,255,255,0.03)',
                                                            maxHeight: '500px',
                                                            overflowY: 'auto'
                                                        }} className="custom-scroll">
                                                            {selectedProduct?.images && selectedProduct.images.length > 0 ? selectedProduct.images.map((img, i) => (
                                                                <div
                                                                    key={i}
                                                                    onClick={() => setCatalogViewerImage(img)}
                                                                    style={{
                                                                        position: 'relative',
                                                                        aspectRatio: '1/1',
                                                                        borderRadius: '4px',
                                                                        overflow: 'hidden',
                                                                        border: `2px solid ${catalogViewerImage === img ? 'var(--accent-turquoise)' : 'rgba(255,255,255,0.05)'}`,
                                                                        cursor: 'pointer',
                                                                        opacity: catalogViewerImage === img ? 1 : 0.7,
                                                                        transition: 'all 0.3s',
                                                                        boxShadow: catalogViewerImage === img ? '0 0 20px rgba(0, 212, 189, 0.2)' : 'none'
                                                                    }}
                                                                >
                                                                    <img src={img} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                                    {catalogViewerImage === img && (
                                                                        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 212, 189, 0.1)', pointerEvents: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                                            <Star size={18} color="var(--accent-turquoise)" fill="var(--accent-turquoise)" />
                                                                        </div>
                                                                    )}
                                                                    <button
                                                                        onClick={(e) => handleRemoveImage(e, img)}
                                                                        style={{ position: 'absolute', top: '5px', right: '5px', background: 'rgba(239, 68, 68, 0.9)', color: 'white', border: 'none', borderRadius: '50%', width: '22px', height: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 10 }}
                                                                    >
                                                                        <X size={12} />
                                                                    </button>
                                                                </div>
                                                            )) : (
                                                                <div style={{ gridColumn: '1/-1', padding: '40px', textAlign: 'center', opacity: 0.1 }}>
                                                                    <ImageIcon size={40} />
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* Columna Central: Metadatos */}
                                                    <div style={{ gridColumn: '2', gridRow: '1', display: 'flex', flexDirection: 'column', gap: '30px' }}>
                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                                            <div>
                                                                <label style={{ display: 'block', fontSize: '10px', color: 'var(--accent-gold)', marginBottom: '8px', fontWeight: '800', letterSpacing: '2px', textTransform: 'uppercase' }}>MAYORISTA</label>
                                                                <input
                                                                    type="text"
                                                                    value={selectedProduct?.wholesaler || ''}
                                                                    onChange={(e) => handleUpdateProduct({ wholesaler: e.target.value })}
                                                                    style={{ width: '100%', backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '2px', padding: '15px', color: '#888', fontSize: '14px', outline: 'none' }}
                                                                />
                                                            </div>
                                                            <div>
                                                                <label style={{ display: 'block', fontSize: '10px', color: 'var(--accent-gold)', marginBottom: '8px', fontWeight: '800', letterSpacing: '2px', textTransform: 'uppercase' }}>CÓDIGO / SKU</label>
                                                                <input
                                                                    value={selectedProduct?.sku_externo || ''}
                                                                    onChange={(e) => handleUpdateProduct({ sku_externo: e.target.value })}
                                                                    style={{ width: '100%', backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '2px', padding: '15px', color: '#888', fontSize: '14px', outline: 'none' }}
                                                                />
                                                            </div>
                                                            <div>
                                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                                                    <label style={{ fontSize: "10px", color: "var(--accent-gold)", fontWeight: "800", letterSpacing: "2px", textTransform: "uppercase" }}>CATEGORÍA</label>
                                                                    <button
                                                                        onClick={() => setIsAddingCategory(!isAddingCategory)}
                                                                        style={{ background: 'none', border: 'none', color: 'var(--accent-turquoise)', fontSize: '9px', fontWeight: '700', cursor: 'pointer', letterSpacing: '1px' }}
                                                                    >
                                                                        {isAddingCategory ? "ANULAR" : "+ NUEVA"}
                                                                    </button>
                                                                </div>
                                                                {isAddingCategory ? (
                                                                    <div style={{ display: 'flex', gap: '10px' }}>
                                                                        <input
                                                                            type="text"
                                                                            value={newCategoryName}
                                                                            onChange={(e) => setNewCategoryName(e.target.value)}
                                                                            placeholder="EJ: TECNOLOGÍA"
                                                                            style={{ width: '100%', padding: '14px', backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid var(--accent-turquoise)', color: 'white', borderRadius: '2px', fontSize: '11px', outline: 'none' }}
                                                                        />
                                                                        <button
                                                                            onClick={() => {
                                                                                if (!newCategoryName.trim()) return;
                                                                                const normalized = newCategoryName.trim().toUpperCase();
                                                                                if (!customCategories.includes(normalized)) {
                                                                                    setCustomCategories(prev => [...prev, normalized]);
                                                                                }
                                                                                handleUpdateProduct({ category: normalized });
                                                                                setNewCategoryName('');
                                                                                setIsAddingCategory(false);
                                                                            }}
                                                                            style={{ padding: '0 20px', backgroundColor: 'var(--accent-turquoise)', color: 'black', border: 'none', borderRadius: '2px', fontSize: '11px', fontWeight: '900', cursor: 'pointer', letterSpacing: '1px' }}
                                                                        >
                                                                            AÑADIR
                                                                        </button>
                                                                    </div>
                                                                ) : (
                                                                    <div style={{ position: 'relative' }}>
                                                                        <div
                                                                            onClick={() => setIsCategoryDropdownOpen(!isCategoryDropdownOpen)}
                                                                            style={{ width: '100%', padding: '14px', backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', color: 'white', borderRadius: '2px', fontSize: '11px', outline: 'none', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', transition: 'all 0.3s' }}
                                                                            onMouseEnter={(e) => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'}
                                                                            onMouseLeave={(e) => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)'}
                                                                        >
                                                                            <span style={{ fontWeight: '700', letterSpacing: '1px' }}>{selectedProduct?.category || 'SELECCIONAR CATEGORÍA'}</span>
                                                                            <ChevronRight size={14} style={{ transform: isCategoryDropdownOpen ? 'rotate(-90deg)' : 'rotate(90deg)', transition: 'transform 0.2s', color: 'var(--accent-turquoise)' }} />
                                                                        </div>
                                                                        {isCategoryDropdownOpen && (
                                                                            <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, backgroundColor: '#050505', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '4px', marginTop: '4px', zIndex: 100, maxHeight: '200px', overflowY: 'auto', boxShadow: '0 10px 40px rgba(0,0,0,0.8)' }} className="custom-scroll">
                                                                                {customCategories.map(cat => (
                                                                                    <div
                                                                                        key={cat}
                                                                                        onClick={() => {
                                                                                            handleUpdateProduct({ category: cat });
                                                                                            setIsCategoryDropdownOpen(false);
                                                                                        }}
                                                                                        style={{ padding: '14px 15px', fontSize: '11px', cursor: 'pointer', color: selectedProduct?.category === cat ? 'black' : 'white', backgroundColor: selectedProduct?.category === cat ? 'var(--accent-turquoise)' : 'transparent', transition: 'all 0.2s', fontWeight: '700', letterSpacing: '1px' }}
                                                                                        onMouseEnter={(e) => {
                                                                                            if (selectedProduct?.category !== cat) {
                                                                                                e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)';
                                                                                                e.currentTarget.style.color = 'var(--accent-turquoise)';
                                                                                            }
                                                                                        }}
                                                                                        onMouseLeave={(e) => {
                                                                                            if (selectedProduct?.category !== cat) {
                                                                                                e.currentTarget.style.backgroundColor = 'transparent';
                                                                                                e.currentTarget.style.color = 'white';
                                                                                            }
                                                                                        }}
                                                                                    >
                                                                                        {cat}
                                                                                    </div>
                                                                                ))}
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                )}
                                                            </div>

                                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '15px', backgroundColor: selectedProduct?.is_premium ? 'rgba(212, 175, 55, 0.1)' : 'rgba(255,255,255,0.02)', border: `1px solid ${selectedProduct?.is_premium ? 'var(--accent-gold)' : 'rgba(255,255,255,0.05)'}`, borderRadius: '4px', transition: 'all 0.3s' }}>
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                                    <Star size={16} color={selectedProduct?.is_premium ? 'var(--accent-gold)' : '#555'} fill={selectedProduct?.is_premium ? 'var(--accent-gold)' : 'none'} />
                                                                    <span style={{ fontSize: '11px', color: selectedProduct?.is_premium ? 'var(--accent-gold)' : '#aaa', fontWeight: '800', letterSpacing: '2px', textTransform: 'uppercase' }}>
                                                                        ⭐ DESTACAR EN LANDING (PREMIUM)
                                                                    </span>
                                                                </div>
                                                                <button
                                                                    onClick={() => handleUpdateProduct({ is_premium: !selectedProduct?.is_premium })}
                                                                    style={{ padding: '6px 12px', fontSize: '9px', fontWeight: '900', letterSpacing: '1px', cursor: 'pointer', borderRadius: '2px', border: `1px solid ${selectedProduct?.is_premium ? 'var(--accent-gold)' : '#555'}`, backgroundColor: selectedProduct?.is_premium ? 'var(--accent-gold)' : 'transparent', color: selectedProduct?.is_premium ? 'black' : '#555', transition: 'all 0.2s' }}
                                                                >
                                                                    {selectedProduct?.is_premium ? 'ACTIVADO' : 'DESACTIVADO'}
                                                                </button>
                                                            </div>
                                                            <div style={{ marginTop: '30px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '20px' }}>
                                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                                                                    <label style={{ fontSize: "11px", color: "var(--accent-gold)", fontWeight: "900", letterSpacing: "3px", textTransform: "uppercase" }}>TÍTULO DEL PRODUCTO</label>
                                                                    <button
                                                                        onClick={handleAutoGenerateSEO}
                                                                        disabled={isGeneratingSEO}
                                                                        style={{
                                                                            backgroundColor: isGeneratingSEO ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 212, 189, 0.05)',
                                                                            color: isGeneratingSEO ? 'rgba(255, 255, 255, 0.4)' : 'var(--accent-turquoise)',
                                                                            border: '1px solid',
                                                                            borderColor: isGeneratingSEO ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 212, 189, 0.3)',
                                                                            padding: '6px 12px',
                                                                            fontSize: '9px',
                                                                            fontWeight: '800',
                                                                            letterSpacing: '2px',
                                                                            cursor: isGeneratingSEO ? 'not-allowed' : 'pointer',
                                                                            borderRadius: '2px',
                                                                            display: 'flex',
                                                                            alignItems: 'center',
                                                                            gap: '6px'
                                                                        }}
                                                                    >
                                                                        {isGeneratingSEO ? <Loader2 className="animate-spin" size={12} /> : <Sparkles size={12} />}
                                                                        {isGeneratingSEO ? 'GENERANDO...' : 'AUTO-GENERAR SEO'}
                                                                    </button>
                                                                </div>
                                                                <textarea
                                                                    value={selectedProduct?.nombre || ""}
                                                                    onChange={(e) => handleUpdateProduct({ nombre: e.target.value })}
                                                                    style={{ width: "100%", height: "60px", backgroundColor: "rgba(255,255,255,0.01)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "2px", padding: "15px", color: "white", fontSize: "16px", fontWeight: "600", outline: "none", resize: "none", lineHeight: "1.4" }}
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Columna Derecha: Características + Acciones */}
                                                    <div style={{ gridColumn: '3', gridRow: '1 / span 2', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                            <label style={{ display: "block", fontSize: "11px", color: "var(--accent-turquoise)", marginBottom: "15px", fontWeight: "900", letterSpacing: "3px", textTransform: "uppercase" }}>CARACTERÍSTICAS TÉCNICAS</label>
                                                            <textarea
                                                                value={selectedProduct?.technical_specs?.join("\n") || ""}
                                                                onChange={(e) => handleUpdateProduct({ technical_specs: e.target.value.split("\n").filter(l => l.trim()) })}
                                                                style={{ width: "100%", minHeight: "220px", backgroundColor: "rgba(10, 10, 10, 0.4)", border: "1px solid rgba(0, 212, 189, 0.1)", borderRadius: "4px", padding: "20px", color: "#888", fontSize: "14px", outline: "none", resize: "vertical", lineHeight: "1.8", fontFamily: 'monospace' }}
                                                                placeholder="Una característica por línea..."
                                                            />
                                                        </div>

                                                        <div style={{ display: "flex", gap: "10px" }}>
                                                            <button
                                                                onClick={handlePublish}
                                                                disabled={isSaving}
                                                                style={{ flex: 3, backgroundColor: isSaving ? "#222" : "var(--accent-turquoise)", color: "black", border: "none", padding: '16px', fontSize: "11px", fontWeight: "900", letterSpacing: "2px", cursor: isSaving ? "not-allowed" : "pointer", borderRadius: "2px", textTransform: "uppercase", display: "flex", alignItems: "center", justifyContent: "center", gap: "10px", transition: "all 0.3s" }}
                                                            >
                                                                {isSaving ? (
                                                                    <>
                                                                        <Loader2 className="animate-spin" size={16} /> ACTUALIZANDO...
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <Save size={16} /> ACTUALIZAR Y PUBLICAR
                                                                    </>
                                                                )}
                                                            </button>
                                                            <button
                                                                onClick={handleReject}
                                                                style={{ flex: 1, backgroundColor: "rgba(239, 68, 68, 0.1)", color: "#ef4444", border: "1px solid rgba(239, 68, 68, 0.2)", padding: '16px', borderRadius: "2px", cursor: "pointer", display: 'flex', alignItems: 'center', justifyContent: 'center', transition: "all 0.3s" }}
                                                            >
                                                                <Trash2 size={16} />
                                                            </button>
                                                        </div>

                                                        {/* Sección Datos Generados por @seo_mkt */}
                                                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '15px', padding: '20px', backgroundColor: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '4px' }}>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '5px' }}>
                                                                <Sparkles size={14} color="var(--accent-gold)" />
                                                                <span style={{ fontSize: '10px', color: 'var(--accent-gold)', fontWeight: '900', letterSpacing: '2px', textTransform: 'uppercase' }}>METADATA SEO (GENERADA POR IA)</span>
                                                            </div>
                                                            <div>
                                                                <label style={{ display: 'block', fontSize: '9px', color: '#666', marginBottom: '5px', fontWeight: '700', letterSpacing: '1px', textTransform: 'uppercase' }}>TÍTULO SEO B2B</label>
                                                                <input
                                                                    value={selectedProduct?.seo_title || ''}
                                                                    onChange={(e) => handleUpdateProduct({ seo_title: e.target.value })}
                                                                    placeholder="Auto-generado por seo_mkt..."
                                                                    style={{ width: '100%', backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', color: 'white', borderRadius: '2px', padding: '12px', fontSize: '12px', outline: 'none', transition: 'border-color 0.3s' }}
                                                                    onMouseEnter={(e) => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'}
                                                                    onMouseLeave={(e) => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)'}
                                                                />
                                                            </div>
                                                            <div>
                                                                <label style={{ display: 'block', fontSize: '9px', color: '#666', marginBottom: '5px', fontWeight: '700', letterSpacing: '1px', textTransform: 'uppercase' }}>KEYWORDS (COLA LARGA)</label>
                                                                <input
                                                                    value={selectedProduct?.seo_keywords || ''}
                                                                    onChange={(e) => handleUpdateProduct({ seo_keywords: e.target.value })}
                                                                    placeholder="Auto-generado por seo_mkt..."
                                                                    style={{ width: '100%', backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', color: 'var(--accent-turquoise)', borderRadius: '2px', padding: '12px', fontSize: '12px', outline: 'none', transition: 'border-color 0.3s' }}
                                                                    onMouseEnter={(e) => e.currentTarget.style.borderColor = 'rgba(0, 212, 189, 0.3)'}
                                                                    onMouseLeave={(e) => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)'}
                                                                />
                                                            </div>
                                                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                                                                <label style={{ display: 'block', fontSize: '9px', color: '#666', marginBottom: '5px', fontWeight: '700', letterSpacing: '1px', textTransform: 'uppercase' }}>META DESCRIPCIÓN B2B</label>
                                                                <textarea
                                                                    value={selectedProduct?.seo_description || ''}
                                                                    onChange={(e) => handleUpdateProduct({ seo_description: e.target.value })}
                                                                    placeholder="Auto-generado por seo_mkt..."
                                                                    style={{ width: '100%', flex: 1, minHeight: '90px', backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', color: '#aaa', borderRadius: '2px', padding: '12px', fontSize: '12px', outline: 'none', resize: 'none', lineHeight: '1.5', transition: 'border-color 0.3s' }}
                                                                    onMouseEnter={(e) => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'}
                                                                    onMouseLeave={(e) => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)'}
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", opacity: 0.1 }}>
                                                <Layers size={100} />
                                            </div>
                                        )}
                                    </div>
                                </React.Fragment>
                            )}
                            {
                                activeTab === "gallery" && (
                                    <React.Fragment>
                                        <div className="custom-scroll" style={{ borderRight: "1px solid rgba(255,255,255,0.05)", overflowY: "auto", padding: "32px 40px", backgroundColor: "rgba(0,0,0,0.2)" }}>
                                            <h3 style={{ color: "var(--accent-gold)", fontSize: "11px", fontWeight: "900", letterSpacing: "3px", textTransform: "uppercase", marginBottom: "30px" }}>SECCIONES DISPONIBLES</h3>
                                            <div style={{ display: "grid", gap: "10px" }}>


                                                {/* Dynamic Sections from useWebContent */}
                                                {content.sections && content.sections.map((sec: any) => (
                                                    <button
                                                        key={sec.id || sec.title1}
                                                        onClick={() => setSelectedGallerySection(sec.id || sec.title1)}
                                                        style={{ textAlign: "left", padding: "15px 20px", background: selectedGallerySection === (sec.id || sec.title1) ? "rgba(0, 212, 189, 0.05)" : "transparent", border: "1px solid", borderColor: selectedGallerySection === (sec.id || sec.title1) ? "var(--accent-turquoise)" : "transparent", color: selectedGallerySection === (sec.id || sec.title1) ? "var(--accent-turquoise)" : "#555", borderRadius: "4px", textTransform: "uppercase", fontSize: "11px", fontWeight: "800", cursor: "pointer", letterSpacing: "2px" }}
                                                    >
                                                        {sec.title1 || sec.id || 'SECCIÓN SIN TÍTULO'}
                                                    </button>
                                                ))}

                                                {/* Fallback Static Categories if no sections loaded */}
                                                {(!content.sections || content.sections.length === 0) && customCategories.map(sec => (
                                                    <button
                                                        key={sec}
                                                        onClick={() => setSelectedGallerySection(sec)}
                                                        style={{ textAlign: "left", padding: "15px 20px", background: selectedGallerySection === sec ? "rgba(0, 212, 189, 0.05)" : "transparent", border: "1px solid", borderColor: selectedGallerySection === sec ? "var(--accent-turquoise)" : "transparent", color: selectedGallerySection === sec ? "var(--accent-turquoise)" : "#555", borderRadius: "4px", textTransform: "uppercase", fontSize: "11px", fontWeight: "800", cursor: "pointer", letterSpacing: "2px" }}
                                                    >
                                                        {sec}
                                                    </button>
                                                ))}


                                            </div>
                                        </div>

                                        <div className="custom-scroll" style={{ padding: "60px", overflowY: "auto", backgroundColor: "#050505" }}>
                                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "60px" }}>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                                    <h2 style={{ color: "white", fontFamily: "var(--font-heading)", fontSize: "32px", margin: 0, letterSpacing: "4px", textTransform: "uppercase" }}>
                                                        GESTIÓN DE <span style={{ color: "var(--accent-gold)" }}>GRILLA DINÁMICA</span>
                                                    </h2>
                                                    <p style={{ fontSize: '10px', color: '#444', fontWeight: '800', letterSpacing: '1px', textTransform: 'uppercase' }}>
                                                        ASIGNANDO A: {((content.sections?.find((s: any) => s.id === selectedGallerySection || s.title1 === selectedGallerySection)?.title1) || selectedGallerySection || 'SELECCIONA UNA SECCIÓN').toUpperCase()}
                                                    </p>
                                                </div>

                                                <div style={{ display: 'flex', gap: '20px' }}>
                                                    {activeImage && (
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', background: 'rgba(0,212,189,0.05)', padding: '15px 30px', borderRadius: '4px', border: '1px solid var(--accent-turquoise)' }}>
                                                            <img src={activeImage} style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '2px' }} />
                                                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                                <span style={{ fontSize: '10px', fontWeight: '900', color: 'var(--accent-turquoise)', letterSpacing: '1px' }}>IMAGEN PREPARADA</span>
                                                                <button
                                                                    onClick={handleAssignToGrilla}
                                                                    disabled={isSaving || !selectedGallerySection}
                                                                    style={{ background: 'none', border: 'none', color: 'white', fontSize: '12px', fontWeight: '900', cursor: 'pointer', padding: 0, textAlign: 'left', textDecoration: 'underline' }}
                                                                >
                                                                    {isSaving ? 'ASIGNANDO...' : 'ENVIAR A SECCIÓN ↑'}
                                                                </button>
                                                            </div>
                                                            <button
                                                                onClick={() => setActiveImage(null)}
                                                                style={{ background: 'rgba(239, 68, 68, 0.2)', border: 'none', color: '#ef4444', width: '30px', height: '30px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                                            >
                                                                <Trash2 size={14} />
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            <div style={{ marginBottom: '40px', padding: '20px', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '4px', background: 'rgba(255,255,255,0.02)' }}>
                                                <h3 style={{ fontSize: '11px', color: '#555', fontWeight: '900', marginBottom: '15px', letterSpacing: '2px' }}>VISTA PREVIA DE LA SECCIÓN SELECCIONADA</h3>
                                                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "30px" }}>
                                                    {galleryImages.map((src, index) => (
                                                        <div key={index} style={{ position: "relative", aspectRatio: "1/1", borderRadius: "4px", overflow: "hidden", border: "1px solid rgba(255,255,255,0.05)", background: "#111", boxShadow: "0 20px 50px rgba(0,0,0,0.5)" }}>
                                                            <img src={src} alt="Galería" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                                            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '15px', background: 'linear-gradient(to top, rgba(0,0,0,0.9), transparent)', display: 'flex', justifyContent: 'flex-end' }}>
                                                                <button
                                                                    onClick={() => handleRemoveGalleryImage(index)}
                                                                    style={{ background: "rgba(239, 68, 68, 0.9)", color: "white", border: "none", borderRadius: "4px", width: "30px", height: "30px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
                                                                >
                                                                    <Trash2 size={14} />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ))}

                                                    {uploadingGallery && (
                                                        <div style={{ aspectRatio: "1/1", borderRadius: "4px", border: "1px dashed var(--accent-turquoise)", background: "rgba(0, 212, 189, 0.05)", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: 'column', gap: '10px' }}>
                                                            <Loader2 className="animate-spin" size={30} color="var(--accent-turquoise)" />
                                                            <span style={{ fontSize: '10px', color: 'var(--accent-turquoise)', fontWeight: '800' }}>SUBIENDO...</span>
                                                        </div>
                                                    )}

                                                    {galleryImages.length === 0 && !uploadingGallery && (
                                                        <div
                                                            style={{
                                                                gridColumn: "1 / -1", padding: "100px", textAlign: "center",
                                                                border: "2px dashed rgba(255,255,255,0.05)", borderRadius: "12px",
                                                                color: "#444"
                                                            }}
                                                        >
                                                            <div style={{ marginBottom: "20px", display: 'inline-flex', padding: '20px', borderRadius: '50%', background: 'rgba(255,255,255,0.02)' }}>
                                                                <ImageIcon size={40} style={{ opacity: 0.3 }} />
                                                            </div>
                                                            <p style={{ letterSpacing: "2px", textTransform: "uppercase", fontSize: "14px", fontWeight: '700', color: '#666' }}>COLECCIÓN VACÍA</p>
                                                            <p style={{ fontSize: "12px", color: '#444', maxWidth: '300px', margin: '10px auto' }}>Arrastra tus imágenes especiales aquí o usa la herramienta de subida para empezar.</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </React.Fragment>
                                )
                            }

                            {
                                activeTab === "hero" && (
                                    <React.Fragment>
                                        <div className="custom-scroll" style={{ padding: "60px", overflowY: "auto", backgroundColor: "#050505", gridColumn: "1 / -1" }}>
                                            <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
                                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "40px" }}>
                                                    <h2 style={{ color: "white", fontFamily: "var(--font-heading)", fontSize: "32px", margin: 0, letterSpacing: "4px", textTransform: "uppercase" }}>
                                                        GESTIÓN DE <span style={{ color: "var(--accent-gold)" }}>BANNER PRINCIPAL (HERO)</span>
                                                    </h2>
                                                    {activeImage && (
                                                        <div style={{ display: "flex", alignItems: "center", gap: "10px", background: "rgba(0,212,189,0.05)", padding: "10px 20px", borderRadius: "100px", border: "1px solid rgba(0,212,189,0.2)" }}>
                                                            <span style={{ fontSize: "10px", color: "var(--accent-turquoise)", fontWeight: "900", letterSpacing: "1px" }}>IMAGEN LISTA</span>
                                                            <img src={activeImage} style={{ width: "30px", height: "30px", borderRadius: "50%", objectFit: "cover", border: "1px solid var(--accent-turquoise)" }} />
                                                        </div>
                                                    )}
                                                </div>

                                                <div style={{ background: "rgba(255,255,255,0.01)", border: "1px solid rgba(255,255,255,0.03)", borderRadius: "8px", padding: "30px", marginBottom: "40px" }}>
                                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "25px", flexWrap: "wrap", gap: "15px" }}>
                                                        <h3 style={{ fontSize: "14px", fontWeight: "900", color: "var(--accent-gold)", letterSpacing: "2px", margin: 0 }}>TEXTOS Y LLAMADO A LA ACCIÓN (GLOBAL HERO)</h3>
                                                        <div style={{ display: "flex", gap: "15px" }}>
                                                            <button
                                                                onClick={handleGenerateHeroAI}
                                                                disabled={isGeneratingAI}
                                                                style={{ padding: "12px 24px", background: "rgba(255,255,255,0.05)", color: "white", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "4px", fontSize: "11px", fontWeight: "900", cursor: isGeneratingAI ? "not-allowed" : "pointer", textTransform: "uppercase", letterSpacing: "2px", display: "flex", alignItems: "center", gap: "10px", transition: 'all 0.3s' }}
                                                            >
                                                                {isGeneratingAI ? <Loader2 size={16} className="animate-spin" /> : <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#9d00ff' }} />}
                                                                AUTO-GENERAR TEXTOS (IA)
                                                            </button>
                                                            <button
                                                                onClick={handleSaveHeroTexts}
                                                                disabled={isSaving}
                                                                style={{ padding: "12px 24px", background: "var(--accent-turquoise)", color: "black", border: "none", borderRadius: "4px", fontSize: "11px", fontWeight: "900", cursor: isSaving ? "not-allowed" : "pointer", textTransform: "uppercase", letterSpacing: "2px", display: "flex", alignItems: "center", gap: "10px", transition: 'all 0.3s' }}
                                                            >
                                                                {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                                                                GUARDAR AJUSTES
                                                            </button>
                                                        </div>
                                                    </div>

                                                    {/* Layout Controls */}
                                                    <div style={{ display: "flex", gap: "20px", marginBottom: "25px", background: "rgba(0,212,189,0.05)", padding: "15px", borderRadius: "4px", border: "1px dashed rgba(0,212,189,0.2)" }}>
                                                        <div style={{ flex: 1 }}>
                                                            <label style={{ display: "block", fontSize: "10px", color: "rgba(255,255,255,0.4)", marginBottom: "8px", fontWeight: "800", letterSpacing: "1px" }}>ALINEACIÓN HORIZONTAL (X)</label>
                                                            <div style={{ display: "flex", gap: "10px" }}>
                                                                {['left', 'center', 'right'].map(pos => (
                                                                    <button
                                                                        key={pos}
                                                                        onClick={() => setHeroForm(prev => ({ ...prev, text_align_h: pos }))}
                                                                        style={{ flex: 1, padding: "8px", background: heroForm.text_align_h === pos ? 'var(--accent-turquoise)' : 'rgba(255,255,255,0.05)', color: heroForm.text_align_h === pos ? 'black' : '#888', border: "none", borderRadius: "2px", fontSize: "10px", fontWeight: "800", textTransform: "uppercase", cursor: "pointer" }}
                                                                    >
                                                                        {pos === 'left' ? 'Izquierda' : pos === 'right' ? 'Derecha' : 'Centro'}
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        </div>
                                                        <div style={{ flex: 1 }}>
                                                            <label style={{ display: "block", fontSize: "10px", color: "rgba(255,255,255,0.4)", marginBottom: "8px", fontWeight: "800", letterSpacing: "1px" }}>ALINEACIÓN VERTICAL (Y)</label>
                                                            <div style={{ display: "flex", gap: "10px" }}>
                                                                {['top', 'center', 'bottom'].map(pos => (
                                                                    <button
                                                                        key={pos}
                                                                        onClick={() => setHeroForm(prev => ({ ...prev, text_align_v: pos }))}
                                                                        style={{ flex: 1, padding: "8px", background: heroForm.text_align_v === pos ? 'var(--accent-turquoise)' : 'rgba(255,255,255,0.05)', color: heroForm.text_align_v === pos ? 'black' : '#888', border: "none", borderRadius: "2px", fontSize: "10px", fontWeight: "800", textTransform: "uppercase", cursor: "pointer" }}
                                                                    >
                                                                        {pos === 'top' ? 'Arriba' : pos === 'bottom' ? 'Abajo' : 'Centro'}
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "25px" }}>
                                                        <div>
                                                            <label style={{ display: "block", fontSize: "10px", color: "rgba(255,255,255,0.4)", marginBottom: "8px", fontWeight: "800", letterSpacing: "1px" }}>TÍTULO PRINCIPAL (H1)</label>
                                                            <input
                                                                type="text"
                                                                value={heroForm.title1}
                                                                onChange={(e) => setHeroForm(prev => ({ ...prev, title1: e.target.value }))}
                                                                style={{ width: "100%", backgroundColor: "rgba(0,0,0,0.5)", border: "1px solid rgba(255,255,255,0.05)", padding: "16px", color: "white", borderRadius: "4px", fontSize: "16px", outline: "none", fontFamily: "var(--font-heading)", letterSpacing: "1px", transition: 'border-color 0.3s' }}
                                                            />
                                                        </div>
                                                        <div>
                                                            <label style={{ display: "block", fontSize: "10px", color: "rgba(255,255,255,0.4)", marginBottom: "8px", fontWeight: "800", letterSpacing: "1px" }}>SUBTÍTULO / SLOGAN</label>
                                                            <input
                                                                type="text"
                                                                value={heroForm.paragraph1}
                                                                onChange={(e) => setHeroForm(prev => ({ ...prev, paragraph1: e.target.value }))}
                                                                style={{ width: "100%", backgroundColor: "rgba(0,0,0,0.5)", border: "1px solid rgba(255,255,255,0.05)", padding: "16px", color: "white", borderRadius: "4px", fontSize: "14px", outline: "none", letterSpacing: "1px", transition: 'border-color 0.3s' }}
                                                            />
                                                        </div>
                                                        <div>
                                                            <label style={{ display: "block", fontSize: "10px", color: "rgba(255,255,255,0.4)", marginBottom: "8px", fontWeight: "800", letterSpacing: "1px" }}>TEXTO DEL BOTÓN (CTA)</label>
                                                            <input
                                                                type="text"
                                                                value={heroForm.cta_text}
                                                                onChange={(e) => setHeroForm(prev => ({ ...prev, cta_text: e.target.value }))}
                                                                style={{ width: "100%", backgroundColor: "rgba(0,0,0,0.5)", border: "1px solid rgba(255,255,255,0.05)", padding: "16px", color: "var(--accent-gold)", borderRadius: "4px", fontSize: "13px", fontWeight: "900", outline: "none", textTransform: "uppercase", letterSpacing: "2px", transition: 'border-color 0.3s' }}
                                                            />
                                                        </div>
                                                        <div>
                                                            <label style={{ display: "block", fontSize: "10px", color: "rgba(255,255,255,0.4)", marginBottom: "8px", fontWeight: "800", letterSpacing: "1px" }}>ENLACE DEL BOTÓN</label>
                                                            <input
                                                                type="text"
                                                                value={heroForm.cta_link}
                                                                onChange={(e) => setHeroForm(prev => ({ ...prev, cta_link: e.target.value }))}
                                                                style={{ width: "100%", backgroundColor: "rgba(0,0,0,0.5)", border: "1px solid rgba(255,255,255,0.05)", padding: "16px", color: "#888", borderRadius: "4px", fontSize: "13px", outline: "none", letterSpacing: "1px", fontFamily: "monospace", transition: 'border-color 0.3s' }}
                                                            />
                                                        </div>
                                                    </div>
                                                </div>

                                                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "40px" }}>
                                                    {[0, 1, 2].map(idx => {
                                                        const slideNum = idx + 1;
                                                        const heroKey = idx === 0 ? 'background_image' : `background_image_${slideNum}`;
                                                        const currentImg = (content.hero as any)[heroKey];

                                                        return (
                                                            <div key={idx} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "8px", padding: "30px", display: "flex", flexDirection: "column", gap: "20px" }}>
                                                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                                                    <span style={{ fontSize: "14px", fontWeight: "900", color: "var(--accent-gold)", letterSpacing: "2px" }}>SLIDE 0{slideNum}</span>
                                                                    <button
                                                                        onClick={() => handleSetAsHero(idx)}
                                                                        disabled={isSaving || !activeImage}
                                                                        style={{ padding: "10px 18px", background: activeImage ? "var(--accent-gold)" : "rgba(255,255,255,0.03)", color: activeImage ? "black" : "#444", border: "none", borderRadius: "2px", fontSize: "10px", fontWeight: "900", cursor: activeImage ? "pointer" : "not-allowed", textTransform: "uppercase", letterSpacing: "1px" }}
                                                                    >
                                                                        REEMPLAZAR
                                                                    </button>
                                                                </div>
                                                                <div style={{ aspectRatio: "16/9", background: "#000", borderRadius: "4px", border: "1px solid rgba(255,255,255,0.1)", overflow: "hidden", position: "relative" }}>
                                                                    {currentImg ? (
                                                                        <img src={currentImg} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt={`Slide ${slideNum}`} />
                                                                    ) : (
                                                                        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", opacity: 0.1 }}>
                                                                            <ImageIcon size={60} />
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                <div style={{ padding: "10px", background: "rgba(0,0,0,0.3)", borderRadius: "4px" }}>
                                                                    <p style={{ margin: 0, fontSize: "9px", color: "#666", fontWeight: "700", fontFamily: "monospace", overflow: "hidden", textOverflow: "ellipsis" }}>
                                                                        {currentImg || 'SIN IMAGEN'}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>

                                                {/* VISOR DE BIBLIOTECA DE MARKETING (RECURSOS JPG) */}
                                                <div style={{ marginTop: '60px', padding: '40px', background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.03)', borderRadius: '12px' }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                                                        <div>
                                                            <h3 style={{ color: 'var(--accent-turquoise)', fontSize: '14px', fontWeight: '900', letterSpacing: '4px', margin: 0, textTransform: 'uppercase' }}>BIBLIOTECA DE MARKETING</h3>
                                                            <p style={{ color: '#444', fontSize: '11px', fontWeight: '700', margin: '5px 0 0' }}>RECURSOS LIVIANOS (JPG) TRATADOS PARA CORREO Y WEB</p>
                                                        </div>
                                                        <button
                                                            onClick={fetchMarketingStorage}
                                                            style={{ padding: '10px 20px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', color: '#999', borderRadius: '4px', fontSize: '10px', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
                                                        >
                                                            <RefreshCw size={14} className={marketingLibraryLoading ? 'animate-spin' : ''} />
                                                            REFRESCAR
                                                        </button>
                                                    </div>

                                                    {marketingLibraryLoading && marketingLibraryImages.length === 0 ? (
                                                        <div style={{ height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                            <Loader2 className="animate-spin" size={30} color="var(--accent-turquoise)" />
                                                        </div>
                                                    ) : (
                                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '20px' }}>
                                                            {marketingLibraryImages.map((url, i) => (
                                                                <div
                                                                    key={i}
                                                                    onClick={() => setActiveImage(url)}
                                                                    style={{
                                                                        aspectRatio: '1/1',
                                                                        background: '#000',
                                                                        borderRadius: '4px',
                                                                        border: `2px solid ${activeImage === url ? 'var(--accent-turquoise)' : 'rgba(255,255,255,0.05)'}`,
                                                                        cursor: 'pointer',
                                                                        overflow: 'hidden',
                                                                        transition: 'all 0.3s',
                                                                        position: 'relative',
                                                                        transform: activeImage === url ? 'scale(0.95)' : 'scale(1)'
                                                                    }}
                                                                >
                                                                    <img src={url} style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: activeImage === url ? 1 : 0.7 }} alt={`Mkt ${i}`} />
                                                                    {activeImage === url && (
                                                                        <div style={{ position: 'absolute', top: '10px', right: '10px', background: 'var(--accent-turquoise)', borderRadius: '50%', width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                                            <Check size={12} color="black" />
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </React.Fragment>
                                )
                            }

                            {
                                activeTab === "marketing" && (
                                    <React.Fragment>
                                        <div className="custom-scroll" style={{ padding: "60px", overflowY: "auto", backgroundColor: "#050505", gridColumn: "1 / -1", height: '100%' }}>
                                            <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
                                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "40px" }}>
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                                        <h2 style={{ color: "white", fontFamily: "var(--font-heading)", fontSize: "32px", margin: 0, letterSpacing: "4px", textTransform: "uppercase" }}>
                                                            AI CONTENT <span style={{ color: "var(--accent-gold)" }}>FACTORY</span>
                                                        </h2>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                                            {marketingImage && (
                                                                <div style={{ display: "flex", alignItems: "center", gap: "10px", background: "rgba(0,212,189,0.05)", padding: "5px 12px", borderRadius: "100px", border: "1px solid rgba(0,212,189,0.1)" }}>
                                                                    <span style={{ fontSize: "9px", color: "var(--accent-turquoise)", fontWeight: "900", letterSpacing: "1px" }}>IMAGEN LISTA</span>
                                                                    <img src={marketingImage} style={{ width: "20px", height: "20px", borderRadius: "50%", objectFit: "cover", border: "1px solid var(--accent-turquoise)" }} />
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>

                                                    <div style={{ display: "flex", gap: "15px", alignItems: 'center' }}>
                                                        {/* SKU INPUT — Primary Input @seo_mkt */}
                                                        <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                                <input
                                                                    type="text"
                                                                    placeholder="INGRESA SKU DEL PRODUCTO"
                                                                    value={marketingSkuInput}
                                                                    onChange={(e) => {
                                                                        setMarketingSkuInput(e.target.value.toUpperCase());
                                                                        setMarketingProductContext(null);
                                                                    }}
                                                                    onBlur={(e) => handleSkuSearch(e.target.value)}
                                                                    onKeyDown={(e) => { if (e.key === 'Enter') handleSkuSearch(marketingSkuInput); }}
                                                                    style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${marketingProductContext ? 'var(--accent-turquoise)' : marketingSkuInput && !isSearchingSku ? 'rgba(255,71,87,0.5)' : 'rgba(255,255,255,0.15)'}`, padding: '14px 20px', borderRadius: '4px', color: 'white', fontSize: '12px', fontWeight: '800', width: '240px', outline: 'none', letterSpacing: '2px', transition: 'border-color 0.3s' }}
                                                                />
                                                                {isSearchingSku && <Loader2 className="animate-spin" size={14} style={{ color: 'var(--accent-turquoise)', position: 'absolute', right: '12px' }} />}
                                                            </div>
                                                            {marketingProductContext && (
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '3px 8px', background: 'rgba(0,212,189,0.08)', borderRadius: '3px', border: '1px solid rgba(0,212,189,0.2)' }}>
                                                                    <Check size={10} style={{ color: 'var(--accent-turquoise)' }} />
                                                                    <span style={{ fontSize: '9px', color: 'var(--accent-turquoise)', fontWeight: '700', letterSpacing: '1px' }}>{marketingProductContext.nombre} · {marketingProductContext.caracteristicas.length} SPECS</span>
                                                                </div>
                                                            )}
                                                            {marketingSkuInput && !marketingProductContext && !isSearchingSku && (
                                                                <span style={{ fontSize: '9px', color: 'rgba(255,71,87,0.8)', letterSpacing: '1px', paddingLeft: '4px' }}>SKU NO ENCONTRADO</span>
                                                            )}
                                                        </div>
                                                        <div style={{ display: 'flex', gap: '10px' }}>
                                                            <button
                                                                onClick={handleGenerateMarketingAI}
                                                                disabled={isGeneratingAI || !activeImage || !marketingProductContext}
                                                                style={{ background: marketingProductContext ? "rgba(0,212,189,0.1)" : 'rgba(255,255,255,0.03)', border: `1px solid ${marketingProductContext ? 'var(--accent-turquoise)' : 'rgba(255,255,255,0.1)'}`, color: marketingProductContext ? "var(--accent-turquoise)" : '#444', padding: "15px 40px", borderRadius: "4px", fontSize: "14px", fontWeight: "900", cursor: marketingProductContext ? "pointer" : 'not-allowed', textTransform: "uppercase", display: 'flex', alignItems: 'center', gap: '12px', transition: 'all 0.3s', boxShadow: marketingProductContext ? '0 0 20px rgba(0, 212, 189, 0.1)' : 'none' }}
                                                                onMouseEnter={(e) => { if (marketingProductContext) e.currentTarget.style.background = 'rgba(0,212,189,0.2)'; }}
                                                                onMouseLeave={(e) => { if (marketingProductContext) e.currentTarget.style.background = 'rgba(0,212,189,0.1)'; }}
                                                            >
                                                                {isGeneratingAI ? <Loader2 className="animate-spin" size={18} /> : <Sparkles size={18} />}
                                                                {isGeneratingAI ? "GENERANDO..." : "GEMINI"}
                                                            </button>
                                                        </div>
                                                        <button
                                                            onClick={handleSaveMarketingAI}
                                                            disabled={!generatedMarketing || isSaving}
                                                            style={{ background: "var(--accent-gold)", color: "black", padding: "15px 30px", borderRadius: "4px", fontSize: "11px", fontWeight: "900", cursor: "pointer", textTransform: "uppercase" }}
                                                        >
                                                            {isSaving ? "GUARDANDO..." : "GUARDAR Y ENVIAR"}
                                                        </button>
                                                    </div>
                                                </div>

                                                {generatedMarketing ? (
                                                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "40px" }}>
                                                        <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", padding: "30px", borderRadius: "8px" }}>
                                                            <h3 style={{ color: "var(--accent-gold)", fontSize: "14px", marginBottom: "20px" }}>ESTRUCTURA DE DATOS</h3>
                                                            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                                                                <div>
                                                                    <label style={{ color: "#555", fontSize: "10px", display: "block", marginBottom: "5px" }}>ASUNTO</label>
                                                                    <input
                                                                        value={generatedMarketing.subject}
                                                                        onChange={(e) => handleMarketingChange('subject', e.target.value)}
                                                                        style={{ width: "100%", background: "#000", border: "1px solid #333", padding: "12px", color: "white", borderRadius: "4px" }}
                                                                    />
                                                                </div>
                                                                <div>
                                                                    <label style={{ color: "#555", fontSize: "10px", display: "block", marginBottom: "5px" }}>TITULAR L1</label>
                                                                    <input
                                                                        value={generatedMarketing.part1}
                                                                        onChange={(e) => handleMarketingChange('part1', e.target.value)}
                                                                        style={{ width: "100%", background: "#000", border: "1px solid #333", padding: "12px", color: "white", borderRadius: "4px" }}
                                                                    />
                                                                </div>
                                                                <div>
                                                                    <label style={{ color: "#555", fontSize: "10px", display: "block", marginBottom: "5px" }}>DESCRIPCIÓN L2</label>
                                                                    <textarea
                                                                        value={generatedMarketing.part2}
                                                                        onChange={(e) => handleMarketingChange('part2', e.target.value)}
                                                                        style={{ width: "100%", height: "100px", background: "#000", border: "1px solid #333", padding: "12px", color: "#888", borderRadius: "4px" }}
                                                                    />
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div style={{ background: "#fff", padding: "40px", borderRadius: "8px", overflowY: "auto", maxHeight: "600px", border: '1px solid #333' }}>
                                                            <iframe
                                                                srcDoc={generatedMarketing.html.replace('IMAGE_URL_PLACEHOLDER', marketingImage || (selectedProduct?.images?.[0] || ''))}
                                                                style={{ width: "100%", height: "100%", minHeight: "600px", border: "none" }}
                                                                title="Marketing Preview"
                                                            />
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div style={{ height: "400px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", opacity: marketingImage ? 1 : 0.2, border: "2px dashed #444", borderRadius: "12px", overflow: "hidden" }}>
                                                        {marketingImage ? (
                                                            <img src={marketingImage} style={{ maxWidth: '80%', maxHeight: '300px', objectFit: 'contain', borderRadius: '4px', boxShadow: '0 20px 50px rgba(0,0,0,0.5)' }} />
                                                        ) : (
                                                            <Sparkles size={60} />
                                                        )}
                                                        <p style={{ marginTop: "20px", letterSpacing: "2px", color: marketingImage ? "var(--accent-turquoise)" : "#666", fontWeight: marketingImage ? "700" : "400" }}>
                                                            {marketingImage ? "IMAGEN RECIBIDA: PULSA 'GENERAR'" : "ENVÍA UNA IMAGEN DESDE INSUMO"}
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </React.Fragment>
                                )
                            }


                        </div>
                    </motion.div>
                </motion.div >
            )
            }
        </AnimatePresence >
    );
}
