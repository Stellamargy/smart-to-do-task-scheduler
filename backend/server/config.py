from dotenv import load_dotenv
import os
#load environment variables from .env
load_dotenv()
class Config():
    SQLALCHEMY_DATABASE_URI=os.getenv('POSTGRESQL_URI')
    SQLALCHEMY_TRACK_MODIFICATIONS = False 