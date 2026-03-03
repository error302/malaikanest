from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAdminUser
from rest_framework.pagination import PageNumberPagination
from django.db.models import Q
from apps.products.models import Category, Product, Banner, Inventory
from apps.orders.models import Order
from apps.accounts.models import User
from .admin_serializers import (
    AdminProductSerializer,
    AdminCategorySerializer,
    AdminBannerSerializer,
    AdminUserSerializer,
    AdminOrderSerializer,
)


class AdminPagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 100


class IsAdminUserOrReadOnly(permissions.BasePermission):
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return request.user and request.user.is_staff


class AdminProductViewSet(viewsets.ModelViewSet):
    queryset = (
        Product.objects.all().select_related("category").prefetch_related("images")
    )
    serializer_class = AdminProductSerializer
    permission_classes = [IsAdminUserOrReadOnly]
    pagination_class = AdminPagination

    def get_queryset(self):
        queryset = super().get_queryset()
        search = self.request.query_params.get("search", None)
        category = self.request.query_params.get("category", None)
        featured = self.request.query_params.get("featured", None)

        if search:
            queryset = queryset.filter(
                Q(name__icontains=search) | Q(description__icontains=search)
            )
        if category:
            queryset = queryset.filter(category__slug=category)
        if featured:
            queryset = queryset.filter(featured=featured.lower() == "true")

        return queryset

    def create(self, request, *args, **kwargs):
        data = request.data
        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)
        product = serializer.save()

        return Response(serializer.data, status=status.HTTP_201_CREATED)

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop("partial", False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        product = serializer.save()

        return Response(serializer.data)


class AdminCategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all()
    serializer_class = AdminCategorySerializer
    permission_classes = [IsAdminUserOrReadOnly]
    pagination_class = AdminPagination


class AdminBannerViewSet(viewsets.ModelViewSet):
    queryset = Banner.objects.all().order_by("position")
    serializer_class = AdminBannerSerializer
    permission_classes = [IsAdminUserOrReadOnly]
    pagination_class = AdminPagination


class AdminUserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all().order_by("-date_joined")
    serializer_class = AdminUserSerializer
    permission_classes = [IsAdminUser]
    pagination_class = AdminPagination

    def get_queryset(self):
        queryset = super().get_queryset()
        search = self.request.query_params.get("search", None)

        if search:
            queryset = queryset.filter(
                Q(email__icontains=search)
                | Q(first_name__icontains=search)
                | Q(last_name__icontains=search)
            )

        return queryset

    @action(detail=True, methods=["patch"])
    def promote_to_admin(self, request, pk=None):
        """Promote a user to admin staff status"""
        user = self.get_object()
        user.is_staff = True
        user.role = 'admin'
        user.save()
        serializer = self.get_serializer(user)
        return Response(serializer.data)

    @action(detail=True, methods=["patch"])
    def demote_to_customer(self, request, pk=None):
        """Demote an admin to customer status"""
        user = self.get_object()
        # Prevent demoting superuser
        if user.is_superuser:
            return Response(
                {"detail": "Cannot demote superuser"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        user.is_staff = False
        user.role = 'customer'
        user.save()
        serializer = self.get_serializer(user)
        return Response(serializer.data)

    @action(detail=True, methods=["patch"])
    def deactivate(self, request, pk=None):
        """Deactivate a user account"""
        user = self.get_object()
        # Prevent deactivating superuser
        if user.is_superuser:
            return Response(
                {"detail": "Cannot deactivate superuser"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        user.is_active = False
        user.save()
        serializer = self.get_serializer(user)
        return Response(serializer.data)

    @action(detail=True, methods=["patch"])
    def activate(self, request, pk=None):
        """Activate a user account"""
        user = self.get_object()
        user.is_active = True
        user.save()
        serializer = self.get_serializer(user)
        return Response(serializer.data)


class AdminOrderViewSet(viewsets.ModelViewSet):
    queryset = (
        Order.objects.all().select_related("user").prefetch_related("items__product")
    )
    serializer_class = AdminOrderSerializer
    permission_classes = [IsAdminUser]
    pagination_class = AdminPagination

    def get_queryset(self):
        queryset = super().get_queryset()
        status_filter = self.request.query_params.get("status", None)

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
        order.save()

        serializer = self.get_serializer(order)
        return Response(serializer.data)
