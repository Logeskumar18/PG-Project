import { useState, useEffect } from 'react';
import ConfirmLogoutModal from '../components/ConfirmLogoutModal';
import MyProfile from './MyProfile';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Container, Row, Col, Card, Button, Form, Alert, Modal, Badge } from 'react-bootstrap';
import ProjectForm from '../components/ProjectForm.jsx';
import api from '../services/api';
import downloadPDF from '../utils/downloadPDF';
import html2pdf from 'html2pdf.js'; // Ensure this import for Vite/React


const StudentDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [projects, setProjects] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [progressUpdates, setProgressUpdates] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [deadlines, setDeadlines] = useState([]);
  const [messages, setMessages] = useState([]);
  const [loadingAnnouncements, setLoadingAnnouncements] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [feedbackSubject, setFeedbackSubject] = useState('');
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [evaluation, setEvaluation] = useState(null);

  // Reply Modal State
  const [showReplyModal, setShowReplyModal] = useState(false);
  const [replyToMessage, setReplyToMessage] = useState(null);
  const [replySubject, setReplySubject] = useState('');
  const [replyContent, setReplyContent] = useState('');
  const [replyLoading, setReplyLoading] = useState(false);

  // Compose Modal State
  const [showComposeModal, setShowComposeModal] = useState(false);
  const [composeSubject, setComposeSubject] = useState('');
  const [composeMessage, setComposeMessage] = useState('');
  const [composeLoading, setComposeLoading] = useState(false);
  
  const [meetings, setMeetings] = useState([]);
  const [showMeetingModal, setShowMeetingModal] = useState(false);

  // Fetch announcements and projects
  const fetchAnnouncements = async () => {
    try {
      setLoadingAnnouncements(true);
      const response = await api.get('/communication/announcements');
      if (response.data.data) {
        setAnnouncements(response.data.data);
      }
      setLoadingAnnouncements(false);
    } catch (error) {
      console.error('Error fetching announcements:', error);
      setLoadingAnnouncements(false);
    }
  };

  const fetchDeadlines = async () => {
    try {
      const response = await api.get('/deadlines');
      if (response.data.data) {
        setDeadlines(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching deadlines:', error);
    }
  };

  const fetchMessages = async () => {
    try {
      setLoadingMessages(true);
      const response = await api.get('/communication/messages/inbox');
      if (response.data.data) {
        setMessages(response.data.data);
      } else {
        setMessages([]);
      }
      setLoadingMessages(false);
    } catch (error) {
      console.error('Error fetching messages:', error);
      setLoadingMessages(false);
    }
  };

  const fetchProject = async () => {
    try {
      const response = await api.get('/student/projects/my');
      if (response.data.data && response.data.data.length > 0) {
        setProjects(response.data.data);
      } else {
        setProjects([]);
      }
    } catch (error) {
      // No projects yet, ignore
      setProjects([]);
    }
  };

  const fetchDocuments = async () => {
    try {
      const response = await api.get('/student/documents/my');
      if (response.data.data) {
        setDocuments(response.data.data);
      } else {
        setDocuments([]);
      }
    } catch (error) {
      // No documents yet, ignore
      setDocuments([]);
    }
  };

  const fetchEvaluation = async () => {
    try {
      const response = await api.get('/marks/my-marks');
      if (response.data.data) {
        // Handle if response is array or object
        let data = response.data.data;
        if (Array.isArray(data)) {
            // Sort by evaluatedAt desc to get latest
            data.sort((a, b) => new Date(b.evaluatedAt) - new Date(a.evaluatedAt));
            data = data.length > 0 ? data[0] : null;
        }
        setEvaluation(data);
      }
    } catch (error) {
      console.error('Error fetching evaluation:', error);
    }
  };

  const fetchMeetings = async () => {
    try {
      const response = await api.get('/student/meetings/my');
      if (response.data.success) {
        setMeetings(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching meetings:', error);
    }
  };

  // Fetch announcements on mount
  useEffect(() => {
    fetchAnnouncements();
    fetchDeadlines();
    fetchProject();
    fetchDocuments();
    fetchMessages();
    fetchEvaluation();
    fetchMeetings();
  }, []);

  // Fetch documents when switching to submissions tab
  useEffect(() => {
    if (activeTab === 'submissions') {
      fetchDocuments();
    }
    if (activeTab === 'evaluation') {
      fetchEvaluation();
    }
  }, [activeTab]);

  const handleDocumentUpload = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const docType = formData.get('docType');
    const file = formData.get('file');
    const comments = formData.get('comments');

    if (file && file.name && docType) {
      try {
        const uploadData = new FormData();
        uploadData.append('file', file);
        uploadData.append('docType', docType);
        uploadData.append('comments', comments || '');

        const response = await api.post('/student/documents', uploadData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });

        if (response.data && response.data.success) {
          setSuccessMessage('Document uploaded successfully!');
          // Refresh documents list
          fetchDocuments();
          e.target.reset();
          setTimeout(() => setSuccessMessage(''), 3000);
        } else {
          setSuccessMessage('Failed to upload document.');
        }
      } catch (error) {
        setSuccessMessage('Error uploading document: ' + (error.response?.data?.message || error.message));
        setTimeout(() => setSuccessMessage(''), 5000);
      }
    } else {
      setSuccessMessage('Please select a file and document type.');
      setTimeout(() => setSuccessMessage(''), 3000);
    }
  };

  const handleProgressSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const weekNumber = parseInt(formData.get('week'));
    const progressPercentage = parseInt(formData.get('progress'));
    const description = formData.get('update');
    const tasksCompleted = formData.get('tasks') ? formData.get('tasks').split(',').map(t => t.trim()) : [];
    const challenges = formData.get('challenges');
    const nextWeekPlan = formData.get('nextWeekPlan');

    if (projects.length === 0) {
      setSuccessMessage('No project found to submit progress for');
      setTimeout(() => setSuccessMessage(''), 3000);
      return;
    }

    try {
      const res = await api.post('/student/progress', {
        projectId: projects[0]._id,
        weekNumber,
        progressPercentage,
        description,
        tasksCompleted,
        challenges,
        nextWeekPlan
      });

      setSuccessMessage('Progress update submitted successfully!');
      e.target.reset();
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      setSuccessMessage('Error submitting progress: ' + (error.response?.data?.message || error.message));
      setTimeout(() => setSuccessMessage(''), 5000);
    }
  };

  const handleFeedbackSubmit = async (e) => {
    e.preventDefault();
    if (feedbackSubject.trim() && feedbackMessage.trim()) {
      setFeedbackLoading(true);
      try {
        // Assuming there's an API endpoint for sending feedback
        await api.post('/student/feedback', {
          subject: feedbackSubject,
          message: feedbackMessage
        });
        setSuccessMessage('Feedback sent successfully!');
        setFeedbackSubject('');
        setFeedbackMessage('');
        setTimeout(() => setSuccessMessage(''), 3000);
      } catch (error) {
        setSuccessMessage('Error sending feedback: ' + (error.response?.data?.message || error.message));
        setTimeout(() => setSuccessMessage(''), 5000);
      } finally {
        setFeedbackLoading(false);
      }
    }
  };

  const handleReply = (message) => {
    setReplyToMessage(message);
    setReplySubject(`Re: ${message.subject}`);
    setReplyContent('');
    setShowReplyModal(true);
  };

  const handleSendReply = async (e) => {
    e.preventDefault();
    if (!replyContent.trim()) return;

    try {
      setReplyLoading(true);

      // Determine receiver ID from the message sender
      // If populated, use _id. If string, use directly.
      const receiverId = replyToMessage.senderId?._id || replyToMessage.senderId;

      await api.post('/communication/messages', {
        receiverId: receiverId,
        subject: replySubject,
        message: replyContent,
        priority: 'Medium'
      });

      setSuccessMessage('Reply sent successfully!');
      setShowReplyModal(false);
      setReplyToMessage(null);
      setReplySubject('');
      setReplyContent('');

      // Refresh messages
      fetchMessages();

      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Error sending reply:', error);
      setSuccessMessage('Error sending reply: ' + (error.response?.data?.message || error.message));
      setTimeout(() => setSuccessMessage(''), 5000);
    } finally {
      setReplyLoading(false);
    }
  };

  const handleComposeSubmit = async (e) => {
    e.preventDefault();
    
    let receiverId = null;
    if (projects.length > 0 && projects[0].assignedGuideId) {
        receiverId = projects[0].assignedGuideId._id || projects[0].assignedGuideId;
    }

    if (!receiverId) {
        setSuccessMessage("You don't have an assigned guide to message yet.");
        setShowComposeModal(false);
        setTimeout(() => setSuccessMessage(''), 3000);
        return;
    }

    try {
      setComposeLoading(true);
      await api.post('/communication/messages', {
        receiverId,
        subject: composeSubject,
        message: composeMessage,
        priority: 'Medium'
      });
      setSuccessMessage('Message sent successfully!');
      setShowComposeModal(false);
      setComposeSubject('');
      setComposeMessage('');
      fetchMessages();
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      setSuccessMessage('Error sending message: ' + (error.response?.data?.message || error.message));
      setTimeout(() => setSuccessMessage(''), 5000);
    } finally {
      setComposeLoading(false);
    }
  };

  const handleMeetingRequest = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    
    if (projects.length === 0 || !projects[0].assignedGuideId) {
      setErrorMessage("You don't have an assigned guide to request a meeting with.");
      setShowMeetingModal(false);
      setTimeout(() => setErrorMessage(''), 3000);
      return;
    }

    try {
      await api.post('/student/meetings', {
        guideId: projects[0].assignedGuideId._id || projects[0].assignedGuideId,
        projectId: projects[0]._id,
        topic: formData.get('topic'),
        date: formData.get('date'),
        time: formData.get('time'),
        duration: formData.get('duration')
      });
      setSuccessMessage('Meeting requested successfully!');
      setShowMeetingModal(false);
      fetchMeetings();
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      setErrorMessage('Error requesting meeting: ' + (error.response?.data?.message || error.message));
      setTimeout(() => setErrorMessage(''), 5000);
    }
  };

  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const handleLogoutClick = () => {
    setShowLogoutModal(true);
  };
  const handleConfirmLogout = () => {
    setShowLogoutModal(false);
    logout();
    navigate('/login/student');
  };
  const handleCancelLogout = () => {
    setShowLogoutModal(false);
  };

  return (
    <div className="min-vh-100" style={{ background: '#f8f9fa' }}>
      <style>
        {`
          @media print {
            body * {
              visibility: hidden;
            }
            #printable-evaluation, #printable-evaluation * {
              visibility: visible;
            }
            #printable-evaluation {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
            }
            .no-print {
              display: none !important;
            }
          }
        `}
      </style>
      {/* Navbar */}
      <div className="bg-white shadow-sm py-3 sticky-top">
        <Container fluid className="px-4">
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h4 className="fw-bold mb-0" style={{ color: '#667eea' }}>📚 Student Dashboard</h4>
              <small className="text-muted">Welcome, {user?.name}</small>
            </div>
            <Button variant="danger" size="sm" onClick={handleLogoutClick}>Logout</Button>
                <ConfirmLogoutModal
                  show={showLogoutModal}
                  onConfirm={handleConfirmLogout}
                  onCancel={handleCancelLogout}
                />
          </div>
        </Container>
      </div>

      <Container fluid className="px-4 py-4">
        {successMessage && (
          <Alert variant="success" dismissible onClose={() => setSuccessMessage('')} className="mb-4">
            ✅ {successMessage}
          </Alert>
        )}
        {errorMessage && (
          <Alert variant="danger" dismissible onClose={() => setErrorMessage('')} className="mb-4">
            ⚠️ {errorMessage}
          </Alert>
        )}

        {/* Tabs */}
        <div className="d-flex gap-2 mb-4 flex-wrap">
          <Button
            variant={activeTab === 'overview' ? 'primary' : 'light'}
            onClick={() => setActiveTab('overview')}
            className="fw-semibold"
          >
            📊 Overview
          </Button>
          <Button
            variant={activeTab === 'project' ? 'primary' : 'light'}
            onClick={() => setActiveTab('project')}
            className="fw-semibold"
          >
            📋 My Project
          </Button>
          <Button
            variant={activeTab === 'submissions' ? 'primary' : 'light'}
            onClick={() => setActiveTab('submissions')}
            className="fw-semibold"
          >
            📁 Submissions
          </Button>
          <Button
            variant={activeTab === 'progress' ? 'primary' : 'light'}
            onClick={() => setActiveTab('progress')}
            className="fw-semibold"
          >
            📈 Progress
          </Button>
          <Button
            variant={activeTab === 'evaluation' ? 'primary' : 'light'}
            onClick={() => setActiveTab('evaluation')}
            className="fw-semibold"
          >
            📝 Evaluation
          </Button>
          <Button
            variant={activeTab === 'meetings' ? 'primary' : 'light'}
            onClick={() => setActiveTab('meetings')}
            className="fw-semibold"
          >
            📅 Meetings
          </Button>
          {/* <Button
            variant={activeTab === 'feedback' ? 'primary' : 'light'}
            onClick={() => setActiveTab('feedback')}
            className="fw-semibold"
          >
            💬 Feedback
          </Button> */}
          <Button
            variant={activeTab === 'status' ? 'primary' : 'light'}
            onClick={() => setActiveTab('status')}
            className="fw-semibold"
          >
            ✅ Status
          </Button>
          <Button
            variant={activeTab === 'messages' ? 'primary' : 'light'}
            onClick={() => setActiveTab('messages')}
            className="fw-semibold"
          >
            💬 Messages
          </Button>
          <Button
            variant={activeTab === 'announcements' ? 'primary' : 'light'}
            onClick={() => setActiveTab('announcements')}
            className="fw-semibold"
          >
            📢 Announcements
          </Button>
          <Button
            variant={activeTab === 'profile' ? 'primary' : 'light'}
            onClick={() => setActiveTab('profile')}
            className="fw-semibold"
          >
            👤 My Profile
          </Button>
        </div>
        {/* My Profile Tab */}
        {activeTab === 'profile' && (
          <Row className="g-4">
            <Col lg={12}>
              <MyProfile />
            </Col>
          </Row>
        )}

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <Row className="g-4">
            <Col lg={6}>
              <Card className="border-0 shadow-sm h-100">
                <Card.Body className="p-4">
                  <h5 className="fw-bold mb-4">📊 Quick Stats</h5>
                  <div className="d-flex flex-column gap-3">
                    <div className="d-flex justify-content-between p-3 bg-light rounded-3">
                      <span className="fw-semibold">Project Status:</span>
                      <span className="badge bg-info">{projects.length > 0 ? 'In Progress' : 'Not Started'}</span>
                    </div>
                    <div className="d-flex justify-content-between p-3 bg-light rounded-3">
                      <span className="fw-semibold">Documents Uploaded:</span>
                      <span className="badge bg-primary">{documents.length}</span>
                    </div>
                    <div className="d-flex justify-content-between p-3 bg-light rounded-3">
                      <span className="fw-semibold">Progress Updates:</span>
                      <span className="badge bg-warning">{progressUpdates.length}</span>
                    </div>
                    <div className="d-flex justify-content-between p-3 bg-light rounded-3">
                      <span className="fw-semibold">Feedback:</span>
                      <span className="badge bg-success">0</span>
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </Col>

            <Col lg={6}>
              <Card className="border-0 shadow-sm h-100">
                <Card.Body className="p-4">
                  <h5 className="fw-bold mb-4">📌 Quick Actions</h5>
                  <div className="d-flex flex-column gap-3">
                    <Button
                      className="w-100 fw-semibold text-white py-3"
                      style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', border: 'none' }}
                      onClick={() => setShowProjectModal(true)}
                    >
                      ➕ Submit Project Title
                    </Button>
                    <Button variant="outline-primary" className="w-100 fw-semibold py-3" onClick={() => setActiveTab('submissions')}>
                      📤 Upload Document
                    </Button>
                    <Button variant="outline-secondary" className="w-100 fw-semibold py-3" onClick={() => setActiveTab('progress')}>
                      ✍️ Weekly Progress Update
                    </Button>
                  </div>
                </Card.Body>
              </Card>
            </Col>

            {deadlines.length > 0 && (
              <Col lg={12}>
                <Card className="border-0 shadow-sm">
                  <Card.Body className="p-4">
                    <h5 className="fw-bold mb-4">⏰ Upcoming Global Deadlines</h5>
                    <div className="d-flex flex-column gap-3">
                      {deadlines.map(deadline => (
                        <div key={deadline._id} className="p-3 bg-light rounded-3 d-flex justify-content-between align-items-center border-start border-4 border-warning">
                          <div>
                            <h6 className="fw-bold mb-1">{deadline.title === 'Other' ? deadline.customTitle : deadline.title}</h6>
                            <p className="text-muted mb-0 small">{deadline.description}</p>
                          </div>
                          <div className="text-end">
                            <div className="fw-bold text-danger">{new Date(deadline.date).toLocaleDateString()}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            )}

            <Col lg={12}>
              <Card className="border-0 shadow-sm">
                <Card.Body className="p-4">
                  <h5 className="fw-bold mb-4">📅 Your Information</h5>
                  <Row>
                    <Col md={6}>
                      <div className="mb-3">
                        <small className="text-muted">Name</small>
                        <p className="fw-semibold">{user?.name}</p>
                      </div>
                    </Col>
                    <Col md={6}>
                      <div className="mb-3">
                        <small className="text-muted">Email</small>
                        <p className="fw-semibold">{user?.email}</p>
                      </div>
                    </Col>
                    <Col md={6}>
                      <div className="mb-3">
                        <small className="text-muted">Roll Number</small>
                        <p className="fw-semibold">{user?.studentId || 'Not Set'}</p>
                      </div>
                    </Col>
                    <Col md={6}>
                      <div className="mb-3">
                        <small className="text-muted">Department</small>
                        <p className="fw-semibold">{user?.department || 'Not Set'}</p>
                      </div>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        )}

        {/* My Project Tab */}
        {activeTab === 'project' && (
          <Row className="g-4">
            <Col lg={12}>
              {projects.length === 0 ? (
                <Card className="border-0 shadow-sm">
                  <Card.Body className="p-5 text-center">
                    <h5 className="fw-bold mb-3">📋 No Project Submitted Yet</h5>
                    <p className="text-muted mb-4">Submit your project title to get started</p>
                    <Button
                      className="fw-semibold text-white px-5 py-2"
                      style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', border: 'none' }}
                      onClick={() => setShowProjectModal(true)}
                    >
                      Submit Project Title
                    </Button>
                  </Card.Body>
                </Card>
              ) : (
                <div className="d-flex flex-column gap-4">
                  {projects.length > 0 && projects[0].approvalStatus === 'Rejected' && (
                    <div className="text-end">
                      <Button 
                        className="fw-semibold text-white"
                        style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', border: 'none' }}
                        onClick={() => setShowProjectModal(true)}
                      >
                        Submit New Project Proposal
                      </Button>
                    </div>
                  )}
                  {projects.map((project) => (
                    <Card key={project._id} className="border-0 shadow-sm">
                      <Card.Body className="p-4">
                        <div className="d-flex justify-content-between align-items-start mb-4 pb-3 border-bottom">
                          <div>
                            <h5 className="fw-bold mb-2">
                              {project.isArchived && <Badge bg="secondary" className="me-2 align-middle">🗄️ Archived {project.academicYear}</Badge>}
                              {project.title}
                            </h5>
                            <small className="text-muted">Submitted on {project.submissionDate ? new Date(project.submissionDate).toLocaleDateString() : (project.submittedAt ? new Date(project.submittedAt).toLocaleDateString() : 'N/A')}</small>
                          </div>
                          <span className={`badge ${project.approvalStatus === 'Approved' ? 'bg-success' : project.approvalStatus === 'Rejected' ? 'bg-danger' : 'bg-info'}`}>{project.approvalStatus || project.status}</span>
                        </div>
                        <div className="mb-4">
                          <h6 className="fw-semibold mb-2">Description:</h6>
                          <p className="text-muted mb-0">{project.description}</p>
                        </div>
                        {project.approvalRemarks && (
                          <div className="mb-4">
                            <h6 className="fw-semibold mb-2">Staff Feedback:</h6>
                            <p className="text-muted mb-0">{project.approvalRemarks}</p>
                          </div>
                        )}
                      </Card.Body>
                    </Card>
                  ))}
                </div>
              )}
            </Col>
          </Row>
        )}

        {/* Submissions Tab */}
        {activeTab === 'submissions' && (
          <Row className="g-4">
            <Col lg={6}>
              <Card className="border-0 shadow-sm">
                <Card.Body className="p-4">
                  <h5 className="fw-bold mb-4">📤 Upload Documents</h5>
                  <Form onSubmit={handleDocumentUpload}>
                    <Form.Group className="mb-3">
                      <Form.Label>Document Type</Form.Label>
                      <Form.Select name="docType" required>
                        <option value="">Select Document Type</option>
                        <option value="srs">SRS (Software Requirements)</option>
                        <option value="ppt">Presentation (PPT)</option>
                        <option value="report">Report</option>
                        <option value="code">Source Code</option>
                        <option value="other">Other</option>
                      </Form.Select>
                    </Form.Group>
                    <Form.Group className="mb-3">
                      <Form.Label>Select File</Form.Label>
                      <Form.Control type="file" name="file" required />
                    </Form.Group>
                    <Form.Group className="mb-4">
                      <Form.Label>Comments (Optional)</Form.Label>
                      <Form.Control as="textarea" rows={3} name="comments" placeholder="Add any comments about your submission" />
                    </Form.Group>
                    <Button
                      type="submit"
                      className="w-100 fw-semibold text-white"
                      style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', border: 'none' }}
                    >
                      Upload Document
                    </Button>
                  </Form>
                </Card.Body>
              </Card>
            </Col>

            <Col lg={6}>
              <Card className="border-0 shadow-sm">
                <Card.Body className="p-4">
                  <div className="d-flex justify-content-between align-items-center mb-4">
                    <h5 className="fw-bold mb-0">📁 My Submissions</h5>
                    <Button
                      variant="outline-secondary"
                      size="sm"
                      onClick={fetchDocuments}
                      disabled={documents.length === 0}
                    >
                      🔄 Refresh
                    </Button>
                  </div>
                  {documents.length === 0 ? (
                    <div className="text-center py-5 text-muted">
                      <p className="mb-0">No submissions yet</p>
                      <small>Upload documents to track them here</small>
                    </div>
                  ) : (
                    <div className="d-flex flex-column gap-3">
                      {documents.map((doc) => (
                        <div key={doc._id} className="p-3 bg-light rounded-3">
                          <div className="d-flex justify-content-between mb-2">
                            <strong>{doc.fileName}</strong>
                            <span className={`badge ${doc.reviewStatus === 'Approved' ? 'bg-success' : doc.reviewStatus === 'Rejected' ? 'bg-danger' : 'bg-warning'}`}>{doc.reviewStatus || 'Pending'}</span>
                          </div>
                          <small className="text-muted d-block mb-2">Type: {doc.type}</small>
                          <small className="text-muted d-block mb-2">Project: {doc.projectId?.title || 'N/A'}</small>
                          {doc.comments && <small className="text-muted d-block mb-2">Comments: {doc.comments}</small>}
                          <small className="text-muted d-block">Uploaded: {new Date(doc.uploadedAt).toLocaleDateString()}</small>
                          {doc.remarks && <small className="d-block mt-2 text-dark"><strong>Staff Remarks:</strong> {doc.remarks}</small>}
                          <div className="mt-2">
                            {(doc.fileUrl || doc.url) ? (
                              <a href={doc.fileUrl || doc.url} target="_blank" rel="noopener noreferrer" className="btn btn-outline-primary btn-sm me-2">Download</a>
                            ) : (
                              <a href={api.defaults?.baseURL ? `${api.defaults.baseURL.replace(/\/$/, '')}/student/documents/${doc._id}/download` : `/api/student/documents/${doc._id}/download`} target="_blank" rel="noopener noreferrer" className="btn btn-outline-primary btn-sm me-2">Download</a>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </Card.Body>
              </Card>
            </Col>
          </Row>
        )}

        {/* Progress Tab */}
        {activeTab === 'progress' && (
          <Row className="g-4">
            <Col lg={12}>
              <Card className="border-0 shadow-sm">
                <Card.Body className="p-4">
                  <h5 className="fw-bold mb-4">📈 Weekly Progress Updates</h5>
                  <Form onSubmit={handleProgressSubmit}>
                    <Form.Group className="mb-3">
                      <Form.Label>Week Number</Form.Label>
                      <Form.Select name="week" required>
                        <option value="">Select Week</option>
                        <option value="1">Week 1</option>
                        <option value="2">Week 2</option>
                        <option value="3">Week 3</option>
                        <option value="4">Week 4</option>
                        <option value="5">Week 5</option>
                        <option value="6">Week 6</option>
                        <option value="7">Week 7</option>
                        <option value="8">Week 8</option>
                      </Form.Select>
                    </Form.Group>
                    <Form.Group className="mb-4">
                      <Form.Label>Progress: <span className="fw-bold" id="progressValue">0%</span></Form.Label>
                      <Form.Range
                        name="progress"
                        min={0}
                        max={100}
                        step={5}
                        onChange={(e) => document.getElementById('progressValue').textContent = e.target.value + '%'}
                      />
                    </Form.Group>
                    <Form.Group className="mb-4">
                      <Form.Label>What have you completed this week?</Form.Label>
                      <Form.Control
                        as="textarea"
                        rows={4}
                        name="update"
                        placeholder="Describe the work completed"
                        required
                      />
                    </Form.Group>
                    <Form.Group className="mb-4">
                      <Form.Label>Tasks Completed (comma-separated)</Form.Label>
                      <Form.Control
                        type="text"
                        name="tasks"
                        placeholder="Task 1, Task 2, Task 3"
                      />
                    </Form.Group>
                    <Form.Group className="mb-4">
                      <Form.Label>Challenges Faced</Form.Label>
                      <Form.Control
                        as="textarea"
                        rows={2}
                        name="challenges"
                        placeholder="Any challenges or obstacles encountered"
                      />
                    </Form.Group>
                    <Form.Group className="mb-4">
                      <Form.Label>Plan for Next Week</Form.Label>
                      <Form.Control
                        as="textarea"
                        rows={2}
                        name="nextWeekPlan"
                        placeholder="What do you plan to accomplish next week?"
                      />
                    </Form.Group>
                    <Button
                      type="submit"
                      className="w-100 fw-semibold text-white"
                      style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', border: 'none' }}
                    >
                      Submit Progress Update
                    </Button>
                  </Form>
                </Card.Body>
              </Card>
            </Col>

            {progressUpdates.length > 0 && (
              <Col lg={12}>
                <Card className="border-0 shadow-sm">
                  <Card.Body className="p-4">
                    <h5 className="fw-bold mb-4">📊 Progress History</h5>
                    <div className="d-flex flex-column gap-3">
                      {progressUpdates.map((p) => (
                        <div key={p.id} className="p-3 bg-light rounded-3">
                          <div className="d-flex justify-content-between align-items-center mb-2">
                            <strong>Week {p.week}</strong>
                            <span className="badge bg-primary">{p.progress}% Complete</span>
                          </div>
                          <p className="text-muted small mb-2">{p.description}</p>
                          <small className="text-muted">Submitted: {p.submittedDate}</small>
                        </div>
                      ))}
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            )}
          </Row>
        )}

        {/* Evaluation Tab */}
        {activeTab === 'evaluation' && (
          <Row className="g-4">
            <Col lg={8} className="mx-auto">
              <Card className="border-0 shadow-sm" id="printable-evaluation">
                <Card.Body className="p-5">
                  <div className="d-flex justify-content-between align-items-center mb-4 no-print">
                    <h5 className="fw-bold mb-0">📝 Project Evaluation</h5>
                    <div className="d-flex gap-2">
                      <Button variant="outline-primary" size="sm" onClick={() => window.print()}>🖨️ Print Marksheet</Button>
                      <Button variant="outline-success" size="sm" onClick={() => downloadPDF(document.getElementById('printable-evaluation'), `Marksheet_${user?.studentId || 'student'}.pdf`)}>⬇️ Download PDF</Button>
                      <Button variant="outline-secondary" size="sm" onClick={fetchEvaluation}>🔄 Refresh</Button>
                    </div>
                  </div>
                  
                  {!evaluation ? (
                    <div className="text-center py-5 text-muted">
                      <p className="mb-0">Not evaluated yet</p>
                      <small>Your marks will appear here once your guide evaluates your project.</small>
                    </div>
                  ) : (
                    <div className="marksheet-pdf-container p-4" style={{ background: '#fff', borderRadius: 12, boxShadow: '0 2px 12px #e0e0e0', maxWidth: 700, margin: '0 auto' }}>
                      <div className="text-center mb-4">
                        <img src="/vite.svg" alt="Institute Logo" style={{ width: 60, marginBottom: 8 }} />
                        <h2 className="fw-bold mb-1" style={{ color: '#667eea' }}>Project Evaluation Marksheet</h2>
                        <p className="mb-1"><strong>Student:</strong> {user?.name}</p>
                        <p className="mb-1"><strong>ID:</strong> {user?.studentId}</p>
                        <p className="mb-1"><strong>Department:</strong> {user?.department}</p>
                        <hr style={{ borderTop: '2px solid #667eea', width: '60%', margin: '16px auto' }} />
                      </div>
                      <div className="d-flex justify-content-between align-items-center mb-4 p-3 bg-light rounded-3">
                        <h4 className="mb-0 fw-bold">Total Score</h4>
                        <h2 className="mb-0 fw-bold text-primary">{evaluation.totalMarks} / 40</h2>
                      </div>
                      <table className="table table-bordered mb-4" style={{ background: '#fafbfc' }}>
                        <thead className="table-light">
                          <tr>
                            <th>Criteria</th>
                            <th>Marks</th>
                            <th>Max</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td>Project Title & Abstract</td>
                            <td>{evaluation.titleMarks}</td>
                            <td>5</td>
                          </tr>
                          <tr>
                            <td>Weekly Progress </td>
                            <td>{evaluation.progressMarks}</td>
                            <td>10</td>
                          </tr>
                          
                          <tr>
                            <td>1st Review</td>
                            <td>{evaluation.interactionMarks}</td>
                            <td>5</td>
                          </tr>
                          <tr>
                            <td>Document Quality</td>
                            <td>{evaluation.documentMarks}</td>
                            <td>15</td>
                          </tr>
                          <tr>
                            <td>2nd Review</td>
                            <td>{evaluation.finalReviewMarks}</td>
                            <td>5</td>
                          </tr>
                        </tbody>
                      </table>
                      <div className="bg-light p-3 rounded mb-3">
                        <h6 className="fw-bold mb-1">Remarks:</h6>
                        <p className="mb-0 text-muted">{evaluation.remarks || 'No remarks provided.'}</p>
                      </div>
                      <div className="text-end mt-4">
                        <span className="fw-bold">Evaluator Signature: ____________________</span>
                      </div>
                    </div>
                  )}
                </Card.Body>
              </Card>
            </Col>
          </Row>
        )}

        {/* Meetings Tab */}
        {activeTab === 'meetings' && (
          <Row className="g-4">
            <Col lg={12}>
              <Card className="border-0 shadow-sm">
                <Card.Body className="p-4">
                  <div className="d-flex justify-content-between align-items-center mb-4">
                    <h5 className="fw-bold mb-0">📅 My Meetings</h5>
                    <Button 
                      variant="primary" 
                      size="sm"
                      onClick={() => setShowMeetingModal(true)}
                    >
                      🗓️ Request Meeting
                    </Button>
                  </div>
                  {meetings.length === 0 ? (
                    <div className="text-center text-muted py-4">No meetings requested yet.</div>
                  ) : (
                    <div className="d-flex flex-column gap-3">
                      {meetings.map(meeting => (
                        <div key={meeting._id} className="p-3 border rounded-3 d-flex justify-content-between align-items-center bg-white shadow-sm">
                          <div>
                            <h6 className="fw-bold mb-1">{meeting.topic}</h6>
                            <small className="text-muted d-block mb-2">
                              Guide: <strong>{meeting.guideId?.name || 'Assigned Guide'}</strong>
                            </small>
                            <div className="mb-1">
                              <span className="badge bg-secondary me-2">🕒 {new Date(meeting.date).toLocaleDateString()} at {meeting.time}</span>
                              <span className="badge bg-info">{meeting.duration} mins</span>
                            </div>
                            {meeting.meetingLink && (
                              <a href={meeting.meetingLink} target="_blank" rel="noopener noreferrer" className="small fw-semibold mt-2 d-inline-block">🔗 Join Meeting</a>
                            )}
                            {meeting.guideRemarks && (
                              <div className="mt-2 small text-muted"><strong>Remarks:</strong> {meeting.guideRemarks}</div>
                            )}
                          </div>
                          <div className="text-end">
                            <Badge bg={meeting.status === 'Approved' ? 'success' : meeting.status === 'Rejected' ? 'danger' : meeting.status === 'Completed' ? 'primary' : 'warning'}>
                              {meeting.status}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </Card.Body>
              </Card>
            </Col>
          </Row>
        )}

        {/* Feedback Tab */}
        {activeTab === 'feedback' && (
          <Row className="g-4">
            <Col lg={12}>
              <Card className="border-0 shadow-sm">
                <Card.Body className="p-4">
                  <h5 className="fw-bold mb-4">💬 Feedback from Staff</h5>
                  {projects.length > 0 && projects[0].approvalStatus && projects[0].approvalStatus.toLowerCase() !== 'pending' ? (
                    <div className="text-center py-4">
                      <p className={`mb-2 fw-bold ${projects[0].approvalStatus.toLowerCase() === 'approved' ? 'text-success' : projects[0].approvalStatus.toLowerCase() === 'rejected' ? 'text-danger' : 'text-secondary'}`}>{projects[0].approvalStatus.charAt(0).toUpperCase() + projects[0].approvalStatus.slice(1)}</p>
                      <p className="mb-0">{projects[0].approvalRemarks ? projects[0].approvalRemarks : 'No remarks provided.'}</p>
                    </div>
                  ) : (
                    <div className="text-center py-5 text-muted">
                      <p className="mb-0">No feedback received yet</p>
                      <small>Your guide will provide feedback on your submissions</small>
                    </div>
                  )}
                </Card.Body>
              </Card>
            </Col>
            {/* 
            <Col lg={12}>
              <Card className="border-0 shadow-sm">
                <Card.Body className="p-4">
                  <h5 className="fw-bold mb-4">📞 Contact Your Guide</h5>
                  <Form onSubmit={handleFeedbackSubmit}>
                    <Form.Group className="mb-3">
                      <Form.Label>Subject</Form.Label>
                      <Form.Control
                        placeholder="Enter message subject"
                        value={feedbackSubject}
                        onChange={e => setFeedbackSubject(e.target.value)}
                        required
                        disabled={feedbackLoading}
                      />
                    </Form.Group>
                    <Form.Group className="mb-4">
                      <Form.Label>Message</Form.Label>
                      <Form.Control
                        as="textarea"
                        rows={4}
                        placeholder="Type your message here"
                        value={feedbackMessage}
                        onChange={e => setFeedbackMessage(e.target.value)}
                        required
                        disabled={feedbackLoading}
                      />
                    </Form.Group>
                    <Button
                      type="submit"
                      className="w-100 fw-semibold text-white"
                      style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', border: 'none' }}
                      disabled={feedbackLoading}
                    >
                      {feedbackLoading ? 'Sending...' : 'Send Message'}
                    </Button>
                  </Form>
                </Card.Body>
              </Card>
            </Col> */}
          </Row>
        )}

        {/* Status Tab */}
        {activeTab === 'status' && (
          <Row className="g-4">
            <Col lg={12}>
              <Card className="border-0 shadow-sm">
                <Card.Body className="p-4">
                  <h5 className="fw-bold mb-4">✅ Project Status Overview</h5>
                  <Row className="g-4">
                    <Col md={6}>
                      <div className="p-3 bg-light rounded-3 border-start border-5" style={{ borderColor: '#667eea' }}>
                        <h6 className="fw-bold mb-2">Project Title</h6>
                        <p className="text-muted mb-0">{projects.length > 0 ? '✅ Submitted' : '⏳ Pending'}</p>
                      </div>
                    </Col>
                    <Col md={6}>
                      <div className="p-3 bg-light rounded-3 border-start border-5" style={{ borderColor: '#4facfe' }}>
                        <h6 className="fw-bold mb-2">Document Uploads</h6>
                        <p className="text-muted mb-0">{documents.length === 0 ? '⏳ Pending' : `✅ ${documents.length} Uploaded`}</p>
                      </div>
                    </Col>
                    <Col md={6}>
                      <div className="p-3 bg-light rounded-3 border-start border-5" style={{ borderColor: '#43e97b' }}>
                        <h6 className="fw-bold mb-2">Progress Updates</h6>
                        <p className="text-muted mb-0">{progressUpdates.length === 0 ? '⏳ Pending' : `✅ ${progressUpdates.length} Submitted`}</p>
                      </div>
                    </Col>
                    <Col md={6}>
                      <div className="p-3 bg-light rounded-3 border-start border-5" style={{ borderColor: '#f5576c' }}>
                        <h6 className="fw-bold mb-2">Feedback</h6>
                        <p className="text-muted mb-0">
                          {projects.length > 0 && projects[0].approvalStatus ? (
                            <span className={projects[0].approvalStatus === 'Approved' ? 'text-success' : projects[0].approvalStatus === 'Rejected' ? 'text-danger' : 'text-secondary'}>
                              {projects[0].approvalStatus.charAt(0).toUpperCase() + projects[0].approvalStatus.slice(1)}
                            </span>
                          ) : '⏳ Awaiting Feedback'}
                          {projects.length > 0 && projects[0].approvalRemarks && (
                            <span className="d-block small mt-1">{projects[0].approvalRemarks}</span>
                          )}
                        </p>
                      </div>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        )}

        {/* Announcements Tab */}
        {activeTab === 'announcements' && (
          <Row className="g-4">
            <Col lg={12}>
              <Card className="border-0 shadow-sm">
                <Card.Body className="p-4">
                  <h5 className="fw-bold mb-4">📢 Announcements</h5>
                  {loadingAnnouncements ? (
                    <div className="text-center text-muted py-4">Loading announcements...</div>
                  ) : announcements.length === 0 ? (
                    <div className="text-center text-muted py-4">No announcements available</div>
                  ) : (
                    <div className="d-flex flex-column gap-3">
                      {announcements.map(announcement => (
                        <div key={announcement._id} className="p-3 border rounded-3">
                          <div className="d-flex justify-content-between align-items-start">
                            <div className="flex-grow-1">
                              <h6 className="fw-bold mb-2">{announcement.title}</h6>
                              <p className="text-muted mb-2">{announcement.message}</p>
                              <div className="d-flex gap-3 align-items-center">
                                <small className="text-muted">
                                  Posted on {new Date(announcement.createdAt).toLocaleDateString()}
                                </small>
                                <Badge bg={announcement.type === 'Deadline' ? 'danger' : announcement.type === 'Important' ? 'warning' : 'info'}>
                                  {announcement.type}
                                </Badge>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </Card.Body>
              </Card>
            </Col>
          </Row>
        )}

        {/* Messages Tab */}
        {activeTab === 'messages' && (
          <Row className="g-4">
            <Col lg={12}>
              <Card className="border-0 shadow-sm">
                <Card.Body className="p-4">
                  <div className="d-flex justify-content-between align-items-center mb-4">
                    <h5 className="fw-bold mb-0">💬 Messages</h5>
                    <Button 
                      variant="primary" 
                      size="sm"
                      onClick={() => setShowComposeModal(true)}
                    >
                      ✉️ Compose
                    </Button>
                  </div>
                  {loadingMessages ? (
                    <div className="text-center text-muted py-4">Loading messages...</div>
                  ) : messages.length === 0 ? (
                    <div className="text-center text-muted py-4">No messages yet</div>
                  ) : (
                    <div className="d-flex flex-column gap-3">
                      {messages.map(message => (
                        <div key={message._id} className="p-3 border rounded-3">
                          <div className="d-flex justify-content-between align-items-start">
                            <div className="flex-grow-1">
                              <h6 className="fw-bold mb-2">{message.subject}</h6>
                              <p className="text-muted mb-2">{message.message}</p>
                              <div className="d-flex gap-3 align-items-center">
                                <small className="text-muted">
                                  From: {message.senderId?.name || 'Unknown'} ({message.senderId?.role || 'User'})
                                </small>
                                <small className="text-muted">
                                  {new Date(message.createdAt).toLocaleDateString()}
                                </small>
                                {!message.isRead && <Badge bg="primary">New</Badge>}
                              </div>
                            </div>
                            <div>
                              <Button
                                variant="outline-primary"
                                size="sm"
                                onClick={() => handleReply(message)}
                              >
                                ↩️ Reply
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </Card.Body>
              </Card>
            </Col>
          </Row>
        )}
      </Container>

      {/* Reply Modal */}
      <Modal show={showReplyModal} onHide={() => setShowReplyModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Reply to Message</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleSendReply}>
            <Form.Group className="mb-3">
              <Form.Label>To</Form.Label>
              <Form.Control
                value={replyToMessage?.senderId?.name || 'Unknown'}
                disabled
                className="bg-light"
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Subject</Form.Label>
              <Form.Control
                value={replySubject}
                onChange={(e) => setReplySubject(e.target.value)}
                required
              />
            </Form.Group>
            <Form.Group className="mb-4">
              <Form.Label>Message</Form.Label>
              <Form.Control
                as="textarea"
                rows={4}
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                placeholder="Type your reply here..."
                required
              />
            </Form.Group>
            <div className="d-flex gap-2 justify-content-end">
              <Button variant="secondary" onClick={() => setShowReplyModal(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={replyLoading}
              >
                {replyLoading ? 'Sending...' : 'Send Reply'}
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>

      {/* Compose Modal */}
      <Modal show={showComposeModal} onHide={() => setShowComposeModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Compose Message to Guide</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleComposeSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>To</Form.Label>
              <Form.Control
                value={projects.length > 0 && projects[0].assignedGuideId ? (projects[0].assignedGuideId.name || 'Guide') : 'No Guide Assigned'}
                disabled
                className="bg-light"
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Subject</Form.Label>
              <Form.Control
                value={composeSubject}
                onChange={(e) => setComposeSubject(e.target.value)}
                required
                placeholder="Enter subject"
              />
            </Form.Group>
            <Form.Group className="mb-4">
              <Form.Label>Message</Form.Label>
              <Form.Control
                as="textarea"
                rows={4}
                value={composeMessage}
                onChange={(e) => setComposeMessage(e.target.value)}
                placeholder="Type your message here..."
                required
              />
            </Form.Group>
            <div className="d-flex gap-2 justify-content-end">
              <Button variant="secondary" onClick={() => setShowComposeModal(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={composeLoading || !projects.length || !projects[0].assignedGuideId}
              >
                {composeLoading ? 'Sending...' : 'Send Message'}
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>

      {/* Meeting Request Modal */}
      <Modal show={showMeetingModal} onHide={() => setShowMeetingModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>🗓️ Request a Meeting</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleMeetingRequest}>
            <Form.Group className="mb-3">
              <Form.Label>Topic / Agenda *</Form.Label>
              <Form.Control
                type="text"
                name="topic"
                placeholder="e.g. Project Architecture Review"
                required
              />
            </Form.Group>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Date *</Form.Label>
                  <Form.Control type="date" name="date" required />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Time *</Form.Label>
                  <Form.Control type="time" name="time" required />
                </Form.Group>
              </Col>
            </Row>
            <Form.Group className="mb-4">
              <Form.Label>Duration *</Form.Label>
              <Form.Select name="duration" required>
                <option value="15">15 Minutes</option>
                <option value="30">30 Minutes</option>
              </Form.Select>
            </Form.Group>
            <div className="d-flex gap-2 justify-content-end">
              <Button variant="secondary" onClick={() => setShowMeetingModal(false)}>Cancel</Button>
              <Button type="submit" variant="primary">Submit Request</Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>

      {/* Project Modal */}
      <Modal show={showProjectModal} onHide={() => setShowProjectModal(false)} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title>{projects.length > 0 && projects[0].approvalStatus === 'Rejected' ? 'Resubmit Project' : 'Submit Project Title'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <ProjectForm 
            project={projects.length > 0 && projects[0].approvalStatus === 'Rejected' ? projects[0] : null}
            onSave={() => {
              setShowProjectModal(false);
              fetchProject();
              setSuccessMessage('Project submitted successfully!');
              setTimeout(() => setSuccessMessage(''), 3000);
            }}
          />
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default StudentDashboard;
