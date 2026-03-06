from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    initial = True

    dependencies = [
        ('orders', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='Payment',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('amount', models.DecimalField(decimal_places=2, max_digits=12)),
                ('payment_method', models.CharField(choices=[('mpesa', 'M-Pesa'), ('paypal', 'PayPal'), ('card', 'Debit/Credit Card')], default='mpesa', max_length=20)),
                ('phone', models.CharField(blank=True, max_length=20, null=True)),
                ('checkout_request_id', models.CharField(blank=True, max_length=128, null=True, unique=True)),
                ('mpesa_receipt_number', models.CharField(blank=True, max_length=128, null=True, unique=True)),
                ('paypal_transaction_id', models.CharField(blank=True, max_length=128, null=True, unique=True)),
                ('card_last_four', models.CharField(blank=True, max_length=4, null=True)),
                ('card_brand', models.CharField(blank=True, max_length=20, null=True)),
                ('status', models.CharField(choices=[('initiated', 'Initiated'), ('completed', 'Completed'), ('failed', 'Failed'), ('pending', 'Pending'), ('cancelled', 'Cancelled')], default='initiated', max_length=20)),
                ('raw_callback', models.JSONField(blank=True, null=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('order', models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name='payment', to='orders.order')),
            ],
            options={},
        ),
        migrations.CreateModel(
            name='PaymentAuditLog',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('event_type', models.CharField(choices=[('callback_received', 'Callback Received'), ('callback_blocked', 'Callback Blocked'), ('callback_unmatched', 'Callback Unmatched'), ('callback_duplicate', 'Callback Duplicate'), ('callback_failed', 'Callback Failed'), ('callback_completed', 'Callback Completed'), ('stk_initiated', 'STK Initiated'), ('stk_failed', 'STK Failed'), ('reconcile_query', 'Reconcile Query'), ('reconcile_queued', 'Reconcile Queued'), ('reconcile_completed', 'Reconcile Completed')], max_length=40)),
                ('source', models.CharField(default='system', max_length=40)),
                ('request_ip', models.GenericIPAddressField(blank=True, null=True)),
                ('checkout_request_id', models.CharField(blank=True, max_length=128, null=True)),
                ('merchant_request_id', models.CharField(blank=True, max_length=128, null=True)),
                ('result_code', models.CharField(blank=True, max_length=32, null=True)),
                ('payload_hash', models.CharField(max_length=64)),
                ('payload', models.JSONField()),
                ('notes', models.TextField(blank=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('payment', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='audit_logs', to='payments.payment')),
            ],
            options={
                'ordering': ['-created_at'],
            },
        ),
        migrations.AddIndex(
            model_name='payment',
            index=models.Index(fields=['status'], name='payments_pa_status_94f286_idx'),
        ),
        migrations.AddIndex(
            model_name='payment',
            index=models.Index(fields=['payment_method'], name='payments_pa_payment_6fbc69_idx'),
        ),
        migrations.AddIndex(
            model_name='payment',
            index=models.Index(fields=['-created_at'], name='payments_pa_created_2fb92a_idx'),
        ),
        migrations.AddIndex(
            model_name='paymentauditlog',
            index=models.Index(fields=['event_type', '-created_at'], name='payments_pa_event_t_a89056_idx'),
        ),
        migrations.AddIndex(
            model_name='paymentauditlog',
            index=models.Index(fields=['checkout_request_id'], name='payments_pa_checkou_4148f9_idx'),
        ),
        migrations.AddIndex(
            model_name='paymentauditlog',
            index=models.Index(fields=['merchant_request_id'], name='payments_pa_merchan_0f9139_idx'),
        ),
        migrations.AddIndex(
            model_name='paymentauditlog',
            index=models.Index(fields=['result_code'], name='payments_pa_result__5d9928_idx'),
        ),
        migrations.AddIndex(
            model_name='paymentauditlog',
            index=models.Index(fields=['payload_hash'], name='payments_pa_payload_393fc4_idx'),
        ),
        migrations.AddIndex(
            model_name='paymentauditlog',
            index=models.Index(fields=['-created_at'], name='payments_pa_created_d9d24a_idx'),
        ),
    ]
