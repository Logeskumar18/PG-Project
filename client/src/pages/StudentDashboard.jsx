import { useState, useEffect } from 'react';
import ConfirmLogoutModal from '../components/ConfirmLogoutModal';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Container, Row, Col, Card, Button, Form, Alert, Modal, Badge } from 'react-bootstrap';
import ProjectForm from '../components/ProjectForm.jsx';
import api from '../services/api';
import downloadPDF from '../utils/downloadPDF';
import html2pdf from 'html2pdf.js'; // Ensure this import for Vite/React
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;


const StudentDashboard = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
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

  // Document Search & Filter State
  const [docSearchQuery, setDocSearchQuery] = useState('');
  const [docFilterStatus, setDocFilterStatus] = useState('All');

  // PDF Viewer State
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);

  // Profile Management States
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [showModernSuccess, setShowModernSuccess] = useState(false);
  const [profileForm, setProfileForm] = useState({
    name: user?.name || '',
    department: user?.department || '',
    phone: user?.phone || ''
  });

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setProfileLoading(true);
    try {
      // Simulate a network request to show the loading animation
      await new Promise(resolve => setTimeout(resolve, 1000));
      setShowEditProfileModal(false);
      setShowModernSuccess(true);
    } catch (error) {
      setErrorMessage('Failed to update profile');
    } finally {
      setProfileLoading(false);
    }
  };

  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPasswordError('');
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }
    
    const passwordRegex = /^(?=.*[0-9])(?=.*[!@#$%^&*])[a-zA-Z0-9!@#$%^&*]{6,}$/;
    if (!passwordRegex.test(passwordForm.newPassword)) {
      setPasswordError('Password must be at least 6 characters, include a number and a special character.');
      return;
    }
    
    setPasswordLoading(true);
    try {
      await api.put('/student/change-password', {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      });
      setShowChangePasswordModal(false);
      setShowModernSuccess(true);
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      setPasswordError(error.response?.data?.message || 'Failed to change password');
    } finally {
      setPasswordLoading(false);
    }
  };

  const onDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
    setPageNumber(1);
  };

  const handleViewPdf = (doc) => {
    const url = (doc.cloudinaryUrl || doc.fileUrl || doc.url) 
      ? (doc.cloudinaryUrl || doc.fileUrl || doc.url) 
      : (api.defaults?.baseURL ? `${api.defaults.baseURL.replace(/\/$/, '')}/student/documents/${doc._id || doc.id}/download` : `/api/student/documents/${doc._id || doc.id}/download`);
    
    if (doc.fileName?.toLowerCase().endsWith('.pdf') || doc.type?.toLowerCase() === 'pdf') {
      setPdfUrl(url);
      setShowPdfModal(true);
    } else {
      window.open(url, '_blank');
    }
  };

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

  const handleMarkAsRead = async (messageId) => {
    try {
      setMessages(messages.map(msg => 
        msg._id === messageId ? { ...msg, isRead: true } : msg
      ));
      await api.put(`/communication/messages/${messageId}/read`);
    } catch (error) {
      console.error('Error marking message as read:', error);
      fetchMessages(); // Revert on failure
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

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = (doc.fileName || '').toLowerCase().includes(docSearchQuery.toLowerCase()) || 
                          (doc.type || '').toLowerCase().includes(docSearchQuery.toLowerCase());
    const status = doc.reviewStatus || 'Pending';
    const matchesStatus = docFilterStatus === 'All' || status === docFilterStatus;
    return matchesSearch && matchesStatus;
  });

  const unreadMessagesCount = messages.filter(m => !m.isRead).length;

  return (
    <div className={`min-vh-100 ${theme === 'dark' ? 'bg-dark text-light' : 'bg-light text-dark'}`} style={theme === 'dark' ? { background: '#121212' } : { background: '#f8f9fa' }}>
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
          @keyframes slideUpFade {
            from { opacity: 0; transform: translateY(30px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .profile-card-animate {
            animation: slideUpFade 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          }
        `}
      </style>
      {/* Navbar */}
      <div className={`shadow-sm py-3 sticky-top ${theme === 'dark' ? 'bg-dark border-bottom border-secondary' : 'bg-white'}`}>
        <Container fluid className="px-4">
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h4 className="fw-bold mb-0" style={{ color: '#667eea' }}>📚 Student Dashboard</h4>
              <small className={theme === 'dark' ? 'text-light' : 'text-muted'}>Welcome, {user?.name}</small>
            </div>
            <div className="d-flex align-items-center gap-3">
              <Button variant={theme === 'dark' ? 'outline-light' : 'outline-dark'} size="sm" onClick={toggleTheme} className="rounded-circle d-flex align-items-center justify-content-center" style={{ width: '32px', height: '32px', padding: 0 }}>{theme === 'dark' ? '☀️' : '🌙'}</Button>
              <Button variant="danger" size="sm" onClick={handleLogoutClick}>Logout</Button>
            </div>
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
            className="fw-semibold position-relative"
          >
            💬 Messages
            {unreadMessagesCount > 0 && (
              <Badge 
                bg="danger" 
                pill 
                className="position-absolute top-0 start-100 translate-middle"
                style={{ fontSize: '0.65rem' }}
              >
                {unreadMessagesCount}
              </Badge>
            )}
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
          <Row className="g-4 profile-card-animate">
            <Col lg={4}>
              <Card className="border-0 shadow-sm rounded-4 overflow-hidden h-100">
                <div style={{ height: '120px', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}></div>
                <Card.Body className="p-4 text-center position-relative pb-5">
                  <div 
                    className="rounded-circle bg-white d-flex align-items-center justify-content-center shadow-sm" 
                    style={{ width: '100px', height: '100px', margin: '-70px auto 15px', border: '4px solid white', fontSize: '3rem' }}
                  >
                    🧑‍🎓
                  </div>
                  <h4 className="fw-bold mb-1" style={{ color: '#2d3748' }}>{user?.name || 'Student Name'}</h4>
                  <p className="text-muted mb-3">{user?.role || 'Student'}</p>
                  
                  <div className="d-flex justify-content-center gap-2 mb-4">
                    <Badge bg="primary" className="px-3 py-2 rounded-pill fw-normal">ID: {user?.studentId || 'N/A'}</Badge>
                    <Badge bg="info" className="px-3 py-2 rounded-pill fw-normal text-dark">{user?.department || 'Department'}</Badge>
                  </div>

                  <Button 
                    variant="primary" 
                    className="w-100 py-2 fw-semibold rounded-pill shadow-sm mb-3"
                    onClick={() => { setProfileForm({ name: user?.name || '', department: user?.department || '', phone: user?.phone || '' }); setShowEditProfileModal(true); }}
                    style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', border: 'none' }}
                  >
                    ✏️ Edit Profile
                  </Button>
                  <Button 
                    variant="outline-secondary" 
                    className="w-100 py-2 fw-semibold rounded-pill shadow-sm"
                    onClick={() => setShowChangePasswordModal(true)}
                  >
                    🔒 Change Password
                  </Button>
                </Card.Body>
              </Card>
            </Col>
            
            <Col lg={8}>
              <Card className="border-0 shadow-sm rounded-4 h-100">
                <Card.Body className="p-4 p-md-5">
                  <h5 className="fw-bold mb-4 pb-2 border-bottom">Personal Information</h5>
                  <Row className="g-4 mb-5">
                    <Col md={6}>
                      <div className="d-flex align-items-start gap-3">
                        <div className="p-2 bg-light rounded-3 text-primary">
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
                        </div>
                        <div>
                          <small className="text-muted d-block fw-semibold mb-1">Email Address</small>
                          <span className="fs-6 text-dark">{user?.email || 'N/A'}</span>
                        </div>
                      </div>
                    </Col>
                    <Col md={6}>
                      <div className="d-flex align-items-start gap-3">
                        <div className="p-2 bg-light rounded-3 text-primary">
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
                        </div>
                        <div>
                          <small className="text-muted d-block fw-semibold mb-1">Phone Number</small>
                          <span className="fs-6 text-dark">{user?.phone || 'Not provided'}</span>
                        </div>
                      </div>
                    </Col>
                    <Col md={6}>
                      <div className="d-flex align-items-start gap-3">
                        <div className="p-2 bg-light rounded-3 text-primary">
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path></svg>
                        </div>
                        <div>
                          <small className="text-muted d-block fw-semibold mb-1">Department</small>
                          <span className="fs-6 text-dark">{user?.department || 'N/A'}</span>
                        </div>
                      </div>
                    </Col>
                    <Col md={6}>
                      <div className="d-flex align-items-start gap-3">
                        <div className="p-2 bg-light rounded-3 text-primary">
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                        </div>
                        <div>
                          <small className="text-muted d-block fw-semibold mb-1">Joined</small>
                          <span className="fs-6 text-dark">{user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : 'Recently'}</span>
                        </div>
                      </div>
                    </Col>
                  </Row>

                  <h5 className="fw-bold mb-4 pb-2 border-bottom">Academic Statistics</h5>
                  <Row className="g-3">
                    <Col sm={4}>
                      <div className="p-3 bg-light rounded-3 text-center border">
                        <h3 className="fw-bold text-primary mb-1">{projects.length}</h3>
                        <small className="text-muted fw-semibold">Projects</small>
                      </div>
                    </Col>
                    <Col sm={4}>
                      <div className="p-3 bg-light rounded-3 text-center border">
                        <h3 className="fw-bold text-success mb-1">{documents.length}</h3>
                        <small className="text-muted fw-semibold">Documents</small>
                      </div>
                    </Col>
                    <Col sm={4}>
                      <div className="p-3 bg-light rounded-3 text-center border">
                        <h3 className="fw-bold text-warning mb-1">{progressUpdates.length}</h3>
                        <small className="text-muted fw-semibold">Updates</small>
                      </div>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>
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

                    {/* Search and Filter */}
                    {documents.length > 0 && (
                      <Row className="mb-3 g-2">
                        <Col md={7}>
                          <Form.Control 
                            type="text" 
                            placeholder="Search by file name or type..." 
                            value={docSearchQuery}
                            onChange={(e) => setDocSearchQuery(e.target.value)}
                          />
                        </Col>
                        <Col md={5}>
                          <Form.Select 
                            value={docFilterStatus}
                            onChange={(e) => setDocFilterStatus(e.target.value)}
                          >
                            <option value="All">All Statuses</option>
                            <option value="Pending">Pending</option>
                            <option value="Approved">Approved</option>
                            <option value="Rejected">Rejected</option>
                          </Form.Select>
                        </Col>
                      </Row>
                    )}

                    {filteredDocuments.length === 0 ? (
                    <div className="text-center py-5 text-muted">
                        <p className="mb-0">{documents.length === 0 ? 'No submissions yet' : 'No matching documents found'}</p>
                        <small>{documents.length === 0 ? 'Upload documents to track them here' : 'Try adjusting your search or filters'}</small>
                    </div>
                  ) : (
                    <div className="d-flex flex-column gap-3">
                        {filteredDocuments.map((doc) => (
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
                            <Button
                              variant="outline-primary"
                              size="sm"
                              className="me-2"
                              onClick={() => handleViewPdf(doc)}
                            >
                              View
                            </Button>
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
                    <div className="d-flex flex-column">
                      {messages.map(message => (
                        <div 
                          key={message._id} 
                          className={`p-4 border rounded-4 mb-3 transition-all ${!message.isRead ? 'bg-white border-primary shadow-sm' : 'bg-light border-0 shadow-sm'}`}
                          style={{ transition: 'all 0.3s ease' }}
                        >
                          <div className="d-flex justify-content-between align-items-start gap-3">
                            <div className="d-flex align-items-center justify-content-center rounded-circle text-white flex-shrink-0 shadow-sm" style={{ width: '48px', height: '48px', fontSize: '1.2rem', fontWeight: 'bold', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
                              {(message.senderId?.name || 'U').charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-grow-1">
                              <div className="d-flex justify-content-between align-items-center mb-1">
                                <div className="d-flex align-items-center gap-2">
                                  <h6 className="mb-0 fw-bold text-dark">{message.senderId?.name || 'Unknown'}</h6>
                                  <Badge bg="secondary" pill className="fw-normal" style={{ fontSize: '0.7rem' }}>{message.senderId?.role || 'User'}</Badge>
                                  {!message.isRead && <Badge bg="danger" pill style={{ fontSize: '0.65rem' }}>New</Badge>}
                                </div>
                                <small className="text-muted fw-semibold">
                                  {new Date(message.createdAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                </small>
                              </div>
                              <h6 className={`mb-3 mt-2 ${!message.isRead ? 'fw-bold text-dark' : 'fw-semibold text-secondary'}`}>
                                {message.subject}
                              </h6>
                              <div className="p-3 bg-white rounded-3 border text-secondary shadow-sm" style={{ whiteSpace: 'pre-wrap', fontSize: '0.95rem' }}>
                                {message.message}
                              </div>
                            </div>
                          <div className="flex-shrink-0 d-flex gap-2">
                            {!message.isRead && (
                              <Button
                                variant="outline-success"
                                size="sm"
                                className="rounded-pill px-3 shadow-sm fw-semibold"
                                onClick={() => handleMarkAsRead(message._id)}
                              >
                                ✔️ Mark Read
                              </Button>
                            )}
                              <Button
                                variant={!message.isRead ? 'primary' : 'outline-primary'}
                                size="sm"
                                className="rounded-pill px-3 shadow-sm fw-semibold"
                                onClick={() => handleReply(message)}
                                style={!message.isRead ? { background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', border: 'none' } : {}}
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
      <Modal show={showReplyModal} onHide={() => setShowReplyModal(false)} centered className="border-0">
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="fw-bold">↩️ Reply to Message</Modal.Title>
        </Modal.Header>
        <Modal.Body className="pt-2">
          <Form onSubmit={handleSendReply}>
            <Form.Group className="mb-3">
              <Form.Label className="fw-semibold text-muted small text-uppercase">To</Form.Label>
              <Form.Control
                value={replyToMessage?.senderId?.name || 'Unknown'}
                disabled
                className="bg-light border-0 py-2 rounded-3 text-dark fw-semibold"
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label className="fw-semibold text-muted small text-uppercase">Subject</Form.Label>
              <Form.Control
                value={replySubject}
                onChange={(e) => setReplySubject(e.target.value)}
                required
                className="py-2 rounded-3"
              />
            </Form.Group>
            <Form.Group className="mb-4">
              <Form.Label className="fw-semibold text-muted small text-uppercase">Message</Form.Label>
              <Form.Control
                as="textarea"
                rows={5}
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                placeholder="Type your reply here..."
                required
                className="rounded-3"
              />
            </Form.Group>
            <div className="d-flex gap-2 justify-content-end">
              <Button variant="light" onClick={() => setShowReplyModal(false)} className="rounded-pill px-4 fw-semibold shadow-sm">
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={replyLoading}
                className="rounded-pill px-4 fw-semibold shadow-sm"
                style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', border: 'none' }}
              >
                {replyLoading ? <><span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Sending...</> : 'Send Reply'}
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>

      {/* Compose Modal */}
      <Modal show={showComposeModal} onHide={() => setShowComposeModal(false)} centered className="border-0">
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="fw-bold">✉️ Compose Message to Guide</Modal.Title>
        </Modal.Header>
        <Modal.Body className="pt-2">
          <Form onSubmit={handleComposeSubmit}>
            <Form.Group className="mb-3">
              <Form.Label className="fw-semibold text-muted small text-uppercase">To</Form.Label>
              <Form.Control
                value={projects.length > 0 && projects[0].assignedGuideId ? (projects[0].assignedGuideId.name || 'Guide') : 'No Guide Assigned'}
                disabled
                className="bg-light border-0 py-2 rounded-3 text-dark fw-semibold"
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label className="fw-semibold text-muted small text-uppercase">Subject</Form.Label>
              <Form.Control
                value={composeSubject}
                onChange={(e) => setComposeSubject(e.target.value)}
                required
                placeholder="Enter subject"
                className="py-2 rounded-3"
              />
            </Form.Group>
            <Form.Group className="mb-4">
              <Form.Label className="fw-semibold text-muted small text-uppercase">Message</Form.Label>
              <Form.Control
                as="textarea"
                rows={5}
                value={composeMessage}
                onChange={(e) => setComposeMessage(e.target.value)}
                placeholder="Type your message here..."
                required
                className="rounded-3"
              />
            </Form.Group>
            <div className="d-flex gap-2 justify-content-end">
              <Button variant="light" onClick={() => setShowComposeModal(false)} className="rounded-pill px-4 fw-semibold shadow-sm">
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={composeLoading || !projects.length || !projects[0].assignedGuideId}
                className="rounded-pill px-4 fw-semibold shadow-sm"
                style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', border: 'none' }}
              >
                {composeLoading ? <><span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Sending...</> : 'Send Message'}
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

      {/* PDF Viewer Modal */}
      <Modal show={showPdfModal} onHide={() => setShowPdfModal(false)} size="xl" centered>
        <Modal.Header closeButton>
          <Modal.Title>Document Viewer</Modal.Title>
        </Modal.Header>
        <Modal.Body className="d-flex flex-column align-items-center bg-light overflow-auto" style={{ maxHeight: '75vh' }}>
          {pdfUrl ? (
            <Document
              file={pdfUrl}
              onLoadSuccess={onDocumentLoadSuccess}
              loading={<div className="p-5 text-muted">Loading PDF...</div>}
              error={<div className="p-5 text-danger text-center">Failed to load PDF. Please ensure the URL is correct and CORS is allowed.<br/><br/><a href={pdfUrl} target="_blank" rel="noreferrer" className="btn btn-outline-primary btn-sm">Click here to download/view instead</a></div>}
            >
              <Page 
                pageNumber={pageNumber} 
                renderTextLayer={true}
                renderAnnotationLayer={true}
                className="shadow-sm mb-3 bg-white" 
                width={800}
              />
            </Document>
          ) : (
            <div className="p-5 text-muted">No document selected</div>
          )}
        </Modal.Body>
        <Modal.Footer className="d-flex justify-content-between w-100">
          <div className="d-flex align-items-center gap-3">
            <Button variant="outline-primary" size="sm" disabled={pageNumber <= 1} onClick={() => setPageNumber(prev => prev - 1)}>
              Previous
            </Button>
            <span className="fw-semibold">Page {pageNumber} of {numPages || '--'}</span>
            <Button variant="outline-primary" size="sm" disabled={pageNumber >= (numPages || 1)} onClick={() => setPageNumber(prev => prev + 1)}>
              Next
            </Button>
          </div>
          <div className="d-flex gap-2">
            <Button variant="outline-secondary" onClick={() => window.open(pdfUrl, '_blank')}>Open in New Tab</Button>
            <Button variant="secondary" onClick={() => setShowPdfModal(false)}>Close</Button>
          </div>
        </Modal.Footer>
      </Modal>

      {/* Profile Edit Modal */}
      <Modal show={showEditProfileModal} onHide={() => !profileLoading && setShowEditProfileModal(false)} centered backdrop="static">
        <Modal.Header closeButton={!profileLoading} className="border-0 pb-0">
          <Modal.Title className="fw-bold">Edit Profile</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleProfileUpdate}>
            <Form.Group className="mb-3">
              <Form.Label>Full Name</Form.Label>
              <Form.Control 
                type="text" 
                value={profileForm.name} 
                onChange={(e) => setProfileForm({...profileForm, name: e.target.value})}
                required 
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Department</Form.Label>
              <Form.Control 
                type="text" 
                value={profileForm.department} 
                onChange={(e) => setProfileForm({...profileForm, department: e.target.value})} 
              />
            </Form.Group>
            <Form.Group className="mb-4">
              <Form.Label>Phone Number</Form.Label>
              <Form.Control 
                type="text" 
                value={profileForm.phone} 
                onChange={(e) => setProfileForm({...profileForm, phone: e.target.value.replace(/\D/g, '').slice(0, 10)})} 
                maxLength={10}
                minLength={10}
                pattern="\d{10}"
              />
            </Form.Group>
            <div className="d-flex justify-content-end gap-2">
              <Button variant="light" onClick={() => setShowEditProfileModal(false)} disabled={profileLoading}>Cancel</Button>
              <Button type="submit" disabled={profileLoading} style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', border: 'none' }}>
                {profileLoading ? <><span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Saving...</> : 'Save Changes'}
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>

      {/* Change Password Modal */}
      <Modal show={showChangePasswordModal} onHide={() => !passwordLoading && setShowChangePasswordModal(false)} centered backdrop="static">
        <Modal.Header closeButton={!passwordLoading} className="border-0 pb-0">
          <Modal.Title className="fw-bold">Change Password</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {passwordError && <Alert variant="danger" className="mb-3">{passwordError}</Alert>}
          <Form onSubmit={handlePasswordChange}>
            <Form.Group className="mb-3">
              <Form.Label>Current Password</Form.Label>
              <Form.Control 
                type="password" 
                value={passwordForm.currentPassword} 
                onChange={(e) => setPasswordForm({...passwordForm, currentPassword: e.target.value})}
                required 
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>New Password</Form.Label>
              <Form.Control 
                type="password" 
                value={passwordForm.newPassword} 
                onChange={(e) => setPasswordForm({...passwordForm, newPassword: e.target.value})}
                required 
                minLength={6}
              />
            </Form.Group>
            <Form.Group className="mb-4">
              <Form.Label>Confirm New Password</Form.Label>
              <Form.Control 
                type="password" 
                value={passwordForm.confirmPassword} 
                onChange={(e) => setPasswordForm({...passwordForm, confirmPassword: e.target.value})}
                required 
                minLength={6}
              />
            </Form.Group>
            <div className="d-flex justify-content-end gap-2">
              <Button variant="light" onClick={() => setShowChangePasswordModal(false)} disabled={passwordLoading}>Cancel</Button>
              <Button type="submit" disabled={passwordLoading} style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', border: 'none' }}>
                {passwordLoading ? <><span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Updating...</> : 'Update Password'}
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>

      {/* Modern Success Popup */}
      <Modal show={showModernSuccess} onHide={() => setShowModernSuccess(false)} centered size="sm" className="border-0">
        <Modal.Body className="text-center p-4">
          <div className="mb-3">
            <div className="rounded-circle bg-success d-inline-flex align-items-center justify-content-center shadow-sm" style={{width: '70px', height: '70px'}}>
              <svg width="35" height="35" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            </div>
          </div>
          <h4 className="fw-bold mb-2">Success!</h4>
          <p className="text-muted mb-4">Your profile has been updated successfully.</p>
          <Button variant="success" className="w-100 rounded-pill fw-semibold py-2" onClick={() => setShowModernSuccess(false)}>Awesome</Button>
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default StudentDashboard;
