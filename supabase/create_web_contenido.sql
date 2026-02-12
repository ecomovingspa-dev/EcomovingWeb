-- Script para crear la tabla web_contenido en Supabase
-- Ejecutar en el SQL Editor de Supabase

CREATE TABLE IF NOT EXISTS web_contenido (
  id SERIAL PRIMARY KEY,
  section VARCHAR(50) UNIQUE NOT NULL,
  content JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_by VARCHAR(100) DEFAULT 'system'
);

-- Índice para búsquedas rápidas por sección
CREATE INDEX IF NOT EXISTS idx_web_contenido_section ON web_contenido(section);

-- Insertar contenido inicial para Hero
INSERT INTO web_contenido (section, content) VALUES (
  'hero',
  '{
    "title": "REGALOS CORPORATIVOS",
    "subtitle": "Arte en Movimiento",
    "cta_text": "Ver Catálogo",
    "cta_link": "/catalogo",
    "background_image": ""
  }'
) ON CONFLICT (section) DO NOTHING;

-- Insertar contenido inicial para Mugs
INSERT INTO web_contenido (section, content) VALUES (
  'mugs',
  '{
    "title": "Colección Mugs Premium",
    "description": "No solo creamos productos, diseñamos experiencias. Ingeniería de doble pared y acabados que tus clientes no querrán soltar.",
    "cells": [
      {"id": "mug_split_1", "label": "Executive Series", "image": "", "span": "2x2"},
      {"id": "mug_split_2", "label": "Mate Finish", "image": "", "span": "row-2"},
      {"id": "mug_split_3", "label": "Colors", "image": "", "span": "1x1"}
    ],
    "cta_text": "Ver Catálogo",
    "cta_link": "/catalogo"
  }'
) ON CONFLICT (section) DO NOTHING;

-- Trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_web_contenido_updated_at ON web_contenido;
CREATE TRIGGER update_web_contenido_updated_at
    BEFORE UPDATE ON web_contenido
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Habilitar RLS (Row Level Security) si es necesario
-- ALTER TABLE web_contenido ENABLE ROW LEVEL SECURITY;

-- Política para permitir lectura pública
-- CREATE POLICY "Allow public read" ON web_contenido FOR SELECT USING (true);

-- Política para permitir edición solo a usuarios autenticados (opcional)
-- CREATE POLICY "Allow authenticated update" ON web_contenido FOR UPDATE USING (auth.role() = 'authenticated');

SELECT 'Tabla web_contenido creada exitosamente' as status;
