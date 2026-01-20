import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import api from '../services/api';
import { X, FileText, History, Settings, Upload, Trash2, ExternalLink, Paperclip } from 'lucide-react';
import translations from '../utils/translations';
import DeleteConfirmationModal from './DeleteConfirmationModal';

const EditApplicationModal = ({ application, onClose, onUpdate, language }) => {
  const t = translations[language] || translations['English'];
  const [activeTab, setActiveTab] = useState('general');
  const [formData, setFormData] = useState({
    jobTitle: '',
    company: '',
    location: '',
    date: '',
    status: 'applied',
    notes: '',
    jobLink: '',
    expectedSalary: '',
    offeredSalary: '',
    recruiterName: '',
    recruiterEmail: '',
  });
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [docToDelete, setDocToDelete] = useState(null);

  useEffect(() => {
    if (application) {
      setFormData({
        jobTitle: application.jobTitle || '',
        company: application.company || '',
        location: application.location || '',
        date: application.date ? new Date(application.date).toLocaleDateString('en-CA') : '',
        status: application.status || 'applied',
        notes: application.notes || '',
        jobLink: application.jobLink || '',
        expectedSalary: application.expectedSalary || '',
        offeredSalary: application.offeredSalary || '',
        recruiterName: application.recruiterName || '',
        recruiterEmail: application.recruiterEmail || '',
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

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    setError(null);

    const uploadFormData = new FormData();
    uploadFormData.append('document', file);
    uploadFormData.append('name', file.name);

    try {
      const response = await api.post(`/applications/${application._id}/documents`, uploadFormData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      onUpdate(response.data);
    } catch (err) {
      console.error('Upload failed', err);
      setError('Failed to upload document.');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteDocument = async (docId) => {
    setDocToDelete(docId);
    setShowDeleteModal(true);
  };

  const confirmDeleteDocument = async () => {
    if (!docToDelete) return;
    
    try {
      const response = await api.delete(`/applications/${application._id}/documents/${docToDelete}`);
      onUpdate(response.data);
      setShowDeleteModal(false);
      setDocToDelete(null);
    } catch (err) {
      console.error('Delete document failed', err);
      setError('Failed to delete document.');
    }
  };

  if (!application) return null;

  return ReactDOM.createPortal(
    <div className="modal" onClick={onClose} style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: 9999 }}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '750px', width: '95%', maxHeight: '90vh', overflowY: 'auto' }}>
        <div className="modal-header" style={{ marginBottom: '1rem' }}>
          <h2 style={{ margin: 0, fontSize: '1.2rem' }}>{t.edit_application}</h2>
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

        <div className="modal-tabs" style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--light-border)', overflowX: 'auto', scrollbarWidth: 'none' }}>
          <button 
            type="button"
            className={`modal-tab ${activeTab === 'general' ? 'active' : ''}`}
            onClick={() => setActiveTab('general')}
            style={{
              padding: '0.75rem 1rem',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'general' ? '2px solid var(--primary-color)' : '2px solid transparent',
              color: activeTab === 'general' ? 'var(--primary-color)' : 'var(--text-muted)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontWeight: activeTab === 'general' ? '600' : '400',
              whiteSpace: 'nowrap'
            }}
          >
            <Settings size={18} /> {t.general}
          </button>
          <button 
            type="button"
            className={`modal-tab ${activeTab === 'documents' ? 'active' : ''}`}
            onClick={() => setActiveTab('documents')}
            style={{
              padding: '0.75rem 1rem',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'documents' ? '2px solid var(--primary-color)' : '2px solid transparent',
              color: activeTab === 'documents' ? 'var(--primary-color)' : 'var(--text-muted)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontWeight: activeTab === 'documents' ? '600' : '400',
              whiteSpace: 'nowrap'
            }}
          >
            <Paperclip size={18} /> {t.documents} ({application.documents?.length || 0})
          </button>
          <button 
            type="button"
            className={`modal-tab ${activeTab === 'history' ? 'active' : ''}`}
            onClick={() => setActiveTab('history')}
            style={{
              padding: '0.75rem 1rem',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'history' ? '2px solid var(--primary-color)' : '2px solid transparent',
              color: activeTab === 'history' ? 'var(--primary-color)' : 'var(--text-muted)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontWeight: activeTab === 'history' ? '600' : '400',
              whiteSpace: 'nowrap'
            }}
          >
            <History size={18} /> {t.history}
          </button>
        </div>
        
        {error && <div className="error-message" style={{ marginBottom: '1rem', color: 'var(--danger-color)' }}>{error}</div>}

        {activeTab === 'general' && (
          <form onSubmit={handleSubmit}>
            <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
              <div className="form-group">
                <label htmlFor="jobTitle">{t.job_title} *</label>
                <input type="text" id="jobTitle" className="form-control" value={formData.jobTitle} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label htmlFor="company">{t.company} *</label>
                <input type="text" id="company" className="form-control" value={formData.company} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label htmlFor="location">{t.location}</label>
                <input type="text" id="location" className="form-control" value={formData.location} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label htmlFor="date">{t.date} *</label>
                <input type="date" id="date" className="form-control" value={formData.date} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label htmlFor="status">{t.status} *</label>
                <div className="select-wrapper">
                  <select id="status" className="form-control" value={formData.status} onChange={handleChange} required>
                    <option value="applied">{t.applied}</option>
                    <option value="interview">{t.interview}</option>
                    <option value="test">{t.test}</option>
                    <option value="offer">{t.offer}</option>
                    <option value="rejected">{t.rejected}</option>
                    <option value="canceled">{t.canceled}</option>
                  </select>
                </div>
              </div>
              <div className="form-group full-width" style={{ gridColumn: '1 / -1' }}>
                <label htmlFor="notes">{t.notes}</label>
                <textarea id="notes" className="form-control" rows="3" value={formData.notes} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label htmlFor="jobLink">{t.job_posting_url}</label>
                <input type="url" id="jobLink" className="form-control" value={formData.jobLink} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label htmlFor="expectedSalary">{t.expected_salary}</label>
                <input type="text" id="expectedSalary" className="form-control" value={formData.expectedSalary} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label htmlFor="offeredSalary">{t.offered_salary}</label>
                <input type="text" id="offeredSalary" className="form-control" value={formData.offeredSalary} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label htmlFor="recruiterName">{t.recruiter_name}</label>
                <input type="text" id="recruiterName" className="form-control" value={formData.recruiterName} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label htmlFor="recruiterEmail">{t.recruiter_email}</label>
                <input type="email" id="recruiterEmail" className="form-control" value={formData.recruiterEmail} onChange={handleChange} />
              </div>
            </div>
            
            <div className="form-actions" style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end', gap: '0.6rem' }}>
              <button type="button" className="btn btn-outline" onClick={onClose} style={{ borderRadius: '50px', padding: '0 1.5rem' }}>{t.cancel}</button>
              <button type="submit" className="btn-submit" disabled={loading} style={{ borderRadius: '50px', width: 'auto', minWidth: '165px', padding: '0 2rem' }}>
                {loading ? t.loading : t.save_changes}
              </button>
            </div>
          </form>
        )}

        {activeTab === 'documents' && (
          <div className="documents-tab">
            <div className="upload-section" style={{ marginBottom: '2rem', padding: '2rem', border: '2px dashed var(--light-border)', borderRadius: '12px', textAlign: 'center' }}>
              <Upload size={32} color="var(--primary-color)" style={{ marginBottom: '1rem', margin: '0 auto' }} />
              <h3>Job-Specific Documents</h3>
              <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
                Upload files specific to this application (e.g. Cover Letter). <br/>
                <span style={{ color: 'var(--primary-color)', fontWeight: '500' }}>Your main CV is stored in your CV Profile.</span>
              </p>
              <input 
                type="file" 
                id="file-upload" 
                style={{ display: 'none' }} 
                onChange={handleFileUpload}
                accept=".pdf,.doc,.docx"
              />
              <button 
                type="button"
                className="btn btn-primary" 
                onClick={() => document.getElementById('file-upload').click()}
                disabled={uploading}
                style={{ borderRadius: '50px' }}
              >
                {uploading ? 'Uploading...' : 'Choose File'}
              </button>
            </div>

            <div className="documents-list">
              <h3>Stored Documents</h3>
              {application.documents && application.documents.length > 0 ? (
                <div style={{ display: 'grid', gap: '0.75rem' }}>
                  {application.documents.map((doc) => (
                    <div key={doc._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: 'var(--glass-bg)', borderRadius: '12px', border: '1px solid var(--light-border)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <FileText size={20} color="var(--primary-color)" />
                        <div style={{ textAlign: 'left' }}>
                          <p style={{ fontWeight: '600', margin: 0 }}>{doc.name}</p>
                          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>{new Date(doc.uploadDate).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <a 
                          href={`/uploads/${doc.path}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="btn-action"
                          title="View"
                        >
                          <ExternalLink size={16} />
                        </a>
                        <button 
                          type="button"
                          className="btn-action btn-delete" 
                          onClick={() => handleDeleteDocument(doc._id)}
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>No documents uploaded yet.</p>
              )}
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="history-tab">
            <h3>Application Timeline</h3>
            {application.statusHistory && application.statusHistory.length > 0 ? (
              <div className="timeline" style={{ position: 'relative', paddingLeft: '2rem', marginTop: '1.5rem', textAlign: 'left' }}>
                <div style={{ position: 'absolute', left: '0.45rem', top: 0, bottom: 0, width: '2px', background: 'var(--light-border)' }}></div>
                {application.statusHistory.slice().reverse().map((event, index) => (
                  <div key={index} style={{ position: 'relative', marginBottom: '1.5rem' }}>
                    <div style={{ 
                      position: 'absolute', 
                      left: '-1.85rem', 
                      top: '0.2rem', 
                      width: '12px', 
                      height: '12px', 
                      borderRadius: '50%', 
                      background: index === 0 ? 'var(--primary-color)' : 'var(--light-border)',
                      border: '3px solid var(--bg-color)',
                      zIndex: 1
                    }}></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span className={`status-badge status-${event.status}`}>{t[event.status] || event.status}</span>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{new Date(event.date).toLocaleString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>No history available.</p>
            )}
          </div>
        )}
      </div>

      <DeleteConfirmationModal 
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={confirmDeleteDocument}
        title="Delete Document"
        message="Are you sure you want to delete this document? This action cannot be undone."
      />
    </div>,
    document.body
  );
};

export default EditApplicationModal;
