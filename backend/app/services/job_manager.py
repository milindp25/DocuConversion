"""
In-memory job tracking for Phase 1.

Manages processing jobs with their status, progress, and results.
In Phase 2 this will be replaced with a Celery + PostgreSQL backed queue
for true background processing and persistence across restarts.
"""

import logging
import secrets
import uuid
from dataclasses import dataclass, field
from datetime import datetime, timedelta, timezone
from typing import ClassVar

from app.models.schemas import JobStatus, JobStatusResponse

logger = logging.getLogger(__name__)

# Maximum number of jobs to keep in memory before evicting old ones
MAX_JOBS = 10000

# Number of oldest jobs to remove when the limit is exceeded
_EVICTION_BATCH = 1000

# Jobs older than this are considered stale and eligible for cleanup
_STALE_THRESHOLD = timedelta(hours=1)


@dataclass
class JobRecord:
    """Internal record for a single processing job.

    Attributes:
        job_id: Unique identifier for the job.
        filename: Original name of the uploaded file.
        client_token: Random token for ownership verification.
        status: Current processing status.
        progress: Completion percentage (0-100).
        message: Human-readable status message.
        download_url: Pre-signed URL to the result (set on completion).
        error_message: Description of what went wrong (set on failure).
        created_at: When the job was created.
        updated_at: When the job was last updated.
    """

    job_id: str
    filename: str
    client_token: str
    status: JobStatus = JobStatus.PROCESSING
    progress: int = 0
    message: str = ""
    download_url: str | None = None
    error_message: str | None = None
    user_id: str | None = None
    created_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))

    def to_response(self) -> JobStatusResponse:
        """Convert this record to an API response schema.

        Returns:
            JobStatusResponse suitable for returning from an API endpoint.
        """
        return JobStatusResponse(
            job_id=self.job_id,
            status=self.status,
            progress=self.progress,
            download_url=self.download_url,
            error_message=self.error_message,
        )


class JobManager:
    """In-memory job tracking for Phase 1.

    Tracks processing jobs with their status and results. In Phase 2,
    this will be replaced with a Celery + PostgreSQL backed queue.

    The class uses a class-level dict so all instances share the same
    job store within a single process. This is acceptable for Phase 1
    where we run a single-process server.
    """

    _jobs: ClassVar[dict[str, JobRecord]] = {}

    def cleanup_stale_jobs(self) -> int:
        """Remove jobs older than the stale threshold.

        Returns:
            The number of jobs removed.
        """
        now = datetime.now(timezone.utc)
        stale_ids = [
            jid
            for jid, job in self._jobs.items()
            if now - job.created_at > _STALE_THRESHOLD
        ]
        for jid in stale_ids:
            del self._jobs[jid]
        if stale_ids:
            logger.info("Cleaned up %d stale jobs", len(stale_ids))
        return len(stale_ids)

    def _evict_oldest(self) -> None:
        """Remove the oldest batch of jobs when the store exceeds MAX_JOBS."""
        sorted_ids = sorted(
            self._jobs, key=lambda jid: self._jobs[jid].created_at
        )
        for jid in sorted_ids[:_EVICTION_BATCH]:
            del self._jobs[jid]
        logger.info(
            "Evicted %d oldest jobs (store size was %d)",
            min(_EVICTION_BATCH, len(sorted_ids)),
            len(self._jobs) + min(_EVICTION_BATCH, len(sorted_ids)),
        )

    def create_job(self, filename: str, user_id: str | None = None) -> tuple[str, str]:
        """Create a new job and return its ID and client token.

        Performs stale-job cleanup on every call and evicts the oldest
        batch if the store exceeds MAX_JOBS.

        Args:
            filename: The original name of the uploaded file.
            user_id: Optional authenticated user ID for tracking ownership.

        Returns:
            A tuple of (job_id, client_token). The client_token must be
            presented when polling for job status to prove ownership.
        """
        self.cleanup_stale_jobs()

        if len(self._jobs) > MAX_JOBS:
            self._evict_oldest()

        job_id = str(uuid.uuid4())
        client_token = secrets.token_urlsafe(32)
        self._jobs[job_id] = JobRecord(
            job_id=job_id,
            filename=filename,
            client_token=client_token,
            status=JobStatus.PROCESSING,
            progress=0,
            message=f"Processing '{filename}'...",
            user_id=user_id,
        )
        logger.info("Job created: %s for file '%s' (user=%s)", job_id, filename, user_id)
        return job_id, client_token

    def update_progress(self, job_id: str, progress: int, message: str) -> None:
        """Update job progress percentage and status message.

        Args:
            job_id: The job identifier.
            progress: Completion percentage (0-100).
            message: Human-readable progress message.
        """
        job = self._jobs.get(job_id)
        if job is None:
            logger.warning("Attempted to update non-existent job: %s", job_id)
            return

        job.progress = min(max(progress, 0), 100)
        job.message = message
        job.updated_at = datetime.now(timezone.utc)
        logger.debug("Job %s progress: %d%% - %s", job_id, progress, message)

    def complete_job(self, job_id: str, download_url: str) -> None:
        """Mark a job as completed with a download URL.

        Args:
            job_id: The job identifier.
            download_url: Pre-signed URL where the result can be downloaded.
        """
        job = self._jobs.get(job_id)
        if job is None:
            logger.warning("Attempted to complete non-existent job: %s", job_id)
            return

        job.status = JobStatus.COMPLETED
        job.progress = 100
        job.download_url = download_url
        job.message = "Processing complete. Your file is ready for download."
        job.updated_at = datetime.now(timezone.utc)
        logger.info("Job completed: %s -> %s", job_id, download_url)

    def fail_job(self, job_id: str, error_message: str) -> None:
        """Mark a job as failed with an error description.

        Args:
            job_id: The job identifier.
            error_message: Human-readable description of what went wrong.
        """
        job = self._jobs.get(job_id)
        if job is None:
            logger.warning("Attempted to fail non-existent job: %s", job_id)
            return

        job.status = JobStatus.FAILED
        job.error_message = error_message
        job.message = f"Processing failed: {error_message}"
        job.updated_at = datetime.now(timezone.utc)
        logger.error("Job failed: %s - %s", job_id, error_message)

    def get_job(self, job_id: str, token: str | None = None) -> JobRecord | None:
        """Get job status by ID, optionally verifying ownership.

        Args:
            job_id: The job identifier.
            token: Optional client token for ownership verification. If
                provided, the job is only returned when the token matches.

        Returns:
            The JobRecord if found (and token matches, if given), or None.
        """
        job = self._jobs.get(job_id)
        if job is None:
            return None
        if token is not None and not secrets.compare_digest(job.client_token, token):
            logger.warning("Token mismatch for job %s", job_id)
            return None
        return job


# Module-level singleton for use across the application
job_manager = JobManager()
