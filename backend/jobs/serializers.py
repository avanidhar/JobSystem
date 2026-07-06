from rest_framework import serializers

from .models import Job, JobStatus


class JobStatusSerializer(serializers.ModelSerializer):
    class Meta:
        model = JobStatus
        fields = ["id", "status_type", "timestamp"]


class JobSerializer(serializers.ModelSerializer):
    current_status = serializers.SerializerMethodField()

    class Meta:
        model = Job
        fields = ["id", "name", "created_at", "updated_at", "current_status"]

    def get_current_status(self, obj):
        # get_queryset() prefetches this via `to_attr` to avoid N+1 queries on
        # list; fall back to a direct query for single-instance responses
        # (create/patch) where that prefetch hasn't run.
        prefetched = getattr(obj, "prefetched_statuses", None)
        if prefetched is not None:
            latest_status = prefetched[0] if prefetched else None
        else:
            latest_status = obj.statuses.order_by("-timestamp").first()
        return JobStatusSerializer(latest_status).data if latest_status else None


class JobStatusUpdateSerializer(serializers.Serializer):
    status_type = serializers.ChoiceField(choices=JobStatus.StatusType.choices)
