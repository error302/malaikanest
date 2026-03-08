import csv
import datetime

from django.db.models import Count, DecimalField, ExpressionWrapper, F, Sum, Value
from django.db.models.functions import Coalesce, TruncMonth
from django.http import HttpResponse
from rest_framework import status
from rest_framework.permissions import IsAdminUser
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.accounts.models import User
from apps.orders.models import Invoice, Order, OrderItem
from apps.products.models import Inventory, Product

from .invoice import generate_invoice_pdf, save_invoice_pdf


class AdminAnalyticsView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        paid_orders = Order.objects.filter(status="paid")
        total_revenue = paid_orders.aggregate(total=Coalesce(Sum("total"), Value(0, output_field=DecimalField(max_digits=14, decimal_places=2))))["total"]
        total_orders = Order.objects.count()
        pending_orders = Order.objects.filter(status="pending").count()
        total_users = User.objects.count()
        total_products = Product.objects.count()

        six_months_ago = datetime.date.today() - datetime.timedelta(days=180)
        monthly = (
            paid_orders.filter(created_at__date__gte=six_months_ago)
            .annotate(month=TruncMonth("created_at"))
            .values("month")
            .annotate(revenue=Coalesce(Sum("total"), Value(0, output_field=DecimalField(max_digits=14, decimal_places=2))), orders=Count("id"))
            .order_by("month")
        )
        monthly_data = [
            {
                "month": m["month"].strftime("%Y-%m") if m["month"] else None,
                "revenue": float(m["revenue"] or 0),
                "orders": m["orders"],
            }
            for m in monthly
        ]

        low_stock = Inventory.objects.filter(quantity__lte=5).select_related("product")[:50]
        low_stock_list = [
            {
                "product": inv.product.name,
                "available": inv.available(),
                "quantity": inv.quantity,
            }
            for inv in low_stock
        ]

        recent_orders = Order.objects.select_related("user").order_by("-created_at")[:10]
        recent_orders_list = [
            {
                "id": order.id,
                "order_number": order.receipt_number,
                "customer_name": order.customer_name,
                "customer_email": order.customer_email or "",
                "total": str(order.total),
                "status": order.status,
                "created_at": order.created_at.isoformat(),
            }
            for order in recent_orders
        ]

        return Response(
            {
                "total_revenue": float(total_revenue or 0),
                "total_orders": total_orders,
                "pending_orders": pending_orders,
                "total_users": total_users,
                "total_products": total_products,
                "monthly": monthly_data,
                "low_stock": low_stock_list,
                "recent_orders": recent_orders_list,
            }
        )


class AdminReportsView(APIView):
    """Detailed reports API with date filtering."""

    permission_classes = [IsAdminUser]

    def get(self, request):
        days = int(request.query_params.get("days", 30))
        start_date = datetime.date.today() - datetime.timedelta(days=days)

        orders = Order.objects.filter(created_at__date__gte=start_date)
        paid_orders = orders.filter(status="paid")
        total_revenue = paid_orders.aggregate(total=Coalesce(Sum("total"), Value(0, output_field=DecimalField(max_digits=14, decimal_places=2))))["total"] or 0
        total_orders = orders.count()
        paid_order_count = paid_orders.count()
        average_order_value = float(total_revenue) / paid_order_count if paid_order_count else 0

        distinct_users = set(paid_orders.exclude(user__isnull=True).values_list("user_id", flat=True))
        distinct_guests = set(
            paid_orders.filter(user__isnull=True).exclude(guest_email__isnull=True).exclude(guest_email="").values_list("guest_email", flat=True)
        )
        total_customers = len(distinct_users) + len(distinct_guests)

        top_products_rollup = {}
        for item in OrderItem.objects.filter(order__in=paid_orders).select_related("product"):
            product_name = item.product.name if item.product_id else "Unknown Product"
            bucket = top_products_rollup.setdefault(product_name, {"name": product_name, "quantity": 0, "revenue": 0.0})
            bucket["quantity"] += item.quantity
            bucket["revenue"] += float(item.price * item.quantity)

        top_products = sorted(top_products_rollup.values(), key=lambda product: (-product["revenue"], -product["quantity"], product["name"]))[:5]

        status_counts = orders.values("status").annotate(count=Count("id")).order_by("status")
        orders_by_status = [{"status": row["status"], "count": row["count"]} for row in status_counts]

        six_months_ago = datetime.date.today() - datetime.timedelta(days=180)
        monthly = (
            Order.objects.filter(status="paid", created_at__date__gte=six_months_ago)
            .annotate(month=TruncMonth("created_at"))
            .values("month")
            .annotate(revenue=Coalesce(Sum("total"), Value(0, output_field=DecimalField(max_digits=14, decimal_places=2))))
            .order_by("month")
        )
        revenue_by_month = [
            {
                "month": month["month"].strftime("%Y-%m") if month["month"] else None,
                "revenue": float(month["revenue"] or 0),
            }
            for month in monthly
        ]

        recent_transactions = [
            {
                "id": order.id,
                "order_number": order.receipt_number,
                "customer": order.customer_name,
                "amount": float(order.total),
                "status": order.status,
                "date": order.created_at.isoformat(),
            }
            for order in orders.select_related("user").order_by("-created_at")[:10]
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
                "recentTransactions": recent_transactions,
                "period": f"{days} days",
            }
        )


