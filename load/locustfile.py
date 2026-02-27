from locust import HttpUser, task, between
import random


class ShopperUser(HttpUser):
    wait_time = between(1, 3)

    @task(5)
    def view_home(self):
        self.client.get("/")

    @task(3)
    def list_products(self):
        self.client.get("/api/products/products/")

    @task(1)
    def checkout_flow_sim(self):
        # Simulate creating a cart/order (endpoint names may differ in your setup)
        # This is a light simulation; in staging, use real test users and cleanup.
        payload = {"phone": "2547%08d" % random.randint(10000000, 99999999), "order_id": "test-%d" % random.randint(1,100000)}
        self.client.post("/api/payments/mpesa/stk/", json=payload)
