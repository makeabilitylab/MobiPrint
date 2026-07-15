from . import db  # Import the db instance created in __init__.py

class PrintFile(db.Model):
    """Model for 3D print files."""
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), nullable=False)
    # description = db.Column(db.String(300))
    file_path = db.Column(db.String(120), unique=True, nullable=False)
    created_at = db.Column(db.DateTime, default=db.func.current_timestamp())
    #Add path to thumbnail image
    thumbnail_path = db.Column(db.String(120), nullable=False)

    def __repr__(self):
        return f'<PrintFile {self.name}>'