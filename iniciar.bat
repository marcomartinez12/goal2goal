@echo off
chcp 65001 >nul
cls
echo ========================================
echo    🎯 Goal2Goal - Inicio Automático
echo ========================================
echo.

REM Verificar si Python está instalado
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Python no está instalado o no está en PATH
    echo    Por favor instala Python 3.8 o superior
    pause
    exit /b 1
)

echo ✅ Python detectado
echo.

REM Crear entorno virtual si no existe
if not exist "venv" (
    echo 📦 Creando entorno virtual...
    python -m venv venv
    if errorlevel 1 (
        echo ❌ Error al crear entorno virtual
        pause
        exit /b 1
    )
    echo ✅ Entorno virtual creado
    echo.
) else (
    echo ✅ Entorno virtual ya existe
    echo.
)

REM Activar entorno virtual
echo 🔄 Activando entorno virtual...
call venv\Scripts\activate.bat
if errorlevel 1 (
    echo ❌ Error al activar entorno virtual
    pause
    exit /b 1
)
echo ✅ Entorno virtual activado
echo.

REM Instalar/actualizar dependencias
echo 📦 Instalando dependencias...
pip install -r requirements.txt --quiet
if errorlevel 1 (
    echo ⚠️  Advertencia: Algunos paquetes podrían no haberse instalado
    echo    Continuando de todas formas...
)
echo ✅ Dependencias instaladas
echo.

REM Verificar si XAMPP MySQL está corriendo
echo 🔍 Verificando conexión a MySQL...
timeout /t 2 /nobreak >nul

REM Intentar conectar a MySQL
python -c "import pymysql; pymysql.connect(host='localhost', user='root', password='')" 2>nul
if errorlevel 1 (
    echo.
    echo ⚠️  ========================================
    echo    ⚠️  MySQL NO ESTÁ CORRIENDO
    echo    ========================================
    echo.
    echo    Por favor:
    echo    1. Abre XAMPP Control Panel
    echo    2. Inicia el módulo MySQL
    echo    3. Vuelve a ejecutar este script
    echo.
    pause
    exit /b 1
)
echo ✅ Conexión a MySQL exitosa
echo.

REM Inicializar base de datos si no existe
echo 🗄️  Verificando base de datos...
python -c "import pymysql; conn = pymysql.connect(host='localhost', user='root', password=''); cur = conn.cursor(); cur.execute('CREATE DATABASE IF NOT EXISTS goal2goal_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci'); conn.close()" 2>nul
if errorlevel 1 (
    echo ⚠️  Advertencia: No se pudo verificar/crear la base de datos
) else (
    echo ✅ Base de datos verificada
)
echo.

REM Crear tablas automáticamente (app.py hace db.create_all())
echo 🏗️  Las tablas se crearán automáticamente al iniciar el servidor
echo.

REM Iniciar servidor Flask
echo ========================================
echo    🚀 Iniciando servidor Goal2Goal...
echo ========================================
echo.
echo    📍 URL: http://localhost:5000
echo    🔐 Accede y registra tu usuario
echo    ⚠️  Presiona Ctrl+C para detener el servidor
echo.
echo ========================================
echo.

python app.py

REM Si el servidor se detiene
echo.
echo ========================================
echo    ⏹️  Servidor detenido
echo ========================================
pause
