from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from ..models import Job, JobStatus


class JobDeleteTests(APITestCase):
    def test_delete_removes_job_and_cascades_statuses(self):
        """DELETE /api/jobs/<id>/ removes the Job row and cascades to
        delete every JobStatus row that referenced it — none may be left
        as orphaned rows."""
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
        """DELETE /api/jobs/<id>/ for a nonexistent id returns 404."""
        response = self.client.delete(reverse("job-detail", args=[999999]))
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
