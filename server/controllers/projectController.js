import Mark from '../models/Mark.js';
import Project from '../models/Project.js';

export const getPublicShowcase = async (req, res) => {
  try {
    // 1. Fetch the highest graded evaluations
    // Assuming 'totalMarks' is the field storing the final grade
    const topEvaluations = await Mark.find()
      .sort({ totalMarks: -1 }) // Sort descending (highest first)
      .limit(3) // Limit to top 3 projects for the showcase
      .populate({
        path: 'projectId',
        select: 'title description academicYear',
        populate: {
          path: 'studentId',
          select: 'name department'
        }
      });

    // 2. Format the response to match what Home.jsx expects
    const topProjects = topEvaluations
      .filter(evaluation => evaluation.projectId) // filter out any orphans
      .map(evaluation => {
        const project = evaluation.projectId;
        return {
          _id: project._id,
          title: project.title,
          description: project.description,
          academicYear: project.academicYear || new Date().getFullYear(),
          studentId: project.studentId, // Already contains { name, department } from populate
          score: evaluation.totalMarks
        };
      });

    // 3. Send response
    res.status(200).json({ status: 'success', results: topProjects.length, data: topProjects });
  } catch (error) {
    console.error('Error fetching showcase projects:', error);
    res.status(500).json({ status: 'error', message: 'Failed to fetch showcase projects' });
  }
};