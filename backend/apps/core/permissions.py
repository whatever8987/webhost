# core/permissions.py
from rest_framework import permissions

class IsAdminUserOrReadOnly(permissions.BasePermission):
    """
    Allows read access to any request, authenticated or not.
    Allows write access only to admin users.
    """
    def has_permission(self, request, view):
        # Allow read-only methods (GET, HEAD, OPTIONS) for all
        if request.method in permissions.SAFE_METHODS:
            return True
        # For write methods, user must be authenticated and an admin
        return request.user and request.user.is_authenticated and request.user.is_admin()

class IsOwnerOrAdmin(permissions.BasePermission):
    """
    Object-level permission to only allow owners of an object or admins to edit it.
    Assumes the model instance has an `owner` or `author` attribute.
    """
    def has_object_permission(self, request, view, obj):
        # Admins have full access
        if request.user and request.user.is_authenticated and request.user.is_admin():
            return True

        # Check ownership - adapt attribute name if needed ('owner', 'author', etc.)
        owner_attr = None
        if hasattr(obj, 'owner'):
            owner_attr = obj.owner
        elif hasattr(obj, 'author'):
            owner_attr = obj.author
        # Add other potential owner attributes here

        # Write permissions are only allowed to the owner of the object.
        return owner_attr == request.user

class IsOwnerOrAdminOrReadOnly(permissions.BasePermission):
    """
    Allows read access to any request (authenticated or not).
    Allows write access only to the object's owner or an admin.
    """
    def has_permission(self, request, view):
        # Allow read-only methods for all
        if request.method in permissions.SAFE_METHODS:
            return True
        # For write methods, user must be authenticated
        return request.user and request.user.is_authenticated

    def has_object_permission(self, request, view, obj):
        # Allow read-only methods for all
        if request.method in permissions.SAFE_METHODS:
            return True

        # Admin users have full write access
        if request.user.is_admin():
            return True

        # Check ownership - adapt attribute name if needed ('owner', 'author', etc.)
        owner_attr = None
        if hasattr(obj, 'owner'):
            owner_attr = obj.owner
        elif hasattr(obj, 'author'):
            owner_attr = obj.author
        # Add other potential owner attributes here

        # Write permissions are only allowed to the owner.
        return owner_attr == request.user

# Add other custom permissions here if needed