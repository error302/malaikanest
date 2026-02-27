from rest_framework import generics, permissions
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView
from django.conf import settings
from .serializers import UserSerializer, RegisterSerializer
from .models import User
import datetime


class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]


class ProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def logout_view(request):
    try:
        token = RefreshToken(request.data.get('refresh'))
        token.blacklist()
    except Exception:
        pass
    return Response({'detail': 'Logged out'})


class CookieTokenObtainPairView(TokenObtainPairView):
    """Returns access token in body and sets refresh token in httpOnly secure cookie"""

    def finalize_response(self, request, response, *args, **kwargs):
        return super().finalize_response(request, response, *args, **kwargs)

    def post(self, request, *args, **kwargs):
        resp = super().post(request, *args, **kwargs)
        # If tokens present, set refresh token as httpOnly secure cookie
        try:
            refresh = resp.data.get('refresh')
            if refresh:
                max_age = int(settings.SIMPLE_JWT.get('REFRESH_TOKEN_LIFETIME', 86400).total_seconds() if hasattr(settings.SIMPLE_JWT.get('REFRESH_TOKEN_LIFETIME'), 'total_seconds') else settings.SIMPLE_JWT.get('REFRESH_TOKEN_LIFETIME', 86400))
                expires = datetime.datetime.utcnow() + datetime.timedelta(seconds=max_age)
                resp.set_cookie(
                    settings.SIMPLE_JWT.get('AUTH_COOKIE', 'refresh_token'),
                    refresh,
                    httponly=True,
                    secure=not settings.DEBUG,
                    samesite='Lax',
                    expires=expires,
                )
                # remove refresh from body
                resp.data.pop('refresh', None)
        except Exception:
            pass
        return resp
