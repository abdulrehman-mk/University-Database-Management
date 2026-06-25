# Batch wise Course Analysis (Curriculum wise)

University Database Management Project — Topic #4

## Project Description

A full-stack web app that analyzes courses **batch wise**: pick a Year, then
a Batch (Class), then a Semester to drill down to one specific batch (e.g.
*Fall 1953 — BSCS 5 A*). The app then shows every course offered to that
batch with its **curriculum data** (theory/lab credit hours, Theory Only /
Lab Only / Theory + Lab type) alongside performance analysis — total
students, average percentage, average GPA, pass/fail counts and fail rate.
Clicking any course drills further into the full list of enrolled students
with their marks and grade.

**Hierarchy:** Year → Batch (Class) → Semester → Course Analysis (curriculum
wise) → Student list per course.

## Technologies Used

- **Frontend:** HTML, CSS, JavaScript, Alpine.js
- **Backend:** Node.js, Express.js (REST API)
- **Database:** PostgreSQL (works locally or with a cloud Postgres such as
  NeonDB / Render)


