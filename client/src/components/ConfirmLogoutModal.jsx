import React from 'react';

const ConfirmLogoutModal = ({ show, onConfirm, onCancel }) => {
  if (!show) return null;
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      background: 'rgba(0,0,0,0.4)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        background: '#fff',
        borderRadius: '12px',
        padding: '2rem',
        boxShadow: '0 2px 16px rgba(0,0,0,0.2)',
        minWidth: '320px',
        textAlign: 'center'
      }}>
        <h2>Confirm Logout</h2>
        <p>Are you sure you want to logout?</p>
        <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'center', gap: '1rem' }}>
          <button style={{ padding: '0.5rem 1.5rem', borderRadius: '6px', background: '#e74c3c', color: '#fff', border: 'none', fontWeight: 'bold', cursor: 'pointer' }} onClick={onConfirm}>Yes</button>
          <button style={{ padding: '0.5rem 1.5rem', borderRadius: '6px', background: '#bdc3c7', color: '#333', border: 'none', fontWeight: 'bold', cursor: 'pointer' }} onClick={onCancel}>No</button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmLogoutModal;
