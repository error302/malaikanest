import io
import logging
from datetime import datetime
from django.template.loader import render_to_string
from xhtml2pdf import pisa
from django.conf import settings

logger = logging.getLogger('apps.orders')


def generate_invoice_pdf(order):
    """
    Generate PDF invoice for an order.
    Returns bytes of the PDF file.
    """
    try:
        context = {
            'order': order,
            'company_name': 'Malaika Nest',
            'company_email': 'malaikanest7@gmail.com',
            'company_phone': '+254 726 771 321',
            'company_address': 'Mombasa, Kenya',
            'invoice_number': f'INV-{order.id:06d}',
            'invoice_date': order.created_at.strftime('%Y-%m-%d') if order.created_at else datetime.now().strftime('%Y-%m-%d'),
        }
        
        html = render_to_string('emails/invoice.html', context)
        
        result = io.BytesIO()
        pisa_status = pisa.CreatePDF(
            html,
            dest=result,
            encoding='utf-8'
        )
        
        if pisa_status.err:
            logger.error(f'PDF generation error for order {order.id}: {pisa_status.err}')
            return None
            
        return result.getvalue()
        
    except Exception as e:
        logger.exception(f'Failed to generate invoice for order {order.id}')
        return None


def generate_invoice_html(order):
    """Generate HTML invoice for an order (fallback)."""
    context = {
        'order': order,
        'company_name': 'Malaika Nest',
        'company_email': 'malaikanest7@gmail.com',
        'company_phone': '+254 726 771 321',
        'company_address': 'Mombasa, Kenya',
        'invoice_number': f'INV-{order.id:06d}',
        'invoice_date': order.created_at.strftime('%Y-%m-%d') if order.created_at else datetime.now().strftime('%Y-%m-%d'),
    }
    return render_to_string('emails/invoice.html', context)
