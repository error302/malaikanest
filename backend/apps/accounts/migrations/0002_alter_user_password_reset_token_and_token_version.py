from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("accounts", "0001_initial"),
    ]

    operations = [
        # C1/H1 fix: password_reset_token was max_length=32 but AuthService issues
        # a 64-char token; full_clean() in save() rejected it and broke password reset.
        migrations.AlterField(
            model_name="user",
            name="password_reset_token",
            field=models.CharField(blank=True, max_length=64, null=True),
        ),
        # M5 fix: per-user token version used to revoke all JWTs on password change.
        migrations.AddField(
            model_name="user",
            name="token_version",
            field=models.PositiveIntegerField(default=1),
        ),
    ]
