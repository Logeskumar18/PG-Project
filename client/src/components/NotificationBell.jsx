import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Badge, Dropdown, ListGroup } from 'react-bootstrap';

const NotificationBell = () => {
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(3);
  
  // Sample recent notifications
  const [recentNotifications] = useState([
    { id: 1, type: 'PROJECT_APPROVED', title: '✅ Project Approved!', message: 'Your project has been approved', isRead: false, createdAt: '2024-12-11T10:30:00' },
    { id: 2, type: 'DOCUMENT_REVIEWED', title: 'Document Reviewed', message: 'Your SRS has been approved', isRead: false, createdAt: '2024-12-11T09:15:00' },
    { id: 3, type: 'MILESTONE_DUE', title: '⏰ Milestone Due Soon', message: 'API Development is due in 2 days', isRead: false, createdAt: '2024-12-11T08:00:00' }
  ]);

  const getTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return 'Yesterday';
  };

  return (
    <Dropdown align="end">
      <Dropdown.Toggle
        variant="light"
        id="notification-dropdown"
        className="position-relative border-0 bg-white"
        style={{ fontSize: '20px' }}
      >
        🔔
        {unreadCount > 0 && (
          <Badge
            bg="danger"
            pill
            className="position-absolute"
            style={{ top: '0', right: '0', fontSize: '10px' }}
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </Badge>
        )}
      </Dropdown.Toggle>

      <Dropdown.Menu style={{ width: '350px', maxHeight: '400px', overflowY: 'auto' }}>
        <div className="px-3 py-2 border-bottom">
          <div className="d-flex justify-content-between align-items-center">
            <h6 className="mb-0 fw-bold">Notifications</h6>
            <Badge bg="danger" pill>{unreadCount}</Badge>
          </div>
        </div>

        <ListGroup variant="flush">
          {recentNotifications.map(notification => (
            <ListGroup.Item
              key={notification.id}
              action
              onClick={() => navigate('/notifications')}
              className="border-0 py-2"
            >
              <div className="d-flex flex-column">
                <div className="d-flex justify-content-between align-items-start mb-1">
                  <strong className="small">{notification.title}</strong>
                  {!notification.isRead && (
                    <Badge bg="primary" pill style={{ fontSize: '8px' }}>NEW</Badge>
                  )}
                </div>
                <p className="mb-1 small text-muted text-truncate">{notification.message}</p>
                <small className="text-muted" style={{ fontSize: '11px' }}>
                  {getTimeAgo(notification.createdAt)}
                </small>
              </div>
            </ListGroup.Item>
          ))}
        </ListGroup>

        <Dropdown.Divider />
        <div className="text-center py-2">
          <Dropdown.Item
            as="button"
            onClick={() => navigate('/notifications')}
            className="text-primary fw-semibold small"
          >
            View All Notifications →
          </Dropdown.Item>
        </div>
      </Dropdown.Menu>
    </Dropdown>
  );
};

export default NotificationBell;
