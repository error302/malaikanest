from django.contrib import admin
from django.utils.html import format_html
from .models import SiteSettings, ShopPhoto, OutboxEvent


@admin.register(SiteSettings)
class SiteSettingsAdmin(admin.ModelAdmin):
    list_display = ("site_name", "contact_email", "contact_phone", "shipping_fee", "free_shipping_threshold")
    fieldsets = (
        ("General", {"fields": ("site_name", "site_description", "logo")}),
        ("Contact", {"fields": ("contact_email", "contact_phone", "address")}),
        ("Social", {"fields": ("facebook_url", "instagram_url", "twitter_url")}),
        ("Pricing", {"fields": ("shipping_fee", "free_shipping_threshold", "minimum_order_amount")}),
    )

    def has_add_permission(self, request):
        return False if SiteSettings.objects.exists() else True

    def has_delete_permission(self, request, obj=None):
        return False


@admin.register(ShopPhoto)
class ShopPhotoAdmin(admin.ModelAdmin):
    list_display = ("caption", "is_active", "position", "created_at")
    list_filter = ("is_active",)
    list_editable = ("is_active", "position")
    search_fields = ("caption",)
    ordering = ("position", "-created_at")


@admin.register(OutboxEvent)
class OutboxEventAdmin(admin.ModelAdmin):
    list_display = ("event_type", "aggregate_type", "aggregate_id", "status", "created_at", "published_at")
    list_filter = ("status", "event_type", "aggregate_type")
    search_fields = ("aggregate_id", "event_type")
    readonly_fields = ("created_at", "updated_at", "payload_preview")
    actions = ["replay_selected"]
    ordering = ("-created_at",)

    def payload_preview(self, obj):
        import json
        try:
            preview = json.dumps(obj.payload, indent=2)[:500]
            return format_html("<pre>{}</pre>", preview)
        except Exception:
            return "-"
    payload_preview.short_description = "Payload"

    def replay_selected(self, request, queryset):
        from apps.core.tasks import _dispatch_outbox_event
        replayed = 0
        for event in queryset.filter(status__in=("pending", "failed")):
            try:
                _dispatch_outbox_event(event)
                event.status = "published"
                event.save(update_fields=["status"])
                replayed += 1
            except Exception:
                event.status = "failed"
                event.save(update_fields=["status"])
        self.message_user(request, f"Replayed {replayed} event(s).")
    replay_selected.short_description = "Replay selected events"
