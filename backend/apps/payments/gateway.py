"""
Payment Gateway Factory — Factory + Strategy pattern.

Resolves the correct payment gateway implementation at runtime so views never
need to import concrete gateway classes. Adding a new gateway (e.g. PayPal)
means writing a concrete strategy and registering it — no view changes needed.
"""
from __future__ import annotations
import logging
from abc import ABC, abstractmethod
from decimal import Decimal
from typing import Any, Optional

from django.db import transaction
from django.utils import timezone

from apps.orders.models import Order
from .models import Payment

logger = logging.getLogger("apps.payments")


class PaymentGateway(ABC):
    """Abstract strategy that every payment gateway must implement."""

    @abstractmethod
    def initiate(self, payment: Payment, **kwargs) -> dict[str, Any]:
        ...

    @abstractmethod
    def verify(self, payment: Payment, **kwargs) -> dict[str, Any]:
        ...

    @abstractmethod
    def cancel(self, payment: Payment, **kwargs) -> dict[str, Any]:
        ...


class MpesaGateway(PaymentGateway):
    """M-Pesa STK Push implementation — delegates to PaymentService."""

    def initiate(self, payment: Payment, **kwargs) -> dict[str, Any]:
        from .services import PaymentService, normalize_phone
        phone = normalize_phone(kwargs.get("phone") or payment.phone_number or "")
        checkout_id = PaymentService.initiate_mpesa_stk(payment, phone)
        return {"checkout_request_id": checkout_id, "status": "initiated"}

    def verify(self, payment: Payment, **kwargs) -> dict[str, Any]:
        return {
            "status": payment.status,
            "mpesa_receipt_number": payment.mpesa_receipt_number,
            "checkout_request_id": payment.checkout_request_id,
        }

    def cancel(self, payment: Payment, **kwargs) -> dict[str, Any]:
        with transaction.atomic():
            p = Payment.objects.select_for_update().get(pk=payment.pk)
            p.status = "cancelled"
            p.save(update_fields=["status", "updated_at"])
        return {"status": "cancelled"}


class MockMpesaGateway(PaymentGateway):
    """Mock M-Pesa for development when real credentials aren't configured."""

    def initiate(self, payment: Payment, **kwargs) -> dict[str, Any]:
        from .services import PaymentService, normalize_phone
        phone = normalize_phone(kwargs.get("phone") or payment.phone_number or "")
        checkout_id = PaymentService.complete_mock_mpesa_payment(payment, phone)
        return {"checkout_request_id": checkout_id, "status": "completed"}

    def verify(self, payment: Payment, **kwargs) -> dict[str, Any]:
        return {
            "status": payment.status,
            "mpesa_receipt_number": payment.mpesa_receipt_number,
        }

    def cancel(self, payment: Payment, **kwargs) -> dict[str, Any]:
        with transaction.atomic():
            p = Payment.objects.select_for_update().get(pk=payment.pk)
            p.status = "cancelled"
            p.save(update_fields=["status", "updated_at"])
        return {"status": "cancelled"}


class PesapalGateway(PaymentGateway):
    """Pesapal (M-Pesa + cards + mobile money) redirect-based gateway."""

    def initiate(self, payment: Payment, **kwargs) -> dict[str, Any]:
        from .pesapal import PesapalService

        billing = {
            "email": kwargs.get("email"),
            "phone": kwargs.get("phone") or payment.phone_number,
            "first_name": kwargs.get("first_name"),
            "last_name": kwargs.get("last_name"),
            "country_code": kwargs.get("country_code", "KE"),
        }
        result = PesapalService.submit_order(payment, billing)
        return {
            "redirect_url": result.get("redirect_url"),
            "tracking_id": result.get("order_tracking_id"),
            "status": "initiated",
        }

    def verify(self, payment: Payment, **kwargs) -> dict[str, Any]:
        from .pesapal import PesapalService

        if not payment.pesapal_tracking_id:
            return {"status": payment.status}
        try:
            status = PesapalService.get_transaction_status(payment.pesapal_tracking_id)
            return {
                "status": payment.status,
                "payment_status": status.get("payment_status"),
                "confirmation_code": status.get("confirmation_code"),
            }
        except Exception as exc:
            logger.warning("Pesapal verify failed for payment %s: %s", payment.pk, exc)
            return {"status": payment.status, "error": str(exc)}

    def cancel(self, payment: Payment, **kwargs) -> dict[str, Any]:
        from .pesapal import PesapalService

        with transaction.atomic():
            p = Payment.objects.select_for_update().get(pk=payment.pk)
            p.status = "cancelled"
            p.save(update_fields=["status", "updated_at"])
        if p.pesapal_tracking_id:
            try:
                PesapalService.cancel_order(p.pesapal_tracking_id)
            except Exception as exc:
                logger.warning("Pesapal cancel failed for payment %s: %s", payment.pk, exc)
        return {"status": "cancelled"}


class UnimplementedGateway(PaymentGateway):
    """Placeholder for future gateways (card, PayPal, bank transfer)."""

    def __init__(self, method: str):
        self._method = method

    def initiate(self, payment: Payment, **kwargs) -> dict[str, Any]:
        raise NotImplementedError(f"{self._method} payment is not yet implemented")

    def verify(self, payment: Payment, **kwargs) -> dict[str, Any]:
        raise NotImplementedError(f"{self._method} verification is not yet implemented")

    def cancel(self, payment: Payment, **kwargs) -> dict[str, Any]:
        with transaction.atomic():
            p = Payment.objects.select_for_update().get(pk=payment.pk)
            p.status = "cancelled"
            p.save(update_fields=["status", "updated_at"])
        return {"status": "cancelled"}


class PaymentGatewayFactory:
    """
    Factory — resolves the correct PaymentGateway for a given method.

    Open/Closed: registering a new gateway does not modify existing code.
    """

    _gateways: dict[str, type[PaymentGateway]] = {}

    @classmethod
    def register(cls, method: str, gateway_cls: type[PaymentGateway]) -> None:
        cls._gateways[method] = gateway_cls

    @classmethod
    def create(cls, method: str, **kwargs) -> PaymentGateway:
        gateway_cls = cls._gateways.get(method)
        if gateway_cls is not None:
            return gateway_cls(**kwargs)
        return UnimplementedGateway(method=method)


PaymentGatewayFactory.register("mpesa", MpesaGateway)
PaymentGatewayFactory.register("mock_mpesa", MockMpesaGateway)
PaymentGatewayFactory.register("pesapal", PesapalGateway)
PaymentGatewayFactory.register("paypal", lambda: UnimplementedGateway("paypal"))
PaymentGatewayFactory.register("card", lambda: UnimplementedGateway("card"))
PaymentGatewayFactory.register("bank_transfer", lambda: UnimplementedGateway("bank transfer"))
