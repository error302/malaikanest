from rest_framework.renderers import JSONRenderer

class StandardJSONRenderer(JSONRenderer):
    """
    Custom JSON Renderer enforcing the standardized API envelope:
    { "status": "success", "data": ... }
    """
    def render(self, data, accepted_media_type=None, renderer_context=None):
        # Determine if response is an error (caught globally or natively)
        status_code = renderer_context.get('response').status_code
        
        # If the data is already enveloped as an error, let it pass through
        if getattr(renderer_context.get('response'), 'exception', False) or status_code >= 400:
            if isinstance(data, dict) and "status" in data and "error" in data:
                return super().render(data, accepted_media_type, renderer_context)
                
        # Handle paginated DRF responses natively
        if isinstance(data, dict) and 'results' in data and 'count' in data:
            meta = {
                'count': data.get('count'),
                'next': data.get('next'),
                'previous': data.get('previous')
            }
            results = data.get('results', [])
            response_data = {
                'status': 'success',
                'data': {
                    'results': results,
                    'meta': meta
                }
            }
        else:
            # Standard single object or list responses
            response_data = {
                'status': 'success',
                'data': data
            }
            
        return super().render(response_data, accepted_media_type, renderer_context)
