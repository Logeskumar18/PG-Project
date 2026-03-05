import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { motion } from "framer-motion";

const MyProfile = () => {
  const { user, updateUser } = useAuth();

  const [profile, setProfile] = useState({
    name: "",
    email: "",
    mobile: "",
  });

  const [passwords, setPasswords] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [error, setError] = useState("");

  // 🔔 Toast states
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  // Load user data
  useEffect(() => {
    if (user) {
      setProfile({
        name: user.name || "",
        email: user.email || "",
        mobile: user.phone || "",
      });
    }
  }, [user]);

  // Auto-hide toast
  useEffect(() => {
    if (showToast) {
      const timer = setTimeout(() => setShowToast(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [showToast]);

  const handleProfileChange = (e) => {
    setProfile({ ...profile, [e.target.name]: e.target.value });
  };

  const handlePasswordsChange = (e) => {
    setPasswords({ ...passwords, [e.target.name]: e.target.value });
  };

  // Update profile
  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const result = await updateUser({
      name: profile.name,
      phone: profile.mobile,
    });

    if (result.success) {
      setToastMessage("Profile updated successfully ✅");
      setShowToast(true);
    } else {
      setError(result.error || "Failed to update profile");
    }
  };

  // Change password
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (passwords.newPassword !== passwords.confirmPassword) {
      setError("New passwords do not match");
      return;
    }

    const result = await updateUser({
      password: passwords.newPassword,
      currentPassword: passwords.currentPassword,
    });

    if (result.success) {
      setToastMessage("Password changed successfully 🔐");
      setShowToast(true);
      setPasswords({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } else {
      setError(result.error || "Failed to change password");
    }
  };

  return (
    <>
      {/* 🔔 Toast Popup */}
      <div
        className={`toast position-fixed top-0 end-0 m-4 ${
          showToast ? "show" : "hide"
        }`}
        role="alert"
      >
        <div className="toast-header bg-success text-white">
          <strong className="me-auto">Success</strong>
          <button
            className="btn-close btn-close-white"
            onClick={() => setShowToast(false)}
          ></button>
        </div>
        <div className="toast-body">{toastMessage}</div>
      </div>

      {/* Main Content */}
      <motion.div
        className="container mt-5"
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="row justify-content-center">
          <div className="col-md-6">
            <div className="card shadow-lg border-0 rounded-4">
              <div className="card-body p-4">
                <h3 className="text-center mb-4 fw-bold">My Profile</h3>

                {/* Profile Form */}
                <form onSubmit={handleProfileSubmit}>
                  <div className="mb-3">
                    <label className="form-label">Name</label>
                    <input
                      type="text"
                      name="name"
                      className="form-control"
                      value={profile.name}
                      onChange={handleProfileChange}
                      required
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Email</label>
                    <input
                      type="email"
                      className="form-control"
                      value={profile.email}
                      disabled
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Mobile</label>
                    <input
                      type="tel"
                      name="mobile"
                      className="form-control"
                      value={profile.mobile}
                      onChange={handleProfileChange}
                      required
                    />
                  </div>

                  <button className="btn btn-primary w-100">
                    Update Profile
                  </button>
                </form>

                <hr className="my-4" />

                {/* Password Form */}
                <h5 className="fw-semibold mb-3">Change Password</h5>

                <form onSubmit={handlePasswordSubmit}>
                  <div className="mb-3">
                    <label className="form-label">Current Password</label>
                    <input
                      type="password"
                      name="currentPassword"
                      className="form-control"
                      value={passwords.currentPassword}
                      onChange={handlePasswordsChange}
                      required
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label">New Password</label>
                    <input
                      type="password"
                      name="newPassword"
                      className="form-control"
                      value={passwords.newPassword}
                      onChange={handlePasswordsChange}
                      required
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label">
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      name="confirmPassword"
                      className="form-control"
                      value={passwords.confirmPassword}
                      onChange={handlePasswordsChange}
                      required
                    />
                  </div>

                  <button className="btn btn-dark w-100">
                    Change Password
                  </button>
                </form>

                {/* Error */}
                {error && (
                  <motion.div
                    className="alert alert-danger mt-3"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    {error}
                  </motion.div>
                )}
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </>
  );
};

export default MyProfile;
