import React, { useState } from 'react';
import { Modal, Form, Button, Alert } from 'react-bootstrap';
import api from '../services/api';

const ForgotPasswordModal = ({ show, onHide, role }) => {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');

    try {
      // Request OTP from the backend instead of a magic link
      const res = await api.post('/auth/forgot-password-otp', { email, role });
      setMessage(res.data.message || 'An OTP has been sent to your email.');
      setStep(2); // Move to the OTP verification step
    } catch (err) {
      setError(err.response?.data?.message || 'Error sending OTP.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    setLoading(true);
    setMessage('');
    setError('');

    try {
      // Verify OTP and reset password
      const res = await api.post('/auth/reset-password-otp', { email, role, otp, newPassword });
      setMessage(res.data.message || 'Password reset successfully. You can now log in.');
      setTimeout(() => {
        handleClose();
      }, 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Error resetting password. OTP might be invalid or expired.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setStep(1);
    setEmail('');
    setOtp('');
    setNewPassword('');
    setConfirmPassword('');
    setMessage('');
    setError('');
    onHide();
  };

  return (
    <Modal show={show} onHide={handleClose} centered>
      <Modal.Header closeButton>
        <Modal.Title>Reset Password ({role})</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {message && <Alert variant="success">{message}</Alert>}
        {error && <Alert variant="danger">{error}</Alert>}
        
        {step === 1 ? (
          <Form onSubmit={handleSendOtp}>
            <Form.Group className="mb-4">
              <Form.Label>Email Address</Form.Label>
              <Form.Control type="email" placeholder="Enter your registered email" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus />
            </Form.Group>
            <div className="d-flex justify-content-end gap-2">
              <Button variant="secondary" onClick={handleClose} disabled={loading}>Cancel</Button>
              <Button variant="primary" type="submit" disabled={loading || !email}>
                {loading ? 'Sending OTP...' : 'Send OTP'}
              </Button>
            </div>
          </Form>
        ) : (
          <Form onSubmit={handleResetPassword}>
            <Form.Group className="mb-3">
              <Form.Label>Enter OTP</Form.Label>
              <Form.Control type="text" placeholder="Enter 6-digit OTP" value={otp} onChange={(e) => setOtp(e.target.value)} required autoFocus />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>New Password</Form.Label>
              <Form.Control type="password" placeholder="Enter new password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required />
            </Form.Group>
            <Form.Group className="mb-4">
              <Form.Label>Confirm New Password</Form.Label>
              <Form.Control type="password" placeholder="Confirm new password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
            </Form.Group>
            <div className="d-flex justify-content-end gap-2">
              <Button variant="secondary" onClick={handleClose} disabled={loading}>Cancel</Button>
              <Button variant="primary" type="submit" disabled={loading || !otp || !newPassword || !confirmPassword}>
                {loading ? 'Resetting...' : 'Reset Password'}
              </Button>
            </div>
          </Form>
        )}
      </Modal.Body>
    </Modal>
  );
};

export default ForgotPasswordModal;