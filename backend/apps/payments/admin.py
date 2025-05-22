# payments/admin.py
from django.contrib import admin
from .models import SubscriptionPlan

@admin.register(SubscriptionPlan)
class SubscriptionPlanAdmin(admin.ModelAdmin):
    list_display = ('name', 'price_cents', 'currency', 'stripe_price_id', 'trial_period_days', 'is_active', 'is_popular', 'created_at')
    list_filter = ('is_active', 'is_popular', 'currency', 'trial_period_days')
    search_fields = ('name', 'description', 'stripe_price_id')
    ordering = ('price_cents', 'name')
    readonly_fields = ('created_at', 'updated_at')
    fieldsets = (
        (None, {
            'fields': ('name', 'description', 'is_active', 'is_popular')
        }),
        ('Pricing & Stripe', {
            'fields': ('price_cents', 'currency', 'stripe_price_id', 'trial_period_days')
        }),
        ('Features', {
            'fields': ('features',) # Assumes JSON editor widget or plain text area
        }),
         ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
             'classes': ('collapse',)
        }),
    )