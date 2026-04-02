"""Payment service for Stripe integration.

Handles subscription management and checkout session creation.
Requires STRIPE_SECRET_KEY to be configured.
"""

import logging

from app.core.config import settings
from app.core.exceptions import PaymentError

logger = logging.getLogger(__name__)


class PaymentService:
    """Service layer for Stripe payment operations.

    Encapsulates all Stripe API interactions behind a clean interface.
    Methods raise PaymentError if Stripe is not configured or calls fail.
    """

    @staticmethod
    async def create_checkout_session(user_id: str, price_id: str) -> str:
        """Create a Stripe Checkout session.

        Returns the checkout URL for redirect.

        Args:
            user_id: The authenticated user's ID (stored as client_reference_id).
            price_id: The Stripe Price ID for the selected plan.

        Returns:
            The Stripe Checkout session URL for client-side redirect.

        Raises:
            PaymentError: If Stripe is not configured or session creation fails.
        """
        if not settings.stripe_secret_key:
            raise PaymentError(
                "Payment processing is not configured. "
                "Please contact support."
            )

        try:
            import stripe

            stripe.api_key = settings.stripe_secret_key

            # Derive the frontend base URL from the share link base
            frontend_base = settings.share_link_base_url.replace("/share", "")

            session = stripe.checkout.Session.create(
                mode="subscription",
                line_items=[{"price": price_id, "quantity": 1}],
                success_url=f"{frontend_base}/dashboard?payment=success",
                cancel_url=f"{frontend_base}/pricing?payment=cancelled",
                client_reference_id=user_id,
            )
            return session.url
        except PaymentError:
            raise
        except Exception as e:
            logger.exception("Stripe checkout failed:")
            raise PaymentError("Failed to create checkout session.") from e

    @staticmethod
    def is_configured() -> bool:
        """Check whether Stripe payment processing is configured.

        Returns:
            True if the Stripe secret key is set, False otherwise.
        """
        return bool(settings.stripe_secret_key)
