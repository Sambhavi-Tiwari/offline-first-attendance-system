from django.db import models
class Teacher(models.Model):
    name = models.CharField(max_length=100)
    mobile_number = models.CharField(max_length=15, unique=True)

    def __str__(self):
        return self.name
    
class Student(models.Model):
    name = models.CharField(max_length=100)
    roll_number = models.IntegerField()
    class_name = models.CharField(max_length=20)

    def __str__(self):
        return f"{self.name} ({self.roll_number})"

class Attendance(models.Model):
    PRESENT = 'P'
    ABSENT = 'A'

    STATUS_CHOICES = [
        (PRESENT, 'Present'),
        (ABSENT, 'Absent'),
    ]

    teacher = models.ForeignKey(Teacher, on_delete=models.CASCADE)
    student = models.ForeignKey(Student, on_delete=models.CASCADE)
    date = models.DateField()
    status = models.CharField(max_length=1, choices=STATUS_CHOICES)
    
    is_synced = models.BooleanField(default=False)
    last_updated = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('student', 'date')

    def __str__(self):
        return f"{self.student} - {self.date} - {self.status}"
    


# Create your models here.
