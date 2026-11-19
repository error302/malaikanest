import sys
from pathlib import Path
from types import SimpleNamespace

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from django.conf import settings

settings.configure(
    DEBUG=False,
    SECRET_KEY="static-admin-spa-tests",
    ROOT_URLCONF=__name__,
    MIDDLEWARE=[
        "django.contrib.sessions.middleware.SessionMiddleware",
        "django.middleware.common.CommonMiddleware",
        "django.middleware.csrf.CsrfViewMiddleware",
        "django.contrib.auth.middleware.AuthenticationMiddleware",
    ],
    INSTALLED_APPS=[
        "django.contrib.auth", "django.contrib.contenttypes", "django.contrib.staticfiles", "django.contrib.sessions",
        "apps.accounts", "apps.core", "apps.products", "apps.orders",
    ],
    DATABASES={"default": {"ENGINE": "django.db.backends.sqlite3", "NAME": ":memory:"}},
    STATIC_URL="/static/",
    BASE_DIR=Path(__file__).resolve().parents[1],
    STATICFILES_DIRS=[Path(__file__).resolve().parents[1] / "static"],
    MIGRATION_MODULES={key: None for key in ["auth", "contenttypes", "accounts", "core", "products", "orders"]},
    AUTH_USER_MODEL="accounts.User",
    DEFAULT_AUTO_FIELD="django.db.models.BigAutoField",
    USE_TZ=True,
    ALLOWED_HOSTS=["testserver"],
)

import django

django.setup()

from django.urls import path
from apps.storefront.admin_spa import AdminDashboardView
from apps.accounts.models import User

urlpatterns = [path("manage/dashboard/", AdminDashboardView.as_view(), name="admin_dashboard")]

from django.test import TestCase
from django.test.runner import DiscoverRunner
from django.urls import reverse


class AdminSpaShellTests(TestCase):
    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        cls.staff = User.objects.create_superuser(email="staff@example.com", phone_number="+254700000001", password="x")

    def test_anonymous_visitors_are_redirected_to_login(self):
        response = self.client.get(reverse("admin_dashboard"))
        self.assertEqual(response.status_code, 302)
        self.assertIn("/manage-store/login/", response["Location"])

    def test_authenticated_staff_get_the_spa_shell_with_built_assets(self):
        self.client.force_login(self.staff)
        response = self.client.get(reverse("admin_dashboard"))
        self.assertEqual(response.status_code, 200)
        self.assertRegex(response.content.decode(), r"static/adminapp/assets/index-[^\"]+\.js")
        self.assertIn("csrftoken", response.cookies)
        self.assertIn("no-store", response["Cache-Control"])

    def test_built_asset_files_exist_and_are_served_by_staticfiles_finders(self):
        from django.contrib.staticfiles import finders

        assets = ["adminapp/index.html"] + ["adminapp/assets/" + item.name for item in (settings.BASE_DIR / "static/adminapp/assets").iterdir()]
        self.assertGreaterEqual(len(assets), 3)
        for asset in assets:
            self.assertIsNotNone(finders.find(asset), f"{asset} should be collectable")


if __name__ == "__main__":
    sys.exit(bool(DiscoverRunner(verbosity=2).run_tests(["__main__"])))
