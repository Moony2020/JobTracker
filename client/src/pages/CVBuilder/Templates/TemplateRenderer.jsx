import { TRANSLATIONS } from '../Translations';
import ModernTemplate from './ModernTemplate';
import ClassicTemplate from './ClassicTemplate';
import ProfessionalBlueTemplate from './ProfessionalBlueTemplate';
import TimelineTemplate from './TimelineTemplate';
import ExecutiveTemplate from './ExecutiveTemplate';
import ElegantTemplate from './ElegantTemplate';
import './Templates.css';

const TemplateRenderer = ({ templateKey, data, settings }) => {
  // Normalize key to ensure robust matching
  const key = (templateKey || 'modern').toLowerCase();

  const labels = TRANSLATIONS[settings?.cvLanguage || 'English']?.labels || TRANSLATIONS['English']?.labels;

  // Map database keys to components
  const renderTemplate = () => {
    switch (key) {
      case 'modern':
        return <ModernTemplate data={data} settings={settings} labels={labels} />;
      case 'classic':
        return <ClassicTemplate data={data} settings={settings} labels={labels} />;
      case 'creative':
      case 'professional':
      case 'professional-blue':
      case 'professional blue': 
        return <ProfessionalBlueTemplate data={data} settings={settings} labels={labels} />;
      case 'timeline':
        return <TimelineTemplate data={data} settings={settings} labels={labels} />;
      case 'executive':
        return <ExecutiveTemplate data={data} settings={settings} labels={labels} />;
      case 'elegant':
        return <ElegantTemplate data={data} settings={settings} labels={labels} />;
      default:
        return <ModernTemplate data={data} settings={settings} labels={labels} />;
    }
  };


  return (
    <div className={`resume-template ${settings?.isThumbnail ? 'thumbnail-mode' : ''}`}>
      {renderTemplate()}
    </div>
  );
};

export default TemplateRenderer;

