import Message from '../models/Message.js';
import Notification from '../models/Notification.js';

import Student from '../models/Student.js';
import Staff from '../models/Staff.js';
import HOD from '../models/HOD.js';
import Announcement from '../models/Announcement.js';

// ============ MESSAGE CONTROLLERS ============

// Send a message
export const sendMessage = async (req, res) => {
  try {
    const { receiverId, subject, message, priority, relatedTo } = req.body;
    const senderId = req.user._id;
    const senderRole = req.user.role; // 'Student', 'Staff', or 'HOD'

    // Check if receiver exists and determine role
    let receiver = null;
    let receiverRole = null;

    receiver = await Student.findById(receiverId);
    if (receiver) receiverRole = 'Student';

    if (!receiver) {
      receiver = await Staff.findById(receiverId);
      if (receiver) receiverRole = 'Staff';
    }

    if (!receiver) {
      receiver = await HOD.findById(receiverId);
      if (receiver) receiverRole = 'HOD';
    }

    if (!receiver) {
      return res.status(404).json({ message: 'Receiver not found' });
    }

    const newMessage = await Message.create({
      senderId,
      senderModel: senderRole,
      receiverId,
      receiverModel: receiverRole,
      subject,
      message,
      priority: priority || 'Medium',
      relatedTo
    });

    const populatedMessage = await Message.findById(newMessage._id)
      .populate('senderId', 'name email')
      .populate('receiverId', 'name email');

    // Create notification for receiver
    await createNotification({
      userId: receiverId,
      type: 'MESSAGE_RECEIVED',
      title: `New message from ${req.user.name}`,
      message: subject,
      relatedTo: { type: 'Message', referenceId: newMessage._id },
      actionUrl: `/messages/${newMessage._id}`
    });

    res.status(201).json({
      success: true,
      message: 'Message sent successfully',
      data: populatedMessage
    });
  } catch (error) {
    res.status(500).json({ message: 'Error sending message', error: error.message });
  }
};

// Get inbox messages
export const getInboxMessages = async (req, res) => {
  try {
    const userId = req.user._id;
    const { page = 1, limit = 20, unreadOnly = false } = req.query;

    const query = { receiverId: userId };
    if (unreadOnly === 'true') {
      query.isRead = false;
    }

    const messages = await Message.find(query)
      .populate('senderId', 'name email role department')
      .populate('receiverId', 'name email role')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    const total = await Message.countDocuments(query);

    // Manually populate if automatic population failed (e.g. missing senderModel)
    const populatedMessages = await Promise.all(messages.map(async (msg) => {
      // If senderId is not an object (not populated), try to find it
      if (!msg.senderId || !msg.senderId._id) {
        const senderId = msg.senderId;
        // Try finding in all collections
        const sender = await Student.findById(senderId).select('name email role department') ||
          await Staff.findById(senderId).select('name email role department') ||
          await HOD.findById(senderId).select('name email role department');

        if (sender) {
          msg.senderId = sender;
        }
      }
      return msg;
    }));

    res.json({
      success: true,
      data: populatedMessages,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      total
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching messages', error: error.message });
  }
};

// Get sent messages
export const getSentMessages = async (req, res) => {
  try {
    const userId = req.user._id;
    const { page = 1, limit = 20 } = req.query;

    const messages = await Message.find({ senderId: userId })
      .populate('senderId', 'name email role')
      .populate('receiverId', 'name email role department')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Message.countDocuments({ senderId: userId });

    res.json({
      success: true,
      data: messages,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      total
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching sent messages', error: error.message });
  }
};

// Get single message
export const getMessageById = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user._id;

    const message = await Message.findById(messageId)
      .populate('senderId', 'name email role department')
      .populate('receiverId', 'name email role department');

    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    // Check if user is sender or receiver
    const senderIdStr = message.senderId._id ? message.senderId._id.toString() : message.senderId.toString();
    const receiverIdStr = message.receiverId._id ? message.receiverId._id.toString() : message.receiverId.toString();

    if (senderIdStr !== userId.toString() && receiverIdStr !== userId.toString()) {
      return res.status(403).json({ message: 'Unauthorized to view this message' });
    }

    // Mark as read if receiver is viewing
    if (receiverIdStr === userId.toString() && !message.isRead) {
      message.isRead = true;
      message.readAt = new Date();
      await message.save();
    }

    res.json({ success: true, data: message });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching message', error: error.message });
  }
};

// Mark message as read
export const markMessageAsRead = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user._id;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    if (message.receiverId.toString() !== userId.toString()) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    message.isRead = true;
    message.readAt = new Date();
    await message.save();

    res.json({ success: true, message: 'Message marked as read' });
  } catch (error) {
    res.status(500).json({ message: 'Error marking message as read', error: error.message });
  }
};

// Delete message
export const deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user._id;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    // Only sender or receiver can delete
    if (message.senderId.toString() !== userId.toString() &&
      message.receiverId.toString() !== userId.toString()) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    await Message.findByIdAndDelete(messageId);
    res.json({ success: true, message: 'Message deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting message', error: error.message });
  }
};

// Get unread message count
export const getUnreadCount = async (req, res) => {
  try {
    const userId = req.user._id;
    const count = await Message.countDocuments({ receiverId: userId, isRead: false });
    res.json({ success: true, count });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching unread count', error: error.message });
  }
};

// ============ NOTIFICATION CONTROLLERS ============

// Create notification (internal function)
export const createNotification = async (notificationData) => {
  try {
    const notification = await Notification.create(notificationData);
    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
    return null;
  }
};

