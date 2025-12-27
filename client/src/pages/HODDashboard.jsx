import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Container, Row, Col, Card, Button, Form, Alert, Modal, Badge, Table, ProgressBar, Spinner } from 'react-bootstrap';
import api from '../services/api';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const HODDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  // State for data from API
  const [stats, setStats] = useState({
    totalProjects: 0,
    totalStudents: 0,
    totalStaff: 0,
    pendingApprovals: 0,
    completedProjects: 0
  });

  const [projects, setProjects] = useState([]);
  const [staff, setStaff] = useState([]);
  const [students, setStudents] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [evaluations, setEvaluations] = useState([]);

  // Fetch data from API
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch overview
        const overviewRes = await api.get('/hod/dashboard/overview');
        if (overviewRes.data.data) {
          setStats(overviewRes.data.data);
        }

        // Fetch staff
        const staffRes = await api.get('/hod/staff');
        if (staffRes.data.data) {
          setStaff(staffRes.data.data);
        }

        // Fetch students
        const studentsRes = await api.get('/hod/students');
        if (studentsRes.data.data) {
          setStudents(studentsRes.data.data);
        }

        // Fetch projects
        const projectsRes = await api.get('/hod/projects');
        if (projectsRes.data.data) {
          setProjects(projectsRes.data.data);
        }

        // Fetch announcements
        const announcementsRes = await api.get('/hod/announcements');
        if (announcementsRes.data.data) {
          setAnnouncements(announcementsRes.data.data);
        }

        // Fetch evaluations
        const evaluationsRes = await api.get('/marks/all');
        if (evaluationsRes.data.data) {
          setEvaluations(evaluationsRes.data.data);
        }

        setLoading(false);
        setInitialLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        setSuccessMessage('Error loading data. Please refresh the page.');
        setLoading(false);
        setInitialLoading(false);
      }
    };

    if (user?.role === 'HOD') {
      fetchData();
    }
  }, [user]);

  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showAnnouncementModal, setShowAnnouncementModal] = useState(false);
  const [showCreateStaffModal, setShowCreateStaffModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [approvalRemarks, setApprovalRemarks] = useState('');

  const handleApproveFinal = (project) => {
    setSelectedProject(project);
    setShowApprovalModal(true);
  };

  const handleSubmitApproval = () => {
    if (selectedProject) {
      setProjects(projects.map(p =>
        p.id === selectedProject.id
          ? { ...p, status: 'Completed', approval: 'Approved' }
          : p
      ));
      setSuccessMessage(`Project "${selectedProject.title}" marked as completed!`);
      setShowApprovalModal(false);
      setApprovalRemarks('');
      setTimeout(() => setSuccessMessage(''), 3000);
    }
  };

  const handleRejectFinal = () => {
    if (selectedProject) {
      setProjects(projects.map(p =>
        p.id === selectedProject.id
          ? { ...p, status: 'Rejected', approval: 'Rejected' }
          : p
      ));
      setSuccessMessage(`Project "${selectedProject.title}" rejected.`);
      setShowApprovalModal(false);
      setApprovalRemarks('');
      setTimeout(() => setSuccessMessage(''), 3000);
    }
  };

  const handleAssignGuide = (project) => {
    setSelectedProject(project);
    setShowAssignModal(true);
  };

  const handleSubmitAssignment = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const guideId = formData.get('guide');

    if (selectedProject && guideId) {
      try {
        setLoading(true);
        const response = await api.post(`/hod/projects/${selectedProject._id || selectedProject.id}/assign-guide`, {
          guideId
        });

        if (response.data.status === 'success') {
          const updatedProject = response.data.data;
          setProjects(projects.map(p =>
            (p._id === updatedProject._id || p.id === updatedProject._id)
              ? updatedProject
              : p
          ));
          setSuccessMessage(`Guide assigned to project "${selectedProject.title}"!`);
          setShowAssignModal(false);
          setTimeout(() => setSuccessMessage(''), 3000);
        }
      } catch (error) {
        console.error('Error assigning guide:', error);
        setErrorMessage(error.response?.data?.message || 'Failed to assign guide');
        setTimeout(() => setErrorMessage(''), 3000);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleCreateAnnouncement = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    try {
      setErrorMessage('');
      const response = await api.post('/hod/announcements', {
        title: formData.get('title'),
        message: formData.get('message'),
        type: formData.get('type'),
        targetAudience: formData.get('targetAudience')
      });

      console.log('Announcement response:', response);

      if (response.data.status === 'success') {
        setSuccessMessage('Announcement posted successfully!');
        setShowAnnouncementModal(false);
        e.target.reset();
        // Refresh announcements
        const announcementsRes = await api.get('/hod/announcements');
        if (announcementsRes.data.data) {
          setAnnouncements(announcementsRes.data.data);
        }
        setTimeout(() => setSuccessMessage(''), 3000);
      }
    } catch (error) {
      console.error('Error creating announcement:', error);
      const errorMsg = error.response?.data?.message || error.message || 'Failed to create announcement';
      setErrorMessage(errorMsg);
      setTimeout(() => setErrorMessage(''), 5000);
    }
  };

  const handleCreateStaff = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    try {
      setErrorMessage('');
      setLoading(true);

      const staffData = {
        name: formData.get('name'),
        email: formData.get('email'),
        employeeId: formData.get('employeeId'),
        password: formData.get('password'),
        department: formData.get('department'),
        phone: formData.get('phone')
      };

      const response = await api.post('/hod/staff', staffData);

      if (response.data.status === 'success') {
        setSuccessMessage('Staff member created successfully!');
        setShowCreateStaffModal(false);
        e.target.reset();

        // Refresh staff list
        const staffRes = await api.get('/hod/staff');
        if (staffRes.data.data) {
          setStaff(staffRes.data.data);
        }
        setTimeout(() => setSuccessMessage(''), 3000);
      }
    } catch (error) {
      console.error('Error creating staff:', error);
      const errorMsg = error.response?.data?.message || error.message || 'Failed to create staff';
      setErrorMessage(errorMsg);
      setTimeout(() => setErrorMessage(''), 5000);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login/hod');
  };

  // Calculate Marks Analytics
  const marksDistribution = { '0-10': 0, '11-20': 0, '21-30': 0, '31-40': 0 };
  let totalMarksSum = 0;
  
  evaluations.forEach(ev => {
    const m = ev.totalMarks || 0;
    totalMarksSum += m;
    if (m <= 10) marksDistribution['0-10']++;
    else if (m <= 20) marksDistribution['11-20']++;
    else if (m <= 30) marksDistribution['21-30']++;
    else marksDistribution['31-40']++;
  });
  
  const averageMarks = evaluations.length > 0 ? (totalMarksSum / evaluations.length).toFixed(1) : 0;

  // Calculate Project Status Distribution
  const projectStatusCounts = {};
  projects.forEach(p => {
    const status = p.status || 'Pending';
    projectStatusCounts[status] = (projectStatusCounts[status] || 0) + 1;
  });

  const pieData = Object.entries(projectStatusCounts).map(([name, value]) => ({ name, value }));

  const downloadCSV = () => {
    const rows = [
      ['Category', 'Item', 'Value']
    ];

    // Project Status
    Object.entries(projectStatusCounts).forEach(([status, count]) => {
      rows.push(['Project Status', status, count]);
    });

    // Staff Workload
    staff.forEach(member => {
      const name = member.name.includes(',') ? `"${member.name}"` : member.name;
      rows.push(['Staff Workload', name, member.assignedProjects]);
    });

    // Marks Distribution
    Object.entries(marksDistribution).forEach(([range, count]) => {
      rows.push(['Marks Distribution', range, count]);
    });

    // Class Average
    rows.push(['Performance', 'Class Average', averageMarks]);

    const csvContent = "data:text/csv;charset=utf-8," + encodeURIComponent(rows.map(e => e.join(",")).join("\n"));
    const link = document.createElement("a");
    link.setAttribute("href", csvContent);
    link.setAttribute("download", "dashboard_analytics.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (initialLoading) {
    return (
      <div className="min-vh-100 d-flex justify-content-center align-items-center" style={{ background: '#f8f9fa' }}>
        <Spinner animation="border" variant="primary" />
      </div>
    );
  }

  return (
    <div className="min-vh-100" style={{ background: '#f8f9fa' }}>
      {/* Navbar */}
      <div className="bg-white shadow-sm py-3 sticky-top">
        <Container fluid className="px-4">
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h4 className="fw-bold mb-0" style={{ color: '#f093fb' }}>👨‍💼 HOD Dashboard</h4>
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
            variant={activeTab === 'projects' ? 'primary' : 'light'}
            onClick={() => setActiveTab('projects')}
            className="fw-semibold"
          >
            📋 All Projects
          </Button>
          <Button
            variant={activeTab === 'staff' ? 'primary' : 'light'}
            onClick={() => setActiveTab('staff')}
            className="fw-semibold"
          >
            👨‍🏫 Staff
          </Button>
          <Button
            variant={activeTab === 'students' ? 'primary' : 'light'}
            onClick={() => setActiveTab('students')}
            className="fw-semibold"
          >
            👨‍🎓 Students
          </Button>
          <Button
            variant={activeTab === 'announcements' ? 'primary' : 'light'}
            onClick={() => setActiveTab('announcements')}
            className="fw-semibold"
          >
            📢 Announcements
          </Button>
          <Button
            variant={activeTab === 'evaluations' ? 'primary' : 'light'}
            onClick={() => setActiveTab('evaluations')}
            className="fw-semibold"
          >
            📝 Evaluations
          </Button>
          <Button
            variant={activeTab === 'analytics' ? 'primary' : 'light'}
            onClick={() => setActiveTab('analytics')}
            className="fw-semibold"
          >
            📈 Analytics
          </Button>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <Row className="g-4">
            <Col lg={3} md={6}>
              <Card className="border-0 shadow-sm h-100">
                <Card.Body className="text-center p-4">
                  <h5 style={{ color: '#667eea' }} className="fw-bold">📚 Total Projects</h5>
                  <h2 className="fw-bold my-3">{stats.totalProjects}</h2>
                  <small className="text-muted">All registered projects</small>
                </Card.Body>
              </Card>
            </Col>

            <Col lg={3} md={6}>
              <Card className="border-0 shadow-sm h-100">
                <Card.Body className="text-center p-4">
                  <h5 style={{ color: '#4facfe' }} className="fw-bold">👨‍🎓 Students</h5>
                  <h2 className="fw-bold my-3">{stats.totalStudents}</h2>
                  <small className="text-muted">Registered students</small>
                </Card.Body>
              </Card>
            </Col>

            <Col lg={3} md={6}>
              <Card className="border-0 shadow-sm h-100">
                <Card.Body className="text-center p-4">
                  <h5 style={{ color: '#43e97b' }} className="fw-bold">👨‍🏫 Staff</h5>
                  <h2 className="fw-bold my-3">{stats.totalStaff}</h2>
                  <small className="text-muted">Teaching staff</small>
                </Card.Body>
              </Card>
            </Col>

            <Col lg={3} md={6}>
              <Card className="border-0 shadow-sm h-100">
                <Card.Body className="text-center p-4">
                  <h5 style={{ color: '#ffa502' }} className="fw-bold">⏳ Pending</h5>
                  <h2 className="fw-bold my-3">{stats.pendingApprovals}</h2>
                  <small className="text-muted">Awaiting approval</small>
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
                        <th>Guide</th>
                        <th>Status</th>
                        <th>Approval</th>
                        <th>Date</th>
                        {/* <th>Actions</th> */}
                      </tr>
                    </thead>
                    <tbody>
                      {projects.length === 0 ? (
                        <tr>
                          <td colSpan="6" className="text-center text-muted py-4">
                            No recent projects
                          </td>
                        </tr>
                      ) : (
                        projects.map(project => (
                          <tr key={project._id}>
                            <td className="fw-semibold">{project.title}</td>
                            <td>{project.studentId?.name || 'N/A'}</td>
                            <td>{project.assignedGuideId?.name || 'Unassigned'}</td>
                            <td><Badge bg="info">{project.status}</Badge></td>
                            <td>
                              <Badge
                                bg={project.approvalStatus === 'Approved' ? 'success' : project.approvalStatus === 'Rejected' ? 'danger' : 'warning'}
                              >
                                {project.approvalStatus}
                              </Badge>
                            </td>
                            <td>{project.submissionDate ? new Date(project.submissionDate).toLocaleDateString() : (project.submittedAt ? new Date(project.submittedAt).toLocaleDateนString() : (project.createdAt ? new Date(project.createdAt).toLocaleDateString() : '—'))}</td>
                            {/* <td>
                              {!project.assignedGuideId && (
                                <Button
                                  variant="outline-primary"
                                  size="sm"
                                  onClick={() => handleAssignGuide(project)}
                                >
                                  Assign Guide
                                </Button>
                              )}
                            </td> */}
                          </tr>
                        ))
                      )}
                    </tbody>
                  </Table>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        )}

        {/* All Projects Tab */}
        {activeTab === 'projects' && (
          <Row className="g-4">
            <Col lg={12}>
              <Card className="border-0 shadow-sm">
                <Card.Body className="p-4">
                  <div className="d-flex justify-content-between align-items-center mb-4">
                    <h5 className="fw-bold mb-0">📋 All Projects</h5>
                  </div>
                  <div className="d-flex flex-column gap-3">
                    {projects.length === 0 ? (
                      <div className="text-center text-muted py-4">No projects found</div>
                    ) : (
                      projects.map(project => (
                        <div key={project._id} className="p-3 border rounded-3">
                          <div className="d-flex justify-content-between align-items-start mb-2">
                            <div className="flex-grow-1">
                              <h6 className="fw-bold mb-1">{project.title}</h6>
                              <div className="d-flex gap-3">
                                <small className="text-muted">Student: <strong>{project.studentId?.name || 'N/A'}</strong></small>
                                <small className="text-muted">Guide: <strong>{project.assignedGuideId?.name || 'Unassigned'}</strong></small>
                                <small className="text-muted">Submitted: <strong>{project.submissionDate ? new Date(project.submissionDate).toLocaleDateString() : (project.submittedAt ? new Date(project.submittedAt).toLocaleDateString() : (project.createdAt ? new Date(project.createdAt).toLocaleDateString() : '—'))}</strong></small>
                              </div>
                            </div>
                            <div className="d-flex gap-2">
                              <Badge bg={project.status === 'Completed' ? 'success' : 'info'}>
                                {project.status}
                              </Badge>
                              <Badge bg={project.approvalStatus === 'Approved' ? 'success' : project.approvalStatus === 'Rejected' ? 'danger' : 'warning'}>
                                {project.approvalStatus}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        )}

        {/* Staff Tab */}
        {activeTab === 'staff' && (
          <Row className="g-4">
            <Col lg={12}>
              <Card className="border-0 shadow-sm">
                <Card.Body className="p-4">
                  <div className="d-flex justify-content-between align-items-center mb-4">
                    <h5 className="fw-bold mb-0">👨‍🏫 Staff Members ({staff.length})</h5>
                    <Button
                      variant="primary"
                      onClick={() => setShowCreateStaffModal(true)}
                    >
                      + Create Staff
                    </Button>
                  </div>
                  {loading ? (
                    <div className="text-center text-muted">Loading...</div>
                  ) : staff.length === 0 ? (
                    <div className="text-center text-muted">No staff members found</div>
                  ) : (
                    <Table hover responsive>
                      <thead>
                        <tr>
                          <th>Name</th>
                          <th>Employee ID</th>
                          <th>Email</th>
                          <th>Department</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {staff.map(member => (
                          <tr key={member._id}>
                            <td className="fw-semibold">{member.name}</td>
                            <td>{member.employeeId}</td>
                            <td>{member.email}</td>
                            <td>{member.department || 'N/A'}</td>
                            <td><Badge bg={member.isActive ? 'success' : 'danger'}>{member.isActive ? 'Active' : 'Inactive'}</Badge></td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  )}
                </Card.Body>
              </Card>
            </Col>
          </Row>
        )}

        {/* Students Tab */}
        {activeTab === 'students' && (
          <Row className="g-4">
            <Col lg={12}>
              <Card className="border-0 shadow-sm">
                <Card.Body className="p-4">
                  <h5 className="fw-bold mb-4">👨‍🎓 Students ({students.length})</h5>
                  {loading ? (
                    <div className="text-center text-muted">Loading...</div>
                  ) : students.length === 0 ? (
                    <div className="text-center text-muted">No students found</div>
                  ) : (
                    <Table hover responsive>
                      <thead>
                        <tr>
                          <th>Name</th>
                          <th>Student ID</th>
                          <th>Email</th>
                          <th>Department</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {students.map(student => (
                          <tr key={student._id}>
                            <td className="fw-semibold">{student.name}</td>
                            <td>{student.studentId}</td>
                            <td>{student.email}</td>
                            <td>{student.department || 'N/A'}</td>
                            <td>
                              <Badge bg={student.isActive ? 'success' : 'warning'}>
                                {student.isActive ? 'Active' : 'Inactive'}
                              </Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
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
                  <div className="d-flex justify-content-between align-items-center mb-4">
                    <h5 className="fw-bold mb-0">📢 Announcements</h5>
                    <Button
                      variant="primary"
                      onClick={() => setShowAnnouncementModal(true)}
                    >
                      + New Announcement
                    </Button>
                  </div>
                  <div className="d-flex flex-column gap-3">
                    {announcements.map(announcement => (
                      <div key={announcement.id} className="p-3 border rounded-3">
                        <div className="d-flex justify-content-between align-items-start">
                          <div>
                            <h6 className="fw-bold mb-1">{announcement.title}</h6>
                            <p className="text-muted mb-2">{announcement.message}</p>
                            <small className="text-muted">Posted on {announcement.date}</small>
                          </div>
                          <Badge
                            bg={announcement.type === 'Deadline' ? 'danger' : 'info'}
                          >
                            {announcement.type}
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

        {/* Evaluations Tab */}
        {activeTab === 'evaluations' && (
          <Row className="g-4">
            <Col lg={12}>
              <Card className="border-0 shadow-sm">
                <Card.Body className="p-4">
                  <h5 className="fw-bold mb-4">📝 Student Evaluations</h5>
                  <Table hover responsive>
                    <thead>
                      <tr>
                        <th>Student</th>
                        <th>Project</th>
                        <th>Evaluator</th>
                        <th>Total Marks</th>
                        <th>Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {evaluations.map(ev => {
                        const evalId = ev.evaluatorId?._id || ev.evaluatorId || ev.staffId?._id || ev.staffId;
                        const evaluatorName = ev.evaluatorId?.name || ev.staffId?.name || staff.find(s => s._id === evalId || s.id === evalId)?.name || 'N/A';
                        
                        return (
                          <tr key={ev._id}>
                            <td className="fw-semibold">{ev.studentId?.name}</td>
                            <td>{ev.projectId?.title}</td>
                            <td>{evaluatorName}</td>
                            <td><Badge bg="primary">{ev.totalMarks} / 40</Badge></td>
                            <td>{new Date(ev.evaluatedAt).toLocaleDateString()}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </Table>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <Row className="g-4">
            <Col lg={12} className="d-flex justify-content-end">
              <Button variant="success" onClick={downloadCSV}>
                📥 Export Analytics
              </Button>
            </Col>
            <Col lg={6}>
              <Card className="border-0 shadow-sm">
                <Card.Body className="p-4">
                  <h5 className="fw-bold mb-4">📊 Project Status Distribution</h5>
                  <div style={{ height: 300 }}>
                    {pieData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={pieData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                          >
                            {pieData.map((entry, index) => {
                              let color = '#0dcaf0'; // info default
                              if (entry.name === 'Completed') color = '#198754';
                              else if (entry.name === 'Pending') color = '#ffc107';
                              else if (entry.name === 'Rejected') color = '#dc3545';
                              return <Cell key={`cell-${index}`} fill={color} />;
                            })}
                          </Pie>
                          <Tooltip />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-100 d-flex align-items-center justify-content-center text-muted">No projects found</div>
                    )}
                  </div>
                </Card.Body>
              </Card>
            </Col>

            <Col lg={6}>
              <Card className="border-0 shadow-sm">
                <Card.Body className="p-4">
                  <h5 className="fw-bold mb-4">👨‍🏫 Staff Workload</h5>
                  <div className="d-flex flex-column gap-3">
                    {staff.map(member => (
                      <div key={member.id} className="d-flex justify-content-between p-3 bg-light rounded-3">
                        <span className="fw-semibold">{member.name}</span>
                        <Badge bg="primary">{member.assignedProjects} Projects</Badge>
                      </div>
                    ))}
                  </div>
                </Card.Body>
              </Card>
            </Col>

            <Col lg={12}>
              <Card className="border-0 shadow-sm">
                <Card.Body className="p-4">
                  <h5 className="fw-bold mb-4">📈 Marks Distribution (Class Avg: {averageMarks} / 40)</h5>
                  <div className="d-flex flex-column gap-3">
                    {Object.entries(marksDistribution).map(([range, count]) => {
                      const percentage = evaluations.length ? (count / evaluations.length) * 100 : 0;
                      let variant = 'info';
                      if (range === '0-10') variant = 'danger';
                      else if (range === '11-20') variant = 'warning';
                      else if (range === '21-30') variant = 'primary';
                      else if (range === '31-40') variant = 'success';

                      return (
                        <div key={range}>
                          <div className="d-flex justify-content-between mb-1">
                            <span className="fw-semibold">{range} Marks</span>
                            <span>{count} Students ({Math.round(percentage)}%)</span>
                          </div>
                          <ProgressBar now={percentage} variant={variant} style={{ height: '10px' }} />
                        </div>
                      );
                    })}
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        )}
      </Container>

      {/* Modals */}

      {/* Final Approval Modal */}
      <Modal show={showApprovalModal} onHide={() => setShowApprovalModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Final Project Approval</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <h6 className="mb-3">{selectedProject?.title}</h6>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Remarks (Optional)</Form.Label>
              <Form.Control
                as="textarea"
                rows={4}
                value={approvalRemarks}
                onChange={(e) => setApprovalRemarks(e.target.value)}
                placeholder="Add your final comments"
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowApprovalModal(false)}>
            Cancel
          </Button>
          <Button variant="success" onClick={handleSubmitApproval}>
            ✅ Approve & Complete
          </Button>
          <Button variant="danger" onClick={handleRejectFinal}>
            ❌ Reject
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Assign Guide Modal */}
      <Modal show={showAssignModal} onHide={() => setShowAssignModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Assign Guide</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <h6 className="mb-3">{selectedProject?.title}</h6>
          <Form onSubmit={handleSubmitAssignment}>
            <Form.Group className="mb-3">
              <Form.Label>Select Guide</Form.Label>
              <Form.Select name="guide" required>
                <option value="">Choose a guide</option>
                {staff.map(member => (
                  <option key={member._id || member.id} value={member._id || member.id}>
                    {member.name} ({member.assignedProjects} projects)
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
            <div className="d-flex gap-2 justify-content-end">
              <Button variant="secondary" onClick={() => setShowAssignModal(false)}>
                Cancel
              </Button>
              <Button variant="primary" type="submit">
                Assign Guide
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>

      {/* Create Staff Modal */}
      <Modal show={showCreateStaffModal} onHide={() => setShowCreateStaffModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Create New Staff Member</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleCreateStaff}>
            <Form.Group className="mb-3">
              <Form.Label>Full Name</Form.Label>
              <Form.Control name="name" required placeholder="e.g. Dr. John Doe" />
            </Form.Group>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Employee ID</Form.Label>
                  <Form.Control name="employeeId" required placeholder="e.g. EMP001" />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Department</Form.Label>
                  <Form.Control name="department" placeholder="e.g. Computer Science" />
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>Email Address</Form.Label>
              <Form.Control type="email" name="email" required placeholder="john@example.com" />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Phone Number</Form.Label>
              <Form.Control name="phone" placeholder="+91 9876543210" />
            </Form.Group>

            <Form.Group className="mb-4">
              <Form.Label>Password</Form.Label>
              <Form.Control type="password" name="password" required minLength={6} placeholder="Min. 6 characters" />
            </Form.Group>

            <div className="d-flex gap-2 justify-content-end">
              <Button variant="secondary" onClick={() => setShowCreateStaffModal(false)}>
                Cancel
              </Button>
              <Button variant="primary" type="submit" disabled={loading}>
                {loading ? 'Creating...' : 'Create Staff'}
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>

      {/* Announcement Modal */}
      <Modal show={showAnnouncementModal} onHide={() => setShowAnnouncementModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Create Announcement</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleCreateAnnouncement}>
            <Form.Group className="mb-3">
              <Form.Label>Title</Form.Label>
              <Form.Control name="title" placeholder="Announcement title" required />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Message</Form.Label>
              <Form.Control
                as="textarea"
                rows={4}
                name="message"
                placeholder="Announcement message"
                required
              />
            </Form.Group>
            <Form.Group className="mb-4">
              <Form.Label>Type</Form.Label>
              <Form.Select name="type">
                <option value="General">General</option>
                <option value="Deadline">Deadline</option>
                <option value="Important">Important</option>
                <option value="Event">Event</option>
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-4">
              <Form.Label>Target Audience</Form.Label>
              <Form.Select name="targetAudience" required>
                <option value="All">All (Students & Staff)</option>
                <option value="Students">Students Only</option>
                <option value="Staff">Staff Only</option>
              </Form.Select>
            </Form.Group>
            <div className="d-flex gap-2 justify-content-end">
              <Button variant="secondary" onClick={() => setShowAnnouncementModal(false)}>
                Cancel
              </Button>
              <Button variant="primary" type="submit">
                Post Announcement
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default HODDashboard;
