import React from 'react';
import { User, Briefcase, GraduationCap, Megaphone, Phone, Mail, MapPin, Globe } from 'lucide-react';
import { formatDate } from '../../../utils/formatters';

const TimelineTemplate = ({ data, settings, labels }) => {
  const { personal, experience, education, skills, languages, references } = data;
  const themeColor = settings?.themeColor || '#2563eb';

  // Helper to check if array has valid items
  const hasItems = (arr) => arr && arr.length > 0;

  return (
    <div className="timeline-template" style={{ '--theme-color': themeColor, fontFamily: settings?.font || 'Inter' }}>
      <div className="timeline-container">
        
        {/* LEFT SIDEBAR */}
        <div className="timeline-sidebar">

          <div className="sidebar-header">
            <h1 className="name-display">{personal.firstName || 'Your'} {personal.lastName || 'Name'}</h1>
            <p className="job-title-display">{personal.jobTitle || 'Professional Title'}</p>
          </div>

          <div className="sidebar-section">
            <h2 className="sidebar-title">{labels?.contact || 'Contact Details'}</h2>
            <div className="sidebar-contact">
              {personal.email && (
                <div className="contact-item">
                  <Mail size={14} />
                  <span>{personal.email}</span>
                </div>
              )}
              {personal.phone && (
                <div className="contact-item">
                  <Phone size={14} />
                  <span>{personal.phone}</span>
                </div>
              )}
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
                {personal.birthDate && <span>Birth: {formatDate(personal.birthDate)}</span>}
                {personal.nationality && <span>Nationality: {personal.nationality}</span>}
                {personal.idNumber && <span>ID: {personal.idNumber}</span>}
                {personal.driversLicense && <span>License: {formatDate(personal.driversLicense)}</span>}
              </div>
            </div>
          </div>

          {hasItems(skills) && (
            <div className="sidebar-section">
              <h2 className="sidebar-title">{labels?.skills || 'Skills'}</h2>
              <div className="sidebar-list">
                {skills.map((skill, idx) => (
                  <div key={idx} className="sidebar-list-item">{skill}</div>
                ))}
              </div>
            </div>
          )}

          {hasItems(languages) && (
            <div className="sidebar-section">
              <h2 className="sidebar-title">{labels?.languages || 'Languages'}</h2>
              <div className="sidebar-list">
                {languages.map((lang, idx) => (
                  <div key={idx} className="sidebar-list-item">
                    <strong>{lang.name}</strong> 
                    {lang.level && <span style={{ opacity: 0.8, fontSize: '0.9em', display: 'block' }}>{lang.level}</span>}
                  </div>
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
            <h2 className="section-header-title">{labels?.summary || 'Summary'}</h2>
            <div className="section-content-text" 
                 dangerouslySetInnerHTML={{ __html: personal.summary || 'Professional summary goes here...' }} />
          </section>

          {/* Experience Section */}
          <section className="main-section">
            <h2 className="section-header-title">{labels?.experience || 'Work Experience'}</h2>
            <div className="experience-list">
              {experience?.map((exp, idx) => (
                <div key={idx} className="experience-item-box">
                  <h3 className="exp-title-bold">{exp.title}</h3>
                  <div className="exp-meta-row">
                    {exp.company && <span className="exp-company-text">{exp.company}</span>}
                    {exp.company && (exp.location || exp.startDate) && <span className="exp-dots"> | </span>}
                    {exp.location && (
                      <>
                        <span className="exp-location-text">{exp.location}</span>
                        {exp.startDate && <span className="exp-dots"> | </span>}
                      </>
                    )}
                    {(exp.startDate || exp.endDate || exp.current) && (
                      <span className="exp-date-text">
                        {formatDate(exp.startDate)}
                        {(exp.endDate || exp.current) && ` - ${exp.current ? 'Present' : formatDate(exp.endDate)}`}
                      </span>
                    )}
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
            <h2 className="section-header-title">{labels?.education || 'Education'}</h2>
            <div className="education-list">
              {education?.map((edu, idx) => (
                <div key={idx} className="education-item-box">
                  <h3 className="edu-degree-bold">{edu.degree}</h3>
                  <div className="edu-meta-row">
                    {edu.school && <span className="edu-school-text">{edu.school}</span>}
                    {edu.school && (edu.location || edu.startDate) && <span className="edu-dots"> | </span>}
                    {edu.location && (
                      <>
                        <span className="edu-location-text">{edu.location}</span>
                        {edu.startDate && <span className="edu-dots"> | </span>}
                      </>
                    )}
                    {(edu.startDate || edu.endDate) && (
                      <span className="edu-date-text">
                        {formatDate(edu.startDate)} {edu.endDate && ` - ${formatDate(edu.endDate)}`}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* References Section */}
          {hasItems(references) && (
            <section className="main-section">
              <h2 className="section-header-title">{labels?.references || 'References'}</h2>
              <div className="references-list">
                {references.map((ref, idx) => (
                  <div key={idx} className="reference-item-box">
                    {ref.name && <strong>{ref.name}</strong>}{ref.name && ref.relationship && ', '}{ref.relationship}
                    {(ref.email || ref.phone) && (
                      <div className="ref-contact-small">
                        {ref.email}{ref.email && ref.phone && ' | '}{ref.phone}
                      </div>
                    )}
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
