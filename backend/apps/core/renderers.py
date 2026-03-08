from rest_framework.renderers import JSONRenderer
from rest_framework import status

class StandardJSONRenderer(JSONRenderer):
    """
    Globally wraps all DRF API responses in a standardized format:
    {
        "success": bool,
        "message": str,
        "data": dict/list/null,
        "error": dict/str/null
    }
    """
    def render(self, data, accepted_media_type=None, renderer_context=None):
        status_code = renderer_context['response'].status_code if renderer_context else 200

        # If data is already in the standardized format (e.g. from custom exception handler), return directly
        if isinstance(data, dict) and 'success' in data and 'error' in data:
            return super().render(data, accepted_media_type, renderer_context)

        response_data = {
            'success': status.is_success(status_code),
            'message': '',
            'data': None,
            'error': None
        }

        if response_data['success']:
            response_data['data'] = data
            if isinstance(data, dict):
                # Optionally extract message from data if it was explicitly returned by a view
                if 'message' in data:
                    response_data['message'] = data.pop('message')
                    # if nothing else is left in data, nullify it
                    if not data:
                        response_data['data'] = None
                elif 'detail' in data:
                    response_data['message'] = data.pop('detail')
        else:
            response_data['error'] = data
            if isinstance(data, dict):
                if 'detail' in data:
                    msg = data['detail']
                    response_data['message'] = str(msg) if not isinstance(msg, list) else str(msg[0])
                elif 'message' in data:
                    msg = data['message']
                    response_data['message'] = str(msg) if not isinstance(msg, list) else str(msg[0])
                elif data:
                    first_val = list(data.values())[0]
                    response_data['message'] = str(first_val[0]) if isinstance(first_val, list) else str(first_val)
                else:
                    response_data['message'] = 'An error occurred'
            elif isinstance(data, list) and data:
                response_data['message'] = str(data[0])
            else:
                response_data['message'] = 'An error occurred'

        return super().render(response_data, accepted_media_type, renderer_context)
