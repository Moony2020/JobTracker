import React, { useState } from 'react';
import api from '../services/api';
import { Lock, Eye, EyeOff, Save, CheckCircle, X } from 'lucide-react';

const ChangePassword = ({ onClose }) => {
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleBackdropClick = (e) => {
    if (e.target.className === 'modal') {
      onClose();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.newPassword.length < 6) {
      setError('New password must be at least 6 characters');
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setError('New passwords do not match');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      await api.post('/auth/change-password', {
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword
      });
      setSuccess(true);
      setTimeout(() => onClose(), 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="modal" style={{ display: 'flex' }} onClick={handleBackdropClick}>
        <div className="modal-content text-center" style={{ padding: '3rem 2rem' }}>
          <CheckCircle size={64} color="var(--success-color)" style={{ marginBottom: '1.5rem' }} />
          <h3>Password Updated!</h3>
          <p>Your password has been changed successfully.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="modal" style={{ display: 'flex' }} onClick={handleBackdropClick}>
      <div className="modal-content">
        <div className="modal-header">
          <h2 style={{ margin: 0, fontSize: '1.2rem' }}>Change Password</h2>
          <button 
            className="close-modal" 
            onClick={onClose}
            style={{
              width: '30px',
              height: '30px',
              padding: 0,
              background: 'rgba(150, 150, 150, 0.15)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: 'none',
              color: 'var(--text-color)',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)';
              e.currentTarget.style.color = 'var(--danger-color)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'rgba(150, 150, 150, 0.15)';
              e.currentTarget.style.color = 'var(--text-color)';
            }}
          >
            <X size={16} />
          </button>
        </div>
        
        {error && <div className="notification error show" style={{ position: 'relative', top: 0, right: 0, marginBottom: '1rem', width: '100%' }}>{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Current Password</label>
            <div className="input-with-icon">
              <Lock className="field-icon" size={18} />
              <input
                type={showCurrent ? 'text' : 'password'}
                className="form-control"
                placeholder="Enter current password"
                value={formData.currentPassword}
                onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
                required
              />
              <div 
                className="toggle-password" 
                onClick={() => setShowCurrent(!showCurrent)}
                style={{ cursor: 'pointer' }}
              >
                {showCurrent ? <Eye size={18} /> : <EyeOff size={18} />}
              </div>
            </div>
          </div>
          
          <div className="form-group">
            <label>New Password</label>
            <div className="input-with-icon">
              <Lock className="field-icon" size={18} />
              <input
                type={showNew ? 'text' : 'password'}
                className="form-control"
                placeholder="Enter new password (min 6 chars)"
                value={formData.newPassword}
                onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                required
                minLength="6"
              />
              <div 
                className="toggle-password" 
                onClick={() => setShowNew(!showNew)}
                style={{ cursor: 'pointer' }}
              >
                {showNew ? <Eye size={18} /> : <EyeOff size={18} />}
              </div>
            </div>
          </div>

          <div className="form-group">
            <label>Confirm New Password</label>
            <div className="input-with-icon">
              <Lock className="field-icon" size={18} />
              <input
                type={showConfirm ? 'text' : 'password'}
                className="form-control"
                placeholder="Confirm new password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                required
              />
              <div 
                className="toggle-password" 
                onClick={() => setShowConfirm(!showConfirm)}
                style={{ cursor: 'pointer' }}
              >
                {showConfirm ? <Eye size={18} /> : <EyeOff size={18} />}
              </div>
            </div>
          </div>
          <button type="submit" className="btn-submit" disabled={loading}>
            <Save size={18} style={{ marginRight: '8px' }} /> 
            {loading ? 'Updating...' : 'Update Password'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChangePassword;
