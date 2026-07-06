from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from .models import Job, JobStatus


class JobListCreateTests(APITestCase):
    def test_list_empty(self):
        response = self.client.get(reverse("job-list"))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data, [])

    def test_create_job_persists_row_and_creates_pending_status(self):
        response = self.client.post(reverse("job-list"), {"name": "Nightly ETL"})

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["name"], "Nightly ETL")
        self.assertEqual(response.data["current_status"]["status_type"], "PENDING")

        # Confirm the row actually landed in the database, not just the response.
        job = Job.objects.get(pk=response.data["id"])
        self.assertEqual(job.name, "Nightly ETL")
        self.assertEqual(job.statuses.count(), 1)
        self.assertEqual(job.statuses.first().status_type, JobStatus.StatusType.PENDING)

    def test_list_includes_current_status_for_each_job(self):
        job_a = Job.objects.create(name="Job A")
        JobStatus.objects.create(job=job_a, status_type=JobStatus.StatusType.PENDING)
        JobStatus.objects.create(job=job_a, status_type=JobStatus.StatusType.RUNNING)

        job_b = Job.objects.create(name="Job B")
        JobStatus.objects.create(job=job_b, status_type=JobStatus.StatusType.PENDING)

        response = self.client.get(reverse("job-list"))

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        by_id = {row["id"]: row for row in response.data}
        self.assertEqual(by_id[job_a.id]["current_status"]["status_type"], "RUNNING")
        self.assertEqual(by_id[job_b.id]["current_status"]["status_type"], "PENDING")

    def test_create_job_requires_name(self):
        response = self.client.post(reverse("job-list"), {})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(Job.objects.count(), 0)


class JobPatchTests(APITestCase):
    def setUp(self):
        self.job = Job.objects.create(name="Data Sync")
        JobStatus.objects.create(job=self.job, status_type=JobStatus.StatusType.PENDING)

    def test_patch_appends_new_status_without_overwriting_existing(self):
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
        url = reverse("job-detail", args=[self.job.id])
        self.client.patch(url, {"status_type": "RUNNING"})
        self.client.patch(url, {"status_type": "SUCCEEDED"})

        statuses = list(
            self.job.statuses.order_by("timestamp").values_list("status_type", flat=True)
        )
        self.assertEqual(statuses, ["PENDING", "RUNNING", "SUCCEEDED"])

    def test_patch_rejects_invalid_status_type(self):
        url = reverse("job-detail", args=[self.job.id])
        response = self.client.patch(url, {"status_type": "NOT_A_REAL_STATUS"})

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        # No new row should have been written for an invalid value.
        self.assertEqual(self.job.statuses.count(), 1)

    def test_patch_unknown_job_returns_404(self):
        url = reverse("job-detail", args=[999999])
        response = self.client.patch(url, {"status_type": "RUNNING"})
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)


class JobDeleteTests(APITestCase):
    def test_delete_removes_job_and_cascades_statuses(self):
        job = Job.objects.create(name="One-off Job")
        JobStatus.objects.create(job=job, status_type=JobStatus.StatusType.PENDING)
        JobStatus.objects.create(job=job, status_type=JobStatus.StatusType.SUCCEEDED)
        job_id = job.id

        self.assertEqual(JobStatus.objects.filter(job_id=job_id).count(), 2)

        url = reverse("job-detail", args=[job_id])
        response = self.client.delete(url)

        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Job.objects.filter(id=job_id).exists())
        self.assertEqual(JobStatus.objects.filter(job_id=job_id).count(), 0)

    def test_delete_unknown_job_returns_404(self):
        response = self.client.delete(reverse("job-detail", args=[999999]))
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