class OrdersCSVExportView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        response = HttpResponse(content_type="text/csv")
        response["Content-Disposition"] = f'attachment; filename="orders_{datetime.date.today().isoformat()}.csv"'

        writer = csv.writer(response)
        writer.writerow(["id", "user_email", "total", "status", "receipt_number", "created_at"])

        for order in Order.objects.select_related("user").iterator():
            writer.writerow(
                [
                    order.id,
                    order.customer_email or "",
                    str(order.total),
                    order.status,
                    order.receipt_number,
                    order.created_at.isoformat(),
                ]
            )

        return response


class InvoiceListView(APIView):
    """Admin view to list invoices in the shape expected by the dashboard."""

    permission_classes = [IsAdminUser]

    def get(self, request):
        page = max(int(request.query_params.get("page", 1)), 1)
        page_size = min(max(int(request.query_params.get("page_size", 25)), 1), 100)
        search = (request.query_params.get("search") or "").strip().lower()
        invoice_status = (request.query_params.get("invoice_status") or "").strip().lower()
        payment_status = (request.query_params.get("payment_status") or "").strip().lower()

        invoices = list(Invoice.objects.select_related("order", "order__user").order_by("-generated_at"))

        if search:
            invoices = [
                invoice
                for invoice in invoices
                if search in invoice.invoice_number.lower()
                or search in (invoice.order.customer_name or "").lower()
                or search in (invoice.order.customer_email or "").lower()
            ]

        def derived_invoice_status(invoice):
            return "sent" if invoice.sent_at else "generated"

        def derived_payment_status(invoice):
            return invoice.order.status

        if invoice_status:
            invoices = [invoice for invoice in invoices if derived_invoice_status(invoice) == invoice_status]
        if payment_status:
            invoices = [invoice for invoice in invoices if derived_payment_status(invoice) == payment_status]

        total_count = len(invoices)
        start = (page - 1) * page_size
        end = start + page_size
        invoices_page = invoices[start:end]

        results = [
            {
                "id": invoice.id,
                "invoice_number": invoice.invoice_number,
                "order": {
                    "id": invoice.order.id,
                    "order_number": invoice.order.receipt_number,
                    "customer_name": invoice.order.customer_name,
                    "customer_email": invoice.order.customer_email,
                    "total": str(invoice.order.total),
                    "status": invoice.order.status,
                },
                "subtotal": str(invoice.order.subtotal or 0),
                "tax": str(invoice.order.tax_amount or 0),
                "shipping": str(invoice.order.delivery_fee or 0),
                "total_amount": str(invoice.order.total),
                "currency": "KES",
                "payment_status": derived_payment_status(invoice),
                "invoice_status": derived_invoice_status(invoice),
                "generated_at": invoice.generated_at.isoformat() if invoice.generated_at else None,
                "sent_at": invoice.sent_at.isoformat() if invoice.sent_at else None,
                "download_count": invoice.download_count,
                "pdf_file": invoice.pdf_file.url if invoice.pdf_file else None,
            }
            for invoice in invoices_page
        ]

        return Response(
            {
                "count": total_count,
                "results": results,
                "page": page,
                "page_size": page_size,
                "total_pages": (total_count + page_size - 1) // page_size,
            }
        )


