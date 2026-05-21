from datetime import datetime
from typing import Optional
from ninja import Schema
from applications.models import ApplicationType, Status


class ApplicationCreateSchema(Schema):
    applicant_name: str
    applicant_email: str
    company_name: str
    application_type: ApplicationType
    description: str


class ApplicationUpdateSchema(Schema):
    applicant_name: Optional[str] = None
    applicant_email: Optional[str] = None
    company_name: Optional[str] = None
    application_type: Optional[ApplicationType] = None
    description: Optional[str] = None


class DecisionSchema(Schema):
    decision: Status
    reviewer_comment: Optional[str] = ""


class ApplicationOutSchema(Schema):
    id: int
    tracking_number: str
    applicant_name: str
    applicant_email: str
    company_name: str
    application_type: str
    description: str
    status: str
    reviewer_comment: str
    created_at: datetime
    updated_at: datetime
    submitted_at: Optional[datetime]
    reviewed_at: Optional[datetime]


class ErrorSchema(Schema):
    detail: str
