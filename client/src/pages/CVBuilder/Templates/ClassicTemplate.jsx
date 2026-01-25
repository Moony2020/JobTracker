import React from 'react';

const ClassicTemplate = ({ data, settings }) => {
  const { personal, experience, education } = data;
  const themeColor = settings?.themeColor || '#2563eb';

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
            {personal.birthDate && <span>Birth: {personal.birthDate}</span>}
            {personal.nationality && <span>• Nationality: {personal.nationality}</span>}
            {personal.idNumber && <span>• ID: {personal.idNumber}</span>}
            {personal.driversLicense && <span>• DL: {personal.driversLicense}</span>}
          </div>
        </div>
      </div>

      {(personal.summary || !personal.firstName) && (
        <section>
          <h2 style={{ color: themeColor }}>Professional Summary</h2>
          <p>{personal.summary || 'A brief professional summary highlighting your career goals and key achievements.'}</p>
        </section>
      )}

      {(hasItems(experience) || !personal.firstName) && (
        <section>
          <h2 style={{ color: themeColor }}>Experience</h2>
          {hasItems(experience) ? experience.map((exp, i) => (
            <div key={i} className="classic-item">
              <div className="item-header">
                <strong>{exp.title}</strong>
                <span>{exp.startDate} - {exp.current ? 'Present' : exp.endDate}</span>
              </div>
              <div className="item-sub">{exp.company}{exp.location ? `, ${exp.location}` : ''}</div>
              <p>{exp.description}</p>
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
          <h2 style={{ color: themeColor }}>Education</h2>
          {hasItems(education) ? education.map((edu, i) => (
            <div key={i} className="classic-item">
              <div className="item-header">
                <strong>{edu.degree}</strong>
                <span>{edu.startDate} - {edu.endDate}</span>
              </div>
              <div className="item-sub">{edu.school}</div>
              {edu.description && <p>{edu.description}</p>}
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
          <h2 style={{ color: themeColor }}>Volunteering</h2>
          {data.volunteering.map((item, i) => (
            <div key={i} className="classic-item">
              <div className="item-header">
                <strong>{item.role}</strong>
              </div>
              <div className="item-sub">{item.organization}</div>
              {item.description && <p>{item.description}</p>}
            </div>
          ))}
        </section>
      )}

      {data.courses && data.courses.length > 0 && (
        <section>
          <h2 style={{ color: themeColor }}>Courses</h2>
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
          <h2 style={{ color: themeColor }}>Military Service</h2>
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
          <h2 style={{ color: themeColor }}>Links</h2>
          <div className="classic-item">
            {data.links.map((link, i) => (
              <div key={i}><strong>{link.name}:</strong> {link.url}</div>
            ))}
          </div>
        </section>
      )}

      {data.hobbies && data.hobbies.length > 0 && (
        <section>
          <h2 style={{ color: themeColor }}>Hobbies</h2>
          <p>{data.hobbies.map(h => h.name).join(', ')}</p>
        </section>
      )}

      {data.references && data.references.length > 0 && (
        <section>
          <h2 style={{ color: themeColor }}>References</h2>
          {data.references.map((ref, i) => (
            <div key={i} className="classic-item">
              <strong>{ref.name}</strong> • {ref.contact}
            </div>
          ))}
        </section>
      )}
    </div>
  );
};

export default ClassicTemplate;
