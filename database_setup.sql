-- ============================================
-- GOAL2GOAL - Configuración de Base de Datos MySQL
-- ============================================

-- Crear base de datos
CREATE DATABASE IF NOT EXISTS goal2goal_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Usar la base de datos
USE goal2goal_db;

-- Tabla de usuarios
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(80) UNIQUE NOT NULL,
    email VARCHAR(120) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP NULL,
    is_active BOOLEAN DEFAULT TRUE,
    INDEX idx_username (username),
    INDEX idx_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de predicciones
CREATE TABLE IF NOT EXISTS predictions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    team1_name VARCHAR(100) NOT NULL,
    team2_name VARCHAR(100) NOT NULL,

    -- Estadísticas Equipo 1
    team1_goals_scored DECIMAL(5,2),
    team1_goals_conceded DECIMAL(5,2),
    team1_possession DECIMAL(5,2),
    team1_shots_on_target DECIMAL(5,2),
    team1_passing_accuracy DECIMAL(5,2),

    -- Estadísticas Equipo 2
    team2_goals_scored DECIMAL(5,2),
    team2_goals_conceded DECIMAL(5,2),
    team2_possession DECIMAL(5,2),
    team2_shots_on_target DECIMAL(5,2),
    team2_passing_accuracy DECIMAL(5,2),

    -- Resultados
    poisson_btts DECIMAL(5,2),
    logistic_btts DECIMAL(5,2),
    final_btts DECIMAL(5,2),
    recommended_model VARCHAR(50),
    confidence_level VARCHAR(20),

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insertar usuario de prueba (password: admin123)
-- Hash bcrypt de 'admin123'
INSERT INTO users (username, email, password_hash) VALUES
('admin', 'admin@goal2goal.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYzpLhvKKei')
ON DUPLICATE KEY UPDATE username=username;

-- Mostrar tablas creadas
SHOW TABLES;

SELECT 'Base de datos goal2goal_db creada exitosamente!' as message;