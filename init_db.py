"""
Script para inicializar la base de datos de Goal2Goal
Ejecutar después de iniciar XAMPP MySQL
"""
import pymysql
from getpass import getpass
import sys

def create_database():
    """Crear base de datos goal2goal_db"""
    print("=== Inicialización de Base de Datos Goal2Goal ===\n")

    # Solicitar credenciales
    host = input("Host MySQL (default: localhost): ").strip() or "localhost"
    port = int(input("Puerto MySQL (default: 3306): ").strip() or "3306")
    user = input("Usuario MySQL (default: root): ").strip() or "root"
    password = getpass("Contraseña MySQL (dejar vacío si no tiene): ")

    try:
        # Conectar a MySQL sin especificar base de datos
        print("\n[1/4] Conectando a MySQL...")
        connection = pymysql.connect(
            host=host,
            port=port,
            user=user,
            password=password,
            charset='utf8mb4'
        )

        cursor = connection.cursor()

        # Crear base de datos
        print("[2/4] Creando base de datos 'goal2goal_db'...")
        cursor.execute("CREATE DATABASE IF NOT EXISTS goal2goal_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci")
        cursor.execute("USE goal2goal_db")

        # Crear tabla users
        print("[3/4] Creando tabla 'users'...")
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id INT PRIMARY KEY AUTO_INCREMENT,
                username VARCHAR(80) NOT NULL UNIQUE,
                email VARCHAR(120) NOT NULL UNIQUE,
                password_hash VARCHAR(255) NOT NULL,
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                last_login TIMESTAMP NULL,
                INDEX idx_username (username),
                INDEX idx_email (email)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        """)

        # Crear tabla predictions
        print("[4/4] Creando tabla 'predictions'...")
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS predictions (
                id INT PRIMARY KEY AUTO_INCREMENT,
                user_id INT NOT NULL,
                team1_name VARCHAR(100) NOT NULL,
                team2_name VARCHAR(100) NOT NULL,
                team1_goals_scored DECIMAL(5,2),
                team1_goals_conceded DECIMAL(5,2),
                team1_possession DECIMAL(5,2),
                team1_shots_on_target DECIMAL(5,2),
                team1_passing_accuracy DECIMAL(5,2),
                team2_goals_scored DECIMAL(5,2),
                team2_goals_conceded DECIMAL(5,2),
                team2_possession DECIMAL(5,2),
                team2_shots_on_target DECIMAL(5,2),
                team2_passing_accuracy DECIMAL(5,2),
                poisson_btts DECIMAL(5,2),
                logistic_btts DECIMAL(5,2),
                final_btts DECIMAL(5,2),
                recommended_model VARCHAR(50),
                confidence_level VARCHAR(20),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                INDEX idx_user_id (user_id),
                INDEX idx_created_at (created_at)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        """)

        connection.commit()

        print("\n✅ Base de datos inicializada correctamente!")
        print(f"\n📊 Base de datos: goal2goal_db")
        print(f"📝 Tablas creadas: users, predictions")
        print(f"\n🔧 Actualiza tu archivo .env con:")
        print(f"   MYSQL_HOST={host}")
        print(f"   MYSQL_PORT={port}")
        print(f"   MYSQL_USER={user}")
        print(f"   MYSQL_PASSWORD={password}")
        print(f"   MYSQL_DATABASE=goal2goal_db")

        cursor.close()
        connection.close()

        return True

    except pymysql.Error as e:
        print(f"\n❌ Error al conectar/crear base de datos:")
        print(f"   {e}")
        return False
    except Exception as e:
        print(f"\n❌ Error inesperado:")
        print(f"   {e}")
        return False

if __name__ == "__main__":
    print("Asegúrate de haber iniciado XAMPP MySQL antes de continuar.\n")
    confirm = input("¿Continuar? (s/n): ").strip().lower()

    if confirm == 's':
        success = create_database()
        sys.exit(0 if success else 1)
    else:
        print("Operación cancelada.")
        sys.exit(0)
