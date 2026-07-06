from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from ..models import Job, JobStatus


class JobPatchTests(APITestCase):
    def setUp(self):
        self.job = Job.objects.create(name="Data Sync")
        JobStatus.objects.create(job=self.job, status_type=JobStatus.StatusType.PENDING)

    def test_patch_appends_new_status_without_overwriting_existing(self):
        """PATCH /api/jobs/<id>/ with a new status_type inserts a new
        JobStatus row and leaves the prior one in place — it must never
        overwrite or delete existing status history."""
        url = reverse("job-detail", args=[self.job.id])
        response = self.client.patch(url, {"status_type": "RUNNING"})

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["current_status"]["status_type"], "RUNNING")

        # Both the original PENDING row and the new RUNNING row must exist.
        statuses = list(
            self.job.statuses.order_by("timestamp").values_list("status_type", flat=True)
        )
        self.assertEqual(statuses, ["PENDING", "RUNNING"])

    def test_patch_multiple_times_keeps_full_history(self):
        """Repeated PATCH calls accumulate a full, ordered status history
        (PENDING -> RUNNING -> SUCCEEDED) rather than only retaining the
        most recent one or two entries."""
        url = reverse("job-detail", args=[self.job.id])
        self.client.patch(url, {"status_type": "RUNNING"})
        self.client.patch(url, {"status_type": "SUCCEEDED"})

        statuses = list(
            self.job.statuses.order_by("timestamp").values_list("status_type", flat=True)
        )
        self.assertEqual(statuses, ["PENDING", "RUNNING", "SUCCEEDED"])

    def test_patch_rejects_invalid_status_type(self):
        """PATCH /api/jobs/<id>/ with a status_type outside the
        PENDING/RUNNING/SUCCEEDED/FAILED choices is rejected with 400 and
        writes no new JobStatus row."""
        url = reverse("job-detail", args=[self.job.id])
        response = self.client.patch(url, {"status_type": "NOT_A_REAL_STATUS"})

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        # No new row should have been written for an invalid value.
        self.assertEqual(self.job.statuses.count(), 1)

    def test_patch_unknown_job_returns_404(self):
        """PATCH /api/jobs/<id>/ for a nonexistent id returns 404."""
        url = reverse("job-detail", args=[999999])
        response = self.client.patch(url, {"status_type": "RUNNING"})
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
