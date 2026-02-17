# Especialista en Despliegue Ecomoving (GitHub + Vercel)

Este skill automatiza y gestiona el flujo de trabajo para desplegar cambios desde el entorno local hacia GitHub y Vercel, asegurando la integridad de los datos y la sincronización entre el panel de administración y el sitio público.

## 📋 Capacidades

1.  **Sincronización Git**: Gestión de commits, ramas (`main` vs `principal`) y resolución de conflictos básicos.
2.  **Validación de Estructura**: Verifica que las carpetas críticas (`app`, `components`, `lib`, `public`) existan antes de subir.
3.  **Gestión de Secretos**: Asegura que el archivo `.env.local` esté en `.gitignore` para evitar fugas de seguridad.
4.  **Mantenimiento de Vercel**: Instrucciones para la configuración de dominios y variables de entorno.

## 🛠️ Flujos de Trabajo Comunes

### 1. Sincronizar Cambios al Sitio Público
Cuando realices cambios en `C:\Users\Mario\Desktop\ecomoving-site`, usa este flujo:
- Navegar a la carpeta del sitio.
- Realizar `git add .`.
- Crear un commit descriptivo.
- Hacer `git push origin [rama]`.

### 2. Sincronizar Cambios al Panel de Administración
Cuando realices cambios en `C:\Users\Mario\Desktop\EcomovingWeb`:
- Navegar a la carpeta del admin.
- Realizar `git add .`.
- Crear un commit.
- Hacer `git push origin main`.

### 3. Configuración de Nuevos Dominios (NIC Chile)
1.  En Vercel Dashboard > Settings > Domains.
2.  Agregar el dominio (ej: `ecomoving.cl`).
3.  Configurar los Nameservers en NIC Chile (`ns1.vercel-dns.com`, etc.).

## 🚨 Reglas Críticas de Seguridad

- **NUNCA** subas el archivo `.env.local` a GitHub.
- Siempre verifica que el archivo `.gitignore` incluya:
    - `.env.local`
    - `node_modules`
    - `.next`

## 📦 Estructura del Proyecto Estándar

Para que Vercel no falle, el repositorio DEBE verse así en la raíz:
- `/app` (Rutas y páginas)
- `/components` (Componentes visuales)
- `/lib` (Lógica de base de datos)
- `/public` (Imágenes y estáticos)
- `package.json`
- `next.config.ts`
