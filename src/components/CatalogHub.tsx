'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, Trash2, Layers, Loader2, Save, Image as ImageIcon, Check, Star, RefreshCw, Plus } from 'lucide-react';
import { supabase } from '@/lib/supabase';

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
    const [activeImage, setActiveImage] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [customCategories, setCustomCategories] = useState<string[]>(['MUG', 'BOTELLAS', 'CUADERNOS Y LIBRETAS', 'MOCHILAS', 'TECNOLOGÃA', 'BOLÃGRAFOS']);
    const [isAddingCategory, setIsAddingCategory] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [isAddingNew, setIsAddingNew] = useState(false);
    const [newProductForm, setNewProductForm] = useState<Partial<PendingProduct>>({
        name: '',
        original_description: '',
        images: [],
        wholesaler: 'Stocksur', // Default, se actualizarÃ¡ al abrir
        category: 'MUG',
        external_id: '',
        is_premium: false,
        seo_title: '',
        seo_keywords: '',
        seo_description: '',
        for_marketing: false,
        technical_specs: [] // Usaremos esto para las caracterÃ­sticas
    });
    const [activeManualImage, setActiveManualImage] = useState<string | null>(null);
    const [pendingFiles, setPendingFiles] = useState<Record<string, File>>({});
    const [isSaving, setIsSaving] = useState(false);
    const [activeTab, setActiveTab] = useState<'catalog' | 'gallery'>('catalog');

    // Estados para Gestión de Galerías
    const [selectedGallerySection, setSelectedGallerySection] = useState<string>('mugs');
    const [galleryImages, setGalleryImages] = useState<string[]>([]);
    const [uploadingGallery, setUploadingGallery] = useState(false);
    const [driveFolderId, setDriveFolderId] = useState('');
    const [isSyncingDrive, setIsSyncingDrive] = useState(false);
    const [isSyncingZecat, setIsSyncingZecat] = useState(false);

    const wholesalers = ['Todos', 'Stocksur', 'Promoimport', 'ImBlasco', 'Zecat', 'Personalizado'];

    const mapProductFromDB = (item: any): PendingProduct => {
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
            // Si el mayorista seleccionado es "CatÃ¡logo", mostrar productos aprobados
            const statusFilter = selectedWholesaler === 'CatÃ¡logo' ? 'approved' : 'pending';

            const { data, error } = await supabase
                .from('agent_buffer')
                .select('*')
                .eq('status', statusFilter)
                .order('found_at', { ascending: false });

            if (error) throw error;

            const mappedData = (data || []).map(mapProductFromDB);

            setPendingProducts(mappedData);
            if (mappedData.length > 0 && !selectedProduct) {
                setSelectedProduct(mappedData[0]);
                setActiveImage(mappedData[0].images[0]);
            }
        } catch (error) {
            console.error('Error al cargar el buffer:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleProductSelect = (p: PendingProduct) => {
        setSelectedProduct(p);
        setActiveImage(p.images[0]);
    };

    // Funciones para GestiÃ³n de GalerÃ­as
    const fetchGallery = async (section: string) => {
        try {
            const { data, error } = await supabase
                .from('web_contenido')
                .select('content')
                .eq('section', section)
                .single();

            if (error) throw error;
            setGalleryImages(data?.content?.gallery || []);
        } catch (err) {
            console.error('Error fetching gallery:', err);
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
                console.log(`ðŸš€ Optimizando imagen de galerÃ­a ${i + 1}/${files.length}...`);

                const optimizedBlob = await optimizeImage(file);
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
            alert('Â¡GalerÃ­a actualizada con Ã©xito!');
        } catch (err) {
            console.error('Error uploading gallery:', err);
            alert('Error al subir imÃ¡genes a la galerÃ­a');
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

    const handleDriveSync = async () => {
        if (!driveFolderId) {
            alert('Por favor ingresa un ID de carpeta de Google Drive');
            return;
        }
        setIsSyncingDrive(true);
        try {
            const url = `https://drive.google.com/drive/folders/${driveFolderId}`;
            const response = await fetch(url);
            const text = await response.text();

            const regex = /"1[a-zA-Z0-9_-]{32}"/g;
            const matches = text.match(regex);

            if (!matches) {
                alert('No se encontraron imágenes públicas en esta carpeta. Asegúrate de que la carpeta sea pública.');
                return;
            }

            const uniqueIds = [...new Set(matches.map(m => m.replace(/"/g, '')))];
            const fileIds = uniqueIds.filter(id => id !== driveFolderId);
            const driveImages = fileIds.map(id => `https://drive.google.com/thumbnail?id=${id}&sz=w1200`);

            const newImages = [...galleryImages, ...driveImages.filter(img => !galleryImages.includes(img))];

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

            const { error } = await supabase
                .from('web_contenido')
                .upsert({
                    section: selectedGallerySection,
                    content: updatedContent,
                    updated_by: 'CatalogHub-Drive'
                }, { onConflict: 'section' });

            if (error) throw error;
            setGalleryImages(newImages);
            alert(`¡Sincronización exitosa! Se añadieron ${driveImages.length} imágenes.`);
        } catch (err) {
            console.error('Error syncing from drive:', err);
            alert('Error al sincronizar con Google Drive. Verifica el ID.');
        } finally {
            setIsSyncingDrive(false);
        }
    };

    const handleZecatSync = async () => {
        setIsSyncingZecat(true);
        try {
            const term = search || 'Mug';
            const ZECAT_API_BASE = 'https://api.zecat.cl/v1';
            const ZECAT_TOKEN = 'bWFyaW9AYWdlbmNpYWdyYWZpY2EuY2w6ZXlKMGVYQWlPaUpLVjFRaUxDSmhiR2NpT2lKSVV6STFOaUo5LklqRXljREUzYUhGa2QzWm1PVzUzZW1raS44OTVpbG1IekVEeG1TMzlDLVBuMHM0Qjd6X2dMUml5M25GcnpER250N0VF';

            const response = await fetch(`${ZECAT_API_BASE}/generic_product/autocomplete?name=${term}`, {
                headers: { 'Authorization': `Bearer ${ZECAT_TOKEN}` }
            });

            if (!response.ok) throw new Error('Error al conectar con Zecat');
            const data: { data: any[] } = await response.json();

            let count = 0;
            for (const item of (data.data || []).slice(0, 10)) {
                // Para cada producto, obtener detalle para imágenes
                const detRes = await fetch(`${ZECAT_API_BASE}/generic_product/${item.id}`, {
                    headers: { 'Authorization': `Bearer ${ZECAT_TOKEN}` }
                });
                if (!detRes.ok) continue;
                const det = await detRes.json();
                const prod = det.data;

                const { error } = await supabase.from('agent_buffer').upsert({
                    wholesaler: 'Zecat',
                    external_id: prod.sku || prod.id,
                    name: prod.name,
                    original_description: prod.description || '',
                    images: (prod.images || []).map((img: { url: string }) => img.url),
                    technical_specs: prod.attributes || {},
                    status: 'pending',
                    category: prod.family?.name || 'Varios'
                }, { onConflict: 'external_id' });

                if (!error) count++;
            }

            fetchBuffer();
            alert(`¡Zecat sincronizado! Se procesaron ${count} productos nuevos.`);
        } catch (err) {
            console.error('Error syncing Zecat:', err);
            alert('Error al sincronizar con Zecat.');
        } finally {
            setIsSyncingZecat(false);
        }
    };

    const handlePublish = async () => {
        if (!selectedProduct || !activeImage) return;

        setIsSaving(true);
        let finalMainImage = activeImage;

        try {
            // OPTIMIZACIÃ“N DE IMAGEN: Si la imagen es externa o no estÃ¡ optimizada, la procesamos
            const isExternal = !activeImage.includes('supabase.co');
            const isBlob = activeImage.startsWith('blob:');

            if (isExternal || isBlob) {
                try {
                    console.log('ðŸš€ Optimizando imagen para publicaciÃ³n...');

                    let blob: Blob;
                    if (isBlob) {
                        // Si es un blob local (reciÃ©n cargado), lo obtenemos de los archivos pendientes o del fetch
                        const file = pendingFiles[activeImage];
                        if (file) {
                            blob = await optimizeImage(file);
                        } else {
                            const res = await fetch(activeImage);
                            const originalBlob = await res.blob();
                            blob = await optimizeImage(new File([originalBlob], 'image.jpg', { type: originalBlob.type }));
                        }
                    } else {
                        // Si es una URL externa (Zecat, Stocksur, etc.)
                        const res = await fetch(activeImage);
                        if (!res.ok) throw new Error('No se pudo descargar la imagen externa');
                        const originalBlob = await res.blob();
                        blob = await optimizeImage(new File([originalBlob], 'image.jpg', { type: originalBlob.type }));
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
                    console.log('âœ… Imagen optimizada y subida:', finalMainImage);
                } catch (optError) {
                    console.error('âš ï¸ FallÃ³ la optimizaciÃ³n automÃ¡tica (posible CORS), usando original:', optError);
                    // No bloqueamos la publicaciÃ³n si falla la optimizaciÃ³n (CORS es comÃºn)
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
                    images: [finalMainImage, ...selectedProduct.images.filter(i => i !== activeImage)]
                })
                .eq('id', selectedProduct.id);

            if (error) throw error;

            // 2. AquÃ­ normalmente se integrarÃ­a al catalog.json (en un flujo automatizado)
            setPendingProducts(prev => prev.filter(p => p.id !== selectedProduct.id));
            setSelectedProduct(null);

            alert('Â¡Producto Publicado y Optimizado! El sistema lo integrarÃ¡ en el catÃ¡logo.');
        } catch (error) {
            console.error('Error al publicar:', error);
            alert('Error al publicar el producto');
        } finally {
            setIsSaving(false);
        }
    };

    const handleCreateManual = async () => {
        // Validamos TÃ­tulo e ImÃ¡genes
        if (!newProductForm.original_description || !newProductForm.images || newProductForm.images.length === 0) {
            alert('El TÃ­tulo y al menos una imagen son obligatorios para guardar.');
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
                            const optimizedBlob = await optimizeImage(file);
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

            // Construir el objeto de inserciÃ³n explÃ­citamente
            const productToInsert = {
                wholesaler: newProductForm.wholesaler || 'Manual',
                external_id: newProductForm.external_id || `MAN-${Date.now().toString().slice(-6)}`,
                name: (newProductForm.name || newProductForm.original_description || '').trim(),
                original_description: (newProductForm.original_description || '').trim(),
                // Almacenamos la categorÃ­a dentro de technical_specs ya que la columna no existe en la DB
                images: orderedImages,
                technical_specs: {
                    category: (newProductForm.category || 'OTROS').trim().toUpperCase(),
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
                setActiveImage(formattedProduct.images[0]);
                setIsAddingNew(false);

                // Limpiar ObjectURLs para evitar fugas de memoria
                Object.keys(pendingFiles).forEach(url => URL.revokeObjectURL(url));
                setPendingFiles({});

                setNewProductForm({
                    name: '',
                    original_description: '',
                    images: [],
                    wholesaler: 'Manual',
                    category: 'Otros',
                    external_id: 'MAN-' + Date.now().toString().slice(-6),
                    is_premium: false,
                    technical_specs: []
                });
                alert('Â¡Producto creado exitosamente en el buffer!');
            }
        } catch (error: any) {
            console.error('Error al crear producto:', error);
            alert(`Error al crear el producto: ${error.message || 'Error desconocido'}`);
        } finally {
            setIsSaving(false);
            setLoading(false);
        }
    };

    const optimizeImage = async (file: File): Promise<Blob> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (event) => {
                const img = new Image();
                img.src = event.target?.result as string;
                img.onload = () => {
                    const canvas = document.createElement('canvas');

                    // ResoluciÃ³n Premium Optimizada (2K para carga instantÃ¡nea)
                    const MAX_WIDTH = 2048;
                    let targetWidth = img.width;
                    let targetHeight = img.height;

                    if (img.width > MAX_WIDTH) {
                        const scaleFactor = MAX_WIDTH / img.width;
                        targetWidth = MAX_WIDTH;
                        targetHeight = img.height * scaleFactor;
                    }

                    canvas.width = targetWidth;
                    canvas.height = targetHeight;

                    const ctx = canvas.getContext('2d');
                    if (!ctx) return reject('No se pudo obtener el contexto del canvas');

                    // Dibujar con suavizado
                    ctx.imageSmoothingEnabled = true;
                    ctx.imageSmoothingQuality = 'high';
                    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

                    // CompresiÃ³n de paso Ãºnico (85% calidad para balance perfecto peso/visual)
                    canvas.toBlob((blob) => {
                        if (blob) {
                            resolve(blob);
                        } else {
                            reject('Error al generar blob');
                        }
                    }, 'image/webp', 0.85);
                };
            };
            reader.onerror = (e) => reject(e);
        });
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
        if (!selectedProduct || !activeImage) return;

        setIsSaving(true);
        try {
            const section = 'hero';
            const heroKey = slideIndex === 1 ? 'background_image' : `background_image_${slideIndex}`;

            const { data: currentData } = await supabase
                .from('web_contenido')
                .select('content')
                .eq('section', section)
                .single();

            const currentContent = currentData?.content || {};
            const updatedContent = {
                ...currentContent,
                [heroKey]: activeImage,
                ...(slideIndex === 1 ? { title: (selectedProduct.seo_title || selectedProduct.name).toUpperCase() } : {})
            };

            const { error } = await supabase
                .from('web_contenido')
                .upsert({
                    section,
                    content: updatedContent,
                    updated_by: 'CatalogHub'
                }, { onConflict: 'section' });

            if (error) throw error;
            alert(`Â¡Slide Hero ${slideIndex} actualizado con Ã©xito!`);
        } catch (err) {
            console.error('Error setting hero:', err);
            alert('Error al actualizar el Hero');
        } finally {
            setIsSaving(false);
        }
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
                        category: (selectedProduct.category || 'OTROS').trim().toUpperCase(),
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
            alert('Â¡Cambios guardados en el buffer!');
        } catch (error) {
            console.error('Error al guardar:', error);
            alert('Error al guardar los cambios');
        } finally {
            setTimeout(() => setIsSaving(false), 500);
        }
    };

    const handleReject = async () => {
        if (!selectedProduct) return;

        if (confirm('Â¿EstÃ¡s seguro de que quieres eliminar este producto PERMANENTEMENTE del buffer?')) {
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
        const searchLower = search.toLowerCase();
        const matchesWholesaler = selectedWholesaler === 'Todos' || p.wholesaler === selectedWholesaler;
        const matchesSearch = !search ||
            p.name.toLowerCase().includes(searchLower) ||
            p.external_id.toLowerCase().includes(searchLower) ||
            p.category?.toLowerCase().includes(searchLower);
        return matchesWholesaler && matchesSearch;
    });

    // Sincronizar selecciÃ³n al filtrar
    useEffect(() => {
        if (!isOpen) return;

        if (filteredProducts.length > 0) {
            // Si el producto seleccionado actual no estÃ¡ en la lista filtrada, seleccionar el primero
            const isStillVisible = filteredProducts.some(p => p.id === selectedProduct?.id);
            if (!isStillVisible) {
                setSelectedProduct(filteredProducts[0]);
                setActiveImage(filteredProducts[0].images[0]);
            }
        } else {
            // Si no hay productos que coincidan, limpiar la selecciÃ³n
            setSelectedProduct(null);
            setActiveImage(null);
        }
    }, [selectedWholesaler, search, pendingProducts, isOpen]);

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
                            width: '96vw',
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
                                        onClick={() => setActiveTab('catalog')}
                                        style={{ background: 'none', border: 'none', color: activeTab === 'catalog' ? 'var(--accent-turquoise)' : '#555', fontSize: '12px', fontWeight: '800', cursor: 'pointer', letterSpacing: '2px', textTransform: 'uppercase', padding: '10px 0', borderBottom: activeTab === 'catalog' ? '2px solid var(--accent-turquoise)' : '2px solid transparent', transition: 'all 0.3s' }}
                                    >
                                        GestiOÌn de CataÌlogo
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('gallery')}
                                        style={{ background: 'none', border: 'none', color: activeTab === 'gallery' ? 'var(--accent-turquoise)' : '#555', fontSize: '12px', fontWeight: '800', cursor: 'pointer', letterSpacing: '2px', textTransform: 'uppercase', padding: '10px 0', borderBottom: activeTab === 'gallery' ? '2px solid var(--accent-turquoise)' : '2px solid transparent', transition: 'all 0.3s' }}
                                    >
                                        GestiOÌn de GaleriÌas
                                    </button>
                                </div>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '30px' }}>
                                {isAddingNew && (
                                    <motion.div
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        style={{ display: 'flex', alignItems: 'center', gap: '30px', marginRight: '40px' }}
                                    >
                                        <div style={{ width: '1px', height: '30px', backgroundColor: 'rgba(255,255,255,0.1)' }} />
                                        <h2 style={{ color: 'white', fontFamily: 'var(--font-heading)', fontSize: '24px', margin: 0, letterSpacing: '2px', textTransform: 'uppercase' }}>
                                            NUEVO PRODUCTO PARA <span style={{ color: 'var(--accent-gold)' }}>{newProductForm.wholesaler}</span>
                                        </h2>
                                    </motion.div>
                                )}
                                <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', padding: '14px', borderRadius: '50%', cursor: 'pointer', color: '#999', transition: 'all 0.3s' }}>
                                    <X size={26} />
                                </button>
                            </div>
                        </div>

                        {activeTab === 'catalog' && (
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
                                        placeholder="Buscar por nombre, SKU o categorÃ­a..."
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        style={{ width: '100%', padding: '18px 25px 18px 65px', backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '2px', color: 'white', fontSize: '17px', outline: 'none', letterSpacing: '1px', fontFamily: 'var(--font-body)' }}
                                    />
                                </div>
                                {(selectedWholesaler === 'Zecat' || selectedWholesaler === 'Todos') && (
                                    <button
                                        onClick={handleZecatSync}
                                        disabled={isSyncingZecat}
                                        style={{ background: 'rgba(212, 175, 55, 0.1)', border: '1px solid var(--accent-gold)', color: 'var(--accent-gold)', padding: '15px 30px', borderRadius: '4px', fontSize: '12px', fontWeight: '900', cursor: 'pointer', letterSpacing: '2px' }}
                                    >
                                        {isSyncingZecat ? 'SINCRONIZANDO...' : 'SYNC ZECAT'}
                                    </button>
                                )}
                            </div>
                        )}

                        <div style={{ flex: 1, display: 'grid', gridTemplateColumns: activeTab === 'catalog' ? '380px 1fr' : '300px 1fr', overflow: 'hidden' }}>
                            {activeTab === 'catalog' ? (
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
                                                <div style={{ position: 'relative', width: '80px', height: '80px', borderRadius: '2px', overflow: 'hidden', backgroundColor: 'black', border: '1px solid rgba(255,255,255,0.05)' }}>
                                                    <img src={p.images[0]} style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.8 }} />
                                                </div>
                                                <div style={{ flex: 1 }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                                                        <span style={{ fontSize: '10px', color: 'var(--accent-gold)', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '2px' }}>{p.wholesaler}</span>
                                                        <span style={{ color: '#333' }}>â€¢</span>
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

                                                <div style={{ display: 'grid', gridTemplateColumns: '360px 1fr', gap: '50px', flex: 1 }}>
                                                    {/* Columna Izquierda: Visual y Biblioteca */}
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
                                                        {/* Hero Viewer Principal */}
                                                        <div>
                                                            <label style={{ display: 'block', fontSize: '11px', color: 'var(--accent-gold)', marginBottom: '15px', fontWeight: '800', letterSpacing: '3px', textTransform: 'uppercase' }}>VISOR DE CURACIÃ“N PREMIUM</label>
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
                                                                    <input
                                                                        type="file"
                                                                        multiple
                                                                        accept="image/*"
                                                                        id="file-upload"
                                                                        style={{ display: 'none' }}
                                                                        onChange={(e) => {
                                                                            const files = e.target.files;
                                                                            if (!files) return;
                                                                            const newImages: string[] = [...(newProductForm.images || [])];
                                                                            const newFileMap = { ...pendingFiles };
                                                                            for (let i = 0; i < files.length; i++) {
                                                                                const file = files[i];
                                                                                const objectUrl = URL.createObjectURL(file);
                                                                                newImages.push(objectUrl);
                                                                                newFileMap[objectUrl] = file;
                                                                            }
                                                                            setPendingFiles(newFileMap);
                                                                            setNewProductForm({ ...newProductForm, images: newImages });
                                                                            if (!activeManualImage && newImages.length > 0) setActiveManualImage(newImages[0]);
                                                                        }}
                                                                    />
                                                                    <label htmlFor="file-upload" style={{ color: 'var(--accent-turquoise)', fontSize: '10px', fontWeight: '800', cursor: 'pointer', letterSpacing: '1px' }}>+ ARCHIVO</label>
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
                                                        {/* Fila 1: Mayorista, SKU y CategorÃ­a */}
                                                        <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-end' }}>
                                                            <div style={{ width: '200px' }}>
                                                                <label style={{ display: 'block', fontSize: '11px', color: 'var(--accent-gold)', marginBottom: '10px', fontWeight: '800', letterSpacing: '3px', textTransform: 'uppercase' }}>COÌDIGO / SKU</label>
                                                                <input
                                                                    type="text"
                                                                    value={newProductForm.external_id}
                                                                    onChange={(e) => setNewProductForm({ ...newProductForm, external_id: e.target.value })}
                                                                    style={{ width: '100%', backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '2px', padding: '15px', color: 'white', fontSize: '15px', outline: 'none' }}
                                                                />
                                                            </div>
                                                            <div style={{ flex: 1 }}>
                                                                <label style={{ display: 'block', fontSize: '11px', color: 'var(--accent-gold)', marginBottom: '10px', fontWeight: '800', letterSpacing: '3px', textTransform: 'uppercase' }}>CATEGORÃA</label>
                                                                <select
                                                                    value={newProductForm.category}
                                                                    onChange={(e) => setNewProductForm({ ...newProductForm, category: e.target.value })}
                                                                    style={{ width: '100%', height: '54px', backgroundColor: 'rgba(0, 212, 189, 0.05)', border: '1px solid var(--accent-turquoise)', padding: '0 15px', color: 'white', borderRadius: '4px', outline: 'none', appearance: 'none', cursor: 'pointer', letterSpacing: '2px', textTransform: 'uppercase', fontSize: '12px', fontWeight: '700' }}
                                                                >
                                                                    {customCategories.map(cat => <option key={cat} value={cat} style={{ background: '#0a0a0a' }}>{cat.toUpperCase()}</option>)}
                                                                </select>
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
                                                                    {newProductForm.is_premium ? 'SÃ' : 'NO'}
                                                                </button>
                                                            </div>
                                                        </div>

                                                        {/* SECCIÃ“N SEO & MARKETING (NUEVO) */}
                                                        <div style={{ padding: '25px', background: 'rgba(212, 175, 55, 0.03)', borderRadius: '4px', border: '1px solid rgba(212, 175, 55, 0.1)', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                                <label style={{ fontSize: '11px', color: 'var(--accent-gold)', fontWeight: '800', letterSpacing: '3px', textTransform: 'uppercase' }}>CONFIGURACIÃ“N SEO & MARKETING</label>
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                                    <span style={{ fontSize: '9px', color: '#555', fontWeight: '700' }}>Â¿APTO PARA CAMPAÃ‘A?</span>
                                                                    <button
                                                                        onClick={() => setNewProductForm({ ...newProductForm, for_marketing: !newProductForm.for_marketing })}
                                                                        style={{ padding: '4px 12px', borderRadius: '20px', border: '1px solid', borderColor: newProductForm.for_marketing ? 'var(--accent-turquoise)' : '#333', backgroundColor: newProductForm.for_marketing ? 'rgba(0,212,189,0.1)' : 'transparent', color: newProductForm.for_marketing ? 'var(--accent-turquoise)' : '#555', fontSize: '10px', fontWeight: '800', cursor: 'pointer' }}
                                                                    >
                                                                        {newProductForm.for_marketing ? 'SÃ, MARKETING READY' : 'NO'}
                                                                    </button>
                                                                </div>
                                                            </div>

                                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                                                <div>
                                                                    <label style={{ display: 'block', fontSize: '9px', color: 'rgba(255,255,255,0.4)', marginBottom: '5px', fontWeight: '700' }}>TÃTULO SEO (H1 SUGERIDO)</label>
                                                                    <input
                                                                        type="text"
                                                                        value={newProductForm.seo_title}
                                                                        onChange={(e) => setNewProductForm({ ...newProductForm, seo_title: e.target.value })}
                                                                        placeholder="Ej: Mochila Ejecutiva Premium..."
                                                                        style={{ width: '100%', backgroundColor: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.05)', padding: '10px', color: 'white', borderRadius: '2px', fontSize: '13px', outline: 'none' }}
                                                                    />
                                                                </div>
                                                                <div>
                                                                    <label style={{ display: 'block', fontSize: '9px', color: 'rgba(255,255,255,0.4)', marginBottom: '5px', fontWeight: '700' }}>KEYWORDS</label>
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
                                                                <label style={{ display: 'block', fontSize: '9px', color: 'rgba(255,255,255,0.4)', marginBottom: '5px', fontWeight: '700' }}>META DESCRIPCIÃ“N (INTENCIÃ“N DE VENTA)</label>
                                                                <textarea
                                                                    value={newProductForm.seo_description}
                                                                    onChange={(e) => setNewProductForm({ ...newProductForm, seo_description: e.target.value })}
                                                                    placeholder="Breve descripciÃ³n..."
                                                                    style={{ width: '100%', height: '60px', backgroundColor: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.05)', padding: '10px', color: '#999', borderRadius: '2px', fontSize: '12px', resize: 'none', outline: 'none' }}
                                                                />
                                                            </div>
                                                        </div>

                                                        {/* Fila 2: TÃ­tulo ancho */}
                                                        <div>
                                                            <label style={{ display: 'block', fontSize: '11px', color: 'var(--accent-gold)', marginBottom: '10px', fontWeight: '800', letterSpacing: '3px', textTransform: 'uppercase' }}>TÃTULO DEL PRODUCTO</label>
                                                            <input
                                                                type="text"
                                                                value={newProductForm.original_description}
                                                                onChange={(e) => setNewProductForm({ ...newProductForm, original_description: e.target.value })}
                                                                style={{ width: '100%', backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '2px', padding: '18px', color: 'white', fontSize: '20px', fontWeight: '600', outline: 'none' }}
                                                            />
                                                        </div>

                                                        {/* Fila 3: Especificaciones anchas */}
                                                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                                                            <label style={{ display: 'block', fontSize: '11px', color: 'var(--accent-gold)', marginBottom: '15px', fontWeight: '800', letterSpacing: '2px', textTransform: 'uppercase' }}>ESPECIFICACIONES TÃ‰CNICAS COMPLETAS</label>
                                                            <textarea
                                                                value={Array.isArray(newProductForm.technical_specs) ? newProductForm.technical_specs.join('\n') : ''}
                                                                onChange={(e) => setNewProductForm({ ...newProductForm, technical_specs: e.target.value.split('\n').filter(l => l.trim()) })}
                                                                placeholder="Copia aquÃ­ la ficha tÃ©cnica del proveedor..."
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
                                        ) : selectedProduct ? (
                                            <div style={{ display: 'flex', flexDirection: 'column', height: '100%', maxWidth: '1600px', margin: '0 auto', width: '100%' }}>
                                                <div style={{ height: '20px' }} /> {/* Spacer */}

                                                <div style={{ display: 'grid', gridTemplateColumns: '550px 1fr', gap: '60px', flex: 1 }}>
                                                    {/* Columna Izquierda: Visual y Biblioteca */}
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                                        <div>
                                                            <label style={{ display: 'block', fontSize: '11px', color: 'var(--accent-gold)', marginBottom: '15px', fontWeight: '800', letterSpacing: '3px', textTransform: 'uppercase' }}>VISOR DE CURACIÃ“N PREMIUM</label>
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
                                                                    src={activeImage || (selectedProduct.images && selectedProduct.images.length > 0 ? selectedProduct.images[0] : '')}
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
                                                                            if (!activeImage) setActiveImage(url);
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
                                                                {selectedProduct.images && selectedProduct.images.map((img, i) => (
                                                                    <div
                                                                        key={i}
                                                                        onClick={() => setActiveImage(img)}
                                                                        style={{
                                                                            position: 'relative',
                                                                            aspectRatio: '1/1',
                                                                            borderRadius: '2px',
                                                                            overflow: 'hidden',
                                                                            border: `2px solid ${activeImage === img ? 'var(--accent-turquoise)' : 'rgba(255,255,255,0.1)'}`,
                                                                            cursor: 'pointer',
                                                                            opacity: activeImage === img ? 1 : 0.6,
                                                                            transition: 'all 0.3s'
                                                                        }}
                                                                    >
                                                                        <img src={img} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />

                                                                        {activeImage === img && (
                                                                            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 212, 189, 0.1)', pointerEvents: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                                                <Star size={14} color="var(--accent-turquoise)" fill="var(--accent-turquoise)" />
                                                                            </div>
                                                                        )}

                                                                        {/* BotÃ³n de eliminar miniatura */}
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
                                                        {/* Fila 1: Mayorista, SKU y CategorÃ­a */}
                                                        <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-end' }}>
                                                            <div style={{ width: '200px' }}>
                                                                <label style={{ display: 'block', fontSize: '11px', color: 'var(--accent-gold)', marginBottom: '10px', fontWeight: '800', letterSpacing: '3px', textTransform: 'uppercase' }}>COÌDIGO / SKU</label>
                                                                <input
                                                                    value={selectedProduct.external_id}
                                                                    onChange={(e) => handleUpdateProduct({ external_id: e.target.value })}
                                                                    style={{ width: '100%', backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '2px', padding: '15px', color: '#888', fontSize: '15px', outline: 'none' }}
                                                                />
                                                            </div>
                                                            <div style={{ flex: 1 }}>
                                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                                                    <label style={{ fontSize: '11px', color: 'var(--accent-gold)', fontWeight: '800', letterSpacing: '3px', textTransform: 'uppercase', margin: 0 }}>CATEGORÃA</label>
                                                                    <button
                                                                        onClick={() => setIsAddingCategory(!isAddingCategory)}
                                                                        style={{ background: 'none', border: 'none', color: 'var(--accent-turquoise)', fontSize: '10px', fontWeight: '700', cursor: 'pointer', letterSpacing: '1px', textTransform: 'uppercase' }}
                                                                    >
                                                                        {isAddingCategory ? 'â† VOLVER' : '+ NUEVA'}
                                                                    </button>
                                                                </div>
                                                                {isAddingCategory ? (
                                                                    <div style={{ display: 'flex', gap: '10px' }}>
                                                                        <input
                                                                            type="text"
                                                                            placeholder="Nombre..."
                                                                            value={newCategoryName}
                                                                            onChange={(e) => setNewCategoryName(e.target.value)}
                                                                            style={{ flex: 1, backgroundColor: 'rgba(0, 212, 189, 0.05)', border: '1px solid var(--accent-turquoise)', padding: '12px', color: 'white', fontSize: '14px', borderRadius: '4px', outline: 'none' }}
                                                                        />
                                                                        <button
                                                                            onClick={() => {
                                                                                if (newCategoryName.trim()) {
                                                                                    const formatted = newCategoryName.trim();
                                                                                    if (!customCategories.includes(formatted)) {
                                                                                        setCustomCategories([...customCategories, formatted]);
                                                                                    }
                                                                                    handleUpdateProduct({ category: formatted });
                                                                                    setNewCategoryName('');
                                                                                    setIsAddingCategory(false);
                                                                                }
                                                                            }}
                                                                            style={{ backgroundColor: 'var(--accent-turquoise)', color: 'black', border: 'none', padding: '0 15px', borderRadius: '4px', fontWeight: '800', cursor: 'pointer', fontSize: '12px' }}
                                                                        >
                                                                            OK
                                                                        </button>
                                                                    </div>
                                                                ) : (
                                                                    <select
                                                                        value={selectedProduct.category || ''}
                                                                        onChange={(e) => handleUpdateProduct({ category: e.target.value })}
                                                                        style={{ width: '100%', height: '54px', backgroundColor: 'rgba(0, 212, 189, 0.05)', border: '1px solid var(--accent-turquoise)', padding: '0 15px', color: 'white', borderRadius: '4px', outline: 'none', appearance: 'none', cursor: 'pointer', letterSpacing: '2px', textTransform: 'uppercase', fontSize: '12px', fontWeight: '700' }}
                                                                    >
                                                                        {customCategories.map(cat => <option key={cat} value={cat} style={{ background: '#0a0a0a' }}>{cat.toUpperCase()}</option>)}
                                                                    </select>
                                                                )}
                                                            </div>
                                                            <div style={{ width: '120px' }}>
                                                                <label style={{ display: 'block', fontSize: '11px', color: 'var(--accent-gold)', marginBottom: '10px', fontWeight: '800', letterSpacing: '3px', textTransform: 'uppercase' }}>PREMIUM</label>
                                                                <button
                                                                    onClick={() => handleUpdateProduct({ is_premium: !selectedProduct.is_premium })}
                                                                    style={{
                                                                        width: '100%',
                                                                        height: '54px',
                                                                        backgroundColor: selectedProduct.is_premium ? 'rgba(0, 212, 189, 0.2)' : 'rgba(255,255,255,0.02)',
                                                                        border: `1px solid ${selectedProduct.is_premium ? 'var(--accent-turquoise)' : 'rgba(255,255,255,0.05)'}`,
                                                                        color: selectedProduct.is_premium ? 'var(--accent-turquoise)' : '#555',
                                                                        borderRadius: '4px',
                                                                        cursor: 'pointer',
                                                                        fontSize: '10px',
                                                                        fontWeight: '900',
                                                                        transition: 'all 0.3s'
                                                                    }}
                                                                >
                                                                    {selectedProduct.is_premium ? 'SÃ' : 'NO'}
                                                                </button>
                                                            </div>
                                                        </div>

                                                        {/* SECCIÃ“N SEO & MARKETING (NUEVO) */}
                                                        <div style={{ padding: '25px', background: 'rgba(212, 175, 55, 0.03)', borderRadius: '4px', border: '1px solid rgba(212, 175, 55, 0.1)', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                                <label style={{ fontSize: '11px', color: 'var(--accent-gold)', fontWeight: '800', letterSpacing: '3px', textTransform: 'uppercase' }}>ESTRATEGIA SEO & MARKETING</label>
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                                    <span style={{ fontSize: '9px', color: '#555', fontWeight: '700' }}>Â¿ACTIVA EN MARKETING?</span>
                                                                    <button
                                                                        onClick={() => handleUpdateProduct({ for_marketing: !selectedProduct.for_marketing })}
                                                                        style={{ padding: '4px 12px', borderRadius: '20px', border: '1px solid', borderColor: selectedProduct.for_marketing ? 'var(--accent-turquoise)' : '#333', backgroundColor: selectedProduct.for_marketing ? 'rgba(0,212,189,0.1)' : 'transparent', color: selectedProduct.for_marketing ? 'var(--accent-turquoise)' : '#555', fontSize: '10px', fontWeight: '800', cursor: 'pointer' }}
                                                                    >
                                                                        {selectedProduct.for_marketing ? 'SÃ, MARKETING READY' : 'NO'}
                                                                    </button>
                                                                </div>
                                                            </div>

                                                            <div style={{ display: 'flex', gap: '10px', padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                                                <div style={{ flex: 1 }}>
                                                                    <label style={{ display: 'block', fontSize: '9px', color: 'rgba(255,255,255,0.4)', marginBottom: '8px', fontWeight: '700', letterSpacing: '1px' }}>PROMOVER ESTA IMAGEN A PORTADA (HERO SLIDER)</label>
                                                                    <div style={{ display: 'flex', gap: '8px' }}>
                                                                        {[1, 2, 3].map(num => (
                                                                            <button
                                                                                key={num}
                                                                                onClick={() => handleSetAsHero(num)}
                                                                                style={{ flex: 1, padding: '10px', background: 'rgba(212,175,55,0.05)', border: '1px solid rgba(212,175,55,0.2)', color: 'var(--accent-gold)', fontSize: '10px', fontWeight: '900', cursor: 'pointer', borderRadius: '4px', textTransform: 'uppercase', transition: 'all 0.3s' }}
                                                                                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(212,175,55,0.15)'}
                                                                                onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(212,175,55,0.05)'}
                                                                            >
                                                                                SLIDE {num}
                                                                            </button>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                                                <div>
                                                                    <label style={{ display: 'block', fontSize: '9px', color: 'rgba(255,255,255,0.4)', marginBottom: '5px', fontWeight: '700' }}>TÃTULO SEO (H1)</label>
                                                                    <input
                                                                        type="text"
                                                                        value={selectedProduct.seo_title}
                                                                        onChange={(e) => handleUpdateProduct({ seo_title: e.target.value })}
                                                                        style={{ width: '100%', backgroundColor: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.05)', padding: '10px', color: 'white', borderRadius: '2px', fontSize: '13px', outline: 'none' }}
                                                                    />
                                                                </div>
                                                                <div>
                                                                    <label style={{ display: 'block', fontSize: '9px', color: 'rgba(255,255,255,0.4)', marginBottom: '5px', fontWeight: '700' }}>KEYWORDS</label>
                                                                    <input
                                                                        type="text"
                                                                        value={selectedProduct.seo_keywords}
                                                                        onChange={(e) => handleUpdateProduct({ seo_keywords: e.target.value })}
                                                                        style={{ width: '100%', backgroundColor: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.05)', padding: '10px', color: 'white', borderRadius: '2px', fontSize: '13px', outline: 'none' }}
                                                                    />
                                                                </div>
                                                            </div>
                                                            <div>
                                                                <label style={{ display: 'block', fontSize: '9px', color: 'rgba(255,255,255,0.4)', marginBottom: '5px', fontWeight: '700' }}>META DESCRIPCIÃ“N</label>
                                                                <textarea
                                                                    value={selectedProduct.seo_description}
                                                                    onChange={(e) => handleUpdateProduct({ seo_description: e.target.value })}
                                                                    style={{ width: '100%', height: '60px', backgroundColor: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.05)', padding: '10px', color: '#999', borderRadius: '2px', fontSize: '12px', resize: 'none', outline: 'none' }}
                                                                />
                                                            </div>
                                                        </div>

                                                        {/* Fila 2: TÃ­tulo ancho */}
                                                        <div>
                                                            <label style={{ display: 'block', fontSize: '11px', color: 'var(--accent-gold)', marginBottom: '10px', fontWeight: '800', letterSpacing: '3px', textTransform: 'uppercase' }}>TÃTULO DEL PRODUCTO</label>
                                                            <input
                                                                value={selectedProduct.name}
                                                                onChange={(e) => handleUpdateProduct({ name: e.target.value })}
                                                                style={{ width: '100%', backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '2px', padding: '18px', color: 'white', fontSize: '20px', fontWeight: '600', outline: 'none' }}
                                                            />
                                                        </div>

                                                        {/* Fila 3: Especificaciones anchas */}
                                                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                                                                <label style={{ display: 'block', fontSize: '11px', color: 'var(--accent-gold)', fontWeight: '800', letterSpacing: '2px', textTransform: 'uppercase', margin: 0 }}>ESPECIFICACIONES TÃ‰CNICAS (FICHA)</label>
                                                            </div>
                                                            <textarea
                                                                value={Array.isArray(selectedProduct.technical_specs) ? selectedProduct.technical_specs.join('\n') : (selectedProduct.technical_specs || '')}
                                                                onChange={(e) => handleUpdateProduct({ technical_specs: e.target.value.split('\n').filter(l => l.trim()) })}
                                                                style={{ width: '100%', flex: 1, minHeight: '400px', backgroundColor: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '2px', padding: '25px', color: '#eee', fontSize: '15px', outline: 'none', resize: 'none', lineHeight: '1.8', fontFamily: 'monospace' }}
                                                            />
                                                        </div>
                                                    </div>
                                                </div>

                                                <div style={{ marginTop: '30px', display: 'flex', gap: '20px', paddingBottom: '40px' }}>
                                                    <button
                                                        onClick={handleReject}
                                                        style={{ flex: 1, backgroundColor: 'rgba(239, 68, 68, 0.05)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '20px', fontSize: '14px', fontWeight: '800', letterSpacing: '2px', cursor: 'pointer', borderRadius: '4px', textTransform: 'uppercase', transition: 'all 0.3s' }}
                                                        onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'; }}
                                                        onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.05)'; }}
                                                    >
                                                        ELIMINAR BUFFER
                                                    </button>

                                                    <button
                                                        onClick={handleSaveChanges}
                                                        disabled={isSaving}
                                                        style={{ flex: 1, backgroundColor: 'rgba(255, 255, 255, 0.05)', color: 'white', border: '1px solid rgba(255, 255, 255, 0.1)', padding: '20px', fontSize: '14px', fontWeight: '800', letterSpacing: '2px', cursor: isSaving ? 'not-allowed' : 'pointer', borderRadius: '4px', textTransform: 'uppercase', transition: 'all 0.3s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}
                                                    >
                                                        {isSaving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                                                        GUARDAR CAMBIOS
                                                    </button>

                                                    <button
                                                        onClick={handlePublish}
                                                        style={{ flex: 2, backgroundColor: 'var(--accent-turquoise)', color: 'black', border: 'none', padding: '20px', fontSize: '16px', fontWeight: '900', letterSpacing: '4px', cursor: 'pointer', borderRadius: '4px', textTransform: 'uppercase', transition: 'all 0.3s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '15px' }}
                                                        onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 10px 30px rgba(0,212,189,0.3)'; }}
                                                        onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
                                                    >
                                                        PUBLICAR PRODUCTO
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: '#444', textTransform: 'uppercase', letterSpacing: '4px', fontSize: '13px' }}>
                                                Selecciona un producto para comenzar la curación
                                            </div>
                                        )}
                                    </div>
                                </React.Fragment>
                            ) : (
                                <React.Fragment>
                                    {/* Left List: Sections */}
                                    <div className="custom-scroll" style={{ borderRight: '1px solid rgba(255,255,255,0.05)', overflowY: 'auto', padding: '32px 40px', backgroundColor: 'rgba(0,0,0,0.2)' }}>
                                        <p style={{ fontSize: '11px', color: 'var(--accent-gold)', fontWeight: '800', textTransform: 'uppercase', marginBottom: '32px', letterSpacing: '3px', fontFamily: 'var(--font-body)' }}>
                                            SECCIONES WEB
                                        </p>
                                        {[
                                            { id: 'mugs', label: 'Tazas y Mugs' },
                                            { id: 'botellas', label: 'Botellas y Termos' },
                                            { id: 'libretas', label: 'Libretas y Agendas' },
                                            { id: 'mochilas', label: 'Mochilas y Bolsos' },
                                            { id: 'ecologicos', label: 'Línea de Madera' },
                                            { id: 'bolsas', label: 'Bolsas Reutilizables' },
                                            { id: 'hero', label: 'Banner Principal' }
                                        ].map(sec => (
                                            <motion.div
                                                key={sec.id}
                                                onClick={() => setSelectedGallerySection(sec.id)}
                                                whileHover={{ scale: 1.02, x: 5 }}
                                                style={{
                                                    padding: '20px',
                                                    backgroundColor: selectedGallerySection === sec.id ? 'rgba(0, 212, 189, 0.05)' : 'rgba(255, 255, 255, 0.01)',
                                                    borderRadius: '4px',
                                                    border: '1px solid',
                                                    borderColor: selectedGallerySection === sec.id ? 'var(--accent-turquoise)' : 'rgba(255, 255, 255, 0.03)',
                                                    cursor: 'pointer',
                                                    marginBottom: '15px',
                                                    transition: 'all 0.3s'
                                                }}
                                            >
                                                <p style={{ margin: 0, fontSize: '14px', fontWeight: '600', color: selectedGallerySection === sec.id ? 'var(--accent-turquoise)' : 'white', letterSpacing: '1px', textTransform: 'uppercase' }}>{sec.label}</p>
                                            </motion.div>
                                        ))}
                                    </div>

                                    {/* Right Detail: Gallery Grid */}
                                    <div className="custom-scroll" style={{ padding: '40px 60px', overflowY: 'auto', backgroundColor: '#050505' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
                                            <div>
                                                <h2 style={{ color: 'white', fontFamily: 'var(--font-heading)', fontSize: '28px', margin: 0, letterSpacing: '2px', textTransform: 'uppercase' }}>
                                                    GALERÍA DE <span style={{ color: 'var(--accent-gold)' }}>TRABAJOS REALIZADOS</span>
                                                </h2>
                                                <p style={{ color: '#666', fontSize: '14px', marginTop: '10px' }}>Gestiona las imágenes que se muestran en el carrusel de la sección.</p>
                                            </div>

                                            <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                                                <div style={{ display: 'flex', gap: '10px' }}>
                                                    <input
                                                        type="text"
                                                        placeholder="Google Drive Folder ID"
                                                        value={driveFolderId}
                                                        onChange={(e) => setDriveFolderId(e.target.value)}
                                                        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', padding: '15px 20px', borderRadius: '4px', color: 'white', fontSize: '12px', width: '250px' }}
                                                    />
                                                    <button
                                                        onClick={handleDriveSync}
                                                        disabled={isSyncingDrive}
                                                        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.2)', color: 'white', padding: '15px 20px', borderRadius: '4px', fontSize: '12px', fontWeight: '800', cursor: 'pointer' }}
                                                    >
                                                        {isSyncingDrive ? 'SYNCING...' : 'SYNC DRIVE'}
                                                    </button>
                                                </div>

                                                <input
                                                    type="file"
                                                    multiple
                                                    accept="image/*"
                                                    id="gallery-upload"
                                                    style={{ display: 'none' }}
                                                    onChange={handleGalleryUpload}
                                                />
                                                <label
                                                    htmlFor="gallery-upload"
                                                    style={{
                                                        background: 'var(--accent-turquoise)',
                                                        color: 'black',
                                                        padding: '15px 30px',
                                                        borderRadius: '4px',
                                                        fontSize: '12px',
                                                        fontWeight: '900',
                                                        cursor: uploadingGallery ? 'not-allowed' : 'pointer',
                                                        letterSpacing: '2px',
                                                        textTransform: 'uppercase',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '10px'
                                                    }}
                                                >
                                                    {uploadingGallery ? <RefreshCw className="animate-spin" size={18} /> : <Plus size={18} />}
                                                    {uploadingGallery ? 'SUBIENDO...' : 'SUBIR IMÁGENES'}
                                                </label>
                                            </div>
                                        </div>

                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '25px' }}>
                                            {galleryImages.map((src, index) => (
                                                <div key={index} style={{ position: 'relative', aspectRatio: '4/3', borderRadius: '8px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.05)', background: '#111' }}>
                                                    <img src={src} alt="Galería" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                    <button
                                                        onClick={() => handleRemoveGalleryImage(index)}
                                                        style={{
                                                            position: 'absolute',
                                                            top: '10px',
                                                            right: '10px',
                                                            background: 'rgba(239, 68, 68, 0.9)',
                                                            color: 'white',
                                                            border: 'none',
                                                            borderRadius: '50%',
                                                            width: '30px',
                                                            height: '30px',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            cursor: 'pointer',
                                                            boxShadow: '0 4px 10px rgba(0,0,0,0.3)'
                                                        }}
                                                    >
                                                        <X size={16} />
                                                    </button>
                                                </div>
                                            ))}
                                            {galleryImages.length === 0 && !uploadingGallery && (
                                                <div style={{ gridColumn: '1 / -1', padding: '100px', textAlign: 'center', border: '2px dashed rgba(255,255,255,0.05)', borderRadius: '12px', color: '#444' }}>
                                                    <Plus size={60} style={{ marginBottom: '20px', opacity: 0.2 }} />
                                                    <p style={{ letterSpacing: '2px', textTransform: 'uppercase', fontSize: '12px' }}>No hay imágenes en esta galería</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </React.Fragment>
                            )}
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