// Get user notifications
export const getNotifications = async (req, res) => {
  try {
    const userId = req.user._id;
    const { page = 1, limit = 50, unreadOnly = false } = req.query;

    const query = { userId };
    if (unreadOnly === 'true') {
      query.isRead = false;
    }

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Notification.countDocuments(query);

    res.json({
      success: true,
      data: notifications,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      total
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching notifications', error: error.message });
  }
};

// Get unread notification count
export const getUnreadNotificationCount = async (req, res) => {
  try {
    const userId = req.user._id;
    const count = await Notification.countDocuments({ userId, isRead: false });
    res.json({ success: true, count });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching unread count', error: error.message });
  }
};

// Mark notification as read
export const markNotificationAsRead = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const userId = req.user._id;

    const notification = await Notification.findById(notificationId);
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    if (notification.userId.toString() !== userId.toString()) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    notification.isRead = true;
    notification.readAt = new Date();
    await notification.save();

    res.json({ success: true, message: 'Notification marked as read' });
  } catch (error) {
    res.status(500).json({ message: 'Error marking notification as read', error: error.message });
  }
};

// Mark all notifications as read
export const markAllNotificationsAsRead = async (req, res) => {
  try {
    const userId = req.user._id;

    await Notification.updateMany(
      { userId, isRead: false },
      { isRead: true, readAt: new Date() }
    );

    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (error) {
    res.status(500).json({ message: 'Error marking notifications as read', error: error.message });
  }
};

// Delete notification
export const deleteNotification = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const userId = req.user._id;

    const notification = await Notification.findById(notificationId);
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    if (notification.userId.toString() !== userId.toString()) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    await Notification.findByIdAndDelete(notificationId);
    res.json({ success: true, message: 'Notification deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting notification', error: error.message });
  }
};

// Clear all read notifications
export const clearReadNotifications = async (req, res) => {
  try {
    const userId = req.user._id;
    await Notification.deleteMany({ userId, isRead: true });
    res.json({ success: true, message: 'Read notifications cleared' });
  } catch (error) {
    res.status(500).json({ message: 'Error clearing notifications', error: error.message });
  }
};

// ============ CONVERSATION CONTROLLERS ============

// Get conversation with another user
export const getConversation = async (req, res) => {
  try {
    const { userId: otherUserId } = req.params;
    const currentUserId = req.user._id;
    const { page = 1, limit = 50 } = req.query;

    const messages = await Message.find({
      $or: [
        { senderId: currentUserId, receiverId: otherUserId },
        { senderId: otherUserId, receiverId: currentUserId }
      ]
    })
      .populate('senderId', 'name email role')
      .populate('receiverId', 'name email role')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    // Mark received messages as read
    await Message.updateMany(
      { senderId: otherUserId, receiverId: currentUserId, isRead: false },
      { isRead: true, readAt: new Date() }
    );

    res.json({ success: true, data: messages.reverse() });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching conversation', error: error.message });
  }
};

// Get all conversations
export const getConversationsList = async (req, res) => {
  try {
    const userId = req.user._id;

    // Get unique users from sent and received messages
    const conversations = await Message.aggregate([
      {
        $match: {
          $or: [{ senderId: userId }, { receiverId: userId }]
        }
      },
      {
        $sort: { createdAt: -1 }
      },
      {
        $group: {
          _id: {
            $cond: [
              { $eq: ['$senderId', userId] },
              '$receiverId',
              '$senderId'
            ]
          },
          lastMessage: { $first: '$$ROOT' },
          unreadCount: {
            $sum: {
              $cond: [
                { $and: [{ $eq: ['$receiverId', userId] }, { $eq: ['$isRead', false] }] },
                1,
                0
              ]
            }
          }
        }
      },
      {
        $sort: { 'lastMessage.createdAt': -1 }
      }
    ]);

    // Populate user details manually since we can't lookup a single collection
    const populatedConversations = await Promise.all(conversations.map(async (conv) => {
      const otherUserId = conv._id;
      let user = null;
      let role = null;

      // Try finding user in all collections
      // Optimization: use lastMessage model hint if new architecture, 
      // but here we just try-find or check if we know the role

      // Since we don't store "otherUserModel" in the conversation ID, we have to search
      // But we can check senderModel/receiverModel from lastMessage!
      const isSender = conv.lastMessage.senderId.toString() === userId.toString();
      const model = isSender ? conv.lastMessage.receiverModel : conv.lastMessage.senderModel;

      if (model === 'Student') user = await Student.findById(otherUserId);
      else if (model === 'Staff') user = await Staff.findById(otherUserId);
      else if (model === 'HOD') user = await HOD.findById(otherUserId);
      else {
        // Fallback for old messages without model
        user = await Student.findById(otherUserId) ||
          await Staff.findById(otherUserId) ||
          await HOD.findById(otherUserId);
      }

      return {
        userId: otherUserId,
        userName: user ? user.name : 'Unknown User',
        userEmail: user ? user.email : '',
        userRole: user ? (user.role || model) : '', // Fallback role
        lastMessage: conv.lastMessage,
        unreadCount: conv.unreadCount
      };
    }));

    res.json({ success: true, data: populatedConversations });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching conversations', error: error.message });
  }
};

// ============ ANNOUNCEMENTS ============
export const getAnnouncements = async (req, res) => {
  try {
    const userRole = req.user.role; // 'Student', 'Staff', or 'HOD'

    // Find announcements visible to this user's role
    const announcements = await Announcement.find({
      isActive: true,
      $or: [
        { targetAudience: 'All' },
        { targetAudience: userRole }
      ]
    })
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    res.json({
      status: 'success',
      data: announcements
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};
