import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Container, Row, Col, Card, Button, Form, Badge, ListGroup, Modal, Alert } from 'react-bootstrap';

const MessagesPage = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('inbox');
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [showComposeModal, setShowComposeModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Sample data (in production, fetch from API)
  const [conversations] = useState([
    { id: 1, userId: 1, userName: 'Dr. Sharma', userRole: 'Staff', lastMessage: 'Your document has been approved', unreadCount: 2, time: '10:30 AM' },
    { id: 2, userId: 2, userName: 'HOD Singh', userRole: 'HOD', lastMessage: 'Please submit your final report', unreadCount: 0, time: 'Yesterday' },
    { id: 3, userId: 3, userName: 'Priya Kumar', userRole: 'Student', lastMessage: 'Thanks for the feedback!', unreadCount: 0, time: '2 days ago' }
  ]);

  const [messages] = useState([
    { id: 1, senderId: 1, senderName: 'Dr. Sharma', subject: 'Document Approved', message: 'Your SRS document has been reviewed and approved. Great work!', priority: 'High', isRead: false, createdAt: '2024-12-11T10:30:00' },
    { id: 2, senderId: 2, senderName: 'HOD Singh', subject: 'Final Report Deadline', message: 'Please ensure you submit your final project report by Dec 20th.', priority: 'Urgent', isRead: false, createdAt: '2024-12-10T14:20:00' },
    { id: 3, senderId: 1, senderName: 'Dr. Sharma', subject: 'Project Milestone', message: 'Your milestone for API development is due next week. Let me know if you need any help.', priority: 'Medium', isRead: true, createdAt: '2024-12-09T09:15:00' }
  ]);

  const [sentMessages] = useState([
    { id: 4, receiverId: 1, receiverName: 'Dr. Sharma', subject: 'Progress Update', message: 'Completed the database design phase. Attached the ER diagram for review.', priority: 'Medium', createdAt: '2024-12-10T16:45:00' },
    { id: 5, receiverId: 3, receiverName: 'Priya Kumar', subject: 'Team Meeting', message: 'Let\'s schedule a team meeting for tomorrow at 3 PM to discuss the frontend.', priority: 'Medium', createdAt: '2024-12-09T11:30:00' }
  ]);

  const [unreadCount, setUnreadCount] = useState(2);

  const handleComposeMessage = (e) => {
    e.preventDefault();
    setSuccessMessage('Message sent successfully!');
    setShowComposeModal(false);
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const markAsRead = (messageId) => {
    console.log('Mark message as read:', messageId);
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'Urgent': return 'danger';
      case 'High': return 'warning';
      case 'Medium': return 'info';
      default: return 'secondary';
    }
  };

  return (
    <div className="min-vh-100" style={{ background: '#f8f9fa' }}>
      {/* Navbar */}
      <div className="bg-white shadow-sm py-3 sticky-top">
        <Container fluid className="px-4">
          <div className="d-flex justify-content-between align-items-center">
            <h4 className="fw-bold mb-0" style={{ color: '#667eea' }}>✉️ Messages</h4>
            <div className="d-flex gap-2 align-items-center">
              <Badge bg="danger" pill>{unreadCount}</Badge>
              <Button variant="primary" onClick={() => setShowComposeModal(true)}>
                ✏️ Compose
              </Button>
            </div>
          </div>
        </Container>
      </div>

      <Container fluid className="px-4 py-4">
        {successMessage && (
          <Alert variant="success" dismissible onClose={() => setSuccessMessage('')}>
            ✅ {successMessage}
          </Alert>
        )}

        <Row className="g-4">
          {/* Sidebar - Conversations List */}
          <Col lg={4}>
            <Card className="border-0 shadow-sm">
              <Card.Body className="p-0">
                {/* Tabs */}
                <div className="p-3 border-bottom">
                  <div className="d-flex gap-2">
                    <Button
                      size="sm"
                      variant={activeTab === 'inbox' ? 'primary' : 'light'}
                      onClick={() => setActiveTab('inbox')}
                      className="flex-fill"
                    >
                      📥 Inbox
                    </Button>
                    <Button
                      size="sm"
                      variant={activeTab === 'sent' ? 'primary' : 'light'}
                      onClick={() => setActiveTab('sent')}
                      className="flex-fill"
                    >
                      📤 Sent
                    </Button>
                  </div>
                </div>

                {/* Conversations/Messages List */}
                <ListGroup variant="flush" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                  {activeTab === 'inbox' && conversations.map(conv => (
                    <ListGroup.Item
                      key={conv.id}
                      action
                      active={selectedConversation?.id === conv.id}
                      onClick={() => setSelectedConversation(conv)}
                      className="border-0"
                    >
                      <div className="d-flex justify-content-between align-items-start">
                        <div className="flex-grow-1">
                          <div className="d-flex align-items-center gap-2 mb-1">
                            <strong>{conv.userName}</strong>
                            <Badge bg="secondary" pill style={{ fontSize: '10px' }}>
                              {conv.userRole}
                            </Badge>
                            {conv.unreadCount > 0 && (
                              <Badge bg="danger" pill>{conv.unreadCount}</Badge>
                            )}
                          </div>
                          <p className="mb-0 text-muted small text-truncate">
                            {conv.lastMessage}
                          </p>
                        </div>
                        <small className="text-muted">{conv.time}</small>
                      </div>
                    </ListGroup.Item>
                  ))}

                  {activeTab === 'sent' && sentMessages.map(msg => (
                    <ListGroup.Item
                      key={msg.id}
                      action
                      className="border-0"
                    >
                      <div className="d-flex justify-content-between align-items-start">
                        <div className="flex-grow-1">
                          <strong className="d-block mb-1">To: {msg.receiverName}</strong>
                          <p className="mb-0 text-muted small">{msg.subject}</p>
                        </div>
                        <small className="text-muted">
                          {new Date(msg.createdAt).toLocaleTimeString()}
                        </small>
                      </div>
                    </ListGroup.Item>
                  ))}
                </ListGroup>
              </Card.Body>
            </Card>
          </Col>

          {/* Main Content - Message Thread */}
          <Col lg={8}>
            {selectedConversation ? (
              <Card className="border-0 shadow-sm">
                <Card.Header className="bg-white border-bottom">
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <h5 className="mb-0 fw-bold">{selectedConversation.userName}</h5>
                      <small className="text-muted">{selectedConversation.userRole}</small>
                    </div>
                    <Button variant="outline-primary" size="sm">
                      Reply
                    </Button>
                  </div>
                </Card.Header>
                <Card.Body style={{ maxHeight: '60vh', overflowY: 'auto' }}>
                  {messages.filter(m => m.senderId === selectedConversation.userId).map(msg => (
                    <div key={msg.id} className="mb-4">
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <div>
                          <Badge bg={getPriorityColor(msg.priority)} className="me-2">
                            {msg.priority}
                          </Badge>
                          <strong>{msg.subject}</strong>
                        </div>
                        <small className="text-muted">
                          {new Date(msg.createdAt).toLocaleString()}
                        </small>
                      </div>
                      <div className="bg-light p-3 rounded-3">
                        <p className="mb-0">{msg.message}</p>
                      </div>
                      {!msg.isRead && (
                        <Button
                          variant="link"
                          size="sm"
                          className="p-0 mt-1"
                          onClick={() => markAsRead(msg.id)}
                        >
                          Mark as read
                        </Button>
                      )}
                    </div>
                  ))}
                </Card.Body>
                <Card.Footer className="bg-white">
                  <Form>
                    <Form.Group>
                      <Form.Control
                        as="textarea"
                        rows={3}
                        placeholder="Type your reply..."
                      />
                    </Form.Group>
                    <div className="d-flex justify-content-end gap-2 mt-2">
                      <Button variant="outline-secondary" size="sm">
                        📎 Attach
                      </Button>
                      <Button variant="primary" size="sm">
                        Send
                      </Button>
                    </div>
                  </Form>
                </Card.Footer>
              </Card>
            ) : (
              <Card className="border-0 shadow-sm">
                <Card.Body className="text-center py-5">
                  <h4 className="text-muted">Select a conversation to view messages</h4>
                  <p className="text-muted">Choose a conversation from the left sidebar</p>
                </Card.Body>
              </Card>
            )}
          </Col>
        </Row>
      </Container>

      {/* Compose Message Modal */}
      <Modal show={showComposeModal} onHide={() => setShowComposeModal(false)} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title>✏️ Compose New Message</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleComposeMessage}>
            <Form.Group className="mb-3">
              <Form.Label>To</Form.Label>
              <Form.Select required>
                <option value="">Select recipient...</option>
                <option value="1">Dr. Sharma (Staff)</option>
                <option value="2">HOD Singh (HOD)</option>
                <option value="3">Priya Kumar (Student)</option>
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Subject</Form.Label>
              <Form.Control type="text" placeholder="Enter subject" required />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Priority</Form.Label>
              <Form.Select>
                <option value="Low">Low</option>
                <option value="Medium" selected>Medium</option>
                <option value="High">High</option>
                <option value="Urgent">Urgent</option>
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Message</Form.Label>
              <Form.Control
                as="textarea"
                rows={6}
                placeholder="Type your message..."
                required
              />
            </Form.Group>

            <div className="d-flex justify-content-end gap-2">
              <Button variant="secondary" onClick={() => setShowComposeModal(false)}>
                Cancel
              </Button>
              <Button variant="primary" type="submit">
                Send Message
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default MessagesPage;
