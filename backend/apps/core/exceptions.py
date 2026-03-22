from rest_framework.views import exception_handler
from rest_framework.exceptions import APIException
from django.core.exceptions import ValidationError as DjangoValidationError
import logging

logger = logging.getLogger('apps')

def custom_exception_handler(exc, context):
    """
    Global exception handler mapping all errors to:
    { "status": "error", "error": { "message": "...", "code": "...", "details": {} } }
    """
    response = exception_handler(exc, context)
    
    # Catch unhandled Django ValidationErrors natively mapping into DRF response
    if isinstance(exc, DjangoValidationError):
        from rest_framework import status
        from rest_framework.response import Response
        
        err_dict = {}
        if hasattr(exc, 'message_dict'):
            err_dict = exc.message_dict
        else:
            err_dict = {"non_field_errors": exc.messages}
            
        data = {
            "status": "error",
            "error": {
                "message": "Validation failed.",
                "code": "VALIDATION_ERROR",
                "details": err_dict
            }
        }
        return Response(data, status=status.HTTP_400_BAD_REQUEST)
    
    if response is not None:
        # Standard DRF exception mapping
        error_payload = {
            "status": "error",
            "error": {
                "message": str(exc),
                "code": getattr(exc, 'default_code', 'error').upper(),
                "details": response.data if isinstance(response.data, dict) else {"detail": response.data}
            }
        }
        
        if 'detail' in error_payload['error']['details']:
            error_payload['error']['message'] = error_payload['error']['details'].pop('detail')
            
        response.data = error_payload
    else:
        # Fallback 500 boundary barrier catching raw python exceptions
        logger.error(f"Unhandled Server Error: {exc}", exc_info=True)
        from rest_framework import status
        from rest_framework.response import Response
        response = Response(
            {
                "status": "error",
                "error": {
                    "message": "An unexpected server error occurred.",
                    "code": "INTERNAL_SERVER_ERROR",
                    "details": {}
                }
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

    return response
