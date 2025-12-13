import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Container, Row, Col, Card, Button, Form, Alert, Modal, Badge, Table, ProgressBar } from 'react-bootstrap';

const TeamDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { teamId } = useParams();
  const [activeTab, setActiveTab] = useState('overview');
  const [successMessage, setSuccessMessage] = useState('');
  
  // Sample team data (in production from API)
  const [team] = useState({
    id: 1,
    name: 'Team Alpha',
    project: { title: 'AI Chatbot System', status: 'In Progress' },
    guide: { name: 'Dr. Smith', email: 'smith@example.com' },
    members: [
      { id: 1, name: 'Raj Patel', rollNumber: '21001', role: 'Leader', email: 'raj@example.com' },
      { id: 2, name: 'Priya Singh', rollNumber: '21002', role: 'Member', email: 'priya@example.com' },
      { id: 3, name: 'Amit Kumar', rollNumber: '21003', role: 'Member', email: 'amit@example.com' }
    ],
    overallProgress: 65,
    status: 'Active'
  });

  const [stats] = useState({
    totalMembers: 3,
    overallProgress: 65,
    totalDocuments: 5,
    approvedDocuments: 3,
    pendingDocuments: 2,
    totalMilestones: 8,
    completedMilestones: 5
  });

  const [progressHistory] = useState([
    { id: 1, week: 1, student: 'Raj Patel', progress: 20, description: 'Initial setup and planning', date: '2024-11-15' },
    { id: 2, week: 2, student: 'Priya Singh', progress: 40, description: 'Database design completed', date: '2024-11-22' },
    { id: 3, week: 3, student: 'Amit Kumar', progress: 60, description: 'API development in progress', date: '2024-11-29' },
    { id: 4, week: 4, student: 'Raj Patel', progress: 75, description: 'Frontend integration started', date: '2024-12-06' }
  ]);

  const [documents] = useState([
    { id: 1, type: 'SRS', fileName: 'requirements.pdf', uploadedBy: 'Raj Patel', status: 'Approved', date: '2024-11-20' },
    { id: 2, type: 'PPT', fileName: 'presentation.pptx', uploadedBy: 'Priya Singh', status: 'Approved', date: '2024-11-25' },
    { id: 3, type: 'Report', fileName: 'progress-report.docx', uploadedBy: 'Amit Kumar', status: 'Pending', date: '2024-12-01' }
  ]);

  const [milestones] = useState([
    { id: 1, title: 'Project Planning', dueDate: '2024-11-15', status: 'Completed', priority: 'High' },
    { id: 2, title: 'Database Design', dueDate: '2024-11-22', status: 'Completed', priority: 'High' },
    { id: 3, title: 'API Development', dueDate: '2024-12-05', status: 'In Progress', priority: 'High' },
    { id: 4, title: 'Frontend Development', dueDate: '2024-12-15', status: 'Not Started', priority: 'Medium' }
  ]);

  const [showProgressModal, setShowProgressModal] = useState(false);
  const [showMemberModal, setShowMemberModal] = useState(false);

  const handleSubmitProgress = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    setSuccessMessage('Progress submitted successfully!');
    setShowProgressModal(false);
    e.target.reset();
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const handleAddMember = (e) => {
    e.preventDefault();
    setSuccessMessage('Member added to team!');
    setShowMemberModal(false);
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  return (
    <div className="min-vh-100" style={{background: '#f8f9fa'}}>
      {/* Navbar */}
      <div className="bg-white shadow-sm py-3 sticky-top">
        <Container fluid className="px-4">
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h4 className="fw-bold mb-0" style={{color: '#667eea'}}>👥 {team.name}</h4>
              <small className="text-muted">{team.project.title}</small>
            </div>
            <Button variant="outline-secondary" size="sm" onClick={() => navigate(-1)}>
              ← Back
            </Button>
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
            variant={activeTab === 'members' ? 'primary' : 'light'}
            onClick={() => setActiveTab('members')}
            className="fw-semibold"
          >
            👥 Members
          </Button>
          <Button 
            variant={activeTab === 'progress' ? 'primary' : 'light'}
            onClick={() => setActiveTab('progress')}
            className="fw-semibold"
          >
            📈 Progress
          </Button>
          <Button 
            variant={activeTab === 'documents' ? 'primary' : 'light'}
            onClick={() => setActiveTab('documents')}
            className="fw-semibold"
          >
            📁 Documents
          </Button>
          <Button 
            variant={activeTab === 'milestones' ? 'primary' : 'light'}
            onClick={() => setActiveTab('milestones')}
            className="fw-semibold"
          >
            🎯 Milestones
          </Button>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <Row className="g-4">
            {/* Stats Cards */}
            <Col lg={3} md={6}>
              <Card className="border-0 shadow-sm h-100">
                <Card.Body className="text-center p-4">
                  <h5 style={{color: '#667eea'}} className="fw-bold">👥 Team Members</h5>
                  <h2 className="fw-bold my-3">{stats.totalMembers}</h2>
                  <small className="text-muted">Active members</small>
                </Card.Body>
              </Card>
            </Col>

            <Col lg={3} md={6}>
              <Card className="border-0 shadow-sm h-100">
                <Card.Body className="text-center p-4">
                  <h5 style={{color: '#4facfe'}} className="fw-bold">📊 Progress</h5>
                  <h2 className="fw-bold my-3">{stats.overallProgress}%</h2>
                  <ProgressBar 
                    now={stats.overallProgress} 
                    variant="info" 
                    style={{height: '8px'}}
                  />
                </Card.Body>
              </Card>
            </Col>

            <Col lg={3} md={6}>
              <Card className="border-0 shadow-sm h-100">
                <Card.Body className="text-center p-4">
                  <h5 style={{color: '#43e97b'}} className="fw-bold">📁 Documents</h5>
                  <h2 className="fw-bold my-3">{stats.totalDocuments}</h2>
                  <small className="text-muted">{stats.approvedDocuments} approved, {stats.pendingDocuments} pending</small>
                </Card.Body>
              </Card>
            </Col>

            <Col lg={3} md={6}>
              <Card className="border-0 shadow-sm h-100">
                <Card.Body className="text-center p-4">
                  <h5 style={{color: '#ffa502'}} className="fw-bold">🎯 Milestones</h5>
                  <h2 className="fw-bold my-3">{stats.completedMilestones}/{stats.totalMilestones}</h2>
                  <small className="text-muted">Completed milestones</small>
                </Card.Body>
              </Card>
            </Col>

            {/* Team Info */}
            <Col lg={6}>
              <Card className="border-0 shadow-sm h-100">
                <Card.Body className="p-4">
                  <h5 className="fw-bold mb-4">📋 Team Information</h5>
                  <div className="d-flex flex-column gap-3">
                    <div>
                      <small className="text-muted">Team Name</small>
                      <p className="fw-semibold mb-0">{team.name}</p>
                    </div>
                    <div>
                      <small className="text-muted">Project</small>
                      <p className="fw-semibold mb-0">{team.project.title}</p>
                    </div>
                    <div>
                      <small className="text-muted">Guide</small>
                      <p className="fw-semibold mb-0">{team.guide.name}</p>
                    </div>
                    <div>
                      <small className="text-muted">Status</small>
                      <Badge bg="success">{team.status}</Badge>
                    </div>
                    <div>
                      <small className="text-muted">Overall Progress</small>
                      <ProgressBar 
                        now={team.overallProgress} 
                        label={`${team.overallProgress}%`}
                        variant="success"
                      />
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </Col>

            {/* Recent Progress */}
            <Col lg={6}>
              <Card className="border-0 shadow-sm h-100">
                <Card.Body className="p-4">
                  <div className="d-flex justify-content-between align-items-center mb-4">
                    <h5 className="fw-bold mb-0">📈 Recent Progress</h5>
                    <Button 
                      variant="primary" 
                      size="sm"
                      onClick={() => setShowProgressModal(true)}
                    >
                      + Submit Progress
                    </Button>
                  </div>
                  <div className="d-flex flex-column gap-3">
                    {progressHistory.slice(0, 3).map(p => (
                      <div key={p.id} className="p-3 bg-light rounded-3">
                        <div className="d-flex justify-content-between mb-1">
                          <strong>Week {p.week}</strong>
                          <Badge bg="primary">{p.progress}%</Badge>
                        </div>
                        <small className="text-muted d-block mb-1">{p.student}</small>
                        <small className="text-muted">{p.description}</small>
                      </div>
                    ))}
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        )}

        {/* Members Tab */}
        {activeTab === 'members' && (
          <Row className="g-4">
            <Col lg={12}>
              <Card className="border-0 shadow-sm">
                <Card.Body className="p-4">
                  <div className="d-flex justify-content-between align-items-center mb-4">
                    <h5 className="fw-bold mb-0">👥 Team Members</h5>
                    {user?.role === 'HOD' && (
                      <Button 
                        variant="primary"
                        onClick={() => setShowMemberModal(true)}
                      >
                        + Add Member
                      </Button>
                    )}
                  </div>
                  <Table hover responsive>
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Roll Number</th>
                        <th>Email</th>
                        <th>Role</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {team.members.map(member => (
                        <tr key={member.id}>
                          <td className="fw-semibold">{member.name}</td>
                          <td>{member.rollNumber}</td>
                          <td>{member.email}</td>
                          <td>
                            <Badge bg={member.role === 'Leader' ? 'warning' : 'secondary'}>
                              {member.role}
                            </Badge>
                          </td>
                          <td>
                            <Button variant="outline-secondary" size="sm">View Profile</Button>
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

        {/* Progress Tab */}
        {activeTab === 'progress' && (
          <Row className="g-4">
            <Col lg={12}>
              <Card className="border-0 shadow-sm">
                <Card.Body className="p-4">
                  <div className="d-flex justify-content-between align-items-center mb-4">
                    <h5 className="fw-bold mb-0">📈 Progress History</h5>
                    <Button 
                      variant="primary"
                      onClick={() => setShowProgressModal(true)}
                    >
                      + Submit Progress
                    </Button>
                  </div>
                  <div className="d-flex flex-column gap-3">
                    {progressHistory.map(p => (
                      <div key={p.id} className="p-3 border rounded-3">
                        <div className="d-flex justify-content-between align-items-start mb-2">
                          <div>
                            <h6 className="fw-bold mb-1">Week {p.week}</h6>
                            <small className="text-muted">Submitted by {p.student} on {p.date}</small>
                          </div>
                          <Badge bg="primary">{p.progress}%</Badge>
                        </div>
                        <p className="text-muted mb-0">{p.description}</p>
                      </div>
                    ))}
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        )}

        {/* Documents Tab */}
        {activeTab === 'documents' && (
          <Row className="g-4">
            <Col lg={12}>
              <Card className="border-0 shadow-sm">
                <Card.Body className="p-4">
                  <h5 className="fw-bold mb-4">📁 Team Documents</h5>
                  <Table hover responsive>
                    <thead>
                      <tr>
                        <th>Type</th>
                        <th>File Name</th>
                        <th>Uploaded By</th>
                        <th>Status</th>
                        <th>Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {documents.map(doc => (
                        <tr key={doc.id}>
                          <td><Badge bg="info">{doc.type}</Badge></td>
                          <td className="fw-semibold">{doc.fileName}</td>
                          <td>{doc.uploadedBy}</td>
                          <td>
                            <Badge bg={doc.status === 'Approved' ? 'success' : 'warning'}>
                              {doc.status}
                            </Badge>
                          </td>
                          <td>{doc.date}</td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        )}

        {/* Milestones Tab */}
        {activeTab === 'milestones' && (
          <Row className="g-4">
            <Col lg={12}>
              <Card className="border-0 shadow-sm">
                <Card.Body className="p-4">
                  <h5 className="fw-bold mb-4">🎯 Project Milestones</h5>
                  <div className="d-flex flex-column gap-3">
                    {milestones.map(m => (
                      <div key={m.id} className="p-3 border rounded-3">
                        <div className="d-flex justify-content-between align-items-start">
                          <div>
                            <h6 className="fw-bold mb-1">{m.title}</h6>
                            <small className="text-muted">Due: {m.dueDate}</small>
                          </div>
                          <div className="d-flex gap-2">
                            <Badge bg={m.priority === 'High' ? 'danger' : 'warning'}>
                              {m.priority}
                            </Badge>
                            <Badge 
                              bg={m.status === 'Completed' ? 'success' : m.status === 'In Progress' ? 'info' : 'secondary'}
                            >
                              {m.status}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        )}
      </Container>

      {/* Submit Progress Modal */}
      <Modal show={showProgressModal} onHide={() => setShowProgressModal(false)} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title>Submit Weekly Progress</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleSubmitProgress}>
            <Form.Group className="mb-3">
              <Form.Label>Week Number</Form.Label>
              <Form.Select name="week" required>
                <option value="">Select Week</option>
                {[1,2,3,4,5,6,7,8].map(w => (
                  <option key={w} value={w}>Week {w}</option>
                ))}
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Progress Percentage</Form.Label>
              <Form.Range name="progress" min={0} max={100} step={5} />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>What did you accomplish this week?</Form.Label>
              <Form.Control 
                as="textarea"
                rows={4}
                name="description"
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Challenges Faced (Optional)</Form.Label>
              <Form.Control 
                as="textarea"
                rows={2}
                name="challenges"
              />
            </Form.Group>
            <div className="d-flex gap-2 justify-content-end">
              <Button variant="secondary" onClick={() => setShowProgressModal(false)}>
                Cancel
              </Button>
              <Button variant="primary" type="submit">
                Submit Progress
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>

      {/* Add Member Modal */}
      <Modal show={showMemberModal} onHide={() => setShowMemberModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Add Team Member</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleAddMember}>
            <Form.Group className="mb-3">
              <Form.Label>Select Student</Form.Label>
              <Form.Select name="studentId" required>
                <option value="">Choose a student</option>
                <option value="1">Student 1</option>
                <option value="2">Student 2</option>
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Role</Form.Label>
              <Form.Select name="role">
                <option value="Member">Member</option>
                <option value="Leader">Leader</option>
              </Form.Select>
            </Form.Group>
            <div className="d-flex gap-2 justify-content-end">
              <Button variant="secondary" onClick={() => setShowMemberModal(false)}>
                Cancel
              </Button>
              <Button variant="primary" type="submit">
                Add Member
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default TeamDashboard;
