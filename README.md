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

## Database Notes

Marks are computed from the `cmarks` / `cdist` tables, which always
normalize each course's total marks to 100 (verified against the EXAMS
dump — unlike `marks` / `dist`, whose totals vary and are not used here).
Grades are looked up from the `grade` table by matching the computed
percentage against each grade's `start`–`end` range.

A **Batch** = a distinct `(year, class)` pair from `recap` (almost always
mapped to a single `semester`, with a handful of exceptions like
`BSCS Open` running in both Fall and Summer of the same year — hence the
3-step Year → Class → Semester drilldown). Each batch has several
`recap` rows (one per course offered that term), which is what makes
"course analysis" meaningful at the batch level.

## Setup

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Create the database and load the dump**

   Place your `EXAMS.sql` file (from the `EXAMS.zip` you already have) into
   the `db/` folder, then run:
   ```bash
   createdb exams_db
   psql -d exams_db -f db/EXAMS.sql
   ```

3. **Configure environment**

   Copy `.env.example` to `.env` and set your `DATABASE_URL`:
   ```bash
   cp .env.example .env
   ```
   ```
   DATABASE_URL=postgres://username:password@localhost:5432/exams_db
   PORT=3000
   ```
   For a cloud database (NeonDB, Render, etc.) just paste the connection
   string they give you — the app automatically uses SSL for any host
   other than `localhost`.

4. **Run the app**
   ```bash
   npm start
   ```
   Then open **http://localhost:3000**

## API Endpoints

| Method | Route | Description |
|---|---|---|
| GET | `/api/batch/years` | Distinct years available |
| GET | `/api/batch/classes/:year` | Distinct batches (classes) in a year |
| GET | `/api/batch/semesters/:year/:class` | Distinct semesters for a batch |
| GET | `/api/batch/course-analysis/:year/:class/:semester` | Course analysis (curriculum wise) for one batch |
| GET | `/api/batch/course/:rid/students` | Students + marks + grade for one course |

## Project Structure

```
.
├── db/
│   ├── index.js        # PostgreSQL connection pool
│   └── EXAMS.sql        # <- place your EXAMS.sql here (not bundled, you already have it)
├── routes/
│   └── routes.js        # API routes + SQL queries
├── public/
│   └── index.html        # Alpine.js frontend
├── server.js             # Express entry point
├── package.json
└── .env.example
```
