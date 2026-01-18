import React, { useState } from 'react';
import StatCard from '../components/StatCard';
import api from '../services/api';

const Dashboard = ({ applications, stats, onAddApplication, loading }) => {
  const [formData, setFormData] = useState({
    jobTitle: '',
    company: '',
    location: '',
    date: new Date().toISOString().split('T')[0],
    status: 'applied',
    notes: '',
  });

  const [aiText, setAiText] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  const handleAiParse = async () => {
    if (!aiText.trim()) return;
    try {
      setAiLoading(true);
      const response = await api.post('/ai/parse', { text: aiText });
      const data = response.data;
      
      setFormData(prev => ({
        ...prev,
        jobTitle: data.jobTitle || prev.jobTitle,
        company: data.company || prev.company,
        location: data.location || prev.location,
        status: data.status || prev.status,
        notes: data.notes || prev.notes,
      }));
      
      setAiText(''); // Clear search on success
    } catch (error) {
      console.error('AI Parse failed', error);
      alert('Failed to parse job description. Please make sure the API key is configured.');
    } finally {
      setAiLoading(false);
    }
  };

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id === 'job-title' ? 'jobTitle' : id === 'application-date' ? 'date' : id]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onAddApplication(formData);
    setFormData({
      jobTitle: '',
      company: '',
      location: '',
      date: new Date().toISOString().split('T')[0],
      status: 'applied',
      notes: '',
    });
  };

  return (
    <div id="dashboard-page" className="page">
      <h1>Job Application Dashboard</h1>
      <p>Welcome to your job application tracker. Keep track of all your applications in one place.</p>

      <div className="stats-cards">
        {loading && applications.length === 0 ? (
          <>
            <div className="stat-card skeleton-loader" style={{ height: '120px' }} />
            <div className="stat-card skeleton-loader" style={{ height: '120px' }} />
            <div className="stat-card skeleton-loader" style={{ height: '120px' }} />
            <div className="stat-card skeleton-loader" style={{ height: '120px' }} />
            <div className="stat-card skeleton-loader" style={{ height: '120px' }} />
          </>
        ) : (
          <>
            <StatCard label="This Week" value={stats.thisWeek} />
            <StatCard label="This Month" value={stats.thisMonth} />
            <StatCard label="Interviews" value={stats.interviews} />
            <StatCard label="Total Applications" value={stats.total} />
            <StatCard label="Success Rate" value={`${stats.successRate}%`} />
          </>
        )}
      </div>

      <div className={`form-section ai-parser-card ${aiLoading ? 'ai-loading' : ''}`}>
        <div className="ai-card-header">
          <div className="ai-magic-icon">
            <svg viewBox="0 0 24 24" width="24" height="24">
              <path fill="currentColor" d="M12 2L14.5 9L21.5 11.5L14.5 14L12 21L9.5 14L2.5 11.5L9.5 9L12 2Z" />
            </svg>
          </div>
          <div className="ai-card-titles">
            <h2>AI Smart Fill</h2>
            <p>Paste a job description below and let AI fill the form for you.</p>
          </div>
          {aiLoading && <div className="ai-pulse-status">Scanning Application...</div>}
        </div>

        <div className="ai-card-body">
          <div className="ai-input-group">
            <textarea 
              className="ai-textarea" 
              placeholder="Paste job description here..." 
              value={aiText}
              onChange={(e) => setAiText(e.target.value)}
              disabled={aiLoading}
            />
            <button 
              type="button" 
              className={`btn-ai-parse ${aiLoading ? 'loading' : ''}`}
              onClick={handleAiParse}
              disabled={aiLoading || !aiText.trim()}
            >
              {aiLoading ? (
                <div className="loading-dots-mini">AI is parsing</div>
              ) : (
                <>
                  <svg viewBox="0 0 24 24" width="18" height="18" className="btn-icon">
                    <path fill="currentColor" d="M17.66 9.53l-7.07 7.07-4.24-4.24 1.41-1.41 2.83 2.83 5.66-5.66 1.41 1.41z" />
                  </svg>
                  Parse & Fill
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="form-section">
        <h2>Add New Application</h2>
        <form id="application-form" onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="job-title">Job Title *</label>
              <input type="text" id="job-title" className="form-control" value={formData.jobTitle} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label htmlFor="company">Company *</label>
              <input type="text" id="company" className="form-control" value={formData.company} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label htmlFor="location">Location (City/Country)</label>
              <input type="text" id="location" className="form-control" placeholder="e.g., Stockholm, Sweden" value={formData.location} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label htmlFor="application-date">Application Date *</label>
              <input type="date" id="application-date" className="form-control" value={formData.date} onChange={handleChange} required />
            </div>
            <div className="form-group select-group">
              <label htmlFor="status">Status *</label>
              <div className="select-wrapper">
                <select id="status" className="form-control" value={formData.status} onChange={handleChange} required>
                  <option value="applied">Applied</option>
                  <option value="interview">Interview</option>
                  <option value="test">Test</option>
                  <option value="offer">Offer</option>
                  <option value="rejected">Rejected</option>
                  <option value="canceled">Canceled</option>
                </select>
                <i className="ri-arrow-down-s-fill chevron" aria-hidden="true"></i>
              </div>
            </div>
            <div className="form-group full-width">
              <label htmlFor="notes">Notes</label>
              <textarea id="notes" className="form-control" rows="3" value={formData.notes} onChange={handleChange}></textarea>
            </div>
          </div>
          <button type="submit" className="btn-submit">Add Application</button>
        </form>
      </div>

      <div className="recent-applications">
        <h2>Recent Applications</h2>
        <div className="table-container">
          <table className="applications-table">
            <thead>
              <tr>
                <th>Job Title</th>
                <th>Company</th>
                <th>Location</th>
                <th>Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && applications.length === 0 ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i}>
                    <td><div className="skeleton-loader" style={{ height: '20px', width: '80%' }} /></td>
                    <td><div className="skeleton-loader" style={{ height: '20px', width: '60%' }} /></td>
                    <td><div className="skeleton-loader" style={{ height: '20px', width: '70%' }} /></td>
                    <td><div className="skeleton-loader" style={{ height: '20px', width: '50%' }} /></td>
                    <td><div className="skeleton-loader" style={{ height: '24px', width: '60px', borderRadius: '12px' }} /></td>
                    <td><div className="skeleton-loader" style={{ height: '30px', width: '60px' }} /></td>
                  </tr>
                ))
              ) : (
                applications.slice(0, 5).map((app) => (
                  <tr key={app._id} style={{ opacity: app.loading ? 0.6 : 1 }}>
                    <td>{app.jobTitle} {app.loading && <span className="loading-dots">...</span>}</td>
                    <td>{app.company}</td>
                    <td>{app.location || '-'}</td>
                    <td>{new Date(app.date).toLocaleDateString()}</td>
                    <td>
                      <span className={`status-badge status-${app.status}`}>
                        {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                      </span>
                    </td>
                    <td className="action-buttons">
                      <button className="btn-action icon-button btn-edit" title="Edit"><i className="ri-edit-2-line"></i></button>
                      <button className="btn-action icon-button btn-delete" title="Delete"><i className="ri-delete-bin-6-line"></i></button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
