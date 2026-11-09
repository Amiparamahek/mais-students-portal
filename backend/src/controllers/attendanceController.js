const Attendance = require('../models/Attendance');

const getMyAttendance = async (req, res) => {
  try {
    const records = await Attendance.getByStudent(req.user.id);
    res.json(records);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

const createOrUpdate = async (req, res) => {
  try {
    // Support both single record and bulk records
    if (Array.isArray(req.body.records)) {
      const { date } = req.body;
      for (const record of req.body.records) {
        await Attendance.createOrUpdate({
          studentId: record.student_id,
          courseId: record.course_id,
          classesHeld: record.classes_held || 1,
          classesAttended: record.present ? 1 : 0,
        });
      }
      return res.json({ message: 'Attendance saved successfully' });
    }

    const { studentId, courseId, classesHeld, classesAttended } = req.body;
    if (!studentId || !courseId || classesHeld === undefined || classesAttended === undefined) {
      return res.status(400).json({ message: 'All fields are required' });
    }
    await Attendance.createOrUpdate({ studentId, courseId, classesHeld, classesAttended });
    res.json({ message: 'Attendance updated' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { getMyAttendance, createOrUpdate };
