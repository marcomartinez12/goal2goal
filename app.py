from flask import Flask, render_template, request, jsonify, redirect, url_for, flash, session
from flask_login import LoginManager, login_user, logout_user, login_required, current_user
from flask_bcrypt import Bcrypt
from dotenv import load_dotenv
import requests
import os
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import io
import base64
import numpy as np
import time
import logging
import json
from models import db, User, Prediction
from decimal import Decimal

# Configuración de logging
logging.basicConfig(level=logging.INFO,
                    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')

# Carga variables de entorno desde .env
load_dotenv()

app = Flask(__name__)

# Configuración de la aplicación
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'dev_secret_key_change_in_production')

# Configuración de MySQL
app.config['SQLALCHEMY_DATABASE_URI'] = (
    f"mysql+pymysql://{os.getenv('MYSQL_USER', 'root')}:"
    f"{os.getenv('MYSQL_PASSWORD', '')}@"
    f"{os.getenv('MYSQL_HOST', 'localhost')}:"
    f"{os.getenv('MYSQL_PORT', '3306')}/"
    f"{os.getenv('MYSQL_DATABASE', 'goal2goal_db')}"
)
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SQLALCHEMY_ECHO'] = False

# Inicializar extensiones
db.init_app(app)
bcrypt = Bcrypt(app)
login_manager = LoginManager(app)
login_manager.login_view = 'login'
login_manager.login_message = 'Por favor inicia sesión para acceder a Goal2Goal.'
login_manager.login_message_category = 'info'

# API Key de OpenRouter
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
if not OPENROUTER_API_KEY:
    raise RuntimeError(
        "📣 La variable OPENROUTER_API_KEY no está definida.\n"
        "   ➜ Crea un archivo .env en la raíz con:\n"
        "     OPENROUTER_API_KEY=tu_api_key_aqui"
    )

OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions"

# User loader para Flask-Login
@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))


@app.route('/')
@login_required
def index():
    return render_template('index.html')


@app.route('/register', methods=['GET', 'POST'])
def register():
    """Registro de nuevos usuarios"""
    if current_user.is_authenticated:
        return redirect(url_for('index'))

    if request.method == 'POST':
        data = request.json if request.is_json else request.form

        username = data.get('username', '').strip()
        email = data.get('email', '').strip()
        password = data.get('password', '')

        # Validaciones básicas
        if not username or not email or not password:
            return jsonify({'error': 'Todos los campos son requeridos'}), 400

        if len(password) < 6:
            return jsonify({'error': 'La contraseña debe tener al menos 6 caracteres'}), 400

        # Verificar si el usuario ya existe
        if User.query.filter_by(username=username).first():
            return jsonify({'error': 'El nombre de usuario ya está en uso'}), 400

        if User.query.filter_by(email=email).first():
            return jsonify({'error': 'El email ya está registrado'}), 400

        # Crear nuevo usuario
        try:
            password_hash = bcrypt.generate_password_hash(password).decode('utf-8')
            new_user = User(
                username=username,
                email=email,
                password_hash=password_hash
            )
            db.session.add(new_user)
            db.session.commit()

            app.logger.info(f"Nuevo usuario registrado: {username}")
            return jsonify({'success': True, 'message': 'Usuario registrado exitosamente'}), 201

        except Exception as e:
            db.session.rollback()
            app.logger.error(f"Error al registrar usuario: {e}")
            return jsonify({'error': 'Error al registrar el usuario'}), 500

    return render_template('register.html')


@app.route('/login', methods=['GET', 'POST'])
def login():
    """Inicio de sesión"""
    if current_user.is_authenticated:
        return redirect(url_for('index'))

    if request.method == 'POST':
        data = request.json if request.is_json else request.form

        username = data.get('username', '').strip()
        password = data.get('password', '')

        if not username or not password:
            return jsonify({'error': 'Usuario y contraseña son requeridos'}), 400

        # Buscar usuario
        user = User.query.filter_by(username=username).first()

        if user and bcrypt.check_password_hash(user.password_hash, password):
            if not user.is_active:
                return jsonify({'error': 'Usuario desactivado'}), 403

            login_user(user)
            user.last_login = db.func.now()
            db.session.commit()

            app.logger.info(f"Usuario {username} inició sesión")
            return jsonify({
                'success': True,
                'message': 'Sesión iniciada correctamente',
                'username': user.username
            }), 200

        return jsonify({'error': 'Usuario o contraseña incorrectos'}), 401

    return render_template('login.html')


@app.route('/logout')
@login_required
def logout():
    """Cerrar sesión"""
    username = current_user.username
    logout_user()
    app.logger.info(f"Usuario {username} cerró sesión")
    return redirect(url_for('login'))


