@echo off
chcp 65001 >nul
cls
echo ========================================
echo    🎯 Goal2Goal - BTTS Predictions
echo ========================================
echo.
echo 🔄 Activando entorno virtual...
call venv\Scripts\activate.bat
if errorlevel 1 (
    echo ❌ Error: No se encontró el entorno virtual
    echo    Ejecuta iniciar.bat primero
    pause
    exit /b 1
)
echo ✅ Entorno virtual activado
echo.
echo 🚀 Iniciando servidor Goal2Goal...
echo    📍 URL: http://localhost:5000
echo    ⚠️  Presiona Ctrl+C para detener
echo.
echo ========================================
echo.
python app.py
pause
