from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from ..models import Job


class JobRetrieveTests(APITestCase):
    def test_retrieve_reflects_current_status_across_transitions(self):
        """GET /api/jobs/<id>/ re-queries current status on every call: it
        reports PENDING right after creation, then reports RUNNING after a
        separate PATCH call changes it — proving the second GET isn't
        serving a stale/cached status from the first."""
        detail_url = reverse(
            "job-detail",
            args=[self.client.post(reverse("job-list"), {"name": "Data Sync"}).data["id"]],
        )

        # 1 & 2: a freshly created job starts PENDING; retrieve must reflect that.
        response = self.client.get(detail_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["current_status"]["status_type"], "PENDING")

        # 3: transition to RUNNING via PATCH.
        patch_response = self.client.patch(detail_url, {"status_type": "RUNNING"})
        self.assertEqual(patch_response.status_code, status.HTTP_200_OK)

        # 4: a separate retrieve call must pick up RUNNING, not a stale PENDING
        # left over from step 2.
        response = self.client.get(detail_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["current_status"]["status_type"], "RUNNING")

    def test_retrieve_job_with_no_status_returns_null_current_status(self):
        """GET /api/jobs/<id>/ returns current_status: null, rather than
        erroring, for a job with zero JobStatus rows (only reachable by
        creating a Job directly via the ORM, bypassing the API's
        auto-PENDING behavior)."""
        job = Job.objects.create(name="No Status Yet")

        response = self.client.get(reverse("job-detail", args=[job.id]))

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIsNone(response.data["current_status"])

    def test_retrieve_unknown_job_returns_404(self):
        """GET /api/jobs/<id>/ for a nonexistent id returns 404."""
        response = self.client.get(reverse("job-detail", args=[999999]))
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
