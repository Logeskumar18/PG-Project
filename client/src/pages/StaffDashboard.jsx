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
  const [announcements, setAnnouncements] = useState([]);
  const [loadingAnnouncements, setLoadingAnnouncements] = useState(false);
  const [loadingData, setLoadingData] = useState(false);

  // Live data
  const [assignedStudents, setAssignedStudents] = useState([]);
  const [projects, setProjects] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [milestones, setMilestones] = useState([]);

  // Fetch staff-scoped data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoadingData(true);
        // announcements
        setLoadingAnnouncements(true);
        const [annRes, studentsRes, projectsRes, docsRes] = await Promise.all([
          api.get('/communication/announcements'),
          api.get('/staff/students'),
          api.get('/staff/projects'),
          api.get('/staff/documents')
        ]);

        if (annRes.data.data) setAnnouncements(annRes.data.data);
        if (studentsRes.data.data?.students) setAssignedStudents(studentsRes.data.data.students);
        if (projectsRes.data.data) setProjects(projectsRes.data.data);
        if (docsRes.data.data) setDocuments(docsRes.data.data);
      } catch (error) {
        console.error('Error loading staff data:', error);
      } finally {
        setLoadingData(false);
        setLoadingAnnouncements(false);
      }
    };

    fetchData();
  }, []);

  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [approvalRemarks, setApprovalRemarks] = useState('');
  const [reviewRemarks, setReviewRemarks] = useState('');
  const [reviewStatus, setReviewStatus] = useState('Approved');

  const handleApproveProject = (project) => {
    setSelectedProject(project);
    setShowApprovalModal(true);
  };

  const handleSubmitApproval = () => {
    if (selectedProject) {
      setProjects(projects.map(p => 
        (p._id || p.id) === (selectedProject._id || selectedProject.id)
          ? { ...p, approvalStatus: 'Approved', status: 'Approved' }
          : p
      ));
      setSuccessMessage(`Project "${selectedProject.title}" approved successfully!`);
      setShowApprovalModal(false);
      setApprovalRemarks('');
      setTimeout(() => setSuccessMessage(''), 3000);
    }
  };

  const handleSubmitReject = () => {
    if (selectedProject) {
      setProjects(projects.map(p => 
        (p._id || p.id) === (selectedProject._id || selectedProject.id)
          ? { ...p, approvalStatus: 'Rejected', status: 'Rejected' }
          : p
      ));
      setSuccessMessage(`Project "${selectedProject.title}" rejected. Remarks sent to student.`);
      setShowApprovalModal(false);
      setApprovalRemarks('');
      setTimeout(() => setSuccessMessage(''), 3000);
    }
  };

  const handleReviewDocument = (doc) => {
    setSelectedDocument(doc);
    setShowReviewModal(true);
  };

  const handleSubmitReview = () => {
    if (selectedDocument) {
      setDocuments(documents.map(d =>
        (d._id || d.id) === (selectedDocument._id || selectedDocument.id)
          ? { ...d, reviewStatus }
          : d
      ));
      setSuccessMessage(`Document review submitted with status: ${reviewStatus}`);
      setShowReviewModal(false);
      setReviewRemarks('');
      setReviewStatus('Approved');
      setTimeout(() => setSuccessMessage(''), 3000);
    }
  };

  const handleCreateMilestone = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const newMilestone = {
      id: milestones.length + 1,
      title: formData.get('title'),
      student: formData.get('student'),
      dueDate: formData.get('dueDate'),
      status: 'Not Started',
      priority: formData.get('priority')
    };
    setMilestones([...milestones, newMilestone]);
    setSuccessMessage('Milestone created successfully!');
    e.target.reset();
    setTimeout(() => setSuccessMessage(''), 3000);
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
        setTimeout(() => setSuccessMessage(''), 3000);
      }
    } catch (error) {
      const errorMsg = error.response?.data?.message || error.message || 'Failed to create student';
      setSuccessMessage(`Error: ${errorMsg}`);
      setTimeout(() => setSuccessMessage(''), 5000);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login/staff');
  };

  const pendingCount = projects.filter(p => (p.approvalStatus || p.approval) === 'Pending').length;
  const approvedCount = projects.filter(p => (p.approvalStatus || p.approval) === 'Approved').length;
  const pendingDocReviews = documents.filter(d => (d.reviewStatus || d.status) === 'Pending').length;

  return (
    <div className="min-vh-100" style={{background: '#f8f9fa'}}>
      {/* Navbar */}
      <div className="bg-white shadow-sm py-3 sticky-top">
        <Container fluid className="px-4">
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h4 className="fw-bold mb-0" style={{color: '#4facfe'}}>👨‍🏫 Staff Dashboard</h4>
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
            variant={activeTab === 'documents' ? 'primary' : 'light'}
            onClick={() => setActiveTab('documents')}
            className="fw-semibold"
          >
            📁 Document Reviews
          </Button>
          <Button 
            variant={activeTab === 'milestones' ? 'primary' : 'light'}
            onClick={() => setActiveTab('milestones')}
            className="fw-semibold"
          >
            📌 Milestones & Tasks
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
                  <h5 style={{color: '#4facfe'}} className="fw-bold">👥 Assigned Students</h5>
                  <h2 className="fw-bold my-3">{assignedStudents.length}</h2>
                  <small className="text-muted">Active students under your guidance</small>
                </Card.Body>
              </Card>
            </Col>

            <Col lg={3} md={6}>
              <Card className="border-0 shadow-sm h-100">
                <Card.Body className="text-center p-4">
                  <h5 style={{color: '#ffa502'}} className="fw-bold">⏳ Pending Approvals</h5>
                  <h2 className="fw-bold my-3">{pendingCount}</h2>
                  <small className="text-muted">Projects awaiting approval</small>
                </Card.Body>
              </Card>
            </Col>

            <Col lg={3} md={6}>
              <Card className="border-0 shadow-sm h-100">
                <Card.Body className="text-center p-4">
                  <h5 style={{color: '#43e97b'}} className="fw-bold">✅ Approved</h5>
                  <h2 className="fw-bold my-3">{approvedCount}</h2>
                  <small className="text-muted">Approved projects</small>
                </Card.Body>
              </Card>
            </Col>

            <Col lg={3} md={6}>
              <Card className="border-0 shadow-sm h-100">
                <Card.Body className="text-center p-4">
                  <h5 style={{color: '#f5576c'}} className="fw-bold">📄 Doc Reviews</h5>
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
                          <td>{project.createdAt ? new Date(project.createdAt).toLocaleDateString() : '—'}</td>
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
                            <Button variant="sm" size="sm" className="me-2">View Profile</Button>
                            <Button variant="outline-secondary" size="sm">Send Message</Button>
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
                  <div className="d-flex flex-column gap-3">
                    {projects.map(project => (
                      <div key={project._id || project.id} className="p-3 border rounded-3 d-flex justify-content-between align-items-center">
                        <div className="flex-grow-1">
                          <h6 className="fw-bold mb-1">{project.title}</h6>
                          <small className="text-muted">Submitted by <strong>{project.studentId?.name || 'N/A'}</strong> on {project.createdAt ? new Date(project.createdAt).toLocaleDateString() : '—'}</small>
                        </div>
                        <div className="d-flex gap-2 align-items-center">
                          <Badge 
                            bg={(project.approvalStatus || project.approval) === 'Approved' ? 'success' : (project.approvalStatus || project.approval) === 'Rejected' ? 'danger' : 'warning'}
                          >
                            {project.approvalStatus || project.approval || 'Pending'}
                          </Badge>
                          {(project.approvalStatus || project.approval) === 'Pending' && (
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
                        </div>
                      </div>
                    ))}
                  </div>
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
                          <td>{doc.uploadedAt ? new Date(doc.uploadedAt).toLocaleDateString() : '—'}</td>
                          <td>
                            <Button 
                              variant="outline-primary" 
                              size="sm"
                              onClick={() => handleReviewDocument(doc)}
                            >
                              Review
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

        {/* Milestones & Tasks Tab */}
        {activeTab === 'milestones' && (
          <Row className="g-4">
            <Col lg={6}>
              <Card className="border-0 shadow-sm">
                <Card.Body className="p-4">
                  <h5 className="fw-bold mb-4">📌 Assign New Milestone</h5>
                  <Form onSubmit={handleCreateMilestone}>
                    <Form.Group className="mb-3">
                      <Form.Label>Select Student</Form.Label>
                      <Form.Select name="student" required>
                        <option value="">Choose a student</option>
                        {assignedStudents.map(s => (
                          <option key={s._id || s.id} value={s.name}>{s.name}</option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                    <Form.Group className="mb-3">
                      <Form.Label>Milestone Title</Form.Label>
                      <Form.Control name="title" placeholder="e.g., Database Design Phase" required />
                    </Form.Group>
                    <Form.Group className="mb-3">
                      <Form.Label>Due Date</Form.Label>
                      <Form.Control type="date" name="dueDate" required />
                    </Form.Group>
                    <Form.Group className="mb-4">
                      <Form.Label>Priority</Form.Label>
                      <Form.Select name="priority">
                        <option value="Low">Low</option>
                        <option value="Medium" defaultValue>Medium</option>
                        <option value="High">High</option>
                      </Form.Select>
                    </Form.Group>
                    <Button 
                      type="submit"
                      className="w-100 fw-semibold text-white"
                      style={{background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', border: 'none'}}
                    >
                      Assign Milestone
                    </Button>
                  </Form>
                </Card.Body>
              </Card>
            </Col>

            <Col lg={6}>
              <Card className="border-0 shadow-sm">
                <Card.Body className="p-4">
                  <h5 className="fw-bold mb-4">📊 Milestone Progress</h5>
                  <div className="d-flex flex-column gap-3">
                    {milestones.map(m => (
                      <div key={m.id} className="p-3 bg-light rounded-3">
                        <div className="d-flex justify-content-between align-items-start mb-2">
                          <div>
                            <strong>{m.title}</strong>
                            <br />
                            <small className="text-muted">{m.student}</small>
                          </div>
                          <Badge bg={m.priority === 'High' ? 'danger' : m.priority === 'Medium' ? 'warning' : 'secondary'}>
                            {m.priority}
                          </Badge>
                        </div>
                        <div className="d-flex justify-content-between align-items-center">
                          <small className="text-muted">Due: {m.dueDate}</small>
                          <Badge bg={m.status === 'Completed' ? 'success' : m.status === 'In Progress' ? 'info' : 'secondary'}>
                            {m.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
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
          <Modal.Title>Review: {selectedDocument?.fileName}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Review Status</Form.Label>
              <Form.Select 
                value={reviewStatus}
                onChange={(e) => setReviewStatus(e.target.value)}
              >
                <option value="Approved">✅ Approved</option>
                <option value="Needs Review">⚠️ Needs Review</option>
                <option value="Rejected">❌ Rejected</option>
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Remarks</Form.Label>
              <Form.Control 
                as="textarea"
                rows={4}
                value={reviewRemarks}
                onChange={(e) => setReviewRemarks(e.target.value)}
                placeholder="Add your comments or feedback"
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowReviewModal(false)}>
            Cancel
          </Button>
          <Button 
            variant="primary"
            onClick={handleSubmitReview}
          >
            Submit Review
          </Button>
        </Modal.Footer>
      </Modal>

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
                <Form onSubmit={(e) => {
                  e.preventDefault();
                  setSuccessMessage('Team created successfully!');
                  e.target.reset();
                  setTimeout(() => setSuccessMessage(''), 3000);
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
                      <option value="1">Raj Patel (21001)</option>
                      <option value="2">Priya Singh (21002)</option>
                      <option value="3">Amit Kumar (21003)</option>
                      <option value="4">Neha Sharma (21004)</option>
                      <option value="5">Rohit Verma (21005)</option>
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
                      style={{height: '150px'}}
                    >
                      <option value="1">Raj Patel (21001)</option>
                      <option value="2">Priya Singh (21002)</option>
                      <option value="3">Amit Kumar (21003)</option>
                      <option value="4">Neha Sharma (21004)</option>
                      <option value="5">Rohit Verma (21005)</option>
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
    </div>
  );
};

export default StaffDashboard;
