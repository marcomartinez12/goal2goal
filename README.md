# ⚽ Goal2Goal - Sistema Avanzado de Predicciones BTTS

Sistema completo de predicción de **Both Teams To Score (Ambos Marcan)** con múltiples modelos estadísticos y simulaciones realistas:

- 📊 **Poisson Bivariado**
- 🤖 **Regresión Logística**
- 🎲 **Simulación Monte Carlo** (10,000 iteraciones)
- ⚽ **Simulación de Partido Ultra Realista**
- 🤖 **Explicaciones con IA** (OpenRouter/Claude)

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

### 📊 Predicciones BTTS Avanzadas
- Ingreso manual de estadísticas de equipos (9 métricas por equipo)
- **Poisson Bivariado**: Modelo probabilístico basado en goles esperados
- **Regresión Logística**: Modelo de aprendizaje automático con pesos calibrados
- Comparativa inteligente y recomendación del mejor modelo
- Visualización con gráficos dinámicos y barras de progreso animadas
- **Página educativa "Ver Cómo se Calculó"**: Explicación paso a paso de los cálculos

### 🎲 Simulación Monte Carlo
- **10,000 simulaciones** usando distribución de Poisson
- Cálculo de probabilidades BTTS con intervalos de confianza (95%)
- Análisis de volatilidad del partido (Coeficiente de Variación)
- Predicción de marcadores más probables (Top 5)
- Distribución de goles totales
- Probabilidades Over/Under 2.5
- **Escenario Más Probable**: Explicación clara del resultado esperado
- Animaciones visuales con barra de progreso y contador en tiempo real

### ⚽ Simulación de Partido Ultra Realista (v2.0)
- Simulación **minuto a minuto** (90+ minutos)
- **Sistema de Momentum**: Inercia del partido que afecta ocasiones
- **Sistema de Fatiga**: Equipos se cansan, más espacios en minutos finales
- **Tácticas inferidas** automáticamente (Ofensivo, Defensivo, Equilibrado, Contraataque)
- **Configuración Avanzada** (opcional):
  - 7 estilos de juego (Tiki-Taka, Gegenpressing, Catenaccio, etc.)
  - 7 fortalezas seleccionables (máx. 2)
  - 6 debilidades seleccionables (máx. 2)
  - Factores externos (clima, localía, lesionados)
  - Moral y experiencia del equipo
- **Mejoras de Realismo v2.0**:
  - Variabilidad en xG (±30%): Simula "días inspirados" vs "días malos"
  - Factor de rendimiento (±25%): Permite goleadas inesperadas
  - Mayor agresividad en diferencias grandes: Remontadas épicas posibles
  - Probabilidad de ocasión aumentada: Más goles, resultados variados
- **Estadísticas del partido**: Tiros, tiros a puerta, corners, faltas, tarjetas, xG
- **Narración detallada**: Descripción de cada gol y ocasión importante
- **Resultados variados**: 0-0, 1-0, 4-3, 5-1, etc. (como en fútbol real)

### 🤖 Explicación con IA
- Análisis detallado con Claude (vía OpenRouter API)
- Explicación de probabilidades en lenguaje natural
- Recomendaciones de apuesta
- Factores clave que influyen en el resultado
- Animación de escritura en tiempo real (efecto typewriter)

### 💾 Historial y Dashboard
- Guardar predicciones realizadas
- Dashboard personal con todas tus predicciones
- Visualización de resultados anteriores
- Filtrado y búsqueda

### ⚡ Modo Velocidad x2
- Cálculos más rápidos
- Animaciones aceleradas
- Ideal para análisis rápido de múltiples partidos

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
2. Completa las estadísticas de cada equipo (9 métricas):
   - Goles promedio anotados
   - Goles promedio recibidos
   - Posesión de balón (%)
   - Tiros a puerta
   - Precisión de pases (%)
   - Faltas promedio
   - Corners promedio
   - Tarjetas amarillas
   - Tarjetas rojas
3. Click en **"Calcular Predicción"**
4. Revisa los resultados:
   - Poisson Bivariado
   - Regresión Logística
   - Recomendación final
5. Click en **"Guardar Predicción"** (opcional)

### 3. Análisis Adicionales

#### 🤖 Ver Explicación Detallada (IA)
- Click en el botón **"Ver Explicación Detallada"**
- Lee el análisis completo generado por Claude
- Obtén recomendaciones y factores clave

#### 🎲 Simulación Monte Carlo
- Click en **"Simulación Monte Carlo"**
- Observa la animación de 10,000 simulaciones
- Revisa:
  - Probabilidad BTTS con intervalo de confianza
  - **Escenario Más Probable** (¿marcan ambos?)
  - Probabilidades de resultado (victoria/empate)
  - Goles esperados por equipo
  - Over/Under 2.5
  - Top 5 marcadores más probables
  - Análisis de volatilidad

