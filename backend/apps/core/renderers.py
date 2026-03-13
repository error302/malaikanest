from rest_framework.renderers import JSONRenderer


class StandardizedJSONRenderer(JSONRenderer):
    """
    Wrap API responses in a consistent envelope:
      { success: bool, message: str, data: any, error: any }
    """

    def render(self, data, accepted_media_type=None, renderer_context=None):
        renderer_context = renderer_context or {}
        response = renderer_context.get("response")
        status_code = getattr(response, "status_code", None)

        # Let DRF render empty responses (e.g. 204) as-is.
        if data is None:
            return super().render(data, accepted_media_type, renderer_context)

        # If already standardized, don't double-wrap.
        if isinstance(data, dict) and {"success", "data", "error"}.issubset(data.keys()):
            return super().render(data, accepted_media_type, renderer_context)

        if status_code is not None and status_code >= 400:
            wrapped = {"success": False, "message": "", "data": None, "error": data}
        else:
            wrapped = {"success": True, "message": "", "data": data, "error": None}

        return super().render(wrapped, accepted_media_type, renderer_context)

