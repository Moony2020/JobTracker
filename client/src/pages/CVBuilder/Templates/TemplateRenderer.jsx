import React from 'react';
import ModernTemplate from './ModernTemplate';
import ClassicTemplate from './ClassicTemplate';
import ProfessionalBlueTemplate from './ProfessionalBlueTemplate';
import TimelineTemplate from './TimelineTemplate';
import './Templates.css';

const TemplateRenderer = ({ templateKey, data, settings }) => {
  // Normalize key to ensure robust matching
  const key = (templateKey || 'modern').toLowerCase();

  // Map database keys to components
  const renderTemplate = () => {
    switch (key) {
      case 'modern':
        return <ModernTemplate data={data} settings={settings} />;
      case 'classic':
        return <ClassicTemplate data={data} settings={settings} />;
      case 'creative':
      case 'professional':
      case 'professional-blue':
      case 'professional blue': 
        return <ProfessionalBlueTemplate data={data} settings={settings} />;
      case 'timeline':
        return <TimelineTemplate data={data} settings={settings} />;
      default:
        return <ModernTemplate data={data} settings={settings} />;
    }
  };


  return (
    <div className={`resume-template ${settings?.isThumbnail ? 'thumbnail-mode' : ''}`}>
      {renderTemplate()}
    </div>
  );
};

export default TemplateRenderer;

