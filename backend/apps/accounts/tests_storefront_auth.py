from django.contrib.auth import get_user_model
from django.test import Client, TestCase, override_settings
from django.urls import reverse


@override_settings(ALLOWED_HOSTS=["testserver"], SECURE_SSL_REDIRECT=False)
class StorefrontAccountTests(TestCase):
    def setUp(self):
        self.client = Client(enforce_csrf_checks=True)

    def csrf_token(self):
        return self.client.cookies["csrftoken"].value

    def test_sign_out_action_ends_the_customer_session(self):
        credentials = {"username": "customer@example.test", "password": "CoralPass!793Field"}
        get_user_model().objects.create_user(
            email=credentials["username"], phone_number="+254711223344",
            password=credentials["password"],
        )
        sign_in = reverse("storefront:signin")
        account_url = reverse("storefront:account")
        sign_out = reverse("storefront:signout")
        self.client.get(sign_in)
        response = self.client.post(sign_in, credentials, HTTP_X_CSRFTOKEN=self.csrf_token())
        self.assertRedirects(response, account_url)

        account = self.client.get(account_url)
        self.assertContains(account, f'action="{sign_out}"')
        self.assertContains(account, "Sign out")
        self.assertIn("no-store", account.headers["Cache-Control"])
        self.assertEqual(self.client.get(sign_out).status_code, 405)
        self.assertEqual(self.client.post(sign_out).status_code, 403)
        self.assertEqual(self.client.get(account_url).status_code, 200)

        response = self.client.post(sign_out, HTTP_X_CSRFTOKEN=self.csrf_token(), follow=True)
        self.assertRedirects(response, sign_in)
        self.assertContains(response, "You’re signed out.")
        self.assertRedirects(self.client.get(account_url), f"{sign_in}?next={account_url}")

    def test_signup_form_creates_a_signed_in_customer(self):
        signup = reverse("storefront:signup")
        page = self.client.get(signup)
        self.assertContains(page, "account-access-frame")
        self.assertContains(page, "id_phone_number_helptext")
        password = "CoralPass!793Field"
        response = self.client.post(signup, {
            "email": "new-shopper@example.test", "phone_number": "0712445566",
            "password1": password, "password2": password,
        }, HTTP_X_CSRFTOKEN=self.csrf_token())
        self.assertRedirects(response, reverse("storefront:account"))
        account = get_user_model().objects.get(email="new-shopper@example.test")
        self.assertEqual(account.phone_number, "+254712445566")
