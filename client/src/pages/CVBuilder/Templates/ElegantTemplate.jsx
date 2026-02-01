import React from 'react';
import { formatDate } from '../../../utils/formatters';
import { Mail, Phone, MapPin, Globe, Linkedin, Github, User } from 'lucide-react';
import './Templates.css';

const ElegantTemplate = ({ data, settings, labels }) => {
  const { personal, experience, education, skills, languages, references, links } = data;
  const themeColor = settings?.themeColor || '#475569'; 

  const hasItems = (arr) => arr && arr.length > 0;

  return (
    <div className="elegant-template" style={{ '--theme-color': themeColor, fontFamily: settings?.font || 'Inter' }}>
      {/* DIAGONAL HEADER */}
      <div className="elegant-header">
        <div className="header-bg"></div>
        <div className="header-content">
          <div className="photo-container">
            {personal.photo ? (
              <img src={personal.photo} alt="Profile" className="photo" />
            ) : (
              <div className="photo-placeholder"><User size={60} color="#cbd5e1" /></div>
            )}
          </div>
          <div className="name-wrapper">
            <h1 className="name">{personal.firstName || 'Elsa'} {personal.lastName || 'Andersson'}</h1>
            <p className="title">{personal.jobTitle || 'Professional Title'}</p>
            {personal.location && <p className="location-header" style={{ fontSize: '0.85rem', opacity: 0.8, marginTop: '2px' }}>{personal.location}</p>}
          </div>
        </div>
      </div>

      <div className="elegant-body">
        {/* LEFT SIDEBAR (BEIGE) */}
        <div className="elegant-sidebar">

          <section className="sidebar-section">
            <h2 className="sidebar-title">{labels?.contact || 'Contact Details'}</h2>
            <div className="sidebar-contact">
              <div className="contact-item">
                <Mail size={14} />
                <span>{personal.email}</span>
              </div>
              <div className="contact-item">
                <Phone size={14} />
                <span>{personal.phone}</span>
              </div>
              {(personal.city || personal.country) && (
                <div className="contact-item">
                  <MapPin size={14} />
                  <span>{[personal.city, personal.country].filter(Boolean).join(', ')}</span>
                </div>
              )}
              {hasItems(links) && links.map((link, idx) => (
                <div key={idx} className="contact-item">
                   <Globe size={14} />
                   <span>{link.url.replace(/^https?:\/\//, '')}</span>
                </div>
              ))}
            </div>
          </section>

          {hasItems(education) && (
            <section className="sidebar-section">
              <h2 className="sidebar-title">{labels?.education || 'Education'}</h2>
              {education.map((edu, idx) => (
                <div key={idx} className="sidebar-item">
                  {edu.degree && <p className="item-bold">{edu.degree}</p>}
                  {edu.school && <p className="item-light">{edu.school}</p>}
                  {edu.location && <p className="item-light">{edu.location}</p>}
                  {(edu.startDate || edu.endDate) && (
                    <p className="item-date">
                      {formatDate(edu.startDate)} {edu.endDate && ` - ${formatDate(edu.endDate)}`}
                    </p>
                  )}
                  {edu.description && (
                      <div className="exp-desc" style={{ marginTop: '8px', fontSize: '0.85rem' }} dangerouslySetInnerHTML={{ __html: edu.description }} />
                  )}
                </div>
              ))}
            </section>
          )}

          {hasItems(skills) && (
            <section className="sidebar-section">
              <h2 className="sidebar-title">{labels?.skills || 'Skills'}</h2>
              <div className="sidebar-skills">
                {skills.map((skill, idx) => (
                  <div key={idx} className="skill-line">
                    <span className="skill-label">{skill}</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {hasItems(languages) && (
            <section className="sidebar-section">
              <h2 className="sidebar-title">{labels?.languages || 'Languages'}</h2>
              {languages.map((lang, idx) => (
                <div key={idx} className="skill-line">
                   <span className="skill-label">
                     {lang.name}{lang.level && ` - ${lang.level}`}
                   </span>
                </div>
              ))}
            </section>
          )}
        </div>

        {/* RIGHT MAIN CONTENT (WHITE) */}
        <div className="elegant-main">
          {personal.summary && (
            <section className="main-section">
              <h2 className="main-title">{labels?.summary || 'Summary'}</h2>
              <div className="main-text" dangerouslySetInnerHTML={{ __html: personal.summary }} />
            </section>
          )}

          {hasItems(experience) && (
            <section className="main-section">
              <h2 className="main-title">{labels?.experience || 'Experience'}</h2>
              {experience.map((exp, idx) => (
                <div key={idx} className="exp-item">
                  <div className="exp-point-header" style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
                    <h3 className="exp-role" style={{ marginBottom: '4px' }}>
                      {exp.title}
                    </h3>
                    <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'baseline' }}>
                      <span className="exp-company" style={{ fontSize: '0.9rem', color: '#666' }}>
                        {exp.company}{exp.location && ` | ${exp.location}`}
                      </span>
                      {(exp.startDate || exp.endDate || exp.current) && (
                        <span className="exp-time">
                          {formatDate(exp.startDate)} 
                          {(exp.endDate || exp.current) && ` - ${exp.current ? (labels?.present || 'present') : formatDate(exp.endDate)}`}
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
            <section className="main-section">
              <h2 className="main-title">{labels?.references || 'References'}</h2>
              {references.map((ref, idx) => (
                <div key={idx} className="ref-item">
                  {ref.name && <p className="ref-name">{ref.name}</p>}
                  {ref.relationship && <p className="ref-detail">{ref.relationship}</p>}
                  {(ref.email || ref.phone) && (
                    <p className="ref-info">
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
  );
};

export default ElegantTemplate;
