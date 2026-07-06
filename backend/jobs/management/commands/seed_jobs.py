from django.core.management.base import BaseCommand

from jobs.models import Job, JobStatus

# Each job's full status history, in order, ending at its current status.
JOB_DEFINITIONS = [
    ("Nightly ETL Pipeline", ["PENDING", "RUNNING"]),
    ("Database Backup", ["PENDING", "RUNNING", "SUCCEEDED"]),
    ("Invoice Report Generation", ["PENDING"]),
    ("Marketing Email Blast", ["PENDING", "RUNNING", "FAILED"]),
    ("Cache Warmup Job", ["PENDING", "RUNNING", "SUCCEEDED"]),
    ("User Analytics Sync", ["PENDING", "RUNNING"]),
    ("Database Vacuum", ["PENDING"]),
    ("Thumbnail Generation Batch", ["PENDING", "RUNNING", "SUCCEEDED"]),
    ("Fraud Detection Scan", ["PENDING", "RUNNING", "FAILED"]),
    ("Weekly Newsletter Dispatch", ["PENDING"]),
    ("Log Rotation Job", ["PENDING", "RUNNING", "SUCCEEDED"]),
    ("Search Index Rebuild", ["PENDING", "RUNNING"]),
    ("Payment Reconciliation", ["PENDING", "RUNNING", "FAILED"]),
    ("Customer Export Job", ["PENDING"]),
    ("SSL Certificate Renewal", ["PENDING", "RUNNING", "SUCCEEDED"]),
]


class Command(BaseCommand):
    help = "Replace all jobs with a fixed set of dummy jobs, for UI development."

    def handle(self, *args, **options):
        Job.objects.all().delete()

        for name, status_path in JOB_DEFINITIONS:
            job = Job.objects.create(name=name)
            for status_type in status_path:
                JobStatus.objects.create(job=job, status_type=status_type)

        self.stdout.write(self.style.SUCCESS(f"Seeded {len(JOB_DEFINITIONS)} jobs."))
