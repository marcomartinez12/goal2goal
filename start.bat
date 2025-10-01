@echo off
chcp 65001 >nul
cls
echo ========================================
echo    🎯 Goal2Goal
echo ========================================
echo.
echo 🔄 Activando entorno virtual...
call venv\Scripts\activate.bat
echo.
echo 🚀 Iniciando servidor en http://localhost:5000
echo ⚠️  Presiona Ctrl+C para detener
echo.
python app.py
