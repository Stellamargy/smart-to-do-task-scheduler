from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from app.models import User
import bcrypt
import random
import re
from marshmallow import Schema, fields, ValidationError

auth_bp = Blueprint('auth', __name__)

class UserRegistrationSchema(Schema):
    name = fields.Str(required=True, validate=lambda x: len(x.strip()) >= 2)
    email = fields.Email(required=True)
    password = fields.Str(required=True, validate=lambda x: len(x) >= 6)

class UserLoginSchema(Schema):
    login = fields.Str(required=True)  # Can be username or email
    password = fields.Str(required=True)

class UpdateProfileSchema(Schema):
    name = fields.Str(validate=lambda x: len(x.strip()) >= 2 if x else True)
    email = fields.Email()
    bio = fields.Str(validate=lambda x: len(x) <= 500 if x else True)

def generate_username_from_name(name):
    """Generate username from name (first name + _ + 3 random digits)"""
    # Extract first name and clean it
    first_name = name.strip().split()[0].lower()
    # Remove non-alphanumeric characters
    first_name = re.sub(r'[^a-zA-Z0-9]', '', first_name)
    # Generate random 3-digit number
    random_digits = str(random.randint(100, 999))
    return f"{first_name}_{random_digits}"

def ensure_unique_username(base_username):
    """Ensure username is unique by checking database"""
    username = base_username
    counter = 1
    
    while User.objects(username=username).first():
        # If username exists, try with incremental number
        random_digits = str(random.randint(100, 999))
        username = f"{base_username.split('_')[0]}_{random_digits}"
        counter += 1
        # Prevent infinite loop
        if counter > 10:
            username = f"{base_username}_{random.randint(1000, 9999)}"
            break
    
    return username

@auth_bp.route('/register', methods=['POST'])
def register():
    """Register a new user"""
    try:
        schema = UserRegistrationSchema()
        data = schema.load(request.json)
    except ValidationError as err:
        return jsonify({'error': 'Validation failed', 'messages': err.messages}), 400
    
    # Generate username from name
    base_username = generate_username_from_name(data['name'])
    username = ensure_unique_username(base_username)
    
    # Check if email already exists
    if User.objects(email=data['email']).first():
        return jsonify({'error': 'Email already exists'}), 409
    
    # Hash password
    password_hash = bcrypt.hashpw(data['password'].encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    
    # Create user
    try:
        user = User(
            username=username,
            name=data['name'],
            email=data['email'],
            password_hash=password_hash
        )
        user.save()
        
        # Create access token
        access_token = create_access_token(identity=str(user.id))
        
        return jsonify({
            'message': 'User registered successfully',
            'access_token': access_token,
            'user': user.to_dict(),
            'generated_username': username
        }), 201
        
    except Exception as e:
        return jsonify({'error': 'Failed to create user', 'message': str(e)}), 500

@auth_bp.route('/login', methods=['POST'])
def login():
    """Login user with email or username"""
    try:
        schema = UserLoginSchema()
        data = schema.load(request.json)
    except ValidationError as err:
        return jsonify({'error': 'Validation failed', 'messages': err.messages}), 400
    
    # Find user by username or email
    login_identifier = data['login']
    user = None
    
    # Check if login identifier is an email (contains @)
    if '@' in login_identifier:
        user = User.objects(email=login_identifier).first()
    else:
        user = User.objects(username=login_identifier).first()
    
    if not user:
        return jsonify({'error': 'Invalid email/username or password'}), 401
    
    # Check password
    if not bcrypt.checkpw(data['password'].encode('utf-8'), user.password_hash.encode('utf-8')):
        return jsonify({'error': 'Invalid email/username or password'}), 401
    
    # Check if user is active
    if not user.is_active:
        return jsonify({'error': 'Account is deactivated'}), 401
    
    # Create access token
    access_token = create_access_token(identity=str(user.id))
    
    # Trigger automatic scheduling for user's existing tasks on login
    try:
        from app.services.scheduler import TaskScheduler
        scheduler = TaskScheduler()
        scheduler.auto_schedule_on_task_change(str(user.id))
    except Exception as e:
        # Don't fail login if scheduling fails, just log it
        print(f"Error in automatic scheduling on login: {e}")
    
    return jsonify({
        'message': 'Login successful',
        'access_token': access_token,
        'user': user.to_dict()
    }), 200

@auth_bp.route('/profile', methods=['GET'])
@jwt_required()
def get_profile():
    """Get current user profile"""
    user_id = get_jwt_identity()
    user = User.objects(id=user_id).first()
    
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    return jsonify({'user': user.to_dict()}), 200

@auth_bp.route('/profile', methods=['PUT'])
@jwt_required()
def update_profile():
    """Update user profile"""
    user_id = get_jwt_identity()
    user = User.objects(id=user_id).first()
    
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    try:
        schema = UpdateProfileSchema()
        data = schema.load(request.json)
    except ValidationError as err:
        return jsonify({'error': 'Validation failed', 'messages': err.messages}), 400
    
    # Update allowed fields
    if 'name' in data:
        user.name = data['name'].strip()
    
    if 'email' in data:
        # Check if email is already taken by another user
        existing_user = User.objects(email=data['email'], id__ne=user_id).first()
        if existing_user:
            return jsonify({'error': 'Email already exists'}), 409
        user.email = data['email']
    
    if 'bio' in data:
        user.bio = data['bio']
    
    try:
        user.save()
        return jsonify({
            'message': 'Profile updated successfully',
            'user': user.to_dict()
        }), 200
    except Exception as e:
        return jsonify({'error': 'Failed to update profile', 'message': str(e)}), 500

@auth_bp.route('/change-password', methods=['POST'])
@jwt_required()
def change_password():
    """Change user password"""
    user_id = get_jwt_identity()
    user = User.objects(id=user_id).first()
    
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    data = request.json
    
    if not data.get('current_password') or not data.get('new_password'):
        return jsonify({'error': 'Current password and new password are required'}), 400
    
    # Verify current password
    if not bcrypt.checkpw(data['current_password'].encode('utf-8'), user.password_hash.encode('utf-8')):
        return jsonify({'error': 'Current password is incorrect'}), 401
    
    # Validate new password
    if len(data['new_password']) < 6:
        return jsonify({'error': 'New password must be at least 6 characters long'}), 400
    
    # Hash new password
    new_password_hash = bcrypt.hashpw(data['new_password'].encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    
    try:
        user.password_hash = new_password_hash
        user.save()
        
        return jsonify({'message': 'Password changed successfully'}), 200
    except Exception as e:
        return jsonify({'error': 'Failed to change password', 'message': str(e)}), 500
