'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, Trash2, Layers, Loader2, Save, Image as ImageIcon, Check, Star, RefreshCw, Plus, Sparkles, Send, Globe, RotateCw, FlipHorizontal, Maximize2, Minimize2, Square, RectangleHorizontal, RectangleVertical, ChevronRight } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { generateMarketingAI, generateWebAI, generateSEOFilenameAI, MarketingContent, WebSectionContent, getMarketingHTMLTemplate } from '@/lib/gemini';
import { useWebContent } from '@/hooks/useWebContent';

interface PendingProduct {
    id: string;
    wholesaler: string;
    external_id: string;
    name: string;
    original_description: string;
    images: string[];
    technical_specs: any;
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
    const [selectedWholesaler, setSelectedWholesaler] = useState('Todos');
    const [pendingProducts, setPendingProducts] = useState<PendingProduct[]>([]);
    const [selectedProduct, setSelectedProduct] = useState<PendingProduct | null>(null);

    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [customCategories, setCustomCategories] = useState<string[]>(['ECOLÓGICOS', 'BOTELLAS, MUGS Y TAZAS', 'CUADERNOS, LIBRETAS Y MEMO SET', 'MOCHILAS, BOLSOS Y MORRALES', 'BOLÍGRAFOS', 'ACCESORIOS']);
    const [isAddingCategory, setIsAddingCategory] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [isAddingNew, setIsAddingNew] = useState(false);
    const [newProductForm, setNewProductForm] = useState<Partial<PendingProduct>>({
        name: '',
        original_description: '',
        images: [],
        wholesaler: 'ZECAT', // Default
        category: 'BOTELLA, MUG Y TAZA',
        external_id: '',
        is_premium: false,
        seo_title: '',
        seo_keywords: '',
        seo_description: '',
        for_marketing: false,
        technical_specs: [] // Usaremos esto para las caracterÍsticas
    });

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
    const [activeImage, setActiveImage] = useState<string | null>(null); // GLOBAL: Used for Hero/Marketing tabs preview
    const [pendingFiles, setPendingFiles] = useState<Record<string, File>>({});
    const [isSaving, setIsSaving] = useState(false);
    const [activeTab, setActiveTab] = useState<'insumo' | 'catalog' | 'gallery' | 'hero' | 'marketing'>('catalog');

    // Estados para Laboratorio de Insumos
    const [insumoFile, setInsumoFile] = useState<File | null>(null);
    const [insumoMetadata, setInsumoMetadata] = useState<{
        originalSize: number;
        originalWidth: number;
        originalHeight: number;
        optimizedSize: number;
        optimizedWidth: number;
        optimizedHeight: number;
        optimizedUrl: string | null;
        optimizedBlob: Blob | null;
    } | null>(null);
    const [insumoTarget, setInsumoTarget] = useState<'web' | 'email'>('web');
    const [isProcessingInsumo, setIsProcessingInsumo] = useState(false);
    const [insumoTransform, setInsumoTransform] = useState({
        zoom: 1,
        rotation: 0,
        flipX: false,
        aspectRatio: 'original' as 'original' | '1:1' | '16:9' | '9:16',
        offsetX: 0,
        offsetY: 0
    });
    const [isDraggingInsumo, setIsDraggingInsumo] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [insumoAISEOFilename, setInsumoAISEOFilename] = useState<string | null>(null);

    // Estados para GestiÍn de GALERÍAS
    const [selectedGallerySection, setSelectedGallerySection] = useState<string>('ECOLÓGICOS');
    const [galleryImages, setGalleryImages] = useState<string[]>([]);
    const [uploadingGallery, setUploadingGallery] = useState(false);



    // AI CONTENT FACTORY STATE
    const [isGeneratingAI, setIsGeneratingAI] = useState(false);
    const [generatedMarketing, setGeneratedMarketing] = useState<MarketingContent | null>(null);
    const [generatedWeb, setGeneratedWeb] = useState<WebSectionContent | null>(null);
    const [aiStatus, setAiStatus] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('TODAS');
    const [isExpandingCategories, setIsExpandingCategories] = useState(false);
    const specialCategories = ['ECOLÓGICOS', 'BOTELLAS, MUGS Y TAZAS', 'CUADERNOS, LIBRETAS Y MEMO SET', 'MOCHILAS, BOLSOS Y MORRALES', 'BOLÍGRAFOS', 'ACCESORIOS'];
    const { content, updateSection } = useWebContent();



    const wholesalers = ['Todos', 'CATÁLOGO'];

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
        // Si el item viene de la tabla 'productos' (nueva estructura)
        if (item.nombre && item.imagen_principal) {
            return {
                id: item.id,
                wholesaler: item.wholesaler || 'Ecomoving',
                external_id: item.id, // Para productos en vivo usamos el ID como externo
                name: item.nombre,
                original_description: item.descripcion || '',
                images: Array.isArray(item.imagenes_galeria) ? item.imagenes_galeria : [item.imagen_principal],
                category: item.categoria || 'Otros',
                is_premium: item.is_premium || false,
                technical_specs: Array.isArray(item.features) ? item.features : [],
                found_at: item.created_at || new Date().toISOString(),
                status: 'approved'
            };
        }

        // Si el item viene de 'agent_buffer' (estructura original)
        let specs: string[] = [];
        const ts = item.technical_specs;

        if (ts) {
            if (Array.isArray(ts)) {
                specs = ts;
            } else if (typeof ts === 'object') {
                if (Array.isArray(ts.specs)) {
                    specs = ts.specs;
                } else {
                    specs = Object.entries(ts)
                        .filter(([k]) => k !== 'category')
                        .map(([k, v]) => `${k}: ${v}`);
                }
            } else if (typeof ts === 'string') {
                specs = ts.split('\n').filter(l => l.trim());
            }
        }

