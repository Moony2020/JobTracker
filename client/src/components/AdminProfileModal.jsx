import React, { useState } from 'react';
import { X, User, Lock, Save, Loader2, CheckCircle, Eye, EyeOff } from 'lucide-react';
import api from '../services/api';

const AdminProfileModal = ({ isOpen, onClose, user, onUpdateUser }) => {
  const [activeTab, setActiveTab] = useState('general'); // 'general' or 'secret'
  const [formData, setFormData] = useState({
    name: user?.name || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  if (!isOpen) return null;

  const handleUpdateName = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const response = await api.put('/auth/profile', { name: formData.name });
      setMessage({ type: 'success', text: 'Name updated successfully!' });
      onUpdateUser({ ...user, name: response.data.name });
      setTimeout(() => setActiveTab('general'), 1500);
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to update name' });
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (formData.newPassword !== formData.confirmPassword) {
      setMessage({ type: 'error', text: 'Passwords do not match' });
      return;
    }

    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      await api.post('/auth/change-password', {
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword,
      });
      setMessage({ type: 'success', text: 'Password changed successfully!' });
      setFormData({ ...formData, currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to change password' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-modal-overlay" onClick={(e) => e.target.className === 'admin-modal-overlay' && onClose()}>
      <div className="admin-profile-modal glass-card">
        <div className="admin-modal-header">
          <div className="header-labels">
            <h2>Admin Settings</h2>
            <p>Manage your account identity and security</p>
          </div>
          <button className="admin-modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="admin-modal-tabs">
          <button 
            className={`tab-btn ${activeTab === 'general' ? 'active' : ''}`}
            onClick={() => { setActiveTab('general'); setMessage({ type: '', text: '' }); }}
          >
            <User size={16} />
            <span>General</span>
          </button>
          <button 
            className={`tab-btn ${activeTab === 'secret' ? 'active' : ''}`}
            onClick={() => { setActiveTab('secret'); setMessage({ type: '', text: '' }); }}
          >
            <Lock size={16} />
            <span>Security</span>
          </button>
        </div>

        <div className="admin-modal-body">
          {message.text && (
            <div className={`admin-notif-inline ${message.type}`}>
              {message.type === 'success' ? <CheckCircle size={14} /> : <X size={14} />}
              <span>{message.text}</span>
            </div>
          )}

          {activeTab === 'general' ? (
            <form onSubmit={handleUpdateName} className="admin-modal-form">
              <div className="admin-form-group">
                <label>Administrator Name</label>
                <div className="admin-input-wrapper">
                  <User size={18} className="icon" />
                  <input 
                    type="text" 
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Enter your name"
                    required
                  />
                </div>
              </div>
              <div className="admin-form-group">
                <label>Email Address</label>
                <div className="admin-input-wrapper readonly">
                  <Lock size={18} className="icon" />
                  <input type="email" value={user?.email} readOnly />
                </div>
                <span className="field-hint">Email cannot be changed from the dashboard</span>
              </div>
              <button type="submit" className="admin-save-btn" disabled={loading}>
                {loading ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                <span>Update Account</span>
              </button>
            </form>
          ) : (
            <form onSubmit={handleChangePassword} className="admin-modal-form">
              <div className="admin-form-group">
                <label>Current Password</label>
                <div className="admin-input-wrapper">
                  <Lock size={18} className="icon" />
                  <input 
                    type={showPassword.current ? 'text' : 'password'}
                    value={formData.currentPassword}
                    onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
                    placeholder="••••••••"
                    required
                  />
                  <button 
                    type="button" 
                    className="eye-toggle"
                    onClick={() => setShowPassword({ ...showPassword, current: !showPassword.current })}
                  >
                    {showPassword.current ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <div className="admin-form-group">
                <label>New Password</label>
                <div className="admin-input-wrapper">
                  <Lock size={18} className="icon" />
                  <input 
                    type={showPassword.new ? 'text' : 'password'}
                    value={formData.newPassword}
                    onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                    placeholder="New password (min 6 chars)"
                    required
                  />
                  <button 
                    type="button" 
                    className="eye-toggle"
                    onClick={() => setShowPassword({ ...showPassword, new: !showPassword.new })}
                  >
                    {showPassword.new ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <div className="admin-form-group">
                <label>Confirm New Password</label>
                <div className="admin-input-wrapper">
                  <Lock size={18} className="icon" />
                  <input 
                    type={showPassword.confirm ? 'text' : 'password'}
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    placeholder="Confirm new password"
                    required
                  />
                  <button 
                    type="button" 
                    className="eye-toggle"
                    onClick={() => setShowPassword({ ...showPassword, confirm: !showPassword.confirm })}
                  >
                    {showPassword.confirm ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <button type="submit" className="admin-save-btn danger" disabled={loading}>
                {loading ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                <span>Authorize Change</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminProfileModal;
