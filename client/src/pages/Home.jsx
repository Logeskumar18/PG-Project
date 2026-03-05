import { Link } from 'react-router-dom';
import { Container, Row, Col, Card, Button, Navbar, Nav, Dropdown } from 'react-bootstrap';

const Home = () => {
  return (
    <div className="min-vh-100" style={{background: '#f8f9fa'}}>
      {/* Navigation Bar */}
      <Navbar bg="white" expand="lg" className="shadow-sm py-3 sticky-top">
        <Container>
          <Navbar.Brand className="fw-bold fs-3" style={{background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'}}>
             Project Tracking
          </Navbar.Brand>
          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="ms-auto gap-3 align-items-lg-center">
              <Nav.Link href="#features" className="fw-semibold">Features</Nav.Link>
              <Nav.Link href="#roles" className="fw-semibold">Access Portal</Nav.Link>
              <Nav.Link href="#about" className="fw-semibold">About</Nav.Link>
              <Dropdown>
                <Dropdown.Toggle 
                  variant="primary" 
                  className="fw-semibold px-4" 
                  style={{background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', border: 'none'}}
                >
                  Login
                </Dropdown.Toggle>
                <Dropdown.Menu align="end" className="shadow-lg border-0 rounded-3 p-2">
                  <Dropdown.Item as={Link} to="/login/hod" className="rounded-2 py-2 px-3 fw-semibold">
                    <span className="d-inline-block me-2" style={{width: '20px'}}>👤</span>
                    HOD Login
                  </Dropdown.Item>
                  <Dropdown.Divider className="my-2" />
                  <Dropdown.Item as={Link} to="/login/staff" className="rounded-2 py-2 px-3 fw-semibold">
                    <span className="d-inline-block me-2" style={{width: '20px'}}>👨‍🏫</span>
                    Staff Login
                  </Dropdown.Item>
                  <Dropdown.Divider className="my-2" />
                  <Dropdown.Item as={Link} to="/login/student" className="rounded-2 py-2 px-3 fw-semibold">
                    <span className="d-inline-block me-2" style={{width: '20px'}}>🎓</span>
                    Student Login
                  </Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown>
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      {/* Hero Section */}
      <div className="py-5" style={{background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'}}>
        <Container className="py-5">
          <Row className="align-items-center">
            <Col lg={6} className="text-white mb-4 mb-lg-0">
              <h1 className="display-3 fw-bold mb-4">Academic Project Tracking and Collaboration Platform</h1>
              <p className="fs-5 mb-4 opacity-90">
                A comprehensive solution for managing academic projects, enabling seamless collaboration between students, faculty, and department heads.
              </p>
              <div className="d-flex gap-3 flex-wrap">
                <Button size="lg" variant="light" className="fw-semibold px-4" href="#roles">
                  Get Started
                </Button>
                <Button size="lg" variant="outline-light" className="fw-semibold px-4" href="#features">
                  Learn More
                </Button>
              </div>
            </Col>
            <Col lg={6}>
              <div className="bg-white rounded-4 shadow-lg p-4">
                <div className="text-center p-5">
                  <svg width="200" height="200" viewBox="0 0 24 24" fill="none" stroke="url(#gradient)" strokeWidth="1.5">
                    <defs>
                      <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#667eea" />
                        <stop offset="100%" stopColor="#764ba2" />
                      </linearGradient>
                    </defs>
                    <path d="M12 2L2 7l10 5 10-5-10-5z"></path>
                    <path d="M2 17l10 5 10-5M2 12l10 5 10-5"></path>
                  </svg>
                  <h4 className="mt-4 fw-bold" style={{color: '#667eea'}}>Streamline Your Academic Projects</h4>
                  <p className="text-muted">Track progress, collaborate effectively, and achieve excellence</p>
                </div>
              </div>
            </Col>
          </Row>
        </Container>
      </div>

      {/* Features Section */}
      <Container className="py-5" id="features">
        <div className="text-center mb-5">
          <h2 className="display-5 fw-bold mb-3">Platform Features</h2>
          <p className="text-muted fs-5">Everything you need for successful project management</p>
        </div>

        <Row className="g-4 mb-5">
          <Col md={6} lg={4}>
            <Card className="h-100 border-0 shadow-sm">
              <Card.Body className="p-4">
                <div className="rounded-3 d-flex align-items-center justify-content-center mb-3" style={{width: '60px', height: '60px', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white'}}>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 2L2 7l10 5 10-5-10-5z"></path>
                    <path d="M2 17l10 5 10-5M2 12l10 5 10-5"></path>
                  </svg>
                </div>
                <h5 className="fw-bold mb-3">Project Management</h5>
                <p className="text-muted mb-0">Track and manage academic projects with milestone tracking, deadline management, and progress monitoring.</p>
              </Card.Body>
            </Card>
          </Col>

          <Col md={6} lg={4}>
            <Card className="h-100 border-0 shadow-sm">
              <Card.Body className="p-4">
                <div className="rounded-3 d-flex align-items-center justify-content-center mb-3" style={{width: '60px', height: '60px', background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', color: 'white'}}>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                    <circle cx="9" cy="7" r="4"></circle>
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                    <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                  </svg>
                </div>
                <h5 className="fw-bold mb-3">Team Collaboration</h5>
                <p className="text-muted mb-0">Foster collaboration between students and faculty with real-time updates, shared resources, and communication tools.</p>
              </Card.Body>
            </Card>
          </Col>

          <Col md={6} lg={4}>
            <Card className="h-100 border-0 shadow-sm">
              <Card.Body className="p-4">
                <div className="rounded-3 d-flex align-items-center justify-content-center mb-3" style={{width: '60px', height: '60px', background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', color: 'white'}}>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                    <polyline points="22 4 12 14.01 9 11.01"></polyline>
                  </svg>
                </div>
                <h5 className="fw-bold mb-3">Submission & Review</h5>
                <p className="text-muted mb-0">Submit work, receive feedback, and track revisions with a streamlined review process and version control.</p>
              </Card.Body>
            </Card>
          </Col>

          <Col md={6} lg={4}>
            <Card className="h-100 border-0 shadow-sm">
              <Card.Body className="p-4">
                <div className="rounded-3 d-flex align-items-center justify-content-center mb-3" style={{width: '60px', height: '60px', background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)', color: 'white'}}>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                    <line x1="16" y1="2" x2="16" y2="6"></line>
                    <line x1="8" y1="2" x2="8" y2="6"></line>
                    <line x1="3" y1="10" x2="21" y2="10"></line>
                  </svg>
                </div>
                <h5 className="fw-bold mb-3">Deadline Tracking</h5>
                <p className="text-muted mb-0">Never miss a deadline with automated reminders, calendar integration, and progress alerts.</p>
              </Card.Body>
            </Card>
          </Col>

          <Col md={6} lg={4}>
            <Card className="h-100 border-0 shadow-sm">
              <Card.Body className="p-4">
                <div className="rounded-3 d-flex align-items-center justify-content-center mb-3" style={{width: '60px', height: '60px', background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)', color: 'white'}}>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="12" y1="1" x2="12" y2="23"></line>
                    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                  </svg>
                </div>
                <h5 className="fw-bold mb-3">Analytics & Reports</h5>
                <p className="text-muted mb-0">Generate comprehensive reports on project progress, student performance, and departmental statistics.</p>
              </Card.Body>
            </Card>
          </Col>

          <Col md={6} lg={4}>
            <Card className="h-100 border-0 shadow-sm">
              <Card.Body className="p-4">
                <div className="rounded-3 d-flex align-items-center justify-content-center mb-3" style={{width: '60px', height: '60px', background: 'linear-gradient(135deg, #30cfd0 0%, #330867 100%)', color: 'white'}}>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                  </svg>
                </div>
                <h5 className="fw-bold mb-3">Secure Access</h5>
                <p className="text-muted mb-0">Role-based authentication ensures data security with separate portals for students, faculty, and administrators.</p>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>

      {/* Role-based Access Section */}
      <div className="py-5" style={{background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'}} id="roles">
        <Container className="py-4">
          <div className="text-center text-white mb-5">
            <h2 className="display-5 fw-bold mb-3">Access Your Portal</h2>
            <p className="fs-5 mb-0">Choose your role to get started</p>
          </div>

          <Row className="g-4">
            <Col md={4}>
              <Card className="h-100 border-0 shadow-lg rounded-4 overflow-hidden bg-white" style={{cursor: 'pointer', transition: 'transform 0.3s, box-shadow 0.3s'}} onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-10px)'; e.currentTarget.style.boxShadow = '0 20px 40px rgba(0,0,0,0.3)'; }} onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 10px 20px rgba(0,0,0,0.2)'; }}>
                <div style={{height: '8px', background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'}}></div>
                <Card.Body className="p-5 text-center">
                  <div className="mb-4 d-flex justify-content-center">
                    <div className="rounded-circle d-flex align-items-center justify-content-center" style={{width: '100px', height: '100px', background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', color: 'white'}}>
                      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                        <circle cx="12" cy="7" r="4"></circle>
                      </svg>
                    </div>
                  </div>
                  <h2 className="fw-bold mb-3">Head of Department</h2>
                  <p className="text-muted mb-4">Oversee departments, manage faculty and students, view analytics and reports</p>
                  <div className="d-flex flex-column gap-3">
                    <Link to="/login/hod" className="btn btn-lg fw-semibold text-white" style={{background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', border: 'none'}}>
                      Login as HOD
                    </Link>
                    <Link to="/register/hod" className="btn btn-lg btn-outline-light fw-semibold text-white" style={{borderColor: 'white', borderWidth: '2px'}}>
                      Register as HOD
                    </Link>
                  </div>
                </Card.Body>
              </Card>
            </Col>

            <Col md={4}>
              <Card className="h-100 border-0 shadow-lg rounded-4 overflow-hidden bg-white" style={{cursor: 'pointer', transition: 'transform 0.3s, box-shadow 0.3s'}} onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-10px)'; e.currentTarget.style.boxShadow = '0 20px 40px rgba(0,0,0,0.3)'; }} onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 10px 20px rgba(0,0,0,0.2)'; }}>
                <div style={{height: '8px', background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)'}}></div>
                <Card.Body className="p-5 text-center">
                  <div className="mb-4 d-flex justify-content-center">
                    <div className="rounded-circle d-flex align-items-center justify-content-center" style={{width: '100px', height: '100px', background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', color: 'white'}}>
                      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                        <circle cx="9" cy="7" r="4"></circle>
                        <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                        <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                      </svg>
                    </div>
                  </div>
                  <h2 className="fw-bold mb-3">Faculty & Staff</h2>
                  <p className="text-muted mb-4">Guide students, manage projects, review submissions and provide feedback</p>
                  <div className="d-flex flex-column gap-3">
                    <Link to="/login/staff" className="btn btn-lg fw-semibold text-white" style={{background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', border: 'none'}}>
                      Login as Staff
                    </Link>
                    <Link to="/register/staff" className="btn btn-lg btn-outline-light fw-semibold text-white" style={{borderColor: 'white', borderWidth: '2px'}}>
                      Register as Staff
                    </Link>
                  </div>
                </Card.Body>
              </Card>
            </Col>

            <Col md={4}>
              <Card className="h-100 border-0 shadow-lg rounded-4 overflow-hidden bg-white" style={{cursor: 'pointer', transition: 'transform 0.3s, box-shadow 0.3s'}} onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-10px)'; e.currentTarget.style.boxShadow = '0 20px 40px rgba(0,0,0,0.3)'; }} onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 10px 20px rgba(0,0,0,0.2)'; }}>
                <div style={{height: '8px', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'}}></div>
                <Card.Body className="p-5 text-center">
                  <div className="mb-4 d-flex justify-content-center">
                    <div className="rounded-circle d-flex align-items-center justify-content-center" style={{width: '100px', height: '100px', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white'}}>
                      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
                        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
                      </svg>
                    </div>
                  </div>
                  <h2 className="fw-bold mb-3">Student</h2>
                  <p className="text-muted mb-4">Access coursework, submit projects, track progress and communicate with staff</p>
                  <div className="d-flex flex-column gap-3">
                    <Link to="/login/student" className="btn btn-lg fw-semibold text-white" style={{background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', border: 'none'}}>
                      Login as Student
                    </Link>
                    <div className="text-white-50 small text-center mt-2">
                      <i>Students are created by Staff members</i>
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Container>
      </div>

      {/* Demo Credentials Section */}
    

      {/* About Section */}
      <Container className="py-5" id="about">
        <Row className="align-items-center">
          <Col lg={6} className="mb-4 mb-lg-0">
            <h2 className="display-5 fw-bold mb-4">About the Platform</h2>
            <p className="fs-5 text-muted mb-4">
              The Academic Project Tracking and Collaboration Platform is designed to streamline the entire lifecycle of academic projects, from initiation to completion.
            </p>
            <p className="text-muted mb-4">
              Our platform bridges the gap between students, faculty members, and department administrators, providing a centralized hub for project management, communication, and collaboration.
            </p>
            <div className="d-flex flex-column gap-3">
              <div className="d-flex gap-3">
                <div className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0" style={{width: '50px', height: '50px', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white'}}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                </div>
                <div>
                  <h5 className="fw-bold mb-1">Real-time Collaboration</h5>
                  <p className="text-muted mb-0">Work together seamlessly with instant updates and notifications</p>
                </div>
              </div>
              <div className="d-flex gap-3">
                <div className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0" style={{width: '50px', height: '50px', background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', color: 'white'}}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                </div>
                <div>
                  <h5 className="fw-bold mb-1">Comprehensive Tracking</h5>
                  <p className="text-muted mb-0">Monitor progress, deadlines, and milestones in one place</p>
                </div>
              </div>
              <div className="d-flex gap-3">
                <div className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0" style={{width: '50px', height: '50px', background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', color: 'white'}}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                </div>
                <div>
                  <h5 className="fw-bold mb-1">Enhanced Communication</h5>
                  <p className="text-muted mb-0">Built-in messaging and feedback system for better coordination</p>
                </div>
              </div>
            </div>
          </Col>
          <Col lg={6}>
            <Card className="border-0 shadow-lg">
              <Card.Body className="p-5">
                <h4 className="fw-bold mb-4 text-center">Platform Statistics</h4>
                <Row className="g-4">
                  <Col xs={6}>
                    <div className="text-center">
                      <h2 className="fw-bold mb-1" style={{color: '#667eea'}}>500+</h2>
                      <p className="text-muted mb-0">Active Projects</p>
                    </div>
                  </Col>
                  <Col xs={6}>
                    <div className="text-center">
                      <h2 className="fw-bold mb-1" style={{color: '#f5576c'}}>1000+</h2>
                      <p className="text-muted mb-0">Students</p>
                    </div>
                  </Col>
                  <Col xs={6}>
                    <div className="text-center">
                      <h2 className="fw-bold mb-1" style={{color: '#4facfe'}}>150+</h2>
                      <p className="text-muted mb-0">Faculty Members</p>
                    </div>
                  </Col>
                  <Col xs={6}>
                    <div className="text-center">
                      <h2 className="fw-bold mb-1" style={{color: '#43e97b'}}>25+</h2>
                      <p className="text-muted mb-0">Departments</p>
                    </div>
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>

      {/* Footer */}
      <div className="py-4 text-white" style={{background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'}}>
        <Container>
          <div className="text-center">
            <p className="mb-0">© 2024 Academic Project Tracking and Collaboration Platform. All rights reserved.</p>
          </div>
        </Container>
      </div>
    </div>
  );
};

export default Home;
