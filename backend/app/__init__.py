from flask import Flask
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from mongoengine import connect
from dotenv import load_dotenv
import os

# Load environment variables
load_dotenv()

def create_app():
    app = Flask(__name__)
    
    # Configuration from environment variables only
    app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY')
    app.config['MONGODB_SETTINGS'] = {
        'host': os.getenv('MONGODB_URI')
    }
    
    # Validate required environment variables
    if not app.config['JWT_SECRET_KEY']:
        raise ValueError("JWT_SECRET_KEY environment variable is required")
    if not os.getenv('MONGODB_URI'):
        raise ValueError("MONGODB_URI environment variable is required")
    
    # Initialize CORS from environment variable
    cors_origins = os.getenv('CORS_ORIGINS')
    if not cors_origins:
        raise ValueError("CORS_ORIGINS environment variable is required")
    
    CORS(app, origins=cors_origins.split(','), supports_credentials=True)
    
    jwt = JWTManager(app)
    
    # Connect to MongoDB
    try:
        mongodb_uri = os.getenv('MONGODB_URI')
        connect(host=mongodb_uri)
        print(f"Connected to MongoDB successfully")
    except Exception as e:
        print(f"Failed to connect to MongoDB: {e}")
        raise
    
    # Register blueprints
    from app.routes.auth import auth_bp
    from app.routes.tasks import tasks_bp
    from app.routes.notifications import notifications_bp
    
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(tasks_bp, url_prefix='/api/tasks')
    app.register_blueprint(notifications_bp, url_prefix='/api/notifications')
    
    @app.route('/api/health')
    def health_check():
        return {'status': 'healthy', 'message': 'Task Scheduler API is running'}
    
    return app

if __name__ == '__main__':
    app = create_app()
    app.run(debug=True, port=5000)
