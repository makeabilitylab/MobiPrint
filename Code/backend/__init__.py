from datetime import datetime
from flask import Flask, Blueprint
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
import os
from os import path

db = SQLAlchemy()
DB_NAME = "database.db"
UPLOAD_FOLDER = 'uploads'

def create_app(test_config=None):
    app = Flask(__name__)
    app.secret_key = os.environ.get("SECRET_KEY", "dev")

    # configure the database
    app.config['SQLALCHEMY_DATABASE_URI'] = f'sqlite:///{DB_NAME}'
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

    app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

    db.init_app(app)


    with app.app_context():
        from .models import PrintFile

        db.create_all()  # Ensure all tables are created
        preload_default_models()  # Preload the default models

    # enable CORS
    CORS(app, resources={r'/*': {'origins': '*'}}, supports_credentials=True)
    
    
    # import and register the blueprint
    from . import mobiprint
    app.register_blueprint(mobiprint.bp)

    #import the models 
    from . import models

    return app


def create_database(app):
    if not path.exists('backend/' + DB_NAME):
        with app.app_context():
            db.create_all()
            print('Database created!')
    else:
        print('Database already exists!')

#function to preload default models
def preload_default_models():

    from .models import PrintFile
    base_dir = os.path.dirname(__file__)
    default_models_dir = os.path.join(base_dir, 'static', 'default_models')

    for filename in os.listdir(default_models_dir):
        if filename.endswith('.gcode'):
            # Paths are stored relative to the backend package so DB records
            # stay valid no matter where the repo lives or the app is launched from.
            file_path = os.path.join('static', 'default_models', filename)
            thumbnail_path = os.path.join('static', 'default_models', 'thumbnails', filename.replace('.gcode', '.png'))

            # Check if the file and its thumbnail are already in the database
            if not PrintFile.query.filter_by(name=filename).first() and os.path.exists(os.path.join(base_dir, thumbnail_path)):
                new_file = PrintFile(name=filename, file_path=file_path, thumbnail_path=thumbnail_path, created_at=datetime.now())
                db.session.add(new_file)
            else:
                print(f"Skipping {filename} as it already exists or thumbnail is missing.")
    db.session.commit()
