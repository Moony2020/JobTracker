import React, { useState } from 'react';
import { Mail, MapPin, Send, Github, Linkedin, Loader2, CheckCircle } from 'lucide-react';
import api from '../services/api';
import './Contact.css'; // Import the new CSS file

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await api.post('/contact', formData);
      setSuccess(true);
      setFormData({ name: '', email: '', subject: '', message: '' });
      setTimeout(() => setSuccess(false), 5000);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to send message. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="contact-page fade-in">
      
      {/* Header Section */}
      <div className="contact-header">
        <h1 className="contact-title">Get in Touch</h1>
        <p className="contact-subtitle">
          Have a project in mind or just want to say hi? I'd love to hear from you.
        </p>
      </div>

      <div className="contact-grid">
        
        {/* Contact Info (Left) */}
        <div className="contact-info-card">
          <h2 className="contact-info-title">Contact Information</h2>
          <p className="contact-info-text">
            Feel free to reach out directly through email or connect with me on social media.
          </p>

          <div className="info-list">
            <div className="info-item">
              <div className="icon-wrapper">
                <Mail size={20} color="white" />
              </div>
              <div className="info-details">
                <span>Email</span>
                <span>contact@jobtracker-portfolio.com</span>
              </div>
            </div>

            <div className="info-item">
               <div className="icon-wrapper">
                <MapPin size={20} color="white" />
               </div>
               <div className="info-details">
                 <span>Location</span>
                 <span>Sweden</span>
               </div>
            </div>
          </div>

          <div className="social-section">
            <h3 className="social-links-title">Follow Me</h3>
            <div className="social-links">
              <a href="#" className="contact-social-link">
                <Github size={20} />
              </a>
              <a href="#" className="contact-social-link">
                <Linkedin size={20} />
              </a>
            </div>
          </div>
        </div>

        {/* Contact Form (Right) */}
        <div className="contact-form-card">
          {success ? (
            <div style={{ textAlign: 'center', padding: '2rem' }}>
              <div style={{ display: 'inline-flex', padding: '1rem', background: '#dcfce7', borderRadius: '50%', marginBottom: '1rem' }}>
                <CheckCircle size={48} color="#16a34a" />
              </div>
              <h3 style={{ fontSize: '1.5rem', marginBottom: '0.5rem', color: '#166534' }}>Message Sent!</h3>
              <p style={{ color: '#64748b' }}>Thank you for reaching out. I'll get back to you shortly.</p>
              <button 
                onClick={() => setSuccess(false)}
                className="btn-submit-contact"
                style={{ width: 'auto', margin: '1.5rem auto' }}
              >
                Send Another Message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Name</label>
                  <input 
                    type="text" 
                    name="name" 
                    value={formData.name} 
                    onChange={handleChange}
                    required
                    className="form-input-contact" 
                    placeholder="John Doe"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Email</label>
                  <input 
                    type="email" 
                    name="email" 
                    value={formData.email} 
                    onChange={handleChange}
                    required
                    className="form-input-contact" 
                    placeholder="john@example.com"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Subject</label>
                <input 
                  type="text" 
                  name="subject" 
                  value={formData.subject} 
                  onChange={handleChange}
                  className="form-input-contact" 
                  placeholder="Project Inquiry"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Message</label>
                <textarea 
                  name="message" 
                  value={formData.message} 
                  onChange={handleChange}
                  required
                  rows="5"
                  className="form-textarea-contact" 
                  placeholder="Hello, I'd like to talk about..."
                  style={{ resize: 'vertical' }}
                />
              </div>

              {error && <p style={{ color: '#dc2626', fontSize: '0.9rem' }}>{error}</p>}

              <button 
                type="submit" 
                disabled={loading}
                className="btn-submit-contact"
              >
                {loading ? <Loader2 size={20} className="spinner" /> : <Send size={20} />}
                {loading ? 'Sending...' : 'Send Message'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default Contact;
