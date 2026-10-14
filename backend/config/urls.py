from django.contrib import admin
from django.urls import include, path


urlpatterns = [
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