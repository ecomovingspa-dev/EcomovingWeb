@echo off
title CONTROL HUB - Administrador de Entorno
echo ==========================================
echo    INICIANDO EL CONTROL HUB (ADMIN)
echo ==========================================
echo.

echo [1/2] Abriendo navegador en http://localhost:3001/studio...
start http://localhost:3001/studio

echo [2/2] Ejecutando npm run dev...
echo (Este puerto 3001 ha sido habilitado para el Control)
echo.

npm run dev

pause
