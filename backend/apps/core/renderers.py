from rest_framework.renderers import JSONRenderer


class StandardJSONRenderer(JSONRenderer):
    """
    Custom JSON Renderer enforcing the standardized API envelope:
    { "status": "success", "data": ... }

    Paginated responses are rendered as:
    { "status": "success", "data": { "results": [...], "meta": {...}, "count": N, "next": ..., "previous": ... } }

    Error responses (>= 400) are rendered as:
    { "status": "error", "error": { "message": "...", "code": "..." } }
    """

    def render(self, data, accepted_media_type=None, renderer_context=None):
        status_code = renderer_context.get('response').status_code

        # ── Error path: status >= 400 or DRF exception ──────────────────────────
        if getattr(renderer_context.get('response'), 'exception', False) or status_code >= 400:
            # Already enveloped by the custom exception handler — pass through.
            if isinstance(data, dict) and "status" in data and "error" in data:
                return super().render(data, accepted_media_type, renderer_context)

            # Direct Response({"detail": "..."}, 4xx) — wrap as standard error.
            if isinstance(data, dict) and "detail" in data:
                detail = data["detail"]
                if isinstance(detail, list):
                    message = detail[0] if detail else "An error occurred"
                else:
                    message = detail
                return super().render(
                    {"status": "error", "error": {"message": message, "code": "error"}},
                    accepted_media_type,
                    renderer_context,
                )

            # Any other non-enveloped error body.
            return super().render(
                {"status": "error", "error": {"message": str(data) if data else "An error occurred", "code": "error"}},
                accepted_media_type,
                renderer_context,
            )

        # ── Success path ───────────────────────────────────────────────────────
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
                    'meta': meta,
                    # Flatten pagination fields into data so frontend pages that
                    # read envelope.count / envelope.next / envelope.previous
                    # work without needing to know about the meta sub-object.
                    'count': meta['count'],
                    'next': meta['next'],
                    'previous': meta['previous'],
                }
            }
        else:
            # Standard single object or list responses
            response_data = {
                'status': 'success',
                'data': data
            }

        return super().render(response_data, accepted_media_type, renderer_context)
