from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status
from datetime import date
from django.shortcuts import render

from .models import Teacher, Student, Attendance
from .serializers import TeacherSerializer, StudentSerializer, AttendanceSerializer
from .auth import CsrfExemptSessionAuthentication


# ----------------------------
# GET ALL STUDENTS
# ----------------------------
@api_view(['GET'])
def get_students(request):
    students = Student.objects.all()
    serializer = StudentSerializer(students, many=True)
    return Response(serializer.data)


# ----------------------------
# GET ALL TEACHERS
# ----------------------------
@api_view(['GET'])
def get_teachers(request):
    teachers = Teacher.objects.all()
    serializer = TeacherSerializer(teachers, many=True)
    return Response(serializer.data)


# ----------------------------
# MARK ATTENDANCE (ONLINE)
# ----------------------------
@api_view(['POST'])
@authentication_classes([CsrfExemptSessionAuthentication])
@permission_classes([IsAuthenticated])
def mark_attendance(request):
    teacher = request.data.get('teacher')
    student = request.data.get('student')
    attendance_date = request.data.get('date')
    status_value = request.data.get('status')

    if not all([teacher, student, attendance_date, status_value]):
        return Response(
            {"error": "Missing required fields"},
            status=status.HTTP_400_BAD_REQUEST
        )

    attendance, created = Attendance.objects.update_or_create(
        student_id=student,
        date=attendance_date,
        defaults={
            'teacher_id': teacher,
            'status': status_value,
            'is_synced': False,
        }
    )

    serializer = AttendanceSerializer(attendance)
    return Response(
        serializer.data,
        status=status.HTTP_201_CREATED if created else status.HTTP_200_OK
    )


# ----------------------------
# SYNC OFFLINE ATTENDANCE
# ----------------------------
@api_view(['POST'])
@authentication_classes([CsrfExemptSessionAuthentication])
@permission_classes([IsAuthenticated])
def sync_attendance(request):
    records = request.data
    synced = []

    for record in records:
        attendance, _ = Attendance.objects.update_or_create(
            student_id=record['student'],
            date=record['date'],
            defaults={
                'teacher_id': record['teacher'],
                'status': record['status'],
                'is_synced': True,
            }
        )
        synced.append(attendance)

    serializer = AttendanceSerializer(synced, many=True)
    return Response(serializer.data, status=status.HTTP_200_OK)


# ----------------------------
# TEACHER UI
# ----------------------------
def teacher_ui(request):
    return render(request, 'attendance/teacher.html')


# ----------------------------
# GET TODAY'S ATTENDANCE
# ----------------------------
@api_view(['GET'])
def get_today_attendance(request):
    today = date.today()
    records = Attendance.objects.filter(date=today)
    serializer = AttendanceSerializer(records, many=True)
    return Response(serializer.data)


# ----------------------------
# BULK ADD STUDENTS
# ----------------------------
@api_view(['POST'])
def bulk_add_students(request):
    students = request.data.get("students", [])
    class_name = request.data.get("class_name", "A")

    if not students:
        return Response(
            {"error": "No student data provided"},
            status=status.HTTP_400_BAD_REQUEST
        )

    for student in students:
        Student.objects.create(
            name=student.get("name"),
            roll_number=student.get("roll"),
            class_name=class_name
        )

    return Response({"message": "Students added successfully"})

from django.contrib.auth.models import User

@api_view(['GET'])
def create_admin(request):
    if not User.objects.filter(username='admin').exists():
        User.objects.create_superuser(
            username='admin',
            email='admin@gmail.com',
            password='admin123'
        )
        return Response({"message": "Admin created"})
    return Response({"message": "Admin already exists"})

from django.contrib.auth import authenticate, login
from rest_framework.permissions import AllowAny, IsAuthenticated

@api_view(['POST'])
@permission_classes([AllowAny])
def login_user(request):
    username = request.data.get("username")
    password = request.data.get("password")

    user = authenticate(username=username, password=password)

    if user:
        login(request, user)
        return Response({"message": "Login successful"})
    return Response({"error": "Invalid credentials"}, status=400)