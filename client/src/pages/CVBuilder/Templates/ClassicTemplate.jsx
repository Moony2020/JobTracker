import React from 'react';
import { formatDate } from '../../../utils/formatters';

const ClassicTemplate = ({ data, settings, labels }) => {
  const { personal, experience, education } = data;
  const themeColor = settings?.themeColor || '#0f172a';

  const hasItems = (arr) => arr && arr.length > 0;

  return (
    <div className="classic-template" style={{ '--theme-color': themeColor, fontFamily: settings?.font || 'Serif' }}>
      <div className="classic-header" style={{ display: 'flex', gap: '30px', alignItems: 'flex-start' }}>
        {personal.photo && (
          <div className="classic-photo-container">
            <img src={personal.photo} alt="Profile" style={{ width: '100px', height: '100px', objectFit: 'cover', borderRadius: '4px' }} />
          </div>
        )}
        <div style={{ flex: 1 }}>
          <h1 style={{ color: themeColor, marginTop: 0 }}>{personal.firstName || 'First Name'} {personal.lastName || 'Last Name'}</h1>
          <div className="job-title" style={{ fontSize: '1.2rem', color: '#64748b', marginBottom: '8px' }}>{personal.jobTitle}</div>
          <div className="contact-info" style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', fontSize: '0.9rem' }}>
            {personal.email && <span>{personal.email}</span>}
            {personal.phone && <span>• {personal.phone}</span>}
            {personal.location && <span>• {personal.location}</span>}
            {personal.address && <span>• {personal.address}</span>}
            {personal.city && <span>• {personal.city}</span>}
            {personal.country && <span>• {personal.country}</span>}
            {personal.zipCode && <span>• {personal.zipCode}</span>}
          </div>
          <div className="contact-details-extra" style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', fontSize: '0.8rem', color: '#64748b', marginTop: '4px' }}>
            {personal.birthDate && <span>Birth: {formatDate(personal.birthDate)}</span>}
            {personal.nationality && <span>• Nationality: {personal.nationality}</span>}
            {personal.idNumber && <span>• ID: {personal.idNumber}</span>}
            {personal.driversLicense && <span>• DL: {formatDate(personal.driversLicense)}</span>}
          </div>
        </div>
      </div>

      {(personal.summary || !personal.firstName) && (
        <section>
          <h2 style={{ color: themeColor }}>{labels?.summary || 'Professional Summary'}</h2>
          <div className="summary" dangerouslySetInnerHTML={{ __html: personal.summary || 'Professional summary goes here.' }} />
        </section>
      )}

      {(hasItems(experience) || !personal.firstName) && (
        <section>
          <h2 style={{ color: themeColor }}>{labels?.experience || 'Experience'}</h2>
          {hasItems(experience) ? experience.map((exp, i) => (
            <div key={i} className="classic-item">
              <div className="item-header">
                <strong>{exp.title}</strong>
                {(exp.startDate || exp.endDate || exp.current) && (
                  <span>
                    {formatDate(exp.startDate)}
                    {(exp.endDate || exp.current) && ` - ${exp.current ? 'Present' : formatDate(exp.endDate)}`}
                  </span>
                )}
              </div>
              {(exp.company || exp.location) && (
                <div className="item-sub">
                  {exp.company}{exp.company && exp.location && ` | ${exp.location}`}{!exp.company && exp.location}
                </div>
              )}
              {exp.description && <div className="description" dangerouslySetInnerHTML={{ __html: exp.description }} />}
            </div>
          )) : (
            <div className="classic-item">
              <div className="item-header">
                <strong>Job Title</strong>
                <span>2020 - Present</span>
              </div>
              <div className="item-sub">Company Name</div>
              <p>Description of your role and contributions.</p>
            </div>
          )}
        </section>
      )}

      {(hasItems(education) || !personal.firstName) && (
        <section>
          <h2 style={{ color: themeColor }}>{labels?.education || 'Education'}</h2>
          {hasItems(education) ? education.map((edu, i) => (
            <div key={i} className="classic-item">
              <div className="item-header">
                <strong>{edu.degree}</strong>
                {(edu.startDate || edu.endDate) && (
                  <span>
                    {formatDate(edu.startDate)} {edu.endDate && ` - ${formatDate(edu.endDate)}`}
                  </span>
                )}
              </div>
              {(edu.school || edu.location) && (
                <div className="item-sub">
                  {edu.school}{edu.school && edu.location && ` | ${edu.location}`}{!edu.school && edu.location}
                </div>
              )}
              {edu.description && <div className="description" dangerouslySetInnerHTML={{ __html: edu.description }} />}
            </div>
          )) : (
            <div className="classic-item">
              <div className="item-header">
                <strong>Degree Name</strong>
                <span>2016 - 2020</span>
              </div>
              <div className="item-sub">University Name</div>
            </div>
          )}
        </section>
      )}

      {data.volunteering && data.volunteering.length > 0 && (
        <section>
          <h2 style={{ color: themeColor }}>{labels?.volunteering || 'Volunteering'}</h2>
          {data.volunteering.map((item, i) => (
            <div key={i} className="classic-item">
              <div className="item-header">
                <strong>{item.role}</strong>
              </div>
              <div className="item-sub">{item.organization}</div>
              {item.description && <div className="description" dangerouslySetInnerHTML={{ __html: item.description }} />}
            </div>
          ))}
        </section>
      )}

      {data.courses && data.courses.length > 0 && (
        <section>
          <h2 style={{ color: themeColor }}>{labels?.courses || 'Courses'}</h2>
          {data.courses.map((item, i) => (
            <div key={i} className="classic-item">
              <div className="item-header">
                <strong>{item.name}</strong>
              </div>
              <div className="item-sub">{item.institution}</div>
            </div>
          ))}
        </section>
      )}

      {data.military && data.military.length > 0 && (
        <section>
          <h2 style={{ color: themeColor }}>{labels?.military || 'Military Service'}</h2>
          {data.military.map((item, i) => (
            <div key={i} className="classic-item">
              <div className="item-header">
                <strong>{item.role}</strong>
              </div>
              <div className="item-sub">{item.organization}</div>
            </div>
          ))}
        </section>
      )}

      {data.links && data.links.length > 0 && (
        <section>
          <h2 style={{ color: themeColor }}>{labels?.links || 'Links'}</h2>
          <div className="classic-item">
            {data.links.map((link, i) => (
              <div key={i}><strong>{link.name}:</strong> {link.url}</div>
            ))}
          </div>
        </section>
      )}

      {data.hobbies && data.hobbies.length > 0 && (
        <section>
          <h2 style={{ color: themeColor }}>{labels?.hobbies || 'Hobbies'}</h2>
          <p>{data.hobbies.map(h => h.name).join(', ')}</p>
        </section>
      )}

      {data.references && data.references.length > 0 && (
        <section>
          <h2 style={{ color: themeColor }}>{labels?.references || 'References'}</h2>
          {data.references.map((ref, i) => (
            <div key={i} className="classic-item">
              <strong>{ref.name}</strong> • {ref.contact}
            </div>
          ))}
        </section>
      )}

      {data.languages && data.languages.length > 0 && (
        <section>
          <h2 style={{ color: themeColor }}>{labels?.languages || 'Languages'}</h2>
          <div className="classic-item" style={{ display: 'flex', flexWrap: 'wrap', gap: '15px' }}>
            {data.languages.map((lang, i) => (
              <div key={i}>
                 <strong>{lang.name}</strong> 
                 {lang.level && <span style={{ color: '#64748b', marginLeft: '6px' }}>— {lang.level}</span>}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default ClassicTemplate;
