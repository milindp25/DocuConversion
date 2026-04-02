"""Payment API endpoints.

Handles Stripe checkout session creation and webhook processing
for subscription management.
"""

import logging

from fastapi import APIRouter, Depends, Form, Request
from fastapi.responses import JSONResponse

from app.core.auth import UserClaims
from app.core.dependencies import get_current_user
from app.core.config import settings
from app.core.exceptions import PaymentError, handle_docuconversion_error
from app.services.payment import PaymentService

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("/create-checkout")
async def create_checkout(
    plan: str = Form(...),
    user: UserClaims = Depends(get_current_user),
) -> JSONResponse:
    """Create a Stripe Checkout session for the given plan.

    Maps the plan name to the corresponding Stripe Price ID and creates
    a checkout session. Returns the Stripe-hosted checkout URL.

    Args:
        plan: The subscription plan ("pro" or "enterprise").
        user: The authenticated user (injected via dependency).

    Returns:
        JSONResponse with the checkout URL for client-side redirect.

    Raises:
        HTTPException: 400 if plan is invalid, 402 if Stripe not configured.
    """
    try:
        # Map plan names to Stripe price IDs
        price_map = {
            "pro": settings.stripe_pro_price_id,
            "enterprise": settings.stripe_enterprise_price_id,
        }

        price_id = price_map.get(plan)
        if not price_id:
            raise PaymentError(
                "Invalid plan. Choose 'pro' or 'enterprise'."
            )

        checkout_url = await PaymentService.create_checkout_session(
            user_id=user.user_id,
            price_id=price_id,
        )

        return JSONResponse(
            content={"checkout_url": checkout_url},
            status_code=200,
        )
    except PaymentError as e:
        raise handle_docuconversion_error(e) from e


@router.post("/webhook")
async def stripe_webhook(request: Request) -> JSONResponse:
    """Handle Stripe webhook events.

    Verifies the Stripe signature before processing to prevent forged
    events. Currently logs verified events; event-specific handling
    (tier upgrades, downgrades) will be added in a future phase.

    Args:
        request: The raw webhook request from Stripe.

    Returns:
        JSONResponse acknowledging receipt of the webhook.
    """
    import stripe

    webhook_secret = settings.stripe_webhook_secret
    if not webhook_secret:
        logger.warning("Stripe webhook received but STRIPE_WEBHOOK_SECRET is not configured — rejecting")
        return JSONResponse(content={"detail": "Webhook not configured"}, status_code=503)

    body = await request.body()
    sig_header = request.headers.get("stripe-signature")
    if not sig_header:
        return JSONResponse(content={"detail": "Missing stripe-signature header"}, status_code=400)

    try:
        event = stripe.Webhook.construct_event(body, sig_header, webhook_secret)
    except stripe.error.SignatureVerificationError:
        logger.warning("Stripe webhook signature verification failed")
        return JSONResponse(content={"detail": "Invalid signature"}, status_code=400)
    except ValueError:
        logger.warning("Stripe webhook payload could not be parsed")
        return JSONResponse(content={"detail": "Invalid payload"}, status_code=400)

    # TODO: Handle specific event types
    # - checkout.session.completed -> update user tier
    # - customer.subscription.deleted -> downgrade user tier
    # - invoice.payment_failed -> notify user
    logger.info("Stripe webhook verified: type=%s id=%s", event["type"], event["id"])
    return JSONResponse(content={"received": True}, status_code=200)


@router.get("/status")
async def payment_status() -> JSONResponse:
    """Check whether Stripe payment processing is configured.

    Used by the frontend to enable/disable checkout buttons.

    Returns:
        JSONResponse indicating whether payments are available.
    """
    return JSONResponse(
        content={"configured": PaymentService.is_configured()},
        status_code=200,
    )
