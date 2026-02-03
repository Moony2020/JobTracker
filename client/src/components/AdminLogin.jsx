import React, { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, ChevronRight, ShieldCheck, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import '../pages/AdminDashboard.css';

const AdminLogin = () => {
  const { login } = useAuth();
  const [view, setView] = useState('login'); // 'login' or 'forgot'
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Auto-dismiss timer
  React.useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        setError('');
        setSuccess('');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, success]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      if (view === 'login') {
        await login(formData.email, formData.password);
      } else {
        const response = await api.post('/auth/forgot-password', { email: formData.email });
        setSuccess(response.data.message || 'Reset link sent! Check your inbox.');
        setFormData({ ...formData, email: '' });
      }
    } catch (err) {
      setError(err.response?.data?.message || (view === 'login' ? 'Login failed. Please check your credentials.' : 'Failed to send reset link.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-dashboard-container login-page">
      <div className="nebula-bg" />
      
      <div className="admin-login-box glass-card">
        <div className="login-header">
          <div className="logo-icon-large">
            <ShieldCheck size={40} />
          </div>
          <h1>{view === 'login' ? 'System Access' : 'Reset Access'}</h1>
          <p>{view === 'login' ? 'Please enter your administrator credentials' : 'Enter your email to receive a recovery link'}</p>
        </div>

        {error && (
          <div className="login-error-badge">
            <span>{error}</span>
            <button type="button" onClick={() => setError('')} className="close-badge-btn">
              <X size={16} />
            </button>
          </div>
        )}

        {success && (
          <div className="login-success-badge">
            <span>{success}</span>
            <button type="button" onClick={() => setSuccess('')} className="close-badge-btn">
              <X size={16} />
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="admin-login-form">
          <div className="login-field">
            <label>Email Address</label>
            <div className="login-input-wrapper">
              <Mail size={18} className="field-icon" />
              <input
                type="email"
                placeholder="admin@jobtracker.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>
          </div>

          {view === 'login' && (
            <div className="login-field">
              <div className="label-row">
                <label>Password</label>
                <button 
                  type="button" 
                  className="forgot-link"
                  onClick={() => { setView('forgot'); setError(''); setSuccess(''); }}
                >
                  Forgot Password?
                </button>
              </div>
              <div className="login-input-wrapper">
                <Lock size={18} className="field-icon" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                />
                <button 
                  type="button" 
                  className="toggle-btn"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <Eye size={18} /> : <EyeOff size={18} />}
                </button>
              </div>
            </div>
          )}

          <button type="submit" className="login-submit-btn" disabled={loading}>
            {loading ? (
              <div className="spinner-small" />
            ) : (
              <>
                <span>{view === 'login' ? 'Secure Login' : 'Send Recovery Link'}</span>
                <ChevronRight size={18} />
              </>
            )}
          </button>
        </form>

        <div className="login-footer">
          {view === 'forgot' && (
            <button 
              className="back-to-login" 
              onClick={() => { setView('login'); setError(''); setSuccess(''); }}
              style={{
                background: 'none', border: 'none',
                color: 'rgba(234,240,255,0.4)',
                fontSize: '13px',
                fontWeight: '700',
                cursor: 'pointer',
                marginBottom: '20px'
              }}
            >
              Back to Secure Login
            </button>
          )}
          <p>JOBTRACKER SECURE ADMINISTRATION PANEL</p>
          <div className="footer-line" />
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
