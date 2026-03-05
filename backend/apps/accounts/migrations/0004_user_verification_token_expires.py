from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0003_user_email_verified_user_verification_token'),
    ]

    operations = [
        migrations.AddField(
            model_name='user',
            name='verification_token_expires',
            field=models.DateTimeField(blank=True, null=True),
        ),
    ]
