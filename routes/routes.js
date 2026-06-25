const express = require('express');
const router = express.Router();
const pool = require('../db');

/*
 * TOPIC #4: Batch wise Course Analysis Curriculum wise
 *
 * "Batch" = a specific Year + Class (+ Semester) combination from the
 * recap table, e.g. Fall 1953 / "BSCS 5 A". Each batch is offered several
 * courses in the same term (multiple recap rows / rid's). This module lets
 * the user drill down Year -> Class -> Semester to land on one Batch, then
 * shows every course offered to that batch along with its curriculum data
 * (Theory/Lab credit hours) and performance analysis (avg %, avg GPA,
 * pass/fail rate) - i.e. "Course Analysis, Curriculum wise".
 *
 * Marks are taken from cmarks/cdist, which always normalize to a total of
 * 100 for every recap+head combination (verified against the EXAMS dump),
 * unlike marks/dist which carry raw, un-normalized point totals.
 */

// Reusable: per-course performance + curriculum analysis for one Batch
const courseAnalysisSQL = `
    WITH course_perf AS (
        SELECT
            cm.rid,
            cm.regno,
            SUM(cd.total) AS total_marks,
            SUM(cm.marks) AS obtained_marks,
            ROUND((SUM(cm.marks) * 100.0 / NULLIF(SUM(cd.total), 0))::numeric, 1) AS percentage
        FROM cmarks cm
        JOIN cdist cd ON cm.rid = cd.rid AND cm.hid = cd.hid
        GROUP BY cm.rid, cm.regno
    )
    SELECT
        rec.rid,
        co.code,
        co.title,
        co.theory,
        co.lab,
        CASE
            WHEN co.theory > 0 AND co.lab > 0 THEN 'Theory + Lab'
            WHEN co.theory > 0 THEN 'Theory Only'
            WHEN co.lab > 0 THEN 'Lab Only'
            ELSE 'N/A'
        END AS curriculum_type,
        f.name AS faculty,
        COUNT(DISTINCT cp.regno) AS total_students,
        ROUND(AVG(cp.percentage), 1) AS avg_percentage,
        ROUND(AVG(g.gpa), 2) AS avg_gpa,
        COUNT(CASE WHEN g.grade IS NOT NULL AND g.grade != 'F' THEN 1 END) AS pass_count,
        COUNT(CASE WHEN g.grade = 'F' THEN 1 END) AS fail_count,
        ROUND(
            COUNT(CASE WHEN g.grade = 'F' THEN 1 END) * 100.0 / NULLIF(COUNT(DISTINCT cp.regno), 0),
        1) AS fail_rate
    FROM recap rec
    JOIN course co ON rec.cid = co.cid
    JOIN faculty f ON rec.fid = f.fid
    JOIN course_perf cp ON cp.rid = rec.rid
    LEFT JOIN grade g ON cp.percentage BETWEEN g.start AND g."end"
    WHERE rec.year = $1 AND rec.class = $2 AND rec.semester = $3
    GROUP BY rec.rid, co.code, co.title, co.theory, co.lab, f.name
    HAVING COUNT(DISTINCT cp.regno) > 0
    ORDER BY rec.rid;
`;

// GET /api/batch/years => distinct years available
router.get('/years', async (req, res) => {
    try {
        const result = await pool.query('SELECT DISTINCT year FROM recap ORDER BY year DESC');
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching years:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /api/batch/classes/:year => distinct classes (batches) for a year
router.get('/classes/:year', async (req, res) => {
    const { year } = req.params;
    try {
        const result = await pool.query(
            'SELECT DISTINCT class FROM recap WHERE year = $1 ORDER BY class',
            [year]
        );
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching classes:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /api/batch/semesters/:year/:class => distinct semesters for that batch
router.get('/semesters/:year/:class', async (req, res) => {
    const { year, class: className } = req.params;
    try {
        const result = await pool.query(
            'SELECT DISTINCT semester FROM recap WHERE year = $1 AND class = $2 ORDER BY semester',
            [year, className]
        );
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching semesters:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /api/batch/course-analysis/:year/:class/:semester
// => Course analysis (curriculum wise) for one specific Batch
router.get('/course-analysis/:year/:class/:semester', async (req, res) => {
    const { year, class: className, semester } = req.params;
    try {
        const result = await pool.query(courseAnalysisSQL, [year, className, semester]);
        res.json(result.rows);
    } catch (err) {
        console.error('Error in batch course analysis:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /api/batch/course/:rid/students => students enrolled in one course (rid) with marks/grade
router.get('/course/:rid/students', async (req, res) => {
    const { rid } = req.params;
    try {
        const result = await pool.query(`
            SELECT x.regno, x.name, x.total_marks, x.obtained_marks, x.percentage, g.grade, g.gpa
            FROM (
                SELECT
                    cm.regno, s.name,
                    SUM(cd.total) AS total_marks,
                    SUM(cm.marks) AS obtained_marks,
                    ROUND((SUM(cm.marks) * 100.0 / NULLIF(SUM(cd.total), 0))::numeric, 1) AS percentage
                FROM cmarks cm
                JOIN student s ON cm.regno = s.regno
                JOIN cdist cd ON cm.rid = cd.rid AND cm.hid = cd.hid
                WHERE cm.rid = $1
                GROUP BY cm.regno, s.name
            ) x
            LEFT JOIN grade g ON x.percentage BETWEEN g.start AND g."end"
            ORDER BY x.percentage DESC
        `, [rid]);
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching students for course:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
