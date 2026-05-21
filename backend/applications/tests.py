from django.test import TestCase
from applications.models import Application, Status


class WorkflowTransitionTests(TestCase):
    def setUp(self):
        self.app = Application.objects.create(
            applicant_name="Test User",
            applicant_email="test@example.com",
            company_name="Test Co",
            application_type="Renewal",
            description="Test application",
        )

    def test_default_status_is_draft(self):
        self.assertEqual(self.app.status, Status.DRAFT)

    def test_tracking_number_generated(self):
        self.assertTrue(self.app.tracking_number.startswith("TRK-"))

    def test_draft_transitions_to_submitted(self):
        self.app.status = Status.SUBMITTED
        self.app.save()
        self.assertEqual(self.app.status, Status.SUBMITTED)

    def test_submitted_transitions_to_under_review(self):
        self.app.status = Status.SUBMITTED
        self.app.save()
        self.app.status = Status.UNDER_REVIEW
        self.app.save()
        self.assertEqual(self.app.status, Status.UNDER_REVIEW)
