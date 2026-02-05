import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { User, Mail, Lock, Eye, EyeOff, UserPlus, X } from 'lucide-react';

const Register = ({ onClose }) => {
  const { register } = useAuth();
  const [formData, setFormData] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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
    
    if (formData.name.trim().length < 2) {
      setError('Name must be at least 2 characters');
      return;
    }

    if (!validateEmail(formData.email)) {
      setError('Please enter a valid email address');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await register(formData.name, formData.email, formData.password);
      onClose();
    } catch (err) {
      if (err.response?.data?.errors) {
        setError(err.response.data.errors.map(e => e.msg).join('. '));
      } else {
        setError(err.response?.data?.message || 'Registration failed');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal" style={{ display: 'flex' }} onClick={handleBackdropClick}>
      <div className="modal-content">
        <div className="modal-header">
          <h2 style={{ margin: 0, fontSize: '1.2rem' }}>Register</h2>
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
            <label>Full Name</label>
            <div className="input-with-icon">
              <User className="field-icon" size={18} />
              <input
                type="text"
                className="form-control"
                placeholder="Enter your name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
          </div>

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
          
          <div className="form-group">
            <label>Password</label>
            <div className="input-with-icon">
              <Lock className="field-icon" size={18} />
              <input
                type={showPassword ? 'text' : 'password'}
                className="form-control"
                placeholder="Create a password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
              />
              <div 
                className="toggle-password" 
                onClick={() => setShowPassword(!showPassword)}
                style={{ cursor: 'pointer' }}
              >
                {showPassword ? <Eye size={18} /> : <EyeOff size={18} />}
              </div>
            </div>
          </div>

          <div className="form-group">
            <label>Confirm Password</label>
            <div className="input-with-icon">
              <Lock className="field-icon" size={18} />
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                className="form-control"
                placeholder="Confirm your password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                required
              />
              <div 
                className="toggle-password" 
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                style={{ cursor: 'pointer' }}
              >
                {showConfirmPassword ? <Eye size={18} /> : <EyeOff size={18} />}
              </div>
            </div>
          </div>
          <div className="form-actions" style={{ marginTop: '0.5rem', border: 'none', borderTop: 'none', boxShadow: 'none' }}>
            <button 
              type="submit" 
              className="btn-submit" 
              disabled={loading}
              style={{ width: '100%', borderRadius: '12px' }}
            >
              {loading ? 'Registering...' : <><UserPlus size={18} style={{ marginRight: '8px' }} /> Register</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Register;
