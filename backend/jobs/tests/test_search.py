from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from ..models import Job


class JobSearchTests(APITestCase):
    def setUp(self):
        Job.objects.create(name="Nightly ETL Pipeline")
        Job.objects.create(name="Weekly Report Generation")
        Job.objects.create(name="Job1")
        Job.objects.create(name="Job2")
        Job.objects.create(name="Task3")

    def names(self, response):
        return {job["name"] for job in response.data["results"]}

    def test_search_matches_substring_case_insensitively(self):
        """?search=etl matches "Nightly ETL Pipeline" despite the case
        difference, and excludes jobs that don't contain the substring."""
        response = self.client.get(reverse("job-list"), {"search": "etl"})

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(self.names(response), {"Nightly ETL Pipeline"})

    def test_search_supports_regex_patterns(self):
        """A real regex pattern (not just a literal substring) is honored,
        e.g. anchoring and character classes."""
        response = self.client.get(reverse("job-list"), {"search": r"^Job\d$"})

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(self.names(response), {"Job1", "Job2"})

    def test_search_with_no_matches_returns_empty_results(self):
        """A well-formed pattern that matches nothing returns an empty
        results list with count 0, not an error."""
        response = self.client.get(reverse("job-list"), {"search": "nonexistent-xyz"})

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["count"], 0)
        self.assertEqual(response.data["results"], [])

    def test_search_with_invalid_regex_returns_400(self):
        """A malformed regex (unbalanced parenthesis) is rejected with a
        clean 400 rather than surfacing a raw database error, and the
        message is wrapped in a list under the "search" key -- matching
        DRF's conventional field-error shape ({"field": ["message"]}) that
        the frontend relies on, rather than a bare string (which a client
        indexing with [0] would silently misparse as a single character)."""
        response = self.client.get(reverse("job-list"), {"search": "("})

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIsInstance(response.data["search"], list)
        self.assertIn("Invalid search pattern", response.data["search"][0])

    def test_empty_search_param_returns_all_jobs(self):
        """An empty search string is treated the same as no search at all,
        not as a pattern that matches nothing."""
        response = self.client.get(reverse("job-list"), {"search": ""})

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["count"], 5)
