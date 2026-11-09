const db = require('../src/config/database');
const bcrypt = require('bcryptjs');

const saltRounds = 10;

async function seed() {
  try {
    // Hash passwords
    const [adminHash, studentHash] = await Promise.all([
      bcrypt.hash('admin123', saltRounds),
      bcrypt.hash('demo123', saltRounds),
    ]);

    // Create admin user
    await new Promise((resolve, reject) => {
      db.run(
        `INSERT OR IGNORE INTO users (name, email, password_hash, role, student_id, faculty, programme, academic_year)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        ['Admin User', 'admin@tuke.sk', adminHash, 'admin', 'MAIS-ADMIN-001', 'Faculty of Electrical Engineering and Informatics', 'Computer Science', '2026/27'],
        function (err) {
          if (err) reject(err);
          else resolve();
        }
      );
    });

    // Create student user
    await new Promise((resolve, reject) => {
      db.run(
        `INSERT OR IGNORE INTO users (name, email, password_hash, role, student_id, faculty, programme, academic_year, study_status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        ['Mahek Amipara', 'student@tuke.sk', studentHash, 'student', 'MAIS-2026-0142', 'Faculty of Electrical Engineering and Informatics', 'Computer Science', '2026/27', 'Full-time'],
        function (err) {
          if (err) reject(err);
          else resolve();
        }
      );
    });

    // Create additional demo students
    const moreStudents = [
      ['Raj Patel', 'raj.patel@tuke.sk', 'demo123', 'student', 'MAIS-2026-0143', 'Full-time'],
      ['Sneha Desai', 'sneha.desai@tuke.sk', 'demo123', 'student', 'MAIS-2026-0144', 'Full-time'],
      ['Aarav Shah', 'aarav.shah@tuke.sk', 'demo123', 'student', 'MAIS-2026-0145', 'Part-time'],
    ];

    for (const [name, email, password, role, studentId, studyStatus] of moreStudents) {
      const hash = await bcrypt.hash(password, saltRounds);
      await new Promise((resolve, reject) => {
        db.run(
          `INSERT OR IGNORE INTO users (name, email, password_hash, role, student_id, faculty, programme, academic_year, study_status)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [name, email, hash, role, studentId, 'Faculty of Electrical Engineering and Informatics', 'Computer Science', '2026/27', studyStatus],
          function (err) {
            if (err) reject(err);
            else resolve();
          }
        );
      });
    }

    // Create courses
    const courses = [
      ['CT101', 'Cloud Technologies', 6, 'Prof. Ján Novák', 'Winter 2026/27', 'Introduction to cloud computing and virtualization'],
      ['DS201', 'Data Structures and Algorithms', 6, 'Dr. Mária Kováčová', 'Winter 2026/27', 'Fundamental data structures and algorithm analysis'],
      ['WD301', 'Web Development', 5, 'Ing. Peter Šveda', 'Winter 2026/27', 'Modern web technologies: HTML, CSS, JavaScript, React'],
      ['DB401', 'Database Systems', 5, 'Prof. Ján Novák', 'Winter 2026/27', 'SQL, database design, and normalization'],
      ['OS501', 'Operating Systems', 6, 'Dr. Mária Kováčová', 'Summer 2026/27', 'OS concepts, processes, memory management'],
    ];

    for (const [code, name, credits, lecturer, semester, desc] of courses) {
      await new Promise((resolve, reject) => {
        db.run(
          `INSERT OR IGNORE INTO courses (code, name, credits, lecturer, semester, description) VALUES (?, ?, ?, ?, ?, ?)`,
          [code, name, credits, lecturer, semester, desc],
          function (err) {
            if (err) reject(err);
            else resolve();
          }
        );
      });
    }

    // Get all student IDs for seeding related data
    const allStudents = await new Promise((resolve, reject) => {
      db.all("SELECT id, email FROM users WHERE role = 'student'", (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    // Seed enrollments/grades/attendance for every student in first 3 courses
    const courseList2 = await new Promise((resolve, reject) => {
      db.all('SELECT id, code FROM courses ORDER BY code LIMIT 3', (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    for (const student of allStudents) {
      for (const course of courseList2) {
        await new Promise((resolve, reject) => {
          db.run(
            `INSERT OR IGNORE INTO enrollments (student_id, course_id, status) VALUES (?, ?, 'enrolled')`,
            [student.id, course.id],
            function (err) {
              if (err) reject(err);
              else resolve();
            }
          );
        });
        await new Promise((resolve, reject) => {
          db.run(
            `INSERT INTO grades (student_id, course_id, assessment, grade, status, grade_date) VALUES (?, ?, ?, ?, 'published', date('now'))`,
            [student.id, course.id, 'Assignment 1', 'B'],
            function (err) {
              if (err) reject(err);
              else resolve();
            }
          );
        });
        await new Promise((resolve, reject) => {
          db.run(
            `INSERT OR IGNORE INTO attendance (student_id, course_id, classes_held, classes_attended) VALUES (?, ?, 10, 9)`,
            [student.id, course.id],
            function (err) {
              if (err) reject(err);
              else resolve();
            }
          );
        });
      }
    }

    // Weekly timetable (campus local time) and exams, so the schedule views have data.
    const slots = [
      ['CT101', 'Monday', '09:00-10:30', 'A1'],
      ['CT101', 'Thursday', '09:00-10:30', 'A1'],
      ['DB401', 'Monday', '11:00-12:30', 'B2'],
      ['DB401', 'Wednesday', '11:00-12:30', 'B2'],
      ['DS201', 'Tuesday', '09:00-10:30', 'C1'],
      ['DS201', 'Friday', '13:00-14:30', 'C1'],
      ['WD301', 'Wednesday', '13:00-14:30', 'C3'],
      ['OS501', 'Thursday', '10:00-11:30', 'D2'],
    ];
    for (const [code, day, time, room] of slots) {
      await new Promise((resolve, reject) => {
        db.run(
          `INSERT INTO timetable (course_id, day, time, room, week)
           SELECT id, ?, ?, ?, 'All' FROM courses WHERE code = ?
           AND NOT EXISTS (SELECT 1 FROM timetable t WHERE t.course_id = courses.id AND t.day = ? AND t.time = ?)`,
          [day, time, room, code, day, time],
          (err) => (err ? reject(err) : resolve())
        );
      });
    }
    const exams = [
      ['CT101', 'Mid-term exam', '2026-11-23', '09:00', 'A1'],
      ['DB401', 'Mid-term exam', '2026-11-25', '11:00', 'B2'],
      ['CT101', 'Final exam', '2026-12-20', '09:00', 'A1'],
    ];
    for (const [code, name, date, time, room] of exams) {
      await new Promise((resolve, reject) => {
        db.run(
          `INSERT INTO exams (course_id, exam_name, exam_date, exam_time, room)
           SELECT id, ?, ?, ?, ? FROM courses WHERE code = ?
           AND NOT EXISTS (SELECT 1 FROM exams e WHERE e.course_id = courses.id AND e.exam_name = ?)`,
          [name, date, time, room, code, name],
          (err) => (err ? reject(err) : resolve())
        );
      });
    }

    // Seed announcements
    const announcementData = [
      ['Winter semester timetable published', 'The updated timetable for the winter semester is now available. Please check your rooms and class times before attending.', 'Admin User'],
      ['Course registration reminder', 'Please review your enrolled courses and confirm your study plan before the registration deadline.', 'Admin User'],
      ['Library opening hours', 'The university library has extended opening hours during the examination preparation period.', 'Admin User'],
    ];

    for (const [title, content, createdByName] of announcementData) {
      // Get the created_by user id
      const creator = await new Promise((resolve, reject) => {
        db.get("SELECT id FROM users WHERE name = ?", [createdByName], (err, row) => {
          if (err) reject(err);
          else resolve(row);
        });
      });

      await new Promise((resolve, reject) => {
        db.run(
          `INSERT INTO announcements (title, content, created_by, is_published) VALUES (?, ?, ?, 1)`,
          [title, content, creator.id],
          function (err) {
            if (err) reject(err);
            else resolve();
          }
        );
      });
    }

    // Seed notifications - for the student
    const notificationData = [
      ['New grade published', 'A result is available for Cloud Technologies.', 0],
      ['Timetable updated', 'One class room has been updated for this week.', 0],
      ['Registration reminder', 'Review your course enrollment status.', 0],
    ];

    for (const [title, message, isRead] of notificationData) {
      for (const student of allStudents) {
        await new Promise((resolve, reject) => {
          db.run(
            `INSERT INTO notifications (user_id, title, message, is_read) VALUES (?, ?, ?, ?)`,
            [student.id, title, message, isRead],
            function (err) {
              if (err) reject(err);
              else resolve();
            }
          );
        });
      }
    }

    console.log('✅ Seeding completed');
  } catch (err) {
    console.error('❌ Seeding failed:', err);
    console.error(err.stack);
  } finally {
    db.close();
  }
}

seed();