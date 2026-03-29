import { useState, useEffect } from 'react';
import ConfirmLogoutModal from '../components/ConfirmLogoutModal';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Container, Row, Col, Card, Button, Form, Alert, Modal, Badge, Table } from 'react-bootstrap';
import api from '../services/api';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

const StaffDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [announcements, setAnnouncements] = useState([]);
  const [loadingAnnouncements, setLoadingAnnouncements] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [messages, setMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(false);



  const [assignedStudents, setAssignedStudents] = useState([]);
  const [projects, setProjects] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [progressUpdates, setProgressUpdates] = useState([]);
  const [deadlines, setDeadlines] = useState([]);
  const [meetings, setMeetings] = useState([]);
  const [hods, setHods] = useState([]);

  const fetchData = async () => {
    try {
      setLoadingData(true);
    
      setLoadingAnnouncements(true);
      const [annRes, studentsRes, projectsRes, docsRes, progressRes, messagesRes, meetingsRes, hodsRes] = await Promise.all([
        api.get('/communication/announcements'),
        api.get('/staff/students'),
        api.get('/staff/projects'),
        api.get('/staff/documents'),
        api.get('/staff/progress'),
        api.get('/communication/messages/inbox'),
        api.get('/staff/meetings').catch(() => ({ data: { data: [] } })),
        api.get('/staff/hods').catch(() => ({ data: { data: [] } }))
      ]);

      if (annRes.data.data) setAnnouncements(annRes.data.data);
      if (studentsRes.data.data?.students) {
        setAssignedStudents(studentsRes.data.data.students);
      }
      if (projectsRes.data.data) setProjects(projectsRes.data.data);
      if (docsRes.data.data) setDocuments(docsRes.data.data);
      if (progressRes.data.data) setProgressUpdates(progressRes.data.data);
      if (messagesRes.data.data) setMessages(messagesRes.data.data);
      if (meetingsRes?.data?.data) setMeetings(meetingsRes.data.data);
      if (hodsRes?.data?.data) setHods(hodsRes.data.data);

      const deadlinesRes = await api.get('/deadlines');
      if (deadlinesRes.data?.data) {
        setDeadlines(deadlinesRes.data.data);
      }
    } catch (error) {
      console.error('Error loading staff data:', error);
    } finally {
      setLoadingData(false);
      setLoadingAnnouncements(false);
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

  useEffect(() => {
    fetchData();
  }, []);

  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [approvalRemarks, setApprovalRemarks] = useState('');
  const [reviewRemarks, setReviewRemarks] = useState('');
  const [reviewStatus, setReviewStatus] = useState('Approved');
  const [showComposeModal, setShowComposeModal] = useState(false);
  const [messageReceiver, setMessageReceiver] = useState('');
  const [messageSubject, setMessageSubject] = useState('');
  const [messageContent, setMessageContent] = useState('');
  const [showStudentProfileModal, setShowStudentProfileModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);

  const [projectSearchQuery, setProjectSearchQuery] = useState('');
  const [projectFilterStatus, setProjectFilterStatus] = useState('All');
  const [approvalPage, setApprovalPage] = useState(1);

  const [docSearchQuery, setDocSearchQuery] = useState('');
  const [docFilterStatus, setDocFilterStatus] = useState('All');

  const [studentSearchQuery, setStudentSearchQuery] = useState('');
  const [studentFilter, setStudentFilter] = useState('All');
  const [studentPage, setStudentPage] = useState(1);

  const [docPage, setDocPage] = useState(1);
  const [evaluationPage, setEvaluationPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  useEffect(() => {
    setApprovalPage(1);
  }, [projectSearchQuery, projectFilterStatus, pageSize]);
  useEffect(() => { setDocPage(1); }, [docSearchQuery, docFilterStatus, pageSize]);
  useEffect(() => { setStudentPage(1); }, [studentSearchQuery, studentFilter, pageSize]);
  useEffect(() => { setEvaluationPage(1); }, [pageSize]);

  
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
      await api.put('/staff/update-profile', {
        name: profileForm.name,
        department: profileForm.department,
        phone: profileForm.phone
      });
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
      await api.put('/staff/change-password', {
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

 
  const [showMarksModal, setShowMarksModal] = useState(false);
  const [marksData, setMarksData] = useState({
    titleMarks: 0,
    progressMarks: 0,
    documentMarks: 0,
    interactionMarks: 0,
    finalReviewMarks: 0,
    remarks: ''
  });
  const [selectedProjectForMarks, setSelectedProjectForMarks] = useState(null);


  const [showPdfModal, setShowPdfModal] = useState(false);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);

  const onDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
    setPageNumber(1);
  };

  const handleViewPdf = (doc) => {
    const url = (doc.cloudinaryUrl || doc.fileUrl || doc.url) 
      ? (doc.cloudinaryUrl || doc.fileUrl || doc.url) 
      : (api.defaults?.baseURL ? `${api.defaults.baseURL.replace(/\/$/, '')}/staff/documents/${doc._id || doc.id}/download` : `/api/staff/documents/${doc._id || doc.id}/download`);
    
    
    if (doc.fileName?.toLowerCase().endsWith('.pdf') || doc.type?.toLowerCase() === 'pdf') {
      setPdfUrl(url);
      setShowPdfModal(true);
    } else {
      window.open(url, '_blank');
    }
  };

 
  const [showReplyModal, setShowReplyModal] = useState(false);
  const [replyToMessage, setReplyToMessage] = useState(null);
  const [replySubject, setReplySubject] = useState('');
  const [replyContent, setReplyContent] = useState('');
  const [replyLoading, setReplyLoading] = useState(false);

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
      const receiverId = replyToMessage.senderId?._id || replyToMessage.senderId;
      await api.post('/communication/messages', {
        receiverId: receiverId,
        subject: replySubject,
        message: replyContent
      });
      setSuccessMessage('Reply sent successfully!');
      setShowReplyModal(false);
      await fetchMessages();
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      setErrorMessage('Error sending reply: ' + (error.response?.data?.message || error.message));
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
      fetchMessages();
    }
  };

  const handleUpdateMeeting = async (meetingId, status) => {
    try {
      let link = '';
      if (status === 'Approved') link = prompt('Enter meeting link (optional):', '') || '';
      
      const res = await api.put(`/staff/meetings/${meetingId}/status`, { status, meetingLink: link });
      if (res.data.status === 'success') {
        setMeetings(meetings.map(m => m._id === meetingId ? res.data.data : m));
        setSuccessMessage(`Meeting ${status.toLowerCase()} successfully`);
        setTimeout(() => setSuccessMessage(''), 3000);
      }
    } catch (err) {
      setErrorMessage('Error updating meeting: ' + (err.response?.data?.message || err.message));
      setTimeout(() => setErrorMessage(''), 3000);
    }
  };

  const handleOpenMarksModal = (project) => {
    setSelectedProjectForMarks(project);
    setMarksData({
      titleMarks: 0,
      progressMarks: 0,
      documentMarks: 0,
      interactionMarks: 0,
      finalReviewMarks: 0,
      remarks: ''
    });
    setShowMarksModal(true);
  };

  const handleMarksChange = (e) => {
    const { name, value } = e.target;

    if (name === 'remarks') {
      setMarksData(prev => ({ ...prev, [name]: value }));
      return;
    }

    let val = Number(value);
    if (val < 0) val = 0;

    if (name === 'titleMarks' && val > 5) val = 5;
    if (name === 'progressMarks' && val > 10) val = 10;
    if (name === 'documentMarks' && val > 15) val = 15;
    if (name === 'interactionMarks' && val > 5) val = 5;
    if (name === 'finalReviewMarks' && val > 5) val = 5;

    setMarksData(prev => ({
      ...prev,
      [name]: val
    }));
  };

  const totalMarks = 
    (marksData.titleMarks || 0) + 
    (marksData.progressMarks || 0) + 
    (marksData.documentMarks || 0) + 
    (marksData.interactionMarks || 0) + 
    (marksData.finalReviewMarks || 0);

  const submitMarks = async () => {
    if (!selectedProjectForMarks) return;
    try {
      await api.post('/staff/assign-marks', {
        studentId: selectedProjectForMarks.studentId._id || selectedProjectForMarks.studentId,
        projectId: selectedProjectForMarks._id,
        ...marksData
      });
      setSuccessMessage('Marks assigned successfully');
      setShowMarksModal(false);
      fetchData(); 
    } catch (error) {
      setErrorMessage('Error assigning marks: ' + (error.response?.data?.message || error.message));
      setTimeout(() => setErrorMessage(''), 5000);
    }
  };

  const handleApproveProject = (project) => {
    setSelectedProject(project);
    setShowApprovalModal(true);
  };

  const handleSubmitApproval = async () => {
    if (!selectedProject) return;

    try {
      const res = await api.post(
        `/staff/projects/${selectedProject._id}/approve`,
        { remarks: approvalRemarks }
      );

      setProjects(projects.map(p =>
        p._id === res.data.data._id ? res.data.data : p
      ));

      setSuccessMessage(`Project "${selectedProject.title}" approved successfully`);
      setShowApprovalModal(false);
      setApprovalRemarks('');
    } catch (err) {
      alert(err.response?.data?.message || 'Approval failed');
    }
  };


  const handleSubmitReject = async () => {
    if (!selectedProject) return;

    try {
      const res = await api.post(
        `/staff/projects/${selectedProject._id}/reject`,
        { remarks: approvalRemarks }
      );

      setProjects(projects.map(p =>
        p._id === res.data.data._id ? res.data.data : p
      ));

      setSuccessMessage(`Project "${selectedProject.title}" rejected`);
      setShowApprovalModal(false);
      setApprovalRemarks('');
    } catch (err) {
      alert(err.response?.data?.message || 'Rejection failed');
    }
  };

  const handleEditProject = async () => {
    try {
      const res = await api.put(
        `/staff/projects/${selectedProject._id}/edit`,
        {
          title: editTitle,
          description: editDescription
        }
      );

      setProjects(projects.map(p =>
        p._id === res.data.data._id ? res.data.data : p
      ));

      setSuccessMessage('Project updated successfully');
      setShowEditModal(false);
    } catch (err) {
      alert(err.response?.data?.message || 'Edit failed');
    }
  };





  const handleReviewDocument = (doc) => {
    setSelectedDocument(doc);
    setShowReviewModal(true);
  };

  const handleSubmitReview = async () => {
    if (!selectedDocument || (!selectedDocument._id && !selectedDocument.id)) {
      setSuccessMessage('Error: No document selected for review');
      setTimeout(() => setSuccessMessage(''), 3000);
      return;
    }

    try {
      const documentId = selectedDocument._id || selectedDocument.id;
      const response = await api.post(`/staff/documents/${documentId}/review`, {
        reviewStatus,
        remarks: reviewRemarks
      });

      if (response.data.status === 'success') {
       
        setDocuments(documents.map(d =>
          (d._id || d.id) === documentId
            ? response.data.data
            : d
        ));
        setSuccessMessage(`Document review submitted with status: ${reviewStatus}`);
        setShowReviewModal(false);
        setReviewRemarks('');
        setReviewStatus('Approved');
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        setSuccessMessage('Failed to submit review');
      }
    } catch (error) {
      setSuccessMessage('Error submitting review: ' + (error.response?.data?.message || error.message));
      setTimeout(() => setSuccessMessage(''), 5000);
    }
  };

  const handleApproveDocument = async (doc) => {
    setSelectedDocument(doc);
    setReviewStatus('Approved');
    setReviewRemarks('');
    setShowReviewModal(true);
  };

  const handleRejectDocument = async (doc) => {
    setSelectedDocument(doc);
    setReviewStatus('Rejected');
    setReviewRemarks('');
    setShowReviewModal(true);
  };

  const handleCreateStudent = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const studentData = {
      name: formData.get('name'),
      studentId: formData.get('studentId'),
      email: formData.get('email'),
      password: formData.get('password'),
      department: formData.get('department'),
      role: 'Student'
    };

    try {
      const response = await api.post('/staff/students', studentData);
      if (response.status === 201 || response.status === 200) {
        setSuccessMessage('Student created successfully!');
        e.target.reset();
        setActiveTab('students');
        await fetchData(); 
        setTimeout(() => setSuccessMessage(''), 3000);
      }
    } catch (error) {
      const errorMsg = error.response?.data?.message || error.message || 'Failed to create student';
      setSuccessMessage(`Error: ${errorMsg}`);
      setTimeout(() => setSuccessMessage(''), 5000);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!messageReceiver || !messageSubject.trim() || !messageContent.trim()) {
      setSuccessMessage('Please fill in all fields');
      setTimeout(() => setSuccessMessage(''), 3000);
      return;
    }

    try {
      await api.post('/communication/messages', {
        receiverId: messageReceiver,
        subject: messageSubject,
        message: messageContent
      });
      setSuccessMessage('Message sent successfully!');
      setShowComposeModal(false);
      setMessageReceiver('');
      setMessageSubject('');
      setMessageContent('');
    
      await fetchMessages();
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      setSuccessMessage('Error sending message: ' + (error.response?.data?.message || error.message));
      setTimeout(() => setSuccessMessage(''), 5000);
    }
  };

  const handleViewProfile = (student) => {
    setSelectedStudent(student);
    setShowStudentProfileModal(true);
  };

  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const handleLogoutClick = () => {
    setShowLogoutModal(true);
  };
  const handleConfirmLogout = () => {
    setShowLogoutModal(false);
    logout();
    navigate('/login/staff');
  };
  const handleCancelLogout = () => {
    setShowLogoutModal(false);
  };

  const pendingCount = projects.filter(p => (p.approvalStatus || p.approval) === 'Pending').length;
  const approvedCount = projects.filter(p => (p.approvalStatus || p.approval) === 'Approved').length;
  const pendingDocReviews = documents.filter(d => (d.reviewStatus || d.status) === 'Pending').length;
  const unreadMessagesCount = messages.filter(m => !m.isRead).length;

  const filteredApprovals = projects.filter(project => {
    const search = projectSearchQuery.toLowerCase();
    const titleMatch = (project.title || '').toLowerCase().includes(search);
    const studentMatch = (project.studentId?.name || '').toLowerCase().includes(search);
    const matchesSearch = titleMatch || studentMatch;
    
    const status = project.approvalStatus || project.approval || 'Pending';
    const matchesStatus = projectFilterStatus === 'All' || status === projectFilterStatus;
    
    return matchesSearch && matchesStatus;
  });

  const indexOfLastApproval = approvalPage * pageSize;
  const indexOfFirstApproval = indexOfLastApproval - pageSize;
  const currentApprovals = filteredApprovals.slice(indexOfFirstApproval, indexOfLastApproval);
  const totalApprovalPages = Math.ceil(filteredApprovals.length / pageSize);

  const filteredDocuments = documents.filter(doc => {
    const search = docSearchQuery.toLowerCase();
    const fileNameMatch = (doc.fileName || '').toLowerCase().includes(search);
    const studentMatch = (doc.studentId?.name || '').toLowerCase().includes(search);
    const matchesSearch = fileNameMatch || studentMatch;
    
    const status = doc.reviewStatus || doc.status || 'Pending';
    const matchesStatus = docFilterStatus === 'All' || status === docFilterStatus;
    
    return matchesSearch && matchesStatus;
  });

  const indexOfLastDoc = docPage * pageSize;
  const indexOfFirstDoc = indexOfLastDoc - pageSize;
  const currentDocuments = filteredDocuments.slice(indexOfFirstDoc, indexOfLastDoc);
  const totalDocPages = Math.ceil(filteredDocuments.length / pageSize);

  const filteredStudents = assignedStudents.filter(student => {
    const search = studentSearchQuery.toLowerCase();
    const matchesSearch = (student.name || '').toLowerCase().includes(search) ||
                          (student.studentId || '').toLowerCase().includes(search) ||
                          (student.email || '').toLowerCase().includes(search);
    
    const projectCount = student.projectCount || student.projects || 0;
    let matchesFilter = true;
    if (studentFilter === 'With Projects') matchesFilter = projectCount > 0;
    if (studentFilter === 'Without Projects') matchesFilter = projectCount === 0;

    return matchesSearch && matchesFilter;
  });

  const indexOfLastStudent = studentPage * pageSize;
  const indexOfFirstStudent = indexOfLastStudent - pageSize;
  const currentStudents = filteredStudents.slice(indexOfFirstStudent, indexOfLastStudent);
  const totalStudentPages = Math.ceil(filteredStudents.length / pageSize);

  const evaluatedProjects = projects.filter(project => (project.approvalStatus || project.approval) === 'Approved');
  const indexOfLastEval = evaluationPage * pageSize;
  const indexOfFirstEval = indexOfLastEval - pageSize;
  const currentEvals = evaluatedProjects.slice(indexOfFirstEval, indexOfLastEval);
  const totalEvalPages = Math.ceil(evaluatedProjects.length / pageSize);

  const getDaysRemaining = (dateString) => {
    const deadlineDate = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    deadlineDate.setHours(0, 0, 0, 0);
    const diffTime = deadlineDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
    if (diffDays === 0) return "Due today";
    if (diffDays === 1) return "Due tomorrow";
    if (diffDays > 1) return `Due in ${diffDays} days`;
    return "Expired";
  };

  const activeDeadlines = deadlines.filter(deadline => getDaysRemaining(deadline.date) !== "Expired");

  const staffApprovedProjects = projects.filter(p => (p.approvalStatus || p.approval) === 'Approved');
  const approvedProjectIds = staffApprovedProjects.map(p => (p._id || p.id).toString());

  const documentsForApprovedProjects = documents.filter(doc => {
    const docProjectId = doc.projectId?._id || doc.projectId;
    // Ensure docProjectId is not null/undefined before calling toString()
    return docProjectId && approvedProjectIds.includes(docProjectId.toString());
  });

  return (
      <div className="min-vh-100 bg-light text-dark" style={{ background: '#f8f9fa' }}>
      
      <div className="shadow-sm py-3 sticky-top bg-white">
        <Container fluid className="px-4">
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h4 className="fw-bold mb-0" style={{ color: '#4facfe' }}>👨‍🏫 Staff Dashboard</h4>
              <small className="text-muted">Welcome, {user?.name}</small>
            </div>
            <div className="d-flex align-items-center gap-3">
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
            ❌ {errorMessage}
          </Alert>
        )}

      
        <div className="d-flex gap-2 mb-4 flex-wrap">
          <Button
            variant={activeTab === 'overview' ? 'primary' : 'light'}
            onClick={() => setActiveTab('overview')}
            className="fw-semibold"
          >
            📊 Overview
          </Button>
          <Button
            variant={activeTab === 'students' ? 'primary' : 'light'}
            onClick={() => setActiveTab('students')}
            className="fw-semibold"
          >
            👥 Assigned Students
          </Button>
          <Button
            variant={activeTab === 'approvals' ? 'primary' : 'light'}
            onClick={() => setActiveTab('approvals')}
            className="fw-semibold"
          >
            ✅ Approvals
          </Button>
          <Button
            variant={activeTab === 'evaluations' ? 'primary' : 'light'}
            onClick={() => setActiveTab('evaluations')}
            className="fw-semibold"
          >
            📝 Evaluations
          </Button>
          <Button
            variant={activeTab === 'documents' ? 'primary' : 'light'}
            onClick={() => setActiveTab('documents')}
            className="fw-semibold"
          >
            📁 Document Reviews
          </Button>
          <Button
            variant={activeTab === 'progress' ? 'primary' : 'light'}
            onClick={() => setActiveTab('progress')}
            className="fw-semibold"
          >
            📈 Student Progress
          </Button>
          <Button
            variant={activeTab === 'meetings' ? 'primary' : 'light'}
            onClick={() => setActiveTab('meetings')}
            className="fw-semibold"
          >
            📅 Meetings
          </Button>
          <Button
            variant={activeTab === 'create-student' ? 'primary' : 'light'}
            onClick={() => setActiveTab('create-student')}
            className="fw-semibold"
          >
            ➕ Create Student
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

       
        {activeTab === 'profile' && (
          <Row className="g-4 profile-card-animate">
            <Col lg={4}>
              <Card className="border-0 shadow-sm rounded-4 overflow-hidden h-100">
                <div style={{ height: '120px', background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' }}></div>
                <Card.Body className="p-4 text-center position-relative pb-5">
                  <div 
                    className="rounded-circle bg-white d-flex align-items-center justify-content-center shadow-sm" 
                    style={{ width: '100px', height: '100px', margin: '-70px auto 15px', border: '4px solid white', fontSize: '3rem' }}
                  >
                    👨‍🏫
                  </div>
                  <h4 className="fw-bold mb-1" style={{ color: '#2d3748' }}>{user?.name || 'Staff Name'}</h4>
                  <p className="text-muted mb-3">{user?.role || 'Staff Member'}</p>
                  
                  <div className="d-flex justify-content-center gap-2 mb-4">
                    <Badge bg="info" className="px-3 py-2 rounded-pill fw-normal text-dark">{user?.department || 'Department'}</Badge>
                  </div>

                  <Button 
                    variant="primary" 
                    className="w-100 py-2 fw-semibold rounded-pill shadow-sm mb-3"
                    onClick={() => { setProfileForm({ name: user?.name || '', department: user?.department || '', phone: user?.phone || '' }); setShowEditProfileModal(true); }}
                    style={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', border: 'none' }}
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
                  <Row className="g-4">
                    <Col md={6}>
                      <div className="d-flex align-items-center gap-3 p-3 rounded-4 bg-light border border-light-subtle shadow-sm">
                        <div className="p-3 bg-primary bg-opacity-10 rounded-circle text-primary">
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
                        </div>
                        <div>
                          <small className="text-muted d-block fw-semibold mb-1">Email Address</small>
                          <span className="fs-6 text-dark fw-bold">{user?.email || 'N/A'}</span>
                        </div>
                      </div>
                    </Col>
                    <Col md={6}>
                      <div className="d-flex align-items-center gap-3 p-3 rounded-4 bg-light border border-light-subtle shadow-sm">
                        <div className="p-3 bg-success bg-opacity-10 rounded-circle text-success">
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
                        </div>
                        <div>
                          <small className="text-muted d-block fw-semibold mb-1">Phone Number</small>
                          <span className="fs-6 text-dark fw-bold">{user?.phone || 'Not provided'}</span>
                        </div>
                      </div>
                    </Col>
                    <Col md={6}>
                      <div className="d-flex align-items-center gap-3 p-3 rounded-4 bg-light border border-light-subtle shadow-sm">
                        <div className="p-3 bg-info bg-opacity-10 rounded-circle text-info">
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path></svg>
                        </div>
                        <div>
                          <small className="text-muted d-block fw-semibold mb-1">Department</small>
                          <span className="fs-6 text-dark fw-bold">{user?.department || 'N/A'}</span>
                        </div>
                      </div>
                    </Col>
                    <Col md={6}>
                      <div className="d-flex align-items-center gap-3 p-3 rounded-4 bg-light border border-light-subtle shadow-sm">
                        <div className="p-3 bg-warning bg-opacity-10 rounded-circle text-warning">
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                        </div>
                        <div>
                          <small className="text-muted d-block fw-semibold mb-1">Joined</small>
                          <span className="fs-6 text-dark fw-bold">{user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : 'Recently'}</span>
                        </div>
                      </div>
                    </Col>
                  </Row>

                  <h5 className="fw-bold mb-4 pb-2 border-bottom mt-5">Overview Statistics</h5>
                  <Row className="g-4">
                    <Col sm={4}>
                      <div className="p-4 bg-light rounded-4 text-center border border-light-subtle shadow-sm h-100 d-flex flex-column justify-content-center">
                        <h2 className="fw-bold text-primary mb-2 display-6">{assignedStudents.length}</h2>
                        <span className="text-muted fw-semibold text-uppercase" style={{fontSize: '0.8rem', letterSpacing: '1px'}}>Assigned Students</span>
                      </div>
                    </Col>
                    <Col sm={4}>
                      <div className="p-4 bg-light rounded-4 text-center border border-light-subtle shadow-sm h-100 d-flex flex-column justify-content-center">
                        <h2 className="fw-bold text-success mb-2 display-6">{staffApprovedProjects.length}</h2>
                        <span className="text-muted fw-semibold text-uppercase" style={{fontSize: '0.8rem', letterSpacing: '1px'}}>Approved Projects</span>
                      </div>
                    </Col>
                    <Col sm={4}>
                      <div className="p-4 bg-light rounded-4 text-center border border-light-subtle shadow-sm h-100 d-flex flex-column justify-content-center">
                        <h2 className="fw-bold text-warning mb-2 display-6">{documentsForApprovedProjects.length}</h2>
                        <span className="text-muted fw-semibold text-uppercase" style={{fontSize: '0.8rem', letterSpacing: '1px'}}>Documents Reviewed</span>
                      </div>
                    </Col>
                  </Row>
              
                </Card.Body>
              </Card>
            </Col>
          </Row>
        )}

       
        {activeTab === 'overview' && (
          <Row className="g-4">
            <Col lg={3} md={6}>
              <Card className="border-0 shadow-sm h-100">
                <Card.Body className="text-center p-4">
                  <h5 style={{ color: '#4facfe' }} className="fw-bold">👥 Assigned Students</h5>
                  <h2 className="fw-bold my-3">{assignedStudents.length}</h2>
                  <small className="text-muted">Active students under your guidance</small>
                </Card.Body>
              </Card>
            </Col>

            <Col lg={3} md={6}>
              <Card className="border-0 shadow-sm h-100">
                <Card.Body className="text-center p-4">
                  <h5 style={{ color: '#ffa502' }} className="fw-bold">⏳ Pending Approvals</h5>
                  <h2 className="fw-bold my-3">{pendingCount}</h2>
                  <small className="text-muted">Projects awaiting approval</small>
                </Card.Body>
              </Card>
            </Col>

            <Col lg={3} md={6}>
              <Card className="border-0 shadow-sm h-100">
                <Card.Body className="text-center p-4">
                  <h5 style={{ color: '#43e97b' }} className="fw-bold">✅ Approved</h5>
                  <h2 className="fw-bold my-3">{approvedCount}</h2>
                  <small className="text-muted">Approved projects</small>
                </Card.Body>
              </Card>
            </Col>

            <Col lg={3} md={6}>
              <Card className="border-0 shadow-sm h-100">
                <Card.Body className="text-center p-4">
                  <h5 style={{ color: '#f5576c' }} className="fw-bold">📄 Doc Reviews</h5>
                  <h2 className="fw-bold my-3">{pendingDocReviews}</h2>
                  <small className="text-muted">Pending document reviews</small>
                </Card.Body>
              </Card>
            </Col>

            {activeDeadlines.length > 0 && (
              <Col lg={12}>
                <Card className="border-0 shadow-sm">
                  <Card.Body className="p-4">
                    <h5 className="fw-bold mb-4">⏰ Global Deadlines</h5>
                    <div className="d-flex flex-column gap-3">
                      {activeDeadlines.map(deadline => (
                        <div key={deadline._id} className="p-3 bg-light rounded-3 d-flex justify-content-between align-items-center border-start border-4 border-warning">
                          <div>
                            <h6 className="fw-bold mb-1">{deadline.title === 'Other' ? deadline.customTitle : deadline.title}</h6>
                            <p className="text-muted mb-0 small">{deadline.description}</p>
                          </div>
                          <div className="text-end">
                            <div className="fw-bold text-danger">
                              {new Date(deadline.date).toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
                            </div>
                            <span className="badge bg-danger mt-1">{getDaysRemaining(deadline.date)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            )}

            
            <Col lg={12}>
              <Card className="border-0 shadow-sm border-start border-5 border-primary bg-white">
                <Card.Body className="p-4 d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
                  <div>
                    <h5 className="fw-bold mb-1">Contact Department Head</h5>
                    <p className="text-muted mb-0">Send a direct message to the HOD for administrative requests or urgent queries.</p>
                  </div>
                  <Button 
                    variant="primary" 
                    className="fw-semibold px-4 py-2"
                    style={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', border: 'none' }}
                    onClick={() => {
                      if (hods.length > 0) setMessageReceiver(hods[0]._id || hods[0].userId);
                      setShowComposeModal(true);
                    }}
                  >
                    ✉️ Message HOD
                  </Button>
                </Card.Body>
              </Card>
            </Col>

            <Col lg={12}>
              <Card className="border-0 shadow-sm">
                <Card.Body className="p-4">
                  <h5 className="fw-bold mb-4">📋 Recent Projects</h5>
                  <Table hover responsive>
                    <thead>
                      <tr>
                        <th>Project Title</th>
                        <th>Student</th>
                        <th>Status</th>
                        <th>Approval</th>
                        <th>Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {projects.slice(0, 5).map(project => (
                        <tr key={project._id || project.id}>
                          <td className="fw-semibold">{project.title}</td>
                          <td>{project.studentId?.name || 'N/A'}</td>
                          <td><Badge bg="info">{project.status || 'Pending'}</Badge></td>
                          <td>
                            <Badge
                              bg={(project.approvalStatus || project.approval) === 'Approved' ? 'success' : (project.approvalStatus || project.approval) === 'Rejected' ? 'danger' : 'warning'}
                            >
                              {project.approvalStatus || project.approval || 'Pending'}
                            </Badge>
                          </td>
                          <td>{project.submissionDate ? new Date(project.submissionDate).toLocaleDateString() : (project.submittedAt ? new Date(project.submittedAt).toLocaleDateString() : (project.createdAt ? new Date(project.createdAt).toLocaleDateString() : '—'))}</td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        )}

      
        {activeTab === 'students' && (
          <Row className="g-4">
            <Col lg={12}>
              <Card className="border-0 shadow-sm">
                <Card.Body className="p-4">
                  <h5 className="fw-bold mb-4">👥 My Assigned Students</h5>

                  {assignedStudents.length > 0 && (
                    <Row className="mb-4 g-2">
                      <Col md={6}>
                        <Form.Control 
                          type="text" 
                          placeholder="Search by student name, ID, or email..." 
                          value={studentSearchQuery}
                          onChange={(e) => setStudentSearchQuery(e.target.value)}
                        />
                      </Col>
                      <Col md={4}>
                        <Form.Select 
                          value={studentFilter}
                          onChange={(e) => setStudentFilter(e.target.value)}
                        >
                          <option value="All">All Students</option>
                          <option value="With Projects">With Projects</option>
                          <option value="Without Projects">Without Projects</option>
                        </Form.Select>
                      </Col>
                      <Col md={2}>
                        <Form.Select value={pageSize} onChange={(e) => setPageSize(Number(e.target.value))}>
                          <option value={5}>5 / page</option>
                          <option value={10}>10 / page</option>
                          <option value={20}>20 / page</option>
                        </Form.Select>
                      </Col>
                    </Row>
                  )}

                  <Table hover responsive>
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Student ID</th>
                        <th>Email</th>
                        <th>Projects</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
{currentStudents.length === 0 ? (
                        <tr>
                          <td colSpan="5" className="text-center py-4 text-muted">No matching students found.</td>
                        </tr>
                      ) : (
                        currentStudents.map(student => (
                          <tr key={student._id || student.id}>
                            <td className="fw-semibold">{student.name}</td>
                            <td>{student.studentId}</td>
                            <td>{student.email}</td>
                            <td><Badge bg="primary">{student.projectCount || student.projects || 0}</Badge></td>
                            <td>
                              <Button variant="sm" size="sm" className="me-2" onClick={() => handleViewProfile(student)}>View Profile</Button>
                             
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </Table>
                  {totalStudentPages > 1 && (
                    <div className="d-flex justify-content-center mt-4">
                      <div className="d-flex gap-2 align-items-center">
                        <Button variant="outline-primary" size="sm" onClick={() => setStudentPage(prev => Math.max(prev - 1, 1))} disabled={studentPage === 1}>Previous</Button>
                        <span className="px-2 small fw-semibold">Page {studentPage} of {totalStudentPages}</span>
                        <Button variant="outline-primary" size="sm" onClick={() => setStudentPage(prev => Math.min(prev + 1, totalStudentPages))} disabled={studentPage === totalStudentPages}>Next</Button>
                      </div>
                    </div>
                  )}
                </Card.Body>
              </Card>
            </Col>
          </Row>
        )}

       
        {activeTab === 'approvals' && (
          <Row className="g-4">
            <Col lg={12}>
              <Card className="border-0 shadow-sm">
                <Card.Body className="p-4">
                  <h5 className="fw-bold mb-4">✅ Project Approvals</h5>

                  {projects.length > 0 && (
                    <Row className="mb-4 g-2">
                      <Col md={6}>
                        <Form.Control 
                          type="text" 
                          placeholder="Search by project title or student name..." 
                          value={projectSearchQuery}
                          onChange={(e) => setProjectSearchQuery(e.target.value)}
                        />
                      </Col>
                      <Col md={4}>
                        <Form.Select 
                          value={projectFilterStatus}
                          onChange={(e) => setProjectFilterStatus(e.target.value)}
                        >
                          <option value="All">All Statuses</option>
                          <option value="Pending">Pending</option>
                          <option value="Approved">Approved</option>
                          <option value="Rejected">Rejected</option>
                        </Form.Select>
                      </Col>
                      <Col md={2}>
                        <Form.Select value={pageSize} onChange={(e) => setPageSize(Number(e.target.value))}>
                          <option value={5}>5 / page</option>
                          <option value={10}>10 / page</option>
                          <option value={20}>20 / page</option>
                        </Form.Select>
                      </Col>
                    </Row>
                  )}

                  {Array.isArray(projects) && projects.length > 0 ? (
                    <>
                      <div className="d-flex flex-column gap-3">
                      {currentApprovals.length === 0 ? (
                        <p className="text-muted text-center py-4 mb-0">No matching projects found.</p>
                      ) : currentApprovals.map((project) => {
                        const status = project.approvalStatus || project.approval || 'Pending';

                        return (
                          <div
                            key={project._id}
                            className="p-3 border rounded-3 d-flex justify-content-between align-items-center"
                          >
                            <div className="flex-grow-1">
                              <h6 className="fw-bold mb-1">
                                {project.title || 'Untitled Project'}
                              </h6>

                              <p className="text-muted mb-2 small">
                                <b>Description:</b> {project.description || 'No description provided.'}
                              </p>

                              <small className="text-muted">
                                Submitted by{' '}
                                <strong>
                                  {project.studentId?.name || 'Unknown Student'}
                                </strong>{' '}
                                on{' '}
                                {project.submissionDate
                                  ? new Date(project.submissionDate).toLocaleDateString()
                                  : (project.submittedAt
                                    ? new Date(project.submittedAt).toLocaleDateString()
                                    : (project.createdAt
                                      ? new Date(project.createdAt).toLocaleDateString()
                                      : '—'))}
                              </small>
                            </div>

                            <div className="d-flex gap-2 align-items-center">
                              <Badge
                                bg={
                                  status === 'Approved'
                                    ? 'success'
                                    : status === 'Rejected'
                                      ? 'danger'
                                      : 'warning'
                                }
                              >
                                {status}
                              </Badge>

                              {status === 'Pending' && (
                                <>
                                  <Button
                                    variant="success"
                                    size="sm"
                                    onClick={() => handleApproveProject(project)}
                                  >
                                    Approve
                                  </Button>

                                  <Button
                                    variant="danger"
                                    size="sm"
                                    onClick={() => {
                                      setSelectedProject(project);
                                      setShowApprovalModal(true);
                                    }}
                                  >
                                    Reject
                                  </Button>
                                </>
                              )}
                            
                              <Modal show={showApprovalModal} onHide={() => setShowApprovalModal(false)} centered>
                                ...
                              </Modal>

                            </div>
                          </div>
                        );
                      })}
                      </div>

                      {totalApprovalPages > 1 && (
                        <div className="d-flex justify-content-center mt-4">
                          <div className="d-flex gap-2 align-items-center">
                            <Button 
                              variant="outline-primary" 
                              size="sm" 
                              onClick={() => setApprovalPage(prev => Math.max(prev - 1, 1))}
                              disabled={approvalPage === 1}
                            >
                              Previous
                            </Button>
                            <span className="px-2 small fw-semibold">
                              Page {approvalPage} of {totalApprovalPages}
                            </span>
                            <Button 
                              variant="outline-primary" 
                              size="sm" 
                              onClick={() => setApprovalPage(prev => Math.min(prev + 1, totalApprovalPages))}
                              disabled={approvalPage === totalApprovalPages}
                            >
                              Next
                            </Button>
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <p className="text-muted text-center mb-0">
                      No projects pending approval.
                    </p>
                  )}
                </Card.Body>
              </Card>
            </Col>
          </Row>
        )}

      
        {activeTab === 'evaluations' && (
          <Row className="g-4">
            <Col lg={12}>
              <Card className="border-0 shadow-sm">
                <Card.Body className="p-4">
                  <h5 className="fw-bold mb-4">📝 Project Evaluations</h5>
                  {evaluatedProjects.length > 0 && (
                    <Row className="mb-4 g-2">
                      <Col md={10}></Col>
                      <Col md={2}>
                        <Form.Select value={pageSize} onChange={(e) => setPageSize(Number(e.target.value))}>
                          <option value={5}>5 / page</option>
                          <option value={10}>10 / page</option>
                          <option value={20}>20 / page</option>
                        </Form.Select>
                      </Col>
                    </Row>
                  )}
                  <Table hover responsive>
                    <thead>
                      <tr>
                        <th>Project Title</th>
                        <th>Student</th>
                        <th>Status</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentEvals.length === 0 ? (
                        <tr>
                          <td colSpan="4" className="text-center py-4 text-muted">No evaluated projects found.</td>
                        </tr>
                      ) : currentEvals.map(project => (
                          <tr key={project._id}>
                            <td className="fw-semibold">{project.title}</td>
                            <td>{project.studentId?.name || 'N/A'}</td>
                            <td><Badge bg={project.status === 'Evaluated' || project.status === 'Approved' ? 'success' : 'warning'}>{project.status || 'Pending'}</Badge></td>
                            <td>
                              <Button 
                                variant="primary" 
                                size="sm"
                                onClick={() => handleOpenMarksModal(project)}
                              >
                                Evaluate / Add Marks
                              </Button>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </Table>
                  {totalEvalPages > 1 && (
                    <div className="d-flex justify-content-center mt-4">
                      <div className="d-flex gap-2 align-items-center">
                        <Button variant="outline-primary" size="sm" onClick={() => setEvaluationPage(prev => Math.max(prev - 1, 1))} disabled={evaluationPage === 1}>Previous</Button>
                        <span className="px-2 small fw-semibold">Page {evaluationPage} of {totalEvalPages}</span>
                        <Button variant="outline-primary" size="sm" onClick={() => setEvaluationPage(prev => Math.min(prev + 1, totalEvalPages))} disabled={evaluationPage === totalEvalPages}>Next</Button>
                      </div>
                    </div>
                  )}
                </Card.Body>
              </Card>
            </Col>
          </Row>
        )}

      
        {activeTab === 'documents' && (
          <Row className="g-4">
            <Col lg={12}>
              <Card className="border-0 shadow-sm">
                <Card.Body className="p-4">
                  <h5 className="fw-bold mb-4">📁 Document Reviews</h5>

                  {documents.length > 0 && (
                    <Row className="mb-4 g-2">
                      <Col md={6}>
                        <Form.Control 
                          type="text" 
                          placeholder="Search by file name or student name..." 
                          value={docSearchQuery}
                          onChange={(e) => setDocSearchQuery(e.target.value)}
                        />
                      </Col>
                      <Col md={4}>
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
                      <Col md={2}>
                        <Form.Select value={pageSize} onChange={(e) => setPageSize(Number(e.target.value))}>
                          <option value={5}>5 / page</option>
                          <option value={10}>10 / page</option>
                          <option value={20}>20 / page</option>
                        </Form.Select>
                      </Col>
                    </Row>
                  )}

                  <Table hover responsive>
                    <thead>
                      <tr>
                        <th>Document Type</th>
                        <th>File Name</th>
                        <th>Student</th>
                        <th>Status</th>
                        <th>Remarks</th>
                        <th>Uploaded</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentDocuments.length === 0 ? (
                        <tr>
                          <td colSpan="7" className="text-center py-4 text-muted">No matching documents found.</td>
                        </tr>
                      ) : currentDocuments.map(doc => (
                        <tr key={doc._id || doc.id}>
                          <td><Badge bg="info">{doc.type?.toUpperCase() || 'DOC'}</Badge></td>
                          <td className="fw-semibold">{doc.fileName}</td>
                          <td>{doc.studentId?.name || 'N/A'}</td>
                          <td>
                            <Badge bg={(doc.reviewStatus || doc.status) === 'Approved' ? 'success' : (doc.reviewStatus || doc.status) === 'Rejected' ? 'danger' : 'warning'}>
                              {doc.reviewStatus || doc.status || 'Pending'}
                            </Badge>
                          </td>
                          <td className="text-muted small" style={{maxWidth: '250px', whiteSpace: 'normal'}}>{doc.remarks || '—'}</td>
                          <td>{doc.uploadedAt ? new Date(doc.uploadedAt).toLocaleDateString() : '—'}</td>
                          <td>
                            <Button
                              variant="outline-success"
                              size="sm"
                              className="me-2"
                              onClick={() => handleViewPdf(doc)}
                            >
                              View
                            </Button>
                            {(doc.reviewStatus === 'Pending' || doc.status === 'Pending' || !doc.reviewStatus && !doc.status) && (
                              <>
                                <Button
                                  variant="outline-success"
                                  size="sm"
                                  className="me-2"
                                  onClick={() => handleApproveDocument(doc)}
                                >
                                  Approve
                                </Button>
                                <Button
                                  variant="outline-danger"
                                  size="sm"
                                  onClick={() => handleRejectDocument(doc)}
                                >
                                  Reject
                                </Button>
                              </>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                  {totalDocPages > 1 && (
                    <div className="d-flex justify-content-center mt-4">
                      <div className="d-flex gap-2 align-items-center">
                        <Button variant="outline-primary" size="sm" onClick={() => setDocPage(prev => Math.max(prev - 1, 1))} disabled={docPage === 1}>Previous</Button>
                        <span className="px-2 small fw-semibold">Page {docPage} of {totalDocPages}</span>
                        <Button variant="outline-primary" size="sm" onClick={() => setDocPage(prev => Math.min(prev + 1, totalDocPages))} disabled={docPage === totalDocPages}>Next</Button>
                      </div>
                    </div>
                  )}
                </Card.Body>
              </Card>
            </Col>
          </Row>
        )}

        <Modal show={showApprovalModal} onHide={() => setShowApprovalModal(false)} centered>
          <Modal.Header closeButton>
            <Modal.Title>{selectedProject?.title}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form>
              <Form.Group className="mb-3">
                <Form.Label>Remarks (Optional)</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={4}
                  value={approvalRemarks}
                  onChange={(e) => setApprovalRemarks(e.target.value)}
                  placeholder="Add your comments or feedback"
                />
              </Form.Group>
            </Form>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowApprovalModal(false)}>
              Cancel
            </Button>
            <Button
              variant="success"
              onClick={handleSubmitApproval}
            >
              ✅ Approve
            </Button>
            <Button
              variant="danger"
              onClick={handleSubmitReject}
            >
              ❌ Reject
            </Button>
          </Modal.Footer>
        </Modal>

       
        <Modal show={showReviewModal} onHide={() => setShowReviewModal(false)} centered>
          <Modal.Header closeButton>
            <Modal.Title>Document Review - {reviewStatus}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form>
              <Form.Group className="mb-3">
                <Form.Label>Remarks {reviewStatus === 'Rejected' ? '(Required)' : '(Optional)'}</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={4}
                  value={reviewRemarks}
                  onChange={(e) => setReviewRemarks(e.target.value)}
                  placeholder="Add your comments or feedback"
                  required={reviewStatus === 'Rejected'}
                />
              </Form.Group>
            </Form>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowReviewModal(false)}>
              Cancel
            </Button>
            <Button
              variant={reviewStatus === 'Approved' ? 'success' : 'danger'}
              onClick={handleSubmitReview}
              disabled={reviewStatus === 'Rejected' && !reviewRemarks.trim()}
            >
              {reviewStatus === 'Approved' ? '✅ Approve' : '❌ Reject'}
            </Button>
          </Modal.Footer>
        </Modal>

        
        {activeTab === 'progress' && (
          <Row className="g-4">
            <Col lg={12}>
              <Card className="border-0 shadow-sm mb-4">
                <Card.Body className="p-4">
                  <h5 className="fw-bold mb-4">📅📅 Weekly Progress Updates</h5>
                  {progressUpdates.length === 0 ? (
                    <div className="text-center text-muted py-4">No progress updates yet</div>
                  ) : (
                    <div className="d-flex flex-column gap-3">
                      {progressUpdates.map(progress => (
                        <div key={progress._id} className="p-3 border rounded-3">
                          <div className="d-flex justify-content-between align-items-start mb-2">
                            <div>
                              <h6 className="fw-bold mb-1">{progress.projectId?.title}</h6>
                              <small className="text-muted">
                                Student: {progress.studentId?.name} ({progress.studentId?.studentId}) | Week {progress.weekNumber}
                              </small>
                            </div>
                            <Badge bg="primary">{progress.progressPercentage}% Complete</Badge>
                          </div>
                          <p className="mb-2">{progress.description}</p>
                          {progress.tasksCompleted && progress.tasksCompleted.length > 0 && (
                            <div className="mb-2">
                              <strong>Tasks Completed:</strong>
                              <ul className="mb-0">
                                {progress.tasksCompleted.map((task, idx) => (
                                  <li key={idx}>{task}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {progress.challenges && (
                            <div className="mb-2">
                              <strong>Challenges:</strong> {progress.challenges}
                            </div>
                          )}
                          {progress.nextWeekPlan && (
                            <div className="mb-2">
                              <strong>Next Week Plan:</strong> {progress.nextWeekPlan}
                            </div>
                          )}
                          <small className="text-muted">
                            Submitted: {new Date(progress.submittedAt).toLocaleDateString()}
                          </small>
                        </div>
                      ))}
                    </div>
                  )}
                </Card.Body>
              </Card>
            </Col>
          </Row>
        )}

       
        {activeTab === 'meetings' && (
          <Row className="g-4">
            <Col lg={12}>
              <Card className="border-0 shadow-sm mb-4">
                <Card.Body className="p-4">
                  <h5 className="fw-bold mb-4">📅 Meeting Requests</h5>
                  {meetings.length === 0 ? (
                    <div className="text-center text-muted py-4">No meeting requests found.</div>
                  ) : (
                    <div className="d-flex flex-column gap-3">
                      {meetings.map(meeting => (
                        <div key={meeting._id} className="p-3 border rounded-3 d-flex justify-content-between align-items-center bg-white shadow-sm">
                          <div>
                            <h6 className="fw-bold mb-1">{meeting.topic}</h6>
                            <small className="text-muted d-block mb-2">
                              Student: <strong>{meeting.studentId?.name}</strong> | Project: {meeting.projectId?.title || 'N/A'}
                            </small>
                            <div className="mb-1">
                              <span className="badge bg-secondary me-2">🕒 {new Date(meeting.date).toLocaleDateString()} at {meeting.time}</span>
                              <span className="badge bg-info">{meeting.duration} mins</span>
                            </div>
                            {meeting.meetingLink && (
                              <a href={meeting.meetingLink} target="_blank" rel="noopener noreferrer" className="small fw-semibold">🔗 Join Meeting</a>
                            )}
                          </div>
                          <div className="text-end">
                            <div className="mb-2">
                              <Badge bg={meeting.status === 'Approved' ? 'success' : meeting.status === 'Rejected' ? 'danger' : meeting.status === 'Completed' ? 'primary' : 'warning'}>
                                {meeting.status}
                              </Badge>
                            </div>
                            {meeting.status === 'Pending' && (
                              <div className="d-flex gap-2">
                                <Button variant="outline-success" size="sm" onClick={() => handleUpdateMeeting(meeting._id, 'Approved')}>Approve</Button>
                                <Button variant="outline-danger" size="sm" onClick={() => handleUpdateMeeting(meeting._id, 'Rejected')}>Reject</Button>
                              </div>
                            )}
                            {meeting.status === 'Approved' && (
                               <Button variant="outline-primary" size="sm" onClick={() => handleUpdateMeeting(meeting._id, 'Completed')}>Mark Completed</Button>
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

       
        {activeTab === 'create-student' && (
          <Row className="g-4">
            <Col lg={8} className="mx-auto">
              <Card className="border-0 shadow-sm">
                <Card.Body className="p-4">
                  <h5 className="fw-bold mb-4">➕ Create New Student</h5>
                  <Form onSubmit={handleCreateStudent}>
                    <Row>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Full Name *</Form.Label>
                          <Form.Control
                            type="text"
                            name="name"
                            placeholder="Enter student name"
                            required
                          />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Student ID *</Form.Label>
                          <Form.Control
                            type="text"
                            name="studentId"
                            placeholder="e.g., 21001"
                            required
                          />
                        </Form.Group>
                      </Col>
                    </Row>

                    <Form.Group className="mb-3">
                      <Form.Label>Email Address *</Form.Label>
                      <Form.Control
                        type="email"
                        name="email"
                        placeholder="student@example.com"
                        required
                      />
                    </Form.Group>

                    <Row>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Password *</Form.Label>
                          <Form.Control
                            type="password"
                            name="password"
                            placeholder="Minimum 6 characters"
                            required
                            minLength={6}
                          />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Department</Form.Label>
                          <Form.Select name="department">
                            <option>Computer Science</option>
                            <option>Information Technology</option>
                          
                          </Form.Select>
                        </Form.Group>
                      </Col>
                    </Row>

                    <div className="d-flex gap-2 justify-content-end mt-4">
                      <Button variant="secondary" onClick={() => setActiveTab('students')}>
                        Cancel
                      </Button>
                      <Button variant="primary" type="submit">
                        Create Student
                      </Button>
                    </div>
                  </Form>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        )}

  
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
                      ✉️ Compose Message
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
                            <div className="d-flex align-items-center justify-content-center rounded-circle text-white flex-shrink-0 shadow-sm" style={{ width: '48px', height: '48px', fontSize: '1.2rem', fontWeight: 'bold', background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' }}>
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
                                style={!message.isRead ? { background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', border: 'none' } : {}}
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
      </Container>

     
      <Modal show={showComposeModal} onHide={() => setShowComposeModal(false)} size="lg" centered className="border-0">
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="fw-bold">✉️ Compose Message</Modal.Title>
        </Modal.Header>
        <Modal.Body className="pt-2">
          <Form onSubmit={handleSendMessage}>
            <Form.Group className="mb-3">
              <Form.Label className="fw-semibold text-muted small text-uppercase">Recipient *</Form.Label>
              <Form.Select
                value={messageReceiver}
                onChange={(e) => setMessageReceiver(e.target.value)}
                required
                className="py-2 rounded-3"
              >
                <option value="">Select a recipient...</option>
                {hods.length > 0 && (
                  <optgroup label="HODs">
                    {hods.map(hod => (
                      <option key={hod._id || hod.id} value={hod.userId || hod._id}>
                        {hod.name} (HOD)
                      </option>
                    ))}
                  </optgroup>
                )}
                <optgroup label="Students">
                  {assignedStudents.map(student => (
                    <option key={student._id || student.id} value={student.userId || student._id}>
                      {student.name} ({student.studentId || student.email})
                    </option>
                  ))}
                </optgroup>
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label className="fw-semibold text-muted small text-uppercase">Subject *</Form.Label>
              <Form.Control
                type="text"
                placeholder="Enter message subject"
                value={messageSubject}
                onChange={(e) => setMessageSubject(e.target.value)}
                required
                className="py-2 rounded-3"
              />
            </Form.Group>
            <Form.Group className="mb-4">
              <Form.Label className="fw-semibold text-muted small text-uppercase">Message *</Form.Label>
              <Form.Control
                as="textarea"
                rows={5}
                placeholder="Type your message here..."
                value={messageContent}
                onChange={(e) => setMessageContent(e.target.value)}
                required
                className="rounded-3"
              />
            </Form.Group>
            <div className="d-flex justify-content-end gap-2">
              <Button variant="light" onClick={() => setShowComposeModal(false)} className="rounded-pill px-4 fw-semibold shadow-sm">
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleSendMessage}
                disabled={!messageReceiver || !messageSubject.trim() || !messageContent.trim()}
                className="rounded-pill px-4 fw-semibold shadow-sm"
                style={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', border: 'none' }}
              >
                Send Message
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>

      
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
              <Button variant="light" onClick={() => setShowReplyModal(false)} className="rounded-pill px-4 fw-semibold shadow-sm">Cancel</Button>
              <Button 
                type="submit" 
                variant="primary" 
                disabled={replyLoading}
                className="rounded-pill px-4 fw-semibold shadow-sm"
                style={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', border: 'none' }}
              >
                {replyLoading ? <><span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Sending...</> : 'Send Reply'}
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>

      
      <Modal show={showStudentProfileModal} onHide={() => setShowStudentProfileModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Student Profile</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedStudent && (
            <div>
              <p><strong>Name:</strong> {selectedStudent.name}</p>
              <p><strong>Student ID:</strong> {selectedStudent.studentId}</p>
              <p><strong>Email:</strong> {selectedStudent.email}</p>
            
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowStudentProfileModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>

     
      <Modal show={showMarksModal} onHide={() => setShowMarksModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Evaluate Project: {selectedProjectForMarks?.title}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Title & Abstract (Max 5)</Form.Label>
                  <Form.Control type="number" name="titleMarks" min="0" max="5" value={marksData.titleMarks} onChange={handleMarksChange} />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Weekly Progress (Max 10)</Form.Label>
                  <Form.Control type="number" name="progressMarks" min="0" max="10" value={marksData.progressMarks} onChange={handleMarksChange} />
                </Form.Group>
              </Col>
               <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>1st Review (Max 5)</Form.Label>
                  <Form.Control type="number" name="interactionMarks" min="0" max="5" value={marksData.interactionMarks} onChange={handleMarksChange} />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Documents (Max 15)</Form.Label>
                  <Form.Control type="number" name="documentMarks" min="0" max="15" value={marksData.documentMarks} onChange={handleMarksChange} />
                </Form.Group>
              </Col>
             
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>2nd Review (Max 5)</Form.Label>
                  <Form.Control type="number" name="finalReviewMarks" min="0" max="5" value={marksData.finalReviewMarks} onChange={handleMarksChange} />
                </Form.Group>
              </Col>
            </Row>
            
            <div className="p-3 bg-light rounded mb-3">
              <h5 className="mb-0 fw-bold">Total Marks: {totalMarks} / 40</h5>
            </div>

            <Form.Group className="mb-3">
              <Form.Label>Remarks</Form.Label>
              <Form.Control as="textarea" rows={3} name="remarks" value={marksData.remarks} onChange={handleMarksChange} placeholder="Enter feedback..." />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowMarksModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={submitMarks} disabled={totalMarks > 40}>
            Submit Marks
          </Button>
        </Modal.Footer>
      </Modal>

     
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
              <Button type="submit" disabled={profileLoading} style={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', border: 'none' }}>
                {profileLoading ? <><span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Saving...</> : 'Save Changes'}
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>

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
              <Button type="submit" disabled={passwordLoading} style={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', border: 'none' }}>
                {passwordLoading ? <><span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Updating...</> : 'Update Password'}
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>

     
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

export default StaffDashboard;
