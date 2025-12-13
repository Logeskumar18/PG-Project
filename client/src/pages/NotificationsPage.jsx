import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Container, Card, Badge, ListGroup, Button, Dropdown, ButtonGroup } from 'react-bootstrap';

const NotificationsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [filter, setFilter] = useState('all'); // all, unread, read

  // Sample notifications (in production, fetch from API)
  const [notifications, setNotifications] = useState([
    { id: 1, type: 'PROJECT_APPROVED', title: '✅ Project Approved!', message: 'Your project "AI Chatbot System" has been approved by Dr. Sharma', isRead: false, priority: 'High', createdAt: '2024-12-11T10:30:00', actionUrl: '/dashboard/student?tab=status' },
    { id: 2, type: 'DOCUMENT_REVIEWED', title: 'Document Reviewed', message: 'Your SRS has been approved', isRead: false, priority: 'Medium', createdAt: '2024-12-11T09:15:00', actionUrl: '/dashboard/student?tab=submissions' },
    { id: 3, type: 'MILESTONE_DUE', title: '⏰ Milestone Due Soon', message: 'API Development is due in 2 days', isRead: false, priority: 'High', createdAt: '2024-12-11T08:00:00', actionUrl: '/dashboard/student?tab=status' },
    { id: 4, type: 'MESSAGE_RECEIVED', title: 'New message from Dr. Sharma', message: 'Project Status Update', isRead: true, priority: 'Medium', createdAt: '2024-12-10T16:30:00', actionUrl: '/messages/1' },
    { id: 5, type: 'TEAM_MEMBER_ADDED', title: '👥 Added to Team', message: 'You have been added to team: Team Alpha', isRead: true, priority: 'Medium', createdAt: '2024-12-10T14:20:00', actionUrl: '/team/1' },
    { id: 6, type: 'ANNOUNCEMENT_POSTED', title: '📢 New Announcement', message: 'Final Project Submission Deadline Extended', isRead: true, priority: 'High', createdAt: '2024-12-09T11:00:00', actionUrl: '/dashboard' },
    { id: 7, type: 'GUIDE_ASSIGNED', title: '👨‍🏫 Guide Assigned', message: 'Dr. Sharma has been assigned as your guide', isRead: true, priority: 'High', createdAt: '2024-12-08T10:00:00', actionUrl: '/dashboard/student?tab=project' },
    { id: 8, type: 'PROGRESS_SUBMITTED', title: '📈 Progress Submitted', message: 'Your week 4 progress has been recorded', isRead: true, priority: 'Low', createdAt: '2024-12-07T15:45:00', actionUrl: '/dashboard/student?tab=progress' }
  ]);

  const [unreadCount, setUnreadCount] = useState(3);

  const filteredNotifications = notifications.filter(n => {
    if (filter === 'unread') return !n.isRead;
    if (filter === 'read') return n.isRead;
    return true;
  });

  const handleNotificationClick = (notification) => {
    if (!notification.isRead) {
      markAsRead(notification.id);
    }
    if (notification.actionUrl) {
      navigate(notification.actionUrl);
    }
  };

  const markAsRead = (notificationId) => {
    setNotifications(prev =>
      prev.map(n => n.id === notificationId ? { ...n, isRead: true } : n)
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    setUnreadCount(0);
  };

  const clearReadNotifications = () => {
    setNotifications(prev => prev.filter(n => !n.isRead));
  };

  const deleteNotification = (notificationId, e) => {
    e.stopPropagation();
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
  };

  const getNotificationIcon = (type) => {
    const icons = {
      PROJECT_APPROVED: '✅',
      PROJECT_REJECTED: '❌',
      PROJECT_SUBMITTED: '📝',
      DOCUMENT_REVIEWED: '📄',
      DOCUMENT_SUBMITTED: '📤',
      MILESTONE_ASSIGNED: '🎯',
      MILESTONE_DUE: '⏰',
      DEADLINE_REMINDER: '⏰',
      TEAM_CREATED: '👥',
      TEAM_MEMBER_ADDED: '👥',
      PROGRESS_SUBMITTED: '📈',
      MESSAGE_RECEIVED: '✉️',
      ANNOUNCEMENT_POSTED: '📢',
      GUIDE_ASSIGNED: '👨‍🏫',
      STATUS_UPDATED: '📊'
    };
    return icons[type] || '🔔';
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'High': return 'danger';
      case 'Medium': return 'warning';
      case 'Low': return 'info';
      default: return 'secondary';
    }
  };

  const getTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="min-vh-100" style={{background: '#f8f9fa'}}>
      {/* Navbar */}
      <div className="bg-white shadow-sm py-3 sticky-top">
        <Container fluid className="px-4">
          <div className="d-flex justify-content-between align-items-center">
            <div className="d-flex align-items-center gap-3">
              <h4 className="fw-bold mb-0" style={{color: '#667eea'}}>🔔 Notifications</h4>
              <Badge bg="danger" pill>{unreadCount}</Badge>
            </div>
            <div className="d-flex gap-2">
              <Button variant="outline-primary" size="sm" onClick={markAllAsRead}>
                Mark All Read
              </Button>
              <Button variant="outline-danger" size="sm" onClick={clearReadNotifications}>
                Clear Read
              </Button>
            </div>
          </div>
        </Container>
      </div>

      <Container fluid className="px-4 py-4">
        <Card className="border-0 shadow-sm">
          <Card.Header className="bg-white border-bottom">
            <ButtonGroup size="sm">
              <Button
                variant={filter === 'all' ? 'primary' : 'outline-primary'}
                onClick={() => setFilter('all')}
              >
                All ({notifications.length})
              </Button>
              <Button
                variant={filter === 'unread' ? 'primary' : 'outline-primary'}
                onClick={() => setFilter('unread')}
              >
                Unread ({unreadCount})
              </Button>
              <Button
                variant={filter === 'read' ? 'primary' : 'outline-primary'}
                onClick={() => setFilter('read')}
              >
                Read ({notifications.length - unreadCount})
              </Button>
            </ButtonGroup>
          </Card.Header>
          <Card.Body className="p-0">
            {filteredNotifications.length === 0 ? (
              <div className="text-center py-5">
                <h5 className="text-muted">No notifications</h5>
                <p className="text-muted">You're all caught up! 🎉</p>
              </div>
            ) : (
              <ListGroup variant="flush">
                {filteredNotifications.map(notification => (
                  <ListGroup.Item
                    key={notification.id}
                    action
                    onClick={() => handleNotificationClick(notification)}
                    className={`border-0 ${!notification.isRead ? 'bg-light' : ''}`}
                    style={{ cursor: 'pointer' }}
                  >
                    <div className="d-flex align-items-start gap-3">
                      <div className="fs-3">{getNotificationIcon(notification.type)}</div>
                      <div className="flex-grow-1">
                        <div className="d-flex justify-content-between align-items-start mb-1">
                          <div className="d-flex align-items-center gap-2">
                            <strong>{notification.title}</strong>
                            {!notification.isRead && (
                              <Badge bg="primary" pill style={{fontSize: '10px'}}>NEW</Badge>
                            )}
                          </div>
                          <div className="d-flex align-items-center gap-2">
                            <Badge bg={getPriorityColor(notification.priority)} pill style={{fontSize: '10px'}}>
                              {notification.priority}
                            </Badge>
                            <Dropdown onClick={(e) => e.stopPropagation()}>
                              <Dropdown.Toggle variant="link" size="sm" className="text-muted p-0 border-0">
                                ⋮
                              </Dropdown.Toggle>
                              <Dropdown.Menu align="end">
                                {!notification.isRead && (
                                  <Dropdown.Item onClick={(e) => { e.stopPropagation(); markAsRead(notification.id); }}>
                                    Mark as read
                                  </Dropdown.Item>
                                )}
                                <Dropdown.Item onClick={(e) => deleteNotification(notification.id, e)}>
                                  Delete
                                </Dropdown.Item>
                              </Dropdown.Menu>
                            </Dropdown>
                          </div>
                        </div>
                        <p className="mb-1 text-muted">{notification.message}</p>
                        <small className="text-muted">{getTimeAgo(notification.createdAt)}</small>
                      </div>
                    </div>
                  </ListGroup.Item>
                ))}
              </ListGroup>
            )}
          </Card.Body>
        </Card>
      </Container>
    </div>
  );
};

export default NotificationsPage;
