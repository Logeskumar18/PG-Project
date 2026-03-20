import React, { useState } from 'react';
import { Container, Card, Form, Button, Alert } from 'react-bootstrap';
import { useSearchParams, useNavigate } from 'react-router-dom';
import api from '../services/api';

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');
  const role = searchParams.get('role');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    setLoading(true);
    setMessage('');
    setError('');

    try {
      const res = await api.post('/auth/reset-password', { token, password, role });
      setMessage(res.data.message || 'Password reset successfully. You can now log in.');
      setTimeout(() => {
        // Redirect to the appropriate login page based on role
        if (role === 'Student') navigate('/login/student');
        else if (role === 'Staff' || role === 'Guide') navigate('/login/staff');
        else if (role === 'HOD') navigate('/login/hod');
        else navigate('/');
      }, 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Error resetting password. The link might be expired or invalid.');
    } finally {
      setLoading(false);
    }
  };

  if (!token || !role) {
    return (
      <Container className="d-flex align-items-center justify-content-center min-vh-100">
        <Alert variant="danger">Invalid password reset link. Missing token or role parameters.</Alert>
      </Container>
    );
  }

  return (
    <Container className="d-flex align-items-center justify-content-center min-vh-100" style={{ background: '#f8f9fa' }}>
      <Card className="shadow-sm border-0 p-4" style={{ maxWidth: '450px', width: '100%', borderRadius: '12px' }}>
        <h4 className="fw-bold mb-4 text-center" style={{ color: '#4f46e5' }}>🔐 Reset Password</h4>
        {message && <Alert variant="success">{message}</Alert>}
        {error && <Alert variant="danger">{error}</Alert>}
        
        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3">
            <Form.Label className="fw-semibold">New Password</Form.Label>
            <Form.Control type="password" placeholder="Enter new password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </Form.Group>
          <Form.Group className="mb-4">
            <Form.Label className="fw-semibold">Confirm New Password</Form.Label>
            <Form.Control type="password" placeholder="Confirm new password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
          </Form.Group>
          <Button variant="primary" type="submit" className="w-100 fw-semibold py-2" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', border: 'none' }} disabled={loading}>{loading ? 'Resetting...' : 'Reset Password'}</Button>
        </Form>
      </Card>
    </Container>
  );
};

export default ResetPassword;