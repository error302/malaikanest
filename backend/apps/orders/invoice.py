import io
import logging
import os
from datetime import datetime
from django.template.loader import render_to_string
from django.conf import settings
from xhtml2pdf import pisa
# magic is optional - used for file type detection but not required
try:
    import magic
except ImportError:
    magic = None

logger = logging.getLogger('apps.orders')


def generate_invoice_pdf(order, invoice_number=None):
    """
    Generate PDF invoice for an order.
    Returns bytes of the PDF file.
    """
    try:
        # Get or create invoice number
        if not invoice_number:
            from .models import Invoice
            invoice_obj, created = Invoice.objects.get_or_create(order=order)
            invoice_number = invoice_obj.invoice_number if invoice_obj.invoice_number else Invoice.generate_invoice_number()
        else:
            invoice_number = invoice_number
        
        # Get customer details
        customer_name = order.customer_name
        customer_email = order.customer_email
        customer_phone = order.customer_phone
        
        # Get billing address
        billing_info = {
            'name': order.billing_name,
            'phone': order.billing_phone or customer_phone,
            'address': order.billing_address or '',
            'city': order.billing_city or '',
            'region': order.billing_region or '',
            'postal_code': order.billing_postal_code or '',
        }
        
        # Get shipping address
        shipping_info = {
            'name': order.shipping_name,
            'phone': order.shipping_phone or customer_phone,
            'address': order.shipping_address or '',
            'city': order.shipping_city or '',
            'region': order.shipping_region or '',
            'postal_code': order.shipping_postal_code or '',
        }
        
        # Calculate totals
        subtotal = order.subtotal or order.total - order.delivery_fee - order.tax_amount
        tax = order.tax_amount or 0
        shipping = order.delivery_fee or 0
        discount = order.discount_amount or 0
        
        # Get payment info
        payment_method = order.get_payment_method_display() if order.payment_method else 'M-Pesa'
        transaction_id = order.transaction_id or order.mpesa_receipt_number or 'Pending'
        
        context = {
            'order': order,
            'invoice_number': invoice_number,
            'invoice_date': order.paid_at.strftime('%Y-%m-%d') if order.paid_at else datetime.now().strftime('%Y-%m-%d'),
            'order_id': order.id,
            'receipt_number': order.receipt_number,
            
            # Company info
            'company_name': 'Malaika Nest',
            'company_email': 'malaikanest7@gmail.com',
            'company_phone': '+254 726 771 321',
            'company_address': 'Mombasa, Kenya',
            
            # Customer info
            'customer_name': customer_name,
            'customer_email': customer_email,
            'customer_phone': customer_phone,
            
            # Billing info
            'billing_name': billing_info['name'],
            'billing_phone': billing_info['phone'],
            'billing_address': billing_info['address'],
            'billing_city': billing_info['city'],
            'billing_region': billing_info['region'],
            'billing_postal_code': billing_info['postal_code'],
            
            # Shipping info
            'shipping_name': shipping_info['name'],
            'shipping_phone': shipping_info['phone'],
            'shipping_address': shipping_info['address'],
            'shipping_city': shipping_info['city'],
            'shipping_region': shipping_info['region'],
            'shipping_postal_code': shipping_info['postal_code'],
            
            # Order items
            'items': order.items.select_related('product').all(),
            
            # Totals
            'subtotal': subtotal,
            'tax': tax,
            'shipping': shipping,
            'discount': discount,
            'total': order.total,
            
            # Payment info
            'payment_method': payment_method,
            'transaction_id': transaction_id,
            
            # Additional info
            'status': order.status.upper(),
            'delivery_region': order.get_delivery_region_display(),
        }
        
        html = render_to_string('emails/invoice.html', context)
        
        # Generate PDF
        result = io.BytesIO()
        pisa_status = pisa.CreatePDF(
            html,
            dest=result,
            encoding='utf-8'
        )
        
        if pisa_status.err:
            logger.error(f'PDF generation error for order {order.id}: {pisa_status.err}')
            return None
            
        return result.getvalue(), invoice_number
        
    except Exception as e:
        logger.exception(f'Failed to generate invoice for order {order.id}: {e}')
        return None, None


def save_invoice_pdf(order):
    """
    Generate and save PDF invoice to storage.
    Returns the saved invoice object.
    """
    from .models import Invoice
    
    try:
        # Get or create invoice record
        invoice, created = Invoice.objects.get_or_create(order=order)
        
        # Generate invoice number if not exists
        if not invoice.invoice_number:
            invoice.invoice_number = Invoice.generate_invoice_number()
        
        # Generate PDF
        pdf_content, invoice_number = generate_invoice_pdf(order, invoice.invoice_number)
        
        if pdf_content:
            # Save to media directory
            media_root = settings.MEDIA_ROOT
            invoice_dir = media_root / 'invoices' / datetime.now().strftime('%Y') / datetime.now().strftime('%m')
            invoice_dir.mkdir(parents=True, exist_ok=True)
            
            filename = f"{invoice_number}.pdf"
            file_path = invoice_dir / filename
            
            with open(file_path, 'wb') as f:
                f.write(pdf_content)
            
            # Update invoice record
            invoice.pdf_file = f'invoices/{datetime.now().strftime("%Y")}/{datetime.now().strftime("%m")}/{filename}'
            invoice.save()
            
            logger.info(f"Generated invoice {invoice_number} for order {order.id}")
            return invoice
        else:
            logger.error(f"Failed to generate PDF for order {order.id}")
            return None
            
    except Exception as e:
        logger.exception(f"Failed to save invoice for order {order.id}: {e}")
        return None


def generate_invoice_html(order):
    """Generate HTML invoice for an order (fallback)."""
    from .models import Invoice
    
    invoice_obj, _ = Invoice.objects.get_or_create(order=order)
    invoice_number = invoice_obj.invoice_number or Invoice.generate_invoice_number()
    
    context = {
        'order': order,
        'company_name': 'Malaika Nest',
        'company_email': 'malaikanest7@gmail.com',
        'company_phone': '+254 726 771 321',
        'company_address': 'Mombasa, Kenya',
        'invoice_number': invoice_number,
        'invoice_date': order.paid_at.strftime('%Y-%m-%d') if order.paid_at else datetime.now().strftime('%Y-%m-%d'),
    }
    return render_to_string('emails/invoice.html', context)


def get_invoice_pdf_url(invoice):
    """Get the full URL for an invoice PDF."""
    if invoice and invoice.pdf_file:
        base_url = settings.MEDIA_URL if hasattr(settings, 'MEDIA_URL') else '/media/'
        return f"{base_url}{invoice.pdf_file}"
    return None

