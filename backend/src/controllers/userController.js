const User = require('../models/User');

const updateProfile = async (req, res) => {
  try {
    const { name, email } = req.body;
    const userId = req.user.id;

    if (!name || !email) {
      return res.status(400).json({ message: 'Name and email are required' });
    }

    await User.updateProfile(userId, { name, email });
    const user = await User.findById(userId);

    res.json({
      message: 'Profile updated successfully',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        studentId: user.student_id,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { updateProfile };