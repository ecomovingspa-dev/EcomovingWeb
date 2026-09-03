# Publish Script for Ecomoving (Standardized Codebase Sync & Push)
$ErrorActionPreference = "Stop"

$root = "C:\Users\Mario\Desktop\LaFabrica"
$site = "C:\Users\Mario\Desktop\ecomoving-site"

Write-Host "--- Iniciando Proceso de Publicación ---"

try {
    # 1. Copiar archivos de configuración base
    Write-Host "Sincronizando archivos de configuración..."
    Copy-Item -Path "$root\package.json", "$root\next.config.ts", "$root\tsconfig.json", "$root\tailwind.config.ts", "$root\postcss.config.js", "$root\eslint.config.mjs", "$root\next-env.d.ts", "$root\types.ts" -Destination $site -Force

    # 2. Sincronizar directorio src (Excluyendo Studio y APIs administrativas)
    Write-Host "Sincronizando código fuente público..."
    # Limpiar src antiguo para asegurar paridad
    if (Test-Path "$site\src") { Remove-Item -Recurse -Force "$site\src" }
    mkdir "$site\src" -Force | Out-Null
    Copy-Item -Path "$root\src\*" -Destination "$site\src" -Recurse -Force

    # Eliminar rutas de administración del sitio cliente
    Remove-Item -Path "$site\src\app\studio", "$site\src\app\api" -Recurse -Force -ErrorAction SilentlyContinue

    # 3. Despliegue Git directo a GitHub
    Write-Host "Enviando cambios a GitHub..."
    Set-Location $site
    git add .
    git commit -m "publish: standardized codebase sync and content update" --allow-empty
    git push origin main

    Write-Host "--- Publicación Completada con ÉXITO ---"
} 
catch {
    Write-Error "Error durante la publicación: $_"
}
finally {
    Set-Location $root
}
