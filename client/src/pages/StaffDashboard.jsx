import { useState, useEffect } from 'react';
import ConfirmLogoutModal from '../components/ConfirmLogoutModal';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Container, Row, Col, Card, Button, Form, Alert, Modal, Badge, Table } from 'react-bootstrap';
import api from '../services/api';

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


  // Live data
  const [assignedStudents, setAssignedStudents] = useState([]);
  const [projects, setProjects] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [progressUpdates, setProgressUpdates] = useState([]);
  const [deadlines, setDeadlines] = useState([]);
  const [meetings, setMeetings] = useState([]);

  // Fetch staff-scoped data
  const fetchData = async () => {
    try {
      setLoadingData(true);
      // announcements
      setLoadingAnnouncements(true);
      const [annRes, studentsRes, projectsRes, docsRes, progressRes, messagesRes, meetingsRes] = await Promise.all([
        api.get('/communication/announcements'),
        api.get('/staff/students'),
        api.get('/staff/projects'),
        api.get('/staff/documents'),
        api.get('/staff/progress'),
        api.get('/communication/messages/inbox'),
        api.get('/staff/meetings').catch(() => ({ data: { data: [] } }))
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

  // Marks State
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

  const STAGES = ['Proposal Submitted', 'Proposal Approved', 'Development', 'Mid Review', 'Testing', 'Final Submission'];

  const handleUpdateStage = async (projectId, newStage) => {
    try {
      const res = await api.put(`/staff/projects/${projectId}/status`, { stage: newStage });
      if (res.data.status === 'success') {
        setProjects(projects.map(p => (p._id || p.id) === projectId ? { ...p, stage: newStage } : p));
        setSuccessMessage('Project stage updated successfully');
        setTimeout(() => setSuccessMessage(''), 3000);
      }
    } catch (err) {
      setErrorMessage('Error updating stage: ' + (err.response?.data?.message || err.message));
      setTimeout(() => setErrorMessage(''), 3000);
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
      fetchData(); // Refresh data
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
        // Update local state with the response data
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
        await fetchData(); // Refetch data to update assigned students
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
      // Refresh messages
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

  return (
    <div className="min-vh-100" style={{ background: '#f8f9fa' }}>
      {/* Navbar */}
      <div className="bg-white shadow-sm py-3 sticky-top">
        <Container fluid className="px-4">
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h4 className="fw-bold mb-0" style={{ color: '#4facfe' }}>👨‍🏫 Staff Dashboard</h4>
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
            ❌ {errorMessage}
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
        </div>

        {/* Overview Tab */}
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

            {deadlines.length > 0 && (
              <Col lg={12}>
                <Card className="border-0 shadow-sm">
                  <Card.Body className="p-4">
                    <h5 className="fw-bold mb-4">⏰ Global Deadlines</h5>
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

        {/* Assigned Students Tab */}
        {activeTab === 'students' && (
          <Row className="g-4">
            <Col lg={12}>
              <Card className="border-0 shadow-sm">
                <Card.Body className="p-4">
                  <h5 className="fw-bold mb-4">👥 My Assigned Students</h5>
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
                      {assignedStudents.map(student => (
                        <tr key={student._id || student.id}>
                          <td className="fw-semibold">{student.name}</td>
                          <td>{student.studentId}</td>
                          <td>{student.email}</td>
                          <td><Badge bg="primary">{student.projectCount || student.projects || 0}</Badge></td>
                          <td>
                            <Button variant="sm" size="sm" className="me-2" onClick={() => handleViewProfile(student)}>View Profile</Button>
                            {/* <Button variant="outline-secondary" size="sm">Send Message</Button> */}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        )}

        {/* Approvals Tab */}
        {activeTab === 'approvals' && (
          <Row className="g-4">
            <Col lg={12}>
              <Card className="border-0 shadow-sm">
                <Card.Body className="p-4">
                  <h5 className="fw-bold mb-4">✅ Project Approvals</h5>

                  {Array.isArray(projects) && projects.length > 0 ? (
                    <div className="d-flex flex-column gap-3">
                      {projects.map((project) => {
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
                              {/* Approval Modal */}
                              <Modal show={showApprovalModal} onHide={() => setShowApprovalModal(false)} centered>
                                ...
                              </Modal>

                            </div>
                          </div>
                        );
                      })}
                    </div>
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

        {/* Evaluations Tab */}
        {activeTab === 'evaluations' && (
          <Row className="g-4">
            <Col lg={12}>
              <Card className="border-0 shadow-sm">
                <Card.Body className="p-4">
                  <h5 className="fw-bold mb-4">📝 Project Evaluations</h5>
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
                      {projects
                        .filter(project => (project.approvalStatus || project.approval) === 'Approved')
                        .map(project => (
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
                </Card.Body>
              </Card>
            </Col>
          </Row>
        )}

        {/* Document Reviews Tab */}
        {activeTab === 'documents' && (
          <Row className="g-4">
            <Col lg={12}>
              <Card className="border-0 shadow-sm">
                <Card.Body className="p-4">
                  <h5 className="fw-bold mb-4">📁 Document Reviews</h5>
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
                      {documents.map(doc => (
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
                            {(doc.cloudinaryUrl || doc.fileUrl || doc.url) ? (
                              <Button
                                variant="outline-success"
                                size="sm"
                                className="me-2"
                                onClick={() => window.open(doc.cloudinaryUrl || doc.fileUrl || doc.url, '_blank')}
                              >
                                View
                              </Button>
                            ) : (
                              <Button
                                variant="outline-success"
                                size="sm"
                                className="me-2"
                                onClick={() => window.open(api.defaults?.baseURL ? `${api.defaults.baseURL.replace(/\/$/, '')}/staff/documents/${doc._id || doc.id}/download` : `/api/staff/documents/${doc._id || doc.id}/download`, '_blank')}
                              >
                                View
                              </Button>
                            )}
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

        {/* Document Review Modal */}
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

        {/* Progress Tab */}
        {activeTab === 'progress' && (
          <Row className="g-4">
            <Col lg={12}>
              <Card className="border-0 shadow-sm mb-4">
                <Card.Body className="p-4">
                  <h5 className="fw-bold mb-4">📈 Project Stage Tracker</h5>
                  {projects.filter(p => (p.approvalStatus || p.approval) === 'Approved').length === 0 ? (
                    <div className="text-center text-muted py-4">No approved projects yet</div>
                  ) : (
                    <div className="d-flex flex-column gap-4">
                      {projects.filter(p => (p.approvalStatus || p.approval) === 'Approved').map(project => {
                        const currentStageIndex = STAGES.indexOf(project.stage || 'Proposal Approved');
                        return (
                          <div key={project._id || project.id} className="p-3 border rounded-3 bg-white shadow-sm">
                            <div className="d-flex justify-content-between align-items-center mb-4">
                              <div>
                                <h6 className="fw-bold mb-0">{project.title}</h6>
                                <small className="text-muted">Student: {project.studentId?.name || 'N/A'}</small>
                              </div>
                              <Form.Select 
                                size="sm" 
                                className="w-auto fw-semibold border-primary text-primary bg-light"
                                value={project.stage || 'Proposal Approved'}
                                onChange={(e) => handleUpdateStage(project._id || project.id, e.target.value)}
                              >
                                {STAGES.map(stage => (
                                  <option key={stage} value={stage}>{stage}</option>
                                ))}
                              </Form.Select>
                            </div>
                            
                            <div className="position-relative mt-4 mb-2 mx-4">
                              <div className="progress position-absolute w-100" style={{ height: '4px', top: '13px', zIndex: 0 }}>
                                <div 
                                  className="progress-bar bg-success transition-all" 
                                  style={{ width: `${(Math.max(0, currentStageIndex) / (STAGES.length - 1)) * 100}%`, transition: 'width 0.5s ease-in-out' }}
                                ></div>
                              </div>
                              <div className="d-flex justify-content-between position-relative" style={{ zIndex: 1 }}>
                                {STAGES.map((stage, idx) => (
                                  <div key={stage} className="d-flex flex-column align-items-center" style={{ width: '80px', marginLeft: idx === 0 ? '-40px' : '0', marginRight: idx === STAGES.length - 1 ? '-40px' : '0' }}>
                                    <div 
                                      className={`rounded-circle d-flex align-items-center justify-content-center fw-bold shadow-sm ${idx <= currentStageIndex ? 'bg-success text-white' : 'bg-white text-muted border'}`}
                                      style={{ width: '30px', height: '30px', fontSize: '12px', transition: 'all 0.3s ease' }}
                                    >
                                      {idx <= currentStageIndex ? '✓' : idx + 1}
                                    </div>
                                    <div className="text-center mt-2 text-wrap" style={{ fontSize: '0.75rem', lineHeight: '1.2', fontWeight: idx <= currentStageIndex ? '600' : 'normal', color: idx <= currentStageIndex ? '#198754' : '#6c757d' }}>
                                      {stage}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </Card.Body>
              </Card>

              <Card className="border-0 shadow-sm">
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

        {/* Meetings Tab */}
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

        {/* Create Student Tab */}
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
                      ✉️ Compose Message
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
                                  From: {message.senderId?.name} ({message.senderId?.role})
                                </small>
                                <small className="text-muted">
                                  {new Date(message.createdAt).toLocaleDateString()}
                                </small>
                                {!message.isRead && <Badge bg="primary">New</Badge>}
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
      </Container>

      {/* Compose Message Modal */}
      <Modal show={showComposeModal} onHide={() => setShowComposeModal(false)} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title>✉️ Compose Message</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleSendMessage}>
            <Form.Group className="mb-3">
              <Form.Label>Recipient *</Form.Label>
              <Form.Select
                value={messageReceiver}
                onChange={(e) => setMessageReceiver(e.target.value)}
                required
              >
                <option value="">Select a student...</option>
                {assignedStudents.map(student => (
                  <option key={student._id || student.id} value={student.userId || student._id}>
                    {student.name} ({student.studentId || student.email})
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Subject *</Form.Label>
              <Form.Control
                type="text"
                placeholder="Enter message subject"
                value={messageSubject}
                onChange={(e) => setMessageSubject(e.target.value)}
                required
              />
            </Form.Group>
            <Form.Group className="mb-4">
              <Form.Label>Message *</Form.Label>
              <Form.Control
                as="textarea"
                rows={5}
                placeholder="Type your message here..."
                value={messageContent}
                onChange={(e) => setMessageContent(e.target.value)}
                required
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowComposeModal(false)}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSendMessage}
            disabled={!messageReceiver || !messageSubject.trim() || !messageContent.trim()}
          >
            Send Message
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Student Profile Modal */}
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
              {/* Add more student details here as needed */}
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowStudentProfileModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Marks Modal */}
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

    </div>
  );
};

export default StaffDashboard;
