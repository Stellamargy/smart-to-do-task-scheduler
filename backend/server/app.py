#NB - This is the entry file 
from flask import Flask
from .config import Config
from .extension import db,migrate
from server.models import Task
#Instantiate a flask application instance
app=Flask(__name__)

#load configurations
app.config.from_object(Config)

#integrate extension with app
db.init_app(app)
migrate.init_app(db=db,app=app)

#Testing
@app.route("/")
def hello():
    return "Hello, World!"