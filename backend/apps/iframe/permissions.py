# salons/permissions.py
from rest_framework import permissions

class IsOwnerOrAdmin(permissions.BasePermission):
    """
    Custom permission to only allow owners of an object or admins to edit it.
    Read access might be granted based on other permissions (e.g., IsAuthenticatedOrReadOnly).
    """
    def has_object_permission(self, request, view, obj):
        # Admin users have full access
        if request.user and request.user.is_authenticated and request.user.is_admin():
            return True

        # Write permissions are only allowed to the owner of the salon.
        # Assumes the object 'obj' has an 'owner' attribute.
        return obj.owner == request.user

class IsOwnerOrAdminOrReadOnly(permissions.BasePermission):
    """
    Allows read access to any request, but write access only to owner or admin.
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

        # Write permissions are only allowed to the owner of the salon.
        return obj.owner == request.user