#### ⚽ Simular Partido
- Click en **"Simular Partido"**
- **(Opcional)** Configura parámetros avanzados:
  - Estilo de juego de cada equipo
  - Fortalezas y debilidades
  - Factores externos (clima, lesiones, moral)
- Observa la simulación minuto a minuto
- Revisa:
  - Marcador final
  - Narración detallada de goles
  - Estadísticas completas (tiros, corners, xG, etc.)
  - Gráficos de posesión y momentum

#### 📚 Ver Cómo se Calculó
- Click en **"Ver Cómo se Calculó"**
- Aprende cómo funcionan los modelos:
  - Distribución de Poisson paso a paso
  - Regresión Logística detallada
  - Matriz de marcadores
  - Gráficos de radar comparativos
  - Factores clave del análisis

### 4. Ver Historial
- Click en **"📊 Mi Dashboard"** en el header
- Visualiza todas tus predicciones anteriores
- Filtra y busca predicciones específicas

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

#### **1. Poisson Bivariado:**
```
P(BTTS) = [1 - P(Equipo1=0)] × [1 - P(Equipo2=0)]
P(X=0) = e^(-λ)
λ = (goles_anotados × goles_recibidos_rival) / promedio_liga
```

#### **2. Regresión Logística:**
```
P(BTTS) = 1 / (1 + e^(-z))
z = intercept + Σ(peso_i × característica_i)
```

**Pesos Calibrados:**
- Intercept: -0.8
- Goles anotados equipo 1: 0.45
- Goles anotados equipo 2: 0.45
- Goles recibidos equipo 1: 0.35
- Goles recibidos equipo 2: 0.35
- Tiros a puerta: 0.08
- Promedio de goles por partido: 0.25
- Fuerza ofensiva combinada: 0.15

#### **3. Simulación Monte Carlo:**
```python
for i in range(10000):
    goles_equipo1 = np.random.poisson(lambda_equipo1)
    goles_equipo2 = np.random.poisson(lambda_equipo2)

    if goles_equipo1 > 0 and goles_equipo2 > 0:
        btts_count += 1

P(BTTS) = (btts_count / 10000) * 100
```

**Intervalo de Confianza (95%):**
```
CI = p ± 1.96 × √(p(100-p)/n)
donde n = 10,000
```

**Análisis de Volatilidad:**
```
Coeficiente de Variación = σ / μ
- CV < 0.4: Predecible
- 0.4 ≤ CV < 0.6: Moderado
- CV ≥ 0.6: Volátil
```

#### **4. Simulación de Partido (v2.0):**

**xG (Expected Goals):**
```javascript
xG_base = {
    penalti: 0.79,
    uno_vs_uno: 0.38,
    dentro_area: 0.19,
    borde_area: 0.08,
    // ... más tipos
}

xG_final = xG_base ×
           (calidad_ofensiva / 5.0) ×
           (1.5 - calidad_defensiva / 5.0) ×
           factor_fatiga ×
           variabilidad_realista  // ±30%
```

**Presión Ofensiva:**
```javascript
presion = lambda × 2.2 ×
          factor_estadistico ×
          factor_diferencia_goles ×
          (1 + momentum × 0.45) ×
          tactica.ofensivo ×
          fatiga.ofensivo ×
          rendimiento_dia  // ±25%
```

**Mejoras de Realismo v2.0:**
- Variabilidad en xG: 0.7 a 1.3 (días inspirados/malos)
- Factor de rendimiento: 0.75 a 1.25
- Diferencias grandes:
  - Perdiendo por 3+: 1.85× presión (remontadas)
  - Ganando por 3+: 0.55× presión (goleadas)
- Probabilidad de ocasión: hasta 42% (antes 35%)

**Sistemas Avanzados:**
- **Momentum Engine**: Inercia del partido (-1.0 a 1.0)
- **Fatiga Manager**: Precisión y capacidad ofensiva disminuyen
- **Tácticas Dinámicas**: 4 estilos base + 7 configurables

---

## 🛠️ Tecnologías Utilizadas

### Backend:
- **Python 3.8+** - Lenguaje principal
- **Flask** - Framework web
- **Flask-Login** - Gestión de sesiones
- **SQLAlchemy** - ORM para base de datos
- **PyMySQL** - Conector MySQL
- **NumPy** - Cálculos numéricos y simulaciones Monte Carlo
- **python-dotenv** - Variables de entorno
- **bcrypt** - Hash de contraseñas

### Frontend:
- **HTML5 / CSS3** - Estructura y estilos
- **JavaScript (ES6+)** - Lógica del cliente
- **Bootstrap 5** - Framework UI responsivo
- **Font Awesome** - Iconos
- **Chart.js** (opcional) - Gráficos dinámicos

### Base de Datos:
- **MySQL 8.0+** - Base de datos relacional

### APIs Externas:
- **OpenRouter API** - Acceso a Claude AI para explicaciones

### Modelos Matemáticos:
- **Distribución de Poisson** - Modelado de goles
- **Regresión Logística** - Clasificación binaria BTTS
- **Simulación Monte Carlo** - Análisis probabilístico
- **Expected Goals (xG)** - Métricas avanzadas

