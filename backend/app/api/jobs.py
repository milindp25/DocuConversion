"""
Job status API endpoints.

Provides polling endpoints for frontend clients to check on the
progress and results of processing jobs.
"""

import logging

from fastapi import APIRouter, Depends, HTTPException, Request, status

from app.core.auth import UserClaims
from app.core.dependencies import get_optional_user
from app.core.rate_limiter import get_usage
from app.models.schemas import JobStatusResponse
from app.services.job_manager import job_manager

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/status/{job_id}", response_model=JobStatusResponse)
async def get_job_status(job_id: str) -> JobStatusResponse:
    """Poll for the status of a processing job.

    Returns the current status, progress percentage, and download URL
    (when complete) for the given job ID. The frontend should poll this
    endpoint until status is 'completed' or 'failed'.

    Args:
        job_id: The unique job identifier returned by a processing endpoint.

    Returns:
        JobStatusResponse with current status and progress.

    Raises:
        HTTPException: 404 if the job ID is not found.
    """
    job = job_manager.get_job(job_id)

    if job is None:
        logger.warning("Job status requested for unknown job: %s", job_id)
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Job '{job_id}' not found. It may have expired or never existed.",
        )

    logger.debug("Job status queried: %s -> %s (%d%%)", job_id, job.status, job.progress)
    return job.to_response()


@router.get("/usage")
async def get_usage_stats(
    request: Request,
    user: UserClaims | None = Depends(get_optional_user),
) -> dict:
    """Get current daily usage stats for the user.

    Returns the number of operations used today, the daily limit,
    and remaining operations based on the user's subscription tier.

    Args:
        request: The incoming FastAPI request.
        user: The authenticated user, or None for anonymous access.

    Returns:
        Dictionary with tier, used, limit, and remaining counts.
    """
    tier = user.tier if user else "anonymous"
    client_ip = request.client.host if request.client else "unknown"
    user_id = user.user_id if user else None

    usage = get_usage(user_id, tier, client_ip)
    return {"tier": tier, **usage}
