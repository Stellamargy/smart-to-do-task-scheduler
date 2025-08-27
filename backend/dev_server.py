#!/usr/bin/env python3
"""
Development Startup Script
Starts the Flask development server with hot reload
"""

import os
import sys
from app import create_app

def main():
    """Start the development server"""
    # Set environment to development
    os.environ['FLASK_ENV'] = 'development'
    os.environ['FLASK_DEBUG'] = '1'
    
    # Create Flask app
    app = create_app()
    
    print("🚀 Starting Smart Task Scheduler Backend")
    print("=" * 50)
    print(f"Server running at: http://localhost:5000")
    print(f"API Documentation: http://localhost:5000/api/health")
    print("Press CTRL+C to stop the server")
    print()
    
    try:
        # Run the development server
        app.run(
            host='0.0.0.0',
            port=5000,
            debug=True,
            use_reloader=True
        )
    except KeyboardInterrupt:
        print("\n👋 Server stopped by user")
        sys.exit(0)
    except Exception as e:
        print(f"\n❌ Server error: {e}")
        sys.exit(1)

if __name__ == '__main__':
    main()
