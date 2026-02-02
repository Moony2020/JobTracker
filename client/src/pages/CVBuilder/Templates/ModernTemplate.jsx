import React from 'react';
import { formatDate } from '../../../utils/formatters';

const ModernTemplate = ({ data, settings, labels }) => {
  const { 
    personal = {}, 
    experience = [], 
    education = [], 
    skills = [] 
  } = data || {};
  const themeColor = settings?.themeColor || '#10b981';

  // Helper to check if array has valid items
  const hasItems = (arr) => arr && arr.length > 0;

  return (
    <div className="modern-template" style={{ '--theme-color': themeColor, fontFamily: settings?.font || 'Inter', lineHeight: `${settings?.lineSpacing || 100}%` }}>
      <div className="modern-header" style={{ borderLeft: `12px solid ${themeColor}`, display: 'flex', alignItems: 'flex-start', gap: '24px' }}>
        {personal.photo && (
          <div className="modern-photo-container">
            <img src={personal.photo} alt="Profile" style={{ width: '100px', height: '100px', borderRadius: '4px', objectFit: 'cover' }} />
          </div>
        )}
        <div className="header-text">
          <h1>{personal.firstName || 'Your Name'} <span>{personal.lastName}</span></h1>
          <p className="job-title" style={{ fontSize: '1.2rem', color: '#64748b', marginTop: '4px' }}>{personal.jobTitle || ''}</p>
        {(personal.summary || !personal.firstName) && (
          <div className="summary" dangerouslySetInnerHTML={{ __html: personal.summary || 'Professional summary goes here.' }} />
        )}
        </div>
      </div>
      
      <div className="modern-content">
        <div className="main-col">
          {(hasItems(experience) || !personal.firstName) && (
            <section>
              <h2 style={{ color: themeColor }}>{labels?.experience || 'Experience'}</h2>
              {hasItems(experience) ? experience.map((exp, i) => (
                <div key={i} className="exp-item">
                  <h3>{exp.title}</h3>
                  <div className="meta">
                    {exp.company}{exp.company && (exp.location || exp.startDate || exp.endDate || exp.current) && ' | '}
                    {exp.location}{exp.location && (exp.startDate || exp.endDate || exp.current) && ' | '}
                    {(exp.startDate || exp.endDate || exp.current) && (
                      <>
                        {formatDate(exp.startDate)} { (exp.endDate || exp.current) && ` - ${exp.current ? 'Present' : formatDate(exp.endDate)}`}
                      </>
                    )}
                  </div>
                  {exp.description && <div className="description" dangerouslySetInnerHTML={{ __html: exp.description }} />}
                </div>
              )) : (
                <div className="exp-item">
                   <h3>Job Position</h3>
                   <div className="meta">Company Name | 2020 - Present</div>
                   <p className="description">Describe your responsibilities and achievements here.</p>
                </div>
              )}
            </section>
          )}

          {(hasItems(education) || !personal.firstName) && (
            <section>
              <h2 style={{ color: themeColor }}>{labels?.education || 'Education'}</h2>
              {hasItems(education) ? education.map((edu, i) => (
                <div key={i} className="exp-item">
                  <h3>{edu.degree}</h3>
                  <div className="meta">
                    {edu.school}{edu.school && (edu.location || edu.startDate || edu.endDate) && ' | '}
                    {edu.location}{edu.location && (edu.startDate || edu.endDate) && ' | '}
                    {(edu.startDate || edu.endDate) && (
                      <>
                        {formatDate(edu.startDate)} {edu.endDate && ` - ${formatDate(edu.endDate)}`}
                      </>
                    )}
                  </div>
                  {edu.description && <div className="description" dangerouslySetInnerHTML={{ __html: edu.description }} />}
                </div>
              )) : (
                 <div className="exp-item">
                   <h3>Degree / Major</h3>
                   <div className="meta">University Name | 2016 - 2020</div>
                 </div>
              )}
            </section>
          )}

          {data.volunteering && data.volunteering.length > 0 && (
            <section>
              <h2 style={{ color: themeColor }}>{labels?.volunteering || 'Volunteering'}</h2>
              {data.volunteering.map((item, i) => (
                <div key={i} className="exp-item">
                  <h3>{item.role}</h3>
                  <div className="meta">{item.organization}</div>
                  {item.description && <div className="description" dangerouslySetInnerHTML={{ __html: item.description }} />}
                </div>
              ))}
            </section>
          )}

          {data.courses && data.courses.length > 0 && (
            <section>
              <h2 style={{ color: themeColor }}>{labels?.courses || 'Courses'}</h2>
              {data.courses.map((item, i) => (
                <div key={i} className="exp-item">
                  <h3>{item.name}</h3>
                  <div className="meta">{item.institution}</div>
                </div>
              ))}
            </section>
          )}

          {data.military && data.military.length > 0 && (
            <section>
              <h2 style={{ color: themeColor }}>{labels?.military || 'Military Service'}</h2>
              {data.military.map((item, i) => (
                <div key={i} className="exp-item">
                  <h3>{item.role}</h3>
                  <div className="meta">{item.organization}</div>
                </div>
              ))}
            </section>
          )}
        </div>
        
        <div className="side-col">
          <section className="contact-info">
            <h2 style={{ color: themeColor }}>{labels?.contact || 'Contact'}</h2>
            <p>{personal.email || 'email@example.com'}</p>
            <p>{personal.phone || '(555) 123-4567'}</p>
            {personal.address && <p>{personal.address}</p>}
            {(personal.city || personal.location) && <p>{personal.city || personal.location}</p>}
            {personal.country && <p>{personal.country}</p>}
            {personal.zipCode && <p>{personal.zipCode}</p>}
            
            <div className="extra-details" style={{ marginTop: '16px', fontSize: '0.8rem', opacity: 0.8 }}>
              {personal.birthDate && <p>Born: {formatDate(personal.birthDate)}</p>}
              {personal.nationality && <p>Nationality: {personal.nationality}</p>}
              {personal.idNumber && <p>ID: {personal.idNumber}</p>}
              {personal.driversLicense && <p>License: {personal.driversLicense}</p>}
            </div>
          </section>

          {data.links && data.links.length > 0 && (
            <section className="links-section">
              <h2 style={{ color: themeColor }}>{labels?.links || 'Links'}</h2>
              {data.links.map((link, i) => (
                <p key={i} className="link-item"><strong>{link.name}:</strong> {link.url}</p>
              ))}
            </section>
          )}
          
          {(hasItems(skills) || !personal.firstName) && (
            <section>
              <h2 style={{ color: themeColor }}>{labels?.skills || 'Skills'}</h2>
              <div className="skill-tags">
                {hasItems(skills) ? skills.map((skill, i) => (
                  <span key={i} className="skill-tag">{skill}</span>
                )) : (
                  <>
                    <span className="skill-tag">Skill 1</span>
                    <span className="skill-tag">Skill 2</span>
                    <span className="skill-tag">Skill 3</span>
                  </>
                )}
              </div>
            </section>
          )}

          {data.languages && data.languages.length > 0 && (
            <section className="languages-section">
              <h2 style={{ color: themeColor }}>{labels?.languages || 'Languages'}</h2>
              <div className="language-list">
                {data.languages.map((lang, i) => (
                    <div key={i} className="language-item" style={{ marginBottom: '4px' }}>
                        <span style={{ fontWeight: 600 }}>{lang.name}</span>
                        {lang.level && <span style={{ opacity: 0.8, fontSize: '0.9em' }}> — {lang.level}</span>}
                    </div>
                ))}
              </div>
            </section>
          )}

          {data.hobbies && data.hobbies.length > 0 && (
            <section className="hobbies-section">
              <h2 style={{ color: themeColor }}>{labels?.hobbies || 'Hobbies'}</h2>
              <p>{data.hobbies.map(h => h.name).join(', ')}</p>
            </section>
          )}

          {data.references && data.references.length > 0 && (
            <section className="references-section">
              <h2 style={{ color: themeColor }}>{labels?.references || 'References'}</h2>
              {data.references.map((ref, i) => (
                <div key={i} className="ref-item">
                  <p><strong>{ref.name}</strong></p>
                  <p>{ref.contact}</p>
                </div>
              ))}
            </section>
          )}
        </div>
      </div>
    </div>
  );
};

export default ModernTemplate;
