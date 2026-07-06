from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from ..models import Job, JobStatus


class JobListCreateTests(APITestCase):
    def test_list_empty(self):
        """GET /api/jobs/ returns an empty paginated results list when no
        jobs exist."""
        response = self.client.get(reverse("job-list"))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["count"], 0)
        self.assertEqual(response.data["results"], [])

    def test_create_job_persists_row_and_creates_pending_status(self):
        """POST /api/jobs/ writes a Job row to the database and auto-creates
        exactly one JobStatus row of type PENDING for it."""
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
        """GET /api/jobs/ embeds each job's own latest status, not another
        job's, and not an earlier status in the same job's history."""
        job_a = Job.objects.create(name="Job A")
        JobStatus.objects.create(job=job_a, status_type=JobStatus.StatusType.PENDING)
        JobStatus.objects.create(job=job_a, status_type=JobStatus.StatusType.RUNNING)

        job_b = Job.objects.create(name="Job B")
        JobStatus.objects.create(job=job_b, status_type=JobStatus.StatusType.PENDING)

        response = self.client.get(reverse("job-list"))

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        by_id = {row["id"]: row for row in response.data["results"]}
        self.assertEqual(by_id[job_a.id]["current_status"]["status_type"], "RUNNING")
        self.assertEqual(by_id[job_b.id]["current_status"]["status_type"], "PENDING")

    def test_create_job_requires_name(self):
        """POST /api/jobs/ without a name is rejected with 400 and no Job
        row is written."""
        response = self.client.post(reverse("job-list"), {})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(Job.objects.count(), 0)
