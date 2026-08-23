import json
from urllib.parse import parse_qs

from channels.db import database_sync_to_async
from channels.generic.websocket import AsyncWebsocketConsumer


class PaymentConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.order_id = self.scope['url_route']['kwargs']['order_id']
        self.group_name = f'payment_{self.order_id}'

        # Authorization mirrors resolve_order_for_request(): authenticated users
        # may only watch their own orders; guests must supply the order's
        # unguessable checkout_token. Order ids are sequential/guessable, so an
        # unauthenticated socket would leak strangers' payment status + M-Pesa
        # receipts.
        if not await self._is_authorized():
            await self.close(code=4403)
            return

        await self.channel_layer.group_add(
            self.group_name,
            self.channel_name
        )

        await self.accept()

    @database_sync_to_async
    def _is_authorized(self):
        from apps.orders.models import Order

        if not str(self.order_id).isdigit():
            return False

        user = self.scope.get("user")
        if user is not None and user.is_authenticated:
            return Order.objects.filter(pk=int(self.order_id), user=user).exists()

        params = parse_qs(self.scope.get("query_string", b"").decode())
        checkout_token = (params.get("checkout_token") or [""])[0].strip()
        if not checkout_token:
            return False
        return Order.objects.filter(
            pk=int(self.order_id),
            checkout_token=checkout_token,
            user__isnull=True,
        ).exists()

    async def disconnect(self, close_code):
        # Leave the payment group
        group_name = getattr(self, "group_name", None)
        if group_name:
            await self.channel_layer.group_discard(group_name, self.channel_name)

    # Receive message from room group
    async def payment_update(self, event):
        payload = event['payload']

        # Send message to WebSocket
        await self.send(text_data=json.dumps(payload))
