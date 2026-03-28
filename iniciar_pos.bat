@echo off
title Fresas con Crema POS - Iniciando Sistema...

echo ==========================================
echo    INICIANDO FRESAS CON CREMA POS
echo ==========================================

:: Iniciar Servidor
echo [1/2] Iniciando Servidor (Backend)...
start cmd /k "cd server && npm run dev"

:: Iniciar Cliente
echo [2/2] Iniciando Cliente (Frontend)...
start cmd /k "cd client && npm run dev"

echo.
echo ==========================================
echo    SISTEMA INICIADO CORRECTAMENTE
echo ==========================================
echo El servidor correra en http://localhost:4000
echo El cliente correra en http://localhost:5173 (o similar)
echo ==========================================
pause
