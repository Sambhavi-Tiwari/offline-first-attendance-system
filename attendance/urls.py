from django.urls import path
from .views import get_students, get_teachers, mark_attendance, sync_attendance, teacher_ui, get_today_attendance, bulk_add_students

urlpatterns = [
    path('students/', get_students),
    path('teachers/', get_teachers),
    path('attendance/', mark_attendance),
    path('sync/', sync_attendance),
    path('ui/', teacher_ui),
    path('today/', get_today_attendance),
    path('add-students/', bulk_add_students),



]
