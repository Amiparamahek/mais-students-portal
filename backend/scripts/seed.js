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

    // Seed documents
    const documentData = [
      ['Certificate of study', 'Request proof of current student status.', 'PDF form'],
      ['Course registration form', 'Form for course and study plan requests.', 'PDF form'],
      ['Examination application', 'Application form for examination-related requests.', 'PDF form'],
      ['Student handbook', 'Academic rules, student services and key contacts.', 'PDF document'],
      ['Academic calendar', 'Semester dates, holidays and examination periods.', 'PDF document'],
      ['Change of personal details', 'Request a correction to your student profile.', 'Online form'],
    ];

    for (const [title, , category] of documentData) {
      await new Promise((resolve, reject) => {
        db.run(
          `INSERT INTO documents (title, file_url, category) VALUES (?, NULL, ?)`,
          [title, category],
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
      ['Document available', 'Your academic calendar is available in Documents.', 1],
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