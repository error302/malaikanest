import json
from channels.generic.websocket import AsyncWebsocketConsumer


class AdminAnalyticsConsumer(AsyncWebsocketConsumer):
    """
    WebSocket consumer for real-time admin analytics.
    Clients connect to receive live updates about orders, revenue, etc.
    """
    
    async def connect(self):
        self.room_group_name = "admin_analytics"
        
        # Join room group
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        
        await self.accept()
        
        # Send welcome message
        await self.send(text_data=json.dumps({
            "type": "connection_established",
            "message": "Connected to admin analytics"
        }))

    async def disconnect(self, close_code):
        # Leave room group
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )

    # Receive message from room group
    async def send_update(self, event):
        """Handle messages sent to the group"""
        await self.send(text_data=json.dumps(event["data"]))

    async def new_order(self, event):
        """Handle new order notifications"""
        await self.send(text_data=json.dumps({
            "type": "new_order",
            "data": event["data"]
        }))

    async def revenue_update(self, event):
        """Handle revenue update notifications"""
        await self.send(text_data=json.dumps({
            "type": "revenue_update",
            "data": event["data"]
        }))
