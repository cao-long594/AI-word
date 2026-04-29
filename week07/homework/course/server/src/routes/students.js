import Router from '@koa/router';
import db from '../database/db.js';
import { authenticateToken } from '../middleware/auth.js';
import { success, fail } from '../utils/response.js';

const router = new Router();

router.get('/', authenticateToken, async (ctx) => {
  const { keyword = '', className = '', status = '', courseId = '', page = 1, pageSize = 10 } = ctx.query;
  const offset = (Number(page) - 1) * Number(pageSize);

  let where = 'WHERE 1=1';
  const params = [];

  if (keyword) {
    where += ' AND (name LIKE ? OR student_no LIKE ?)';
    params.push(`%${keyword}%`, `%${keyword}%`);
  }
  if (className) {
    where += ' AND class_name = ?';
    params.push(className);
  }
  if (status) {
    where += ' AND status = ?';
    params.push(status);
  }

  let rows = db.prepare(`SELECT * FROM students ${where} ORDER BY created_at DESC`).all(...params);

  if (courseId) {
    rows = rows.filter(s => {
      const ids = JSON.parse(s.course_ids || '[]');
      return ids.includes(Number(courseId));
    });
  }

  const total = rows.length;
  const list = rows.slice(offset, offset + Number(pageSize)).map(s => ({
    ...s,
    course_ids: JSON.parse(s.course_ids || '[]'),
  }));

  success(ctx, { list, total, page: Number(page), pageSize: Number(pageSize) });
});

router.get('/classes', authenticateToken, async (ctx) => {
  const classes = db.prepare("SELECT DISTINCT class_name FROM students WHERE class_name != '' ORDER BY class_name")
    .all()
    .map(r => r.class_name);
  success(ctx, classes);
});

router.get('/:id', authenticateToken, async (ctx) => {
  const student = db.prepare('SELECT * FROM students WHERE id = ?').get(ctx.params.id);
  if (!student) {
    return fail(ctx, 404, '学生不存在');
  }
  student.course_ids = JSON.parse(student.course_ids || '[]');

  const courses = db.prepare('SELECT id, name FROM courses').all();
  const enrolledCourses = courses.filter(c => student.course_ids.includes(c.id));

  success(ctx, { ...student, enrolledCourses });
});

router.post('/', authenticateToken, async (ctx) => {
  const { name, student_no, class_name, phone, email, status, course_ids } = ctx.request.body;

  if (!name) {
    return fail(ctx, 400, '学生姓名不能为空');
  }
  if (!student_no) {
    return fail(ctx, 400, '学号不能为空');
  }

  const existing = db.prepare('SELECT id FROM students WHERE student_no = ?').get(student_no);
  if (existing) {
    return fail(ctx, 400, '学号已存在');
  }

  const selectedCourseIds = Array.isArray(course_ids) ? course_ids.map(Number).filter(Boolean) : [];
  const result = db.prepare(`
    INSERT INTO students (name, student_no, class_name, phone, email, status, course_ids)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    name,
    student_no,
    class_name || '',
    phone || '',
    email || '',
    status || 'active',
    JSON.stringify(selectedCourseIds)
  );

  updateCourseCounts();

  const student = db.prepare('SELECT * FROM students WHERE id = ?').get(result.lastInsertRowid);
  ctx.status = 201;
  success(ctx, {
    ...student,
    course_ids: JSON.parse(student.course_ids || '[]'),
  });
});

router.put('/:id', authenticateToken, async (ctx) => {
  const existing = db.prepare('SELECT * FROM students WHERE id = ?').get(ctx.params.id);
  if (!existing) {
    return fail(ctx, 404, '学生不存在');
  }

  const { name, student_no, class_name, phone, email, status, course_ids } = ctx.request.body;

  if (student_no && student_no !== existing.student_no) {
    const duplicate = db.prepare('SELECT id FROM students WHERE student_no = ? AND id != ?')
      .get(student_no, ctx.params.id);
    if (duplicate) {
      return fail(ctx, 400, '学号已存在');
    }
  }

  const nextCourseIds = Array.isArray(course_ids)
    ? JSON.stringify(course_ids.map(Number).filter(Boolean))
    : existing.course_ids;

  db.prepare(`
    UPDATE students
    SET name = ?, student_no = ?, class_name = ?, phone = ?, email = ?, status = ?, course_ids = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(
    name ?? existing.name,
    student_no ?? existing.student_no,
    class_name ?? existing.class_name,
    phone ?? existing.phone,
    email ?? existing.email,
    status ?? existing.status,
    nextCourseIds,
    ctx.params.id
  );

  updateCourseCounts();

  const student = db.prepare('SELECT * FROM students WHERE id = ?').get(ctx.params.id);
  success(ctx, {
    ...student,
    course_ids: JSON.parse(student.course_ids || '[]'),
  });
});

router.delete('/:id', authenticateToken, async (ctx) => {
  const existing = db.prepare('SELECT id FROM students WHERE id = ?').get(ctx.params.id);
  if (!existing) {
    return fail(ctx, 404, '学生不存在');
  }

  db.prepare('DELETE FROM students WHERE id = ?').run(ctx.params.id);
  updateCourseCounts();
  success(ctx, null, '删除成功');
});

function updateCourseCounts() {
  const courses = db.prepare('SELECT id FROM courses').all();
  const students = db.prepare('SELECT course_ids FROM students').all();

  for (const course of courses) {
    const count = students.filter(s => {
      const ids = JSON.parse(s.course_ids || '[]');
      return ids.includes(course.id);
    }).length;
    db.prepare('UPDATE courses SET student_count = ? WHERE id = ?').run(count, course.id);
  }
}

export default router;
