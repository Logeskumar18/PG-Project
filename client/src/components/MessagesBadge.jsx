import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Badge, Dropdown } from 'react-bootstrap';

const MessagesBadge = () => {
  const navigate = useNavigate();
  const [unreadCount] = useState(2);

  return (
    <div 
      onClick={() => navigate('/messages')}
      className="position-relative d-inline-block"
      style={{ cursor: 'pointer' }}
      title="Messages"
    >
      <span style={{ fontSize: '20px' }}>✉️</span>
      {unreadCount > 0 && (
        <Badge
          bg="danger"
          pill
          className="position-absolute"
          style={{ top: '-5px', right: '-5px', fontSize: '10px' }}
        >
          {unreadCount > 9 ? '9+' : unreadCount}
        </Badge>
      )}
    </div>
  );
};

export default MessagesBadge;
