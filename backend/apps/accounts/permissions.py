"""
Custom Permissions
Implements role-based access control for the application
"""
import logging
from rest_framework import permissions
from django.shortcuts import get_object_or_404

logger = logging.getLogger('security')


class IsAdminUser(permissions.BasePermission):
    """
    Custom permission to only allow admin users (staff or superuser) to access.
    Checks user.role == 'admin' or user.is_staff == True
    """
    
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        
        # Check for admin role or staff status
        is_admin = (
            request.user.is_staff or 
            getattr(request.user, 'role', None) == 'admin' or
            request.user.is_superuser
        )
        
        if not is_admin:
            logger.warning(
                f"Non-admin user {request.user.email} attempted to access admin endpoint: {request.path}"
            )
        
        return is_admin


class IsAdminOrReadOnly(permissions.BasePermission):
    """
    Custom permission:
    - Allow read access to anyone
    - Allow write access only to admin users
    """
    
    def has_permission(self, request, view):
        # Read permissions are allowed to any request
        if request.method in permissions.SAFE_METHODS:
            return True
        
        # Write permissions require admin
        if not request.user or not request.user.is_authenticated:
            return False
        
        return (
            request.user.is_staff or 
            getattr(request.user, 'role', None) == 'admin' or
            request.user.is_superuser
        )


class IsOwnerOrAdmin(permissions.BasePermission):
    """
    Custom permission to only allow owners of an object or admins to access it.
    """
    
    def has_object_permission(self, request, view, obj):
        # Admin always has access
        if request.user.is_staff or getattr(request.user, 'role', None) == 'admin':
            return True
        
        # Check if the user owns the object
        # This assumes objects have an 'owner', 'user', or 'created_by' field
        if hasattr(obj, 'owner') and obj.owner == request.user:
            return True
        if hasattr(obj, 'user') and obj.user == request.user:
            return True
        if hasattr(obj, 'created_by') and obj.created_by == request.user:
            return True
        if hasattr(obj, 'email') and obj.email == request.user.email:
            return True
        
        logger.warning(
            f"User {request.user.email} attempted to access object they don't own: {obj}"
        )
        
        return False


class IsVerifiedUser(permissions.BasePermission):
    """
    Custom permission to only allow verified users to access certain endpoints.
    """
    
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        
        # Check if user has verified email
        if hasattr(request.user, 'is_verified'):
            if not request.user.is_verified:
                logger.warning(
                    f"Unverified user {request.user.email} attempted to access verified endpoint: {request.path}"
                )
                return False
        
        return True


class CanManageOrders(permissions.BasePermission):
    """
    Permission to check if user can manage orders.
    - Admins can see all orders
    - Regular users can only see their own orders
    """
    
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        
        return True
    
    def has_object_permission(self, request, view, obj):
        # Admin can access any order
        if request.user.is_staff or getattr(request.user, 'role', None) == 'admin':
            return True
        
        # User can only access their own orders
        if hasattr(obj, 'user') and obj.user == request.user:
            return True
        if hasattr(obj, 'guest_email'):
            # For guest orders, check if email matches
            if request.user.email == obj.guest_email:
                return True
        
        logger.warning(
            f"User {request.user.email} attempted to access order {obj.id} they don't own"
        )
        
        return False


def require_role(role):
    """
    Decorator function to require a specific role for a view.
    Usage:
        @require_role('admin')
        def my_view(request):
            ...
    """
    def decorator(view_func):
        def wrapped(self, request, *args, **kwargs):
            if not request.user.is_authenticated:
                return self.permission_denied(request)
            
            user_role = getattr(request.user, 'role', None)
            if user_role != role and not request.user.is_staff:
                logger.warning(
                    f"User {request.user.email} with role '{user_role}' attempted to access role-protected endpoint: {request.path}"
                )
                return self.permission_denied(request)
            
            return view_func(self, request, *args, **kwargs)
        
        return wrapped
    return decorator
