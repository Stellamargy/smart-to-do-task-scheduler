from mongoengine import Document, StringField, DateTimeField, BooleanField
from datetime import datetime, timezone

class User(Document):
    """User model for authentication"""
    username = StringField(required=True, unique=True, max_length=50)
    name = StringField(required=True, max_length=100)
    email = StringField(required=True, unique=True, max_length=100)
    bio = StringField(max_length=500, default="")
    password_hash = StringField(required=True)
    created_at = DateTimeField(default=lambda: datetime.now(timezone.utc))
    is_active = BooleanField(default=True)
    
    meta = {
        'collection': 'users',
        'indexes': ['username', 'email']
    }
    
    def to_dict(self):
        return {
            'id': str(self.id),
            'username': self.username,
            'name': self.name,
            'email': self.email,
            'bio': self.bio,
            'created_at': self.created_at.isoformat(),
            'is_active': self.is_active
        }

# Import Task model
from .task import Task
