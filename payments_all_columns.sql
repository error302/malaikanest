SELECT 'payments_payment' AS table_name, column_name, data_type
FROM information_schema.columns
WHERE table_name = 'payments_payment'
UNION ALL
SELECT 'payments_paymentauditlog' AS table_name, column_name, data_type
FROM information_schema.columns
WHERE table_name = 'payments_paymentauditlog'
ORDER BY table_name, column_name;
