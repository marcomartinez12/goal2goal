@echo off
chcp 65001 >nul
cls
echo ========================================
echo    🎯 Goal2Goal - MODO DEBUG
echo ========================================
echo.
echo 🔍 Verificando entorno...
echo.

REM Verificar Python
python --version
if errorlevel 1 (
    echo ❌ Python no encontrado
    pause
    exit /b 1
)
echo ✅ Python instalado
echo.

REM Verificar directorio
echo 📁 Directorio actual:
cd
echo.

REM Verificar venv
if not exist "venv\Scripts\activate.bat" (
    echo ❌ Entorno virtual no encontrado
    echo    Ejecuta iniciar.bat primero
    pause
    exit /b 1
)
echo ✅ Entorno virtual encontrado
echo.

REM Activar venv
echo 🔄 Activando entorno virtual...
call venv\Scripts\activate.bat
echo ✅ Entorno activado
echo.

REM Verificar dependencias
echo 📦 Verificando dependencias...
python -c "import flask; print('✓ Flask')"
python -c "import flask_login; print('✓ Flask-Login')"
python -c "import flask_sqlalchemy; print('✓ Flask-SQLAlchemy')"
python -c "import requests; print('✓ Requests')"
python -c "from bs4 import BeautifulSoup; print('✓ BeautifulSoup')"
echo.

REM Verificar modelos
echo 🗃️ Verificando modelos...
python -c "from models import User, Prediction, TeamStatsCache; print('✓ Modelos OK')"
echo.

REM Verificar app
echo 📱 Verificando app.py...
python -c "from app import app, db; print('✓ App OK')"
echo.

echo ========================================
echo 🚀 Iniciando servidor...
echo ========================================
echo.
python app.py
echo.
echo ========================================
echo Servidor detenido
pause
