const User = require('../models/User');
const { validateEmail, validateName } = require('../utils/validate');

const updateProfile = async (req, res) => {
  try {
    const { name, email } = req.body;
    const userId = req.user.id;

    const problem = validateName(name) || validateEmail(email);
    if (problem) {
      return res.status(400).json({ message: problem });
    }
    const taken = await User.findByEmail(email.trim());
    if (taken && taken.id !== userId) {
      return res.status(409).json({ message: 'That email is already used by another account' });
    }

    await User.updateProfile(userId, { name: name.trim(), email: email.trim() });
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