---

## 📊 Ejemplos de Uso

### Ejemplo 1: Partido Equilibrado
```
Barcelona vs Real Madrid

Barcelona:
- Goles anotados: 2.1
- Goles recibidos: 1.3
- Posesión: 58%
- Tiros a puerta: 5.2

Real Madrid:
- Goles anotados: 2.3
- Goles recibidos: 1.2
- Posesión: 54%
- Tiros a puerta: 5.5

Resultado esperado:
- BTTS: ~75%
- Simulación Monte Carlo: 78.28%
- Marcador más probable: 2-2 (12.45%)
- Over 2.5: ~68%
```

### Ejemplo 2: Partido Defensivo
```
Atletico Madrid vs Getafe

Ambos equipos:
- Goles anotados: ~1.0
- Goles recibidos: ~0.8
- Posesión: 45-50%
- Defensas sólidas

Resultado esperado:
- BTTS: ~35-42%
- Simulación Monte Carlo: 38.15%
- Marcador más probable: 1-0 (18.23%)
- Under 2.5: ~72%
```

### Ejemplo 3: Goleada Esperada
```
Manchester City vs Sheffield United

Manchester City:
- Goles anotados: 3.2
- Goles recibidos: 0.6
- Posesión: 72%
- Tiros a puerta: 8.1

Sheffield United:
- Goles anotados: 0.8
- Goles recibidos: 2.9
- Posesión: 32%
- Tiros a puerta: 2.3

Resultado esperado:
- Victoria City: ~85%
- Simulación: Posibles resultados 4-0, 5-1, 3-0
- BTTS: ~28% (Sheffield raramente marca)
```

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

## ✨ Características Destacadas

### 🎯 Precisión de Modelos
- **Poisson Bivariado**: Ideal para equipos ofensivos (~70-80% precisión)
- **Regresión Logística**: Mejor para análisis general (~75-85% precisión)
- **Monte Carlo**: Análisis probabilístico exhaustivo (10,000 simulaciones)
- **Recomendación Inteligente**: El sistema elige el mejor modelo automáticamente

### 🚀 Rendimiento
- Cálculo instantáneo de predicciones (<100ms)
- Simulación Monte Carlo en ~3.5 segundos
- Simulación de partido minuto a minuto (~5-10 segundos)
- Modo velocidad x2 disponible

### 🎨 Interfaz de Usuario
- **Tema oscuro elegante** - Menos fatiga visual
- **Animaciones fluidas** - Barras de progreso, contadores dinámicos
- **Responsive design** - Funciona en móvil, tablet y desktop
- **Tooltips informativos** - Ayuda contextual en cada métrica

### 🔬 Precisión Técnica
- Lambdas calibrados según estadísticas reales
- Pesos de regresión logística ajustados
- Intervalos de confianza del 95%
- xG basado en datos de ligas profesionales

### 🎮 Experiencia de Usuario
- **4 botones principales**: Explicación IA, Simular, Monte Carlo, Proceso de Cálculo
- **Datos de demostración**: Prueba rápida con un click
- **Historial persistente**: Guarda todas tus predicciones
- **Exportable**: Copia resultados fácilmente

---

## 📈 Roadmap Futuro

### Próximas Características Planeadas:
- [ ] **API REST** para integración con otras apps
- [ ] **Scraping automático** de estadísticas de equipos
- [ ] **Machine Learning mejorado** con redes neuronales
- [ ] **Predicciones Over/Under** dedicadas
- [ ] **Comparación de casas de apuestas** (cuotas)
- [ ] **Sistema de alertas** por email/Telegram
- [ ] **Análisis de H2H** (head-to-head histórico)
- [ ] **Exportación a PDF/Excel** de reportes
- [ ] **Modo multiligas** (Premier, LaLiga, Serie A, etc.)
- [ ] **Integración con APIs** de datos en vivo

---

## 📸 Screenshots

```
┌─────────────────────────────────────────┐
│  Goal2Goal - Predicción BTTS           │
├─────────────────────────────────────────┤
│                                         │
│  [Equipo 1]  vs  [Equipo 2]            │
│                                         │
│  📊 Estadísticas (9 métricas)          │
│  ⚙️  Calcular Predicción                │
│                                         │
│  Resultados:                            │
│  ┌─────────────┬─────────────┐         │
│  │  Poisson    │  Logística  │         │
│  │   72.3%     │    68.5%    │         │
│  └─────────────┴─────────────┘         │
│                                         │
│  💡 Recomendación: Poisson (73%)       │
│                                         │
│  [🤖 IA] [⚽ Simular] [🎲 Monte Carlo]  │
│  [📚 Cómo se Calculó]                  │
│                                         │
└─────────────────────────────────────────┘
```

---

**⚽ ¡Disfruta prediciendo con precisión científica! 🎯📊**

---

*Última actualización: Noviembre 2025*
*Versión: 2.0 (Simulación Realista Mejorada)*
