import express from 'express';
import * as teamController from '../controllers/teamController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Team management
router.post('/teams', protect, teamController.createTeam);
router.get('/teams', protect, teamController.getAllTeams);
router.get('/teams/:teamId', protect, teamController.getTeamById);
router.put('/teams/:teamId', protect, teamController.updateTeam);

// Team members
router.post('/teams/:teamId/members', protect, teamController.addTeamMember);
router.delete('/teams/:teamId/members/:studentId', protect, teamController.removeTeamMember);

// Project linking
router.post('/teams/:teamId/link-project', protect, teamController.linkProjectToTeam);

// Progress
router.post('/progress', protect, teamController.submitTeamProgress);
router.get('/teams/:teamId/dashboard', protect, teamController.getTeamProgressDashboard);

// Get teams by role
router.get('/my-teams/guide', protect, teamController.getTeamsByGuide);
router.get('/my-teams/student', protect, teamController.getTeamsByStudent);

export default router;
