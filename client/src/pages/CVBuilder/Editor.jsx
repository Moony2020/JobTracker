import React, { useState, useEffect, useCallback } from 'react';
import { 
  X, ChevronDown, ChevronUp, Save, Layout, Palette, Type, 
  User, Briefcase, GraduationCap, Globe, Code, Heart, 
  Plus, Trash2, Download, Eye, FileText, CheckCircle,
  ArrowLeft, Check, HelpCircle, ChevronLeft
} from 'lucide-react';
import './CVBuilder.css';
import api from '../../services/api';
import TemplateRenderer from './Templates/TemplateRenderer';

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

const Editor = ({ cvId, onBack, language }) => {
  const [loading, setLoading] = useState(cvId ? true : false);
  const [viewMode, setViewMode] = useState('content'); // 'content' or 'design'
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
        photo: null
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
      references: []
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

  // Fetch CV data if editing
  useEffect(() => {
    const init = async () => {
      try {
        const tplRes = await api.get('/cv/templates');
        setAvailableTemplates(tplRes.data);
        
        if (cvId) {
          const res = await api.get(`/cv/${cvId}`);
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
                references: res.data.data?.references || []
              },
              settings: res.data.settings || { themeColor: '#2563eb', font: 'Inter', lineSpacing: 100 },
              templateKey: res.data.templateId?.key || 'modern'
            };
            setCvData(normalizedData);
          }
        } else {
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
        console.error("Error initializing editor:", err);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [cvId]);

  const handleSave = async () => {
    // Find template ID based on key
    const currentTemplate = availableTemplates.find(t => t.key === cvData.templateKey);
    const templateIdToSave = currentTemplate?._id || cvData.templateId;

    if (!cvId) {
      try {
        await api.post('/cv', {
          title: cvData.data.personal.firstName ? `${cvData.data.personal.firstName}'s CV` : 'New CV',
          data: cvData.data,
          settings: cvData.settings,
          templateId: templateIdToSave
        });
        setIsSaved(true);
      } catch (err) {
        console.error("Error creating CV:", err);
      }
    } else {
      try {
        await api.put(`/cv/${cvId}`, {
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
  };

  useEffect(() => {
    if (!isSaved) {
      const timer = setTimeout(() => {
        handleSave();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [cvData, isSaved]);

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

  const removeItem = (section, index) => {
    const newList = cvData.data[section].filter((_, i) => i !== index);
    updateNestedState(`data.${section}`, newList);
  };

  const toggleSection = (section) => {
    setActiveSection(activeSection === section ? null : section);
  };

  // Predefined colors for design mode
  const PRESET_COLORS = [
    '#2563eb', '#dc2626', '#16aec0', '#7c3aed', '#db2777', '#f59e0b', '#10b981', '#1f2937'
  ];

  if (loading) return <div className="cv-loading">Loading Editor...</div>;

  return (
    <div className={`cv-editor-design ${viewMode === 'design' ? 'mode-design' : 'mode-content'}`}>
      <div className="editor-global-header">
        <div className="header-left">
          {viewMode === 'content' && (
            <>
              <button className="exit-editor-btn" onClick={onBack} title="Exit">
                 <X size={20} />
              </button>
              <div className="header-divider"></div>
            </>
          )}
          {viewMode === 'content' ? (
             <div className="cv-title-display">
               <span style={{color: '#94a3b8'}}>Editing:</span>
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
        <div className="header-right">
          {viewMode === 'content' ? (
            <button className="template-toggle-btn-top" onClick={() => setViewMode('design')}>
              <Layout size={18} />
              <span>Design & Templates</span>
            </button>
          ) : null}
          <button className="download-btn-red" onClick={() => window.print()}>
            <Download size={18} />
            <span>PDF</span>
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
                      <div className="form-group" style={{ gridColumn: 'span 2' }}>
                        <label className="form-label">Job Title</label>
                        <input 
                          className="form-input" 
                          value={cvData.data.personal.jobTitle} 
                          onChange={(e) => updateNestedState('data.personal.jobTitle', e.target.value)}
                        />
                      </div>
                      <div className="form-group" style={{ gridColumn: 'span 2' }}>
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
                    </div>
                    <div className="form-group" style={{ marginTop: '20px' }}>
                      <label className="form-label">Professional Summary</label>
                      <textarea 
                        className="form-input" 
                        rows="4" 
                        value={cvData.data.personal.summary} 
                        onChange={(e) => updateNestedState('data.personal.summary', e.target.value)}
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
                        <button className="btn-remove-item" onClick={() => removeItem('experience', idx)}>
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
                              className="form-input" 
                              value={exp.startDate} 
                              onChange={(e) => updateItem('experience', idx, 'startDate', e.target.value)}
                            />
                          </div>
                          <div className="form-group">
                            <label className="form-label">End Date</label>
                            <input 
                              className="form-input" 
                              value={exp.endDate} 
                              disabled={exp.current}
                              onChange={(e) => updateItem('experience', idx, 'endDate', e.target.value)}
                            />
                          </div>
                        </div>
                        <div className="form-group" style={{ marginTop: '12px' }}>
                          <label className="form-label">Description</label>
                          <textarea 
                            className="form-input" 
                            rows="3" 
                            value={exp.description} 
                            onChange={(e) => updateItem('experience', idx, 'description', e.target.value)}
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
                        <button className="btn-remove-item" onClick={() => removeItem('education', idx)}>
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
                              className="form-input" 
                              value={edu.startDate} 
                              onChange={(e) => updateItem('education', idx, 'startDate', e.target.value)}
                            />
                          </div>
                          <div className="form-group">
                            <label className="form-label">End Date</label>
                            <input 
                              className="form-input" 
                              value={edu.endDate} 
                              onChange={(e) => updateItem('education', idx, 'endDate', e.target.value)}
                            />
                          </div>
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
                          <button className="action-btn delete" onClick={() => removeItem('skills', idx)}>
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
                  if (['personal', 'experience', 'education', 'skills'].includes(key)) return null;
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
                              <button className="btn-remove-item" onClick={() => removeItem(key, idx)}>
                                <Trash2 size={16} />
                              </button>
                              <div className="form-grid">
                                {config.itemFields.map(field => (
                                  <div key={field} className="form-group">
                                    <label className="form-label">{field.charAt(0).toUpperCase() + field.slice(1)}</label>
                                    <input 
                                      className="form-input" 
                                      value={item[field] || ''} 
                                      onChange={(e) => updateItem(key, idx, field, e.target.value)}
                                    />
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
                   
                   <button className="cat-btn-add" disabled style={{ opacity: 0.5, cursor: 'not-allowed' }}>
                      <CheckCircle size={18} />
                      <span>GDPR</span>
                   </button>

                   <button className="cat-btn-add" disabled style={{ opacity: 0.5, cursor: 'not-allowed' }}>
                      <Plus size={18} />
                      <span>Custom</span>
                   </button>

                </div>
              </div>
            </div>

          ) : (
            /* DESIGN MODE SIDEBAR */
            <div className="sidebar-design-content">


              <div className="design-sections-scrollable">
                
                {/* 1. Spacing */}
                <div className="design-group-sidebar">
                   <div className="design-label-row">
                      <label>Line Spacing</label>
                      <div className="spacing-icons">
                         <Type size={14} />
                      </div>
                   </div>
                   <input 
                      type="range" 
                      min="80" 
                      max="180" 
                      step="10" 
                      value={cvData.settings.lineSpacing}
                      onChange={(e) => updateNestedState('settings.lineSpacing', parseInt(e.target.value))}
                   />
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
          {/* Centered Footer Pill - Moved inside preview pane for correct absolute positioning */}
          <div className="preview-footer-minimal" style={{ position: 'absolute', bottom: '30px', left: '50%', transform: 'translateX(-50%)', margin: 0 }}>
             {isSaved ? (
               <div className="status-saved-text">
                 <CheckCircle size={14} />
                 <span>Saved</span>
               </div>
             ) : (
               <div className="status-saved-text" style={{ color: '#64748b' }}>
                 <span>Saving...</span>
               </div>
             )}
             <div className="pagination-text" style={{ marginLeft: '12px', paddingLeft: '12px', borderLeft: '1px solid rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ color: '#cbd5e1', fontSize: '0.8rem' }}>Page 1 / 1</span>
             </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Editor;
