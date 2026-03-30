import React, { useState, useEffect } from 'react';

const HodProfileTab = ({ user, onProfileUpdate }) => {
  // Profile State
  const [profileData, setProfileData] = useState({
    name: '',
    department: '',
    phone: ''
  });
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileMessage, setProfileMessage] = useState(null);
  const [profileError, setProfileError] = useState(null);

  // Password State
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState(null);
  const [passwordError, setPasswordError] = useState(null);

  // Pre-fill profile form when the component mounts or user prop changes
  useEffect(() => {
    if (user) {
      setProfileData({
        name: user.name || '',
        department: user.department || '',
        phone: user.phone || ''
      });
    }
  }, [user]);

  const handleProfileChange = (e) => {
    setProfileData({ ...profileData, [e.target.name]: e.target.value });
  };

  const handlePasswordChange = (e) => {
    setPasswordData({ ...passwordData, [e.target.name]: e.target.value });
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setProfileLoading(true);
    setProfileMessage(null);
    setProfileError(null);

    try {
      const token = localStorage.getItem('token');
      // Adjust the URL if your routing is different
      const response = await fetch('/api/hod/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(profileData)
      });

      const data = await response.json();

      if (response.ok) {
        setProfileMessage(data.message || 'Profile updated successfully');
        if (onProfileUpdate) {
          onProfileUpdate(data.data); // Callback to update parent/global state
        }
      } else {
        setProfileError(data.message || 'Failed to update profile');
      }
    } catch (error) {
      setProfileError('An error occurred while updating the profile.');
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordLoading(true);
    setPasswordMessage(null);
    setPasswordError(null);

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError('New passwords do not match.');
      setPasswordLoading(false);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/hod/change-password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword
        })
      });

      const data = await response.json();

      if (response.ok) {
        setPasswordMessage(data.message || 'Password changed successfully');
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      } else {
        setPasswordError(data.message || 'Failed to change password');
      }
    } catch (error) {
      setPasswordError('An error occurred while changing the password.');
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div className="row mt-4">
      {/* Update Profile Section */}
      <div className="col-md-6 mb-4">
        <div className="card shadow-sm">
          <div className="card-header bg-primary text-white">
            <h5 className="mb-0">Update Profile</h5>
          </div>
          <div className="card-body">
            {profileMessage && <div className="alert alert-success">{profileMessage}</div>}
            {profileError && <div className="alert alert-danger">{profileError}</div>}
            
            <form onSubmit={handleProfileSubmit}>
              <div className="mb-3">
                <label className="form-label">Full Name</label>
                <input type="text" className="form-control" name="name" value={profileData.name} onChange={handleProfileChange} required />
              </div>
              <div className="mb-3">
                <label className="form-label">Department</label>
                <input type="text" className="form-control" name="department" value={profileData.department} onChange={handleProfileChange} required />
              </div>
              <div className="mb-3">
                <label className="form-label">Phone Number</label>
                <input type="text" className="form-control" name="phone" value={profileData.phone} onChange={handleProfileChange} />
              </div>
              <button type="submit" className="btn btn-primary w-100" disabled={profileLoading}>
                {profileLoading ? 'Updating...' : 'Update Profile'}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Change Password Section */}
      <div className="col-md-6 mb-4">
        <div className="card shadow-sm">
          <div className="card-header bg-secondary text-white">
            <h5 className="mb-0">Change Password</h5>
          </div>
          <div className="card-body">
            {passwordMessage && <div className="alert alert-success">{passwordMessage}</div>}
            {passwordError && <div className="alert alert-danger">{passwordError}</div>}

            <form onSubmit={handlePasswordSubmit}>
              <div className="mb-3">
                <label className="form-label">Current Password</label>
                <input 
                  type="password" className="form-control" name="currentPassword" 
                  value={passwordData.currentPassword} onChange={handlePasswordChange} required 
                />
              </div>
              <div className="mb-3">
                <label className="form-label">New Password</label>
                <input 
                  type="password" className="form-control" name="newPassword" 
                  value={passwordData.newPassword} onChange={handlePasswordChange} required 
                />
                <small className="text-muted">Must be at least 6 characters, with a number and special character.</small>
              </div>
              <div className="mb-3">
                <label className="form-label">Confirm New Password</label>
                <input 
                  type="password" className="form-control" name="confirmPassword" 
                  value={passwordData.confirmPassword} onChange={handlePasswordChange} required 
                />
              </div>
              <button type="submit" className="btn btn-secondary w-100" disabled={passwordLoading}>
                {passwordLoading ? 'Changing...' : 'Change Password'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HodProfileTab;