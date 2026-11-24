# M-Pesa Express production verification

Keep the existing Daraja live credentials, shortcode, till and callback URL. The M-Pesa Express callback accepts bounded JSON and records only validated advisory fields. Its receipt remains a reported receipt until authenticated or matched to the merchant statement. No certificate is required for this notification path.

The worker authenticates to the Daraja STK Push Query API and requires the original checkout and merchant request identifiers. The IDs are bound to the whole-KES amount server-side at initiation. The worker also checks any amount or merchant fields returned by the query. A successful authenticated query can confirm funds even when Daraja omits the receipt. The payment then appears under Confirmed and Unreconciled until the receipt is verified. If the order is already closed, confirmed funds appear for review and the order remains closed.

## Oracle rollout

Apply the additive payments migration before serving the new checkout code. Run the database-backed fast queue every minute on the lean Oracle deployment. A single runner polls every three seconds during its time window.

    * * * * * /usr/bin/flock -n /path/to/mpesa-query.lock /usr/bin/docker exec malaikanest-web-1 python manage.py process_mpesa_queries --run-seconds 50

Keep the existing 10-minute reconcile job for missed callbacks and older in-flight payments. Keep the order outbox relay enabled so confirmed orders reach the existing fulfillment workflow. The queue command makes no STK Push requests. If rolling back after accepting new checkout traffic, retain the authenticated-verification backend until its pending transactions are resolved. Never restore a build in which callbacks can mark an order paid.

## Match the statement

In Store Manager → Payments → Unreconciled, use the order, amount, initiation time, checkout ID and any reported receipt to locate the corresponding entry in the official M-Pesa merchant statement. Verify the till, amount, time and payer or order reference before linking the receipt. Resolve ambiguous matches with the merchant before recording them. An operator with shell access can record a confirmed match.

    python manage.py record_mpesa_statement_match PAYMENT_ID --receipt RECEIPT --amount AMOUNT --till TILL --statement-matched

The statement command does not mark an order paid, reopen a closed order or initiate a refund. Escalate completed payments on closed orders for review.

## Controlled live purchase

1. Obtain explicit approval for one prompt, the controlled Safaricom test phone and the exact total. Use a dedicated real product and Mombasa pickup if that keeps the verified checkout total low. The customer should approve the PIN only on their phone.
2. Place one checkout on the live site. Confirm the submitted amount and receipt match the test plan. Avoid a second checkout while the first is pending.
3. Check that the confirmation page updates, the admin records a single confirmed transaction and the order has a single paid event. Compare the receipt and amount with the merchant statement and record the match if the query omits the receipt.
4. Archive the test product after the test. Handle any reversal separately with merchant approval.
