from django.db.models import Prefetch
from rest_framework import viewsets
from rest_framework.response import Response

from .models import Job, JobStatus
from .serializers import JobSerializer, JobStatusUpdateSerializer


# This is where the behavior implementation actually lives
class JobViewSet(viewsets.ModelViewSet):
    # PUT is intentionally excluded since jobs are only ever updated via PATCH
    # (append a new JobStatus), never fully replaced.
    http_method_names = ["get", "post", "patch", "delete", "head", "options"]
    serializer_class = JobSerializer

    def get_queryset(self):
        return Job.objects.prefetch_related(
            Prefetch(
                "statuses",
                queryset=JobStatus.objects.order_by("-timestamp"),
                to_attr="prefetched_statuses",
            )
        )

    # Overrides the create to set status to PENDING
    def perform_create(self, serializer):
        job = serializer.save()
        JobStatus.objects.create(job=job, status_type=JobStatus.StatusType.PENDING)

    def partial_update(self, request, *args, **kwargs):
        job = self.get_object()
        serializer = JobStatusUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        JobStatus.objects.create(
            job=job, status_type=serializer.validated_data["status_type"]
        )
        # `job` came from get_queryset(), which prefetched `statuses` into a
        # plain list attribute before the create() above ran, so it's stale.
        # Re-fetch without that prefetch so the serializer sees the new row.
        fresh_job = Job.objects.get(pk=job.pk)
        return Response(JobSerializer(fresh_job).data)

    # `destroy` is the default ModelViewSet behavior (instance.delete());
    # JobStatus rows cascade-delete via the Foreign Key's on_delete=CASCADE.
