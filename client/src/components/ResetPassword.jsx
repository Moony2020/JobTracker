import React, { useState } from 'react';
import api from '../services/api';
import { Lock, Eye, EyeOff, CheckCircle } from 'lucide-react';

const ResetPassword = ({ token, onClose }) => {
  const [formData, setFormData] = useState({ password: '', confirmPassword: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    setLoading(true);
    setError('');
    try {
      const response = await api.post(`/auth/reset-password/${token}`, { password: formData.password });
      setSuccess(response.data.message);
      setTimeout(() => {
        onClose();
        window.location.hash = ''; // Clear hash
      }, 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal" style={{ display: 'flex' }}>
      <div className="modal-content">
        <div className="modal-header">
          <h2>New Password</h2>
          <button className="close-modal" onClick={() => {
            onClose();
            window.location.hash = '';
          }}>&times;</button>
        </div>

        {error && <div className="notification error show" style={{ position: 'relative', top: 0, right: 0, marginBottom: '1rem', width: '100%', borderRadius: '8px' }}>{error}</div>}
        {success && (
          <div className="notification success show" style={{ position: 'relative', top: 0, right: 0, marginBottom: '1rem', width: '100%', borderRadius: '8px' }}>
            {success}
          </div>
        )}

        {!success && (
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>New Password</label>
              <div className="input-with-icon">
                <Lock className="field-icon" size={18} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="form-control"
                  placeholder="Enter new password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                />
                <div 
                  className="toggle-password" 
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ cursor: 'pointer' }}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </div>
              </div>
            </div>

            <div className="form-group">
              <label>Confirm Password</label>
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
                  {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                </div>
              </div>
            </div>

            <button type="submit" className="btn-submit" disabled={loading}>
              {loading ? 'Updating...' : 'Reset Password'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default ResetPassword;
