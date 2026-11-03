from django.contrib import admin
from django.http import JsonResponse
from django.urls import include, path
from django.views.decorators.http import require_GET


@require_GET
def health_check(request):
    return JsonResponse({"status": "ok"})


urlpatterns = [
    path("health/", health_check, name="health-check"),
    path("api/administration/", include("administration.urls")),
    path("admin/", admin.site.urls),

    path(
        "api/auth/",
        include("users.urls")
    ),

    path(
        "api/",
        include("reports.urls")
    ),

    path(
        "api/",
        include("incidents.urls")
    ),

    path(
        "api/",
        include("zones.urls")
    ),
]
