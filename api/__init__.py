import os, json, re
from flask import Flask, current_app, g
from sqlalchemy import create_engine
from datetime import timedelta

# Blueprint imports 
# from .example_blueprint_file import example_blueprint
from .main import homepage
from .data import data_api
from .imgserver import imgserver
from .download import download




# ------- custom config is used for the flask checker apps ------- #
# CUSTOM_CONFIG_PATH = os.path.join(os.getcwd(), 'proj', 'config')

# CONFIG_FILEPATH = os.path.join(CUSTOM_CONFIG_PATH, 'config.json')
# assert os.path.exists(CONFIG_FILEPATH), "config.json not found"

# CONFIG = json.loads(open(CONFIG_FILEPATH, 'r').read())

# add all the items from the config file into the app configuration
# we should probably access all custom config items in this way
# app.config.update(CONFIG)
# ----------------------------------------------------------------- #



app = Flask(__name__, static_url_path='/static')
app.debug = True # remove for production

# does your application require uploaded filenames to be modified to timestamps or left as is
app.config['CORS_HEADERS'] = 'Content-Type'

# so they dont have to keep logging in
app.config['PERMANENT_SESSION_LIFETIME'] = timedelta(days=7)

# app.config['MAX_CONTENT_LENGTH'] = 200 * 1024 * 1024  # 200MB limit
app.secret_key = os.environ.get("FLASK_APP_SECRET_KEY")


# set the database connection string, database, and type of database we are going to point our application at
#app.eng = create_engine(os.environ.get("DB_CONNECTION_STRING"))
def connect_db():
    return create_engine(os.environ.get("DB_CONNECTION_STRING"))

@app.before_request
def before_request():
    g.eng = connect_db()

@app.teardown_request
def teardown_request(exception):
    if hasattr(g, 'eng'):
        g.eng.dispose()



# Blueprints
app.register_blueprint(homepage)
app.register_blueprint(data_api)
app.register_blueprint(imgserver)
app.register_blueprint(download)