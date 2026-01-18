import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { Mail, Lock, Eye, EyeOff, LogIn } from 'lucide-react';

const Login = ({ onClose }) => {
  const { login } = useAuth();
  const [view, setView] = useState('login'); // 'login' or 'forgot'
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleBackdropClick = (e) => {
    if (e.target.className === 'modal') {
      onClose();
    }
  };

  const validateEmail = (email) => {
    return String(email)
      .toLowerCase()
      .match(
        /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
      );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateEmail(formData.email)) {
      setError('Please enter a valid email address');
      return;
    }

    if (view === 'login' && !formData.password) {
      setError('Password is required');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      if (view === 'login') {
        await login(formData.email, formData.password);
        onClose();
      } else {
        const response = await api.post('/auth/forgot-password', { email: formData.email });
        setSuccess(response.data.message);
        // Clear email after success in forgot password view
        setFormData({ ...formData, email: '' });
        // Don't auto-switch back immediately so user can read the message
      }
    } catch (err) {
      setError(err.response?.data?.message || (view === 'login' ? 'Login failed' : 'Failed to send reset link'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal" style={{ display: 'flex' }} onClick={handleBackdropClick}>
      <div className="modal-content">
        <div className="modal-header">
          <h2>{view === 'login' ? 'Login' : 'Reset Password'}</h2>
          <button className="close-modal" onClick={onClose}>&times;</button>
        </div>
        
        {error && <div className="notification error show" style={{ position: 'relative', top: 0, right: 0, marginBottom: '1rem', width: '100%', borderRadius: '8px' }}>{error}</div>}
        {success && <div className="notification success show" style={{ position: 'relative', top: 0, right: 0, marginBottom: '1rem', width: '100%', borderRadius: '8px' }}>{success}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email</label>
            <div className="input-with-icon">
              <Mail className="field-icon" size={18} />
              <input
                type="email"
                className="form-control"
                placeholder="Enter your email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>
          </div>
          
          {view === 'login' && (
            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label>Password</label>
                <a 
                  href="#" 
                  onClick={(e) => { e.preventDefault(); setView('forgot'); }}
                  style={{ fontSize: '0.8rem', color: 'var(--primary-color)', textDecoration: 'none' }}
                >
                  Forgot password?
                </a>
              </div>
              <div className="input-with-icon">
                <Lock className="field-icon" size={18} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="form-control"
                  placeholder="Enter your password"
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
          )}
          
          <button 
            type="submit" 
            className="btn-submit" 
            disabled={loading}
          >
            {loading ? (
              'Processing...'
            ) : (
              <>
                <LogIn size={18} style={{ marginRight: '8px' }} /> 
                {view === 'login' ? 'Login' : 'Send Reset Link'}
              </>
            )}
          </button>

          {view === 'forgot' && (
            <div style={{ textAlign: 'center', marginTop: '1rem' }}>
              <a 
                href="#" 
                onClick={(e) => { e.preventDefault(); setView('login'); }}
                style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textDecoration: 'none' }}
              >
                Back to Login
              </a>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default Login;
