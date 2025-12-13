import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Container, Row, Col, Card, Button, Form, Alert, Modal, Badge } from 'react-bootstrap';
import api from '../services/api';

const StudentDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [projectTitle, setProjectTitle] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [project, setProject] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [progressUpdates, setProgressUpdates] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [loadingAnnouncements, setLoadingAnnouncements] = useState(false);

  // Fetch announcements on mount
  useEffect(() => {
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

    const fetchProject = async () => {
      try {
        const response = await api.get('/student/projects/my');
        if (response.data.data) {
          setProject(response.data.data);
        }
      } catch (error) {
        // No project yet, ignore
      }
    };

    fetchAnnouncements();
    fetchProject();
  }, []);

  const handleProjectSubmit = async (e) => {
    e.preventDefault();
    if (projectTitle.trim() && projectDescription.trim()) {
      try {
        const response = await api.post('/student/projects', {
          title: projectTitle,
          description: projectDescription
        });
        if (response.data && response.data.data) {
          setProject(response.data.data);
          setSuccessMessage('Project title submitted successfully!');
        } else {
          setSuccessMessage('Project submitted, but no data returned.');
        }
      } catch (error) {
        setSuccessMessage('Error submitting project: ' + (error.response?.data?.message || error.message));
      }
      setProjectTitle('');
      setProjectDescription('');
      setShowProjectModal(false);
      setTimeout(() => setSuccessMessage(''), 3000);
    }
  };

  const handleDocumentUpload = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const docType = formData.get('docType');
    const file = formData.get('file');
    const comments = formData.get('comments');
    
    if (file && file.name) {
      const newDoc = {
        id: documents.length + 1,
        type: docType,
        fileName: file.name,
        uploadDate: new Date().toLocaleDateString(),
        status: 'Uploaded',
        comments: comments || 'No comments'
      };
      setDocuments([...documents, newDoc]);
      setSuccessMessage('Document uploaded successfully!');
      e.target.reset();
      setTimeout(() => setSuccessMessage(''), 3000);
    }
  };

  const handleProgressSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const week = formData.get('week');
    const progress = formData.get('progress');
    const update = formData.get('update');
    
    if (week && progress && update) {
      const newProgress = {
        id: progressUpdates.length + 1,
        week: week,
        progress: progress,
        description: update,
        submittedDate: new Date().toLocaleDateString()
      };
      setProgressUpdates([...progressUpdates, newProgress]);
      setSuccessMessage('Progress update submitted successfully!');
      e.target.reset();
      setTimeout(() => setSuccessMessage(''), 3000);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login/student');
  };

  return (
    <div className="min-vh-100" style={{background: '#f8f9fa'}}>
      {/* Navbar */}
      <div className="bg-white shadow-sm py-3 sticky-top">
        <Container fluid className="px-4">
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h4 className="fw-bold mb-0" style={{color: '#667eea'}}>📚 Student Dashboard</h4>
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
            variant={activeTab === 'feedback' ? 'primary' : 'light'}
            onClick={() => setActiveTab('feedback')}
            className="fw-semibold"
          >
            💬 Feedback
          </Button>
          <Button 
            variant={activeTab === 'status' ? 'primary' : 'light'}
            onClick={() => setActiveTab('status')}
            className="fw-semibold"
          >
            ✅ Status
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
            <Col lg={6}>
              <Card className="border-0 shadow-sm h-100">
                <Card.Body className="p-4">
                  <h5 className="fw-bold mb-4">📊 Quick Stats</h5>
                  <div className="d-flex flex-column gap-3">
                    <div className="d-flex justify-content-between p-3 bg-light rounded-3">
                      <span className="fw-semibold">Project Status:</span>
                      <span className="badge bg-info">{project ? 'In Progress' : 'Not Started'}</span>
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
                      style={{background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', border: 'none'}}
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
                        <p className="fw-semibold">{user?.rollNumber || 'Not Set'}</p>
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
              {!project ? (
                <Card className="border-0 shadow-sm">
                  <Card.Body className="p-5 text-center">
                    <h5 className="fw-bold mb-3">📋 No Project Submitted Yet</h5>
                    <p className="text-muted mb-4">Submit your project title to get started</p>
                    <Button 
                      className="fw-semibold text-white px-5 py-2"
                      style={{background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', border: 'none'}}
                      onClick={() => setShowProjectModal(true)}
                    >
                      Submit Project Title
                    </Button>
                  </Card.Body>
                </Card>
              ) : (
                <Card className="border-0 shadow-sm">
                  <Card.Body className="p-4">
                    <div className="d-flex justify-content-between align-items-start mb-4 pb-3 border-bottom">
                      <div>
                        <h5 className="fw-bold mb-2">{project.title}</h5>
                        <small className="text-muted">Submitted on {project.submittedDate}</small>
                      </div>
                      <span className={`badge ${project.approvalStatus === 'approved' ? 'bg-success' : project.approvalStatus === 'rejected' ? 'bg-danger' : 'bg-info'}`}>{project.approvalStatus ? project.approvalStatus.charAt(0).toUpperCase() + project.approvalStatus.slice(1) : project.status}</span>
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
                    <Button variant="outline-primary" onClick={() => setShowProjectModal(true)}>
                      Edit Project Details
                    </Button>
                  </Card.Body>
                </Card>
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
                      style={{background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', border: 'none'}}
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
                  <h5 className="fw-bold mb-4">📁 My Submissions</h5>
                  {documents.length === 0 ? (
                    <div className="text-center py-5 text-muted">
                      <p className="mb-0">No submissions yet</p>
                      <small>Upload documents to track them here</small>
                    </div>
                  ) : (
                    <div className="d-flex flex-column gap-3">
                      {documents.map((doc) => (
                        <div key={doc.id} className="p-3 bg-light rounded-3">
                          <div className="d-flex justify-content-between mb-2">
                            <strong>{doc.fileName}</strong>
                            <span className="badge bg-success">{doc.status}</span>
                          </div>
                          <small className="text-muted d-block mb-2">Type: {doc.type}</small>
                          <small className="text-muted d-block">Uploaded: {doc.uploadDate}</small>
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
                        placeholder="Describe the work completed, challenges faced, and next steps"
                        required
                      />
                    </Form.Group>
                    <Button 
                      type="submit"
                      className="w-100 fw-semibold text-white"
                      style={{background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', border: 'none'}}
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

        {/* Feedback Tab */}
        {activeTab === 'feedback' && (
          <Row className="g-4">
            <Col lg={12}>
              <Card className="border-0 shadow-sm">
                <Card.Body className="p-4">
                  <h5 className="fw-bold mb-4">💬 Feedback from Staff</h5>
                  {project && project.approvalStatus && project.approvalStatus.toLowerCase() !== 'pending' ? (
                    <div className="text-center py-4">
                      <p className={`mb-2 fw-bold ${project.approvalStatus.toLowerCase() === 'approved' ? 'text-success' : project.approvalStatus.toLowerCase() === 'rejected' ? 'text-danger' : 'text-secondary'}`}>{project.approvalStatus.charAt(0).toUpperCase() + project.approvalStatus.slice(1)}</p>
                      <p className="mb-0">{project.approvalRemarks ? project.approvalRemarks : 'No remarks provided.'}</p>
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

            <Col lg={12}>
              <Card className="border-0 shadow-sm">
                <Card.Body className="p-4">
                  <h5 className="fw-bold mb-4">📞 Contact Your Guide</h5>
                  <Form>
                    <Form.Group className="mb-3">
                      <Form.Label>Subject</Form.Label>
                      <Form.Control placeholder="Enter message subject" />
                    </Form.Group>
                    <Form.Group className="mb-4">
                      <Form.Label>Message</Form.Label>
                      <Form.Control as="textarea" rows={4} placeholder="Type your message here" />
                    </Form.Group>
                    <Button 
                      className="w-100 fw-semibold text-white"
                      style={{background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', border: 'none'}}
                    >
                      Send Message
                    </Button>
                  </Form>
                </Card.Body>
              </Card>
            </Col>
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
                      <div className="p-3 bg-light rounded-3 border-start border-5" style={{borderColor: '#667eea'}}>
                        <h6 className="fw-bold mb-2">Project Title</h6>
                        <p className="text-muted mb-0">{project ? '✅ Submitted' : '⏳ Pending'}</p>
                      </div>
                    </Col>
                    <Col md={6}>
                      <div className="p-3 bg-light rounded-3 border-start border-5" style={{borderColor: '#4facfe'}}>
                        <h6 className="fw-bold mb-2">Document Uploads</h6>
                        <p className="text-muted mb-0">{documents.length === 0 ? '⏳ Pending' : `✅ ${documents.length} Uploaded`}</p>
                      </div>
                    </Col>
                    <Col md={6}>
                      <div className="p-3 bg-light rounded-3 border-start border-5" style={{borderColor: '#43e97b'}}>
                        <h6 className="fw-bold mb-2">Progress Updates</h6>
                        <p className="text-muted mb-0">{progressUpdates.length === 0 ? '⏳ Pending' : `✅ ${progressUpdates.length} Submitted`}</p>
                      </div>
                    </Col>
                    <Col md={6}>
                      <div className="p-3 bg-light rounded-3 border-start border-5" style={{borderColor: '#f5576c'}}>
                        <h6 className="fw-bold mb-2">Feedback</h6>
                        <p className="text-muted mb-0">
                          {project && project.approvalStatus ? (
                            <span className={project.approvalStatus === 'approved' ? 'text-success' : project.approvalStatus === 'rejected' ? 'text-danger' : 'text-secondary'}>
                              {project.approvalStatus.charAt(0).toUpperCase() + project.approvalStatus.slice(1)}
                            </span>
                          ) : '⏳ Awaiting Feedback'}
                          {project && project.approvalRemarks && (
                            <span className="d-block small mt-1">{project.approvalRemarks}</span>
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
      </Container>

      {/* Project Modal */}
      <Modal show={showProjectModal} onHide={() => setShowProjectModal(false)} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title>Submit Project Title</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Project Title *</Form.Label>
              <Form.Control 
                value={projectTitle}
                onChange={(e) => setProjectTitle(e.target.value)}
                placeholder="Enter your project title"
              />
            </Form.Group>
            <Form.Group className="mb-4">
              <Form.Label>Project Description *</Form.Label>
              <Form.Control 
                as="textarea"
                rows={4}
                value={projectDescription}
                onChange={(e) => setProjectDescription(e.target.value)}
                placeholder="Describe your project in detail"
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowProjectModal(false)}>
            Cancel
          </Button>
          <Button 
            className="fw-semibold text-white"
            style={{background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', border: 'none'}}
            onClick={handleProjectSubmit}
          >
            Submit Project
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default StudentDashboard;
