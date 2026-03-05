import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import {
  // Message routes
  sendMessage,
  getInboxMessages,
  getSentMessages,
  getMessageById,
  markMessageAsRead,
  deleteMessage,
  getUnreadCount,
  // Notification routes
  getNotifications,
  getUnreadNotificationCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  clearReadNotifications,
  // Conversation routes
  getConversation,
  getConversationsList,
  // Announcements
  getAnnouncements
} from '../controllers/communicationController.js';

const router = express.Router();

// ============ MESSAGE ROUTES ============
router.post('/messages', protect, sendMessage);
router.get('/messages/inbox', protect, getInboxMessages);
router.get('/messages/sent', protect, getSentMessages);
router.get('/messages/unread-count', protect, getUnreadCount);
router.get('/messages/:messageId', protect, getMessageById);
router.put('/messages/:messageId/read', protect, markMessageAsRead);
router.delete('/messages/:messageId', protect, deleteMessage);

// ============ NOTIFICATION ROUTES ============
router.get('/notifications', protect, getNotifications);
router.get('/notifications/unread-count', protect, getUnreadNotificationCount);
router.put('/notifications/:notificationId/read', protect, markNotificationAsRead);
router.put('/notifications/read-all', protect, markAllNotificationsAsRead);
router.delete('/notifications/:notificationId', protect, deleteNotification);
router.delete('/notifications/clear-read', protect, clearReadNotifications);

// ============ CONVERSATION ROUTES ============
router.get('/conversations', protect, getConversationsList);
router.get('/conversations/:userId', protect, getConversation);

// ============ ANNOUNCEMENTS ROUTES ============
router.get('/announcements', protect, getAnnouncements);

export default router;