@app.route('/dashboard')
@login_required
def dashboard():
    """Dashboard del usuario con historial de predicciones"""
    predictions = Prediction.query.filter_by(user_id=current_user.id)\
        .order_by(Prediction.created_at.desc())\
        .limit(20)\
        .all()

    return render_template('dashboard.html',
                         username=current_user.username,
                         predictions=predictions)


@app.route('/get_explanation', methods=['POST'])
def get_explanation():
    """
    Obtiene la explicación detallada de la predicción utilizando OpenRouter
    """
    start_time = time.time()
    try:
        data = request.json
        if not data:
            app.logger.error("No se proporcionaron datos en la solicitud")
            return jsonify({"error": "No se proporcionaron datos"}), 400

        # Validación de campos requeridos para BTTS
        required_fields = ['team1', 'team2', 'btts', 'predictionType']
        for field in required_fields:
            if field not in data:
                app.logger.error(f"Falta el campo requerido: {field}")
                return jsonify({"error": f"Falta el campo requerido: {field}"}), 400

        team1 = data['team1']
        team2 = data['team2']
        btts = data['btts']

        # Obtener probabilidades de ambos modelos
        poisson_prob = btts.get('poisson', 0)
        logistic_prob = btts.get('logistic', 0)
        final_prob = btts.get('final', 0)
        recommended_model = btts.get('recommendedModel', 'Poisson Bivariado')
        confidence = btts.get('confidence', 'Media')
        diff_models = btts.get('diffModels', 0)

        # Construir prompt para la API enfocado en BTTS
        prompt = f"""
Actúa como un analista deportivo experto especializado en predicciones de BTTS (Both Teams To Score - Ambos Marcan).

PARTIDO: {team1['name']} vs {team2['name']}

ANÁLISIS ESTADÍSTICO:

Equipo Local - {team1['name']}:
- Goles promedio anotados: {team1['stats']['goalsScored']}
- Goles promedio recibidos: {team1['stats']['goalsConceded']}
- Posesión de balón: {team1['stats']['possession']}%
- Tiros a puerta por partido: {team1['stats']['shotsOnTarget']}
- Precisión de pases: {team1['stats']['passingAccuracy']}%
- Lambda (tasa goles esperados): {team1['lambda']}
- Probabilidad de marcar ≥1 gol: {team1['probScores']}%

Equipo Visitante - {team2['name']}:
- Goles promedio anotados: {team2['stats']['goalsScored']}
- Goles promedio recibidos: {team2['stats']['goalsConceded']}
- Posesión de balón: {team2['stats']['possession']}%
- Tiros a puerta por partido: {team2['stats']['shotsOnTarget']}
- Precisión de pases: {team2['stats']['passingAccuracy']}%
- Lambda (tasa goles esperados): {team2['lambda']}
- Probabilidad de marcar ≥1 gol: {team2['probScores']}%

RESULTADOS DE LOS MODELOS PREDICTIVOS:
- Modelo de Poisson Bivariado: {poisson_prob}% de probabilidad de BTTS
- Modelo de Regresión Logística: {logistic_prob}% de probabilidad de BTTS
- Diferencia entre modelos: {diff_models}%

PREDICCIÓN FINAL:
- Probabilidad de que AMBOS EQUIPOS MARQUEN: {final_prob}%
- Modelo recomendado: {recommended_model}
- Nivel de confianza: {confidence}

Por favor, proporciona una explicación detallada que incluya:

1. **Análisis Ofensivo**: Evalúa la capacidad goleadora de ambos equipos basándote en sus estadísticas ofensivas (goles anotados, tiros a puerta, precisión de pases).

2. **Análisis Defensivo**: Analiza las vulnerabilidades defensivas de cada equipo (goles recibidos). ¿Son defensas porosas que facilitan que el rival anote?

3. **Por qué los modelos predicen esto**: Explica cómo el modelo de Poisson Bivariado y la Regresión Logística llegan a estas conclusiones.

4. **Factores clave**: ¿Qué estadísticas específicas son más determinantes para predecir BTTS en este partido?

5. **Recomendación final**: Basándote en el análisis, ¿qué tan probable es realmente que ambos equipos marquen? ¿Hay concordancia entre los modelos?

Usa un tono profesional pero amigable, como si estuvieras explicando en un programa deportivo. Sé conciso pero informativo.
"""

        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {OPENROUTER_API_KEY}"
        }

        # Lista de modelos a probar, en orden de preferencia
        fallback_models = [
        "meta-llama/llama-4-maverick:free",
        "mistralai/mistral-small-24b-instruct-2501:free",
        "moonshotai/kimi-vl-a3b-thinking:free",
        
        ]

        
        # Intentar con cada modelo hasta que uno funcione
        explanation = None
        for model in fallback_models:
            try:
                payload = {
                    "model": model,
                    "messages": [
                        {"role": "system", "content": "Eres un analista deportivo experto especializado en predicciones BTTS (Both Teams To Score - Ambos Marcan). Proporcionas explicaciones detalladas basadas en modelos estadísticos como Poisson Bivariado y Regresión Logística."},
                        {"role": "user", "content": prompt}
                    ],
                    "temperature": 0.7,
                    "max_tokens": 1200
                }

                app.logger.info(f"Enviando solicitud a OpenRouter con modelo {model}")
                response = requests.post(
                    OPENROUTER_API_URL,
                    headers=headers,
                    json=payload,
                    timeout=None
                )

                if response.status_code == 200:
                    result = response.json()
                    if 'choices' in result and result['choices']:
                        explanation = result['choices'][0]['message']['content']
                        app.logger.info(f"Respuesta exitosa del modelo {model}")
                        break
                    else:
                        app.logger.warning(f"Respuesta vacía del modelo {model}: {result}")
                else:
                    app.logger.warning(f"Error con el modelo {model}: {response.status_code} - {response.text}")
            
            except Exception as e:
                app.logger.warning(f"Error al usar el modelo {model}: {e}")
                continue

        if not explanation:
            return jsonify({"error": "No se pudo obtener una respuesta de ningún modelo disponible"}), 500

        elapsed_time = time.time() - start_time
        app.logger.info(f"Análisis completado en {elapsed_time:.2f}s")

        return jsonify({"explanation": explanation})

    except requests.exceptions.Timeout:
        app.logger.error("Timeout en la solicitud a OpenRouter")
        return jsonify({"error": "Timeout en la solicitud a OpenRouter. Intenta nuevamente."}), 504

    except requests.exceptions.ConnectionError:
        app.logger.error("Error de conexión con OpenRouter")
        return jsonify({"error": "No se pudo conectar a OpenRouter."}), 503

    except Exception as e:
        app.logger.error(f"Error inesperado: {e}", exc_info=True)
        return jsonify({"error": str(e)}), 500


