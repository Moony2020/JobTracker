import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Plus, Edit3, Trash2, FileText, Download, Crown, Loader2 } from 'lucide-react';
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
  languages: [
    { name: "English", level: "Native" },
    { name: "Spanish", level: "Proficient" }
  ],
  projects: []
};

const ResumeList = ({ onEdit, onCreate, language, showNotify }) => {
  const { user } = useAuth();
  const [resumes, setResumes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [templates, setTemplates] = useState([]);
  const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
  const [resumeToDelete, setResumeToDelete] = useState(null);
  const [downloadingId, setDownloadingId] = useState(null);
  const [showAllTemplates, setShowAllTemplates] = useState(false);

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
      setDownloadingId(cv._id);
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
    } finally {
      setDownloadingId(null);
    }
  };

  const getSimplifiedName = (name) => {
    if (!name) return '';
    if (name.includes('Classic')) return 'Classic';
    if (name.includes('Modern')) return 'Modern';
    if (name.includes('Creative')) return 'Creative';
    if (name.includes('Timeline')) return 'Timeline';
    if (name.includes('Executive')) return 'Executive';
    if (name.includes('Elegant')) return 'Elegant';
    return name;
  };

  /* New Helper for relative time */
  const timeAgo = (date) => {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + " years ago";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + " months ago";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + " days ago";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + " hours ago";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + " minutes ago";
    return "Just now";
  };

  const [activeTab, setActiveTab] = useState('draft'); // 'draft' | 'completed'

  // Filter resumes into Drafts and Completed based on payment status
  const completed = resumes.filter(r => r.isPaid); 
  const drafts = resumes.filter(r => !r.isPaid);

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
      {/* 1. Top Header */}
      <div className="dashboard-header-row">
        <div>
          <h1>{language === 'Arabic' ? 'منشئ السيرة الذاتية' : 'Resume Builder'}</h1>
          <p>{language === 'Arabic' ? 'قم بإنشاء سيرتك الذاتية الخاصة للتقدم للوظائف' : 'Create your own custom resume to apply for jobs'}</p>
        </div>
        <button className="btn-primary-large" onClick={() => {
          const blankTpl = templates.find(t => t.key === 'classic') || templates[0];
          if (blankTpl) onCreate(blankTpl);
        }}>
          <Plus size={18} />
          {language === 'Arabic' ? 'بدء سيرة ذاتية جديدة' : 'Start New Resume'}
        </button>
      </div>

      {/* 2. Sample Resume Section */}
      <section className="dashboard-section" id="templates-section">
        <div className="section-header">
           <h2>{language === 'Arabic' ? 'نماذج السير الذاتية' : 'Sample Resume'}</h2>
           <button className="btn-link" onClick={() => setShowAllTemplates(!showAllTemplates)}>
             {language === 'Arabic' ? 'عرض الكل' : (showAllTemplates ? 'Show Less' : 'See All')} 
             <span style={{ marginLeft: 5 }}>{showAllTemplates ? '↑' : '→'}</span>
           </button>
        </div>
        
        <div className="samples-grid">
           {/* Create Blank Card */}
           <div className="create-blank-card" onClick={() => {
              const blankTpl = templates.find(t => t.key === 'classic') || templates[0];
              onCreate(blankTpl);
           }}>
              <div className="plus-circle">
                 <Plus size={24} color="#94a3b8" />
              </div>
              <span>{language === 'Arabic' ? 'إنشاء سيرة ذاتية فارغة' : 'Create Blank Resume'}</span>
           </div>

           {/* Templates List */}
           {templates.slice(0, showAllTemplates ? templates.length : 4).map(tpl => (
             <div key={tpl._id} className="sample-template-card" onClick={() => onCreate(tpl)}>
                <div className="sample-preview-wrapper">
                    <div className="sample-mini-scale">
                      <TemplateRenderer 
                        templateKey={tpl.key} 
                        data={sampleData} 
                        settings={{ 
                          isThumbnail: true,
                          themeColor: {
                            modern: '#2563eb',
                            classic: '#0f172a',
                            executive: '#eab37a',
                            creative: '#2563eb',
                            professional: '#2563eb',
                            elegant: '#475569',
                            timeline: '#dc2626'
                          }[tpl.key] || '#2563eb'
                        }} 
                      />
                    </div>
                    {/* Lock / Pro Icon Mockup */}
                    {(tpl.category === 'Pro' || tpl.category === 'Premium') && (
                       <div className="lock-icon-badge"><Crown size={12} /></div>
                    )}
                </div>
                <div className="sample-info">
                   <h3>{getSimplifiedName(tpl.name)}</h3>
                   {/* User count removed as requested */}
                </div>
             </div>
           ))}
        </div>
      </section>

      {/* 3. My Resume Section */}
      <section className="dashboard-section">
        <div className="section-header">
           <h2>{language === 'Arabic' ? 'سيري الذاتية' : 'My Resumes'}</h2>
        </div>
        
        <div className="tabs-toolbar">
           <div className="tabs-group">
              <button 
                className={`tab-btn ${activeTab === 'draft' ? 'active' : ''}`} 
                onClick={() => setActiveTab('draft')}
              >
                {language === 'Arabic' ? 'مسودة' : 'Draft'} <span className="count-badge">{drafts.length}</span>
              </button>
              <button 
                className={`tab-btn ${activeTab === 'completed' ? 'active' : ''}`} 
                onClick={() => setActiveTab('completed')}
              >
                {language === 'Arabic' ? 'مكتمل' : 'Completed'} <span className="count-badge">{completed.length}</span>
              </button>
           </div>
           
           {/* Reminder button removed as requested */}
        </div>

        <div className="my-resumes-grid">
           {activeTab === 'draft' && drafts.map(cv => (
              <div key={cv._id} className="my-resume-card">
                 <div className="resume-card-preview-area">
                    {/* Render actual CV content as thumbnail */}
                    <div className="resume-mini-scale">
                      <TemplateRenderer 
                        templateKey={cv.templateId?.key || 'classic'} 
                        data={cv.data || {}} 
                        settings={{ isThumbnail: true, themeColor: cv.settings?.themeColor }} 
                      />
                    </div>
                 </div>
                  <div className="resume-card-footer">
                     <h3>{cv.title || 'Untitled Resume'}</h3>
                     <p>{language === 'Arabic' ? 'آخر تحديث' : 'Last Updated'}: {timeAgo(cv.updatedAt)}</p>
                     
                     <div className="resume-card-actions">
                        <span className="template-name-label">{getSimplifiedName(cv.templateId?.key || cv.templateKey)}</span>
                        <div className="resume-card-actions-icons">
                           <button onClick={(e) => { e.stopPropagation(); onEdit(cv); }} title="Edit"><Edit3 size={16} /></button>
                           <button 
                             onClick={(e) => handleDownload(e, cv)} 
                             title="Download"
                             disabled={downloadingId === cv._id}
                             style={downloadingId === cv._id ? { cursor: 'wait', opacity: 0.7 } : {}}
                           >
                             {downloadingId === cv._id ? (
                               <Loader2 size={16} className="spinner" style={{ animation: 'spin 1s linear infinite' }} />
                             ) : (
                               <Download size={16} />
                             )}
                           </button>
                           <button className="text-red" onClick={(e) => handleDelete(e, cv)} title="Delete"><Trash2 size={16} /></button>
                        </div>
                     </div>
                  </div>
              </div>
           ))}

           {activeTab === 'completed' && completed.map(cv => (
              <div key={cv._id} className="my-resume-card">
                 <div className="resume-card-preview-area">
                    {/* Render actual CV content as thumbnail */}
                    <div className="resume-mini-scale">
                      <TemplateRenderer 
                        templateKey={cv.templateId?.key || 'classic'} 
                        data={cv.data || {}} 
                        settings={{ isThumbnail: true, themeColor: cv.settings?.themeColor }} 
                      />
                    </div>
                 </div>
                  <div className="resume-card-footer">
                     <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h3>{cv.title || 'Untitled Resume'}</h3>
                        <span style={{ fontSize: '0.7rem', background: '#d1fae5', color: '#059669', padding: '2px 6px', borderRadius: '4px' }}>Paid</span>
                     </div>
                     <p>{language === 'Arabic' ? 'آخر تحديث' : 'Last Updated'}: {timeAgo(cv.updatedAt)}</p>
                     
                     <div className="resume-card-actions">
                        <span className="template-name-label">{getSimplifiedName(cv.templateId?.key || cv.templateKey || 'Resume')}</span>
                        <div className="resume-card-actions-icons">
                           <button onClick={(e) => { e.stopPropagation(); onEdit(cv); }} title="Edit"><Edit3 size={16} /></button>
                           <button 
                             onClick={(e) => handleDownload(e, cv)} 
                             title="Download"
                             disabled={downloadingId === cv._id}
                             style={downloadingId === cv._id ? { cursor: 'wait', opacity: 0.7 } : {}}
                           >
                             {downloadingId === cv._id ? (
                               <Loader2 size={16} className="spinner" style={{ animation: 'spin 1s linear infinite' }} />
                             ) : (
                               <Download size={16} />
                             )}
                           </button>
                           <button className="text-red" onClick={(e) => handleDelete(e, cv)} title="Delete"><Trash2 size={16} /></button>
                        </div>
                     </div>
                  </div>
              </div>
           ))}
           
           {activeTab === 'draft' && drafts.length === 0 && (
              <div className="empty-state-card">
                 <p>{language === 'Arabic' ? 'لا توجد مسودات حاليا' : 'No drafts yet. Create one from the templates above!'}</p>
              </div>
           )}

           {activeTab === 'completed' && completed.length === 0 && (
              <div className="empty-state-card">
                 <p>{language === 'Arabic' ? 'لا توجد سير ذاتية مكتملة' : 'No completed (paid) resumes found.'}</p>
              </div>
           )}
        </div>
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
