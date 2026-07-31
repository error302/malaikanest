import json
from channels.generic.websocket import AsyncWebsocketConsumer

class PaymentConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.order_id = self.scope['url_route']['kwargs']['order_id']
        self.group_name = f'payment_{self.order_id}'
        
        # Join the order-specific payment group
        await self.channel_layer.group_add(
            self.group_name,
            self.channel_name
        )
        
        await self.accept()

    async def disconnect(self, close_code):
        # Leave the payment group
        await self.channel_layer.group_discard(
            self.group_name,
            self.channel_name
        )

    # Receive message from room group
    async def payment_update(self, event):
        payload = event['payload']
        
        # Send message to WebSocket
        await self.send(text_data=json.dumps(payload))
