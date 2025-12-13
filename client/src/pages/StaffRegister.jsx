import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Container, Row, Col, Card, Form, Button, Alert } from 'react-bootstrap';

const StaffRegister = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    department: '',
    employeeId: '',
    phone: ''
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { register } = useAuth();
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

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

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

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (!formData.employeeId.trim()) {
      newErrors.employeeId = 'Employee ID is required';
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

    const registrationData = {
      name: formData.name,
      email: formData.email,
      password: formData.password,
      role: 'Staff',
      department: formData.department || undefined,
      phone: formData.phone || undefined,
      employeeId: formData.employeeId
    };

    const result = await register(registrationData);
    setIsSubmitting(false);

    if (result.success) {
      navigate('/dashboard/staff');
    } else {
      setErrors({ submit: result.error });
    }
  };

  return (
    <div className="min-vh-100 d-flex align-items-center py-4" style={{background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)'}}>
      <Container>
        <Row className="justify-content-center">
          <Col md={8} lg={6}>
            <Card className="shadow-lg border-0 rounded-4">
              <Card.Body className="p-5">
                <div className="text-center mb-4">
                  <h1 className="fw-bold mb-2">Staff Registration</h1>
                  <p className="text-muted">Create Faculty/Staff Account</p>
                </div>

                <Form onSubmit={handleSubmit}>
                  {errors.submit && (
                    <Alert variant="danger" className="mb-3">
                      {errors.submit}
                    </Alert>
                  )}

                  <Form.Group className="mb-3">
                    <Form.Label>Full Name *</Form.Label>
                    <Form.Control
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      isInvalid={!!errors.name}
                      placeholder="Enter your full name"
                      disabled={isSubmitting}
                    />
                    <Form.Control.Feedback type="invalid">
                      {errors.name}
                    </Form.Control.Feedback>
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>Email *</Form.Label>
                    <Form.Control
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      isInvalid={!!errors.email}
                      placeholder="Enter your email"
                      disabled={isSubmitting}
                    />
                    <Form.Control.Feedback type="invalid">
                      {errors.email}
                    </Form.Control.Feedback>
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>Employee ID *</Form.Label>
                    <Form.Control
                      type="text"
                      name="employeeId"
                      value={formData.employeeId}
                      onChange={handleChange}
                      isInvalid={!!errors.employeeId}
                      placeholder="Enter your employee ID"
                      disabled={isSubmitting}
                    />
                    <Form.Control.Feedback type="invalid">
                      {errors.employeeId}
                    </Form.Control.Feedback>
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>Department</Form.Label>
                    <Form.Control
                      type="text"
                      name="department"
                      value={formData.department}
                      onChange={handleChange}
                      placeholder="e.g., Computer Science"
                      disabled={isSubmitting}
                    />
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>Phone Number</Form.Label>
                    <Form.Control
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="Enter your phone number"
                      disabled={isSubmitting}
                    />
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>Password *</Form.Label>
                    <Form.Control
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      isInvalid={!!errors.password}
                      placeholder="Enter your password (min 6 characters)"
                      disabled={isSubmitting}
                    />
                    <Form.Control.Feedback type="invalid">
                      {errors.password}
                    </Form.Control.Feedback>
                  </Form.Group>

                  <Form.Group className="mb-4">
                    <Form.Label>Confirm Password *</Form.Label>
                    <Form.Control
                      type="password"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      isInvalid={!!errors.confirmPassword}
                      placeholder="Confirm your password"
                      disabled={isSubmitting}
                    />
                    <Form.Control.Feedback type="invalid">
                      {errors.confirmPassword}
                    </Form.Control.Feedback>
                  </Form.Group>

                  <Button 
                    type="submit" 
                    variant="primary"
                    className="w-100 py-2 fw-semibold"
                    disabled={isSubmitting}
                    style={{background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', border: 'none'}}
                  >
                    {isSubmitting ? 'Creating Account...' : 'Create Staff Account'}
                  </Button>
                </Form>

                <div className="text-center mt-4 pt-3 border-top">
                  <p className="text-muted mb-2">
                    Already have an account? <Link to="/login/staff" className="text-decoration-none fw-semibold">Sign in here</Link>
                  </p>
                  <Link to="/" className="text-muted text-decoration-none">← Back to Home</Link>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default StaffRegister;
