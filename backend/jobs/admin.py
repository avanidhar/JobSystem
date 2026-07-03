from django.contrib import admin

from .models import Job, JobStatus


@admin.register(Job)
class JobAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "created_at", "updated_at")
    search_fields = ("name",)


@admin.register(JobStatus)
class JobStatusAdmin(admin.ModelAdmin):
    list_display = ("id", "job", "status_type", "timestamp")
    list_filter = ("status_type",)
