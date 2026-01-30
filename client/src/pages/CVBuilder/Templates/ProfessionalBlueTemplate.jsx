import React from 'react';
import { formatDate } from '../../../utils/formatters';
import './Templates.css';

const ProfessionalBlueTemplate = ({ data, settings }) => {
  const { personal, experience, education, skills, languages } = data;
  const themeColor = settings?.themeColor || '#2563eb';

  // Helper to check if array has valid items
  const hasItems = (arr) => arr && arr.length > 0;

  return (
    <div className="professional-blue-template" style={{ fontFamily: settings?.font || 'Inter', lineHeight: `${settings?.lineSpacing || 100}%` }}>
      {/* LEFT SIDEBAR - Dark Blue */}
      <div className="pro-sidebar" style={{ backgroundColor: themeColor }}>
        {/* Profile Photo */}
        <div className="pro-photo-container">
            {personal.photo ? (
               <img src={personal.photo} alt="Profile" className="pro-photo" />
            ) : (
               <div className="pro-photo placeholder" style={{ backgroundColor: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '2rem' }}>
                  {personal.firstName ? personal.firstName[0] : 'JS'}
               </div>
            )}
        </div>

        {/* Contact Section */}
        <section className="pro-section">
          <h2 className="pro-section-title">CONTACT</h2>
          <div className="pro-contact-list">
             <div className="pro-contact-item">
                <span className="pro-label">Email</span>
                <span className="pro-value" style={!personal.email ? { opacity: 0.7 } : {}}>{personal.email || 'email@example.com'}</span>
              </div>
              <div className="pro-contact-item">
                <span className="pro-label">Phone</span>
                <span className="pro-value" style={!personal.phone ? { opacity: 0.7 } : {}}>{personal.phone || '(555) 123-4567'}</span>
              </div>
              <div className="pro-contact-item">
                <span className="pro-label">Location</span>
                <span className="pro-value" style={!personal.location ? { opacity: 0.7 } : {}}>{personal.location || 'City, Country'}</span>
              </div>
              {personal.address && (
                <div className="pro-contact-item">
                  <span className="pro-label">Address</span>
                  <span className="pro-value">{personal.address}</span>
                </div>
              )}
              {personal.city && personal.country && (
                <div className="pro-contact-item">
                  <span className="pro-label">City/Country</span>
                  <span className="pro-value">{personal.city}, {personal.country}</span>
                </div>
              )}
              <div className="pro-extra-info" style={{ marginTop: '15px', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '10px' }}>
                {personal.birthDate && <div className="pro-contact-item"><span className="pro-label">Birth Date</span><span className="pro-value">{formatDate(personal.birthDate)}</span></div>}
                {personal.nationality && <div className="pro-contact-item"><span className="pro-label">Nationality</span><span className="pro-value">{personal.nationality}</span></div>}
                {personal.idNumber && <div className="pro-contact-item"><span className="pro-label">ID Number</span><span className="pro-value">{personal.idNumber}</span></div>}
                {personal.driversLicense && <div className="pro-contact-item"><span className="pro-label">Driver's License</span><span className="pro-value">{formatDate(personal.driversLicense)}</span></div>}
              </div>
          </div>
        </section>

        {/* Skills Section */}
        <section className="pro-section">
            <h2 className="pro-section-title">SKILLS</h2>
            <ul className="pro-list">
              {hasItems(skills) ? skills.map((skill, i) => (
                <li key={i} className="pro-list-item">{skill}</li>
              )) : (
                <div style={{ opacity: 0.7 }}>
                  <li className="pro-list-item">Skill One</li>
                  <li className="pro-list-item">Skill Two</li>
                  <li className="pro-list-item">Skill Three</li>
                  <li className="pro-list-item">Skill Four</li>
                </div>
              )}
            </ul>
        </section>

        {/* Languages Section */}
        <section className="pro-section">
            <h2 className="pro-section-title">LANGUAGES</h2>
            <ul className="pro-list">
              {hasItems(languages) ? languages.map((lang, i) => (
                <li key={i} className="pro-list-item">
                  <span style={{ fontWeight: 600 }}>{lang.name}</span>
                  {lang.level && <span style={{ opacity: 0.8, fontSize: '0.85em', marginLeft: '6px' }}>— {lang.level}</span>}
                </li>
              )) : (
                <div style={{ opacity: 0.7 }}>
                  <li className="pro-list-item">English - Native</li>
                  <li className="pro-list-item">Spanish - Intermediate</li>
                </div>
              )}
            </ul>
        </section>

        {/* Links Section */}
        {data.links && data.links.length > 0 && (
          <section className="pro-section">
            <h2 className="pro-section-title">LINKS</h2>
            <div className="pro-contact-list">
              {data.links.map((link, i) => (
                <div key={i} className="pro-contact-item">
                  <span className="pro-label">{link.name}</span>
                  <span className="pro-value" style={{ fontSize: '0.75rem' }}>{link.url}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Hobbies Section */}
        {data.hobbies && data.hobbies.length > 0 && (
          <section className="pro-section">
            <h2 className="pro-section-title">HOBBIES</h2>
            <p className="pro-value" style={{ color: 'white', opacity: 0.9 }}>
              {data.hobbies.map(h => h.name).join(', ')}
            </p>
          </section>
        )}

        {/* References Section */}
        {data.references && data.references.length > 0 && (
          <section className="pro-section">
            <h2 className="pro-section-title">REFERENCES</h2>
            {data.references.map((ref, i) => (
              <div key={i} className="pro-contact-item" style={{ marginBottom: '10px' }}>
                <span className="pro-label">{ref.name}</span>
                <span className="pro-value">{ref.contact}</span>
              </div>
            ))}
          </section>
        )}
      </div>

      {/* RIGHT MAIN CONTENT - White */}
      <div className="pro-main">
        {/* Header */}
      <div className="pro-header">
        <h1 className="pro-name">{(personal.firstName || personal.lastName) ? `${personal.firstName} ${personal.lastName}` : 'YOUR NAME'}</h1>
        <p className="pro-job-title">{personal.jobTitle || 'Professional Title'}</p>
      </div>

        {/* Professional Summary */}
        {(!personal.summary) && (
          <section className="pro-content-section">
            <h2 className="pro-content-title" style={{ color: themeColor }}>PROFESSIONAL SUMMARY</h2>
            <p className="pro-summary" style={{ opacity: 0.7 }}>Professional summary goes here. Briefly describe your career highlights, key skills, and professional achievements to give recruiters a quick overview of your qualifications.</p>
          </section>
        )}
        {personal.summary && (
          <section className="pro-content-section">
            <h2 className="pro-content-title" style={{ color: themeColor }}>PROFESSIONAL SUMMARY</h2>
            <div className="pro-summary" dangerouslySetInnerHTML={{ __html: personal.summary }} />
          </section>
        )}

        {/* Work Experience */}
        {hasItems(experience) ? (
          <section className="pro-content-section">
            <h2 className="pro-content-title" style={{ color: themeColor }}>WORK EXPERIENCE</h2>
            {experience.map((exp, i) => (
              <div key={i} className="pro-exp-item">
                <div className="pro-exp-header">
                  <h3 className="pro-exp-title">{exp.title}</h3>
                  <span className="pro-exp-date">{formatDate(exp.startDate)} - {exp.current ? 'Present' : formatDate(exp.endDate)}</span>
                </div>
                <p className="pro-exp-company">
                  {exp.company}
                  {exp.location && <span style={{ fontWeight: 400, opacity: 0.8 }}> | {exp.location}</span>}
                </p>
                {exp.description && <div className="pro-exp-desc" dangerouslySetInnerHTML={{ __html: exp.description }} />}
              </div>
            ))}
          </section>
        ) : (
          <section className="pro-content-section" style={{ opacity: 0.7 }}>
            <h2 className="pro-content-title" style={{ color: themeColor }}>WORK EXPERIENCE</h2>
            <div className="pro-exp-item">
               <div className="pro-exp-header">
                 <h3 className="pro-exp-title">Job Position</h3>
                 <span className="pro-exp-date">2020 - Present</span>
               </div>
               <p className="pro-exp-company">Company Name</p>
               <p className="pro-exp-desc">Describe your key responsibilities, achievements, and the impact you made in this role.</p>
            </div>
          </section>
        )}

        {/* Education */}
        {hasItems(education) ? (
          <section className="pro-content-section">
            <h2 className="pro-content-title" style={{ color: themeColor }}>EDUCATION</h2>
            {education.map((edu, i) => (
              <div key={i} className="pro-exp-item">
                <div className="pro-exp-header">
                  <h3 className="pro-exp-title">{edu.degree}</h3>
                  <span className="pro-exp-date">{formatDate(edu.startDate)} - {formatDate(edu.endDate)}</span>
                </div>
                <p className="pro-exp-company">
                  {edu.school}
                  {edu.location && <span style={{ fontWeight: 400, opacity: 0.8 }}> | {edu.location}</span>}
                </p>
                {edu.description && <div className="pro-exp-desc" dangerouslySetInnerHTML={{ __html: edu.description }} />}
              </div>
            ))}
          </section>
        ) : (
           <section className="pro-content-section" style={{ opacity: 0.7 }}>
            <h2 className="pro-content-title" style={{ color: themeColor }}>EDUCATION</h2>
            <div className="pro-exp-item">
              <div className="pro-exp-header">
                <h3 className="pro-exp-title">Degree / Major</h3>
                <span className="pro-exp-date">2016 - 2020</span>
              </div>
              <p className="pro-exp-company">University Name</p>
            </div>
           </section>
        )}

        {/* Volunteering */}
        {data.volunteering && data.volunteering.length > 0 && (
          <section className="pro-content-section">
            <h2 className="pro-content-title" style={{ color: themeColor }}>VOLUNTEERING</h2>
            {data.volunteering.map((item, i) => (
              <div key={i} className="pro-exp-item">
                <div className="pro-exp-header">
                  <h3 className="pro-exp-title">{item.role}</h3>
                </div>
                <p className="pro-exp-company">{item.organization}</p>
                {item.description && <div className="pro-exp-desc" dangerouslySetInnerHTML={{ __html: item.description }} />}
              </div>
            ))}
          </section>
        )}

        {/* Courses */}
        {data.courses && data.courses.length > 0 && (
          <section className="pro-content-section">
            <h2 className="pro-content-title" style={{ color: themeColor }}>COURSES</h2>
            {data.courses.map((item, i) => (
              <div key={i} className="pro-exp-item">
                <h3 className="pro-exp-title">{item.name}</h3>
                <p className="pro-exp-company">{item.institution}</p>
              </div>
            ))}
          </section>
        )}

        {/* Military Service */}
        {data.military && data.military.length > 0 && (
          <section className="pro-content-section">
            <h2 className="pro-content-title" style={{ color: themeColor }}>MILITARY SERVICE</h2>
            {data.military.map((item, i) => (
              <div key={i} className="pro-exp-item">
                <h3 className="pro-exp-title">{item.role}</h3>
                <p className="pro-exp-company">{item.organization}</p>
              </div>
            ))}
          </section>
        )}

        {/* GDPR Section */}
        {data.gdpr && data.gdpr.length > 0 && (
          <div className="pro-gdpr-footer" style={{ marginTop: 'auto', paddingTop: '20px', fontSize: '0.65rem', color: '#64748b', lineHeight: '1.4', borderTop: '1px solid #e2e8f0' }} dangerouslySetInnerHTML={{ __html: data.gdpr[0].text }} />
        )}
      </div>
    </div>
  );
};

export default ProfessionalBlueTemplate;
