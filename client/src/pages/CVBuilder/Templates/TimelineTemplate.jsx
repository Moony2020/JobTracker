import React from 'react';
import { User, Briefcase, GraduationCap, Megaphone, Phone, Mail, MapPin } from 'lucide-react';

const TimelineTemplate = ({ data, settings }) => {
  const { personal, experience, education, skills, languages, references } = data;
  const themeColor = settings?.themeColor || '#2563eb';

  // Helper to check if array has valid items
  const hasItems = (arr) => arr && arr.length > 0;

  return (
    <div className="timeline-template" style={{ '--theme-color': themeColor, fontFamily: settings?.font || 'Inter' }}>
      <div className="timeline-container">
        
        {/* LEFT SIDEBAR */}
        <div className="timeline-sidebar">
          {personal.photo && (
            <div className="sidebar-photo-container" style={{ marginBottom: '30px', textAlign: 'center' }}>
              <img src={personal.photo} alt="Profile" style={{ 
                width: '120px', 
                height: '120px', 
                borderRadius: '8px', 
                objectFit: 'cover',
                border: '1px solid #e2e8f0' 
              }} />
            </div>
          )}
          <div className="sidebar-header">
            <h1 className="name-display">{personal.firstName || 'Your'} {personal.lastName || 'Name'}</h1>
            <p className="job-title-display">{personal.jobTitle || 'Professional Title'}</p>
          </div>

          <div className="sidebar-section">
            <h2 className="sidebar-title">Contact Details</h2>
            <div className="sidebar-contact">
              <div className="contact-item">
                <Mail size={14} />
                <span>{personal.email || 'email@example.com'}</span>
              </div>
              <div className="contact-item">
                <Phone size={14} />
                <span>{personal.phone || '(555) 123-4567'}</span>
              </div>
              {personal.location && (
                <div className="contact-item">
                  <MapPin size={14} />
                  <span>{personal.location}</span>
                </div>
              )}
              {personal.address && (
                <div className="contact-item">
                  <MapPin size={12} />
                  <span>{personal.address}</span>
                </div>
              )}
              {(personal.city || personal.country) && (
                <div className="contact-item">
                  <Globe size={12} />
                  <span>{[personal.city, personal.country].filter(Boolean).join(', ')}</span>
                </div>
              )}
              {personal.zipCode && (
                <div className="contact-item">
                  <span style={{ fontSize: '10px', fontWeight: 'bold' }}>ZIP</span>
                  <span>{personal.zipCode}</span>
                </div>
              )}
              <div className="extra-sidebar-info" style={{ marginTop: '10px', fontSize: '0.75rem', opacity: 0.8, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {personal.birthDate && <span>Birth: {personal.birthDate}</span>}
                {personal.nationality && <span>Nationality: {personal.nationality}</span>}
                {personal.idNumber && <span>ID: {personal.idNumber}</span>}
                {personal.driversLicense && <span>License: {personal.driversLicense}</span>}
              </div>
            </div>
          </div>

          {hasItems(skills) && (
            <div className="sidebar-section">
              <h2 className="sidebar-title">Skills</h2>
              <div className="sidebar-list">
                {skills.map((skill, idx) => (
                  <div key={idx} className="sidebar-list-item">{skill}</div>
                ))}
              </div>
            </div>
          )}

          {hasItems(languages) && (
            <div className="sidebar-section">
              <h2 className="sidebar-title">Languages</h2>
              <div className="sidebar-list">
                {languages.map((lang, idx) => (
                  <div key={idx} className="sidebar-list-item">{lang}</div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* TIMELINE LINE & ICONS */}
        <div className="timeline-axis">
          <div className="axis-line"></div>
          
          <div className="axis-point" style={{ top: '65px' }}>
            <div className="icon-box"><User size={20} /></div>
          </div>
          
          <div className="axis-point" style={{ top: '220px' }}>
            <div className="icon-box"><Briefcase size={20} /></div>
          </div>

          <div className="axis-point" style={{ top: '550px' }}>
            <div className="icon-box"><GraduationCap size={20} /></div>
          </div>

          {hasItems(references) && (
            <div className="axis-point" style={{ top: '780px' }}>
              <div className="icon-box"><Megaphone size={20} /></div>
            </div>
          )}
        </div>

        {/* MAIN CONTENT AREA */}
        <div className="timeline-main">
          
          {/* Summary Section */}
          <section className="main-section">
            <h2 className="section-header-title">Summary</h2>
            <div className="section-content-text" 
                 dangerouslySetInnerHTML={{ __html: personal.summary || 'Professional summary goes here...' }} />
          </section>

          {/* Experience Section */}
          <section className="main-section">
            <h2 className="section-header-title">Work Experience</h2>
            <div className="experience-list">
              {experience?.map((exp, idx) => (
                <div key={idx} className="experience-item-box">
                  <h3 className="exp-title-bold">{exp.title}</h3>
                  <div className="exp-meta-row">
                    <span className="exp-company-text">{exp.company}</span>
                    <span className="exp-dots">•</span>
                    <span className="exp-date-text">{exp.startDate} - {exp.endDate}</span>
                  </div>
                  {exp.description && (
                    <div className="exp-description-text" dangerouslySetInnerHTML={{ __html: exp.description }} />
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* Education Section */}
          <section className="main-section">
            <h2 className="section-header-title">Education</h2>
            <div className="education-list">
              {education?.map((edu, idx) => (
                <div key={idx} className="education-item-box">
                  <h3 className="edu-degree-bold">{edu.degree}</h3>
                  <div className="edu-meta-row">
                    <span className="edu-school-text">{edu.school}</span>
                    <span className="edu-dots">•</span>
                    <span className="edu-date-text">{edu.startDate} - {edu.endDate}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* References Section */}
          {hasItems(references) && (
            <section className="main-section">
              <h2 className="section-header-title">References</h2>
              <div className="references-list">
                {references.map((ref, idx) => (
                  <div key={idx} className="reference-item-box">
                    <strong>{ref.name}</strong>, {ref.relationship}
                    <div className="ref-contact-small">{ref.email} | {ref.phone}</div>
                  </div>
                ))}
              </div>
            </section>
          )}

        </div>
      </div>
    </div>
  );
};

export default TimelineTemplate;
