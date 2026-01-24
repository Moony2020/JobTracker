import React from 'react';
import './Templates.css';

const ProfessionalBlueTemplate = ({ data, settings }) => {
  const { personal, experience, education, skills, languages } = data;
  const themeColor = settings?.themeColor || '#2563eb';

  return (
    <div className="professional-blue-template" style={{ fontFamily: settings?.font || 'Inter', lineHeight: `${settings?.lineSpacing || 100}%` }}>
      {/* LEFT SIDEBAR - Dark Blue */}
      <div className="pro-sidebar" style={{ backgroundColor: themeColor }}>
        {/* Profile Photo */}
        {personal.photo && (
          <div className="pro-photo-container">
            <img src={personal.photo} alt="Profile" className="pro-photo" />
          </div>
        )}

        {/* Contact Section */}
        <section className="pro-section">
          <h2 className="pro-section-title">CONTACT</h2>
          <div className="pro-contact-list">
            {personal.email && (
              <div className="pro-contact-item">
                <span className="pro-label">Email</span>
                <span className="pro-value">{personal.email}</span>
              </div>
            )}
            {personal.phone && (
              <div className="pro-contact-item">
                <span className="pro-label">Phone</span>
                <span className="pro-value">{personal.phone}</span>
              </div>
            )}
            {personal.location && (
              <div className="pro-contact-item">
                <span className="pro-label">Location</span>
                <span className="pro-value">{personal.location}</span>
              </div>
            )}
          </div>
        </section>

        {/* Skills Section */}
        {skills && skills.length > 0 && (
          <section className="pro-section">
            <h2 className="pro-section-title">SKILLS</h2>
            <ul className="pro-list">
              {skills.map((skill, i) => (
                <li key={i} className="pro-list-item">{skill}</li>
              ))}
            </ul>
          </section>
        )}

        {/* Languages Section */}
        {languages && languages.length > 0 && (
          <section className="pro-section">
            <h2 className="pro-section-title">LANGUAGES</h2>
            <ul className="pro-list">
              {languages.map((lang, i) => (
                <li key={i} className="pro-list-item">{lang.name} - {lang.level}</li>
              ))}
            </ul>
          </section>
        )}

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
        {personal.summary && (
          <section className="pro-content-section">
            <h2 className="pro-content-title" style={{ color: themeColor }}>PROFESSIONAL SUMMARY</h2>
            <p className="pro-summary">{personal.summary}</p>
          </section>
        )}

        {/* Work Experience */}
        {experience && experience.length > 0 && (
          <section className="pro-content-section">
            <h2 className="pro-content-title" style={{ color: themeColor }}>WORK EXPERIENCE</h2>
            {experience.map((exp, i) => (
              <div key={i} className="pro-exp-item">
                <div className="pro-exp-header">
                  <h3 className="pro-exp-title">{exp.title}</h3>
                  <span className="pro-exp-date">{exp.startDate} - {exp.endDate || 'Present'}</span>
                </div>
                <p className="pro-exp-company">{exp.company}</p>
                {exp.description && <p className="pro-exp-desc">{exp.description}</p>}
              </div>
            ))}
          </section>
        )}

        {/* Education */}
        {education && education.length > 0 && (
          <section className="pro-content-section">
            <h2 className="pro-content-title" style={{ color: themeColor }}>EDUCATION</h2>
            {education.map((edu, i) => (
              <div key={i} className="pro-exp-item">
                <div className="pro-exp-header">
                  <h3 className="pro-exp-title">{edu.degree}</h3>
                  <span className="pro-exp-date">{edu.startDate} - {edu.endDate}</span>
                </div>
                <p className="pro-exp-company">{edu.school}</p>
                {edu.description && <p className="pro-exp-desc">{edu.description}</p>}
              </div>
            ))}
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
                {item.description && <p className="pro-exp-desc">{item.description}</p>}
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
      </div>
    </div>
  );
};

export default ProfessionalBlueTemplate;
