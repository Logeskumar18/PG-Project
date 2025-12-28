import { useState, useEffect } from 'react';
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

  // Fetch staff-scoped data
  const fetchData = async () => {
    try {
      setLoadingData(true);
      // announcements
      setLoadingAnnouncements(true);
      const [annRes, studentsRes, projectsRes, docsRes, progressRes, messagesRes] = await Promise.all([
        api.get('/communication/announcements'),
        api.get('/staff/students'),
        api.get('/staff/projects'),
        api.get('/staff/documents'),
        api.get('/staff/progress'),
        api.get('/communication/messages/inbox')
      ]);

      if (annRes.data.data) setAnnouncements(annRes.data.data);
      if (studentsRes.data.data?.students) {
        setAssignedStudents(studentsRes.data.data.students);
      }
      if (projectsRes.data.data) setProjects(projectsRes.data.data);
      if (docsRes.data.data) setDocuments(docsRes.data.data);
      if (progressRes.data.data) setProgressUpdates(progressRes.data.data);
      if (messagesRes.data.data) setMessages(messagesRes.data.data);
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
    setMarksData(prev => ({
      ...prev,
      [name]: name === 'remarks' ? value : Number(value)
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
      await api.post('/marks/assign-marks', {
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
    try {
      const documentId = doc._id || doc.id;
      const response = await api.post(`/staff/documents/${documentId}/review`, {
        reviewStatus: 'Approved',
        remarks: 'Approved'
      });

      if (response.data.status === 'success') {
        setDocuments(documents.map(d =>
          (d._id || d.id) === documentId
            ? response.data.data
            : d
        ));
        setSuccessMessage('Document approved successfully');
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        setSuccessMessage('Failed to approve document');
      }
    } catch (error) {
      setSuccessMessage('Error approving document: ' + (error.response?.data?.message || error.message));
      setTimeout(() => setSuccessMessage(''), 5000);
    }
  };

  const handleRejectDocument = async (doc) => {
    try {
      const documentId = doc._id || doc.id;
      const response = await api.post(`/staff/documents/${documentId}/review`, {
        reviewStatus: 'Rejected',
        remarks: 'Rejected'
      });

      if (response.data.status === 'success') {
        setDocuments(documents.map(d =>
          (d._id || d.id) === documentId
            ? response.data.data
            : d
        ));
        setSuccessMessage('Document rejected');
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        setSuccessMessage('Failed to reject document');
      }
    } catch (error) {
      setSuccessMessage('Error rejecting document: ' + (error.response?.data?.message || error.message));
      setTimeout(() => setSuccessMessage(''), 5000);
    }
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

  const handleLogout = () => {
    logout();
    navigate('/login/staff');
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
            <Button variant="danger" size="sm" onClick={handleLogout}>Logout</Button>
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
            variant={activeTab === 'create-student' ? 'primary' : 'light'}
            onClick={() => setActiveTab('create-student')}
            className="fw-semibold"
          >
            ➕ Create Student
          </Button>
          <Button
            variant={activeTab === 'create-team' ? 'primary' : 'light'}
            onClick={() => setActiveTab('create-team')}
            className="fw-semibold"
          >
            👥 Create Team
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

                              {/* Document Review Modal */}
                              <Modal show={showReviewModal} onHide={() => setShowReviewModal(false)} centered>
                                ...
                              </Modal>

                              {/* ===== ADD HERE: Edit Project Modal ===== */}
                              <Modal show={showEditModal} onHide={() => setShowEditModal(false)} centered>
                                <Modal.Header closeButton>
                                  <Modal.Title>Edit Project</Modal.Title>
                                </Modal.Header>
                                <Modal.Body>
                                  <Form>
                                    <Form.Group className="mb-3">
                                      <Form.Label>Project Title</Form.Label>
                                      <Form.Control
                                        value={editTitle}
                                        onChange={(e) => setEditTitle(e.target.value)}
                                      />
                                    </Form.Group>

                                    <Form.Group>
                                      <Form.Label>Description</Form.Label>
                                      <Form.Control
                                        as="textarea"
                                        rows={3}
                                        value={editDescription}
                                        onChange={(e) => setEditDescription(e.target.value)}
                                      />
                                    </Form.Group>
                                  </Form>
                                </Modal.Body>
                                <Modal.Footer>
                                  <Button variant="secondary" onClick={() => setShowEditModal(false)}>
                                    Cancel
                                  </Button>
                                  <Button variant="primary" onClick={handleEditProject}>
                                    Save Changes
                                  </Button>
                                </Modal.Footer>
                              </Modal>
                              {/* ===== END Edit Project Modal ===== */}


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
                      {projects.map(project => (
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
                        {/* <th>Status</th> */}
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
                          {/* <td>
                            <Badge bg={(doc.reviewStatus || doc.status) === 'Approved' ? 'success' : (doc.reviewStatus || doc.status) === 'Rejected' ? 'danger' : 'warning'}>
                              {doc.reviewStatus || doc.status || 'Pending'}
                            </Badge>
                          </td> */}
                          <td>{doc.uploadedAt ? new Date(doc.uploadedAt).toLocaleDateString() : '—'}</td>
                          <td>
                            <Button
                              variant="outline-success"
                              size="sm"
                              className="me-2"
                              onClick={() => window.open(`http://localhost:5000/${doc.filePath}`, '_blank')}
                            >
                              Download
                            </Button>
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

        {/* Progress Tab */}
        {activeTab === 'progress' && (
          <Row className="g-4">
            <Col lg={12}>
              <Card className="border-0 shadow-sm">
                <Card.Body className="p-4">
                  <h5 className="fw-bold mb-4">📈 Student Progress Updates</h5>
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
                            <option>Electronics</option>
                            <option>Mechanical</option>
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

        {/* Create Team Tab */}
        {activeTab === 'create-team' && (
          <Row className="g-4">
            <Col lg={10} className="mx-auto">
              <Card className="border-0 shadow-sm">
                <Card.Body className="p-4">
                  <h5 className="fw-bold mb-4">👥 Create New Team</h5>
                  <Form onSubmit={async (e) => {
                    e.preventDefault();
                    const form = e.target;
                    const teamName = form[0].value;
                    const projectTitle = form[1].value;
                    const projectDescription = form[2].value;
                    const leaderId = form[3].value;
                    const memberOptions = form[4].options;
                    const memberIds = [];
                    for (let i = 0; i < memberOptions.length; i++) {
                      if (memberOptions[i].selected) memberIds.push(memberOptions[i].value);
                    }
                    try {
                      await api.post('/staff/teams/create', {
                        name: teamName,
                        projectTitle,
                        projectDescription,
                        leaderId,
                        memberIds
                      });
                      setSuccessMessage('Team created successfully!');
                      form.reset();
                      setTimeout(() => setSuccessMessage(''), 3000);
                    } catch (err) {
                      setSuccessMessage('Error creating team: ' + (err.response?.data?.message || err.message));
                    }
                  }}>
                    <h6 className="fw-bold mb-3">Team Details</h6>
                    <Form.Group className="mb-3">
                      <Form.Label>Team Name *</Form.Label>
                      <Form.Control
                        type="text"
                        placeholder="e.g., Team Alpha"
                        required
                      />
                    </Form.Group>

                    <h6 className="fw-bold mb-3 mt-4">Project Information</h6>
                    <Form.Group className="mb-3">
                      <Form.Label>Project Title *</Form.Label>
                      <Form.Control
                        type="text"
                        placeholder="Enter project title"
                        required
                      />
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Label>Project Description</Form.Label>
                      <Form.Control
                        as="textarea"
                        rows={3}
                        placeholder="Brief description of the project"
                      />
                    </Form.Group>

                    <h6 className="fw-bold mb-3 mt-4">Team Members</h6>
                    <Form.Group className="mb-3">
                      <Form.Label>Team Leader *</Form.Label>
                      <Form.Select required>
                        <option value="">Select team leader...</option>
                        {assignedStudents.map(s => (
                          <option key={s._id || s.id} value={s._id || s.id}>{s.name} ({s.studentId || s.email})</option>
                        ))}
                      </Form.Select>
                      <Form.Text className="text-muted">
                        Only students without teams are shown
                      </Form.Text>
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Label>Additional Team Members</Form.Label>
                      <Form.Control
                        as="select"
                        multiple
                        size="lg"
                        style={{ height: '150px' }}
                      >
                        {assignedStudents.map(s => (
                          <option key={s._id || s.id} value={s._id || s.id}>{s.name} ({s.studentId || s.email})</option>
                        ))}
                      </Form.Control>
                      <Form.Text className="text-muted">
                        Hold Ctrl/Cmd to select multiple students
                      </Form.Text>
                    </Form.Group>

                    <div className="alert alert-info">
                      <strong>ℹ️ Note:</strong> Team members will be notified via email and system notification once the team is created.
                    </div>

                    <div className="d-flex gap-2 justify-content-end mt-4">
                      <Button variant="secondary" onClick={() => setActiveTab('students')}>
                        Cancel
                      </Button>
                      <Button variant="primary" type="submit">
                        Create Team & Project
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
                  <Form.Label>Documents (Max 15)</Form.Label>
                  <Form.Control type="number" name="documentMarks" min="0" max="15" value={marksData.documentMarks} onChange={handleMarksChange} />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Interaction (Max 5)</Form.Label>
                  <Form.Control type="number" name="interactionMarks" min="0" max="5" value={marksData.interactionMarks} onChange={handleMarksChange} />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Final Review (Max 5)</Form.Label>
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
