import io

from django.db.models import Count, Q
from django.db import transaction
from django.db.models.deletion import ProtectedError
from django.core.management import call_command
from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from apps.accounts.permissions import IsAdminUser
from rest_framework.response import Response
from rest_framework.exceptions import ValidationError

from apps.accounts.models import User
from apps.orders.models import CartItem, OrderItem, Order
from apps.products.models import Banner, Category, Product
from .admin_serializers import (
    AdminBannerSerializer,
    AdminCategorySerializer,
    AdminOrderSerializer,
    AdminProductSerializer,
    AdminUserSerializer,
)


class AdminProductViewSet(viewsets.ModelViewSet):
    queryset = (
        Product.objects.all()
        .select_related("category", "brand")
        .prefetch_related("variants__inventory")
        .order_by("-created_at")
    )
    serializer_class = AdminProductSerializer
    permission_classes = [IsAdminUser]
    pagination_class = None

    def get_queryset(self):
        queryset = super().get_queryset()
        search = self.request.query_params.get("search")
        category = self.request.query_params.get("category")
        featured = self.request.query_params.get("featured")

        if search:
            queryset = queryset.filter(
                Q(name__icontains=search) | Q(description__icontains=search)
            )
        if category:
            queryset = queryset.filter(category__slug=category)
        if featured:
            queryset = queryset.filter(featured=featured.lower() == "true")

        return queryset

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        if OrderItem.objects.filter(product=instance).exists():
            raise ValidationError(
                {"detail": "Cannot delete this product because it is referenced by existing orders. Deactivate it instead."}
            )
        with transaction.atomic():
            CartItem.objects.filter(product=instance).delete()
            self.perform_destroy(instance)
        return Response(status=status.HTTP_204_NO_CONTENT)


class AdminCategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.select_related("parent", "parent__parent").order_by(
        "group", "parent__name", "name"
    )
    serializer_class = AdminCategorySerializer
    permission_classes = [IsAdminUser]
    pagination_class = None

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        try:
            self.perform_destroy(instance)
        except ProtectedError:
            raise ValidationError(
                {"detail": "This category cannot be deleted because it is used by products. Move or delete the products first."}
            )
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=False, methods=["post"], url_path="seed")
    def seed_defaults(self, request):
        """
        Rebuild (idempotently) the production category architecture.

        This calls the existing management command so admins can recover categories
        from the dashboard without SSH access.
        """
        output = io.StringIO()
        with transaction.atomic():
            call_command("seed_categories", stdout=output)
        return Response({"detail": "Category seeding complete.", "log": output.getvalue()})


class AdminBannerViewSet(viewsets.ModelViewSet):
    queryset = Banner.objects.all().order_by("position", "-created_at")
    serializer_class = AdminBannerSerializer
    permission_classes = [IsAdminUser]
    pagination_class = None

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        self.perform_destroy(instance)
        return Response(status=status.HTTP_204_NO_CONTENT)


class AdminUserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all().order_by("-date_joined")
    serializer_class = AdminUserSerializer
    permission_classes = [IsAdminUser]
    pagination_class = None

    def get_queryset(self):
        queryset = super().get_queryset()
        queryset = queryset.annotate(annotated_total_orders=Count('order'))
        search = self.request.query_params.get("search")

        if search:
            queryset = queryset.filter(
                Q(email__icontains=search)
                | Q(first_name__icontains=search)
                | Q(last_name__icontains=search)
            )

        return queryset

    @action(detail=True, methods=["patch"])
    def promote_to_admin(self, request, pk=None):
        user = self.get_object()
        user.is_staff = True
        user.role = User.ROLE_ADMIN
        # Bump token_version so any existing access/refresh tokens are revoked
        # at next refresh. Without this the user keeps elevated access until
        # their old JWT expires even after a demote.
        from apps.accounts.authentication import invalidate_all_user_tokens
        with transaction.atomic():
            user.save(update_fields=["is_staff", "role"])
            invalidate_all_user_tokens(user)
        return Response(self.get_serializer(user).data)

    @action(detail=True, methods=["patch"])
    def demote_to_customer(self, request, pk=None):
        user = self.get_object()
        if user.is_superuser:
            return Response(
                {"detail": "Cannot demote superuser"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        user.is_staff = False
        user.role = User.ROLE_CUSTOMER
        from apps.accounts.authentication import invalidate_all_user_tokens
        with transaction.atomic():
            user.save(update_fields=["is_staff", "role"])
            invalidate_all_user_tokens(user)
        return Response(self.get_serializer(user).data)

    @action(detail=True, methods=["patch"])
    def deactivate(self, request, pk=None):
        user = self.get_object()
        if user.is_superuser:
            return Response(
                {"detail": "Cannot deactivate superuser"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        from apps.accounts.authentication import invalidate_all_user_tokens
        with transaction.atomic():
            user.is_active = False
            user.save(update_fields=["is_active"])
            invalidate_all_user_tokens(user)
        return Response(self.get_serializer(user).data)

    @action(detail=True, methods=["patch"])
    def activate(self, request, pk=None):
        user = self.get_object()
        user.is_active = True
        user.save(update_fields=["is_active"])
        return Response(self.get_serializer(user).data)


class AdminOrderViewSet(viewsets.ModelViewSet):
    queryset = (
        Order.objects.all().select_related("user").prefetch_related("items__product")
    )
    serializer_class = AdminOrderSerializer
    permission_classes = [IsAdminUser]
    pagination_class = None

    def get_queryset(self):
        queryset = super().get_queryset()
        status_filter = self.request.query_params.get("status")

        if status_filter:
            queryset = queryset.filter(status=status_filter)

        return queryset.order_by("-created_at")

    @action(detail=True, methods=["patch"])
    def update_status(self, request, pk=None):
        order = self.get_object()
        new_status = request.data.get("status")

        if new_status not in [
            Order.STATUS_PENDING,
            Order.STATUS_PAID,
            Order.STATUS_PROCESSING,
            Order.STATUS_SHIPPED,
            Order.STATUS_DELIVERED,
            Order.STATUS_CANCELLED,
        ]:
            return Response(
                {"detail": "Invalid status"}, status=status.HTTP_400_BAD_REQUEST
            )

        old_status = order.status
        # Use the state machine so the timestamp fields (paid_at, shipped_at,
        # etc.) are set automatically. Direct assignment skips those fields
        # and leaves the order in a half-updated state.
        ok, err = order.transition_to(new_status, save=True)
        if not ok:
            return Response(
                {"detail": f"Invalid transition: {err}"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            from apps.orders.tasks import handle_order_status_change
            handle_order_status_change.delay(order.id, old_status, new_status)
        except Exception as e:
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Failed to trigger status change tasks for order {order.id}: {e}")

        return Response(self.get_serializer(order).data)
