import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import api from '../services/api';

const EditApplicationModal = ({ application, onClose, onUpdate }) => {
  const [formData, setFormData] = useState({
    jobTitle: '',
    company: '',
    location: '',
    date: '',
    status: 'applied',
    notes: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (application) {
      setFormData({
        jobTitle: application.jobTitle || '',
        company: application.company || '',
        location: application.location || '',
        date: application.date ? new Date(application.date).toISOString().split('T')[0] : '',
        status: application.status || 'applied',
        notes: application.notes || '',
      });
    }
  }, [application]);

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await api.put(`/applications/${application._id}`, formData);
      onUpdate(response.data);
      onClose();
    } catch (err) {
      console.error('Failed to update application', err);
      setError('Failed to update application. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!application) return null;

  return ReactDOM.createPortal(
    <div className="modal" onClick={onClose} style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: 9999 }}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Edit Application</h2>
          <button className="close-modal" onClick={onClose}>&times;</button>
        </div>
        
        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="jobTitle">Job Title *</label>
              <input 
                type="text" 
                id="jobTitle" 
                className="form-control" 
                value={formData.jobTitle} 
                onChange={handleChange} 
                required 
              />
            </div>
            <div className="form-group">
              <label htmlFor="company">Company *</label>
              <input 
                type="text" 
                id="company" 
                className="form-control" 
                value={formData.company} 
                onChange={handleChange} 
                required 
              />
            </div>
            <div className="form-group">
              <label htmlFor="location">Location (City/Country)</label>
              <input 
                type="text" 
                id="location" 
                className="form-control" 
                value={formData.location} 
                onChange={handleChange} 
              />
            </div>
            <div className="form-group">
              <label htmlFor="date">Application Date *</label>
              <input 
                type="date" 
                id="date" 
                className="form-control" 
                value={formData.date} 
                onChange={handleChange} 
                required 
              />
            </div>
            <div className="form-group select-group">
              <label htmlFor="status">Status *</label>
               <div className="select-wrapper">
                  <select 
                    id="status" 
                    className="form-control" 
                    value={formData.status} 
                    onChange={handleChange} 
                    required
                  >
                    <option value="applied">Applied</option>
                    <option value="interview">Interview</option>
                    <option value="test">Test</option>
                    <option value="offer">Offer</option>
                    <option value="rejected">Rejected</option>
                    <option value="canceled">Canceled</option>
                  </select>
                  <i className="ri-arrow-down-s-line chevron"></i>
              </div>
            </div>
            <div className="form-group full-width" style={{ flex: '1 1 100%' }}>
              <label htmlFor="notes">Notes</label>
              <textarea 
                id="notes" 
                className="form-control" 
                rows="3" 
                value={formData.notes} 
                onChange={handleChange} 
              />
            </div>
          </div>
          
          <div className="form-actions">
            <button type="button" className="btn btn-outline" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-submit" disabled={loading}>
              {loading ? 'Updating...' : 'Update'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};

export default EditApplicationModal;
