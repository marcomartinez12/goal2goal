# ⚽ Goal2Goal - Predicciones BTTS

Sistema de predicción de **Both Teams To Score (Ambos Marcan)** usando modelos estadísticos:
- 📊 **Poisson Bivariado**
- 🤖 **Regresión Logística**

---

## 🚀 Inicio Rápido

### Primera vez (Instalación completa):

1. **Inicia XAMPP MySQL**
   - Abre XAMPP Control Panel
   - Click en "Start" en el módulo MySQL

2. **Ejecuta el instalador automático:**
   ```bash
   iniciar.bat
   ```
   Esto hará automáticamente:
   - ✅ Crear entorno virtual
   - ✅ Instalar dependencias
   - ✅ Verificar MySQL
   - ✅ Crear base de datos
   - ✅ Iniciar servidor

3. **Abre tu navegador:**
   - http://localhost:5000
   - Regístrate con tu usuario
   - ¡Comienza a hacer predicciones!

---

### Usos posteriores (Ya instalado):

1. **Inicia XAMPP MySQL** (si no está corriendo)

2. **Ejecuta:**
   ```bash
   start.bat
   ```

3. **Abre:** http://localhost:5000

---

## 📋 Requisitos

- ✅ Python 3.8 o superior
- ✅ XAMPP (para MySQL)
- ✅ Navegador web moderno

---

## 🎯 Características

### 🔐 Sistema de Autenticación
- Registro de usuarios
- Login con contraseñas encriptadas (bcrypt)
- Sesiones seguras con Flask-Login

### 📊 Predicciones BTTS
- Ingreso manual de estadísticas de equipos
- Cálculo con dos modelos estadísticos
- Comparativa y recomendación del mejor modelo
- Visualización con gráficos y barras de progreso

### 💾 Historial
- Guardar predicciones realizadas
- Dashboard personal con todas tus predicciones
- Visualización de resultados anteriores

### ⚡ Modo Velocidad x2
- Cálculos más rápidos
- Animaciones aceleradas

---

## 📁 Estructura del Proyecto

```
goal2goal/
│
├── app.py                      # Servidor Flask principal
├── models.py                   # Modelos de base de datos
├── requirements.txt            # Dependencias Python
├── .env                        # Configuración (no subir a Git)
│
├── iniciar.bat                 # 🚀 Instalador automático
├── start.bat                   # ▶️ Inicio rápido
├── init_db.py                  # Script manual de BD
│
├── templates/                  # Plantillas HTML
│   ├── index.html             # Página principal (predicciones)
│   ├── login.html             # Inicio de sesión
│   ├── register.html          # Registro de usuarios
│   └── dashboard.html         # Historial de predicciones
│
├── static/
│   ├── css/
│   │   └── styles.css         # Estilos (tema oscuro)
│   ├── js/
│   │   ├── script.js          # Lógica principal
│   │   └── save-prediction.js # Guardar predicciones
│   └── images/
│       └── goal2goal.jpeg     # Logo
│
└── database_setup.sql          # Schema SQL (referencia)
```

---

## ⚙️ Configuración Manual (Opcional)

Si prefieres configurar manualmente:

### 1. Crear entorno virtual:
```bash
python -m venv venv
venv\Scripts\activate
```

### 2. Instalar dependencias:
```bash
pip install -r requirements.txt
```

### 3. Configurar variables de entorno (.env):
```env
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASSWORD=
MYSQL_DATABASE=goal2goal_db
SECRET_KEY=tu_clave_secreta_aqui
OPENROUTER_API_KEY=tu_api_key_aqui
```

### 4. Inicializar base de datos:
```bash
python init_db.py
```

### 5. Iniciar servidor:
```bash
python app.py
```

---

## 🗄️ Base de Datos

### Tablas creadas automáticamente:

**users:**
- id, username, email, password_hash
- is_active, created_at, last_login

**predictions:**
- id, user_id (FK)
- team1_name, team2_name
- Estadísticas de ambos equipos
- Resultados: poisson_btts, logistic_btts, final_btts
- recommended_model, confidence_level
- created_at

---

## 🎮 Cómo Usar

### 1. Registro/Login
- Primera vez: Regístrate con usuario, email y contraseña
- Siguientes veces: Inicia sesión

### 2. Hacer una Predicción
1. Ingresa el nombre de ambos equipos
2. Completa las estadísticas de cada equipo:
   - Goles promedio anotados/recibidos
   - Posesión de balón
   - Tiros a puerta
   - Precisión de pases
3. Click en "Calcular Predicción"
4. Revisa los resultados de ambos modelos
5. Click en "Guardar Predicción"

### 3. Ver Historial
- Click en "📊 Mi Dashboard" en el header
- Visualiza todas tus predicciones anteriores

---

## 🐛 Solución de Problemas

### Error: "MySQL NO ESTÁ CORRIENDO"
**Solución:**
1. Abre XAMPP Control Panel
2. Click en "Start" en MySQL
3. Ejecuta `iniciar.bat` nuevamente

### Error: "ModuleNotFoundError"
**Solución:**
```bash
venv\Scripts\activate
pip install -r requirements.txt
```

### Error: "Can't connect to database"
**Solución:**
1. Verifica que XAMPP MySQL esté corriendo
2. Ejecuta: `python init_db.py`
3. Verifica el archivo `.env`

### La página no carga
**Solución:**
1. Verifica que el servidor esté corriendo
2. Abre http://localhost:5000 (no http://127.0.0.1:5000)
3. Revisa la consola por errores

---

## 🔒 Seguridad

- ✅ Contraseñas encriptadas con bcrypt
- ✅ Sesiones firmadas con SECRET_KEY
- ✅ SQLAlchemy ORM (protección SQL injection)
- ✅ Login requerido para acceder

---

## 📝 Notas Técnicas

### Modelos Estadísticos:

**Poisson Bivariado:**
```
P(BTTS) = [1 - P(Equipo1=0)] × [1 - P(Equipo2=0)]
P(X=0) = e^(-λ)
λ = (goles_anotados + goles_recibidos_rival) / 2
```

**Regresión Logística:**
```
P(BTTS) = 1 / (1 + e^(-z))
z = intercept + Σ(peso_i × característica_i)
```

Características normalizadas:
- Goles anotados/recibidos
- Posesión de balón
- Tiros a puerta
- Precisión de pases

### Pesos Calibrados:
- Intercept: -1.2
- Goles anotados: 0.28
- Goles recibidos: 0.22
- Tiros a puerta: 0.05
- Fuerza ofensiva: 0.12

---

## 👥 Créditos

Desarrollado por:
- Marco Martínez
- Cristian Jiménez
- Cristian Bayona
- Carlos Mayorga

---

## 📄 Licencia

Proyecto educativo - Uso libre

---

## 🆘 Soporte

¿Problemas? Revisa:
1. Los logs en la consola donde ejecutaste el servidor
2. El archivo `INSTRUCCIONES_MYSQL.md` para más detalles
3. La configuración del `.env`

---

**¡Disfruta prediciendo! ⚽🎯**
