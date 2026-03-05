from rest_framework.views import APIView
from rest_framework.permissions import IsAdminUser
from rest_framework.response import Response
from django.db.models import Sum, Count, Q
from django.http import HttpResponse
import csv
import datetime
from apps.orders.models import Order, OrderItem
from apps.products.models import Inventory, Product
from apps.accounts.models import User


class AdminAnalyticsView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        # Revenue and orders stats (paid orders only)
        total_revenue = (
            Order.objects.filter(status="paid").aggregate(total=Sum("total"))["total"]
            or 0
        )
        total_orders = Order.objects.filter(status="paid").count()

        # Total users
        total_users = User.objects.count()

        # Total products
        total_products = Product.objects.count()

        # monthly revenue (last 6 months)
        six_months_ago = datetime.date.today() - datetime.timedelta(days=180)
        monthly = (
            Order.objects.filter(status="paid", created_at__date__gte=six_months_ago)
            .extra({"month": "date_trunc('month', created_at)"})
            .values("month")
            .annotate(revenue=Sum("total"), orders=Count("id"))
            .order_by("month")
        )
        monthly_data = [
            {
                "month": m["month"].strftime("%Y-%m"),
                "revenue": float(m["revenue"] or 0),
                "orders": m["orders"],
            }
            for m in monthly
        ]

        # low stock alerts
        low_stock = Inventory.objects.filter(quantity__lte=5).select_related("product")[
            :50
        ]
        low_stock_list = [
            {
                "product": inv.product.name,
                "available": inv.available(),
                "quantity": inv.quantity,
            }
            for inv in low_stock
        ]

        # Recent orders (last 10)
        recent_orders = Order.objects.select_related("user").order_by("-created_at")[
            :10
        ]
        recent_orders_list = [
            {
                "id": o.id,
                "order_number": o.order_number,
                "user_email": o.user.email if o.user else "N/A",
                "total": float(o.total),
                "status": o.status,
                "created_at": o.created_at.isoformat(),
            }
            for o in recent_orders
        ]

        return Response(
            {
                "total_revenue": float(total_revenue),
                "total_orders": total_orders,
                "total_users": total_users,
                "total_products": total_products,
                "monthly": monthly_data,
                "low_stock": low_stock_list,
                "recent_orders": recent_orders_list,
            }
        )


class AdminReportsView(APIView):
    """Detailed reports API with date filtering"""

    permission_classes = [IsAdminUser]

    def get(self, request):
        days = int(request.query_params.get("days", 30))
        start_date = datetime.date.today() - datetime.timedelta(days=days)

        # Filter orders by date
        orders = Order.objects.filter(created_at__date__gte=start_date)

        # Calculate metrics
        paid_orders = orders.filter(status="paid")
        total_revenue = paid_orders.aggregate(total=Sum("total"))["total"] or 0
        total_orders = paid_orders.count()

        # Average order value
        if total_orders > 0:
            average_order_value = float(total_revenue) / total_orders
        else:
            average_order_value = 0

        # Total customers who ordered
        total_customers = paid_orders.values("user").distinct().count()

        # Top products (from order items)
        top_products_data = (
            OrderItem.objects.filter(order__in=paid_orders)
            .values("product__name")
            .annotate(quantity=Sum("quantity"), revenue=Sum("price_at_purchase"))
            .order_by("-revenue")[:5]
        )
        top_products = [
            {
                "name": p["product__name"] or "Unknown Product",
                "quantity": p["quantity"],
                "revenue": float(p["revenue"] or 0),
            }
            for p in top_products_data
        ]

        # Orders by status
        status_counts = orders.values("status").annotate(count=Count("id"))
        orders_by_status = [
            {"status": s["status"], "count": s["count"]} for s in status_counts
        ]

        # Revenue by month (last 6 months)
        six_months_ago = datetime.date.today() - datetime.timedelta(days=180)
        monthly = (
            Order.objects.filter(status="paid", created_at__date__gte=six_months_ago)
            .extra({"month": "strftime('%Y-%m', created_at)"})
            .values("month")
            .annotate(revenue=Sum("total"))
            .order_by("month")
        )
        revenue_by_month = [
            {"month": m["month"], "revenue": float(m["revenue"] or 0)} for m in monthly
        ]

        return Response(
            {
                "totalRevenue": float(total_revenue),
                "totalOrders": total_orders,
                "averageOrderValue": round(average_order_value, 2),
                "totalCustomers": total_customers,
                "topProducts": top_products,
                "ordersByStatus": orders_by_status,
                "revenueByMonth": revenue_by_month,
                "period": f"{days} days",
            }
        )


class OrdersCSVExportView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        qs = Order.objects.all().select_related("user")
        # CSV response
        response = HttpResponse(content_type="text/csv")
        response["Content-Disposition"] = (
            f'attachment; filename="orders_{datetime.date.today().isoformat()}.csv"'
        )

        writer = csv.writer(response)
        writer.writerow(
            ["id", "user_email", "total", "status", "receipt_number", "created_at"]
        )
        for o in qs.iterator():
            writer.writerow(
                [
                    o.id,
                    o.user.email,
                    str(o.total),
                    o.status,
                    o.receipt_number,
                    o.created_at.isoformat(),
                ]
            )
        return response
