"""
Modelos de Base de Datos para Goal2Goal
Sistema de usuarios y predicciones BTTS
"""

from flask_sqlalchemy import SQLAlchemy
from flask_login import UserMixin
from datetime import datetime

db = SQLAlchemy()

class User(UserMixin, db.Model):
    """Modelo de Usuario"""
    __tablename__ = 'users'

    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False, index=True)
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    last_login = db.Column(db.DateTime, nullable=True)
    is_active = db.Column(db.Boolean, default=True)

    # Relación con predicciones
    predictions = db.relationship('Prediction', backref='user', lazy=True, cascade='all, delete-orphan')

    def __repr__(self):
        return f'<User {self.username}>'

    def get_prediction_count(self):
        """Obtener número total de predicciones del usuario"""
        return len(self.predictions)


class Prediction(db.Model):
    """Modelo de Predicción BTTS"""
    __tablename__ = 'predictions'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, index=True)

    # Nombres de equipos
    team1_name = db.Column(db.String(100), nullable=False)
    team2_name = db.Column(db.String(100), nullable=False)

    # Estadísticas Equipo 1
    team1_goals_scored = db.Column(db.Numeric(5, 2))
    team1_goals_conceded = db.Column(db.Numeric(5, 2))
    team1_possession = db.Column(db.Numeric(5, 2))
    team1_shots_on_target = db.Column(db.Numeric(5, 2))
    team1_passing_accuracy = db.Column(db.Numeric(5, 2))

    # Estadísticas Equipo 2
    team2_goals_scored = db.Column(db.Numeric(5, 2))
    team2_goals_conceded = db.Column(db.Numeric(5, 2))
    team2_possession = db.Column(db.Numeric(5, 2))
    team2_shots_on_target = db.Column(db.Numeric(5, 2))
    team2_passing_accuracy = db.Column(db.Numeric(5, 2))

    # Resultados
    poisson_btts = db.Column(db.Numeric(5, 2))
    logistic_btts = db.Column(db.Numeric(5, 2))
    final_btts = db.Column(db.Numeric(5, 2))
    recommended_model = db.Column(db.String(50))
    confidence_level = db.Column(db.String(20))

    created_at = db.Column(db.DateTime, default=datetime.utcnow, index=True)

    def __repr__(self):
        return f'<Prediction {self.team1_name} vs {self.team2_name}>'

    def to_dict(self):
        """Convertir predicción a diccionario"""
        return {
            'id': self.id,
            'team1_name': self.team1_name,
            'team2_name': self.team2_name,
            'poisson_btts': float(self.poisson_btts) if self.poisson_btts else None,
            'logistic_btts': float(self.logistic_btts) if self.logistic_btts else None,
            'final_btts': float(self.final_btts) if self.final_btts else None,
            'recommended_model': self.recommended_model,
            'confidence_level': self.confidence_level,
            'created_at': self.created_at.strftime('%Y-%m-%d %H:%M:%S')
        }


class TeamStatsCache(db.Model):
    """Caché de estadísticas de equipos con actualización automática"""
    __tablename__ = 'team_stats_cache'

    id = db.Column(db.Integer, primary_key=True)
    team_name = db.Column(db.String(100), unique=True, nullable=False, index=True)
    team_name_normalized = db.Column(db.String(100), index=True)  # lowercase para búsqueda

    # Estadísticas
    goals_scored = db.Column(db.Numeric(5, 2))
    goals_conceded = db.Column(db.Numeric(5, 2))
    possession = db.Column(db.Numeric(5, 2))
    shots_on_target = db.Column(db.Numeric(5, 2))
    passing_accuracy = db.Column(db.Numeric(5, 2))
    fouls = db.Column(db.Numeric(5, 2))
    corners = db.Column(db.Numeric(5, 2))
    yellow_cards = db.Column(db.Numeric(5, 2))
    red_cards = db.Column(db.Numeric(5, 2))

    # Metadata
    source = db.Column(db.String(50))  # 'FBref', 'SofaScore', 'Estimated'
    last_updated = db.Column(db.DateTime, default=datetime.utcnow, index=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def __repr__(self):
        return f'<TeamStatsCache {self.team_name}>'

    def is_expired(self, days=7):
        """Verifica si el caché ha expirado (por defecto 7 días)"""
        if not self.last_updated:
            return True
        from datetime import timedelta
        return datetime.utcnow() - self.last_updated > timedelta(days=days)

    def to_dict(self):
        """Convertir a diccionario"""
        return {
            'name': self.team_name,
            'goalsScored': float(self.goals_scored) if self.goals_scored else 0,
            'goalsConceded': float(self.goals_conceded) if self.goals_conceded else 0,
            'possession': float(self.possession) if self.possession else 0,
            'shotsOnTarget': float(self.shots_on_target) if self.shots_on_target else 0,
            'passingAccuracy': float(self.passing_accuracy) if self.passing_accuracy else 0,
            'fouls': float(self.fouls) if self.fouls else 0,
            'corners': float(self.corners) if self.corners else 0,
            'yellowCards': float(self.yellow_cards) if self.yellow_cards else 0,
            'redCards': float(self.red_cards) if self.red_cards else 0
        }