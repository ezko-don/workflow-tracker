from django.utils import timezone
from ninja import Router
from typing import List
from applications.models import Application, Status
from applications.schemas import (
    ApplicationCreateSchema,
    ApplicationUpdateSchema,
    ApplicationOutSchema,
    DecisionSchema,
    ErrorSchema,
)

router = Router()

EDITABLE_STATUSES = {Status.DRAFT, Status.NEED_MORE_INFORMATION}
REVIEWER_COMMENT_REQUIRED = {Status.NEED_MORE_INFORMATION, Status.REJECTED}
VALID_DECISIONS = {Status.APPROVED, Status.NEED_MORE_INFORMATION, Status.REJECTED}


@router.post("/", response={201: ApplicationOutSchema}, tags=["applications"])
def create_application(request, payload: ApplicationCreateSchema):
    app = Application.objects.create(**payload.dict())
    return 201, app


@router.get("/", response=List[ApplicationOutSchema], tags=["applications"])
def list_applications(request):
    return Application.objects.all()


@router.get("/{app_id}", response={200: ApplicationOutSchema, 404: ErrorSchema}, tags=["applications"])
def get_application(request, app_id: int):
    try:
        return 200, Application.objects.get(id=app_id)
    except Application.DoesNotExist:
        return 404, {"detail": "Application not found."}


@router.put("/{app_id}", response={200: ApplicationOutSchema, 400: ErrorSchema, 404: ErrorSchema}, tags=["applications"])
def update_application(request, app_id: int, payload: ApplicationUpdateSchema):
    try:
        app = Application.objects.get(id=app_id)
    except Application.DoesNotExist:
        return 404, {"detail": "Application not found."}

    if app.status not in EDITABLE_STATUSES:
        return 400, {"detail": f"Applications with status '{app.status}' cannot be edited."}

    for field, value in payload.dict(exclude_none=True).items():
        setattr(app, field, value)
    app.save()
    return 200, app


@router.post("/{app_id}/submit", response={200: ApplicationOutSchema, 400: ErrorSchema, 404: ErrorSchema}, tags=["applications"])
def submit_application(request, app_id: int):
    try:
        app = Application.objects.get(id=app_id)
    except Application.DoesNotExist:
        return 404, {"detail": "Application not found."}

    if app.status not in {Status.DRAFT, Status.NEED_MORE_INFORMATION}:
        return 400, {"detail": "Only Draft or Need More Information applications can be submitted."}

    app.status = Status.SUBMITTED
    app.submitted_at = timezone.now()
    app.save()
    return 200, app


@router.post("/{app_id}/review", response={200: ApplicationOutSchema, 400: ErrorSchema, 404: ErrorSchema}, tags=["applications"])
def start_review(request, app_id: int):
    try:
        app = Application.objects.get(id=app_id)
    except Application.DoesNotExist:
        return 404, {"detail": "Application not found."}

    if app.status != Status.SUBMITTED:
        return 400, {"detail": "Only Submitted applications can be moved to Under Review."}

    app.status = Status.UNDER_REVIEW
    app.save()
    return 200, app


@router.post("/{app_id}/decide", response={200: ApplicationOutSchema, 400: ErrorSchema, 404: ErrorSchema}, tags=["applications"])
def record_decision(request, app_id: int, payload: DecisionSchema):
    try:
        app = Application.objects.get(id=app_id)
    except Application.DoesNotExist:
        return 404, {"detail": "Application not found."}

    if app.status != Status.UNDER_REVIEW:
        return 400, {"detail": "Only Under Review applications can receive a decision."}

    if payload.decision not in VALID_DECISIONS:
        return 400, {"detail": f"Invalid decision '{payload.decision}'."}

    if payload.decision in REVIEWER_COMMENT_REQUIRED and not payload.reviewer_comment:
        return 400, {"detail": "A reviewer comment is required for this decision."}

    app.status = payload.decision
    app.reviewer_comment = payload.reviewer_comment or ""
    app.reviewed_at = timezone.now()
    app.save()
    return 200, app
