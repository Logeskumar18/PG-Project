import { useState, useEffect } from 'react';
import ConfirmLogoutModal from '../components/ConfirmLogoutModal';
import { DEPARTMENTS } from '../constants/departments';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Container, Row, Col, Card, Button, Form, Alert, Modal, Badge, Table, ProgressBar, Spinner } from 'react-bootstrap';
import api from '../services/api';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import ActivityLog from '../components/ActivityLog.jsx';

const HODDashboard = () => {
    // Validation helpers
    const validateName = (name) => {
      return /^[A-Za-z ]{3,}$/.test(name.trim());
    };
    const validateEmployeeId = (id) => {
      return /^EMP\d{3}$/.test(id.trim());
    };
    const validateEmail = (email) => {
      return /^[\w.-]+@[\w.-]+\.[A-Za-z]{2,}$/.test(email.trim());
    };
    const validatePhone = (phone) => {
      return /^\d{10}$/.test(phone.trim());
    };
    const validatePassword = (pw) => {
      return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/.test(pw);
    };
    // Uniqueness check helpers
    const isUniqueEmployeeId = (id) => !staff.some(s => s.employeeId === id.trim());
    const isUniqueEmail = (email) => !staff.some(s => s.email.toLowerCase() === email.trim().toLowerCase());
    // Form state
    const [staffForm, setStaffForm] = useState({
      name: '',
      employeeId: '',
      department: '',
      email: '',
      phone: '',
      password: ''
    });
    const [staffErrors, setStaffErrors] = useState({});
  const { user, logout } = useAuth();
const { theme, toggleTheme, getColor } = useTheme();
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
  const [deadlines, setDeadlines] = useState([]);

  // Message States
  const [messages, setMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  
  // Compose Modal State
  const [showComposeModal, setShowComposeModal] = useState(false);
  const [messageReceiver, setMessageReceiver] = useState('');
  const [messageSubject, setMessageSubject] = useState('');
  const [messageContent, setMessageContent] = useState('');
  const [composeLoading, setComposeLoading] = useState(false);

  // Reply Modal State
  const [showReplyModal, setShowReplyModal] = useState(false);
  const [replyToMessage, setReplyToMessage] = useState(null);
  const [replySubject, setReplySubject] = useState('');
  const [replyContent, setReplyContent] = useState('');
  const [replyLoading, setReplyLoading] = useState(false);

  // Search filter state and logic for All Projects
  const [searchProject, setSearchProject] = useState('');
  const filteredProjects = projects.filter(project => {
    const search = searchProject.toLowerCase();
    return (
      project.title?.toLowerCase().includes(search) ||
      project.studentId?.name?.toLowerCase().includes(search) ||
      project.assignedGuideId?.name?.toLowerCase().includes(search)
    );
  });

  const fetchMessages = async () => {
    try {
      setLoadingMessages(true);
      const response = await api.get('/communication/messages/inbox');
      if (response.data.data) {
        setMessages(response.data.data);
      } else {
        setMessages([]);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoadingMessages(false);
    }
  };

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

        // Fetch deadlines
        const deadlinesRes = await api.get('/deadlines');
        if (deadlinesRes.data.data) {
          setDeadlines(deadlinesRes.data.data);
        }
        
        // Fetch messages
        await fetchMessages();

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
  const [showDeadlineModal, setShowDeadlineModal] = useState(false);
  const [deadlineForm, setDeadlineForm] = useState({
    title: 'Proposal Deadline',
    customTitle: '',
    date: '',
    description: ''
  });
  const [editingDeadline, setEditingDeadline] = useState(null);
  const [showAnnouncementModal, setShowAnnouncementModal] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState(null);
  const [showCreateStaffModal, setShowCreateStaffModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [approvalRemarks, setApprovalRemarks] = useState('');

  const [showProfileModal, setShowProfileModal] = useState(false);
  const [selectedProfileUser, setSelectedProfileUser] = useState(null);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteInfo, setDeleteInfo] = useState({ id: null, type: '' });

  const handleViewProfile = (user, type) => {
    setSelectedProfileUser({ ...user, profileType: type });
    setShowProfileModal(true);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!messageReceiver || !messageSubject.trim() || !messageContent.trim()) return;

    try {
      setComposeLoading(true);
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
      setErrorMessage('Error sending message: ' + (error.response?.data?.message || error.message));
      setTimeout(() => setErrorMessage(''), 5000);
    } finally {
      setComposeLoading(false);
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
      setTimeout(() => setErrorMessage(''), 5000);
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

  const handleDeleteStaff = (id) => {
    setDeleteInfo({ id, type: 'staff' });
    setShowDeleteModal(true);
  };

  const handleDeleteStudent = (id) => {
    setDeleteInfo({ id, type: 'student' });
    setShowDeleteModal(true);
  };

  const handleDeleteAnnouncement = (id) => {
    setDeleteInfo({ id, type: 'announcement' });
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    const { id, type } = deleteInfo;
    setShowDeleteModal(false);
    if (!id) return;

    try {
      setLoading(true);
      if (type === 'staff') {
        const response = await api.delete(`/hod/staff/${id}`);
        if (response.data.status === 'success' || response.data.success) {
          setStaff(staff.filter(s => s._id !== id));
          setSuccessMessage('Staff member deleted successfully!');
        }
      } else if (type === 'student') {
        const response = await api.delete(`/hod/students/${id}`);
        if (response.data.status === 'success' || response.data.success) {
          setStudents(students.filter(s => s._id !== id));
          setSuccessMessage('Student deleted successfully!');
        }
      } else if (type === 'deadline') {
        const response = await api.delete(`/deadlines/${id}`);
        if (response.data.success || response.data.status === 'success') {
          setDeadlines(deadlines.filter(d => d._id !== id));
          setSuccessMessage('Deadline deleted successfully!');
        }
      } else if (type === 'announcement') {
        const response = await api.delete(`/hod/announcements/${id}`);
        if (response.data.status === 'success' || response.data.success) {
          setAnnouncements(announcements.filter(a => a._id !== id && a.id !== id));
          setSuccessMessage('Announcement deleted successfully!');
        }
      }
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error(`Error deleting ${type}:`, error);
      setErrorMessage(error.response?.data?.message || `Failed to delete ${type === 'staff' ? 'staff member' : type}`);
      setTimeout(() => setErrorMessage(''), 3000);
    } finally {
      setLoading(false);
      setDeleteInfo({ id: null, type: '' });
    }
  };

  const handleSubmitDeadline = async (e) => {
    e.preventDefault();
    try {
      let response;
      if (editingDeadline) {
        response = await api.put(`/deadlines/${editingDeadline._id}`, deadlineForm);
      } else {
        response = await api.post('/deadlines', deadlineForm);
      }
      
      if (response.data.success || response.data.status === 'success') {
        setSuccessMessage(`Deadline ${editingDeadline ? 'updated' : 'created'} successfully!`);
        setShowDeadlineModal(false);
        setEditingDeadline(null);
        
        // Refresh deadlines
        const deadlinesRes = await api.get('/deadlines');
        if (deadlinesRes.data?.data) {
          setDeadlines(deadlinesRes.data.data);
        }
        
        setDeadlineForm({ title: 'Proposal Deadline', customTitle: '', date: '', description: '' });
        setTimeout(() => setSuccessMessage(''), 3000);
      }
    } catch (error) {
      setErrorMessage(error.response?.data?.message || `Error ${editingDeadline ? 'updating' : 'creating'} deadline`);
      setTimeout(() => setErrorMessage(''), 3000);
    }
  };

  const handleDeleteDeadline = (id) => {
    setDeleteInfo({ id, type: 'deadline' });
    setShowDeleteModal(true);
  };

  const handleSubmitAnnouncement = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    try {
      setErrorMessage('');
      const payload = {
        title: formData.get('title'),
        message: formData.get('message'),
        type: formData.get('type'),
        targetAudience: formData.get('targetAudience')
      };

      let response;
      if (editingAnnouncement) {
        response = await api.put(`/hod/announcements/${editingAnnouncement._id || editingAnnouncement.id}`, payload);
      } else {
        response = await api.post('/hod/announcements', payload);
      }

      console.log('Announcement response:', response);

      if (response.data.status === 'success') {
        setSuccessMessage(`Announcement ${editingAnnouncement ? 'updated' : 'posted'} successfully!`);
        setShowAnnouncementModal(false);
        setEditingAnnouncement(null);
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
      const errorMsg = error.response?.data?.message || error.message || `Failed to ${editingAnnouncement ? 'update' : 'create'} announcement`;
      setErrorMessage(errorMsg);
      setTimeout(() => setErrorMessage(''), 5000);
    }
  };

  const handleCreateStaff = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setStaffErrors({});
    const { name, employeeId, department, email, phone, password } = staffForm;
    const errors = {};
    if (!validateName(name)) errors.name = 'Full Name must be at least 3 letters, only letters and spaces.';
    if (!employeeId || !validateEmployeeId(employeeId)) errors.employeeId = 'Employee ID must be in format EMP001.';
    else if (!isUniqueEmployeeId(employeeId)) errors.employeeId = 'Employee ID already exists.';
    if (!department || !DEPARTMENTS.includes(department)) errors.department = 'Select a valid department.';
    if (!email || !validateEmail(email)) errors.email = 'Enter a valid email address.';
    else if (!isUniqueEmail(email)) errors.email = 'Email already exists.';
    if (!phone || !validatePhone(phone)) errors.phone = 'Phone must be 10 digits.';
    if (!password || !validatePassword(password)) errors.password = 'Password must be 8+ chars, include upper, lower, number, special.';
    if (Object.keys(errors).length > 0) {
      setStaffErrors(errors);
      return;
    }
    setLoading(true);
    try {
      const staffData = {
        name: name.trim(),
        employeeId: employeeId.trim(),
        department,
        email: email.trim(),
        phone: phone.trim(),
        password
      };
      const response = await api.post('/hod/staff', staffData);
      if (response.data.status === 'success') {
        setSuccessMessage('Staff member created successfully!');
        setShowCreateStaffModal(false);
        setStaffForm({ name: '', employeeId: '', department: '', email: '', phone: '', password: '' });
        // Refresh staff list
        const staffRes = await api.get('/hod/staff');
        if (staffRes.data.data) setStaff(staffRes.data.data);
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

  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const handleLogoutClick = () => {
    setShowLogoutModal(true);
  };
  const handleConfirmLogout = () => {
    setShowLogoutModal(false);
    logout();
    navigate('/login/hod');
  };
  const handleCancelLogout = () => {
    setShowLogoutModal(false);
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
      <div className="min-vh-100 d-flex justify-content-center align-items-center" style={{ backgroundColor: getColor('bgPrimary') }}>
        <Spinner animation="border" variant="primary" />
      </div>
    );
  }

  return (
    <div className={`min-vh-100 ${theme === 'dark' ? 'bg-dark text-light' : 'bg-light text-dark'}`} style={{ backgroundColor: getColor('bgPrimary') }}>
      {/* Navbar */}
      <div className={`shadow-sm py-3 sticky-top ${theme === 'dark' ? 'bg-dark border-bottom border-secondary' : 'bg-white'}`}>
        <Container fluid className="px-4">
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h4 className="fw-bold mb-0" style={{ color: '#f093fb' }}>👨‍💼 HOD Dashboard</h4>
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
            variant={activeTab === 'deadlines' ? 'primary' : 'light'}
            onClick={() => setActiveTab('deadlines')}
            className="fw-semibold"
          >
            ⏰ Deadlines
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
          <Button
            variant={activeTab === 'activity' ? 'primary' : 'light'}
            onClick={() => setActiveTab('activity')}
            className="fw-semibold"
          >
            🕒 Activity Log
          </Button>
          <Button
            variant={activeTab === 'messages' ? 'primary' : 'light'}
            onClick={() => setActiveTab('messages')}
            className="fw-semibold"
          >
            💬 Messages
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
                            <td>{project.submissionDate ? new Date(project.submissionDate).toLocaleDateString() : (project.submittedAt ? new Date(project.submittedAt).toLocaleDateString() : (project.createdAt ? new Date(project.createdAt).toLocaleDateString() : '—'))}</td>

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
                  {/* Search Filter */}
                  <div className="mb-3">
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Search projects by title, student, or guide..."
                      value={searchProject || ''}
                      onChange={e => setSearchProject(e.target.value)}
                      style={{ maxWidth: 400 }}
                    />
                  </div>
                  <div className="d-flex flex-column gap-3">
                    {filteredProjects.length === 0 ? (
                      <div className="text-center text-muted py-4">No projects found</div>
                    ) : (
                      filteredProjects.map(project => (
                        <div key={project._id} className="p-3 border rounded-3">
                          <div className="d-flex justify-content-between align-items-start mb-2">
                            <div className="flex-grow-1">
                              <h6 className="fw-bold mb-1">{project.title}</h6>
                              <div className="mb-2 text-secondary" style={{ fontSize: '0.95em' }}>
                                <b>Description:</b> {project.description || 'No description provided.'}
                              </div>
                              <div className="d-flex gap-3">
                                <small className="text-muted">Student: <strong>{project.studentId?.name || 'N/A'}</strong></small>
                                <small className="text-muted">Guide: <strong>{project.assignedGuideId?.name || 'Unassigned'}</strong></small>
                                <small className="text-muted">Submitted: <strong>{project.submissionDate ? new Date(project.submissionDate).toLocaleDateString() : (project.submittedAt ? new Date(project.submittedAt).toLocaleDateString() : (project.createdAt ? new Date(project.createdAt).toLocaleDateString() : '—'))}</strong></small>
                              </div>
                            </div>
                            <div className="d-flex gap-2">
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
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {staff.map(member => (
                          <tr key={member._id}>
                            <td className="fw-semibold">{member.name}</td>
                            <td>{member.employeeId}</td>
                            <td>{member.email}</td>
                            <td>{member.department || 'N/A'}</td>
                            <td className="d-flex gap-2">
                              <Button variant="outline-info" size="sm" onClick={() => handleViewProfile(member, 'staff')}>
                                View Profile
                              </Button>
                              <Button variant="outline-danger" size="sm" onClick={() => handleDeleteStaff(member._id)}>
                                Delete
                              </Button>
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
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {students.map(student => (
                          <tr key={student._id}>
                            <td className="fw-semibold">{student.name}</td>
                            <td>{student.studentId}</td>
                            <td>{student.email}</td>
                            <td>{student.department || 'N/A'}</td>
                            <td className="d-flex gap-2">
                              <Button variant="outline-info" size="sm" onClick={() => handleViewProfile(student, 'student')}>
                                View Profile
                              </Button>
                              <Button variant="outline-danger" size="sm" onClick={() => handleDeleteStudent(student._id)}>
                                Delete
                              </Button>
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
                      onClick={() => { setEditingAnnouncement(null); setShowAnnouncementModal(true); }}
                    >
                      + New Announcement
                    </Button>
                  </div>
                  <div className="d-flex flex-column gap-3">
                    {announcements.map(announcement => (
                      <div key={announcement._id || announcement.id} className="p-3 border rounded-3 bg-white shadow-sm">
                        <div className="d-flex justify-content-between align-items-start">
                          <div>
                            <h6 className="fw-bold mb-1">{announcement.title}</h6>
                            <p className="text-muted mb-2">{announcement.message}</p>
                            <small className="text-muted">Posted on {announcement.date || new Date(announcement.createdAt).toLocaleDateString()}</small>
                          </div>
                          <div className="d-flex align-items-center gap-3">
                            <Badge
                              bg={announcement.type === 'Deadline' ? 'danger' : 'info'}
                            >
                              {announcement.type}
                            </Badge>
                            <Button variant="outline-primary" size="sm" onClick={() => { setEditingAnnouncement(announcement); setShowAnnouncementModal(true); }}>
                              ✏️
                            </Button>
                            <Button variant="outline-danger" size="sm" onClick={() => handleDeleteAnnouncement(announcement._id || announcement.id)}>
                              🗑️
                            </Button>
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

        {/* Deadlines Tab */}
        {activeTab === 'deadlines' && (
          <Row className="g-4">
            <Col lg={12}>
              <Card className="border-0 shadow-sm">
                <Card.Body className="p-4">
                  <div className="d-flex justify-content-between align-items-center mb-4">
                    <h5 className="fw-bold mb-0">⏰ Project Deadlines & Milestones</h5>
                    <Button variant="primary" onClick={() => {
                      setEditingDeadline(null);
                      setDeadlineForm({ title: 'Proposal Deadline', customTitle: '', date: '', description: '' });
                      setShowDeadlineModal(true);
                    }}>
                      + Set New Deadline
                    </Button>
                  </div>
                  {deadlines.length === 0 ? (
                    <div className="text-center text-muted py-4">No deadlines configured</div>
                  ) : (
                    <div className="d-flex flex-column gap-3">
                      {deadlines.map(deadline => (
                        <div key={deadline._id} className="p-3 border rounded-3 d-flex justify-content-between align-items-center border-start border-4 border-warning bg-white shadow-sm">
                          <div>
                            <h6 className="fw-bold mb-1">{deadline.title === 'Other' ? deadline.customTitle : deadline.title}</h6>
                            <p className="text-muted mb-0 small">{deadline.description}</p>
                          </div>
                          <div className="text-end d-flex align-items-center gap-3">
                            <div>
                              <div className="fw-bold text-danger fs-5">{new Date(deadline.date).toLocaleDateString()}</div>
                              <small className="text-muted">
                                {Math.ceil((new Date(deadline.date) - new Date()) / (1000 * 60 * 60 * 24))} days left
                              </small>
                            </div>
                            <div className="d-flex gap-2">
                              <Button variant="outline-primary" size="sm" onClick={() => {
                                setEditingDeadline(deadline);
                                const dateObj = new Date(deadline.date);
                                const formattedDate = !isNaN(dateObj.getTime()) ? dateObj.toISOString().split('T')[0] : '';
                                setDeadlineForm({
                                  title: deadline.title,
                                  customTitle: deadline.customTitle || '',
                                  date: formattedDate,
                                  description: deadline.description || ''
                                });
                                setShowDeadlineModal(true);
                              }}>
                                ✏️
                              </Button>
                              <Button variant="outline-danger" size="sm" onClick={() => handleDeleteDeadline(deadline._id)}>
                                🗑️
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

        {/* Activity Log Tab */}
        {activeTab === 'activity' && (
          <Row className="g-4">
            <Col lg={12}>
              <ActivityLog />
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
                    <div className="d-flex flex-column">
                      {messages.map(message => (
                        <div 
                          key={message._id} 
                          className={`p-4 border rounded-4 mb-3 transition-all ${!message.isRead ? 'bg-white border-primary shadow-sm' : 'bg-light border-0 shadow-sm'}`}
                          style={{ transition: 'all 0.3s ease' }}
                        >
                          <div className="d-flex justify-content-between align-items-start gap-3">
                            <div className="d-flex align-items-center justify-content-center rounded-circle text-white flex-shrink-0 shadow-sm" style={{ width: '48px', height: '48px', fontSize: '1.2rem', fontWeight: 'bold', background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}>
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
                                style={!message.isRead ? { background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', border: 'none' } : {}}
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

      {/* Deadline Modal */}
      <Modal show={showDeadlineModal} onHide={() => { setShowDeadlineModal(false); setEditingDeadline(null); }} centered>
        <Modal.Header closeButton>
          <Modal.Title>{editingDeadline ? 'Edit Deadline' : 'Set New Deadline'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleSubmitDeadline}>
            <Form.Group className="mb-3">
              <Form.Label>Deadline Type</Form.Label>
              <Form.Select 
                value={deadlineForm.title} 
                onChange={(e) => setDeadlineForm({...deadlineForm, title: e.target.value})}
                required
              >
                <option value="Proposal Deadline">Proposal Deadline</option>
                <option value="Progress Review 1">Progress Review 1</option>
                <option value="Progress Review 2">Progress Review 2</option>
                <option value="Final Submission">Final Submission</option>
                <option value="Other">Other (Specify)</option>
              </Form.Select>
            </Form.Group>
            {deadlineForm.title === 'Other' && (
              <Form.Group className="mb-3">
                <Form.Label>Custom Title</Form.Label>
                <Form.Control type="text" placeholder="Enter title" value={deadlineForm.customTitle} onChange={(e) => setDeadlineForm({...deadlineForm, customTitle: e.target.value})} required />
              </Form.Group>
            )}
            <Form.Group className="mb-3">
              <Form.Label>Date</Form.Label>
              <Form.Control type="date" value={deadlineForm.date} onChange={(e) => setDeadlineForm({...deadlineForm, date: e.target.value})} required />
            </Form.Group>
            <Form.Group className="mb-4">
              <Form.Label>Description (Optional)</Form.Label>
              <Form.Control as="textarea" rows={3} placeholder="Add instructions or details" value={deadlineForm.description} onChange={(e) => setDeadlineForm({...deadlineForm, description: e.target.value})} />
            </Form.Group>
            <div className="d-flex justify-content-end gap-2">
              <Button variant="secondary" onClick={() => { setShowDeadlineModal(false); setEditingDeadline(null); }}>
                Cancel
              </Button>
              <Button variant="primary" type="submit">
                {editingDeadline ? 'Save Changes' : 'Set Deadline'}
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
              <Form.Control
                name="name"
                value={staffForm.name}
                onChange={e => setStaffForm(f => ({ ...f, name: e.target.value }))}
                required
                placeholder="e.g. Dr. John Doe"
                isInvalid={!!staffErrors.name}
              />
              <Form.Control.Feedback type="invalid">{staffErrors.name}</Form.Control.Feedback>
            </Form.Group>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Employee ID</Form.Label>
                  <Form.Control
                    name="employeeId"
                    value={staffForm.employeeId}
                    onChange={e => setStaffForm(f => ({ ...f, employeeId: e.target.value }))}
                    required
                    placeholder="e.g. EMP001"
                    isInvalid={!!staffErrors.employeeId}
                  />
                  <Form.Control.Feedback type="invalid">{staffErrors.employeeId}</Form.Control.Feedback>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Department</Form.Label>
                  <Form.Select
                    name="department"
                    value={staffForm.department}
                    onChange={e => setStaffForm(f => ({ ...f, department: e.target.value }))}
                    required
                    isInvalid={!!staffErrors.department}
                  >
                    <option value="">Select Department</option>
                    {DEPARTMENTS.map(dep => (
                      <option key={dep} value={dep}>{dep}</option>
                    ))}
                  </Form.Select>
                  <Form.Control.Feedback type="invalid">{staffErrors.department}</Form.Control.Feedback>
                </Form.Group>
              </Col>
            </Row>
            <Form.Group className="mb-3">
              <Form.Label>Email Address</Form.Label>
              <Form.Control
                type="email"
                name="email"
                value={staffForm.email}
                onChange={e => setStaffForm(f => ({ ...f, email: e.target.value.trim() }))}
                required
                placeholder="john@example.com"
                isInvalid={!!staffErrors.email}
              />
              <Form.Control.Feedback type="invalid">{staffErrors.email}</Form.Control.Feedback>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Phone Number</Form.Label>
              <Form.Control
                name="phone"
                value={staffForm.phone}
                onChange={e => setStaffForm(f => ({ ...f, phone: e.target.value.replace(/\D/g, '') }))}
                required
                placeholder="9876543210"
                isInvalid={!!staffErrors.phone}
              />
              <Form.Control.Feedback type="invalid">{staffErrors.phone}</Form.Control.Feedback>
            </Form.Group>
            <Form.Group className="mb-4">
              <Form.Label>Password</Form.Label>
              <Form.Control
                type="password"
                name="password"
                value={staffForm.password}
                onChange={e => setStaffForm(f => ({ ...f, password: e.target.value }))}
                required
                placeholder="Min. 8 characters, upper, lower, number, special"
                isInvalid={!!staffErrors.password}
              />
              <Form.Control.Feedback type="invalid">{staffErrors.password}</Form.Control.Feedback>
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
      <Modal show={showAnnouncementModal} onHide={() => { setShowAnnouncementModal(false); setEditingAnnouncement(null); }} centered>
        <Modal.Header closeButton>
          <Modal.Title>{editingAnnouncement ? 'Edit Announcement' : 'Create Announcement'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleSubmitAnnouncement}>
            <Form.Group className="mb-3">
              <Form.Label>Title</Form.Label>
              <Form.Control name="title" defaultValue={editingAnnouncement?.title || ''} placeholder="Announcement title" required />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Message</Form.Label>
              <Form.Control
                as="textarea"
                rows={4}
                name="message"
                defaultValue={editingAnnouncement?.message || ''}
                placeholder="Announcement message"
                required
              />
            </Form.Group>
            <Form.Group className="mb-4">
              <Form.Label>Type</Form.Label>
              <Form.Select name="type" defaultValue={editingAnnouncement?.type || 'General'}>
                <option value="General">General</option>
                <option value="Deadline">Deadline</option>
                <option value="Important">Important</option>
                <option value="Event">Event</option>
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-4">
              <Form.Label>Target Audience</Form.Label>
              <Form.Select name="targetAudience" defaultValue={editingAnnouncement?.targetAudience || 'All'} required>
                <option value="All">All (Students & Staff)</option>
                <option value="Students">Students Only</option>
                <option value="Staff">Staff Only</option>
              </Form.Select>
            </Form.Group>
            <div className="d-flex gap-2 justify-content-end">
              <Button variant="secondary" onClick={() => { setShowAnnouncementModal(false); setEditingAnnouncement(null); }}>
                Cancel
              </Button>
              <Button variant="primary" type="submit">
                {editingAnnouncement ? 'Save Changes' : 'Post Announcement'}
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>

      {/* Profile Modal */}
      <Modal show={showProfileModal} onHide={() => setShowProfileModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>{selectedProfileUser?.profileType === 'staff' ? 'Staff Profile' : 'Student Profile'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedProfileUser && (
            <div>
              <div className="text-center mb-4">
                <div className="d-inline-flex align-items-center justify-content-center bg-primary text-white rounded-circle mb-3" style={{ width: '80px', height: '80px', fontSize: '32px' }}>
                  {selectedProfileUser.name.charAt(0).toUpperCase()}
                </div>
                <h4 className="fw-bold mb-1">{selectedProfileUser.name}</h4>
                <Badge bg="secondary">{selectedProfileUser.profileType === 'staff' ? 'Staff' : 'Student'}</Badge>
              </div>
              <Table bordered>
                <tbody>
                  <tr>
                    <td className="fw-semibold" style={{ width: '40%' }}>Name</td>
                    <td>{selectedProfileUser.name}</td>
                  </tr>

                  <tr>
                    <td className="fw-semibold">Email</td>
                    <td>{selectedProfileUser.email}</td>
                  </tr>
                  {selectedProfileUser.profileType === 'staff' ? (
                    <>
                      <tr>
                        <td className="fw-semibold">Employee ID</td>
                        <td>{selectedProfileUser.employeeId}</td>
                      </tr>
                      <tr>
                        <td className="fw-semibold">Assigned Projects</td>
                        <td>{selectedProfileUser.assignedProjects || 0}</td>
                      </tr>
                      <tr>
                        <td className="fw-semibold">Department</td>
                        <td>{selectedProfileUser.department || 'N/A'}</td>
                      </tr>
                      <tr>
                        <td className="fw-semibold">Phone</td>
                        <td>{selectedProfileUser.phone || 'N/A'}</td>
                      </tr>
                    </>
                  ) : (
                    <>
                      <tr>
                        <td className="fw-semibold">Student ID</td>
                        <td>{selectedProfileUser.studentId}</td>
                      </tr>
                      <tr>
                        <td className="fw-semibold">Department</td>
                        <td>{selectedProfileUser.department || 'N/A'}</td>
                      </tr>
                      <tr>
                        <td className="fw-semibold">Phone</td>
                        <td>{selectedProfileUser.phone || 'N/A'}</td>
                      </tr>
                    </>
                  )}

                </tbody>
              </Table>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowProfileModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Delete</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <>
            Are you sure you want to delete this {deleteInfo.type === 'staff' ? 'staff member' : deleteInfo.type === 'student' ? 'student' : deleteInfo.type === 'announcement' ? 'announcement' : 'deadline'}? This action cannot be undone.
          </>
        </Modal.Body>

        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={confirmDelete} disabled={loading}>
            {loading ? 'Deleting...' : 'Delete'}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Compose Message Modal */}
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
                <optgroup label="Staff">
                  {staff.map(member => (
                    <option key={member._id || member.id} value={member.userId || member._id}>
                      {member.name} ({member.department || 'Staff'})
                    </option>
                  ))}
                </optgroup>
                <optgroup label="Students">
                  {students.map(student => (
                    <option key={student._id || student.id} value={student.userId || student._id}>
                      {student.name} ({student.studentId})
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
                type="submit"
                disabled={composeLoading || !messageReceiver || !messageSubject.trim() || !messageContent.trim()}
                className="rounded-pill px-4 fw-semibold shadow-sm"
                style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', border: 'none' }}
              >
                {composeLoading ? <><span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Sending...</> : 'Send Message'}
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>

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
              <Button variant="light" onClick={() => setShowReplyModal(false)} className="rounded-pill px-4 fw-semibold shadow-sm">Cancel</Button>
              <Button 
                type="submit" 
                variant="primary" 
                disabled={replyLoading}
                className="rounded-pill px-4 fw-semibold shadow-sm"
                style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', border: 'none' }}
              >
                {replyLoading ? <><span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Sending...</> : 'Send Reply'}
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default HODDashboard;
