from rest_framework.views import APIView
from rest_framework.permissions import IsAdminUser
from rest_framework.response import Response
from rest_framework import status
from django.db.models import Sum, Count, Q
from django.db.models.functions import TruncMonth
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
            .annotate(month=TruncMonth("created_at"))
            .values("month")
            .annotate(revenue=Sum("total"), orders=Count("id"))
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
            .annotate(month=TruncMonth("created_at"))
            .values("month")
            .annotate(revenue=Sum("total"))
            .order_by("month")
        )
        revenue_by_month = [
            {"month": m["month"].strftime("%Y-%m") if m["month"] else None, "revenue": float(m["revenue"] or 0)}
            for m in monthly
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


# ==================== INVOICE ADMIN VIEWS ====================

from .models import Invoice
from .invoice import generate_invoice_pdf, save_invoice_pdf
from django.core.files.base import ContentFile


class InvoiceListView(APIView):
    """
    Admin view to list all invoices.
    """
    permission_classes = [IsAdminUser]
    
    def get(self, request):
        page = int(request.query_params.get('page', 1))
        page_size = int(request.query_params.get('page_size', 25))
        
        invoices = Invoice.objects.select_related('order', 'order__user').order_by('-generated_at')
        
        total_count = invoices.count()
        
        # Paginate
        start = (page - 1) * page_size
        end = start + page_size
        invoices_page = invoices[start:end]
        
        invoice_list = []
        for inv in invoices_page:
            invoice_list.append({
                'id': inv.id,
                'invoice_number': inv.invoice_number,
                'order_id': inv.order.id,
                'customer_email': inv.order.customer_email,
                'customer_name': inv.order.customer_name,
                'total': float(inv.order.total),
                'status': inv.order.status,
                'generated_at': inv.generated_at.isoformat() if inv.generated_at else None,
                'sent_at': inv.sent_at.isoformat() if inv.sent_at else None,
                'download_count': inv.download_count,
                'has_pdf': bool(inv.pdf_file),
            })
        
        return Response({
            'invoices': invoice_list,
            'total_count': total_count,
            'page': page,
            'page_size': page_size,
            'total_pages': (total_count + page_size - 1) // page_size,
        })


class InvoiceDetailView(APIView):
    """
    Admin view to get invoice details.
    """
    permission_classes = [IsAdminUser]
    
    def get(self, request, invoice_id):
        try:
            invoice = Invoice.objects.select_related('order', 'order__user').get(id=invoice_id)
        except Invoice.DoesNotExist:
            return Response({'detail': 'Invoice not found'}, status=status.HTTP_404_NOT_FOUND)
        
        order = invoice.order
        
        return Response({
            'id': invoice.id,
            'invoice_number': invoice.invoice_number,
            'order_id': order.id,
            'customer': {
                'name': order.customer_name,
                'email': order.customer_email,
                'phone': order.customer_phone,
            },
            'billing': {
                'name': order.billing_name,
                'address': order.billing_address,
                'city': order.billing_city,
                'region': order.billing_region,
            },
            'shipping': {
                'name': order.shipping_name,
                'address': order.shipping_address,
                'city': order.shipping_city,
                'region': order.shipping_region,
            },
            'items': [
                {
                    'name': item.product.name,
                    'quantity': item.quantity,
                    'price': float(item.price),
                    'total': float(item.price * item.quantity),
                }
                for item in order.items.all()
            ],
            'totals': {
                'subtotal': float(order.subtotal or 0),
                'tax': float(order.tax_amount or 0),
                'shipping': float(order.delivery_fee or 0),
                'discount': float(order.discount_amount or 0),
                'total': float(order.total),
            },
            'payment': {
                'method': order.get_payment_method_display() if order.payment_method else 'M-Pesa',
                'transaction_id': order.transaction_id or order.mpesa_receipt_number or 'Pending',
            },
            'status': order.status,
            'dates': {
                'created': order.created_at.isoformat(),
                'paid': order.paid_at.isoformat() if order.paid_at else None,
                'generated': invoice.generated_at.isoformat() if invoice.generated_at else None,
                'sent': invoice.sent_at.isoformat() if invoice.sent_at else None,
            },
            'download_count': invoice.download_count,
            'has_pdf': bool(invoice.pdf_file),
        })


class InvoiceDownloadView(APIView):
    """
    Admin view to download invoice PDF.
    """
    permission_classes = [IsAdminUser]
    
    def get(self, request, invoice_id):
        from django.http import HttpResponse
        
        try:
            invoice = Invoice.objects.select_related('order').get(id=invoice_id)
        except Invoice.DoesNotExist:
            return Response({'detail': 'Invoice not found'}, status=status.HTTP_404_NOT_FOUND)
        
        order = invoice.order
        
        # Generate or get PDF
        if invoice.pdf_file:
            # Serve existing PDF
            try:
                with open(invoice.pdf_file.path, 'rb') as f:
                    pdf_content = f.read()
            except FileNotFoundError:
                # Generate new if file not found
                pdf_result, inv_num = generate_invoice_pdf(order, invoice.invoice_number)
                if pdf_result:
                    pdf_content = pdf_result
                else:
                    return Response({'detail': 'Failed to generate PDF'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        else:
            # Generate new PDF
            pdf_result, inv_num = generate_invoice_pdf(order, invoice.invoice_number)
            if pdf_result:
                pdf_content = pdf_result
            else:
                return Response({'detail': 'Failed to generate PDF'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        # Update download count
        invoice.download_count += 1
        invoice.save(update_fields=['download_count'])
        
        response = HttpResponse(pdf_content, content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="invoice_{invoice.invoice_number}.pdf"'
        return response


class InvoiceRegenerateView(APIView):
    """
    Admin view to regenerate invoice PDF.
    """
    permission_classes = [IsAdminUser]
    
    def post(self, request, invoice_id):
        try:
            invoice = Invoice.objects.select_related('order').get(id=invoice_id)
        except Invoice.DoesNotExist:
            return Response({'detail': 'Invoice not found'}, status=status.HTTP_404_NOT_FOUND)
        
        order = invoice.order
        
        # Regenerate PDF
        new_invoice = save_invoice_pdf(order)
        
        if new_invoice:
            return Response({
                'detail': 'Invoice regenerated successfully',
                'invoice_number': new_invoice.invoice_number,
                'pdf_url': new_invoice.pdf_file.url if new_invoice.pdf_file else None,
            })
        else:
            return Response({'detail': 'Failed to regenerate invoice'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class InvoiceResendView(APIView):
    """
    Admin view to resend invoice email to customer.
    """
    permission_classes = [IsAdminUser]
    
    def post(self, request, invoice_id):
        from .tasks import resend_invoice_email
        
        try:
            invoice = Invoice.objects.select_related('order').get(id=invoice_id)
        except Invoice.DoesNotExist:
            return Response({'detail': 'Invoice not found'}, status=status.HTTP_404_NOT_FOUND)
        
        order = invoice.order
        
        # Queue the resend task
        try:
            resend_invoice_email.delay(order.id)
            return Response({'detail': 'Invoice resend queued successfully'})
        except Exception as e:
            return Response({'detail': f'Failed to queue email: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
