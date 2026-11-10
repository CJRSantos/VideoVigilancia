@echo off
title VIGILA Cloud Video Surveillance Platform
color 0B
echo =====================================================================
echo            VIGILA - Enterprise Video Surveillance Platform
echo       Simulador Profesional de CCTV y Optimizacion de Arquitectura
echo =====================================================================
echo.
echo Iniciando servidor en puerto 3000...
echo.
start http://localhost:3000
node server.js
pause

