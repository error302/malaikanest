SELECT id, status, payment_method, mpesa_receipt_number, paid_at
FROM orders_order
WHERE id = 12;

SELECT id, order_id, status, mpesa_checkout_request_id, mpesa_receipt_number, callback_received_at, completed_at
FROM payments_payment
WHERE order_id = 12;

SELECT event_type, result_code, notes, checkout_request_id, created_at
FROM payments_paymentauditlog
WHERE payment_id = (SELECT id FROM payments_payment WHERE order_id = 12)
ORDER BY created_at DESC
LIMIT 10;
