import Student from '../models/Student.js';

// Middleware: Only allow staff to access their own students
export const staffOwnsStudent = async (req, res, next) => {
  try {
    if (req.user.role !== 'Staff') {
      return res.status(403).json({ message: 'Access denied. Staff only.' });
    }
    const { studentId } = req.params;
    if (!studentId) {
      return res.status(400).json({ message: 'Student ID required.' });
    }
    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ message: 'Student not found.' });
    }
    if (!student.createdByStaffId || student.createdByStaffId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You do not have access to this student.' });
    }
    next();
  } catch (error) {
    res.status(500).json({ message: 'Ownership validation error', error: error.message });
  }
};
