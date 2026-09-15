from django.template.loader import render_to_string
from django.test import SimpleTestCase
from django.contrib.staticfiles import finders
from django.contrib import admin
from pathlib import Path


class AdminThemeTests(SimpleTestCase):
    def test_admin_assets_match_the_installed_django_templates(self):
        expected = Path(admin.__file__).parent / 'static' / 'admin' / 'css' / 'base.css'
        self.assertEqual(Path(finders.find('admin/css/base.css')).resolve(), expected.resolve())

    def test_related_object_popup_keeps_its_content(self):
        html = render_to_string("admin/base.html", {"is_popup": True, "content": "Related item editor"})
        self.assertIn("Related item editor", html)

    def test_admin_has_keyboard_skip_link(self):
        html = render_to_string("admin/base.html", {"is_popup": False})
        self.assertIn('href="#content-start"', html)

    def test_sidebar_toggle_is_available_for_staff(self):
        html = render_to_string("admin/base.html", {"is_popup": False, "is_nav_sidebar_enabled": True})
        self.assertIn('id="toggle-nav-sidebar"', html)
