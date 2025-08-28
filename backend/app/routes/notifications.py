from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from bson import ObjectId
from app.models.notification import Notification
from app.models import User
from app.services.notification_service import NotificationService
import traceback

notifications_bp = Blueprint('notifications', __name__)

# Handle preflight requests explicitly
@notifications_bp.before_request
def handle_preflight():
    if request.method == "OPTIONS":
        return '', 200

@notifications_bp.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({'status': 'healthy', 'message': 'Notifications API is running'})

@notifications_bp.route('', methods=['GET'])
@jwt_required()
def get_notifications():
    """Get notifications for the current user"""
    try:
        current_user_id = get_jwt_identity()
        user = User.objects.get(id=ObjectId(current_user_id))
        
        # Get query parameters
        is_read = request.args.get('is_read')
        limit = request.args.get('limit', 50)
        
        # Convert string parameters
        try:
            limit = int(limit)
        except (ValueError, TypeError):
            limit = 50
        
        if is_read is not None:
            is_read = is_read.lower() == 'true'
        
        # Get notifications
        notifications = Notification.get_user_notifications(
            user=user,
            is_read=is_read,
            limit=limit
        )
        
        # Get unread count
        unread_count = Notification.get_unread_count(user)
        
        return jsonify({
            'notifications': [notification.to_dict() for notification in notifications],
            'total_count': notifications.count(),
            'unread_count': unread_count
        })
        
    except Exception as e:
        print(f"Error getting notifications: {traceback.format_exc()}")
        return jsonify({'error': 'Internal server error'}), 500

@notifications_bp.route('/<notification_id>/read', methods=['PUT'])
@jwt_required()
def mark_notification_as_read(notification_id):
    """Mark a notification as read"""
    try:
        current_user_id = get_jwt_identity()
        user = User.objects.get(id=ObjectId(current_user_id))
        
        # Get the notification and ensure it belongs to the current user
        notification = Notification.objects.get(
            id=ObjectId(notification_id),
            user=user
        )
        
        notification.mark_as_read()
        
        return jsonify({
            'message': 'Notification marked as read',
            'notification': notification.to_dict()
        })
        
    except Notification.DoesNotExist:
        return jsonify({'error': 'Notification not found'}), 404
    except Exception as e:
        print(f"Error marking notification as read: {traceback.format_exc()}")
        return jsonify({'error': 'Internal server error'}), 500

@notifications_bp.route('/mark-all-read', methods=['PUT'])
@jwt_required()
def mark_all_notifications_as_read():
    """Mark all notifications as read for the current user"""
    try:
        current_user_id = get_jwt_identity()
        user = User.objects.get(id=ObjectId(current_user_id))
        
        marked_count = Notification.mark_all_as_read(user)
        
        return jsonify({
            'message': f'{marked_count} notifications marked as read',
            'marked_count': marked_count
        })
        
    except Exception as e:
        print(f"Error marking all notifications as read: {traceback.format_exc()}")
        return jsonify({'error': 'Internal server error'}), 500

@notifications_bp.route('/<notification_id>', methods=['DELETE'])
@jwt_required()
def delete_notification(notification_id):
    """Delete a notification"""
    try:
        current_user_id = get_jwt_identity()
        user = User.objects.get(id=ObjectId(current_user_id))
        
        # Get the notification and ensure it belongs to the current user
        notification = Notification.objects.get(
            id=ObjectId(notification_id),
            user=user
        )
        
        notification.delete()
        
        return jsonify({'message': 'Notification deleted successfully'})
        
    except Notification.DoesNotExist:
        return jsonify({'error': 'Notification not found'}), 404
    except Exception as e:
        print(f"Error deleting notification: {traceback.format_exc()}")
        return jsonify({'error': 'Internal server error'}), 500

@notifications_bp.route('/unread-count', methods=['GET'])
@jwt_required()
def get_unread_count():
    """Get count of unread notifications for current user"""
    try:
        current_user = get_jwt_identity()
        unread_count = Notification.objects(
            user_id=current_user,
            is_read=False
        ).count()
        
        return jsonify({
            'unread_count': unread_count
        }), 200
        
    except Exception as e:
        print(f"❌ Error getting unread count: {e}")
        return jsonify({'error': 'Failed to get unread count'}), 500

@notifications_bp.route('/check-and-create', methods=['POST'])
@jwt_required()
def check_and_create_notifications():
    """Check for and create time-based notifications"""
    try:
        current_user_id = get_jwt_identity()
        
        notification_service = NotificationService()
        notifications_created = notification_service.check_and_create_time_based_notifications(current_user_id)
        
        return jsonify({
            'message': f'{len(notifications_created)} notifications created',
            'notifications_created': len(notifications_created),
            'notifications': [notification.to_dict() for notification in notifications_created]
        })
        
    except Exception as e:
        print(f"Error checking and creating notifications: {traceback.format_exc()}")
        return jsonify({'error': 'Internal server error'}), 500

@notifications_bp.route('/cleanup', methods=['POST'])
@jwt_required()
def cleanup_old_notifications():
    """Clean up old read notifications"""
    try:
        current_user_id = get_jwt_identity()
        days_old = request.json.get('days_old', 30) if request.json else 30
        
        notification_service = NotificationService()
        cleaned_count = notification_service.cleanup_old_notifications(current_user_id, days_old)
        
        return jsonify({
            'message': f'{cleaned_count} old notifications cleaned up',
            'cleaned_count': cleaned_count
        })
        
    except Exception as e:
        print(f"Error cleaning up notifications: {traceback.format_exc()}")
        return jsonify({'error': 'Internal server error'}), 500
