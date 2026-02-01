import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Plus, Edit3, Trash2, FileText, Download, Crown } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
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
  const { user } = useAuth();
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
      // Re-order and Filter templates as requested
      // Order: Timeline (Free), Classic (Free), Modern (Free), Creative (Pro)
      const rawTemplates = templatesRes.data;
      
      const orderedKeys = ['timeline', 'classic', 'modern', 'creative'];
      let finalTemplates = [];

      // Build final list in specific order: Timeline, Classic, Modern, Creative
      orderedKeys.forEach(key => {
        const tpl = rawTemplates.find(t => t.key === key);
        if (tpl) {
          // Force Creative to be Pro for the badge and payment logic if category is Premium
          if (key === 'creative' || tpl.category === 'Premium') {
             tpl.category = 'Pro';
          }
          finalTemplates.push(tpl);
        }
      });

      // 3. Add any other templates that weren't in the primary list
      rawTemplates.forEach(t => {
        if (!orderedKeys.includes(t.key)) {
          finalTemplates.push(t);
        }
      });

      setTemplates(finalTemplates);
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
    
    // Check Premium Status
    const isPremiumTemplate = cv.templateId?.category === 'Premium' || cv.templateId?.category === 'Pro';
    const isUserPremium = user?.isPremium || false;

    if (isPremiumTemplate && !isUserPremium && !cv.isPaid) {
       if (showNotify) showNotify('Initiating payment for Premium template...', 'info');
       try {
           const res = await api.post('/payment/stripe/create-session', {
               cvId: cv._id,
               templateId: cv.templateId._id
           });
           
           if (res.data.url) {
               window.location.href = res.data.url;
           } else {
               throw new Error('No checkout URL received');
           }
       } catch (err) {
           console.error('[Payment] Error:', err);
           if (showNotify) showNotify('Failed to start payment processing.', 'error');
       }
       return;
    }

    try {
      const response = await api.get(`/cv/export/${cv._id}`, {
        responseType: 'blob'
      });
      
      // Safety check for backend error hidden in a blob
      // If it's not a PDF, it's probably a JSON or text error
      if (response.data.type !== 'application/pdf') {
          const text = await response.data.text();
          let errorMsg = 'Failed to generate PDF';
          try {
              const error = JSON.parse(text);
              errorMsg = error.msg || error.message || errorMsg;
          } catch {
              errorMsg = text || errorMsg;
          }
          throw new Error(errorMsg);
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

  if (loading) {
    return (
      <div className="cv-loading-container">
        <div className="cv-loading-spinner"></div>
        <p className="cv-loading-text">
          {language === 'Arabic' ? 'جاري تحميل منشئ السيرة الذاتية...' : 'Loading CV Builder...'}
        </p>
      </div>
    );
  }

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
                    settings={{ themeColor: "#2563eb", font: "Inter", lineHeight: 1.5, isThumbnail: true }} 
                  />
                </div>
                {/* Badges restored - Visible always */}
                {tpl.category === 'Pro' && (
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
        <h2 style={{ color: 'var(--text-color)' }}>{language === 'Arabic' ? 'سيري الذاتية المحفوظة' : 'My Saved Resumes'}</h2>
        {resumes.length > 0 ? (
          <div className="resume-grid">
            {resumes.map(cv => (
              <div key={cv._id} className="resume-item-card">
                <div className="resume-icon">
                  <FileText size={32} />
                </div>
                <div className="resume-details">
                  <h3>{cv.title}</h3>
                  <span className="template-name">{cv.templateId?.name?.split(' ')[0] || 'Custom Template'}</span>
                  <span className="last-updated">Updated {new Date(cv.updatedAt).toLocaleString(undefined, { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false })}</span>
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
          <div style={{ textAlign: 'center', padding: '40px', background: 'transparent', borderRadius: '12px', border: '2px dashed var(--light-border)' }}>
             <p style={{ color: 'var(--text-muted)' }}>{language === 'Arabic' ? 'لا توجد سير ذاتية محفوظة حاليا' : 'No saved resumes found. Start by selecting a template above!'}</p>
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
