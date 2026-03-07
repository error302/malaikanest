from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAdminUser
from django.db.models import Q
from apps.products.models import Category, Product, Banner
from apps.orders.models import Order
from apps.accounts.models import User
from .admin_serializers import (
    AdminProductSerializer,
    AdminCategorySerializer,
    AdminBannerSerializer,
    AdminUserSerializer,
    AdminOrderSerializer,
)


class AdminProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.all().select_related("category", "brand").order_by("-created_at")
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


class AdminCategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all().order_by("name")
    serializer_class = AdminCategorySerializer
    permission_classes = [IsAdminUser]
    pagination_class = None


class AdminBannerViewSet(viewsets.ModelViewSet):
    queryset = Banner.objects.all().order_by("position", "-created_at")
    serializer_class = AdminBannerSerializer
    permission_classes = [IsAdminUser]
    pagination_class = None


class AdminUserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all().order_by("-date_joined")
    serializer_class = AdminUserSerializer
    permission_classes = [IsAdminUser]
    pagination_class = None

    def get_queryset(self):
        queryset = super().get_queryset()
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
        user.role = "admin"
        user.save(update_fields=["is_staff", "role"])
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
        user.role = "customer"
        user.save(update_fields=["is_staff", "role"])
        return Response(self.get_serializer(user).data)

    @action(detail=True, methods=["patch"])
    def deactivate(self, request, pk=None):
        user = self.get_object()
        if user.is_superuser:
            return Response(
                {"detail": "Cannot deactivate superuser"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        user.is_active = False
        user.save(update_fields=["is_active"])
        return Response(self.get_serializer(user).data)

    @action(detail=True, methods=["patch"])
    def activate(self, request, pk=None):
        user = self.get_object()
        user.is_active = True
        user.save(update_fields=["is_active"])
        return Response(self.get_serializer(user).data)


class AdminOrderViewSet(viewsets.ModelViewSet):
    queryset = Order.objects.all().select_related("user").prefetch_related("items__product")
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

        if new_status not in ["pending", "paid", "shipped", "delivered", "cancelled"]:
            return Response(
                {"detail": "Invalid status"}, status=status.HTTP_400_BAD_REQUEST
            )

        order.status = new_status
        order.save(update_fields=["status", "updated_at"])

        return Response(self.get_serializer(order).data)