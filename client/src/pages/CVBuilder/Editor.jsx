import React, { useState, useEffect, useCallback } from 'react';
import TemplateRenderer from './Templates/TemplateRenderer';
import DeleteConfirmationModal from '../../components/DeleteConfirmationModal';
import RichTextEditor from '../../components/RichTextEditor';
import { 
  Bold, Italic, Underline, Link as LinkIcon, List, AlignLeft, AlignCenter, AlignRight,
  CheckCircle, Trash2, Plus, Minus, ChevronUp, ChevronDown, Layout, X, ChevronLeft, Download,
  User, Briefcase, GraduationCap, Globe, Code, Heart, Type, ArrowLeft, Palette, Save, Eye, FileText, HelpCircle, Check, Camera, Upload
} from 'lucide-react';
import './CVBuilder.css';
import './mobile_drawer_styles.css';
import './mobile_layout_fix.css';
import api from '../../services/api';

const SAMPLE_DATA = {
  personal: {
    firstName: "John",
    lastName: "Doe",
    jobTitle: "Professional Title",
    email: "john@example.com",
    phone: "(555) 123-4567",
    location: "New York, USA",
    summary: "Experienced professional with a strong background in..."
  },
  experience: [
    { title: "Senior Developer", company: "Tech Corp", startDate: "2020", endDate: "Present", description: "Led development team..." }
  ],
  education: [
    { school: "University", degree: "Bachelor's Degree", startDate: "2016", endDate: "2020" }
  ],
  skills: ["JavaScript", "React", "Node.js"],
  languages: [],
  projects: [],
  links: []
};

