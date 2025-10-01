# 🚀 Instrucciones de Instalación - Sistema de Login MySQL

## 📋 Requisitos Previos

1. **XAMPP** instalado con MySQL
2. **Python 3.8+** instalado
3. Dependencias de Python actualizadas

---

## 🔧 Paso 1: Instalar Dependencias

Ejecuta en la terminal (dentro de la carpeta del proyecto):

```bash
pip install -r requirements.txt
```

Esto instalará:
- `flask-login` - Manejo de sesiones
- `flask-sqlalchemy` - ORM para base de datos
- `flask-bcrypt` - Encriptación de contraseñas
- `pymysql` - Conector MySQL para Python

---

## 🗄️ Paso 2: Iniciar XAMPP MySQL

1. Abre **XAMPP Control Panel**
2. Haz clic en **Start** en el módulo **MySQL**
3. Verifica que MySQL esté corriendo (luz verde)

---

## 🛠️ Paso 3: Crear la Base de Datos

### Opción A: Usando el script Python (Recomendado)

```bash
python init_db.py
```

El script te pedirá:
- Host (default: localhost)
- Puerto (default: 3306)
- Usuario (default: root)
- Contraseña (normalmente vacía en XAMPP)

### Opción B: Manual con phpMyAdmin

1. Abre http://localhost/phpmyadmin
2. Crea una nueva base de datos llamada `goal2goal_db`
3. Selecciona cotejamiento: `utf8mb4_unicode_ci`
4. Importa el archivo `database_setup.sql`

---

## ⚙️ Paso 4: Configurar Variables de Entorno

Abre el archivo `.env` y verifica/actualiza:

```env
# Configuración MySQL
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASSWORD=
MYSQL_DATABASE=goal2goal_db

# Clave secreta de Flask (cámbiala por una propia)
SECRET_KEY=tu_clave_secreta_super_segura_cambiala_12345
```

⚠️ **IMPORTANTE**: Cambia `SECRET_KEY` por una clave única y segura en producción.

---

## ▶️ Paso 5: Iniciar la Aplicación

```bash
python app.py
```

Deberías ver:
```
INFO - Tablas de base de datos verificadas/creadas
INFO - Iniciando servidor en puerto 5000
```

---

## 🌐 Paso 6: Probar el Sistema

1. Abre tu navegador en: **http://localhost:5000**

2. **Registrar un usuario:**
   - Haz clic en "Registrarse"
   - Completa el formulario
   - Usuario: mínimo 3 caracteres
   - Contraseña: mínimo 6 caracteres

3. **Iniciar sesión:**
   - Usa tus credenciales
   - Serás redirigido a la página principal

4. **Hacer una predicción:**
   - Ingresa los datos de los equipos
   - Haz clic en "Calcular Predicción"
   - Verás el botón "Guardar Predicción"

5. **Ver tu historial:**
   - Haz clic en "📊 Mi Dashboard"
   - Verás todas tus predicciones guardadas

---

## 📁 Estructura de la Base de Datos

### Tabla `users`
- `id` - ID único del usuario
- `username` - Nombre de usuario (único)
- `email` - Correo electrónico (único)
- `password_hash` - Contraseña encriptada con bcrypt
- `is_active` - Estado del usuario
- `created_at` - Fecha de registro
- `last_login` - Último inicio de sesión

### Tabla `predictions`
- `id` - ID único de la predicción
- `user_id` - ID del usuario (FK)
- `team1_name`, `team2_name` - Nombres de equipos
- `team1_*`, `team2_*` - Estadísticas de ambos equipos
- `poisson_btts` - Resultado Poisson Bivariado
- `logistic_btts` - Resultado Regresión Logística
- `final_btts` - Predicción final BTTS
- `recommended_model` - Modelo recomendado
- `confidence_level` - Nivel de confianza
- `created_at` - Fecha de la predicción

---

## ✅ Verificar Instalación

### Verificar que MySQL está corriendo:
```bash
mysql -u root -p -e "SHOW DATABASES;"
```

### Verificar las tablas creadas:
```bash
mysql -u root -p goal2goal_db -e "SHOW TABLES;"
```

Deberías ver:
```
+------------------------+
| Tables_in_goal2goal_db |
+------------------------+
| predictions            |
| users                  |
+------------------------+
```

---

## 🐛 Solución de Problemas

### Error: "Can't connect to MySQL server"
- Verifica que XAMPP MySQL esté corriendo
- Verifica el puerto (default: 3306)
- Verifica que el usuario/contraseña sean correctos

### Error: "Access denied for user 'root'@'localhost'"
- En XAMPP, la contraseña de root suele estar vacía
- Verifica MYSQL_PASSWORD en .env (déjalo vacío si no tiene contraseña)

### Error: "Unknown database 'goal2goal_db'"
- Ejecuta `python init_db.py` para crear la base de datos
- O créala manualmente desde phpMyAdmin

### Error: "ModuleNotFoundError: No module named 'pymysql'"
- Ejecuta: `pip install -r requirements.txt`

### Las predicciones no se guardan
- Verifica que hayas iniciado sesión
- El botón "Guardar Predicción" solo aparece si estás autenticado
- Revisa la consola del navegador (F12) para errores

---

## 🔐 Seguridad

- Las contraseñas se encriptan con **bcrypt** (nunca se almacenan en texto plano)
- Las sesiones se manejan con **Flask-Login**
- Se usa **SECRET_KEY** para firmar las cookies de sesión
- Las consultas SQL usan **SQLAlchemy ORM** (protección contra SQL injection)

---

## 📝 Notas Importantes

1. **Este es un sistema básico** - Para producción, considera:
   - Usar HTTPS
   - Agregar verificación de email
   - Implementar recuperación de contraseña
   - Añadir rate limiting
   - Usar variables de entorno en servidor real

2. **Usuario de prueba** - Si ejecutaste `database_setup.sql`, existe:
   - Usuario: `admin`
   - Contraseña: `admin123`

3. **Cambiar SECRET_KEY** - Es crítico usar una clave única en producción

---

## 📚 Rutas Disponibles

- `/` - Página principal (predicciones)
- `/register` - Registro de usuarios
- `/login` - Inicio de sesión
- `/logout` - Cerrar sesión
- `/dashboard` - Historial de predicciones (requiere login)
- `/save_prediction` - Guardar predicción (API, requiere login)
- `/get_historical` - Obtener historial (API, requiere login)

---

¿Necesitas ayuda? Revisa los logs de la aplicación en la terminal donde ejecutaste `python app.py`
