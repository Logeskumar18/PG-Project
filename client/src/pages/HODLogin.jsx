import { useState } from 'react';
import ForgotPasswordModal from '../components/ForgotPasswordModal';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Container, Row, Col, Card, Form, Button, Alert, InputGroup, Modal, Spinner } from 'react-bootstrap';

const HODLogin = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showForgot, setShowForgot] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    const result = await login({ ...formData, role: 'HOD' });
    setIsSubmitting(false);

    if (result.success) {
      if (result.user.role === 'HOD') {
        navigate('/dashboard/hod');
      } else {
        setErrorMessage('Access denied. This portal is for HOD only.');
        setShowError(true);
      }
    } else {
      setErrorMessage(result.error || 'Login failed. Please check your credentials.');
      setShowError(true);
    }
  };

  return (
    <div className="min-vh-100 d-flex align-items-center" style={{background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'}}>
      <Container>
        <Row className="justify-content-center">
          <Col md={6} lg={5}>
            <Card className="shadow-lg border-0 rounded-4 login-card-fade-in position-relative overflow-hidden">
              {/* Modern Loading Overlay */}
              {isSubmitting && (
                <div className="position-absolute w-100 h-100 d-flex flex-column align-items-center justify-content-center" style={{ top: 0, left: 0, zIndex: 50, background: 'rgba(255, 255, 255, 0.85)', backdropFilter: 'blur(5px)' }}>
                  <div className="spinner-border mb-3" style={{ width: '3.5rem', height: '3.5rem', color: '#f093fb', borderWidth: '0.25rem' }} role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                  <h5 className="fw-bold mb-1" style={{ color: '#f5576c' }}>Authenticating...</h5>
                  <p className="text-muted small mb-0">Securely logging you in</p>
                </div>
              )}
              <Card.Body className="p-5">
                <div className="text-center mb-4">
                  <div className="mb-3">
                    <div className="d-inline-flex align-items-center justify-content-center rounded-circle" style={{width: '80px', height: '80px', background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'}}>
                      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                        <circle cx="9" cy="7" r="4"></circle>
                        <line x1="19" y1="8" x2="19" y2="14"></line>
                        <line x1="22" y1="11" x2="16" y2="11"></line>
                      </svg>
                    </div>
                  </div>
                  <h1 className="fw-bold mb-2">HOD Login</h1>
                  <p className="text-muted">Head of Department Portal</p>
                </div>

                <Form onSubmit={handleSubmit}>

                  <Form.Group className="mb-3">
                    <Form.Label>Email Address</Form.Label>
                    <Form.Control
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      isInvalid={!!errors.email}
                      placeholder="Enter HOD email"
                      disabled={isSubmitting}
                      size="lg"
                    />
                    <Form.Control.Feedback type="invalid">
                      {errors.email}
                    </Form.Control.Feedback>
                  </Form.Group>

                  <Form.Group className="mb-4">
                    <Form.Label>Password</Form.Label>
                    <InputGroup hasValidation>
                      <Form.Control
                        type={showPassword ? "text" : "password"}
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        isInvalid={!!errors.password}
                        placeholder="Enter your password"
                        disabled={isSubmitting}
                        size="lg"
                      />
                      <Button
                        variant="outline-secondary"
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? "🙈" : "👁️"}
                      </Button>
                      <Form.Control.Feedback type="invalid">
                        {errors.password}
                      </Form.Control.Feedback>
                    </InputGroup>
                    <div className="mt-2 text-end">
                      <Button variant="link" className="p-0 text-decoration-none" onClick={() => setShowForgot(true)} style={{fontSize: '0.95rem'}}>
                        Forgot Password?
                      </Button>
                    </div>
                  </Form.Group>

                  <Button 
                    type="submit" 
                    variant="primary"
                    className="w-100 py-3 fw-semibold"
                    disabled={isSubmitting}
                    size="lg"
                    style={{background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', border: 'none'}}
                  >
                    {isSubmitting ? (
                      <>
                        <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="me-2" />
                        Signing in...
                      </>
                    ) : 'Sign In as HOD'}
                  </Button>
                </Form>

                <div className="text-center mt-4 pt-3 border-top">
                  {/* <p className="text-muted mb-2">
                    Don't have an account? <Link to="/register/hod" className="text-decoration-none fw-semibold">Register as HOD</Link>
                  </p> */}
                  <Link to="/" className="text-muted text-decoration-none">← Back to Home</Link>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>

      {/* Forgot Password Modal */}
      <ForgotPasswordModal show={showForgot} onHide={() => setShowForgot(false)} role={"HOD"} />
      {/* Error Modal */}
      <Modal show={showError} onHide={() => setShowError(false)} centered>
        <Modal.Header closeButton className="border-0">
          <Modal.Title className="text-danger fw-bold">Login Failed</Modal.Title>
        </Modal.Header>
        <Modal.Body className="text-center py-4">
          <div className="mb-3" style={{ fontSize: '3rem' }}>⚠️</div>
          <h5 className="fw-bold mb-2">Incorrect Credentials</h5>
          <p className="text-muted">{errorMessage}</p>
        </Modal.Body>
        <Modal.Footer className="border-0 justify-content-center pb-4">
          <Button variant="danger" className="px-4" onClick={() => setShowError(false)}>Try Again</Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default HODLogin;
