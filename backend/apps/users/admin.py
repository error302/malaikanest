from django.contrib import admin
from .models import User


@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ('email', 'phone', 'role', 'is_active', 'is_staff')
    search_fields = ('email', 'phone')
    list_filter = ('role', 'is_active', 'is_staff')
