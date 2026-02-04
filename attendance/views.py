from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status
from datetime import date

from .models import Teacher, Student, Attendance
from .serializers import TeacherSerializer, StudentSerializer, AttendanceSerializer
from .auth import CsrfExemptSessionAuthentication




@api_view(['GET'])
def get_students(request):
    students = Student.objects.all()
    serializer = StudentSerializer(students, many=True)
    return Response(serializer.data)


@api_view(['GET'])
def get_teachers(request):
    teachers = Teacher.objects.all()
    serializer = TeacherSerializer(teachers, many=True)
    return Response(serializer.data)

@api_view(['POST'])
@authentication_classes([CsrfExemptSessionAuthentication])
@permission_classes([AllowAny])
def mark_attendance(request):
    teacher = request.data.get('teacher')
    student = request.data.get('student')
    attendance_date = request.data.get('date')
    status_value = request.data.get('status')

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
    
@api_view(['POST'])
@authentication_classes([CsrfExemptSessionAuthentication])
@permission_classes([AllowAny])
def sync_attendance(request):
    records = request.data  # list of attendance records
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
    print("SYNC RECEIVED:", record)


from django.shortcuts import render

def teacher_ui(request):
    return render(request, 'attendance/teacher.html')

@api_view(['GET'])
def get_today_attendance(request):
    today = date.today()
    records = Attendance.objects.filter(date=today)
    serializer = AttendanceSerializer(records, many=True)
    return Response(serializer.data)




