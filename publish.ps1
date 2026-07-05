# Publish Script for Ecomoving
$ErrorActionPreference = "Continue" # Don't stop on minor revert errors
$env:NODE_TLS_REJECT_UNAUTHORIZED="0" # Bypass SSL issues downloading Google Fonts during build

$root = "C:\Users\Mario\Desktop\LaFabrica"
$site = "C:\Users\Mario\Desktop\ecomoving-site"
$localEdit = "C:\Users\Mario\Desktop\EcomovingWeb"
$out = "$root\out"

Write-Host "--- Iniciando Proceso de Publicación (Auditado) ---"

# 0. Limpiar cache
Write-Host "Limpiando archivos temporales..."
if (Test-Path "$root\.next") { Remove-Item -Recurse -Force "$root\.next" }
if (Test-Path "$root\out") { Remove-Item -Recurse -Force "$root\out" }

# 1. Preparar Entorno de Build (Aislamiento de Aplicación Pública)
Write-Host "Aislando componentes administrativos y rutas dinámicas..."
$apiMoved = $false
$studioMoved = $false
$robotsMoved = $false
$sitemapMoved = $false

if (Test-Path "$root\src\app\api") { Move-Item "$root\src\app\api" "$root\src\api_temp_hide" -Force; $apiMoved = $true }
if (Test-Path "$root\src\app\studio") { Move-Item "$root\src\app\studio" "$root\src\studio_temp_hide" -Force; $studioMoved = $true }
if (Test-Path "$root\src\app\robots.ts") { Move-Item "$root\src\app\robots.ts" "$root\src\robots_temp_hide.ts" -Force; $robotsMoved = $true }
if (Test-Path "$root\src\app\sitemap.ts") { Move-Item "$root\src\app\sitemap.ts" "$root\src\sitemap_temp_hide.ts" -Force; $sitemapMoved = $true }

try {
    # 2. Construcción Estática
    Write-Host "Ejecutando Build Estático..."
    # 1.5 Sincronizar archivo de contenido local
    Write-Host "Sincronizando web_content_sync.json para la compilación..."
    if (Test-Path "$localEdit\web_content_sync.json") {
        Copy-Item "$localEdit\web_content_sync.json" "$root\public\web_content_sync.json" -Force
    }

    Set-Location $root
    npm run build

    # 3. Transferencia a Producción
    Write-Host "Sincronizando archivos con ecomoving-site..."
    if (Test-Path $out) {
        # Limpiar sitio antes de copiar para asegurar paridad absoluta (conservando git y el json si estuviera)
        Get-ChildItem $site -Exclude ".git","web_content_sync.json" | Remove-Item -Recurse -Force
        xcopy /e /i /y "$out\*" "$site\"
        # Copiar web_content_sync.json también a la raíz de ecomoving-site para que se suba a GitHub
        if (Test-Path "$localEdit\web_content_sync.json") {
            Copy-Item "$localEdit\web_content_sync.json" "$site\web_content_sync.json" -Force
        }
    } else {
        throw "Error: No se encontró la carpeta de salida 'out'."
    }

    # 4. Despliegue Git
    Write-Host "Enviando cambios a GitHub..."
    Set-Location $site
    git add .
    git commit -m "publish: grid parity and clean static export"
    git push origin main

    Write-Host "--- Publicación Completada con ÉXITO ---"
} 
catch {
    Write-Error "Error durante la publicación: $_"
}
finally {
    # 5. Restauración del Entorno
    Write-Host "Restaurando entorno de desarrollo..."
    if ($apiMoved) { Move-Item "$root\src\api_temp_hide" "$root\src\app\api" -Force }
    if ($studioMoved) { Move-Item "$root\src\studio_temp_hide" "$root\src\app\studio" -Force }
    if ($robotsMoved) { Move-Item "$root\src\robots_temp_hide.ts" "$root\src\app\robots.ts" -Force }
    if ($sitemapMoved) { Move-Item "$root\src\sitemap_temp_hide.ts" "$root\src\app\sitemap.ts" -Force }
    Set-Location $root
}