const Editor = ({ cvId: propCvId, onBack, showNotify, isPrintMode }) => {
  const [activeCvId, setActiveCvId] = useState(propCvId);
  const [loading, setLoading] = useState(activeCvId ? true : false);
  const [viewMode, setViewMode] = useState(() => {
    const savedMode = localStorage.getItem('cv_editor_view_mode');
    if (savedMode) return savedMode;
    return 'content';
  });

  // Track viewport state for smooth transitions
  const prevWidthRef = React.useRef(typeof window !== 'undefined' ? window.innerWidth : 1200);
  const lastDesktopModeRef = React.useRef(viewMode);

  useEffect(() => {
    localStorage.setItem('cv_editor_view_mode', viewMode);
    // Update the ref whenever viewMode changes while on desktop
    if (window.innerWidth > 768) {
      lastDesktopModeRef.current = viewMode;
    }
  }, [viewMode]);

  useEffect(() => {
    const handleResize = () => {
      const currentWidth = window.innerWidth;
      const wasDesktop = prevWidthRef.current > 768;
      const isMobile = currentWidth <= 768;

      if (wasDesktop && isMobile) {
        // Desktop -> Mobile: Close drawer by default so user sees CV
        // Save current desktop mode first
        lastDesktopModeRef.current = viewMode; 
        setViewMode('content');
      } else if (!wasDesktop && !isMobile) {
        // Mobile -> Desktop: Restore the desktop view they were using
        setViewMode(lastDesktopModeRef.current);
      }
      
      prevWidthRef.current = currentWidth;
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [viewMode]); 

  const [cvData, setCvData] = useState({
    title: 'Untitled CV',
    data: {
      personal: {
        firstName: '',
        lastName: '',
        jobTitle: '',
        email: '',
        phone: '',
        location: '',
        summary: '',
        photo: null,
        city: '',
        country: '',
        address: '',
        zipCode: '',
        idNumber: '',
        birthDate: '',
        nationality: '',
        driversLicense: ''
      },
      experience: [],
      education: [],
      skills: [],
      languages: [],
      projects: [],
      certifications: [],
      hobbies: [],
      links: [],
      volunteering: [],
      courses: [],
      military: [],
      references: [],
      gdpr: []
    },
    settings: {
      themeColor: '#2563eb',
      font: 'Inter',
      lineSpacing: 100,
      fontSize: 100
    },
    templateId: null,
    templateKey: 'modern'
  });

  const [activeSection, setActiveSection] = useState('personal');
  const [isSaved, setIsSaved] = useState(true);
  const [availableTemplates, setAvailableTemplates] = useState([]);
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    section: null,
    index: null,
    title: ''
  });
  const [showMoreDetails, setShowMoreDetails] = useState(false);

  // Fetch CV data if editing
  useEffect(() => {
    const init = async () => {
      try {
        const tplRes = await api.get('/cv/templates');
        setAvailableTemplates(tplRes.data);
        
        if (activeCvId) {
          console.log(`[Editor] Fetching CV data for ID: ${activeCvId}`);
          const res = await api.get(`/cv/${activeCvId}`);
          console.log(`[Editor] CV data received:`, res.data ? 'Success' : 'Empty');
          if (res.data) {
            const normalizedData = {
              ...res.data,
              data: {
                personal: res.data.data?.personal || {},
                experience: res.data.data?.experience || [],
                education: res.data.data?.education || [],
                skills: res.data.data?.skills || [],
                languages: res.data.data?.languages || [],
                projects: res.data.data?.projects || [],
                certifications: res.data.data?.certifications || [],
                hobbies: res.data.data?.hobbies || [],
                links: res.data.data?.links || [],
                volunteering: res.data.data?.volunteering || [],
                courses: res.data.data?.courses || [],
                military: res.data.data?.military || [],
                references: res.data.data?.references || [],
                gdpr: res.data.data?.gdpr || []
              },
              settings: res.data.settings || { themeColor: '#2563eb', font: 'Inter', lineSpacing: 100 },
              templateKey: res.data.templateId?.key || 'modern'
            };
            setCvData(normalizedData);
          }
        } else {
             console.log(`[Editor] Initializing new CV`);
             // Initialize from history state if creating new
             const historyState = window.history.state;
             if (historyState && historyState.templateKey) {
                setCvData(prev => ({
                   ...prev,
                   templateKey: historyState.templateKey
                }));
             }
        }
      } catch (err) {
        console.error("[Editor ERROR] Error initializing editor:", err);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [propCvId, activeCvId]);
  

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        if (showNotify) showNotify("Image size must be less than 2MB", "error");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        updateNestedState('data.personal.photo', reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const removePhoto = () => {
    updateNestedState('data.personal.photo', null);
  };

  useEffect(() => {
    setActiveCvId(propCvId);
  }, [propCvId]);

  const handleSave = useCallback(async () => {
    // Find template ID based on key
    const currentTemplate = availableTemplates.find(t => t.key === cvData.templateKey);
    const templateIdToSave = currentTemplate?._id || cvData.templateId;

    if (!activeCvId) {
      try {
        const res = await api.post('/cv', {
          title: cvData.data.personal.firstName ? `${cvData.data.personal.firstName}'s CV` : 'New CV',
          data: cvData.data,
          settings: cvData.settings,
          templateId: templateIdToSave
        });
        if (res.data?._id) {
          setActiveCvId(res.data._id);
        }
        setIsSaved(true);
      } catch (err) {
        console.error("Error creating CV:", err);
      }
    } else {
      try {
        await api.put(`/cv/${activeCvId}`, {
          data: cvData.data,
          settings: cvData.settings,
          title: cvData.title,
          templateId: templateIdToSave
        });
        setIsSaved(true);
      } catch (err) {
        console.error("Error updating CV:", err);
      }
    }
  }, [activeCvId, cvData.data, cvData.settings, cvData.title, cvData.templateKey, cvData.templateId, availableTemplates]);

  useEffect(() => {
    if (!isSaved) {
      const timer = setTimeout(() => {
        handleSave();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [handleSave, isSaved]);

  const updateNestedState = (path, value) => {
    setIsSaved(false);
    const keys = path.split('.');
    setCvData(prev => {
      const newState = { ...prev };
      let current = newState;
      for (let i = 0; i < keys.length - 1; i++) {
        current[keys[i]] = { ...current[keys[i]] };
        current = current[keys[i]];
      }
      current[keys[keys.length - 1]] = value;
      return newState;
    });
  };

  const confirmDeleteCategory = () => {
    const { section, index } = deleteModal;
    if (section && index !== null) {
      const newList = cvData.data[section].filter((_, i) => i !== index);
      updateNestedState(`data.${section}`, newList);
      if (showNotify) {
         showNotify(`${deleteModal.title} deleted successfully!`, 'success');
      }
    }
    setDeleteModal({ isOpen: false, section: null, index: null, title: '' });
  };

  const cancelDeleteCategory = () => {
    setDeleteModal({ isOpen: false, section: null, index: null, title: '' });
  };

  const handleDownload = async () => {
    if (!activeCvId) {
        if (showNotify) showNotify('Please wait for the CV to save or enter some details first.', 'info');
        await handleSave();
        return;
    }

    try {
      if (showNotify) showNotify('Generating PDF...', 'info');
      
      const response = await api.get(`/cv/export/${activeCvId}`, {
        responseType: 'blob'
      });
      
      // Safety check for backend error hidden in a blob
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

      const url = window.URL.createObjectURL(response.data);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${cvData.title || 'CV'}.pdf`);
      document.body.appendChild(link);
      link.click();
      
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      if (showNotify) showNotify('PDF downloaded successfully!', 'success');
    } catch (err) {
      console.error("Error downloading CV:", err);
      if (showNotify) {
        showNotify("Failed to download PDF. Please try again.", "error");
      }
    }
  };

  const addItem = (section) => {
    const newItem = section === 'experience' ? { title: '', company: '', startDate: '', endDate: '', current: false, description: '' }
               : section === 'education' ? { school: '', degree: '', startDate: '', endDate: '', description: '' }
               : section === 'skills' ? ''
               : section === 'languages' ? { name: '', level: 'Native' }
               : section === 'projects' ? { name: '', description: '', url: '' }
               : section === 'links' ? { name: '', url: '' }
               : section === 'hobbies' ? { name: '' }
               : section === 'volunteering' ? { role: '', organization: '', description: '' }
               : section === 'courses' ? { name: '', institution: '' }
               : section === 'military' ? { role: '', organization: '' }
               : section === 'references' ? { name: '', contact: '' }
               : section === 'gdpr' ? { text: 'I hereby give consent for my personal data included in the application to be processed for the purposes of the recruitment process in accordance with Art. 6 paragraph 1 letter a of the Regulation of the European Parliament and of the Council (EU) 2016/679 of 27 April 2016 on the protection of natural persons with regard to the processing of personal data and on the free movement of such data, and repealing Directive 95/46/EC (General Data Protection Regulation).' }
               : null;

    if (newItem !== null) {
      const currentList = cvData.data[section] || [];
      updateNestedState(`data.${section}`, [...currentList, newItem]);
    }
  };

  const updateItem = (section, index, field, value) => {
    const newList = [...cvData.data[section]];
    if (field === null) {
      newList[index] = value;
    } else {
      newList[index] = { ...newList[index], [field]: value };
    }
    updateNestedState(`data.${section}`, newList);
  };

  const removeItem = (section, index, title = 'Item') => {
    setDeleteModal({ isOpen: true, section, index, title });
  };

  const toggleSection = (section) => {
    setActiveSection(activeSection === section ? null : section);
  };

  // Predefined colors for design mode
  const PRESET_COLORS = [
    '#2563eb', '#dc2626', '#16aec0', '#7c3aed', '#db2777', '#f59e0b', '#10b981', '#1f2937'
  ];

  if (loading) return <div className="cv-loading">Loading Editor...</div>;
  
  if (isPrintMode) {
    return (
      <div className="cv-print-only">
        <TemplateRenderer 
          templateKey={cvData.templateKey}
          data={cvData.data}
          settings={cvData.settings}
        />
      </div>
    );
  }

  return (
    <div className={`cv-editor-design ${viewMode === 'design' ? 'mode-design' : 'mode-content'}`}>
      <div className="editor-global-header">
        <div className="header-left">
          {viewMode === 'content' ? (
            <div className="cv-title-display">
              <span className="title-label">Editing:</span>
              <input 
                 className="title-edit-input" 
                 value={cvData.title} 
                 onChange={(e) => updateNestedState('title', e.target.value)}
              />
            </div>
          ) : (
            <button className="btn-edit-resume" onClick={() => setViewMode('content')}>
              <ChevronLeft size={18} />
              <span>Edit Resume</span>
            </button>
          )}
        </div>

        <div className="header-center-actions">
          {viewMode === 'content' && (
            <button 
              className="template-toggle-btn-top" 
              onClick={() => setViewMode('design')} 
            >
              <Layout size={18} />
              <span>Templates</span>
            </button>
          )}
          <button className="download-btn-red" onClick={handleDownload}>
            <Download size={18} />
            <span>PDF</span>
          </button>
        </div>

        <div className="header-right">
          <button className="exit-editor-btn" onClick={onBack} title="Exit">
            <X size={20} />
          </button>
        </div>
      </div>

      <div className="editor-main-split">
        {/* Sidebar Logic */}
        <aside className={`editor-sidebar-forms ${viewMode === 'design' ? 'design-mode-active' : ''}`}>
          
          {viewMode === 'content' ? (
            /* CONTENT MODE SIDEBAR */
            <div className="forms-content-wrapper">
              
              {/* Personal Details */}
              <div className="form-section-card">
                <button className="section-trigger" onClick={() => toggleSection('personal')}>
                  <div className="section-title-box">
                    <User size={20} color="#6366f1" />
                    <span>Personal Details</span>
                  </div>
                  {activeSection === 'personal' ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </button>
                {activeSection === 'personal' && (
                  <div className="section-content-inner">
                    {/* Photo Upload Row - Always visible, upload restricted to premium (Creative only) */}
                    <div className="photo-upload-container" style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '20px' }}>
                      <div className="photo-preview-box" style={{ 
                        width: '80px', 
                        height: '80px', 
                        borderRadius: '50%', 
                        background: '#f1f5f9', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        overflow: 'hidden',
                        border: '2px solid #e2e8f0',
                        opacity: cvData.templateKey === 'creative' ? 1 : 0.6
                      }}>
                        {cvData.data.personal.photo ? (
                          <img src={cvData.data.personal.photo} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <User size={40} color="#94a3b8" />
                        )}
                      </div>
                      <div className="photo-actions">
                        {cvData.templateKey === 'creative' ? (
                          <>
                            <label className="upload-btn-ghost" style={{ cursor: 'pointer', display: 'inline-flex' }}>
                              <Camera size={16} />
                              <span style={{ marginLeft: '8px' }}>{cvData.data.personal.photo ? 'Change Photo' : 'Upload Photo'}</span>
                              <input type="file" hidden accept="image/*" onChange={handlePhotoUpload} />
                            </label>
                            {cvData.data.personal.photo && (
                              <button onClick={removePhoto} style={{ marginLeft: '12px', background: 'transparent', border: 'none', color: '#ef4444', fontSize: '0.85rem', cursor: 'pointer' }}>
                                Remove
                              </button>
                            )}
                            <p style={{ margin: '8px 0 0 0', fontSize: '0.75rem', color: '#64748b' }}>JPG or PNG. Max size 2MB.</p>
                          </>
                        ) : (
                          <>
                            <button className="upload-btn-ghost" disabled style={{ cursor: 'not-allowed', display: 'inline-flex', opacity: 0.5 }}>
                              <Camera size={16} />
                              <span style={{ marginLeft: '8px' }}>Upload Photo</span>
                            </button>
                            <p style={{ margin: '8px 0 0 0', fontSize: '0.75rem', color: '#64748b' }}>This template does not support photo upload</p>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="form-grid">
                      <div className="form-group">
                        <label className="form-label">First Name</label>
                        <input 
                          className="form-input" 
                          value={cvData.data.personal.firstName} 
                          onChange={(e) => updateNestedState('data.personal.firstName', e.target.value)}
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Last Name</label>
                        <input 
                          className="form-input" 
                          value={cvData.data.personal.lastName} 
                          onChange={(e) => updateNestedState('data.personal.lastName', e.target.value)}
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Job Title</label>
                        <input 
                          className="form-input" 
                          value={cvData.data.personal.jobTitle} 
                          onChange={(e) => updateNestedState('data.personal.jobTitle', e.target.value)}
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Email</label>
                        <input 
                          className="form-input" 
                          value={cvData.data.personal.email} 
                          onChange={(e) => updateNestedState('data.personal.email', e.target.value)}
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Phone</label>
                        <input 
                          className="form-input" 
                          value={cvData.data.personal.phone} 
                          onChange={(e) => updateNestedState('data.personal.phone', e.target.value)}
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Location</label>
                        <input 
                          className="form-input" 
                          value={cvData.data.personal.location} 
                          onChange={(e) => updateNestedState('data.personal.location', e.target.value)}
                        />
                      </div>
                      
                      {showMoreDetails && (
                        <>
                          <div className="form-group">
                            <label className="form-label">City</label>
                            <input 
                              className="form-input" 
                              value={cvData.data.personal.city} 
                              onChange={(e) => updateNestedState('data.personal.city', e.target.value)}
                            />
                          </div>
                          <div className="form-group">
                            <label className="form-label">Country</label>
                            <input 
                              className="form-input" 
                              value={cvData.data.personal.country} 
                              onChange={(e) => updateNestedState('data.personal.country', e.target.value)}
                            />
                          </div>
                          <div className="form-group">
                            <label className="form-label">Address</label>
                            <input 
                              className="form-input" 
                              value={cvData.data.personal.address} 
                              onChange={(e) => updateNestedState('data.personal.address', e.target.value)}
                            />
                          </div>
                          <div className="form-group">
                            <label className="form-label">Zip Code</label>
                            <input 
                              className="form-input" 
                              value={cvData.data.personal.zipCode} 
                              onChange={(e) => updateNestedState('data.personal.zipCode', e.target.value)}
                            />
                          </div>
                          <div className="form-group">
                            <label className="form-label">ID Number</label>
                            <input 
                              className="form-input" 
                              value={cvData.data.personal.idNumber} 
                              onChange={(e) => updateNestedState('data.personal.idNumber', e.target.value)}
                            />
                          </div>
                          <div className="form-group">
                            <label className="form-label">Birth Date</label>
                            <input 
                              type="date"
                              className="form-input" 
                              value={cvData.data.personal.birthDate} 
                              onChange={(e) => updateNestedState('data.personal.birthDate', e.target.value)}
                            />
                          </div>
                          <div className="form-group">
                            <label className="form-label">Nationality</label>
                            <input 
                              className="form-input" 
                              value={cvData.data.personal.nationality} 
                              onChange={(e) => updateNestedState('data.personal.nationality', e.target.value)}
                            />
                          </div>
                          <div className="form-group">
                            <label className="form-label">Driver's License</label>
                            <input 
                              className="form-input" 
                              value={cvData.data.personal.driversLicense} 
                              onChange={(e) => updateNestedState('data.personal.driversLicense', e.target.value)}
                            />
                          </div>
                        </>
                      )}
                    </div>

                    <button 
                      className="text-btn-toggle" 
                      onClick={() => setShowMoreDetails(!showMoreDetails)}
                      style={{ 
                        background: 'transparent', 
                        border: 'none', 
                        color: '#6366f1', 
                        fontWeight: '600', 
                        cursor: 'pointer', 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '8px',
                        marginTop: '16px',
                        padding: '0'
                      }}
                    >
                      {showMoreDetails ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                      <span>{showMoreDetails ? 'Less Details' : 'More Details'}</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Professional Summary */}
              <div className="form-section-card">
                <button className="section-trigger" onClick={() => toggleSection('summary')}>
                  <div className="section-title-box">
                    <FileText size={20} color="#6366f1" />
                    <span>Professional Summary</span>
                  </div>
                  {activeSection === 'summary' ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </button>
                {activeSection === 'summary' && (
                  <div className="section-content-inner">
                    <div className="form-group full-width">
                      <RichTextEditor 
                        value={cvData.data.personal.summary} 
                        onChange={(val) => updateNestedState('data.personal.summary', val)}
                        placeholder="Write a professional summary..."
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Experience */}
              <div className="form-section-card">
                <button className="section-trigger" onClick={() => toggleSection('experience')}>
                  <div className="section-title-box">
                    <Briefcase size={20} color="#6366f1" />
                    <span>Work Experience</span>
                  </div>
                  {activeSection === 'experience' ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </button>
                {activeSection === 'experience' && (
                  <div className="section-content-inner">
                    {cvData.data.experience.map((exp, idx) => (
                      <div key={idx} className="card-item-wrapper">
                        <button className="btn-remove-item" onClick={() => removeItem('experience', idx, exp.title || 'Experience')}>
                          <Trash2 size={16} />
                        </button>
                        <div className="form-grid">
                          <div className="form-group">
                            <label className="form-label">Position</label>
                            <input 
                              className="form-input" 
                              value={exp.title} 
                              onChange={(e) => updateItem('experience', idx, 'title', e.target.value)}
                            />
                          </div>
                          <div className="form-group">
                            <label className="form-label">Company</label>
                            <input 
                              className="form-input" 
                              value={exp.company} 
                              onChange={(e) => updateItem('experience', idx, 'company', e.target.value)}
                            />
                          </div>
                          <div className="form-group">
                            <label className="form-label">Start Date</label>
                            <input 
                              type="date"
                              className="form-input" 
                              value={exp.startDate} 
                              onChange={(e) => updateItem('experience', idx, 'startDate', e.target.value)}
                            />
                          </div>
                          <div className="form-group">
                            <label className="form-label">End Date</label>
                            <input 
                              type="date"
                              className="form-input" 
                              value={exp.endDate} 
                              disabled={exp.current}
                              onChange={(e) => updateItem('experience', idx, 'endDate', e.target.value)}
                            />
                          </div>
                        </div>
                        <div className="form-group" style={{ marginTop: '12px' }}>
                          <label className="form-label">Description</label>
                          <RichTextEditor 
                            value={exp.description} 
                            onChange={(val) => updateItem('experience', idx, 'description', val)}
                            placeholder="Describe your responsibilities and achievements..."
                          />
                        </div>
                      </div>
                    ))}
                    <button className="btn-add-section" onClick={() => addItem('experience')}>
                      <Plus size={18} />
                      <span>Add Experience</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Education */}
              <div className="form-section-card">
                <button className="section-trigger" onClick={() => toggleSection('education')}>
                  <div className="section-title-box">
                    <GraduationCap size={20} color="#6366f1" />
                    <span>Education</span>
                  </div>
                  {activeSection === 'education' ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </button>
                {activeSection === 'education' && (
                  <div className="section-content-inner">
                    {cvData.data.education.map((edu, idx) => (
                      <div key={idx} className="card-item-wrapper">
                        <button className="btn-remove-item" onClick={() => removeItem('education', idx, edu.school || 'Education')}>
                          <Trash2 size={16} />
                        </button>
                        <div className="form-grid">
                          <div className="form-group">
                            <label className="form-label">Degree</label>
                            <input 
                              className="form-input" 
                              value={edu.degree} 
                              onChange={(e) => updateItem('education', idx, 'degree', e.target.value)}
                            />
                          </div>
                          <div className="form-group">
                            <label className="form-label">School</label>
                            <input 
                              className="form-input" 
                              value={edu.school} 
                              onChange={(e) => updateItem('education', idx, 'school', e.target.value)}
                            />
                          </div>
                          <div className="form-group">
                            <label className="form-label">Start Date</label>
                            <input 
                              type="date"
                              className="form-input" 
                              value={edu.startDate} 
                              onChange={(e) => updateItem('education', idx, 'startDate', e.target.value)}
                            />
                          </div>
                          <div className="form-group">
                            <label className="form-label">End Date</label>
                            <input 
                              type="date"
                              className="form-input" 
                              value={edu.endDate} 
                              onChange={(e) => updateItem('education', idx, 'endDate', e.target.value)}
                            />
                          </div>
                        </div>
                        <div className="form-group" style={{ marginTop: '12px' }}>
                          <label className="form-label">Description</label>
                          <RichTextEditor 
                            value={edu.description} 
                            onChange={(val) => updateItem('education', idx, 'description', val)}
                            placeholder="Describe your studies and achievements..."
                          />
                        </div>
                      </div>
                    ))}
                    <button className="btn-add-section" onClick={() => addItem('education')}>
                      <Plus size={18} />
                      <span>Add Education</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Skills */}
              <div className="form-section-card">
                <button className="section-trigger" onClick={() => toggleSection('skills')}>
                  <div className="section-title-box">
                    <Code size={20} color="#6366f1" />
                    <span>Skills</span>
                  </div>
                  {activeSection === 'skills' ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </button>
                {activeSection === 'skills' && (
                  <div className="section-content-inner">
                    <div className="skill-tags-input">
                      {cvData.data.skills.map((skill, idx) => (
                        <div key={idx} className="skill-input-row" style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                          <input 
                            className="form-input" 
                            value={skill} 
                            onChange={(e) => updateItem('skills', idx, null, e.target.value)}
                          />
                          <button className="action-btn delete" onClick={() => removeItem('skills', idx, skill || 'Skill')}>
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                    <button className="btn-add-section" onClick={() => addItem('skills')}>
                      <Plus size={18} />
                      <span>Add Skill</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Dynamic Sections rendering */}
                {Object.keys(cvData.data).map(key => {
                  if (['personal', 'experience', 'education', 'skills', 'gdpr'].includes(key)) return null;
                  if (!cvData.data[key] || cvData.data[key].length === 0) return null;

                  const sectionTitles = {
                    languages: { icon: Globe, title: 'Languages', itemFields: ['name', 'level'] },
                    volunteering: { icon: Heart, title: 'Volunteering', itemFields: ['role', 'organization', 'description'] },
                    courses: { icon: GraduationCap, title: 'Courses', itemFields: ['name', 'institution'] },
                    military: { icon: Briefcase, title: 'Military Service', itemFields: ['role', 'organization'] },
                    links: { icon: Globe, title: 'Links', itemFields: ['name', 'url'] },
                    hobbies: { icon: Heart, title: 'Hobbies', itemFields: ['name'] },
                    references: { icon: User, title: 'References', itemFields: ['name', 'contact'] }
                  };

                  const config = sectionTitles[key];
                  if (!config) return null;
                  const Icon = config.icon;

                  return (
                    <div key={key} className="form-section-card">
                      <button className="section-trigger" onClick={() => toggleSection(key)}>
                        <div className="section-title-box">
                          <Icon size={20} color="#6366f1" />
                          <span>{config.title}</span>
                        </div>
                        {activeSection === key ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                      </button>
                      {activeSection === key && (
                        <div className="section-content-inner">
                          {cvData.data[key].map((item, idx) => (
                            <div key={idx} className="card-item-wrapper">
                              <button className="btn-remove-item" onClick={() => removeItem(key, idx, item[config.itemFields[0]] || config.title)}>
                                <Trash2 size={16} />
                              </button>
                              <div className="form-grid">
                                {config.itemFields.map(field => (
                                  <div key={field} className={field === 'description' ? "form-group full" : "form-group"}>
                                    <label className="form-label">{field.charAt(0).toUpperCase() + field.slice(1)}</label>
                                    {field === 'description' ? (
                                      <RichTextEditor 
                                        value={item[field] || ''} 
                                        onChange={(val) => updateItem(key, idx, field, val)}
                                        placeholder={`Describe your ${config.title.toLowerCase()}...`}
                                      />
                                    ) : (
                                      <input 
                                        className="form-input" 
                                        value={item[field] || ''} 
                                        onChange={(e) => updateItem(key, idx, field, e.target.value)}
                                      />
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                          <button className="btn-add-section" onClick={() => addItem(key)}>
                            <Plus size={18} />
                            <span>Add {config.title}</span>
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}

              {/* GDPR Section */}
              {cvData.data.gdpr && cvData.data.gdpr.length > 0 && (
                <div className="form-section-card">
                  <button className="section-trigger" onClick={() => toggleSection('gdpr')}>
                    <div className="section-title-box">
                      <CheckCircle size={20} color="#6366f1" />
                      <span>GDPR</span>
                    </div>
                    {activeSection === 'gdpr' ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                  </button>
                  {activeSection === 'gdpr' && (
                    <div className="section-content-inner">
                      {cvData.data.gdpr.map((item, idx) => (
                        <div key={idx} className="card-item-wrapper">
                          <button className="btn-remove-item" onClick={() => removeItem('gdpr', idx, 'GDPR')}>
                            <Trash2 size={16} />
                          </button>
                          
                          <div className="rich-text-editor-wrapper">
                            <RichTextEditor 
                              value={item.text} 
                              onChange={(val) => updateItem('gdpr', idx, 'text', val)}
                              placeholder="Enter your GDPR consent text here..."
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}


              {/* Add Category Section */}
              <div className="add-category-section" style={{ marginTop: '24px', padding: '0 10px 40px 10px' }}>
                <h4 style={{ fontSize: '0.9rem', fontWeight: 600, color: '#334155', marginBottom: '12px' }}>Add Category</h4>
                <div className="category-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                   
                   <button className="cat-btn-add" disabled={cvData.data.languages && cvData.data.languages.length > 0} onClick={() => addItem('languages')}>
                      <Globe size={18} />
                      <span>Languages</span>
                   </button>

                   <button className="cat-btn-add" disabled={cvData.data.volunteering && cvData.data.volunteering.length > 0} onClick={() => addItem('volunteering')}>
                      <Heart size={18} />
                      <span>Volunteering</span>
                   </button>
                   
                   <button className="cat-btn-add" disabled={cvData.data.courses && cvData.data.courses.length > 0} onClick={() => addItem('courses')}>
                      <GraduationCap size={18} />
                      <span>Courses</span>
                   </button>

                   <button className="cat-btn-add" disabled={cvData.data.military && cvData.data.military.length > 0} onClick={() => addItem('military')}>
                      <Briefcase size={18} />
                      <span>Military Service</span>
                   </button>

                   <button className="cat-btn-add" disabled={cvData.data.links && cvData.data.links.length > 0} onClick={() => addItem('links')}>
                      <Globe size={18} />
                      <span>Links</span>
                   </button>

                   <button className="cat-btn-add" disabled={cvData.data.hobbies && cvData.data.hobbies.length > 0} onClick={() => addItem('hobbies')}>
                      <Heart size={18} />
                      <span>Hobbies</span>
                   </button>

                   <button className="cat-btn-add" disabled={cvData.data.references && cvData.data.references.length > 0} onClick={() => addItem('references')}>
                      <User size={18} />
                      <span>References</span>
                   </button>
                   
                   <button className="cat-btn-add" disabled={cvData.data.gdpr && cvData.data.gdpr.length > 0} onClick={() => addItem('gdpr')}>
                      <CheckCircle size={18} />
                      <span>GDPR</span>
                   </button>

                </div>
              </div>
            </div>

          ) : (
            /* DESIGN MODE SIDEBAR */
            <div className="sidebar-design-content">


              <div className="design-sections-scrollable">
                
                <div className="design-group-sidebar">
                   <div className="design-label-row line-spacing-row">
                      <label>
                        Line Spacing ({(() => {
                          const val = parseInt(cvData.settings?.lineSpacing);
                          return isNaN(val) ? 100 : val;
                        })()}%)
                      </label>
                      <div className="spacing-icons">
                         <button 
                           onClick={() => {
                             const current = parseInt(cvData.settings?.lineSpacing) || 100;
                             updateNestedState('settings.lineSpacing', Math.max(80, current - 10));
                           }}
                           className="spacing-btn"
                           type="button"
                         >
                           <Minus size={18} />
                         </button>
                         <Type size={20} color="#94a3b8" />
                         <button 
                           onClick={() => {
                             const current = parseInt(cvData.settings?.lineSpacing) || 100;
                             updateNestedState('settings.lineSpacing', Math.min(200, current + 10));
                           }}
                           className="spacing-btn"
                           type="button"
                         >
                           <Plus size={18} />
                         </button>
                      </div>
                   </div>
                </div>

                {/* 2. Colors */}
                <div className="design-group-sidebar">
                  <div className="design-label-row">
                    <label>Accent Color</label>
                    <span style={{color: cvData.settings.themeColor, fontWeight: 600, fontSize: '0.8rem'}}>{cvData.settings.themeColor}</span>
                  </div>
                  <div className="color-circles-sidebar">
                     {PRESET_COLORS.map(color => (
                        <button
                          key={color}
                          className={`color-circle-mini ${cvData.settings.themeColor === color ? 'active' : ''}`}
                          style={{backgroundColor: color}}
                          onClick={() => updateNestedState('settings.themeColor', color)}
                        >
                           {cvData.settings.themeColor === color && <Check size={14} color="white" />}
                        </button>
                     ))}
                     <div className="custom-picker-sidebar">
                       <input 
                         type="color" 
                         value={cvData.settings.themeColor}
                         onChange={(e) => updateNestedState('settings.themeColor', e.target.value)}
                         style={{opacity: 0, position: 'absolute', width: '100%', height: '100%', cursor: 'pointer'}}
                       />
                       <Palette size={14} color="#64748b" />
                     </div>
                  </div>
                </div>

                {/* 3. Fonts */}
                <div className="design-group-sidebar">
                  <div className="design-label-row">
                    <label>Typography</label>
                  </div>
                  <div className="font-select-wrapper-sidebar">
                    <select 
                       className="font-select-sidebar"
                       value={cvData.settings.font}
                       onChange={(e) => updateNestedState('settings.font', e.target.value)}
                    >
                       <option value="Inter">Inter (clean)</option>
                       <option value="Roboto">Roboto (Modern)</option>
                       <option value="Merriweather">Merriweather (Serif)</option>
                       <option value="Poppins">Poppins (Geometric)</option>
                    </select>
                    <ChevronDown className="select-arrow-sidebar" size={14} />
                  </div>
                </div>

                {/* 4. Templates */}
                <div className="design-group-sidebar">
                  <div className="design-label-row">
                     <label>Select Template</label>
                  </div>
                  <div className="template-grid-sidebar">
                     {availableTemplates.map(tpl => (
                        <div 
                           key={tpl._id} 
                           className={`tpl-card-sidebar ${cvData.templateKey === tpl.key ? 'active' : ''}`}
                           onClick={() => updateNestedState('templateKey', tpl.key)}
                        >
                           <div className="tpl-thumb-sidebar">
                              <div className="tpl-preview-container">
                                  <TemplateRenderer 
                                    templateKey={tpl.key}
                                    data={SAMPLE_DATA}
                                    settings={cvData.settings}
                                  />
                              </div>
                              {cvData.templateKey === tpl.key && (
                                <div className="tpl-active-overlay">
                                  <div className="active-check-badge">
                                    <Check size={16} strokeWidth={3} />
                                  </div>
                                </div>
                              )}
                           </div>
                           <div className="tpl-name-sidebar">
                             {tpl.name}
                             {tpl.category === 'Premium' && <span className="premium-badge-sidebar" style={{marginLeft: '6px'}}>PRO</span>}
                           </div>
                        </div>
                     ))}
                  </div>
                </div>

              </div>
              
              <div className="editor-footer-info">
                 <Layout size={14} />
                 <span>Customizing: {availableTemplates.find(t => t.key === cvData.templateKey)?.name || 'Modern'}</span>
              </div>
            </div>
          )}
        </aside>

        <main className="editor-preview-pane">
          <div className="preview-scroll-area">
            <div className="preview-scaler">
              <div className="resume-paper-canvas">
                <TemplateRenderer 
                  templateKey={cvData.templateKey} 
                  data={cvData.data} 
                  settings={cvData.settings} 
                />
              </div>
            </div>
          </div>

          {/* Premium Pill - Restored to absolute bottom for discretion */}
          <div className="preview-footer-minimal">
             {isSaved ? (
               <div className="status-saved-text" style={{ display: 'flex', alignItems: 'center', color: '#10b981', gap: '8px' }}>
                 <CheckCircle size={14} strokeWidth={3} />
                 <span>Saved</span>
               </div>
             ) : (
               <div className="status-saved-text" style={{ color: '#cbd5e1' }}>
                 <span>Saving...</span>
               </div>
             )}
             <div className="pagination-text" style={{ marginLeft: '8px', paddingLeft: '8px', borderLeft: '1px solid rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center' }}>
                <span style={{ color: '#cbd5e1', fontWeight: 500 }}>Page 1 / 1</span>
             </div>
          </div>
        </main>
      </div>

      <DeleteConfirmationModal 
        isOpen={deleteModal.isOpen}
        onClose={cancelDeleteCategory}
        onConfirm={confirmDeleteCategory}
        applicationName={deleteModal.title}
        itemType="category"
        message={`Are you sure you want to delete this ${deleteModal.title}?`}
      />
      
      {/* MOBILE DESIGN DRAWER */}
      <div className={`mobile-design-drawer ${viewMode === 'design' ? 'open' : ''}`}>
        <div className="drawer-header" onClick={() => setViewMode('content')}>
          <ChevronDown size={22} />
          <span>Templates</span>
        </div>
        
        <div className="drawer-content">
           {/* 1. Spacing */}
            <div className="drawer-section">
               <div className="drawer-label-row">
                  <label>
                    Line Spacing ({(() => {
                      const val = parseInt(cvData.settings?.lineSpacing);
                      return isNaN(val) ? 100 : val;
                    })()}%)
                  </label>
                  <div className="compact-spacing-controls">
                     <button 
                       onClick={() => {
                         const current = parseInt(cvData.settings?.lineSpacing) || 100;
                         updateNestedState('settings.lineSpacing', Math.max(80, current - 10));
                       }}
                       className="spacing-btn"
                     >
                       <Minus size={18} />
                     </button>
                     <Type size={20} color="#94a3b8" />
                     <button 
                       onClick={() => {
                         const current = parseInt(cvData.settings?.lineSpacing) || 100;
                         updateNestedState('settings.lineSpacing', Math.min(200, current + 10));
                       }}
                       className="spacing-btn"
                     >
                       <Plus size={18} />
                     </button>
                  </div>
               </div>
            </div>

           {/* 2. Colors */}
           <div className="drawer-section">
             <div className="drawer-label-row">
               <label>Accent Color</label>
               <span style={{fontSize: '0.75rem', color: '#6366f1', fontWeight: '600'}}>{cvData.settings.themeColor}</span>
             </div>
             <div className="drawer-color-row">
                {PRESET_COLORS.map(color => (
                   <button
                     key={color}
                     className={`color-circle-mini ${cvData.settings.themeColor === color ? 'active' : ''}`}
                     style={{backgroundColor: color}}
                     onClick={() => updateNestedState('settings.themeColor', color)}
                   >
                      {cvData.settings.themeColor === color && <Check size={14} color="white" />}
                   </button>
                ))}
                <div className="custom-picker-sidebar">
                  <input 
                    type="color" 
                    value={cvData.settings.themeColor}
                    onChange={(e) => updateNestedState('settings.themeColor', e.target.value)}
                    style={{opacity: 0, position: 'absolute', width: '100%', height: '100%', cursor: 'pointer'}}
                  />
                  <Palette size={14} color="#64748b" />
                </div>
             </div>
           </div>

           {/* 3. Templates (Horizontal Scroll) */}
           <div className="drawer-section no-border">
             <div className="drawer-label-row">
                <label>Select Template</label>
             </div>
             <div className="drawer-template-list">
                {availableTemplates.map(tpl => (
                   <div 
                      key={tpl._id} 
                      className={`drawer-tpl-card ${cvData.templateKey === tpl.key ? 'active' : ''}`}
                      onClick={() => updateNestedState('templateKey', tpl.key)}
                   >
                      <div className="drawer-tpl-thumb">
                          <div className="drawer-preview-scaler">
                              <TemplateRenderer 
                                templateKey={tpl.key}
                                data={SAMPLE_DATA}
                                settings={cvData.settings}
                              />
                          </div>
                          {cvData.templateKey === tpl.key && (
                            <div className="tpl-active-overlay">
                              <div className="active-check-badge">
                                <Check size={16} strokeWidth={3} />
                              </div>
                            </div>
                          )}
                      </div>
                      <span className="drawer-tpl-name">{tpl.name}</span>
                   </div>
                ))}
             </div>
           </div>
        </div>
      </div>

      {/* MOBILE FLOATING BUTTON */}
      {viewMode === 'content' && (
        <button 
          className="mobile-floating-templates-btn"
          onClick={() => setViewMode('design')}
        >
          <ChevronUp size={18} />
          <span>Templates</span>
        </button>
      )}

    </div>
  );
};

export default Editor;