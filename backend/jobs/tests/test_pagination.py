from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from ..models import Job


def create_jobs(count):
    Job.objects.bulk_create([Job(name=f"Job {i}") for i in range(count)])


class JobPaginationTests(APITestCase):
    def test_list_defaults_to_page_size_of_ten(self):
        """GET /api/jobs/ with no page_size returns at most 10 results per
        page, with the true total exposed via count."""
        create_jobs(15)

        response = self.client.get(reverse("job-list"))

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["count"], 15)
        self.assertEqual(len(response.data["results"]), 10)

    def test_list_second_page_returns_remaining_jobs(self):
        """GET /api/jobs/?page=2 returns the jobs not included on page 1,
        rather than repeating them or returning an empty page."""
        create_jobs(15)

        response = self.client.get(reverse("job-list"), {"page": 2})

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data["results"]), 5)

    def test_list_page_size_query_param_overrides_default(self):
        """GET /api/jobs/?page_size=3 honors a client-chosen page size
        instead of the server default of 10."""
        create_jobs(7)

        response = self.client.get(reverse("job-list"), {"page_size": 3})

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["count"], 7)
        self.assertEqual(len(response.data["results"]), 3)

    def test_list_page_size_is_capped_at_max(self):
        """A client requesting an excessively large page_size is capped at
        the server's max_page_size (100), not given every row in one page."""
        create_jobs(105)

        response = self.client.get(reverse("job-list"), {"page_size": 1000})

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["count"], 105)
        self.assertEqual(len(response.data["results"]), 100)

    def test_list_page_beyond_last_returns_404(self):
        """Requesting a page number past the last available page returns
        404, rather than an empty or wrapped-around result set."""
        create_jobs(3)

        response = self.client.get(reverse("job-list"), {"page": 999})

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
