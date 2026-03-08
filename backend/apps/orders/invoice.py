import io
import logging
from datetime import datetime

from django.conf import settings
from django.template.loader import render_to_string

try:
    from xhtml2pdf import pisa
except ImportError:
    pisa = None

try:
    from reportlab.lib.pagesizes import A4
    from reportlab.lib.units import mm
    from reportlab.pdfgen import canvas as reportlab_canvas
except ImportError:
    A4 = None
    mm = None
    reportlab_canvas = None

try:
    import magic
except ImportError:
    magic = None

logger = logging.getLogger('apps.orders')


def _get_or_create_invoice_number(order, invoice_number=None):
    from .models import Invoice

    if invoice_number:
        return invoice_number

    invoice_obj, _ = Invoice.objects.get_or_create(order=order)
    return invoice_obj.invoice_number or Invoice.generate_invoice_number()


def _build_invoice_context(order, invoice_number):
    subtotal = order.subtotal or order.total - order.delivery_fee - order.tax_amount
    tax = order.tax_amount or 0
    shipping = order.delivery_fee or 0
    discount = order.discount_amount or 0
    payment_method = order.get_payment_method_display() if order.payment_method else 'M-Pesa'
    transaction_id = order.transaction_id or order.mpesa_receipt_number or 'Pending'

    return {
        'order': order,
        'invoice_number': invoice_number,
        'invoice_date': order.paid_at.strftime('%Y-%m-%d') if order.paid_at else datetime.now().strftime('%Y-%m-%d'),
        'order_id': order.id,
        'receipt_number': order.receipt_number,
        'company_name': 'Malaika Nest',
        'company_email': 'malaikanest7@gmail.com',
        'company_phone': '+254 726 771 321',
        'company_address': 'Mombasa, Kenya',
        'customer_name': order.customer_name,
        'customer_email': order.customer_email,
        'customer_phone': order.customer_phone,
        'billing_name': order.billing_name,
        'billing_phone': order.billing_phone or order.customer_phone,
        'billing_address': order.billing_address or '',
        'billing_city': order.billing_city or '',
        'billing_region': order.billing_region or '',
        'billing_postal_code': order.billing_postal_code or '',
        'shipping_name': order.shipping_name,
        'shipping_phone': order.shipping_phone or order.customer_phone,
        'shipping_address': order.shipping_address or '',
        'shipping_city': order.shipping_city or '',
        'shipping_region': order.shipping_region or '',
        'shipping_postal_code': order.shipping_postal_code or '',
        'items': list(order.items.select_related('product').all()),
        'subtotal': subtotal,
        'tax': tax,
        'shipping': shipping,
        'discount': discount,
        'total': order.total,
        'payment_method': payment_method,
        'transaction_id': transaction_id,
        'status': order.status.upper(),
        'delivery_region': order.get_delivery_region_display(),
    }