        return {
            ...item,
            category: ts?.category || item.category || 'Otros',
            is_premium: ts?.is_premium || false,
            seo_title: ts?.seo_title || '',
            seo_keywords: ts?.seo_keywords || '',
            seo_description: ts?.seo_description || '',
            for_marketing: ts?.for_marketing || false,
            technical_specs: specs.length > 0 ? specs : (item.description ? [item.description] : [])
        };
    };

    // Cargar productos del buffer
    useEffect(() => {
        if (isOpen) {
            fetchBuffer();
        }
    }, [isOpen, selectedWholesaler]); // Recargar cuando cambie el mayorista

    const fetchBuffer = async () => {
        setLoading(true);
        try {
            let data: any[] | null = [];
            let error: any = null;

            if (selectedWholesaler === 'CATÁLOGO') {
                // Fetch from the new live catalog table
                const { data: liveData, error: liveError } = await supabase
                    .from('productos')
                    .select('*')
                    .order('created_at', { ascending: false });
                data = liveData;
                error = liveError;
            } else {
                // Si el mayorista es especÍfico o Todos, mostrar pendientes
                const query = supabase
                    .from('agent_buffer')
                    .select('*')
                    .eq('status', 'pending')
                    .order('found_at', { ascending: false });

                if (selectedWholesaler !== 'Todos' && selectedWholesaler !== 'CATÁLOGO') {
                    query.eq('wholesaler', selectedWholesaler);
                }

                const { data: bufferData, error: bufferError } = await query;
                data = bufferData;
                error = bufferError;
            }

            if (error) throw error;

            const mappedData = (data || []).map(mapProductFromDB);

            setPendingProducts(mappedData);
            if (mappedData.length > 0 && !selectedProduct) {
                setSelectedProduct(mappedData[0]);
                setCatalogViewerImage(mappedData[0].images[0]);
            }
        } catch (error) {
            console.error('Error al cargar datos:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleProductSelect = (p: PendingProduct) => {
        setSelectedProduct(p);
        setCatalogViewerImage(p.images[0]);
        // Limpiar imagen de Insumo para evitar conflictos en Marketing/Hero
        setActiveImage(null);
    };

    // Funciones para GestiÍn de GALERÍAS
    const fetchGallery = async (section: string) => {
        try {
            const { data, error } = await supabase
                .from('web_contenido')
                .select('content')
                .eq('section', section)
                .maybeSingle();

            if (error) {
                console.warn('Note: Section not found or error fetching:', section);
                setGalleryImages([]);
                return;
            }

            setGalleryImages(data?.content?.gallery || []);
        } catch (err) {
            console.error('Unexpected error fetching gallery:', err);
            setGalleryImages([]);
        }
    };

    useEffect(() => {
        if (activeTab === 'gallery') {
            fetchGallery(selectedGallerySection);
        }
    }, [activeTab, selectedGallerySection]);

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
                    .upload(`galerias/${fileName}`, optimizedBlob, { contentType: 'image/webp' });

                if (uploadError) throw uploadError;

                const { data: { publicUrl } } = supabase.storage
                    .from('imagenes-marketing')
                    .getPublicUrl(`galerias/${fileName}`);

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

    const handleRemoveGalleryImage = async (index: number) => {
        const newImages = galleryImages.filter((_, i) => i !== index);

        try {
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
        } catch (err) {
            console.error('Error removing gallery image:', err);
        }
    };





    const handlePublish = async () => {
        if (!selectedProduct || !catalogViewerImage) return;

        setIsSaving(true);
        let finalMainImage = catalogViewerImage;

        try {
            // OPTIMIZACIíN DE IMAGEN: Si la imagen es externa o no estÍ optimizada, la procesamos
            const isExternal = !catalogViewerImage.includes('supabase.co');
            const isBlob = catalogViewerImage.startsWith('blob:');

            if (isExternal || isBlob) {
                try {
                    console.log('?? Optimizando imagen para publicaciín...');

                    let blob: Blob;
                    if (isBlob) {
                        // Si es un blob local (reciín cargado), lo obtenemos de los archivos pendientes o del fetch
                        const file = pendingFiles[catalogViewerImage];
                        if (file) {
                            const result = await optimizeImage(file);
                            blob = result.blob;
                        } else {
                            const res = await fetch(catalogViewerImage);
                            const originalBlob = await res.blob();
                            const result = await optimizeImage(new File([originalBlob], 'image.jpg', { type: originalBlob.type }));
                            blob = result.blob;
                        }
                    } else {
                        // Si es una URL externa (Stocksur, etc.)
                        const res = await fetch(catalogViewerImage);
                        if (!res.ok) throw new Error('No se pudo descargar la imagen externa');
                        const originalBlob = await res.blob();
                        const result = await optimizeImage(new File([originalBlob], 'image.jpg', { type: originalBlob.type }));
                        blob = result.blob;
                    }

                    // Subir a Supabase Storage (imagenes-marketing)
                    const fileName = `PROD-${selectedProduct.external_id}-${Date.now()}.webp`;
                    const { data: uploadData, error: uploadError } = await supabase.storage
                        .from('imagenes-marketing')
                        .upload(fileName, blob, { contentType: 'image/webp' });

                    if (uploadError) throw uploadError;

                    const { data: { publicUrl } } = supabase.storage
                        .from('imagenes-marketing')
                        .getPublicUrl(fileName);

                    finalMainImage = publicUrl;
                    console.log('? Imagen optimizada y subida:', finalMainImage);
                } catch (optError) {
                    console.error('?? Fallí la optimizaciín automÍtica (posible COR), usando original:', optError);
                    // No bloqueamos la publicaciÍn si falla la optimizaciÍn (COR es comÍn)
                }
            }

            // 1. Marcar como aprobado en Supabase con los datos editados
            const { error } = await supabase
                .from('agent_buffer')
                .update({
                    status: 'approved',
                    name: selectedProduct.name,
                    original_description: selectedProduct.original_description,
                    technical_specs: {
                        ...selectedProduct.technical_specs,
                        is_premium: selectedProduct.is_premium,
                        seo_title: selectedProduct.seo_title,
                        seo_keywords: selectedProduct.seo_keywords,
                        seo_description: selectedProduct.seo_description,
                        for_marketing: selectedProduct.for_marketing
                    },
                    images: [finalMainImage, ...selectedProduct.images.filter(i => i !== catalogViewerImage)]
                })
                .eq('id', selectedProduct.id);

            if (error) throw error;

            // 2. Aquí normalmente se integraría al catalog.json (en un flujo automatizado)
            setPendingProducts(prev => prev.filter(p => p.id !== selectedProduct.id));
            setSelectedProduct(null);
            setCatalogViewerImage(null);

            alert('íProducto Publicado y Optimizado! El sistema lo integrarí en el catílogo.');
        } catch (error) {
            console.error('Error al publicar:', error);
            alert('Error al publicar el producto');
        } finally {
            setIsSaving(false);
        }
    };

    const handleCreateManual = async () => {
        // Validamos Título e Imígenes
        if (!newProductForm.original_description || !newProductForm.images || newProductForm.images.length === 0) {
            alert('El Título y al menos una imagen son obligatorios para guardar.');
            return;
        }

        setIsSaving(true);
        setLoading(true);

        try {
            const finalImageUrls: string[] = [];
            let mainImageUrl = '';

            // Procesar cada imagen: si es local (blob:), optimizar y subir. Si ya es URL de Supabase, mantener.
            for (const imgPath of (newProductForm.images || [])) {
                if (imgPath.startsWith('blob:')) {
                    const file = pendingFiles[imgPath];
                    if (file) {
                        try {
                            const { blob: optimizedBlob } = await optimizeImage(file);
                            const fileName = `${Math.random()}-${Date.now()}.webp`;
                            const filePath = `catalog-manual/${fileName}`;

                            const { error: uploadError } = await supabase.storage
                                .from('imagenes-marketing')
                                .upload(filePath, optimizedBlob, { contentType: 'image/webp' });

                            if (uploadError) throw uploadError;

                            const { data: { publicUrl } } = supabase.storage
                                .from('imagenes-marketing')
                                .getPublicUrl(filePath);

                            finalImageUrls.push(publicUrl);
                            if (imgPath === activeManualImage) mainImageUrl = publicUrl;
                        } catch (err) {
                            console.error('Error procesando imagen local:', err);
                        }
                    }
                } else {
                    finalImageUrls.push(imgPath);
                    if (imgPath === activeManualImage) mainImageUrl = imgPath;
                }
            }

            // Reordenar para que la imagen seleccionada como principal sea la primera
            const orderedImages = mainImageUrl
                ? [mainImageUrl, ...finalImageUrls.filter(url => url !== mainImageUrl)]
                : finalImageUrls;

            // Construir el objeto de inserciÍn explícitamente
            const productToInsert = {
                wholesaler: newProductForm.wholesaler || 'Manual',
                external_id: newProductForm.external_id || `MAN-${Date.now().toString().slice(-6)}`,
                name: (newProductForm.name || newProductForm.original_description || '').trim(),
                original_description: (newProductForm.original_description || '').trim(),
                // Almacenamos la categoría dentro de technical_specs ya que la columna no existe en la DB
                images: orderedImages,
                technical_specs: {
                    category: (newProductForm.category || 'OTRO').trim().toUpperCase(),
                    specs: newProductForm.technical_specs || [],
                    is_premium: newProductForm.is_premium || false,
                    seo_title: newProductForm.seo_title || '',
                    seo_keywords: newProductForm.seo_keywords || '',
                    seo_description: newProductForm.seo_description || '',
                    for_marketing: newProductForm.for_marketing || false
                },
                status: 'pending',
                found_at: new Date().toISOString()
            };

            const { data, error } = await supabase
                .from('agent_buffer')
                .upsert([productToInsert], { onConflict: 'external_id' })
                .select();

            if (error) {
                console.error('Error de Supabase:', error);
                throw new Error(error.message);
            }

            if (data) {
                const formattedProduct = mapProductFromDB(data[0]);
                setPendingProducts([formattedProduct, ...pendingProducts]);
                setSelectedProduct(formattedProduct);
                setCatalogViewerImage(formattedProduct.images[0]);
                setIsAddingNew(false);

                // Limpiar ObjectURLs para evitar fugas de memoria
                Object.keys(pendingFiles).forEach(url => URL.revokeObjectURL(url));
                setPendingFiles({});

                setNewProductForm({
                    name: '',
                    original_description: '',
                    images: [],
                    wholesaler: 'Manual',
                    category: 'BOTELLA, MUG Y TAZA',
                    external_id: 'MAN-' + Date.now().toString().slice(-6),
                    is_premium: false,
                    technical_specs: []
                });
                alert('íProducto creado exitosamente en el buffer!');
            }
        } catch (error: any) {
            console.error('Error al crear producto:', error);
            alert(`Error al crear el producto: ${error.message || 'Error desconocido'}`);
        } finally {
            setIsSaving(false);
            setLoading(false);
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

                    // 1. Determinar dimensiones base segÍn Target
                    const MAX_WIDTH = target === 'web' ? 1600 : 800;
                    const QUALITY = target === 'web' ? 0.82 : 0.75;

                    let baseWidth = img.width;
                    let baseHeight = img.height;

                    if (img.width > MAX_WIDTH) {
                        const scaleFactor = MAX_WIDTH / img.width;
                        baseWidth = MAX_WIDTH;
                        baseHeight = img.height * scaleFactor;
                    }

                    // 2. Determinar dimensiones de salida segÍn Aspect Ratio
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

                    // 3. Aplicar Transformaciones
                    ctx.save();
                    // El translate incluye ahora el encuadre manual (drag)
                    ctx.translate((canvas.width / 2) + transform.offsetX, (canvas.height / 2) + transform.offsetY);

                    if (transform.flipX) ctx.scale(-1, 1);
                    ctx.rotate((transform.rotation * Math.PI) / 180);

                    const drawScale = transform.zoom * (baseWidth / img.width);
                    ctx.scale(drawScale, drawScale);

                    ctx.imageSmoothingEnabled = true;
                    ctx.imageSmoothingQuality = 'high';

                    // Dibujar centrando la imagen original
                    ctx.drawImage(img, -img.width / 2, -img.height / 2);
                    ctx.restore();

                    canvas.toBlob((blob) => {
                        if (blob) {
                            resolve({ blob, width: finalWidth, height: finalHeight });
                        } else {
                            reject('Error al generar blob');
                        }
                    }, 'image/webp', QUALITY);
                };
            };
            reader.onerror = (e) => reject(e);
        });
    };

    // Reprocesar insumo si cambia el target o las transformaciones
    useEffect(() => {
        if (insumoFile) {
            const reprocess = async () => {
                setIsProcessingInsumo(true);
                try {
                    const result = await optimizeImage(insumoFile, insumoTarget, insumoTransform);
                    const optimizedUrl = URL.createObjectURL(result.blob);

                    setInsumoMetadata(prev => prev ? {
                        ...prev,
                        optimizedSize: result.blob.size,
                        optimizedWidth: Math.round(result.width),
                        optimizedHeight: Math.round(result.height),
                        optimizedUrl: optimizedUrl,
                        optimizedBlob: result.blob
                    } : null);
                } catch (err) {
                    console.error(err);
                } finally {
                    setIsProcessingInsumo(false);
                }
            };
            reprocess();
        }
    }, [insumoTarget, insumoTransform]);




    const handleInsumoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setInsumoFile(file);
        setIsProcessingInsumo(true);

        try {
            setInsumoAISEOFilename(null); // Resetear nombre IA anterior
            // Obtener dimensiones originales
            const originalMeta = await new Promise<{ w: number, h: number }>((res) => {
                const img = new Image();
                img.src = URL.createObjectURL(file);
                img.onload = () => res({ w: img.width, h: img.height });
            });

            const result = await optimizeImage(file, insumoTarget);

            const optimizedUrl = URL.createObjectURL(result.blob);

            setInsumoMetadata({
                originalSize: file.size,
                originalWidth: originalMeta.w,
                originalHeight: originalMeta.h,
                optimizedSize: result.blob.size,
                optimizedWidth: result.width,
                optimizedHeight: result.height,
                optimizedUrl: optimizedUrl,
                optimizedBlob: result.blob
            });
        } catch (err) {
            console.error(err);
            alert("Error al procesar insumo");
        } finally {
            setIsProcessingInsumo(false);
        }
    };

    const handleGenerateInsumoAIFileName = async () => {
        if (!insumoMetadata?.optimizedUrl) return;
        setIsProcessingInsumo(true);
        try {
            const name = await generateSEOFilenameAI(
                insumoMetadata.optimizedUrl,
                selectedGallerySection || selectedProduct?.category || "",
                selectedProduct?.name || ""
            );
            setInsumoAISEOFilename(name);
        } catch (err: any) {
            console.error(err);
            alert(`Error de IA: ${err.message || 'Error desconocido'}`);
        } finally {
            setIsProcessingInsumo(false);
        }
    };

    const handleRouteInsumo = async (destination: 'catalog' | 'hero' | 'gallery' | 'marketing') => {
        if (!insumoMetadata?.optimizedUrl || !insumoMetadata.optimizedBlob) return;

        if (destination === 'catalog') {
            setIsAddingNew(true);
            const finalImage = insumoMetadata.optimizedUrl!;
            setNewProductForm(prev => ({
                ...prev,
                images: [finalImage]
            }));
            setActiveManualImage(finalImage);
            setActiveTab('catalog');
        } else if (destination === 'hero') {
            setIsSaving(true);
            try {
                const fileName = insumoAISEOFilename
                    ? `HERO-${insumoAISEOFilename}-${Date.now()}.webp`
                    : `HERO-INSUMO-${Date.now()}.webp`;

                const { error: uploadError } = await supabase.storage
                    .from('imagenes-marketing')
                    .upload(`hero/${fileName}`, insumoMetadata.optimizedBlob!, { contentType: 'image/webp' });

                if (uploadError) throw uploadError;

                const { data: { publicUrl } } = supabase.storage
                    .from('imagenes-marketing')
                    .getPublicUrl(`hero/${fileName}`);

                setActiveImage(publicUrl);
                setActiveTab('hero');
                setTimeout(() => alert('Imagen subida a la nube con éxito. Ahora selecciona en qué Slide (1, 2 o 3) quieres aplicarla.'), 300);
            } catch (err) {
                console.error('Error subiendo imagen para hero:', err);
                alert('Error al subir imagen al servidor.');
            } finally {
                setIsSaving(false);
            }
        } else if (destination === 'marketing') {
            setIsSaving(true);
            try {
                // Convertir WebP a JPEG para compatibilidad con Outlook (no soporta WebP)
                const jpegBlob = await new Promise<Blob>((resolve, reject) => {
                    const img = new Image();
                    img.onload = () => {
                        const canvas = document.createElement('canvas');
                        canvas.width = img.width;
                        canvas.height = img.height;
                        const ctx = canvas.getContext('2d')!;
                        ctx.drawImage(img, 0, 0);
                        canvas.toBlob((blob) => {
                            if (blob) resolve(blob);
                            else reject(new Error('Error al convertir imagen a JPEG'));
                        }, 'image/jpeg', 0.90);
                    };
                    img.onerror = reject;
                    img.src = insumoMetadata.optimizedUrl!;
                });

                const fileName = insumoAISEOFilename
                    ? `MKT-${insumoAISEOFilename}-${Date.now()}.jpg`
                    : `MKT-INSUMO-${Date.now()}.jpg`;

                const { error: uploadError } = await supabase.storage
                    .from('imagenes-marketing')
                    .upload(fileName, jpegBlob, { contentType: 'image/jpeg' });

                if (uploadError) throw uploadError;

                const { data: { publicUrl } } = supabase.storage
                    .from('imagenes-marketing')
                    .getPublicUrl(fileName);

                // Usar la URL pública (no el blob: temporal)
                setActiveImage(publicUrl);
                // Limpiamos el producto seleccionado para evitar que la IA confunda el contexto
                setSelectedProduct(null);
                setActiveTab('marketing');
            } catch (err) {
                console.error('Error subiendo imagen para marketing:', err);
                alert('Error al subir imagen. Usando versión local temporal.');
                // Fallback: usar blob URL temporal (funciona para previsualizar pero no para enviar)
                setActiveImage(insumoMetadata.optimizedUrl);
                setSelectedProduct(null);
                setActiveTab('marketing');
            } finally {
                setIsSaving(false);
            }
        } else if (destination === 'gallery') {
            setIsSaving(true);
            try {
                const fileName = insumoAISEOFilename
                    ? `${insumoAISEOFilename}.webp`
                    : `IN-GAL-${selectedGallerySection.toUpperCase()}-${Date.now()}.webp`;

                const { error: uploadError } = await supabase.storage
                    .from('imagenes-marketing')
                    .upload(`galerias/${fileName}`, insumoMetadata.optimizedBlob!, { contentType: 'image/webp' });

                if (uploadError) throw uploadError;

                const { data: { publicUrl } } = supabase.storage
                    .from('imagenes-marketing')
                    .getPublicUrl(`galerias/${fileName}`);

                const newGallery = [...galleryImages, publicUrl];

                const { data: currentData } = await supabase
                    .from('web_contenido')
                    .select('content')
                    .eq('section', selectedGallerySection)
                    .single();

                const updatedContent = {
                    ...(currentData?.content || {}),
                    gallery: newGallery
                };

                await supabase
                    .from('web_contenido')
                    .upsert({
                        section: selectedGallerySection,
                        content: updatedContent,
                        updated_by: 'CatalogHub-Insumo'
                    }, { onConflict: 'section' });

                setGalleryImages(newGallery);
                setActiveTab('gallery');
                alert(`íImagen guardada en ${selectedGallerySection.toUpperCase()}!`);
            } catch (err) {
                console.error(err);
                alert('Error al enviar a galería');
            } finally {
                setIsSaving(false);
            }
        }
    };

    const handleOpenNew = () => {
        setIsAddingNew(true);
        setNewProductForm({
            name: '',
            original_description: '',
            images: [],
            wholesaler: selectedWholesaler === 'Todos' ? 'Stocksur' : selectedWholesaler,
            category: 'Mug',
            external_id: `MAN-${Date.now().toString().slice(-6)}`,
            is_premium: false,
            technical_specs: []
        });
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
            const section = 'hero';
            // slideIndex llega como 0, 1, 2
            const heroKey = slideIndex === 0 ? 'background_image' : `background_image_${slideIndex + 1}`;

            const { data: currentData } = await supabase
                .from('web_contenido')
                .select('content')
                .eq('section', section)
                .single();

            const currentContent = currentData?.content || {};
            const updatedContent = {
                ...currentContent,
                [heroKey]: activeImage,
                // Solo actualizamos el título si hay un producto seleccionado
                ...(slideIndex === 0 && selectedProduct ? { title: (selectedProduct.seo_title || selectedProduct.name).toUpperCase() } : {})
            };

            const { error } = await supabase
                .from('web_contenido')
                .upsert({
                    section,
                    content: updatedContent,
                    updated_by: 'CatalogHub'
                }, { onConflict: 'section' });

            if (error) throw error;
            alert(`ÍSlide Hero ${slideIndex} actualizado con íxito!`);
        } catch (err) {
            console.error('Error setting hero:', err);
            alert('Error al actualizar el Hero');
        } finally {
            setIsSaving(false);
        }
    };

    const handleGenerateMarketingAI = async () => {
        if (!selectedProduct && !activeImage) {
            alert('Selecciona un producto o carga una imagen primero');
            return;
        }

        setIsGeneratingAI(true);
        setAiStatus('?? Gemini está analizando tu producto...');
        try {
            // Si hay producto seleccionado, usamos sus datos. Si no, pedimos a la IA que analice la imagen pura.
            const context = selectedProduct
                ? `Producto: ${selectedProduct.name}\nDescripción: ${selectedProduct.seo_description || selectedProduct.original_description}\nSpecs: ${selectedProduct.technical_specs?.join(', ')}`
                : "Analiza la imagen y deduce el producto, creando un copy de marketing atractivo.";

            const imageToUse = activeImage || (selectedProduct?.images?.[0] || null);

            if (!imageToUse) throw new Error("No hay imagen disponible para generar contenido");

            const content = await generateMarketingAI(imageToUse, context);
            setGeneratedMarketing(content);
            setAiStatus('? Contenido de Marketing generado');
        } catch (err: any) {
            console.error(err);
            setAiStatus('? Error: ' + err.message);
        } finally {
            setIsGeneratingAI(false);
            setTimeout(() => setAiStatus(''), 3000);
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

        // Permitimos guardar si hay activeImage O selectedProduct
        const imageToUse = activeImage || (selectedProduct?.images?.[0] || null);

        if (!imageToUse) {
            alert("No hay imagen para guardar");
            return;
        }

        setIsSaving(true);
        try {
            const { data: lastMsg } = await supabase
                .from("marketing")
                .select("nombre_envio")
                .order("nombre_envio", { ascending: false })
                .limit(1)
                .maybeSingle();

            const nextNumber = (lastMsg?.nombre_envio || 0) + 1;
            // Asegurar que usamos la imagen correcta en el HTML final
            const finalHtml = generatedMarketing.html.replace('IMAGE_URL_PLACEHOLDER', imageToUse);

            // Extraer nombre de archivo de la URL para Brevo
            const nombreImagen = (() => {
                try {
                    const urlPath = new URL(imageToUse).pathname;
                    return urlPath.split('/').pop() || `campaña-${nextNumber}.webp`;
                } catch {
                    return `campaña-${nextNumber}.webp`;
                }
            })();

            const { error } = await supabase
                .from("marketing")
                .insert([{
                    nombre_envio: nextNumber,
                    asunto: generatedMarketing.subject,
                    cuerpo_html: finalHtml,
                    cuerpo: `${generatedMarketing.part1}\n\n${generatedMarketing.part2}`,
                    imagen_url: imageToUse,
                    nombre_imagen: nombreImagen,
                    activo: true
                }]);

            if (error) throw error;
            alert('ÍMensaje de marketing guardado correctamente!');
            setGeneratedMarketing(null);
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
            const context = `Producto: ${selectedProduct.name}\nCategoría: ${selectedProduct.category}`;
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

    const handleSaveChanges = async () => {
        if (!selectedProduct) return;
        setIsSaving(true);
        try {
            const { error } = await supabase
                .from('agent_buffer')
                .update({
                    wholesaler: selectedProduct.wholesaler,
                    external_id: selectedProduct.external_id,
                    name: selectedProduct.name,
                    images: [activeImage || selectedProduct.images[0], ...selectedProduct.images.filter(i => i !== (activeImage || selectedProduct.images[0]))],
                    technical_specs: {
                        category: (selectedProduct.category || 'OTRO').trim().toUpperCase(),
                        specs: selectedProduct.technical_specs,
                        is_premium: selectedProduct.is_premium,
                        seo_title: selectedProduct.seo_title,
                        seo_keywords: selectedProduct.seo_keywords,
                        seo_description: selectedProduct.seo_description,
                        for_marketing: selectedProduct.for_marketing
                    }
                })
                .eq('id', selectedProduct.id);

            if (error) throw error;
            alert('ÍCambios guardados en el buffer!');
        } catch (error) {
            console.error('Error al guardar:', error);
            alert('Error al guardar los cambios');
        } finally {
            setTimeout(() => setIsSaving(false), 500);
        }
    };

    const handleReject = async () => {
        if (!selectedProduct) return;

        if (confirm('ÍEstÍs seguro de que quieres eliminar este producto PERMANENTEMENTE del buffer?')) {
            try {
                const { error } = await supabase
                    .from('agent_buffer')
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
    };

    const filteredProducts = pendingProducts.filter(p => {
        const matchesWholesaler = selectedWholesaler === 'Todos' || p.wholesaler === selectedWholesaler;
        const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
            p.external_id.toLowerCase().includes(search.toLowerCase()) ||
            p.category?.toLowerCase().includes(search.toLowerCase());

        return matchesWholesaler && matchesSearch;
    });

    useEffect(() => {
        if (!isOpen) return;

        if (filteredProducts.length > 0) {
            const isStillVisible = filteredProducts.some(p => p.id === selectedProduct?.id);
            if (!isStillVisible) {
                setSelectedProduct(filteredProducts[0]);
                setActiveImage(filteredProducts[0].images[0]);
            }
        } else {
            setSelectedProduct(null);
            setActiveImage(null);
        }
    }, [selectedWholesaler, search, selectedCategory, pendingProducts, isOpen]);

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
                                        Insumo
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
                                        GALERÍAS
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('hero')}
                                        style={{ background: 'none', border: 'none', color: activeTab === 'hero' ? 'var(--accent-turquoise)' : '#555', fontSize: '12px', fontWeight: '800', cursor: 'pointer', letterSpacing: '2px', textTransform: 'uppercase', padding: '10px 0', borderBottom: activeTab === 'hero' ? '2px solid var(--accent-turquoise)' : '2px solid transparent', transition: 'all 0.3s' }}
                                    >
                                        Hero
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('marketing')}
                                        style={{ background: 'none', border: 'none', color: activeTab === 'marketing' ? 'var(--accent-turquoise)' : '#555', fontSize: '12px', fontWeight: '800', cursor: 'pointer', letterSpacing: '2px', textTransform: 'uppercase', padding: '10px 0', borderBottom: activeTab === 'marketing' ? '2px solid var(--accent-turquoise)' : '2px solid transparent', transition: 'all 0.3s' }}
                                    >
                                        Marketing
                                    </button>
                                </div>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '30px' }}>
                                <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', padding: '14px', borderRadius: '50%', cursor: 'pointer', color: '#999', transition: 'all 0.3s' }}>
                                    <X size={26} />
                                </button>
                            </div>
                        </div>

                        {activeTab === 'catalog' && (
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <div style={{ padding: '0 60px 18px 60px', backgroundColor: 'rgba(0,0,0,0.2)', display: 'flex', gap: '40px', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                                    <div style={{ display: 'flex', gap: '12px' }}>
                                        {wholesalers.map(w => (
                                            <button
                                                key={w}
                                                onClick={() => setSelectedWholesaler(w)}
                                                style={{
                                                    padding: '12px 28px',
                                                    borderRadius: '2px',
                                                    border: '1px solid',
                                                    borderColor: selectedWholesaler === w ? 'var(--accent-turquoise)' : 'rgba(255,255,255,0.05)',
                                                    backgroundColor: selectedWholesaler === w ? 'rgba(0, 212, 189, 0.05)' : 'transparent',
                                                    color: selectedWholesaler === w ? 'var(--accent-turquoise)' : '#888',
                                                    fontSize: '14px',
                                                    fontWeight: '600',
                                                    cursor: 'pointer',
                                                    transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                                                    textTransform: 'uppercase',
                                                    letterSpacing: '2px',
                                                    fontFamily: 'var(--font-body)'
                                                }}
                                            >
                                                {w}
                                            </button>
                                        ))}
                                    </div>
                                    <div style={{ flex: 1, position: 'relative' }}>
                                        <Search style={{ position: 'absolute', left: '25px', top: '50%', transform: 'translateY(-50%)', width: '20px', height: '20px', color: '#444' }} />
                                        <input
                                            type="text"
                                            placeholder="Buscar por nombre, SKU o categoría..."
                                            value={search}
                                            onChange={(e) => setSearch(e.target.value)}
                                            style={{ width: '100%', padding: '18px 25px 18px 65px', backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '2px', color: 'white', fontSize: '17px', outline: 'none', letterSpacing: '1px', fontFamily: 'var(--font-body)' }}
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        <div style={{ flex: 1, display: 'grid', gridTemplateColumns: activeTab === 'catalog' ? '380px 1fr' : activeTab === 'gallery' ? '300px 1fr' : activeTab === 'insumo' ? '1fr' : '1fr', overflow: 'hidden' }}>
                            {activeTab === 'insumo' && (
                                <div className="custom-scroll" style={{ padding: "60px", overflowY: "auto", backgroundColor: "#050505", gridColumn: "1 / -1" }}>
                                    <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
                                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "40px" }}>
                                            <h2 style={{ color: "white", fontFamily: "var(--font-heading)", fontSize: "32px", margin: 0, letterSpacing: "4px", textTransform: "uppercase" }}>
                                                LABORATORIO DE <span style={{ color: "var(--accent-gold)" }}>INSUMO</span>
                                            </h2>
                                            <p style={{ color: "#444", fontSize: "12px", fontWeight: "700", letterSpacing: "2px" }}>PUERTA DE ENTRADA PREMIUM</p>
                                        </div>

                                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "60px" }}>
                                            {/* Panel de Carga y PrevisualizaciÍn */}
                                            <div style={{ display: "flex", flexDirection: "column", gap: "30px" }}>
                                                <div
                                                    onMouseDown={(e) => {
                                                        if (!insumoMetadata?.optimizedUrl) return;
                                                        setIsDraggingInsumo(true);
                                                        setDragStart({ x: e.clientX, y: e.clientY });
                                                    }}
                                                    onMouseMove={(e) => {
                                                        if (!isDraggingInsumo) return;
                                                        const dx = e.clientX - dragStart.x;
                                                        const dy = e.clientY - dragStart.y;
                                                        setInsumoTransform(prev => ({
                                                            ...prev,
                                                            offsetX: prev.offsetX + dx,
                                                            offsetY: prev.offsetY + dy
                                                        }));
                                                        setDragStart({ x: e.clientX, y: e.clientY });
                                                    }}
                                                    onMouseUp={() => setIsDraggingInsumo(false)}
                                                    onMouseLeave={() => setIsDraggingInsumo(false)}
                                                    style={{
                                                        width: "100%",
                                                        aspectRatio: "16/9",
                                                        background: "#000",
                                                        border: "2px dashed rgba(255,255,255,0.05)",
                                                        borderRadius: "8px",
                                                        display: "flex",
                                                        flexDirection: "column",
                                                        alignItems: "center",
                                                        justifyContent: "center",
                                                        position: "relative",
                                                        overflow: "hidden",
                                                        cursor: insumoMetadata?.optimizedUrl ? (isDraggingInsumo ? "grabbing" : "grab") : "default"
                                                    }}
                                                >
                                                    {insumoMetadata?.optimizedUrl ? (
                                                        <React.Fragment>
                                                            <img src={insumoMetadata.optimizedUrl} style={{ width: "100%", height: "100%", objectFit: "contain", pointerEvents: "none" }} alt="Insumo" />
                                                            <div style={{ position: "absolute", bottom: "10px", right: "10px", background: "rgba(0,0,0,0.5)", padding: "4px 10px", borderRadius: "100px", fontSize: "10px", color: "var(--accent-turquoise)", fontWeight: "800", pointerEvents: "none" }}>
                                                                PO: {insumoTransform.offsetX.toFixed(0)}x | {insumoTransform.offsetY.toFixed(0)}y
                                                            </div>
                                                        </React.Fragment>
                                                    ) : (
                                                        <>
                                                            <ImageIcon size={60} style={{ marginBottom: "20px", opacity: 0.2 }} />
                                                            <p style={{ fontSize: "10px", color: "#444", fontWeight: "800", letterSpacing: "2px" }}>ARRASTRA O SELECCIONA IMAGEN CRUDA</p>
                                                        </>
                                                    )}

                                                    {isProcessingInsumo && (
                                                        <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.8)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "15px" }}>
                                                            <RefreshCw className="animate-spin" size={30} color="var(--accent-turquoise)" />
                                                            <span style={{ color: "var(--accent-turquoise)", fontSize: "10px", fontWeight: "900", letterSpacing: "2px" }}>OPTIMIZANDO...</span>
                                                        </div>
                                                    )}
                                                    {!insumoMetadata?.optimizedUrl && (
                                                        <input
                                                            type="file"
                                                            accept="image/*"
                                                            onChange={handleInsumoUpload}
                                                            style={{ position: "absolute", inset: 0, opacity: 0, cursor: "pointer" }}
                                                        />
                                                    )}
                                                </div>

                                                <div style={{ display: "flex", gap: "10px" }}>
                                                    <button
                                                        onClick={() => setInsumoTarget('web')}
                                                        style={{ flex: 1, padding: "15px", borderRadius: "4px", border: "1px solid", borderColor: insumoTarget === 'web' ? 'var(--accent-turquoise)' : '#222', background: insumoTarget === 'web' ? 'rgba(0,212,189,0.1)' : 'transparent', color: insumoTarget === 'web' ? 'var(--accent-turquoise)' : '#444', fontSize: "10px", fontWeight: "900", cursor: "pointer", letterSpacing: "1px" }}
                                                    >
                                                        TARGET: WEB / CATÁLOGO
                                                    </button>
                                                    <button
                                                        onClick={() => setInsumoTarget('email')}
                                                        style={{ flex: 1, padding: "15px", borderRadius: "4px", border: "1px solid", borderColor: insumoTarget === 'email' ? 'var(--accent-turquoise)' : '#222', background: insumoTarget === 'email' ? 'rgba(0,212,189,0.1)' : 'transparent', color: insumoTarget === 'email' ? 'var(--accent-turquoise)' : '#444', fontSize: "10px", fontWeight: "900", cursor: "pointer", letterSpacing: "1px" }}
                                                    >
                                                        TARGET: CORREO / MARKETING
                                                    </button>
                                                </div>

                                                {/* Panel de TransformaciÍn Experta */}
                                                <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "8px", padding: "20px" }}>
                                                    <h3 style={{ color: "var(--accent-gold)", fontSize: "10px", fontWeight: "900", letterSpacing: "2px", marginBottom: "20px", textTransform: "uppercase" }}>TRANSFORMACIÍN EXPERTA</h3>

                                                    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                                                        {/* Aspect Ratio Row */}
                                                        <div>
                                                            <p style={{ fontSize: "9px", color: "#444", fontWeight: "800", marginBottom: "10px", letterSpacing: "1px" }}>FORMATO / ASPECT RATIO</p>
                                                            <div style={{ display: "flex", gap: "8px" }}>
                                                                {[
                                                                    { id: 'original', icon: <ImageIcon size={14} />, label: 'ORIG' },
                                                                    { id: '1:1', icon: <Square size={14} />, label: '1:1' },
                                                                    { id: '16:9', icon: <RectangleHorizontal size={14} />, label: '16:9' },
                                                                    { id: '9:16', icon: <RectangleVertical size={14} />, label: '9:16' }
                                                                ].map(ratio => (
                                                                    <button
                                                                        key={ratio.id}
                                                                        onClick={() => setInsumoTransform(prev => ({ ...prev, aspectRatio: ratio.id as any }))}
                                                                        style={{ flex: 1, padding: "10px", background: insumoTransform.aspectRatio === ratio.id ? "rgba(0,212,189,0.1)" : "transparent", border: "1px solid", borderColor: insumoTransform.aspectRatio === ratio.id ? "var(--accent-turquoise)" : "rgba(255,255,255,0.1)", borderRadius: "4px", color: insumoTransform.aspectRatio === ratio.id ? "var(--accent-turquoise)" : "#666", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: "5px" }}
                                                                    >
                                                                        {ratio.icon}
                                                                        <span style={{ fontSize: "8px", fontWeight: "900" }}>{ratio.label}</span>
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        </div>

                                                        {/* Zoom & Rotation Controls */}
                                                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                                                            <div>
                                                                <p style={{ fontSize: "9px", color: "#444", fontWeight: "800", marginBottom: "10px", letterSpacing: "1px" }}>ZOOM DINíMICO</p>
                                                                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                                                    <button onClick={() => setInsumoTransform(prev => ({ ...prev, zoom: Math.max(0.1, prev.zoom - 0.1) }))} style={{ padding: "8px", background: "none", border: "1px solid rgba(255,255,255,0.1)", color: "#888", borderRadius: "4px", cursor: "pointer" }}><Minimize2 size={14} /></button>
                                                                    <span style={{ fontSize: "11px", color: "white", fontWeight: "700", minWidth: "40px", textAlign: "center" }}>{(insumoTransform.zoom * 100).toFixed(0)}%</span>
                                                                    <button onClick={() => setInsumoTransform(prev => ({ ...prev, zoom: prev.zoom + 0.1 }))} style={{ padding: "8px", background: "none", border: "1px solid rgba(255,255,255,0.1)", color: "#888", borderRadius: "4px", cursor: "pointer" }}><Maximize2 size={14} /></button>
                                                                </div>
                                                            </div>
                                                            <div>
                                                                <p style={{ fontSize: "9px", color: "#444", fontWeight: "800", marginBottom: "10px", letterSpacing: "1px" }}>ROTACIíN</p>
                                                                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                                                    <button onClick={() => setInsumoTransform(prev => ({ ...prev, rotation: (prev.rotation - 90) % 360 }))} style={{ padding: "8px", background: "none", border: "1px solid rgba(255,255,255,0.1)", color: "#888", borderRadius: "4px", cursor: "pointer" }}><RotateCw size={14} style={{ transform: "scaleX(-1)" }} /></button>
                                                                    <span style={{ fontSize: "11px", color: "white", fontWeight: "700", minWidth: "40px", textAlign: "center" }}>{insumoTransform.rotation}Í</span>
                                                                    <button onClick={() => setInsumoTransform(prev => ({ ...prev, rotation: (prev.rotation + 90) % 360 }))} style={{ padding: "8px", background: "none", border: "1px solid rgba(255,255,255,0.1)", color: "#888", borderRadius: "4px", cursor: "pointer" }}><RotateCw size={14} /></button>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Mirror & Reset */}
                                                        <div style={{ display: "flex", gap: "10px" }}>
                                                            <button
                                                                onClick={() => setInsumoTransform(prev => ({ ...prev, flipX: !prev.flipX }))}
                                                                style={{ flex: 1, padding: "12px", background: insumoTransform.flipX ? "rgba(0,212,189,0.1)" : "transparent", border: "1px solid", borderColor: insumoTransform.flipX ? "var(--accent-turquoise)" : "rgba(255,255,255,0.1)", borderRadius: "4px", color: insumoTransform.flipX ? "var(--accent-turquoise)" : "#888", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "10px", fontSize: "9px", fontWeight: "900", letterSpacing: "1px" }}
                                                            >
                                                                <FlipHorizontal size={14} /> ESPEJAR (FLIP X)
                                                            </button>
                                                            <button
                                                                onClick={() => setInsumoTransform({ zoom: 1, rotation: 0, flipX: false, aspectRatio: 'original', offsetX: 0, offsetY: 0 })}
                                                                style={{ padding: "12px", background: "none", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "4px", color: "#444", cursor: "pointer" }}
                                                                title="Resetear Transformaciones"
                                                            >
                                                                <RefreshCw size={14} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Panel de MÍtricas y Enrutamiento */}
                                            <div style={{ display: "flex", flexDirection: "column", gap: "40px" }}>
                                                <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "8px", padding: "30px" }}>
                                                    <h3 style={{ color: "var(--accent-gold)", fontSize: "11px", fontWeight: "900", letterSpacing: "3px", marginBottom: "30px", textTransform: "uppercase" }}>MÍTRICA DE RENDIMIENTO</h3>

                                                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "40px" }}>
                                                        <div>
                                                            <p style={{ fontSize: "9px", color: "#555", fontWeight: "800", marginBottom: "10px", letterSpacing: "1px" }}>PARÍMETRO DE ENTRADA</p>
                                                            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                                                                <div style={{ display: "flex", justifyContent: "space-between" }}>
                                                                    <span style={{ fontSize: "12px", color: "#888" }}>TamaÍo:</span>
                                                                    <span style={{ fontSize: "12px", color: "white", fontWeight: "700" }}>{insumoMetadata ? (insumoMetadata.originalSize / 1024).toFixed(1) + " KB" : "-"}</span>
                                                                </div>
                                                                <div style={{ display: "flex", justifyContent: "space-between" }}>
                                                                    <span style={{ fontSize: "12px", color: "#888" }}>Format:</span>
                                                                    <span style={{ fontSize: "12px", color: "white", fontWeight: "700" }}>{insumoFile ? insumoFile.type.split('/')[1].toUpperCase() : "-"}</span>
                                                                </div>
                                                                <div style={{ display: "flex", flexDirection: "column", gap: "2px", borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: "8px" }}>
                                                                    <span style={{ fontSize: "9px", color: "#444", fontWeight: "800", textTransform: "uppercase" }}>Archivo Entrada:</span>
                                                                    <span style={{ fontSize: "10px", color: "#aaa", fontWeight: "700", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={insumoFile?.name}>
                                                                        {insumoFile ? insumoFile.name : "-"}
                                                                    </span>
                                                                </div>
                                                                <div style={{ display: "flex", justifyContent: "space-between" }}>
                                                                    <span style={{ fontSize: "12px", color: "#888" }}>Res:</span>
                                                                    <span style={{ fontSize: "12px", color: "white", fontWeight: "700" }}>{insumoMetadata ? `${insumoMetadata.originalWidth}x${insumoMetadata.originalHeight}` : "-"}</span>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div>
                                                            <p style={{ fontSize: "9px", color: "#555", fontWeight: "800", marginBottom: "10px", letterSpacing: "1px" }}>PARÍMETRO DE SALIDA (OPT.)</p>
                                                            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                                                                <div style={{ display: "flex", justifyContent: "space-between" }}>
                                                                    <span style={{ fontSize: "12px", color: "#888" }}>TamaÍo:</span>
                                                                    <span style={{ fontSize: "12px", color: "var(--accent-turquoise)", fontWeight: "900" }}>{insumoMetadata ? (insumoMetadata.optimizedSize / 1024).toFixed(1) + " KB" : "-"}</span>
                                                                </div>
                                                                <div style={{ display: "flex", justifyContent: "space-between" }}>
                                                                    <span style={{ fontSize: "12px", color: "#888" }}>Format:</span>
                                                                    <span style={{ fontSize: "12px", color: "var(--accent-turquoise)", fontWeight: "900" }}>WEBP</span>
                                                                </div>
                                                                <div style={{ display: "flex", flexDirection: "column", gap: "2px", borderTop: "1px solid rgba(0,212,189,0.1)", paddingTop: "8px", position: 'relative' }}>
                                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                                        <span style={{ fontSize: "9px", color: "var(--accent-turquoise)", fontWeight: "900", textTransform: "uppercase" }}>Nombre SEO (AI):</span>
                                                                        <button
                                                                            onClick={handleGenerateInsumoAIFileName}
                                                                            disabled={isProcessingInsumo}
                                                                            style={{ background: 'none', border: 'none', color: 'var(--accent-gold)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '9px', fontWeight: '800' }}
                                                                        >
                                                                            <Sparkles size={10} /> IA MAGIC
                                                                        </button>
                                                                    </div>
                                                                    <span style={{ fontSize: "10px", color: insumoAISEOFilename ? "var(--accent-gold)" : "var(--accent-turquoise)", fontWeight: "700", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                                                        {insumoAISEOFilename ? (insumoAISEOFilename + ".webp") : (insumoFile ? slugifyForSEO(insumoFile.name.split('.')[0]) : "-")}
                                                                    </span>
                                                                </div>
                                                                <div style={{ display: "flex", justifyContent: "space-between" }}>
                                                                    <span style={{ fontSize: "12px", color: "#888" }}>Res:</span>
                                                                    <span style={{ fontSize: "12px", color: "var(--accent-turquoise)", fontWeight: "900" }}>{insumoMetadata ? `${insumoMetadata.optimizedWidth}x${insumoMetadata.optimizedHeight}` : "-"}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {insumoMetadata && (
                                                        <div style={{ marginTop: "20px", padding: "12px", background: "rgba(0,212,189,0.03)", border: "1px solid rgba(0,212,189,0.1)", borderRadius: "4px", textAlign: "center" }}>
                                                            <span style={{ color: "var(--accent-turquoise)", fontSize: "12px", fontWeight: "900", letterSpacing: "1px" }}>
                                                                AHORRO DE PESO: {(((insumoMetadata.originalSize - insumoMetadata.optimizedSize) / insumoMetadata.originalSize) * 100).toFixed(1)}%
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>

                                                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                                                    <button
                                                        disabled={!insumoMetadata?.optimizedUrl}
                                                        onClick={() => handleRouteInsumo('catalog')}
                                                        style={{ padding: "12px", background: "white", color: "black", border: "none", borderRadius: "4px", fontSize: "10px", fontWeight: "900", letterSpacing: "1px", cursor: insumoMetadata?.optimizedUrl ? "pointer" : "not-allowed", opacity: insumoMetadata?.optimizedUrl ? 1 : 0.3 }}
                                                    >
                                                        ENVIAR A CATÁLOGO
                                                    </button>
                                                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px" }}>
                                                        <button
                                                            disabled={!insumoMetadata?.optimizedUrl}
                                                            onClick={() => handleRouteInsumo('hero')}
                                                            style={{ padding: "12px", background: "rgba(255,255,255,0.05)", color: "white", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "4px", fontSize: "10px", fontWeight: "900", letterSpacing: "1px", cursor: insumoMetadata?.optimizedUrl ? "pointer" : "not-allowed", opacity: insumoMetadata?.optimizedUrl ? 1 : 0.3 }}
                                                        >
                                                            USAR EN HERO
                                                        </button>
                                                        <button
                                                            disabled={!insumoMetadata?.optimizedUrl}
                                                            onClick={() => handleRouteInsumo('gallery')}
                                                            style={{ padding: "12px", background: "rgba(255,255,255,0.05)", color: "white", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "4px", fontSize: "10px", fontWeight: "900", letterSpacing: "1px", cursor: insumoMetadata?.optimizedUrl ? "pointer" : "not-allowed", opacity: insumoMetadata?.optimizedUrl ? 1 : 0.3 }}
                                                        >
                                                            A GALERÍA
                                                        </button>
                                                        <button
                                                            disabled={!insumoMetadata?.optimizedUrl}
                                                            onClick={() => handleRouteInsumo('marketing')}
                                                            style={{ padding: "12px", background: "rgba(255,255,255,0.05)", color: "white", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "4px", fontSize: "10px", fontWeight: "900", letterSpacing: "1px", cursor: insumoMetadata?.optimizedUrl ? "pointer" : "not-allowed", opacity: insumoMetadata?.optimizedUrl ? 1 : 0.3 }}
                                                        >
                                                            A MARKETING
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>


                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'catalog' && (
                                <React.Fragment>
                                    {/* Left List */}
                                    <div className="custom-scroll" style={{ borderRight: '1px solid rgba(255,255,255,0.05)', overflowY: 'auto', padding: '32px 40px', backgroundColor: 'rgba(0,0,0,0.2)' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                                            <p style={{ fontSize: '11px', color: 'var(--accent-gold)', fontWeight: '800', textTransform: 'uppercase', margin: 0, letterSpacing: '3px', fontFamily: 'var(--font-body)' }}>
                                                {loading ? 'Cargando buffer...' : `Nuevos Descubrimientos (${filteredProducts.length})`}
                                            </p>
                                            <button
                                                onClick={handleOpenNew}
                                                style={{ background: 'var(--accent-turquoise)', border: 'none', color: 'black', padding: '10px 20px', borderRadius: '4px', fontSize: '11px', fontWeight: '800', cursor: 'pointer', letterSpacing: '1px' }}
                                            >
                                                + NUEVO
                                            </button>
                                        </div>

                                        {loading ? (
                                            <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
                                                <Loader2 className="animate-spin" color="var(--accent-turquoise)" size={35} />
                                            </div>
                                        ) : filteredProducts.map(p => (
                                            <motion.div
                                                key={p.id}
                                                onClick={() => {
                                                    handleProductSelect(p);
                                                    setIsAddingNew(false);
                                                }}
                                                whileHover={{ scale: 1.02, x: 5 }}
                                                style={{
                                                    padding: '20px',
                                                    backgroundColor: selectedProduct?.id === p.id ? 'rgba(0, 212, 189, 0.05)' : 'rgba(255, 255, 255, 0.01)',
                                                    borderRadius: '4px',
                                                    border: '1px solid',
                                                    borderColor: selectedProduct?.id === p.id ? 'var(--accent-turquoise)' : 'rgba(255, 255, 255, 0.03)',
                                                    cursor: 'pointer',
                                                    marginBottom: '20px',
                                                    display: 'flex',
                                                    gap: '20px',
                                                    alignItems: 'center',
                                                    transition: 'all 0.3s'
                                                }}
                                            >
                                                <div style={{ position: 'relative', width: '80px', height: '80px', borderRadius: '50%', overflow: 'hidden', backgroundColor: 'black', border: '1px solid rgba(255,255,255,0.05)' }}>
                                                    <img src={p.images[0]} style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.8 }} />
                                                </div>
                                                <div style={{ flex: 1 }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                                                        <span style={{ fontSize: '10px', color: 'var(--accent-gold)', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '2px' }}>{p.wholesaler}</span>
                                                        <span style={{ color: '#333' }}>Í</span>
                                                        <span style={{ fontSize: '10px', color: '#555', fontWeight: '500' }}>{p.external_id}</span>
                                                    </div>
                                                    <p style={{ margin: 0, fontSize: '17px', fontWeight: '600', color: 'white', letterSpacing: '0.5px', fontFamily: 'var(--font-heading)', textTransform: 'uppercase' }}>{p.name}</p>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>

                                    {/* Right Detail */}
                                    <div className="custom-scroll" style={{ padding: '30px 60px', overflowY: 'auto', backgroundColor: '#050505' }}>
                                        {isAddingNew ? (
                                            <div style={{ display: 'flex', flexDirection: 'column', height: '100%', maxWidth: '1600px', margin: '0 auto', width: '100%' }}>
                                                <div style={{ height: '20px' }} /> {/* Spacer */}

                                                <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: '50px', flex: 1 }}>
                                                    {/* Columna Izquierda: Visual y Biblioteca (Reducida) */}
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
                                                        {/* Hero Viewer Principal */}
                                                        <div>
                                                            <div style={{
                                                                width: '100%',
                                                                aspectRatio: '1/1',
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
                                                                {activeManualImage ? (
                                                                    <motion.img
                                                                        key={activeManualImage}
                                                                        initial={{ opacity: 0, scale: 0.95 }}
                                                                        animate={{ opacity: 1, scale: 1 }}
                                                                        src={activeManualImage}
                                                                        style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                                                                    />
                                                                ) : (
                                                                    <div style={{ textAlign: 'center', opacity: 0.1 }}>
                                                                        <ImageIcon size={120} color="white" />
                                                                    </div>
                                                                )}

                                                                {loading && (
                                                                    <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '20px', zIndex: 10 }}>
                                                                        <Loader2 className="animate-spin" size={40} color="var(--accent-turquoise)" />
                                                                        <span style={{ color: 'var(--accent-turquoise)', fontSize: '10px', fontWeight: '800', letterSpacing: '3px' }}>PROCESANDO...</span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>

                                                        {/* Biblioteca de Activos */}
                                                        <div>
                                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                                                                <label style={{ fontSize: '11px', color: 'var(--accent-gold)', fontWeight: '800', letterSpacing: '3px', textTransform: 'uppercase' }}>BIBLIOTECA DE ACTIVOS</label>
                                                                <div style={{ display: 'flex', gap: '15px' }}>
                                                                    <button
                                                                        onClick={() => {
                                                                            const url = prompt('Ingresa la URL de la imagen:');
                                                                            if (url) {
                                                                                const currentImages = newProductForm.images || [];
                                                                                const newImages = [...currentImages, url];
                                                                                setNewProductForm({ ...newProductForm, images: newImages });
                                                                                if (!activeManualImage) setActiveManualImage(url);
                                                                            }
                                                                        }}
                                                                        style={{ background: 'none', border: 'none', color: 'var(--accent-turquoise)', fontSize: '10px', fontWeight: '800', cursor: 'pointer', letterSpacing: '1px' }}
                                                                    >
                                                                        + URL
                                                                    </button>
                                                                </div>
                                                            </div>

                                                            {newProductForm.images && newProductForm.images.length > 0 && (
                                                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', maxHeight: '300px', overflowY: 'auto', padding: '10px', background: 'rgba(255,255,255,0.01)', borderRadius: '2px', border: '1px solid rgba(255,255,255,0.03)' }} className="custom-scroll">
                                                                    {newProductForm.images.map((img, i) => (
                                                                        <div
                                                                            key={i}
                                                                            onClick={() => setActiveManualImage(img)}
                                                                            style={{
                                                                                position: 'relative',
                                                                                aspectRatio: '1/1',
                                                                                borderRadius: '2px',
                                                                                overflow: 'hidden',
                                                                                border: `1px solid ${activeManualImage === img ? 'var(--accent-turquoise)' : 'rgba(255,255,255,0.05)'}`,
                                                                                cursor: 'pointer'
                                                                            }}
                                                                        >
                                                                            <img src={img} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                                            {i === 0 && (
                                                                                <div style={{
                                                                                    position: 'absolute',
                                                                                    bottom: 0,
                                                                                    left: 0,
                                                                                    right: 0,
                                                                                    background: 'var(--accent-gold)',
                                                                                    color: 'black',
                                                                                    fontSize: '7px',
                                                                                    fontWeight: '900',
                                                                                    textAlign: 'center',
                                                                                    padding: '2px 0',
                                                                                    textTransform: 'uppercase',
                                                                                    letterSpacing: '1px',
                                                                                    zIndex: 5
                                                                                }}>
                                                                                    PRINCIPAL
                                                                                </div>
                                                                            )}

                                                                            {activeManualImage === img && (
                                                                                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 212, 189, 0.2)', border: '2px solid var(--accent-turquoise)', pointerEvents: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                                                    <Star size={16} color="var(--accent-turquoise)" fill="var(--accent-turquoise)" />
                                                                                </div>
                                                                            )}

                                                                            <button
                                                                                onClick={(e) => {
                                                                                    e.stopPropagation();
                                                                                    const remaining = newProductForm.images?.filter((_, idx) => idx !== i) || [];
                                                                                    setNewProductForm({ ...newProductForm, images: remaining });
                                                                                    if (activeManualImage === img) setActiveManualImage(remaining[0] || null);
                                                                                }}
                                                                                style={{ position: 'absolute', top: '2px', right: '2px', background: 'rgba(239, 68, 68, 0.9)', color: 'white', border: 'none', borderRadius: '50%', width: '18px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 10 }}>
                                                                                <X size={10} />
                                                                            </button>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* Columna Derecha: Metadatos + Specs */}
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                                        {/* Fila 1: Mayorista, SKU y Categoría */}
                                                        <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
                                                            <div style={{ width: '140px' }}>
                                                                <label style={{ display: 'block', fontSize: '11px', color: 'var(--accent-gold)', marginBottom: '10px', fontWeight: '800', letterSpacing: '3px', textTransform: 'uppercase' }}>MAYORISTA</label>
                                                                <input
                                                                    type="text"
                                                                    value={newProductForm.wholesaler || ''}
                                                                    onChange={(e) => setNewProductForm({ ...newProductForm, wholesaler: e.target.value })}
                                                                    style={{ width: '100%', backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '2px', padding: '15px', color: 'white', fontSize: '15px', outline: 'none' }}
                                                                />
                                                            </div>
                                                            <div style={{ width: '140px' }}>
                                                                <label style={{ display: 'block', fontSize: '11px', color: 'var(--accent-gold)', marginBottom: '10px', fontWeight: '800', letterSpacing: '3px', textTransform: 'uppercase' }}>CÓDIGO / SKU</label>
                                                                <input
                                                                    type="text"
                                                                    value={newProductForm.external_id}
                                                                    onChange={(e) => setNewProductForm({ ...newProductForm, external_id: e.target.value })}
                                                                    style={{ width: '100%', backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '2px', padding: '15px', color: 'white', fontSize: '15px', outline: 'none' }}
                                                                />
                                                            </div>
                                                            <div style={{ flex: 1 }}>
                                                                <label style={{ display: 'block', fontSize: '11px', color: 'var(--accent-gold)', marginBottom: '10px', fontWeight: '800', letterSpacing: '3px', textTransform: 'uppercase' }}>CATEGORÍAS (USA COMA PARA VARIA)</label>
                                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                                    {/* Lista de Categorías Predefinidas */}
                                                                    <div style={{ position: 'relative', marginBottom: '8px' }}>
                                                                        <select
                                                                            value={newProductForm.category || ''}
                                                                            onChange={(e) => setNewProductForm({ ...newProductForm, category: e.target.value })}
                                                                            style={{
                                                                                width: '100%',
                                                                                padding: '16px 15px',
                                                                                backgroundColor: 'rgba(255,255,255,0.02)',
                                                                                border: '1px solid rgba(255,255,255,0.05)',
                                                                                color: 'white',
                                                                                fontSize: '11px',
                                                                                fontWeight: '700',
                                                                                borderRadius: '4px',
                                                                                outline: 'none',
                                                                                textTransform: 'uppercase',
                                                                                cursor: 'pointer',
                                                                                appearance: 'none', // Remove default arrow to style validly if desired, or keep it
                                                                                height: '48px'
                                                                            }}
                                                                        >
                                                                            <option value="" disabled>SELECCIONAR CATEGORÍA...</option>
                                                                            {customCategories.map(cat => (
                                                                                <option key={cat} value={cat} style={{ color: 'black' }}>
                                                                                    {cat}
                                                                                </option>
                                                                            ))}
                                                                        </select>
                                                                        <div style={{ position: 'absolute', right: '15px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--accent-turquoise)' }}>
                                                                            <ChevronRight size={14} style={{ transform: 'rotate(90deg)' }} />
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                <div style={{ width: '120px' }}>
                                                                    <label style={{ display: 'block', fontSize: '11px', color: 'var(--accent-gold)', marginBottom: '10px', fontWeight: '800', letterSpacing: '3px', textTransform: 'uppercase' }}>PREMIUM</label>
                                                                    <button
                                                                        onClick={() => setNewProductForm({ ...newProductForm, is_premium: !newProductForm.is_premium })}
                                                                        style={{
                                                                            width: '100%',
                                                                            height: '54px',
                                                                            backgroundColor: newProductForm.is_premium ? 'rgba(0, 212, 189, 0.2)' : 'rgba(255,255,255,0.02)',
                                                                            border: `1px solid ${newProductForm.is_premium ? 'var(--accent-turquoise)' : 'rgba(255,255,255,0.05)'}`,
                                                                            color: newProductForm.is_premium ? 'var(--accent-turquoise)' : '#555',
                                                                            borderRadius: '4px',
                                                                            cursor: 'pointer',
                                                                            fontSize: '10px',
                                                                            fontWeight: '900',
                                                                            transition: 'all 0.3s'
                                                                        }}
                                                                    >
                                                                        {newProductForm.is_premium ? 'SÍÍ' : 'NO'}
                                                                    </button>
                                                                </div>
                                                            </div>

                                                            {/* SECCIÓN SEO & MARKETING (NUEVO) */}
                                                            <div style={{ padding: '25px', background: 'rgba(212, 175, 55, 0.03)', borderRadius: '4px', border: '1px solid rgba(212, 175, 55, 0.1)', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                                    <label style={{ fontSize: '11px', color: 'var(--accent-gold)', fontWeight: '800', letterSpacing: '3px', textTransform: 'uppercase' }}>CONFIGURACIÓN SEO & MARKETING</label>
                                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                                        <span style={{ fontSize: '9px', color: '#555', fontWeight: '700' }}>¿APTO PARA CAMPAÑA?</span>
                                                                        <button
                                                                            onClick={() => setNewProductForm({ ...newProductForm, for_marketing: !newProductForm.for_marketing })}
                                                                            style={{ padding: '4px 12px', borderRadius: '20px', border: '1px solid', borderColor: newProductForm.for_marketing ? 'var(--accent-turquoise)' : '#333', backgroundColor: newProductForm.for_marketing ? 'rgba(0,212,189,0.1)' : 'transparent', color: newProductForm.for_marketing ? 'var(--accent-turquoise)' : '#555', fontSize: '10px', fontWeight: '800', cursor: 'pointer' }}
                                                                        >
                                                                            {newProductForm.for_marketing ? 'SÍÍ, MARKETING READY' : 'NO'}
                                                                        </button>
                                                                    </div>
                                                                </div>

                                                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                                                    <div>
                                                                        <label style={{ display: 'block', fontSize: '9px', color: 'rgba(255,255,255,0.4)', marginBottom: '5px', fontWeight: '700' }}>TÍTULO SEO (H1 SUGERIDO)</label>
                                                                        <input
                                                                            type="text"
                                                                            value={newProductForm.seo_title}
                                                                            onChange={(e) => setNewProductForm({ ...newProductForm, seo_title: e.target.value })}
                                                                            placeholder="Ej: Mochila Ejecutiva Premium..."
                                                                            style={{ width: '100%', backgroundColor: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.05)', padding: '10px', color: 'white', borderRadius: '2px', fontSize: '13px', outline: 'none' }}
                                                                        />
                                                                    </div>
                                                                    <div>
                                                                        <label style={{ display: 'block', fontSize: '9px', color: 'rgba(255,255,255,0.4)', marginBottom: '5px', fontWeight: '700' }}>KEYWORD</label>
                                                                        <input
                                                                            type="text"
                                                                            value={newProductForm.seo_keywords}
                                                                            onChange={(e) => setNewProductForm({ ...newProductForm, seo_keywords: e.target.value })}
                                                                            placeholder="regalos corporativos, sustentable..."
                                                                            style={{ width: '100%', backgroundColor: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.05)', padding: '10px', color: 'white', borderRadius: '2px', fontSize: '13px', outline: 'none' }}
                                                                        />
                                                                    </div>
                                                                </div>
                                                                <div>
                                                                    <label style={{ display: 'block', fontSize: '9px', color: 'rgba(255,255,255,0.4)', marginBottom: '5px', fontWeight: '700' }}>META DESCRIPCIÓN (INTENCIÓN DE VENTA)</label>
                                                                    <textarea
                                                                        value={newProductForm.seo_description}
                                                                        onChange={(e) => setNewProductForm({ ...newProductForm, seo_description: e.target.value })}
                                                                        placeholder="Breve descripción..."
                                                                        style={{ width: '100%', height: '60px', backgroundColor: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.05)', padding: '10px', color: '#999', borderRadius: '2px', fontSize: '12px', resize: 'none', outline: 'none' }}
                                                                    />
                                                                </div>
                                                            </div>

                                                            {/* Fila 2: Título ancho */}
                                                            <div>
                                                                <label style={{ display: 'block', fontSize: '11px', color: 'var(--accent-gold)', marginBottom: '10px', fontWeight: '800', letterSpacing: '3px', textTransform: 'uppercase' }}>TÍTULO DEL PRODUCTO</label>
                                                                <input
                                                                    type="text"
                                                                    value={newProductForm.original_description}
                                                                    onChange={(e) => setNewProductForm({ ...newProductForm, original_description: e.target.value })}
                                                                    style={{ width: '100%', backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '2px', padding: '18px', color: 'white', fontSize: '20px', fontWeight: '600', outline: 'none' }}
                                                                />
                                                            </div>

                                                            {/* Fila 3: Especificaciones anchas */}
                                                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                                                                <label style={{ display: 'block', fontSize: '11px', color: 'var(--accent-gold)', marginBottom: '15px', fontWeight: '800', letterSpacing: '2px', textTransform: 'uppercase' }}>ESPECIFICACIONE TÍCNICA COMPLETA</label>
                                                                <textarea
                                                                    value={Array.isArray(newProductForm.technical_specs) ? newProductForm.technical_specs.join('\n') : ''}
                                                                    onChange={(e) => setNewProductForm({ ...newProductForm, technical_specs: e.target.value.split('\n').filter(l => l.trim()) })}
                                                                    placeholder="Copia aquí la ficha tícnica del proveedor..."
                                                                    style={{ width: '100%', flex: 1, minHeight: '400px', backgroundColor: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '2px', padding: '25px', color: '#ccc', fontSize: '15px', outline: 'none', resize: 'none', lineHeight: '1.8', fontFamily: 'monospace' }}
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div style={{ marginTop: '40px', display: 'flex', gap: '20px', paddingBottom: '40px' }}>
                                                        <button
                                                            onClick={handleCreateManual}
                                                            disabled={isSaving}
                                                            style={{ flex: 1, backgroundColor: isSaving ? '#333' : 'var(--accent-gold)', color: 'black', border: 'none', padding: '25px', fontSize: '18px', fontWeight: '900', letterSpacing: '4px', cursor: isSaving ? 'not-allowed' : 'pointer', borderRadius: '4px', textTransform: 'uppercase', transition: 'all 0.3s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '15px' }}
                                                            onMouseEnter={(e) => !isSaving && (e.currentTarget.style.transform = 'translateY(-2px)')}
                                                            onMouseLeave={(e) => !isSaving && (e.currentTarget.style.transform = 'translateY(0)')}
                                                        >
                                                            {isSaving ? (
                                                                <>
                                                                    <Loader2 className="animate-spin" size={24} />
                                                                    PROCESANDO IMAGEN...
                                                                </>
                                                            ) : 'GUARDAR PRODUCTO EN EL BUFFER'}
                                                        </button>
                                                        <button
                                                            onClick={() => setIsAddingNew(false)}
                                                            style={{ backgroundColor: 'transparent', color: '#555', border: '1px solid #333', padding: '25px 50px', fontSize: '16px', fontWeight: '700', letterSpacing: '2px', cursor: 'pointer', borderRadius: '4px', textTransform: 'uppercase' }}
                                                        >
                                                            CANCELAR
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ) : selectedProduct ? (
                                            <div style={{ display: 'flex', flexDirection: 'column', height: '100%', maxWidth: '1600px', margin: '0 auto', width: '100%' }}>
                                                <div style={{ height: '20px' }} /> {/* Spacer */}

                                                <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '60px', flex: 1 }}>
                                                    {/* Columna Izquierda: Visual y Biblioteca (Reducida) */}
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                                        <div>
                                                            <div style={{
                                                                width: '100%',
                                                                aspectRatio: '1/1',
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

                                                        {/* Miniaturas */}
                                                        <div>
                                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                                                <label style={{ fontSize: '11px', color: 'var(--accent-gold)', fontWeight: '800', letterSpacing: '3px', textTransform: 'uppercase' }}>BIBLIOTECA DE ACTIVOS</label>
                                                                <button
                                                                    onClick={() => {
                                                                        const url = prompt('Ingresa la URL de la imagen:');
                                                                        if (url && selectedProduct) {
                                                                            const newImages = [...selectedProduct.images, url];
                                                                            handleUpdateProduct({ images: newImages });
                                                                            if (!catalogViewerImage) setCatalogViewerImage(url);
                                                                        }
                                                                    }}
                                                                    style={{ background: 'none', border: 'none', color: 'var(--accent-turquoise)', fontSize: '10px', fontWeight: '800', cursor: 'pointer', letterSpacing: '1px' }}
                                                                >
                                                                    + URL
                                                                </button>
                                                            </div>
                                                            <div style={{
                                                                display: 'grid',
                                                                gridTemplateColumns: 'repeat(6, 1fr)',
                                                                gap: '8px',
                                                                padding: '15px',
                                                                background: 'rgba(255,255,255,0.02)',
                                                                borderRadius: '4px',
                                                                border: '1px solid rgba(255,255,255,0.05)',
                                                                maxHeight: '400px',
                                                                overflowY: 'auto'
                                                            }} className="custom-scroll">
                                                                {selectedProduct?.images && selectedProduct.images.map((img, i) => (
                                                                    <div
                                                                        key={i}
                                                                        onClick={() => setCatalogViewerImage(img)}
                                                                        style={{
                                                                            position: 'relative',
                                                                            aspectRatio: '1/1',
                                                                            borderRadius: '2px',
                                                                            overflow: 'hidden',
                                                                            border: `2px solid ${catalogViewerImage === img ? 'var(--accent-turquoise)' : 'rgba(255,255,255,0.1)'}`,
                                                                            cursor: 'pointer',
                                                                            opacity: catalogViewerImage === img ? 1 : 0.6,
                                                                            transition: 'all 0.3s'
                                                                        }}
                                                                    >
                                                                        <img src={img} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />

                                                                        {catalogViewerImage === img && (
                                                                            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 212, 189, 0.1)', pointerEvents: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                                                <Star size={14} color="var(--accent-turquoise)" fill="var(--accent-turquoise)" />
                                                                            </div>
                                                                        )}

                                                                        {/* Botín de eliminar miniatura */}
                                                                        <button
                                                                            onClick={(e) => handleRemoveImage(e, img)}
                                                                            style={{
                                                                                position: 'absolute',
                                                                                top: '2px',
                                                                                right: '2px',
                                                                                background: 'rgba(239, 68, 68, 0.9)',
                                                                                color: 'white',
                                                                                border: 'none',
                                                                                borderRadius: '50%',
                                                                                width: '18px',
                                                                                height: '18px',
                                                                                display: 'flex',
                                                                                alignItems: 'center',
                                                                                justifyContent: 'center',
                                                                                cursor: 'pointer',
                                                                                zIndex: 10
                                                                            }}
                                                                        >
                                                                            <X size={10} />
                                                                        </button>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Columna Derecha: Metadatos + Specs */}
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                                        {/* Fila 1: Mayorista, SKU y Categoría */}
                                                        <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
                                                            <div style={{ width: '140px' }}>
                                                                <label style={{ display: 'block', fontSize: '11px', color: 'var(--accent-gold)', marginBottom: '10px', fontWeight: '800', letterSpacing: '3px', textTransform: 'uppercase' }}>MAYORISTA</label>
                                                                <input
                                                                    type="text"
                                                                    value={selectedProduct?.wholesaler || ''}
                                                                    onChange={(e) => handleUpdateProduct({ wholesaler: e.target.value })}
                                                                    style={{ width: '100%', backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '2px', padding: '15px', color: '#888', fontSize: '15px', outline: 'none' }}
                                                                />
                                                            </div>
                                                            <div style={{ width: '140px' }}>
                                                                <label style={{ display: 'block', fontSize: '11px', color: 'var(--accent-gold)', marginBottom: '10px', fontWeight: '800', letterSpacing: '3px', textTransform: 'uppercase' }}>CÓDIGO / SKU</label>
                                                                <input
                                                                    value={selectedProduct?.external_id || ''}
                                                                    onChange={(e) => handleUpdateProduct({ external_id: e.target.value })}
                                                                    style={{ width: '100%', backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '2px', padding: '15px', color: '#888', fontSize: '15px', outline: 'none' }}
                                                                />
                                                            </div>
                                                            <div style={{ flex: 1 }}>
                                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                                                    <label style={{ fontSize: "11px", color: "var(--accent-gold)", fontWeight: "800", letterSpacing: "3px", textTransform: "uppercase", margin: 0 }}>CATEGORÍA</label>
                                                                    <button
                                                                        onClick={() => setIsAddingCategory(!isAddingCategory)}
                                                                        style={{ background: 'none', border: 'none', color: 'var(--accent-turquoise)', fontSize: '10px', fontWeight: '700', cursor: 'pointer', letterSpacing: '1px', textTransform: 'uppercase' }}
                                                                    >
                                                                        {isAddingCategory ? "← VOLVER" : "+ NUEVA"}
                                                                    </button>
                                                                </div>
                                                                {isAddingCategory ? (
                                                                    <div style={{ display: 'flex', gap: '10px' }}>
                                                                        <input
                                                                            type="text"
                                                                            placeholder="NUEVA CATEGORÍA"
                                                                            value={newCategoryName}
                                                                            onChange={(e) => setNewCategoryName(e.target.value)}
                                                                            style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '2px', padding: '15px', color: 'white', fontSize: '13px', outline: 'none' }}
                                                                        />
                                                                        <button
                                                                            onClick={handleAddCategory}
                                                                            style={{ backgroundColor: 'var(--accent-turquoise)', color: 'black', border: 'none', borderRadius: '2px', padding: '0 20px', fontWeight: '800', cursor: 'pointer', fontSize: '11px', textTransform: 'uppercase' }}
                                                                        >
                                                                            AÑADIR
                                                                        </button>
                                                                    </div>
                                                                ) : (
                                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                                        <div style={{ position: 'relative', marginBottom: '8px' }}>
                                                                            <select
                                                                                value={selectedProduct?.category || ''}
                                                                                onChange={(e) => handleUpdateProduct({ category: e.target.value })}
                                                                                style={{
                                                                                    width: '100%',
                                                                                    padding: '16px 15px',
                                                                                    backgroundColor: 'rgba(255,255,255,0.02)',
                                                                                    border: '1px solid rgba(255,255,255,0.05)',
                                                                                    color: 'white',
                                                                                    fontSize: '11px',
                                                                                    fontWeight: '700',
                                                                                    borderRadius: '4px',
                                                                                    outline: 'none',
                                                                                    textTransform: 'uppercase',
                                                                                    cursor: 'pointer',
                                                                                    appearance: 'none',
                                                                                    height: '48px'
                                                                                }}
                                                                            >
                                                                                <option value="" disabled>SELECCIONAR CATEGORÍA...</option>
                                                                                {customCategories.map(cat => (
                                                                                    <option key={cat} value={cat} style={{ color: 'black' }}>
                                                                                        {cat}
                                                                                    </option>
                                                                                ))}
                                                                            </select>
                                                                            <div style={{ position: 'absolute', right: '15px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--accent-turquoise)' }}>
                                                                                <ChevronRight size={14} style={{ transform: 'rotate(90deg)' }} />
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>


                                                        {/* Título y Specs (Added) */}
                                                        <div style={{ marginTop: "20px" }}>
                                                            <label style={{ display: "block", fontSize: "11px", color: "var(--accent-gold)", marginBottom: "10px", fontWeight: "800", letterSpacing: "3px", textTransform: "uppercase" }}>NOMBRE DEL PRODUCTO</label>
                                                            <input
                                                                value={selectedProduct?.name || ''}
                                                                onChange={(e) => handleUpdateProduct({ name: e.target.value })}
                                                                style={{ width: "100%", backgroundColor: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "2px", padding: "15px", color: "white", fontSize: "18px", fontWeight: "600", outline: "none" }}
                                                            />
                                                        </div>

                                                        <div style={{ flex: 1, display: "flex", flexDirection: "column", marginTop: "20px" }}>
                                                            <label style={{ display: "block", fontSize: "11px", color: "var(--accent-gold)", marginBottom: "10px", fontWeight: "800", letterSpacing: "2px", textTransform: "uppercase" }}>CARACTERÍSTICA</label>
                                                            <textarea
                                                                value={selectedProduct?.technical_specs?.join("\n") || ""}
                                                                onChange={(e) => handleUpdateProduct({ technical_specs: e.target.value.split("\n").filter(l => l.trim()) })}
                                                                style={{ width: "100%", flex: 1, minHeight: "300px", backgroundColor: "rgba(255,255,255,0.01)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "2px", padding: "20px", color: "#ccc", fontSize: "14px", outline: "none", resize: "none", lineHeight: "1.6" }}
                                                            />
                                                        </div>

                                                        {/* Botones de AcciÍn (Added) */}
                                                        <div style={{ marginTop: "30px", display: "flex", gap: "15px", paddingBottom: "30px" }}>
                                                            <button
                                                                onClick={handleSaveChanges}
                                                                disabled={isSaving}
                                                                style={{ flex: 1, backgroundColor: isSaving ? "#333" : "var(--accent-gold)", color: "black", border: "none", padding: "20px", fontSize: "14px", fontWeight: "900", letterSpacing: "2px", cursor: isSaving ? "not-allowed" : "pointer", borderRadius: "4px", textTransform: "uppercase", display: "flex", alignItems: "center", justifyContent: "center", gap: "10px" }}
                                                            >
                                                                {isSaving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                                                                GUARDAR
                                                            </button>
                                                            <button
                                                                onClick={handlePublish}
                                                                style={{ flex: 1, backgroundColor: "var(--accent-turquoise)", color: "black", border: "none", padding: "20px", fontSize: "14px", fontWeight: "900", letterSpacing: "2px", cursor: "pointer", borderRadius: "4px", textTransform: "uppercase", display: "flex", alignItems: "center", justifyContent: "center", gap: "10px" }}
                                                            >
                                                                <Globe size={20} />
                                                                PUBLICAR
                                                            </button>
                                                            <button
                                                                onClick={handleReject}
                                                                style={{ backgroundColor: "rgba(239, 68, 68, 0.1)", color: "#ef4444", border: "1px solid #ef4444", padding: "20px", borderRadius: "4px", cursor: "pointer" }}
                                                            >
                                                                <Trash2 size={20} />
                                                            </button>
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
                                </React.Fragment >
                            )
                            }
                            {
                                activeTab === "gallery" && (
                                    <React.Fragment>
                                        <div className="custom-scroll" style={{ borderRight: "1px solid rgba(255,255,255,0.05)", overflowY: "auto", padding: "32px 40px", backgroundColor: "rgba(0,0,0,0.2)" }}>
                                            <h3 style={{ color: "var(--accent-gold)", fontSize: "11px", fontWeight: "900", letterSpacing: "3px", textTransform: "uppercase", marginBottom: "30px" }}>SECCIONES</h3>
                                            <div style={{ display: "grid", gap: "10px" }}>
                                                {customCategories.map(sec => (
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
                                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "60px" }}>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                                    <h2 style={{ color: "white", fontFamily: "var(--font-heading)", fontSize: "32px", margin: 0, letterSpacing: "4px", textTransform: "uppercase" }}>
                                                        GALERÍA: <span style={{ color: "var(--accent-gold)" }}>{selectedGallerySection.toUpperCase()}</span>
                                                    </h2>
                                                    <p style={{ fontSize: '10px', color: '#444', fontWeight: '800', letterSpacing: '1px' }}>
                                                        SINCRO: {content.sections.some(s =>
                                                            (s.id || '').toLowerCase().includes(selectedGallerySection.toLowerCase()) ||
                                                            (s.title1 || (s as any).title || '').toLowerCase().includes(selectedGallerySection.toLowerCase())
                                                        )
                                                            ? 'CONECTADA A LANDING ✓'
                                                            : 'SECCIÓN NO ENCONTRADA EN LANDING (VERIFICA NOMBRE)'}
                                                    </p>
                                                </div>
                                                <div style={{ display: "flex", gap: "20px" }}>
                                                    {/* BotÍn de subida eliminado por requerimiento */}
                                                </div>
                                            </div>

                                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))", gap: "25px" }}>
                                                {galleryImages.map((src, index) => (
                                                    <div key={index} style={{ position: "relative", aspectRatio: "4/3", borderRadius: "8px", overflow: "hidden", border: "1px solid rgba(255,255,255,0.05)", background: "#111" }}>
                                                        <img src={src} alt="GalerÍa" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                                        <button
                                                            onClick={() => handleRemoveGalleryImage(index)}
                                                            style={{ position: "absolute", top: "10px", right: "10px", background: "rgba(239, 68, 68, 0.9)", color: "white", border: "none", borderRadius: "50%", width: "30px", height: "30px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", boxShadow: "0 4px 10px rgba(0,0,0,0.3)" }}
                                                        >
                                                            <X size={16} />
                                                        </button>
                                                    </div>
                                                ))}
                                                {galleryImages.length === 0 && !uploadingGallery && (
                                                    <div
                                                        style={{
                                                            gridColumn: "1 / -1", padding: "100px", textAlign: "center",
                                                            border: "2px dashed rgba(255,255,255,0.05)", borderRadius: "12px",
                                                            color: "#444"
                                                        }}
                                                    >
                                                        <Plus size={60} style={{ marginBottom: "20px", opacity: 0.1 }} />
                                                        <p style={{ letterSpacing: "2px", textTransform: "uppercase", fontSize: "12px" }}>No hay imágenes en esta galería</p>
                                                    </div>
                                                )}
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
                                                        GESTIÍN DE <span style={{ color: "var(--accent-gold)" }}>BANNER PRINCIPAL (HERO)</span>
                                                    </h2>
                                                    {activeImage && (
                                                        <div style={{ display: "flex", alignItems: "center", gap: "10px", background: "rgba(0,212,189,0.05)", padding: "10px 20px", borderRadius: "100px", border: "1px solid rgba(0,212,189,0.2)" }}>
                                                            <span style={{ fontSize: "10px", color: "var(--accent-turquoise)", fontWeight: "900", letterSpacing: "1px" }}>IMAGEN CARGADA LISTA</span>
                                                            <img src={activeImage} style={{ width: "30px", height: "30px", borderRadius: "50%", objectFit: "cover", border: "1px solid var(--accent-turquoise)" }} />
                                                        </div>
                                                    )}
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
                                            </div>
                                        </div>
                                    </React.Fragment>
                                )
                            }

                            {
                                activeTab === "marketing" && (
                                    <React.Fragment>
                                        <div className="custom-scroll" style={{ padding: "60px", overflowY: "auto", backgroundColor: "#050505", gridColumn: "1 / -1" }}>
                                            <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
                                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "40px" }}>
                                                    <h2 style={{ color: "white", fontFamily: "var(--font-heading)", fontSize: "32px", margin: 0, letterSpacing: "4px", textTransform: "uppercase" }}>
                                                        AI CONTENT <span style={{ color: "var(--accent-gold)" }}>FACTORY</span>
                                                    </h2>
                                                    <div style={{ display: "flex", gap: "10px" }}>
                                                        {(generatedMarketing || activeImage) && (
                                                            <button
                                                                onClick={() => {
                                                                    setGeneratedMarketing(null);
                                                                    setActiveImage(null);
                                                                }}
                                                                style={{ background: "rgba(255,255,255,0.1)", color: "#aaa", padding: "15px 20px", borderRadius: "4px", fontSize: "12px", fontWeight: "900", cursor: "pointer", textTransform: "uppercase", border: "1px solid rgba(255,255,255,0.2)" }}
                                                            >
                                                                LIMPIAR / CANCELAR
                                                            </button>
                                                        )}
                                                        <button
                                                            onClick={handleGenerateMarketingAI}
                                                            disabled={isGeneratingAI || (!selectedProduct && !activeImage)}
                                                            style={{ background: "var(--accent-turquoise)", color: "black", padding: "15px 30px", borderRadius: "4px", fontSize: "12px", fontWeight: "900", cursor: "pointer", textTransform: "uppercase" }}
                                                        >
                                                            {isGeneratingAI ? "GENERANDO..." : "GENERAR CON GEMINI"}
                                                        </button>
                                                        <button
                                                            onClick={handleSaveMarketingAI}
                                                            disabled={!generatedMarketing || isSaving}
                                                            style={{ background: "var(--accent-gold)", color: "black", padding: "15px 30px", borderRadius: "4px", fontSize: "12px", fontWeight: "900", cursor: "pointer", textTransform: "uppercase" }}
                                                        >
                                                            {isSaving ? "GUARDANDO..." : "GUARDAR Y ENVIAR"}
                                                        </button>
                                                    </div>
                                                </div>

                                                {generatedMarketing ? (
                                                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "40px" }}>
                                                        <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", padding: "30px", borderRadius: "8px" }}>
                                                            <h3 style={{ color: "var(--accent-gold)", fontSize: "14px", marginBottom: "30px", letterSpacing: "2px", fontWeight: "800" }}>ESTRUCTURA DE MARKETING</h3>
                                                            <div style={{ display: "flex", flexDirection: "column", gap: "25px" }}>
                                                                <div>
                                                                    <label style={{ color: "var(--accent-turquoise)", fontSize: "10px", fontWeight: "900", display: "block", marginBottom: "8px", letterSpacing: "1px" }}>ASUNTO DEL EMAIL</label>
                                                                    <input value={generatedMarketing.subject} onChange={(e) => handleMarketingChange('subject', e.target.value)} style={{ width: "100%", background: "rgba(0,0,0,0.5)", border: "1px solid rgba(255,255,255,0.1)", padding: "15px", color: "white", fontSize: "14px", borderRadius: "4px" }} />
                                                                </div>
                                                                <div>
                                                                    <label style={{ color: "var(--accent-turquoise)", fontSize: "10px", fontWeight: "900", display: "block", marginBottom: "8px", letterSpacing: "1px" }}>TITULAR L1</label>
                                                                    <input value={generatedMarketing.part1} onChange={(e) => handleMarketingChange('part1', e.target.value)} style={{ width: "100%", background: "rgba(0,0,0,0.5)", border: "1px solid rgba(255,255,255,0.1)", padding: "15px", color: "white", fontSize: "14px", borderRadius: "4px" }} />
                                                                </div>
                                                                <div>
                                                                    <label style={{ color: "var(--accent-turquoise)", fontSize: "10px", fontWeight: "900", display: "block", marginBottom: "8px", letterSpacing: "1px" }}>CUERPO DE TEXTO L2</label>
                                                                    <textarea value={generatedMarketing.part2} onChange={(e) => handleMarketingChange('part2', e.target.value)} style={{ width: "100%", height: "150px", background: "rgba(0,0,0,0.5)", border: "1px solid rgba(255,255,255,0.1)", padding: "15px", color: "#aaa", fontSize: "14px", borderRadius: "4px", resize: "none", lineHeight: "1.6" }} />
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                                            {/* Panel de Imagen Activa - MOVIDO AQUÍ PARA VISIBILIDAD */}
                                                            <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", padding: "15px", borderRadius: "8px", display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                                                <div>
                                                                    <span style={{ fontSize: "10px", color: "var(--accent-gold)", fontWeight: "900", letterSpacing: "1px", display: "block", marginBottom: "5px" }}>
                                                                        IMAGEN PARA CAMPAÑA
                                                                    </span>
                                                                    <span style={{ fontSize: "12px", color: "#888" }}>
                                                                        {activeImage ? "Usando imagen de INSUMO" : (selectedProduct?.images?.[0] ? "Usando imagen de PRODUCTO" : "Sin imagen seleccionada")}
                                                                    </span>
                                                                </div>

                                                                {(activeImage || selectedProduct?.images?.[0]) && (
                                                                    <div style={{ position: 'relative', width: "60px", height: "60px", background: "black", borderRadius: "4px", overflow: "hidden", border: "1px solid #333" }}>
                                                                        <img
                                                                            src={activeImage || selectedProduct?.images?.[0]}
                                                                            style={{ width: "100%", height: "100%", objectFit: "contain" }}
                                                                        />
                                                                        {activeImage && (
                                                                            <button
                                                                                onClick={() => setActiveImage(null)}
                                                                                title="Descartar imagen de insumo y usar producto"
                                                                                style={{ position: 'absolute', top: 0, right: 0, background: 'rgba(255,0,0,0.8)', color: 'white', border: 'none', width: '20px', height: '20px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                                                            >
                                                                                <X size={12} />
                                                                            </button>
                                                                        )}
                                                                    </div>
                                                                )}
                                                            </div>

                                                            <div style={{ background: "white", padding: "0", borderRadius: "8px", overflow: "hidden", display: "flex", flexDirection: "column", height: "520px", border: "1px solid rgba(255,255,255,0.1)" }}>
                                                                <div style={{ background: "#f0f0f0", padding: "10px 20px", borderBottom: "1px solid #ddd", color: "#666", fontSize: "10px", fontWeight: "800", letterSpacing: "1px" }}>PREVISUALIZACIÍN HTML</div>
                                                                <div className="custom-scroll" style={{ flex: 1, overflowY: "auto", padding: "30px" }}>
                                                                    <div dangerouslySetInnerHTML={{ __html: generatedMarketing.html.replace("IMAGE_URL_PLACEHOLDER", activeImage || selectedProduct?.images?.[0] || "") }} />
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div style={{ height: "400px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", border: "2px dashed #222" }}>
                                                        {activeImage ? (
                                                            <>
                                                                <div style={{ position: 'relative', display: 'inline-block' }}>
                                                                    <img src={activeImage} style={{ maxHeight: '200px', maxWidth: '300px', objectFit: 'contain', marginBottom: '20px', border: '1px solid #333' }} />
                                                                    <button
                                                                        onClick={() => setActiveImage(null)}
                                                                        style={{ position: 'absolute', top: -10, right: -10, background: 'red', color: 'white', border: 'none', borderRadius: '50%', width: '24px', height: '24px', cursor: 'pointer', zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                                                    >
                                                                        <X size={14} />
                                                                    </button>
                                                                </div>
                                                                <p style={{ marginTop: "20px", letterSpacing: "2px", color: '#666', fontSize: '12px', fontWeight: 'bold' }}>IMAGEN LISTA PARA CAMPAÑA</p>
                                                                {!selectedProduct && (
                                                                    <p style={{ color: 'var(--accent-gold)', fontSize: '10px', marginTop: '10px', fontWeight: 'bold' }}>
                                                                        ⚠️ PULSA "GENERAR" PARA CREAR TEXTO DESDE LA IMAGEN
                                                                    </p>
                                                                )}
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Sparkles size={60} style={{ opacity: 0.2 }} />
                                                                <p style={{ marginTop: "20px", letterSpacing: "2px", opacity: 0.5 }}>SELECCIONA UN PRODUCTO Y PULSA "GENERAR"</p>
                                                            </>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </React.Fragment>
                                )
                            }
                        </div >
                    </motion.div >
                </motion.div >
            )
            }
        </AnimatePresence >
    );
}
