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
                f"Invalid plan '{plan}'. Choose 'pro' or 'enterprise'."
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

    Placeholder for Stripe webhook processing. Will update user tier
    on successful subscription payment events.

    Args:
        request: The raw webhook request from Stripe.

    Returns:
        JSONResponse acknowledging receipt of the webhook.
    """
    # TODO: Implement full webhook verification and event processing
    # - Verify webhook signature using settings.stripe_webhook_secret
    # - Handle checkout.session.completed -> update user tier
    # - Handle customer.subscription.deleted -> downgrade user tier
    # - Handle invoice.payment_failed -> notify user
    logger.info("Stripe webhook received (placeholder — not yet processed)")
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
