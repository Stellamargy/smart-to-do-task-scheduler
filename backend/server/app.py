#NB - This is the entry file 
from flask import Flask
#Instantiate a flask application instance
app=Flask(__name__)
#Testing
@app.route("/")
def hello():
    return "Hello, World!"