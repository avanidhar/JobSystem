from rest_framework.routers import DefaultRouter

from .views import JobViewSet

# This sets up the URLs dynamically
router = DefaultRouter()
router.register("jobs", JobViewSet, basename="job")

urlpatterns = router.urls
