from django.contrib import admin
from .models import Business, Type  # Changed Game to Business

admin.site.register(Business)  # Changed Game to Business
admin.site.register(Type)
