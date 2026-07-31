from django.urls import re_path
from . import consumers

websocket_urlpatterns = [
    re_path(r'ws/payments/(?P<order_id>[\w-]+)/$', consumers.PaymentConsumer.as_asgi()),
]