@app.route('/generate_chart', methods=['POST'])
def generate_chart():
    try:
        data = request.json
        team1 = data['team1']
        team2 = data['team2']

        # Crear figura con tema oscuro para coincidir con la UI
        plt.style.use('dark_background')
        fig, ax = plt.subplots(figsize=(10, 6))
        
        # Lista expandida de estadísticas para mostrar
        stats = ['goalsScored', 'goalsConceded', 'possession', 'shotsOnTarget', 'passingAccuracy']
        labels = ['Goles anotados', 'Goles recibidos', 'Posesión', 'Tiros a puerta', 'Precisión pases']

        x = np.arange(len(labels))
        width = 0.35

        values1 = [team1['stats'][stat] for stat in stats]
        values2 = [team2['stats'][stat] for stat in stats]

        # Colores que coinciden con el frontend
        bars1 = ax.bar(x - width/2, values1, width, label=team1['name'], color='#36a2eb', alpha=0.8)
        bars2 = ax.bar(x + width/2, values2, width, label=team2['name'], color='#ff6384', alpha=0.8)

        # Añadir valores encima de las barras
        def add_values_above_bars(bars):
            for bar in bars:
                height = bar.get_height()
                ax.text(bar.get_x() + bar.get_width()/2., height + 0.1,
                        f'{height:.1f}', ha='center', va='bottom', color='white', fontsize=9)

        add_values_above_bars(bars1)
        add_values_above_bars(bars2)

        ax.set_title('Comparación de Estadísticas', color='white', fontsize=14)
        ax.set_xticks(x)
        ax.set_xticklabels(labels, color='white')
        ax.legend(framealpha=0.8)
        
        # Mejoras visuales
        plt.grid(axis='y', linestyle='--', alpha=0.3)
        ax.spines['top'].set_visible(False)
        ax.spines['right'].set_visible(False)
        ax.spines['bottom'].set_color('#ffffff')
        ax.spines['left'].set_color('#ffffff')
        
        # Fondo transparente para mejor integración con el tema oscuro de la web
        fig.patch.set_alpha(0.0)
        ax.patch.set_alpha(0.1)

        buf = io.BytesIO()
        fig.tight_layout()
        plt.savefig(buf, format='png', dpi=100, transparent=True)
        buf.seek(0)
        img_data = base64.b64encode(buf.getvalue()).decode('utf-8')
        plt.close(fig)

        return jsonify({"chart": f"data:image/png;base64,{img_data}"})

    except Exception as e:
        app.logger.error(f"Error al generar gráfico: {e}", exc_info=True)
        return jsonify({"error": str(e)}), 500


