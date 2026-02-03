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
      <div className="contact-header">
        <h1 className="contact-title">Get in Touch</h1>
        <p className="contact-subtitle">
          Have a question about the CV Builder, JobTracker features, or your job search? 
          We're here to support you every step of the way.
        </p>
      </div>

      <div className="contact-grid">
        {/* Left: Info Panel */}
        <div className="glass-panel contact-info-glass">
          <div>
            <h2 className="info-title-glass">Contact Info</h2>
            <p className="info-desc-glass">
              Need assistance with our premium CV tools or your profile?
              Our team is ready to help you succeed.
            </p>

            <div className="info-items-glass">
              <div className="info-item-glass">
                <div className="icon-wrap-glass">
                  <Mail size={22} />
                </div>
                <div className="info-text-glass">
                  <h4>Email</h4>
                  <p>contact@jobtracker-portfolio.com</p>
                </div>
              </div>

              <div className="info-item-glass">
                <div className="icon-wrap-glass">
                  <MapPin size={22} />
                </div>
                <div className="info-text-glass">
                  <h4>Location</h4>
                  <p>Sweden</p>
                </div>
              </div>
            </div>
          </div>

          <div className="socials-glass">
            <a href="#" className="social-link-glass" aria-label="GitHub"><Github size={20} /></a>
            <a href="#" className="social-link-glass" aria-label="LinkedIn"><Linkedin size={20} /></a>
          </div>
        </div>

        {/* Right: Form Panel */}
        <div className="glass-panel contact-form-glass">
          {success ? (
            <div className="success-glass">
              <div className="success-icon-wrap">
                <CheckCircle size={40} />
              </div>
              <h3 className="info-title-glass">Message Sent!</h3>
              <p className="info-desc-glass">Thank you for your message. I will get back to you soon.</p>
              <button onClick={() => setSuccess(false)} className="btn-glass-submit">
                Send Another
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="contact-form">
              <div className="form-row">
                <div className="form-group-glass">
                  <label className="label-glass">Name</label>
                  <input 
                    type="text" 
                    name="name" 
                    value={formData.name} 
                    onChange={handleChange}
                    required
                    className="input-glass" 
                    placeholder="John Doe"
                  />
                </div>
                <div className="form-group-glass">
                  <label className="label-glass">Email</label>
                  <input 
                    type="email" 
                    name="email" 
                    value={formData.email} 
                    onChange={handleChange}
                    required
                    className="input-glass" 
                    placeholder="john@example.com"
                  />
                </div>
              </div>

              <div className="form-group-glass">
                <label className="label-glass">Subject</label>
                <input 
                  type="text" 
                  name="subject" 
                  value={formData.subject} 
                  onChange={handleChange}
                  className="input-glass" 
                  placeholder="Project Inquiry"
                />
              </div>

              <div className="form-group-glass">
                <label className="label-glass">Message</label>
                <textarea 
                  name="message" 
                  value={formData.message} 
                  onChange={handleChange}
                  required
                  rows="5"
                  className="input-glass textarea-glass" 
                  placeholder="How can I help you?"
                />
              </div>

              {error && <p className="error-message">{error}</p>}

              <button 
                type="submit" 
                disabled={loading}
                className="btn-glass-submit"
              >
                {loading ? <Loader2 size={20} className="spinner" /> : <Send size={20} />}
                <span>{loading ? 'Sending...' : 'Send Message'}</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default Contact;
