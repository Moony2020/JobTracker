import React from 'react';
import { formatDate } from '../../../utils/formatters';
import { Mail, Phone, MapPin, User } from 'lucide-react';
import './Templates.css';

const ExecutiveTemplate = ({ data, settings, labels }) => {
  const { personal, experience, education, skills, languages, references } = data;
  const themeColor = settings?.themeColor || '#eab37a'; 

  const hasItems = (arr) => arr && arr.length > 0;

  return (
    <div className="executive-template" style={{ '--theme-color': themeColor, fontFamily: settings?.font || 'Inter' }}>
      <div className="executive-container">
        {/* Top Banner Header - Move to be relative to container for easier pill positioning */}
        <div className="executive-header">
           <h1 className="name">{personal.firstName || 'Maria'} {personal.lastName || 'Larsson'}</h1>
           <p className="title">{personal.jobTitle || 'Professional Title'}</p>
           {personal.location && <p className="location-header">{personal.location}</p>}
        </div>

        {/* LEFT BLACK SIDEBAR */}
        <div className="executive-sidebar">
          <div className="sidebar-photo-container">
            {personal.photo ? (
              <img src={personal.photo} alt="Profile" className="sidebar-photo" />
            ) : (
              <div className="sidebar-photo-placeholder">
                <User size={60} color="rgba(255,255,255,0.4)" />
              </div>
            )}
          </div>

          <section className="sidebar-section">
            <h2 className="sidebar-title">{labels?.contact || 'Contact Details'}</h2>
            <div className="sidebar-contact">
              <div className="contact-item">
                <Mail size={14} />
                <span>{personal.email || 'email@example.com'}</span>
              </div>
              <div className="contact-item">
                <Phone size={14} />
                <span>{personal.phone || '(555) 123-4567'}</span>
              </div>
              {(personal.city || personal.country) && (
                <div className="contact-item">
                  <MapPin size={14} />
                  <span>{[personal.city, personal.country].filter(Boolean).join(', ')}</span>
                </div>
              )}
            </div>
          </section>


          {hasItems(skills) && (
            <section className="sidebar-section">
              <h2 className="sidebar-title">{labels?.skills || 'Skills'}</h2>
              <div className="sidebar-skills">
                {skills.map((skill, idx) => (
                  <div key={idx} className="skill-item">
                    <span className="skill-name">{skill}</span>
                    <div className="skill-bar-container">
                      <div className="skill-bar-fill" style={{ width: '85%' }}></div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {hasItems(languages) && (
            <section className="sidebar-section">
              <h2 className="sidebar-title">{labels?.languages || 'Languages'}</h2>
              <div className="sidebar-langs">
                {languages.map((lang, idx) => (
                  <p key={idx} className="sidebar-lang-item">
                    {lang.name} {lang.level && <span className="lang-level">— {lang.level}</span>}
                  </p>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* MAIN CONTENT AREA */}
        <div className="executive-main">
          <div className="executive-content">
            {personal.summary && (
              <section className="content-section">
                <h2 className="content-title">{labels?.summary || 'Summary'}</h2>
                <div className="content-text" dangerouslySetInnerHTML={{ __html: personal.summary }} />
              </section>
            )}

            {hasItems(education) && (
              <section className="content-section">
                <h2 className="content-title">{labels?.education || 'Education'}</h2>
                {education.map((edu, idx) => (
                  <div key={idx} className="exp-item">
                  <div className="exp-header" style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
                    <h3 className="exp-title" style={{ marginBottom: '2px' }}>
                      {edu.degree}
                    </h3>
                    <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'baseline' }}>
                      <span className="exp-company" style={{ fontSize: '0.9rem', color: '#64748b' }}>
                        {edu.school}{edu.location && ` | ${edu.location}`}
                      </span>
                      {(edu.startDate || edu.endDate) && (
                        <span className="exp-date">
                          {formatDate(edu.startDate)} {edu.endDate && ` - ${formatDate(edu.endDate)}`}
                        </span>
                      )}
                    </div>
                  </div>
                  </div>
                ))}
              </section>
            )}

            {hasItems(experience) && (
              <section className="content-section">
                <h2 className="content-title">{labels?.experience || 'Experience'}</h2>
                {experience.map((exp, idx) => (
                  <div key={idx} className="exp-item">
                    <div className="exp-header" style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
                      <h3 className="exp-title" style={{ marginBottom: '2px' }}>
                        {exp.title}
                      </h3>
                      <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'baseline' }}>
                        <span className="exp-company" style={{ fontSize: '0.9rem', color: '#64748b' }}>
                          {exp.company}{exp.location && ` | ${exp.location}`}
                        </span>
                        {(exp.startDate || exp.endDate || exp.current) && (
                          <span className="exp-date">
                            {formatDate(exp.startDate)} 
                            {(exp.endDate || exp.current) && ` - ${exp.current ? (labels?.present || 'Present') : formatDate(exp.endDate)}`}
                          </span>
                        )}
                      </div>
                    </div>
                    {exp.description && (
                      <div className="exp-desc" dangerouslySetInnerHTML={{ __html: exp.description }} />
                    )}
                  </div>
                ))}
              </section>
            )}

            {hasItems(references) && (
              <section className="content-section">
                <h2 className="content-title">{labels?.references || 'References'}</h2>
                {references.map((ref, idx) => (
                  <div key={idx} className="ref-item">
                    <p>
                      {ref.name && <strong>{ref.name}</strong>}
                      {ref.name && ref.relationship && ', '}
                      {ref.relationship}
                    </p>
                    {(ref.email || ref.phone) && (
                      <p className="ref-contact">
                        {ref.email}{ref.email && ref.phone && ' | '}{ref.phone}
                      </p>
                    )}
                  </div>
                ))}
              </section>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExecutiveTemplate;
