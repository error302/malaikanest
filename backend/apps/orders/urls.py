from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CartViewSet, OrderViewSet
from .admin_views import AdminAnalyticsView, OrdersCSVExportView, InvoiceListView, InvoiceDetailView, InvoiceDownloadView, InvoiceRegenerateView, InvoiceResendView

router = DefaultRouter()
router.register('orders', OrderViewSet, basename='orders')

urlpatterns = [
    path('', include(router.urls)),
    path('cart/', CartViewSet.as_view({'get': 'list'})),
    path('cart/add/', CartViewSet.as_view({'post': 'add'})),
    path('cart/update/', CartViewSet.as_view({'post': 'update_item'})),
    path('cart/clear/', CartViewSet.as_view({'post': 'clear_cart'})),
    path('cart/checkout/', CartViewSet.as_view({'post': 'checkout'})),
    path('cart/remove/<int:product_id>/', CartViewSet.as_view({'post': 'remove'})),
    path('admin/analytics/', AdminAnalyticsView.as_view()),
    path('admin/orders/export/', OrdersCSVExportView.as_view()),
    
    # Invoice admin endpoints
    path('admin/invoices/', InvoiceListView.as_view(), name='admin-invoice-list'),
    path('admin/invoices/<int:invoice_id>/', InvoiceDetailView.as_view(), name='admin-invoice-detail'),
    path('admin/invoices/<int:invoice_id>/download/', InvoiceDownloadView.as_view(), name='admin-invoice-download'),
    path('admin/invoices/<int:invoice_id>/regenerate/', InvoiceRegenerateView.as_view(), name='admin-invoice-regenerate'),
    path('admin/invoices/<int:invoice_id>/resend/', InvoiceResendView.as_view(), name='admin-invoice-resend'),
]



