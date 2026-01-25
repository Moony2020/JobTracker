import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Plus, Edit3, Trash2, FileText, Download, Crown } from 'lucide-react';
import TemplateRenderer from './Templates/TemplateRenderer';
import DeleteConfirmationModal from '../../components/DeleteConfirmationModal';

// Sample data for preview
const sampleData = {
  personal: {
    firstName: "John",
    lastName: "Doe",
    email: "john.doe@email.com",
    phone: "(555) 123-4567",
    location: "Anytown, ST 12345",
    summary: "IT professional with over 5 years of experience specializing in technical support, network administration, and software troubleshooting.",
    jobTitle: "IT Professional",
    photo: null
  },
  experience: [
    {
      title: "Senior IT Specialist",
      company: "ABC Tech Solutions",
      startDate: "Jun 2022",
      endDate: "Present",
      description: "Provide Tier 2 technical support for employees. Troubleshoot network hardware and software issues."
    }
  ],
  education: [
    {
      school: "State University",
      degree: "Bachelor of Science in Information Technology",
      startDate: "2014",
      endDate: "2018"
    }
  ],
  skills: ["Technical Support", "Network Administration", "Software Troubleshooting"],
  languages: ["English", "Spanish"],
  projects: []
};

const ResumeList = ({ onEdit, onCreate, language, showNotify }) => {
  const [resumes, setResumes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [templates, setTemplates] = useState([]);
  const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
  const [resumeToDelete, setResumeToDelete] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [resumesRes, templatesRes] = await Promise.all([
        api.get('/cv'),
        api.get('/cv/templates')
      ]);
      setResumes(resumesRes.data);
      setTemplates(templatesRes.data);
    } catch (err) {
      console.error("Error fetching CV data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (e, cv) => {
    e.stopPropagation(); 
    setResumeToDelete(cv);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!resumeToDelete) return;
    try {
      await api.delete(`/cv/${resumeToDelete._id}`);
      setResumes(prev => prev.filter(r => r._id !== resumeToDelete._id));
      if (showNotify) {
        showNotify('CV deleted successfully!', 'success');
      }
      setDeleteModalOpen(false);
      setResumeToDelete(null);
    } catch (err) {
      console.error("Error deleting resume:", err);
      if (showNotify) {
        showNotify("Failed to delete resume", "error");
      }
    }
  };

  const handleDownload = async (e, cv) => {
    e.stopPropagation();
    try {
      const response = await api.get(`/cv/export/${cv._id}`, {
        responseType: 'blob'
      });
      
      // Safety check for backend error hidden in a blob
      if (response.data.size < 500) {
        const text = await response.data.text();
        if (text.includes('Error')) {
           throw new Error(text);
        }
      }

      // Create a blob URL and trigger download
      const url = window.URL.createObjectURL(response.data);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${cv.title || 'CV'}.pdf`);
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      if (showNotify) showNotify('PDF downloaded successfully!', 'success');
    } catch (err) {
      console.error("Error downloading CV:", err);
      if (showNotify) {
        if (err.response && err.response.status === 402) {
          showNotify("Payment required for premium template", "error");
        } else {
          showNotify("Failed to download PDF", "error");
        }
      }
    }
  };

  if (loading) return <div className="cv-loading">Loading CV Builder...</div>;

  return (
    <div className="resume-list-container">
      <div className="list-header">

        <h1>{language === 'Arabic' ? 'السير الذاتية' : 'My Resumes'}</h1>
        <p>{language === 'Arabic' ? 'قم بإنشاء وتعديل سيرتك الذاتية باحترافية' : 'Create and manage your professional resumes'}</p>
      </div>

      <section className="templates-section">
        <div className="section-title-wrapper">
          <h2>{language === 'Arabic' ? 'القوالب المتاحة' : 'Available Templates'}</h2>
        </div>
        <div className="template-grid">
          {templates.map(tpl => (
            <div key={tpl._id} className="template-card" onClick={() => onCreate(tpl)}>
              <div className="template-preview-live">
                <div className="template-preview-wrapper">
                  <TemplateRenderer 
                    templateKey={tpl.key} 
                    data={sampleData} 
                    settings={{ themeColor: "#2563eb", font: "Inter", lineHeight: 1.5 }} 
                  />
                </div>
                {/* Badges restored - Visible always */}
                {tpl.category === 'Premium' && (
                  <div className="premium-badge">
                    <Crown size={14} />
                    <span>PRO</span>
                  </div>
                )}
                {tpl.price === 0 && (
                  <div className="free-badge">FREE</div>
                )}
              </div>
              <div className="template-info">
                <h3>{tpl.name.split(' ')[0]}</h3>
              </div>
            </div>
          ))}
          <div className="create-blank-card" onClick={onCreate}>
            <div className="plus-icon">
              <Plus size={40} />
            </div>
            <span>{language === 'Arabic' ? 'بداية من الصفر' : 'Start from Blank'}</span>
          </div>
        </div>
      </section>

      <section className="saved-resumes-section">
        <h2>{language === 'Arabic' ? 'سيري الذاتية المحفوظة' : 'My Saved Resumes'}</h2>
        {resumes.length > 0 ? (
          <div className="resume-grid">
            {resumes.map(cv => (
              <div key={cv._id} className="resume-item-card">
                <div className="resume-icon">
                  <FileText size={32} />
                </div>
                <div className="resume-details">
                  <h3>{cv.title}</h3>
                  <span className="template-name">{cv.templateId?.name || 'Custom Template'}</span>
                  <span className="last-updated">Updated {new Date(cv.updatedAt).toLocaleString(language === 'Arabic' ? 'ar-EG' : 'en-GB', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <div className="resume-actions">
                  <button className="action-btn edit" title="Edit" onClick={() => onEdit(cv)}>
                    <Edit3 size={18} />
                  </button>
                  <button className="action-btn download" title="Download" onClick={(e) => handleDownload(e, cv)}>
                    <Download size={18} />
                  </button>
                  <button className="action-btn delete" title="Delete" onClick={(e) => handleDelete(e, cv)}>
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '40px', background: '#f8fafc', borderRadius: '12px', border: '2px dashed #e2e8f0' }}>
             <p style={{ color: '#64748b' }}>{language === 'Arabic' ? 'لا توجد سير ذاتية محفوظة حاليا' : 'No saved resumes found. Start by selecting a template above!'}</p>
          </div>
        )}
      </section>

      <DeleteConfirmationModal 
        isOpen={isDeleteModalOpen} 
        onClose={() => setDeleteModalOpen(false)} 
        onConfirm={confirmDelete} 
        applicationName={resumeToDelete?.title}
        itemType="CV"
      />
    </div>
  );
};

export default ResumeList;
