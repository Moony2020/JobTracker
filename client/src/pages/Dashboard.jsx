import React, { useState, useEffect } from 'react';
import { Sparkles, Edit2, Trash2, CheckCircle2, LayoutGrid, List, ChevronDown } from 'lucide-react';
import StatCard from '../components/StatCard';
import PrepModal from '../components/PrepModal';
import KanbanBoard from '../components/KanbanBoard';
import api from '../services/api';
import translations from '../utils/translations';
import { motion } from 'framer-motion';

const Dashboard = ({ applications, stats, onAddApplication, onEdit, onDelete, onStatusChange, loading, language }) => {
  const t = translations[language] || translations['English'];
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'board'

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { 
        duration: 0.5, 
        staggerChildren: 0.1 
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };
  
  // ... existing form state ...
  const [formData, setFormData] = useState({
    jobTitle: '',
    company: '',
    location: '',
    date: new Date().toLocaleDateString('en-CA'),
    status: 'applied',
    notes: '',
    jobLink: '',
    expectedSalary: '',
    offeredSalary: '',
    recruiterName: '',
    recruiterEmail: '',
  });

  const [aiText, setAiText] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  
  // AI Prep Modal state
  const [prepModalOpen, setPrepModalOpen] = useState(false);
  const [selectedAppForPrep, setSelectedAppForPrep] = useState(null);

  // ... (handlers remain same) ...
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
        jobLink: data.jobLink || prev.jobLink,
        expectedSalary: data.expectedSalary || prev.expectedSalary,
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
      date: new Date().toLocaleDateString('en-CA'),
      status: 'applied',
      notes: '',
      jobLink: '',
      expectedSalary: '',
      offeredSalary: '',
      recruiterName: '',
      recruiterEmail: '',
      recruiterLinkedIn: '',
    });
  };

  return (
    <motion.div 
      id="dashboard-page" 
      className="page"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <motion.div id="dashboard-header" className="dashboard-intro" variants={itemVariants}>
        <h1>{t.dashboard_title}</h1>
        <p>{t.welcome_message}</p>
      </motion.div>

      <motion.div className="stats-cards" variants={itemVariants}>
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
            <StatCard label={t.this_week} value={stats.thisWeek} />
            <StatCard label={t.this_month} value={stats.thisMonth} />
            <StatCard label={t.interviews} value={stats.interviews} />
            <StatCard label={t.total_apps} value={stats.total} />
            <StatCard label={t.success_rate} value={`${stats.successRate}%`} />
          </>
        )}
      </motion.div>

      {/* AI Section (Unchanged) */}
      <motion.div className={`form-section ai-parser-card ${aiLoading ? 'ai-loading' : ''}`} variants={itemVariants}>
        <div className="ai-card-header">
          <div className="ai-magic-icon">
            <Sparkles size={24} />
          </div>
          <div className="ai-card-titles">
            <h2>{t.ai_smart_fill}</h2>
            <p>{t.ai_smart_fill_description}</p>
          </div>
          {aiLoading && <div className="ai-pulse-status">{t.scanning_application}</div>}
        </div>

        <div className="ai-card-body">
          <div className="ai-input-group">
            <textarea 
              className="ai-textarea" 
              placeholder={t.paste_job_description_placeholder}
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
                <div className="loading-dots-mini">{t.loading}</div>
              ) : (
                <>
                  <Sparkles size={18} className="btn-icon" />
                  {t.parse_and_fill}
                </>
              )}
            </button>
          </div>
        </div>
      </motion.div>

      {/* Manual Form (Unchanged) */}
      <motion.div className="form-section" variants={itemVariants}>
        <h2>{t.add_application}</h2>
        <form id="application-form" onSubmit={handleSubmit}>
          {/* ... (form fields unchanged) ... */}
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="job-title">{t.job_title} *</label>
              <input type="text" id="job-title" className="form-control" value={formData.jobTitle} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label htmlFor="company">{t.company} *</label>
              <input type="text" id="company" className="form-control" value={formData.company} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label htmlFor="location">{t.location}</label>
              <input type="text" id="location" className="form-control" placeholder="e.g., Stockholm, Sweden" value={formData.location} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label htmlFor="application-date">{t.date} *</label>
              <input type="date" id="application-date" className="form-control" value={formData.date} onChange={handleChange} required />
            </div>
            <div className="form-group select-group">
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
                  <ChevronDown className="chevron" size={16} />
                </div>
            </div>
            <div className="form-group full-width">
              <label htmlFor="notes">{t.notes}</label>
              <textarea id="notes" className="form-control" rows="2" value={formData.notes} onChange={handleChange}></textarea>
            </div>
            <div className="form-group">
              <label htmlFor="jobLink">{t.job_posting_url}</label>
              <input type="url" id="jobLink" className="form-control" placeholder="https://..." value={formData.jobLink} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label htmlFor="expectedSalary">{t.expected_salary}</label>
              <input type="text" id="expectedSalary" className="form-control" placeholder="e.g., 50k - 60k" value={formData.expectedSalary} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label htmlFor="offeredSalary">{t.offered_salary}</label>
              <input type="text" id="offeredSalary" className="form-control" placeholder="e.g., 55k" value={formData.offeredSalary} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label htmlFor="recruiterName">{t.recruiter_name}</label>
              <input type="text" id="recruiterName" className="form-control" value={formData.recruiterName} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label htmlFor="recruiterEmail">{t.recruiter_email}</label>
              <input type="email" id="recruiterEmail" className="form-control" placeholder="e.g., john@company.com" value={formData.recruiterEmail} onChange={handleChange} />
            </div>
          </div>
          <button type="submit" className="btn-submit">{t.add_application}</button>
        </form>
      </motion.div>

      <motion.div id="recent-apps" className="recent-applications-section" variants={itemVariants}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h2 style={{ margin: 0 }}>{t.recent_applications}</h2>
            <div className="view-toggle" style={{ 
                background: 'var(--glass-bg)', 
                padding: '4px', 
                borderRadius: '8px', 
                border: '1px solid var(--light-border)',
                display: 'flex',
                gap: '4px'
            }}>
                <button 
                    onClick={() => setViewMode('list')}
                    style={{
                        background: viewMode === 'list' ? 'var(--primary-color)' : 'transparent',
                        color: viewMode === 'list' ? 'white' : 'var(--text-muted)',
                        border: 'none',
                        borderRadius: '6px',
                        padding: '6px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center'
                    }}
                    title="List View"
                >
                    <List size={18} />
                </button>
                <button 
                    onClick={() => setViewMode('board')}
                    style={{
                        background: viewMode === 'board' ? 'var(--primary-color)' : 'transparent',
                        color: viewMode === 'board' ? 'white' : 'var(--text-muted)',
                        border: 'none',
                        borderRadius: '6px',
                        padding: '6px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center'
                    }}
                    title="Board View"
                >
                    <LayoutGrid size={18} />
                </button>
            </div>
        </div>

        {viewMode === 'board' ? (
          <div className="kanban-container">
            <KanbanBoard 
                applications={applications}
                onStatusChange={onStatusChange}
                onEdit={onEdit}
                onDelete={onDelete}
                onPrep={(app) => { setSelectedAppForPrep(app); setPrepModalOpen(true); }}
                language={language}
            />
          </div>
        ) : (
            <div className="table-container">
            <table className="applications-table">
                <thead>
                <tr>
                    <th>{t.job_title}</th>
                    <th>{t.company}</th>
                    <th>{t.location}</th>
                    <th>{t.date}</th>
                    <th>{t.status}</th>
                    <th>{t.actions}</th>
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
                ) : applications.length > 0 ? (
                    applications.slice(0, 5).map(app => (
                    <tr key={app._id} style={{ opacity: app.loading ? 0.6 : 1 }}>
                        <td>{app.jobTitle} {app.loading && <span className="loading-dots">...</span>}</td>
                        <td>{app.company}</td>
                        <td>{app.location || '-'}</td>
                        <td>{new Date(app.date).toLocaleDateString()}</td>
                        <td className="status-cell">
                        <span className={`status-badge status-${app.status}`}>
                            {t[app.status] || app.status}
                        </span>
                        </td>
                        <td className="action-buttons">
                        <button 
                            className="btn-action btn-prep" 
                            title={t.ai_prep}
                            onClick={() => { setSelectedAppForPrep(app); setPrepModalOpen(true); }}
                        >
                            <Sparkles size={16} />
                        </button>
                        <button 
                            className="btn-action btn-edit" 
                            title={t.edit}
                            onClick={() => onEdit(app)}
                        >
                            <Edit2 size={16} />
                        </button>
                        <button 
                            className="btn-action btn-delete" 
                            title={t.delete}
                            onClick={() => onDelete(app._id)}
                        >
                            <Trash2 size={16} />
                        </button>
                        </td>
                    </tr>
                    ))
                ) : (
                    <tr>
                    <td colSpan="6" className="no-data">{t.no_apps}</td>
                    </tr>
                )}
                </tbody>
            </table>
            </div>
        )}
      </motion.div>

      <PrepModal 
        isOpen={prepModalOpen} 
        onClose={() => { setPrepModalOpen(false); setSelectedAppForPrep(null); }} 
        application={selectedAppForPrep}
      />
    </motion.div>
  );
};

export default Dashboard;
