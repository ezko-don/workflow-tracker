import uuid
from django.db import models


class ApplicationType(models.TextChoices):
    RECORDATION = "Recordation", "Recordation"
    RENEWAL = "Renewal", "Renewal"
    CHANGE_OF_OWNERSHIP = "Change of Ownership", "Change of Ownership"
    CHANGE_OF_NAME = "Change of Name", "Change of Name"
    DISCONTINUATION = "Discontinuation", "Discontinuation"


class Status(models.TextChoices):
    DRAFT = "Draft", "Draft"
    SUBMITTED = "Submitted", "Submitted"
    UNDER_REVIEW = "Under Review", "Under Review"
    NEED_MORE_INFORMATION = "Need More Information", "Need More Information"
    APPROVED = "Approved", "Approved"
    REJECTED = "Rejected", "Rejected"


def _generate_tracking_number():
    return f"TRK-{uuid.uuid4().hex[:8].upper()}"


class Application(models.Model):
    tracking_number = models.CharField(
        max_length=20, unique=True, default=_generate_tracking_number, editable=False
    )
    applicant_name = models.CharField(max_length=255)
    applicant_email = models.EmailField()
    company_name = models.CharField(max_length=255)
    application_type = models.CharField(max_length=50, choices=ApplicationType.choices)
    description = models.TextField()
    status = models.CharField(
        max_length=30, choices=Status.choices, default=Status.DRAFT
    )
    reviewer_comment = models.TextField(blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    submitted_at = models.DateTimeField(null=True, blank=True)
    reviewed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.tracking_number} — {self.applicant_name}"
