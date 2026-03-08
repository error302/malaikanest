# Ecommerce Backend Implementation TODO

## Phase 1: Invoice Generation System
- [ ] 1.1 Add xhtml2pdf to requirements.txt
- [ ] 1.2 Create Invoice model with unique invoice number
- [ ] 1.3 Add invoice field to Order model
- [ ] 1.4 Update invoice.py PDF generation with enhanced template
- [ ] 1.5 Add GET /api/orders/:id/invoice endpoint

## Phase 2: Email Notification System
- [ ] 2.1 Create order_confirmation.html template
- [ ] 2.2 Create payment_confirmation.html with invoice attachment
- [ ] 2.3 Create order_shipped.html template
- [ ] 2.4 Create order_delivered.html template
- [ ] 2.5 Create review_request.html template
- [ ] 2.6 Implement email service in apps/core/services.py
- [ ] 2.7 Create email sending tasks

## Phase 3: Order State Machine
- [ ] 3.1 Update Order model with proper status constants
- [ ] 3.2 Add STATUS_TRANSITIONS dictionary
- [ ] 3.3 Create validate_status_transition method
- [ ] 3.4 Add status change signals/hooks

## Phase 4: Background Job Worker System
- [ ] 4.1 Create job queue tasks for:
  - [ ] Invoice generation
  - [ ] Sending order emails
  - [ ] Shipping notifications
  - [ ] Inventory updates
  - [ ] Review request emails
  - [ ] Analytics updates
- [ ] 4.2 Add retry logic
- [ ] 4.3 Add failed queue handling

## Phase 5: Product Search & Filtering
- [ ] 5.1 Add variant filters (size, color)
- [ ] 5.2 Optimize pagination
- [ ] 5.3 Add database indexes for search

## Phase 6: Admin Dashboard Support
- [ ] 6.1 View invoices list
- [ ] 6.2 Download invoice PDF
- [ ] 6.3 Resend invoice emails