@app.route('/save_prediction', methods=['POST'])
@login_required
def save_prediction():
    """
    Guarda los resultados de la predicción en la base de datos
    """
    try:
        data = request.json
        if not data:
            return jsonify({"error": "No se proporcionaron datos"}), 400

        team1 = data.get('team1', {})
        team2 = data.get('team2', {})
        btts = data.get('btts', {})

        # Crear nueva predicción
        new_prediction = Prediction(
            user_id=current_user.id,
            team1_name=team1.get('name', 'Equipo 1'),
            team2_name=team2.get('name', 'Equipo 2'),
            # Estadísticas Equipo 1
            team1_goals_scored=Decimal(str(team1.get('stats', {}).get('goalsScored', 0))),
            team1_goals_conceded=Decimal(str(team1.get('stats', {}).get('goalsConceded', 0))),
            team1_possession=Decimal(str(team1.get('stats', {}).get('possession', 0))),
            team1_shots_on_target=Decimal(str(team1.get('stats', {}).get('shotsOnTarget', 0))),
            team1_passing_accuracy=Decimal(str(team1.get('stats', {}).get('passingAccuracy', 0))),
            # Estadísticas Equipo 2
            team2_goals_scored=Decimal(str(team2.get('stats', {}).get('goalsScored', 0))),
            team2_goals_conceded=Decimal(str(team2.get('stats', {}).get('goalsConceded', 0))),
            team2_possession=Decimal(str(team2.get('stats', {}).get('possession', 0))),
            team2_shots_on_target=Decimal(str(team2.get('stats', {}).get('shotsOnTarget', 0))),
            team2_passing_accuracy=Decimal(str(team2.get('stats', {}).get('passingAccuracy', 0))),
            # Resultados
            poisson_btts=Decimal(str(btts.get('poisson', 0))),
            logistic_btts=Decimal(str(btts.get('logistic', 0))),
            final_btts=Decimal(str(btts.get('final', 0))),
            recommended_model=btts.get('recommendedModel', 'Poisson Bivariado'),
            confidence_level=btts.get('confidence', 'Media')
        )

        db.session.add(new_prediction)
        db.session.commit()

        app.logger.info(f"Predicción guardada para usuario {current_user.username}: {team1.get('name')} vs {team2.get('name')}")

        return jsonify({
            "success": True,
            "message": "Predicción guardada correctamente",
            "prediction_id": new_prediction.id
        })

    except Exception as e:
        db.session.rollback()
        app.logger.error(f"Error al guardar predicción: {e}", exc_info=True)
        return jsonify({"error": str(e)}), 500


@app.route('/get_historical', methods=['GET'])
@login_required
def get_historical():
    """
    Obtiene las predicciones históricas del usuario desde la base de datos
    """
    try:
        predictions = Prediction.query.filter_by(user_id=current_user.id)\
            .order_by(Prediction.created_at.desc())\
            .limit(10)\
            .all()

        predictions_list = []
        for pred in predictions:
            predictions_list.append({
                "id": pred.id,
                "team1": pred.team1_name,
                "team2": pred.team2_name,
                "poisson_btts": float(pred.poisson_btts) if pred.poisson_btts else 0,
                "logistic_btts": float(pred.logistic_btts) if pred.logistic_btts else 0,
                "final_btts": float(pred.final_btts) if pred.final_btts else 0,
                "recommended_model": pred.recommended_model,
                "confidence_level": pred.confidence_level,
                "created_at": pred.created_at.strftime('%Y-%m-%d %H:%M:%S')
            })

        return jsonify({"predictions": predictions_list})

    except Exception as e:
        app.logger.error(f"Error al obtener predicciones históricas: {e}", exc_info=True)
        return jsonify({"error": str(e)}), 500


@app.errorhandler(404)
def page_not_found(e):
    return jsonify({"error": "Ruta no encontrada"}), 404


@app.errorhandler(500)
def internal_server_error(e):
    return jsonify({"error": "Error interno del servidor"}), 500


if __name__ == '__main__':
    # Crear tablas en la base de datos si no existen
    with app.app_context():
        try:
            db.create_all()
            app.logger.info("Tablas de base de datos verificadas/creadas")
        except Exception as e:
            app.logger.error(f"Error al crear tablas: {e}")

    port = int(os.environ.get("PORT", 5000))
    app.logger.info(f"Iniciando servidor en puerto {port}")
    app.run(host='0.0.0.0', port=port, debug=True)