def _generate_reportlab_invoice(context):
    if reportlab_canvas is None:
        logger.error('Neither xhtml2pdf nor reportlab is installed; invoice PDF generation is unavailable.')
        return None

    buffer = io.BytesIO()
    pdf = reportlab_canvas.Canvas(buffer, pagesize=A4)
    width, height = A4
    y = height - 20 * mm

    def line(text, *, x=20 * mm, font='Helvetica', size=10, gap=6 * mm):
        nonlocal y
        pdf.setFont(font, size)
        pdf.drawString(x, y, str(text))
        y -= gap

    def ensure_room(required=15 * mm):
        nonlocal y
        if y < required:
            pdf.showPage()
            y = height - 20 * mm

    pdf.setTitle(f"Invoice {context['invoice_number']}")

    line(context['company_name'], font='Helvetica-Bold', size=18, gap=8 * mm)
    line(context['company_address'])
    line(context['company_email'])
    line(context['company_phone'], gap=10 * mm)

    line(f"Invoice Number: {context['invoice_number']}", font='Helvetica-Bold', size=12)
    line(f"Invoice Date: {context['invoice_date']}")
    line(f"Order Reference: {context['receipt_number']}", gap=10 * mm)

    line('Bill To', font='Helvetica-Bold', size=12)
    line(context['customer_name'] or 'Guest Customer')
    if context['customer_email']:
        line(context['customer_email'])
    if context['customer_phone']:
        line(context['customer_phone'])
    if context['shipping_address']:
        line(context['shipping_address'])
    city_line = ' '.join(part for part in [context['shipping_city'], context['shipping_region'], context['shipping_postal_code']] if part)
    if city_line:
        line(city_line, gap=10 * mm)

    line('Items', font='Helvetica-Bold', size=12)
    for item in context['items']:
        ensure_room()
        line(f"{item.product.name} x {item.quantity}")
        line(f"KES {item.price} each | Line total: KES {item.price * item.quantity}", x=28 * mm)

    ensure_room(40 * mm)
    y -= 4 * mm
    line(f"Subtotal: KES {context['subtotal']}", font='Helvetica-Bold')
    line(f"Shipping: KES {context['shipping']}")
    line(f"Discount: KES {context['discount']}")
    line(f"Tax: KES {context['tax']}")
    line(f"Total: KES {context['total']}", font='Helvetica-Bold', size=12, gap=10 * mm)

    line(f"Payment Method: {context['payment_method']}")
    line(f"Transaction ID: {context['transaction_id']}")
    line(f"Order Status: {context['status']}", gap=10 * mm)
    line('Thank you for shopping with Malaika Nest.')

    pdf.showPage()
    pdf.save()
    return buffer.getvalue()


def generate_invoice_pdf(order, invoice_number=None):
    """
    Generate PDF invoice for an order.
    Returns the PDF bytes and invoice number, or (None, None) on failure.
    """
    try:
        invoice_number = _get_or_create_invoice_number(order, invoice_number)
        context = _build_invoice_context(order, invoice_number)

        if pisa is not None:
            html = render_to_string('emails/invoice.html', context)
            result = io.BytesIO()
            pisa_status = pisa.CreatePDF(html, dest=result, encoding='utf-8')
            if not pisa_status.err:
                return result.getvalue(), invoice_number
            logger.error('xhtml2pdf generation error for order %s: %s', order.id, pisa_status.err)

        pdf_content = _generate_reportlab_invoice(context)
        if pdf_content:
            return pdf_content, invoice_number

        return None, None
    except Exception as exc:
        logger.exception('Failed to generate invoice for order %s: %s', order.id, exc)
        return None, None


def save_invoice_pdf(order):
    """
    Generate and save PDF invoice to storage.
    Returns the saved invoice object.
    """
    from .models import Invoice

    try:
        invoice, _ = Invoice.objects.get_or_create(order=order)

        if not invoice.invoice_number:
            invoice.invoice_number = Invoice.generate_invoice_number()

        pdf_content, invoice_number = generate_invoice_pdf(order, invoice.invoice_number)

        if pdf_content:
            media_root = settings.MEDIA_ROOT
            invoice_dir = media_root / 'invoices' / datetime.now().strftime('%Y') / datetime.now().strftime('%m')
            invoice_dir.mkdir(parents=True, exist_ok=True)

            filename = f"{invoice_number}.pdf"
            file_path = invoice_dir / filename

            with open(file_path, 'wb') as file_handle:
                file_handle.write(pdf_content)

            invoice.invoice_number = invoice_number
            invoice.pdf_file = f'invoices/{datetime.now().strftime("%Y")}/{datetime.now().strftime("%m")}/{filename}'
            invoice.save()

            logger.info('Generated invoice %s for order %s', invoice_number, order.id)
            return invoice

        logger.error('Failed to generate PDF for order %s', order.id)
        return None

    except Exception as exc:
        logger.exception('Failed to save invoice for order %s: %s', order.id, exc)
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