class InvoiceDetailView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request, invoice_id):
        try:
            invoice = Invoice.objects.select_related("order", "order__user").get(id=invoice_id)
        except Invoice.DoesNotExist:
            return Response({"detail": "Invoice not found"}, status=status.HTTP_404_NOT_FOUND)

        order = invoice.order
        return Response(
            {
                "id": invoice.id,
                "invoice_number": invoice.invoice_number,
                "order_id": order.id,
                "customer": {
                    "name": order.customer_name,
                    "email": order.customer_email,
                    "phone": order.customer_phone,
                },
                "billing": {
                    "name": order.billing_name,
                    "address": order.billing_address,
                    "city": order.billing_city,
                    "region": order.billing_region,
                },
                "shipping": {
                    "name": order.shipping_name,
                    "address": order.shipping_address,
                    "city": order.shipping_city,
                    "region": order.shipping_region,
                },
                "items": [
                    {
                        "name": item.product.name,
                        "quantity": item.quantity,
                        "price": float(item.price),
                        "total": float(item.price * item.quantity),
                    }
                    for item in order.items.all()
                ],
                "totals": {
                    "subtotal": float(order.subtotal or 0),
                    "tax": float(order.tax_amount or 0),
                    "shipping": float(order.delivery_fee or 0),
                    "discount": float(order.discount_amount or 0),
                    "total": float(order.total),
                },
                "payment": {
                    "method": order.get_payment_method_display() if order.payment_method else "M-Pesa",
                    "transaction_id": order.transaction_id or order.mpesa_receipt_number or "Pending",
                },
                "status": order.status,
                "dates": {
                    "created": order.created_at.isoformat(),
                    "paid": order.paid_at.isoformat() if order.paid_at else None,
                    "generated": invoice.generated_at.isoformat() if invoice.generated_at else None,
                    "sent": invoice.sent_at.isoformat() if invoice.sent_at else None,
                },
                "download_count": invoice.download_count,
                "has_pdf": bool(invoice.pdf_file),
            }
        )


class InvoiceDownloadView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request, invoice_id):
        try:
            invoice = Invoice.objects.select_related("order").get(id=invoice_id)
        except Invoice.DoesNotExist:
            return Response({"detail": "Invoice not found"}, status=status.HTTP_404_NOT_FOUND)

        if invoice.pdf_file:
            try:
                with open(invoice.pdf_file.path, "rb") as file_handle:
                    pdf_content = file_handle.read()
            except FileNotFoundError:
                pdf_content, _ = generate_invoice_pdf(invoice.order, invoice.invoice_number)
        else:
            pdf_content, _ = generate_invoice_pdf(invoice.order, invoice.invoice_number)

        if not pdf_content:
            return Response({"detail": "Failed to generate PDF"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        invoice.download_count += 1
        invoice.save(update_fields=["download_count"])

        response = HttpResponse(pdf_content, content_type="application/pdf")
        response["Content-Disposition"] = f'attachment; filename="invoice_{invoice.invoice_number}.pdf"'
        return response


class InvoiceRegenerateView(APIView):
    permission_classes = [IsAdminUser]

    def post(self, request, invoice_id):
        try:
            invoice = Invoice.objects.select_related("order").get(id=invoice_id)
        except Invoice.DoesNotExist:
            return Response({"detail": "Invoice not found"}, status=status.HTTP_404_NOT_FOUND)

        new_invoice = save_invoice_pdf(invoice.order)
        if not new_invoice:
            return Response({"detail": "Failed to regenerate invoice"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        return Response(
            {
                "detail": "Invoice regenerated successfully",
                "invoice_number": new_invoice.invoice_number,
                "pdf_url": new_invoice.pdf_file.url if new_invoice.pdf_file else None,
            }
        )


class InvoiceResendView(APIView):
    permission_classes = [IsAdminUser]

    def post(self, request, invoice_id):
        from .tasks import resend_invoice_email

        try:
            invoice = Invoice.objects.select_related("order").get(id=invoice_id)
        except Invoice.DoesNotExist:
            return Response({"detail": "Invoice not found"}, status=status.HTTP_404_NOT_FOUND)

        try:
            resend_invoice_email.delay(invoice.order.id)
            return Response({"detail": "Invoice resend queued successfully"})
        except Exception as exc:
            return Response({"detail": f"Failed to queue email: {exc}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)



