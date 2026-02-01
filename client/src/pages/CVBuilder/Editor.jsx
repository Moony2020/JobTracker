import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import TemplateRenderer from './Templates/TemplateRenderer';
import DeleteConfirmationModal from '../../components/DeleteConfirmationModal';
import RichTextEditor from '../../components/RichTextEditor';
import { 
  Bold, Italic, Underline, Link as LinkIcon, List, AlignLeft, AlignCenter, AlignRight,
  CheckCircle, Trash2, Plus, Minus, ChevronUp, ChevronDown, Layout, X, ChevronLeft, Download,
  User, Briefcase, GraduationCap, Globe, Code, Heart, Type, ArrowLeft, Palette, Save, Eye, FileText, HelpCircle, Check, Camera, Upload, Loader2, Calendar, Search as SearchIcon
} from 'lucide-react';
import { TRANSLATIONS } from './Translations';
import { SUMMARY_EXAMPLES } from './Examples';
import './CVBuilder.css';
import api from '../../services/api';


const DateInput = ({ value, onChange, disabled }) => {
  // Parse existing "YYYY-MM" value
  const [year, month] = value ? value.split('-') : ['', ''];

  const handleYearChange = (e) => {
    const newYear = e.target.value;
    if (newYear && month) {
      onChange(`${newYear}-${month}`);
    } else if (newYear) {
      // Default to January if no month yet
      onChange(`${newYear}-01`);
    } else {
       onChange('');
    }
  };

  const handleMonthChange = (e) => {
    const newMonth = e.target.value;
    if (year && newMonth) {
      onChange(`${year}-${newMonth}`);
    } else if (newMonth) {
       // Wait for year, but can't really set partial date. 
       // We'll just store temporary or require Year first. 
       // Logic: Users usually pick year then month or vice versa.
       // If year is missing, we can pause or assume current year? 
       // Better: Just don't trigger onChange with valid date until both exist? 
       // BUT the parent expects a value.
       // Let's use current year as fallback if month is picked first? No, that's dangerous.
       // Let's force them to pick Year.
       // Actually, we can just update the partial state if we managed it locally, but here we control via props.
       // Let's pass partial? No, standard date inputs break.
       // We'll default Year to current year if missing? 
       const currentY = new Date().getFullYear();
       onChange(`${currentY}-${newMonth}`);
    }
  };

  // Generate years (1970 - Current + 5)
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: currentYear - 1970 + 6 }, (_, i) => currentYear + 5 - i);

  const months = [
    { val: '01', label: 'January' },
    { val: '02', label: 'February' },
    { val: '03', label: 'March' },
    { val: '04', label: 'April' },
    { val: '05', label: 'May' },
    { val: '06', label: 'June' },
    { val: '07', label: 'July' },
    { val: '08', label: 'August' },
    { val: '09', label: 'September' },
    { val: '10', label: 'October' },
    { val: '11', label: 'November' },
    { val: '12', label: 'December' }
  ];

  return (
    <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
      {/* Month Select */}
      <div style={{ position: 'relative', flex: 1 }}>
        <select
          className="form-input"
          value={month || ''}
          onChange={handleMonthChange}
          disabled={disabled}
          style={{ appearance: 'none', paddingRight: '24px', width: '100%' }}
        >
          <option value="" disabled>Month</option>
          {months.map(m => (
            <option key={m.val} value={m.val}>{m.label}</option>
          ))}
        </select>
        <ChevronDown 
          size={14} 
          color="#94a3b8" 
          style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} 
        />
      </div>

      {/* Year Select */}
      <div style={{ position: 'relative', flex: 1 }}>
        <select
          className="form-input"
          value={year || ''}
          onChange={handleYearChange}
          disabled={disabled}
          style={{ appearance: 'none', paddingRight: '24px', width: '100%' }}
        >
          <option value="" disabled>Year</option>
          {years.map(y => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
        <ChevronDown 
          size={14} 
          color="#94a3b8" 
          style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} 
        />
      </div>
    </div>
  );
};

const SAMPLE_DATA = {
  personal: {
    firstName: "John",
    lastName: "Doe",
    jobTitle: "Professional Title",
    email: "john@example.com",
    phone: "(555) 123-4567",
    location: "New York, USA",
    summary: "Experienced professional with a strong background in..."
  },
  experience: [
    { title: "Senior Developer", company: "Tech Corp", location: "New York", startDate: "2020", endDate: "", current: true, description: "Led development team..." }
  ],
  education: [
    { school: "University", degree: "Bachelor's Degree", location: "Boston", startDate: "2016", endDate: "2020" }
  ],
  skills: ["JavaScript", "React", "Node.js"],
  languages: [],
  projects: [],
  links: []
};

const LANGUAGES = [
  { code: 'Swedish', label: 'Svenska', iso: 'se' },
  { code: 'English', label: 'English', iso: 'us' },
  { code: 'Indonesian', label: 'Indonesia', iso: 'id' },
  { code: 'Finnish', label: 'Suomi', iso: 'fi' },
  { code: 'Danish', label: 'Danmark', iso: 'dk' },
  { code: 'Dutch', label: 'Nederlands', iso: 'nl' },
  { code: 'Greek', label: 'Ελληνικά', iso: 'gr' },
  { code: 'Norwegian', label: 'Norsk', iso: 'no' },
  { code: 'Romanian', label: 'Română', iso: 'ro' },
  { code: 'Hungarian', label: 'Magyar', iso: 'hu' },
  { code: 'German', label: 'Deutsch', iso: 'de' },
  { code: 'Czech', label: 'Čeština', iso: 'cz' },
  { code: 'Italian', label: 'Italiano', iso: 'it' },
  { code: 'Turkish', label: 'Türkçe', iso: 'tr' },
  { code: 'Portuguese', label: 'Português', iso: 'br' },
  { code: 'Spanish', label: 'Español', iso: 'es' },
  { code: 'Arabic', label: 'العربية', iso: 'sa' },
  { code: 'French', label: 'Français', iso: 'fr' },
  { code: 'Polish', label: 'Polski', iso: 'pl' }
];

const TEMPLATE_DEFAULTS = {
  modern: '#2563eb',      // Blue
  classic: '#0f172a',     // Navy
  executive: '#eab37a',   // Gold
  creative: '#2563eb',    // Blue (Requested)
  professional: '#2563eb', // Blue
  elegant: '#475569',     // Slate
  timeline: '#dc2626'     // Red (New Distinct Default)
};

const Editor = ({ cvId: propCvId, onBack, showNotify, isPrintMode }) => {
  const { user } = useAuth();
  const location = useLocation();

  const [cvData, setCvData] = useState({
    title: 'Untitled CV',
    data: {
      personal: {
        firstName: '',
        lastName: '',
        jobTitle: '',
        email: '',
        phone: '',
        location: '',
        summary: '',
        photo: null,
        city: '',
        country: '',
        address: '',
        zipCode: '',
        idNumber: '',
        birthDate: '',
        nationality: '',
        driversLicense: ''
      },
      experience: [],
      education: [],
      skills: [],
      languages: [],
      projects: [],
      certifications: [],
      hobbies: [],
      links: [],
      volunteering: [],
      courses: [],
      military: [],
      references: [],
      gdpr: []
    },
    settings: {
      themeColor: location.state?.templateKey ? (TEMPLATE_DEFAULTS[location.state.templateKey] || '#2563eb') : '#10b981',
      cvLanguage: 'English',
      font: 'Inter',
      lineSpacing: 100,
      fontSize: 100
    },
    templateId: null,
    templateKey: location.state?.templateKey || 'modern',
    isPaid: false
  });

  const currentLabels = TRANSLATIONS[cvData.settings.cvLanguage || 'English']?.labels || TRANSLATIONS['English'].labels;
  const currentUI = TRANSLATIONS[cvData.settings.cvLanguage || 'English']?.ui || TRANSLATIONS['English'].ui;

  const [activeCvId, setActiveCvId] = useState(propCvId);
  const [loading, setLoading] = useState(activeCvId ? true : false);
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);
  const langMenuRef = useRef(null);
  const [viewMode, setViewMode] = useState(() => {
    const savedMode = localStorage.getItem('cv_editor_view_mode');
    if (savedMode) return savedMode;
    return 'content';
  });

  // Track viewport state for smooth transitions
  const prevWidthRef = React.useRef(typeof window !== 'undefined' ? window.innerWidth : 1200);
  const lastDesktopModeRef = React.useRef(viewMode);

  const [examplesSearch, setExamplesSearch] = useState('');
  const [isExamplesOpen, setIsExamplesOpen] = useState(false);
  const examplesRef = useRef(null);

  const [activeSection, setActiveSection] = useState('personal');
  const [isSaved, setIsSaved] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [availableTemplates, setAvailableTemplates] = useState([]);
  const canvasRef = React.useRef(null);
  
  // Page Tracking State
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const previewScrollRef = React.useRef(null); // Ref for scroll container
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    section: null,
    index: null,
    title: ''
  });
  const [showMoreDetails, setShowMoreDetails] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false); // Safety flag

  // UTILITIES
  const updateNestedState = (path, value) => {
    const keys = path.split('.');
    
    // 1. Get current value to compare and avoid redundant "dirty" flags
    let currentVal = cvData;
    for (const key of keys) {
      if (currentVal === undefined || currentVal === null) break;
      currentVal = currentVal[key];
    }
    
    // Normalize empty values for comparison (null/undefined/empty string vs empty Quill HTML)
    const normalize = (v) => {
      if (!v) return '';
      if (typeof v === 'string') {
        const trimmed = v.replace(/<[^>]*>/g, '').trim();
        return trimmed === '' ? '' : v;
      }
      return v;
    };

    if (normalize(currentVal) === normalize(value)) {
      console.log(`[Editor] Skipping redundant update for ${path}`);
      return;
    }

    setIsSaved(false);
    setCvData(prev => {
      const newState = { ...prev };
      let current = newState;
      for (let i = 0; i < keys.length - 1; i++) {
        current[keys[i]] = { ...current[keys[i]] };
        current = current[keys[i]];
      }
      current[keys[keys.length - 1]] = value;
      return newState;
    });
  };

  const handleApplyExample = (text) => {
    const currentSummary = cvData.data.personal.summary || '';
    const hasExistingContent = currentSummary.replace(/<[^>]*>/g, '').trim().length > 0;
    
    if (hasExistingContent) {
      updateNestedState('data.personal.summary', currentSummary + ' ' + text);
    } else {
      updateNestedState('data.personal.summary', text);
    }
    setIsExamplesOpen(false);
  };

  // EFFECTS
  useEffect(() => {
    localStorage.setItem('cv_editor_view_mode', viewMode);
    if (window.innerWidth > 786) {
      lastDesktopModeRef.current = viewMode;
    }
  }, [viewMode]);

  useEffect(() => {
    const handleResize = () => {
      const isMobile = window.innerWidth <= 786;
      if (isMobile) {
        document.body.style.overflow = 'hidden';
      } else {
        document.body.style.overflow = '';
      }

      const prevWidth = prevWidthRef.current;
      const crossedToMobile = prevWidth > 786 && isMobile;
      const crossedToDesktop = prevWidth <= 786 && !isMobile;

      if (crossedToMobile) {
        lastDesktopModeRef.current = viewMode; 
        setViewMode('content');
      } else if (crossedToDesktop) {
        setViewMode(lastDesktopModeRef.current);
      }
      
      prevWidthRef.current = window.innerWidth;
    };

    window.addEventListener('resize', handleResize);
    if (window.innerWidth <= 786) {
       document.body.style.overflow = 'hidden';
    }

    return () => {
      window.removeEventListener('resize', handleResize);
      document.body.style.overflow = '';
    };
  }, [viewMode]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (langMenuRef.current && !langMenuRef.current.contains(event.target)) {
        setIsLangMenuOpen(false);
      }
      if (examplesRef.current && !examplesRef.current.contains(event.target)) {
        setIsExamplesOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch CV data if editing
  useEffect(() => {
    const init = async () => {
      try {
        const tplRes = await api.get('/cv/templates');
        const rawTemplates = tplRes.data;
        const orderedKeys = ['timeline', 'classic', 'modern', 'creative'];
        const sortedTemplates = [];
        
        orderedKeys.forEach(key => {
          const tpl = rawTemplates.find(t => t.key === key);
          if (tpl) sortedTemplates.push(tpl);
        });
        
        rawTemplates.forEach(t => {
          if (!orderedKeys.includes(t.key)) sortedTemplates.push(t);
        });
        
        setAvailableTemplates(sortedTemplates);
        
        if (propCvId || activeCvId) {
          // If we have data and just created a new ID (active !== prop), don't refetch and overwrite local state
          // unless it's a fresh load (loading=true) or we explicitly want to sync.
          if (activeCvId && !propCvId && cvData.data.personal.firstName) {
               console.log("[Editor] Skipping re-fetch for newly created CV to preserve local state");
               setLoading(false);
               setDataLoaded(true);
               return;
          }

          const idToFetch = propCvId || activeCvId;
          // if (idToFetch) check is redundant because of the outer check
          console.log(`[Editor] Fetching CV data for ID: ${idToFetch}`);
          const res = await api.get(`/cv/${idToFetch}`);
          console.log(`[Editor] CV data received:`, res.data ? 'Success' : 'Empty');
          if (res.data) {
             const templateOverride = location.state?.templateKey;
             const tplKey = templateOverride || res.data.templateId?.key || res.data.templateKey || 'modern';
             
             const normalizedData = {
               ...res.data,
               templateKey: tplKey,
               data: {
                 personal: {
                    firstName: '',
                    lastName: '',
                    jobTitle: '',
                    email: '',
                    phone: '',
                    location: '',
                    summary: '',
                    photo: null,
                    city: '',
                    country: '',
                    address: '',
                    zipCode: '',
                    idNumber: '',
                    birthDate: '',
                    nationality: '',
                    driversLicense: '',
                    ...(res.data.data?.personal || {})
                 },
                 experience: res.data.data?.experience || [],
                 education: res.data.data?.education || [],
                 skills: res.data.data?.skills || [],
                 languages: res.data.data?.languages || [],
                 projects: res.data.data?.projects || [],
                 certifications: res.data.data?.certifications || [], // Ensure this exists if schema has it (schema didn't show it but state might)
                 hobbies: res.data.data?.hobbies || [],
                 links: res.data.data?.links || [],
                 volunteering: res.data.data?.volunteering || [],
                 courses: res.data.data?.courses || [],
                 military: res.data.data?.military || [],
                 references: res.data.data?.references || [],
                 gdpr: res.data.data?.gdpr || [],
                 customSections: res.data.data?.customSections || []
               },
               settings: {
                  themeColor: TEMPLATE_DEFAULTS[tplKey] || '#2563eb',
                  font: 'Inter',
                  lineSpacing: 100,
                  fontSize: 100,
                  ...(res.data.settings || {})
               }
             };
             setCvData(normalizedData);
             setDataLoaded(true);
          }
        } else {
             console.log(`[Editor] Initializing new CV`);
             // New CV is considered "loaded" with default state
             setDataLoaded(true);
             // Initialize from location state if creating new
             if (location.state && location.state.templateKey) {
                setCvData(prev => ({
                   ...prev,
                   templateKey: location.state.templateKey,
                   settings: {
                     ...prev.settings,
                     themeColor: TEMPLATE_DEFAULTS[location.state.templateKey] || '#2563eb'
                   }
                }));
             }
        }
      } catch (err) {
        console.error("[Editor ERROR] Error initializing editor:", err);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [propCvId, activeCvId, location.state, location.search]); // eslint-disable-next-line react-hooks/exhaustive-deps

  // Track canvas height for dynamic pagination
 
  

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        if (showNotify) showNotify("Image size must be less than 2MB", "error");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        updateNestedState('data.personal.photo', reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const removePhoto = () => {
    updateNestedState('data.personal.photo', null);
  };

  useEffect(() => {
    setActiveCvId(propCvId);
  }, [propCvId]);

  const handleSave = useCallback(async () => {
    // Find template ID based on key
    const currentTemplate = availableTemplates.find(t => t.key === cvData.templateKey);
    const templateIdToSave = currentTemplate?._id || cvData.templateId;

    if (!activeCvId) {
      // VALIDATION: Don't create a new CV if it's completely empty
      const hasName = cvData.data.personal.firstName?.trim() || cvData.data.personal.lastName?.trim();
      const hasSummary = cvData.data.personal.summary?.replace(/<[^>]*>/g, '').trim().length > 0;
      
      const hasAnyContent = hasName || hasSummary || 
        ['experience', 'education', 'skills', 'languages', 'projects', 'volunteering', 'courses', 'military']
        .some(section => {
          const sectionData = cvData.data[section];
          if (!sectionData || sectionData.length === 0) return false;
          // Check if at least one item has some text content
          return sectionData.some(item => {
            if (typeof item === 'string') return item.trim().length > 0;
            return Object.values(item).some(val => 
              typeof val === 'string' && val.replace(/<[^>]*>/g, '').trim().length > 0
            );
          });
        });

      if (!hasAnyContent) {
        console.log("[Save Prevented] New CV is empty, skipping DB creation.");
        return null;
      }

      try {
        const res = await api.post('/cv', {
          title: cvData.data.personal.firstName ? `${cvData.data.personal.firstName}'s CV` : 'New CV',
          data: cvData.data,
          settings: cvData.settings,
          templateId: templateIdToSave
        });
        if (res.data?._id) {
          setActiveCvId(res.data._id);
          setIsSaved(true);
          return res.data._id; // Return the new ID
        }
      } catch (err) {
        console.error("Error creating CV:", err);
      }
    } else {
      // PREVENT OVERWRITE IF DATA NOT LOADED CORRECTLY
      if (!dataLoaded) {
          console.error("[Save Prevented] Attempted to save before data was fully loaded.");
          if (showNotify) showNotify("Cannot save: CV data not fully loaded. Please refresh.", "error");
          return null;
      }

      try {
        await api.put(`/cv/${activeCvId}`, {
          data: cvData.data,
          settings: cvData.settings,
          title: cvData.title,
          templateId: templateIdToSave
        });
        setIsSaved(true);
        return activeCvId; // Return existing ID
      } catch (err) {
        console.error("Error updating CV:", err);
      }
    }
    return activeCvId;
  }, [activeCvId, cvData.data, cvData.settings, cvData.title, cvData.templateKey, cvData.templateId, availableTemplates, dataLoaded, showNotify]);

  // Calculate Pages & Track Scroll
  useEffect(() => {
    if (!canvasRef.current || !previewScrollRef.current) return;

    const calculatePages = () => {
        if (!canvasRef.current) return;
        const height = canvasRef.current.scrollHeight;
        const pages = Math.ceil(height / 1123) || 1; // 1123px is A4 height
        setTotalPages(pages);
    };

    // Initial calcs
    calculatePages();
    const observer = new ResizeObserver(calculatePages);
    if (canvasRef.current) observer.observe(canvasRef.current);

    // Scroll Listener
    const handleScroll = () => {
        if (!previewScrollRef.current) return;
        const scrollY = previewScrollRef.current.scrollTop;
        const pageIndex = Math.floor((scrollY + 300) / 1123) + 1; // 1123 (A4 height, no gap)
        setCurrentPage(Math.min(pageIndex, totalPages));
    };

    const scrollContainer = previewScrollRef.current;
    if (scrollContainer) scrollContainer.addEventListener('scroll', handleScroll);
    
    return () => {
        observer.disconnect();
        if (scrollContainer) scrollContainer.removeEventListener('scroll', handleScroll);
    };
  }, [totalPages]); 

  // Auto-scroll to page 2 if needed (optional helper)
  const scrollToPage = (page) => {
      if (!previewScrollRef.current) return;
      const targetY = (page - 1) * 1133;
      previewScrollRef.current.scrollTo({ top: targetY, behavior: 'smooth' });
  };

  useEffect(() => {
    if (!isSaved) {
      const timer = setTimeout(() => {
        handleSave();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [handleSave, isSaved]);



  const confirmDeleteCategory = () => {
    const { section, index } = deleteModal;
    if (section && index !== null) {
      const newList = cvData.data[section].filter((_, i) => i !== index);
      updateNestedState(`data.${section}`, newList);
      if (showNotify) {
         showNotify(`${deleteModal.title} deleted successfully!`, 'success');
      }
    }
    setDeleteModal({ isOpen: false, section: null, index: null, title: '' });
  };

  const cancelDeleteCategory = () => {
    setDeleteModal({ isOpen: false, section: null, index: null, title: '' });
  };

  const handleDownload = async () => {
    // 1. Force Save First to ensure Backend has latest Template Key and we have a valid ID
    if (showNotify) showNotify('Saving latest changes...', 'info');
    const savedId = await handleSave();
    
    if (!savedId) {
        if (showNotify) showNotify('Could not save CV. Please try again.', 'error');
        return;
    }

    const currentTemplate = availableTemplates.find(t => t.key === cvData.templateKey);
    const templateCategory = currentTemplate?.category;
    const isPremiumTemplate = templateCategory === 'Premium' || templateCategory === 'Pro';
    const isUserPremium = user?.isPremium || false;
    
    console.log('[Download] Checking Template:', currentTemplate?.key, 'User Premium:', isUserPremium, 'CV Paid:', cvData.isPaid);

    if (isPremiumTemplate && !isUserPremium && !cvData.isPaid) {
       if (showNotify) showNotify('Initiating payment for Premium template...', 'info');
       
       try {
           const res = await api.post('/payment/stripe/create-session', {
               cvId: savedId,
               templateId: currentTemplate._id
           });
           
           if (res.data.url) {
               window.location.href = res.data.url;
           } else {
               throw new Error('No checkout URL received');
           }
       } catch (err) {
           console.error('[Payment] Error:', err);
           if (showNotify) showNotify('Failed to start payment processing. Please try again.', 'error');
       }
       return;
     }

    try {
      if (showNotify) showNotify('Generating PDF...', 'info');
      setIsExporting(true);
      
      const response = await api.get(`/cv/export/${savedId}`, {
        responseType: 'blob'
      });
      
      // Safety check for backend error hidden in a blob
      if (response.data.type !== 'application/pdf') {
          const text = await response.data.text();
          let errorMsg = 'Failed to generate PDF';
          try {
              const error = JSON.parse(text);
              errorMsg = error.msg || error.message || errorMsg;
          } catch {
              errorMsg = text || errorMsg;
          }
          throw new Error(errorMsg);
      }

      const url = window.URL.createObjectURL(response.data);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${cvData.title || 'CV'}.pdf`);
      document.body.appendChild(link);
      link.click();
      
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      if (showNotify) showNotify('PDF downloaded successfully!', 'success');
    } catch (err) {
      console.error("Error downloading CV:", err);
      if (showNotify) showNotify(err.message || 'Error downloading PDF', 'error');
    } finally {
      setIsExporting(false);
    }
  };

  const addItem = (section) => {
    const newItem = section === 'experience' ? { title: '', company: '', startDate: '', endDate: '', current: false, description: '' }
               : section === 'education' ? { school: '', degree: '', startDate: '', endDate: '', description: '' }
               : section === 'skills' ? ''
               : section === 'languages' ? { name: '', level: '' }
               : section === 'projects' ? { name: '', description: '', url: '' }
               : section === 'links' ? { name: '', url: '' }
               : section === 'hobbies' ? { name: '' }
               : section === 'volunteering' ? { role: '', organization: '', description: '' }
               : section === 'courses' ? { name: '', institution: '' }
               : section === 'military' ? { role: '', organization: '' }
               : section === 'references' ? { name: '', contact: '' }
               : section === 'gdpr' ? { text: 'I hereby give consent for my personal data included in the application to be processed for the purposes of the recruitment process in accordance with Art. 6 paragraph 1 letter a of the Regulation of the European Parliament and of the Council (EU) 2016/679 of 27 April 2016 on the protection of natural persons with regard to the processing of personal data and on the free movement of such data, and repealing Directive 95/46/EC (General Data Protection Regulation).' }
               : null;

    if (newItem !== null) {
      const currentList = cvData.data[section] || [];
      updateNestedState(`data.${section}`, [...currentList, newItem]);
    }
  };

  const updateItem = (section, index, field, value) => {
    const newList = [...cvData.data[section]];
    if (field === null) {
      newList[index] = value;
    } else {
      newList[index] = { ...newList[index], [field]: value };
    }
    updateNestedState(`data.${section}`, newList);
  };

  const removeItem = (section, index, title = 'Item') => {
    setDeleteModal({ isOpen: true, section, index, title });
  };

  const toggleSection = (section) => {
    setActiveSection(activeSection === section ? null : section);
  };

  // Base colors
  // Base colors
  const BASE_COLORS = [
    '#2563eb', // Blue
    '#dc2626', // Red
    '#eab37a', // Gold
    '#10b981', // Green
    '#0f172a', // Navy
  ];

  // Dynamic Preset Colors: Ensure the current template's default is ALWAYS first
  const currentTemplateDefault = TEMPLATE_DEFAULTS[cvData.templateKey] || '#2563eb';
  const PRESET_COLORS = [
    currentTemplateDefault,
    ...BASE_COLORS.filter(c => c !== currentTemplateDefault)
  ];

  if (loading) return <div className="cv-loading">Loading Editor...</div>;

  if (!dataLoaded && (propCvId || activeCvId)) {
    return (
      <div className="cv-loading error" style={{ flexDirection: 'column', gap: '1rem' }}>
        <h3>Failed to load CV data</h3>
        <p>The requested CV could not be loaded. It may have been deleted or there is a connection issue.</p>
        <button onClick={onBack} className="btn-secondary">Back to Dashboard</button>
      </div>
    );
  }
  
  if (isPrintMode) {
    return (
      <div className="cv-print-only resume-template">
        <TemplateRenderer 
          templateKey={cvData.templateKey}
          data={cvData.data}
          settings={cvData.settings}
        />
      </div>
    );
  }

  return (
    <div className={`cv-editor-design ${viewMode === 'design' ? 'mode-design' : 'mode-content'}`}>
      {isExporting && (
        <div className="pdf-export-overlay">
          <div className="export-loader-card">
            <Loader2 className="spinner" size={48} />
            <h3>Generating your PDF...</h3>
            <p>This will only take a few seconds.</p>
          </div>
        </div>
      )}
      <div className="editor-global-header">
        <div className="header-left">
          {viewMode === 'content' ? (
            <div className="cv-title-display">
              <span className="title-label">{currentUI.editing}:</span>
              <input 
                 className="title-edit-input" 
                 value={cvData.title} 
                 onChange={(e) => updateNestedState('title', e.target.value)}
              />
            </div>
          ) : (
            <button className="btn-edit-resume" onClick={() => setViewMode('content')}>
              <ChevronLeft size={18} />
              <span>{currentUI.personalDetails}</span>
            </button>
          )}
        </div>

        <div className="header-center-actions">
          {viewMode === 'content' && (
            <button 
              className="template-toggle-btn-top" 
              onClick={() => setViewMode('design')} 
            >
              <Layout size={18} />
              <span>{currentUI.templates}</span>
            </button>
          )}
          <button className="download-btn-red" onClick={handleDownload} disabled={isExporting}>
            {isExporting ? <Loader2 className="spinner" size={18} /> : <Download size={18} />}
            <span>{isExporting ? 'Downloading...' : currentUI.pdf}</span>
          </button>
        </div>

        <div className="header-right">
          <button className="exit-editor-btn" onClick={onBack} title="Exit">
            <X size={20} />
          </button>
        </div>
      </div>

      <div className="editor-main-split">
        {/* Sidebar Logic */}
        <aside className={`editor-sidebar-forms ${viewMode === 'design' ? 'design-mode-active' : ''}`}>
          
          {viewMode === 'content' ? (
            /* CONTENT MODE SIDEBAR */
            <div className="forms-content-wrapper">
              
              {/* Language Selector Custom Dropdown */}
              <div style={{ padding: '0 24px 16px 24px', display: 'flex', alignItems: 'center', gap: '12px', position: 'relative', zIndex: 50 }}>
                <span style={{ fontSize: '13px', color: '#64748b', fontWeight: '500' }}>Select Language:</span>
                
                <div 
                  className="custom-lang-select" 
                  style={{ position: 'relative', minWidth: '180px' }}
                  ref={langMenuRef}
                >
                  <button 
                    onClick={() => setIsLangMenuOpen(!isLangMenuOpen)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      border: '1px solid #e2e8f0',
                      background: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      cursor: 'pointer',
                      fontSize: '13px',
                      color: '#334155'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <img 
                        src={`https://flagcdn.com/w40/${LANGUAGES.find(l => l.code === (cvData.settings.cvLanguage || 'English'))?.iso}.png`} 
                        alt="flag" 
                        style={{ width: '20px', height: 'auto', borderRadius: '2px' }} 
                      />
                      <span>{LANGUAGES.find(l => l.code === (cvData.settings.cvLanguage || 'English'))?.label || 'English'}</span>
                    </div>
                    <ChevronDown size={14} color="#94a3b8" />
                  </button>

                  {isLangMenuOpen && (
                    <div className="lang-dropdown-menu" style={{
                      position: 'absolute',
                      top: '100%',
                      left: 0,
                      width: '100%',
                      maxHeight: '300px',
                      overflowY: 'auto',
                      background: '#1e293b', // Darker slate for premium look
                      color: 'white',
                      borderRadius: '8px',
                      boxShadow: '0 10px 25px rgba(0,0,0,0.3)',
                      marginTop: '8px',
                      padding: '4px 0',
                      zIndex: 1000,
                      border: '1px solid #334155'
                    }}>
                      {LANGUAGES.map(lang => (
                        <div 
                          key={lang.code}
                          onClick={() => {
                            updateNestedState('settings.cvLanguage', lang.code);
                            setIsLangMenuOpen(false);
                          }}
                          style={{
                            padding: '10px 16px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            cursor: 'pointer',
                            fontSize: '13px',
                            transition: 'background 0.2s',
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.background = '#334155'}
                          onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                        >
                          <img 
                            src={`https://flagcdn.com/w40/${lang.iso}.png`} 
                            alt={lang.label} 
                            style={{ width: '18px', height: 'auto', borderRadius: '2px' }} 
                          />
                          <span>{lang.label}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              
              {/* Personal Details */}
              <div className="form-section-card">
                <button className="section-trigger" onClick={() => toggleSection('personal')}>
                  <div className="section-title-box">
                    <User size={20} color="#6366f1" />
                    <span>{currentUI.personalDetails}</span>
                  </div>
                  {activeSection === 'personal' ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </button>
                {activeSection === 'personal' && (
                  <div className="section-content-inner">
                    {/* Photo Upload Row - Always visible, upload restricted to premium (Creative only) */}
                    <div className="photo-upload-container" style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '20px' }}>
                      <div className="photo-preview-box" style={{ 
                        width: '80px', 
                        height: '80px', 
                        borderRadius: '50%', 
                        background: '#f1f5f9', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        overflow: 'hidden',
                        border: '2px solid #e2e8f0',
                        opacity: ['creative', 'professional-blue', 'executive', 'elegant'].includes(cvData.templateKey) ? 1 : 0.6
                      }}>
                        {cvData.data.personal.photo ? (
                          <img src={cvData.data.personal.photo} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <User size={40} color="#94a3b8" />
                        )}
                      </div>
                      <div className="photo-actions">
                        {['creative', 'professional-blue', 'executive', 'elegant'].includes(cvData.templateKey) ? (
                          <>
                            <label className="upload-btn-ghost" style={{ cursor: 'pointer', display: 'inline-flex' }}>
                              <Camera size={16} />
                              <span style={{ marginLeft: '8px' }}>{cvData.data.personal.photo ? currentUI.changePhoto : currentUI.uploadPhoto}</span>
                              <input type="file" hidden accept="image/*" onChange={handlePhotoUpload} />
                            </label>
                            {cvData.data.personal.photo && (
                              <button onClick={removePhoto} style={{ marginLeft: '12px', background: 'transparent', border: 'none', color: '#ef4444', fontSize: '0.85rem', cursor: 'pointer' }}>
                                {currentUI.remove}
                              </button>
                            )}
                            <p style={{ margin: '8px 0 0 0', fontSize: '0.75rem', color: '#64748b' }}>JPG or PNG. Max size 2MB.</p>
                          </>
                        ) : (
                          <>
                            <button className="upload-btn-ghost" disabled style={{ cursor: 'not-allowed', display: 'inline-flex', opacity: 0.5 }}>
                              <Camera size={16} />
                              <span style={{ marginLeft: '8px' }}>{currentUI.uploadPhoto}</span>
                            </button>
                            <p style={{ margin: '8px 0 0 0', fontSize: '0.75rem', color: '#64748b' }}>{currentUI.photoRestriction}</p>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="form-grid">
                      <div className="form-group">
                        <label className="form-label">{currentUI.firstName}</label>
                        <input 
                          className="form-input" 
                          value={cvData.data.personal.firstName} 
                          onChange={(e) => updateNestedState('data.personal.firstName', e.target.value)}
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">{currentUI.lastName}</label>
                        <input 
                          className="form-input" 
                          value={cvData.data.personal.lastName} 
                          onChange={(e) => updateNestedState('data.personal.lastName', e.target.value)}
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">{currentUI.jobTitle}</label>
                        <input 
                          className="form-input" 
                          value={cvData.data.personal.jobTitle} 
                          onChange={(e) => updateNestedState('data.personal.jobTitle', e.target.value)}
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">{currentUI.email}</label>
                        <input 
                          className="form-input" 
                          value={cvData.data.personal.email} 
                          onChange={(e) => updateNestedState('data.personal.email', e.target.value)}
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">{currentUI.phone}</label>
                        <input 
                          className="form-input" 
                          value={cvData.data.personal.phone} 
                          onChange={(e) => updateNestedState('data.personal.phone', e.target.value)}
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">{currentUI.location}</label>
                        <input 
                          className="form-input" 
                          value={cvData.data.personal.location} 
                          onChange={(e) => updateNestedState('data.personal.location', e.target.value)}
                        />
                      </div>
                      
                      {showMoreDetails && (
                        <>
                          <div className="form-group">
                            <label className="form-label">{currentUI.city}</label>
                            <input 
                              className="form-input" 
                              value={cvData.data.personal.city} 
                              onChange={(e) => updateNestedState('data.personal.city', e.target.value)}
                            />
                          </div>
                          <div className="form-group">
                            <label className="form-label">{currentUI.country}</label>
                            <input 
                              className="form-input" 
                              value={cvData.data.personal.country} 
                              onChange={(e) => updateNestedState('data.personal.country', e.target.value)}
                            />
                          </div>
                          <div className="form-group">
                            <label className="form-label">{currentUI.address}</label>
                            <input 
                              className="form-input" 
                              value={cvData.data.personal.address} 
                              onChange={(e) => updateNestedState('data.personal.address', e.target.value)}
                            />
                          </div>
                          <div className="form-group">
                            <label className="form-label">{currentUI.zipCode}</label>
                            <input 
                              className="form-input" 
                              value={cvData.data.personal.zipCode} 
                              onChange={(e) => updateNestedState('data.personal.zipCode', e.target.value)}
                            />
                          </div>
                          <div className="form-group">
                            <label className="form-label">{currentUI.idNumber}</label>
                            <input 
                              className="form-input" 
                              value={cvData.data.personal.idNumber} 
                              onChange={(e) => updateNestedState('data.personal.idNumber', e.target.value)}
                            />
                          </div>
                          <div className="form-group">
                            <label className="form-label">{currentUI.birthDate}</label>
                            <input 
                              type="date"
                              className="form-input" 
                              value={cvData.data.personal.birthDate} 
                              onChange={(e) => updateNestedState('data.personal.birthDate', e.target.value)}
                            />
                          </div>
                          <div className="form-group">
                            <label className="form-label">{currentUI.nationality}</label>
                            <input 
                              className="form-input" 
                              value={cvData.data.personal.nationality} 
                              onChange={(e) => updateNestedState('data.personal.nationality', e.target.value)}
                            />
                          </div>
                          <div className="form-group">
                            <label className="form-label">{currentUI.driversLicense}</label>
                            <input 
                              className="form-input" 
                              value={cvData.data.personal.driversLicense} 
                              onChange={(e) => updateNestedState('data.personal.driversLicense', e.target.value)}
                            />
                          </div>
                        </>
                      )}
                    </div>

                    <button 
                      className="text-btn-toggle" 
                      onClick={() => setShowMoreDetails(!showMoreDetails)}
                      style={{ 
                        background: 'transparent', 
                        border: 'none', 
                        color: '#6366f1', 
                        fontWeight: '600', 
                        cursor: 'pointer', 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '8px',
                        marginTop: '16px',
                        padding: '0'
                      }}
                    >
                      {showMoreDetails ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                      <span>{showMoreDetails ? currentUI.lessDetails : currentUI.moreDetails}</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Professional Summary */}
              <div className="form-section-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', position: 'relative' }}>
                  <button className="section-trigger" style={{ padding: 0, flex: 1, border: 'none', background: 'transparent' }} onClick={() => toggleSection('summary')}>
                    <div className="section-title-box">
                      <FileText size={20} color="#6366f1" />
                      <span>{currentLabels.summary}</span>
                    </div>
                  </button>
                  
                  <div style={{ position: 'relative' }} ref={examplesRef}>
                    <button 
                      className="btn-examples-link" 
                      onClick={() => setIsExamplesOpen(!isExamplesOpen)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontSize: '13px',
                        fontWeight: '600',
                        color: '#6366f1',
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer'
                      }}
                    >
                      <Palette size={16} />
                      <span>{currentUI.preWrittenExamples}</span>
                    </button>

                    {isExamplesOpen && (
                      <div className="examples-popover" style={{
                        position: 'absolute',
                        top: '100%',
                        right: 0,
                        width: '450px', /* Slightly wider */
                        maxHeight: '550px', /* Increased height */
                        background: 'white',
                        boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
                        borderRadius: '12px',
                        zIndex: 100,
                        marginTop: '10px',
                        display: 'flex',
                        flexDirection: 'column',
                        overflow: 'hidden',
                        border: '1px solid #e2e8f0'
                      }}>
                        <div style={{ padding: '16px', borderBottom: '1px solid #f1f5f9', background: '#f8fafc' }}>
                          <div style={{ position: 'relative' }}>
                            <SearchIcon size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#6366f1' }} />
                            <input 
                              placeholder={currentUI.searchExamples}
                              style={{ 
                                width: '100%', 
                                padding: '10px 12px 10px 36px',
                                borderRadius: '8px',
                                border: '1px solid #e2e8f0',
                                fontSize: '13px',
                                background: 'white',
                                outline: 'none',
                                transition: 'all 0.2s'
                              }}
                              onFocus={(e) => e.target.style.borderColor = '#6366f1'}
                              onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                              value={examplesSearch}
                              onChange={(e) => setExamplesSearch(e.target.value)}
                            />
                          </div>
                        </div>
                        <div style={{ flex: 1, overflowY: 'auto', padding: '12px 12px 40px 12px', minHeight: 0 }}>
                          {SUMMARY_EXAMPLES
                            .filter(cat => 
                              cat.title.toLowerCase().includes(examplesSearch.toLowerCase()) ||
                              cat.examples.some(ex => ex.text.toLowerCase().includes(examplesSearch.toLowerCase()))
                            )
                            .length > 0 ? (
                              SUMMARY_EXAMPLES
                                .filter(cat => 
                                  cat.title.toLowerCase().includes(examplesSearch.toLowerCase()) ||
                                  cat.examples.some(ex => ex.text.toLowerCase().includes(examplesSearch.toLowerCase()))
                                )
                                .map((cat, idx) => (
                                  <div key={idx} style={{ marginBottom: '20px' }}>
                                    <h5 style={{ fontSize: '12px', fontWeight: 700, color: '#334155', textTransform: 'uppercase', marginBottom: '10px', paddingLeft: '4px' }}>
                                      {cat.title}
                                    </h5>
                                    {cat.examples.map((ex, eIdx) => {
                                      // Find text for current language, fallback to English
                                      const exText = ex.lang === (cvData.settings.cvLanguage || 'English') ? ex.text 
                                                    : (ex.lang === 'English' ? ex.text : null);
                                      
                                      if (!exText) return null;

                                      return (
                                        <div 
                                          key={eIdx} 
                                          className="example-item"
                                          onClick={() => {
                                            handleApplyExample(exText);
                                          }}
                                          style={{
                                            padding: '12px',
                                            borderRadius: '8px',
                                            background: '#f8fafc',
                                            fontSize: '13px',
                                            color: '#475569',
                                            lineHeight: '1.5',
                                            cursor: 'pointer',
                                            border: '1px solid transparent',
                                            transition: 'all 0.2s',
                                            position: 'relative',
                                            display: 'flex',
                                            alignItems: 'flex-start',
                                            gap: '12px',
                                            marginBottom: '8px'
                                          }}
                                          onMouseEnter={(e) => {
                                            e.currentTarget.style.background = '#f1f5f9';
                                            e.currentTarget.style.borderColor = '#6366f1';
                                          }}
                                          onMouseLeave={(e) => {
                                            e.currentTarget.style.background = '#f8fafc';
                                            e.currentTarget.style.borderColor = 'transparent';
                                          }}
                                        >
                                          <div style={{ 
                                            width: '24px', 
                                            height: '24px', 
                                            borderRadius: '50%', 
                                            background: '#6366f1', 
                                            border: '1px solid #6366f1',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            flexShrink: 0,
                                            marginTop: '2px',
                                            color: 'white'
                                          }}>
                                            <Plus size={14} />
                                          </div>
                                          <div style={{ flex: 1, minWidth: 0 }}>
                                            <span style={{ display: 'block', wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}>{exText}</span>
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                ))
                            ) : (
                              <div style={{ textAlign: 'center', padding: '40px 20px', color: '#94a3b8' }}>
                                <SearchIcon size={32} style={{ marginBottom: '12px', opacity: 0.5 }} />
                                <p style={{ fontSize: '14px' }}>No examples found for "{examplesSearch}"</p>
                              </div>
                            )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {activeSection === 'summary' && (
                  <div className="section-content-inner" style={{ paddingTop: 0 }}>
                    <div className="form-group full-width">
                      <RichTextEditor 
                        value={cvData.data.personal.summary} 
                        onChange={(val) => updateNestedState('data.personal.summary', val)}
                        placeholder={currentUI.summaryPlaceholder}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Experience */}
              <div className="form-section-card">
                <button className="section-trigger" onClick={() => toggleSection('experience')}>
                  <div className="section-title-box">
                    <Briefcase size={20} color="#6366f1" />
                    <span>{currentLabels.experience}</span>
                  </div>
                  {activeSection === 'experience' ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </button>
                {activeSection === 'experience' && (
                  <div className="section-content-inner">
                    {cvData.data.experience.map((exp, idx) => (
                      <div key={idx} className="card-item-wrapper">
                        <button className="btn-remove-item" onClick={() => removeItem('experience', idx, exp.title || 'Experience')}>
                          <Trash2 size={16} />
                        </button>
                        <div className="form-grid">
                          <div className="form-group">
                            <label className="form-label">{currentUI.jobTitle}</label>
                            <input 
                              className="form-input" 
                              value={exp.title} 
                              onChange={(e) => updateItem('experience', idx, 'title', e.target.value)}
                            />
                          </div>
                          <div className="form-group">
                            <label className="form-label">{currentLabels.experience.includes('Arbets') ? 'Företag' : 'Company'}</label> 
                            <input 
                              className="form-input" 
                              value={exp.company} 
                              onChange={(e) => updateItem('experience', idx, 'company', e.target.value)}
                            />
                          </div>
                          <div className="form-group">
                            <label className="form-label">{currentUI.location}</label>
                            <input 
                              className="form-input" 
                              placeholder="City, Country"
                              value={exp.location || ''} 
                              onChange={(e) => updateItem('experience', idx, 'location', e.target.value)}
                            />
                          </div>
                          <div className="form-group">
                            <label className="form-label">Start Date</label>
                            <DateInput 
                              value={exp.startDate ? exp.startDate.substring(0, 7) : ''} 
                              onChange={(val) => updateItem('experience', idx, 'startDate', val)}
                            />
                          </div>
                          <div className="form-group">
                            <label className="form-label">End Date</label>
                            <DateInput 
                              value={exp.endDate ? exp.endDate.substring(0, 7) : ''} 
                              disabled={exp.current}
                              onChange={(val) => updateItem('experience', idx, 'endDate', val)}
                            />
                          </div>
                        </div>
                        <div className="form-group" style={{ marginTop: '12px' }}>
                          <label className="form-label">Description</label>
                          <RichTextEditor 
                            value={exp.description} 
                            onChange={(val) => updateItem('experience', idx, 'description', val)}
                            placeholder="Describe your responsibilities and achievements..."
                          />
                        </div>
                      </div>
                    ))}
                    <button className="btn-add-section" onClick={() => addItem('experience')}>
                      <Plus size={18} />
                      <span>{currentUI.addItem} {currentLabels.experience}</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Education */}
              <div className="form-section-card">
                <button className="section-trigger" onClick={() => toggleSection('education')}>
                  <div className="section-title-box">
                    <GraduationCap size={20} color="#6366f1" />
                    <span>{currentLabels.education}</span>
                  </div>
                  {activeSection === 'education' ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </button>
                {activeSection === 'education' && (
                  <div className="section-content-inner">
                    {cvData.data.education.map((edu, idx) => (
                      <div key={idx} className="card-item-wrapper">
                        <button className="btn-remove-item" onClick={() => removeItem('education', idx, edu.school || 'Education')}>
                          <Trash2 size={16} />
                        </button>
                        <div className="form-grid">
                          <div className="form-group">
                            <label className="form-label">Degree</label>
                            <input 
                              className="form-input" 
                              value={edu.degree} 
                              onChange={(e) => updateItem('education', idx, 'degree', e.target.value)}
                            />
                          </div>
                          <div className="form-group">
                            <label className="form-label">School</label>
                            <input 
                              className="form-input" 
                              value={edu.school} 
                              onChange={(e) => updateItem('education', idx, 'school', e.target.value)}
                            />
                          </div>
                          <div className="form-group">
                            <label className="form-label">Location</label>
                            <input 
                              className="form-input" 
                              placeholder="City, Country"
                              value={edu.location || ''} 
                              onChange={(e) => updateItem('education', idx, 'location', e.target.value)}
                            />
                          </div>
                          <div className="form-group">
                            <label className="form-label">Start Date</label>
                            <DateInput 
                              value={edu.startDate ? edu.startDate.substring(0, 7) : ''} 
                              onChange={(val) => updateItem('education', idx, 'startDate', val)}
                            />
                          </div>
                          <div className="form-group">
                            <label className="form-label">End Date</label>
                            <DateInput 
                              value={edu.endDate ? edu.endDate.substring(0, 7) : ''} 
                              onChange={(val) => updateItem('education', idx, 'endDate', val)}
                            />
                          </div>
                        </div>
                        <div className="form-group" style={{ marginTop: '12px' }}>
                          <label className="form-label">Description</label>
                          <RichTextEditor 
                            value={edu.description} 
                            onChange={(val) => updateItem('education', idx, 'description', val)}
                            placeholder="Describe your studies and achievements..."
                          />
                        </div>
                      </div>
                    ))}
                    <button className="btn-add-section" onClick={() => addItem('education')}>
                      <Plus size={18} />
                      <span>{currentUI.addItem} {currentLabels.education}</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Skills */}
              <div className="form-section-card">
                <button className="section-trigger" onClick={() => toggleSection('skills')}>
                  <div className="section-title-box">
                    <Code size={20} color="#6366f1" />
                    <span>{currentLabels.skills}</span>
                  </div>
                  {activeSection === 'skills' ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </button>
                {activeSection === 'skills' && (
                  <div className="section-content-inner">
                    <div className="skill-tags-input">
                      {cvData.data.skills.map((skill, idx) => (
                        <div key={idx} className="skill-input-row" style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                          <input 
                            className="form-input" 
                            value={skill} 
                            onChange={(e) => updateItem('skills', idx, null, e.target.value)}
                          />
                          <button className="action-btn delete" onClick={() => removeItem('skills', idx, skill || currentLabels.skills)}>
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                    <button className="btn-add-section" onClick={() => addItem('skills')}>
                      <Plus size={18} />
                      <span>{currentUI.addItem} {currentLabels.skills}</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Dynamic Sections rendering */}
                {Object.keys(cvData.data).map(key => {
                  if (['personal', 'experience', 'education', 'skills', 'gdpr'].includes(key)) return null;
                  if (!cvData.data[key] || cvData.data[key].length === 0) return null;

                  const sectionTitles = {
                    languages: { icon: Globe, title: currentLabels.languages, itemFields: ['name', 'level'] },
                    volunteering: { icon: Heart, title: currentLabels.volunteering, itemFields: ['role', 'organization', 'description'] },
                    courses: { icon: GraduationCap, title: currentLabels.courses, itemFields: ['name', 'institution'] },
                    military: { icon: Briefcase, title: currentLabels.military, itemFields: ['role', 'organization'] },
                    links: { icon: Globe, title: currentLabels.links, itemFields: ['name', 'url'] },
                    hobbies: { icon: Heart, title: currentLabels.hobbies, itemFields: ['name'] },
                    references: { icon: User, title: currentLabels.references, itemFields: ['name', 'contact'] }
                  };

                  const config = sectionTitles[key];
                  if (!config) return null;
                  const Icon = config.icon;

                  return (
                    <div key={key} className="form-section-card">
                      <button className="section-trigger" onClick={() => toggleSection(key)}>
                        <div className="section-title-box">
                          <Icon size={20} color="#6366f1" />
                          <span>{config.title}</span>
                        </div>
                        {activeSection === key ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                      </button>
                      {activeSection === key && (
                        <div className="section-content-inner">
                          {cvData.data[key].map((item, idx) => (
                            <div key={idx} className="card-item-wrapper">
                              <button className="btn-remove-item" onClick={() => removeItem(key, idx, item[config.itemFields[0]] || config.title)}>
                                <Trash2 size={16} />
                              </button>
                              <div className="form-grid">
                                {config.itemFields.filter(field => field !== 'description').map(field => (
                                  <div key={field} className="form-group">
                                    <label className="form-label">{field.charAt(0).toUpperCase() + field.slice(1)}</label>
                                    {field === 'level' && key === 'languages' ? (
                                      <select 
                                        className="form-input"
                                        value={item[field] || ''}
                                        onChange={(e) => updateItem(key, idx, field, e.target.value)}
                                      >
                                        <option value="">Select Level</option>
                                        <option value="Native">Native</option>
                                        <option value="Proficient">Proficient</option>
                                        <option value="Intermediate">Intermediate</option>
                                        <option value="Basic">Basic</option>
                                      </select>
                                    ) : (
                                      <input 
                                        className="form-input" 
                                        value={item[field] || ''} 
                                        onChange={(e) => updateItem(key, idx, field, e.target.value)}
                                        placeholder={item[field] ? '' : (field === 'name' ? 'Language Name' : '')}
                                      />
                                    )}
                                  </div>
                                ))}
                              </div>
                              {config.itemFields.includes('description') && (
                                <div className="form-group full-width" style={{ marginTop: '12px' }}>
                                  <label className="form-label">Description</label>
                                  <RichTextEditor 
                                    value={item['description'] || ''} 
                                    onChange={(val) => updateItem(key, idx, 'description', val)}
                                    placeholder={`Describe your ${config.title.toLowerCase()}...`}
                                  />
                                </div>
                              )}
                            </div>
                          ))}
                          <button className="btn-add-section" onClick={() => addItem(key)}>
                            <Plus size={18} />
                            <span>{currentUI.addItem} {config.title}</span>
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}

              {/* GDPR Section */}
              {cvData.data.gdpr && cvData.data.gdpr.length > 0 && (
                <div className="form-section-card">
                  <button className="section-trigger" onClick={() => toggleSection('gdpr')}>
                    <div className="section-title-box">
                      <CheckCircle size={20} color="#6366f1" />
                      <span>{currentLabels.gdpr}</span>
                    </div>
                    {activeSection === 'gdpr' ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                  </button>
                  {activeSection === 'gdpr' && (
                    <div className="section-content-inner">
                      {cvData.data.gdpr.map((item, idx) => (
                        <div key={idx} className="card-item-wrapper">
                          <button className="btn-remove-item" onClick={() => removeItem('gdpr', idx, 'GDPR')}>
                            <Trash2 size={16} />
                          </button>
                          
                          <div className="rich-text-editor-wrapper">
                            <RichTextEditor 
                              value={item.text} 
                              onChange={(val) => updateItem('gdpr', idx, 'text', val)}
                              placeholder="Enter your GDPR consent text here..."
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}


              {/* Add Category Section */}
              <div className="add-category-section" style={{ marginTop: '24px' }}>
                <h4 className="add-item-header">{currentUI.addItem}</h4>
                <div className="category-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                   
                   <button className="cat-btn-add" disabled={cvData.data.languages && cvData.data.languages.length > 0} onClick={() => addItem('languages')}>
                      <Globe size={18} />
                      <span>{currentLabels.languages}</span>
                   </button>

                   <button className="cat-btn-add" disabled={cvData.data.volunteering && cvData.data.volunteering.length > 0} onClick={() => addItem('volunteering')}>
                      <Heart size={18} />
                      <span>{currentLabels.volunteering}</span>
                   </button>
                   
                   <button className="cat-btn-add" disabled={cvData.data.courses && cvData.data.courses.length > 0} onClick={() => addItem('courses')}>
                      <GraduationCap size={18} />
                      <span>{currentLabels.courses}</span>
                   </button>

                   <button className="cat-btn-add" disabled={cvData.data.military && cvData.data.military.length > 0} onClick={() => addItem('military')}>
                      <Briefcase size={18} />
                      <span>{currentLabels.military}</span>
                   </button>

                   <button className="cat-btn-add" disabled={cvData.data.links && cvData.data.links.length > 0} onClick={() => addItem('links')}>
                      <Globe size={18} />
                      <span>{currentLabels.links}</span>
                   </button>

                   <button className="cat-btn-add" disabled={cvData.data.hobbies && cvData.data.hobbies.length > 0} onClick={() => addItem('hobbies')}>
                      <Heart size={18} />
                      <span>{currentLabels.hobbies}</span>
                   </button>

                   <button className="cat-btn-add" disabled={cvData.data.references && cvData.data.references.length > 0} onClick={() => addItem('references')}>
                      <User size={18} />
                      <span>{currentLabels.references}</span>
                   </button>
                   
                   <button className="cat-btn-add" disabled={cvData.data.gdpr && cvData.data.gdpr.length > 0} onClick={() => addItem('gdpr')}>
                      <CheckCircle size={18} />
                      <span>{currentLabels.gdpr}</span>
                   </button>

                </div>
              </div>
            </div>

          ) : (
            /* DESIGN MODE SIDEBAR */
            <div className="sidebar-design-content">


              <div className="design-sections-scrollable">
                
                <div className="design-group-sidebar">
                   <div className="design-label-row line-spacing-row">
                      <label>
                        Line Spacing ({(() => {
                          const val = parseInt(cvData.settings?.lineSpacing);
                          return isNaN(val) ? 100 : val;
                        })()}%)
                      </label>
                      <div className="spacing-icons">
                         <button 
                           onClick={() => {
                             const current = parseInt(cvData.settings?.lineSpacing) || 100;
                             updateNestedState('settings.lineSpacing', Math.max(80, current - 10));
                           }}
                           className="spacing-btn"
                           type="button"
                         >
                           <Minus size={18} />
                         </button>
                         <Type size={20} color="#94a3b8" />
                         <button 
                           onClick={() => {
                             const current = parseInt(cvData.settings?.lineSpacing) || 100;
                             updateNestedState('settings.lineSpacing', Math.min(200, current + 10));
                           }}
                           className="spacing-btn"
                           type="button"
                         >
                           <Plus size={18} />
                         </button>
                      </div>
                   </div>
                </div>

                {/* 2. Colors */}
                <div className="design-group-sidebar">
                  <div className="design-label-row">
                    <label>Accent Color</label>
                    <span style={{color: cvData.settings.themeColor, fontWeight: 600, fontSize: '0.8rem'}}>{cvData.settings.themeColor}</span>
                  </div>
                  <div className="color-circles-sidebar">
                     {PRESET_COLORS.map(color => (
                        <button
                          key={color}
                          className={`color-circle-mini ${cvData.settings.themeColor === color ? 'active' : ''} ${cvData.templateKey === 'elegant' ? 'disabled' : ''}`}
                          style={{backgroundColor: color}}
                          onClick={() => cvData.templateKey !== 'elegant' && updateNestedState('settings.themeColor', color)}
                          title={cvData.templateKey === 'elegant' ? "This template does not support custom colors" : ""}
                        >
                           {cvData.settings.themeColor === color && <Check size={14} color="white" />}
                           {cvData.templateKey === 'elegant' && <X size={14} color="white" style={{ position: 'absolute' }} />}
                        </button>
                     ))}
                     <div className={`custom-picker-sidebar ${cvData.templateKey === 'elegant' ? 'disabled' : ''}`} title={cvData.templateKey === 'elegant' ? "This template does not support custom colors" : ""}>
                       <input 
                         type="color" 
                         value={cvData.settings.themeColor}
                         onChange={(e) => cvData.templateKey !== 'elegant' && updateNestedState('settings.themeColor', e.target.value)}
                         disabled={cvData.templateKey === 'elegant'}
                         style={{opacity: 0, position: 'absolute', width: '100%', height: '100%', cursor: cvData.templateKey === 'elegant' ? 'not-allowed' : 'pointer'}}
                       />
                       <Palette size={14} color="#64748b" />
                       {cvData.templateKey === 'elegant' && <X size={14} color="#64748b" style={{ position: 'absolute' }} />}
                     </div>
                  </div>
                </div>

                {/* 3. Fonts */}
                <div className="design-group-sidebar">
                  <div className="design-label-row">
                    <label>Typography</label>
                  </div>
                  <div className="font-select-wrapper-sidebar">
                    <select 
                       className="font-select-sidebar"
                       value={cvData.settings.font}
                       onChange={(e) => updateNestedState('settings.font', e.target.value)}
                    >
                       <option value="Inter">Inter (Clean)</option>
                       <option value="Arial">Arial (Standard)</option>
                       <option value="Times New Roman">Times New Roman (Classic)</option>
                       <option value="Roboto">Roboto (Modern)</option>
                       <option value="Open Sans">Open Sans (Friendly)</option>
                       <option value="Lato">Lato (Neutral)</option>
                       <option value="Montserrat">Montserrat (Geometric)</option>
                       <option value="Raleway">Raleway (Elegant)</option>
                       <option value="Ubuntu">Ubuntu (Tech)</option>
                       <option value="Oswald">Oswald (Bold)</option>
                       <option value="Playfair Display">Playfair (Classic Serif)</option>
                       <option value="Merriweather">Merriweather (Serif)</option>
                       <option value="Poppins">Poppins (Popular)</option>
                    </select>
                    <ChevronDown className="select-arrow-sidebar" size={14} />
                  </div>
                </div>

                {/* 4. Templates */}
                <div className="design-group-sidebar">
                  <div className="design-label-row">
                     <label>Select Template</label>
                  </div>
                  <div className="template-grid-sidebar">
                     {availableTemplates.map(tpl => (
                        <div 
                           key={tpl._id} 
                           className={`tpl-card-sidebar ${cvData.templateKey === tpl.key ? 'active' : ''}`}
                           onClick={() => {
                             setCvData(prev => ({
                               ...prev,
                               templateKey: tpl.key,
                               settings: {
                                 ...prev.settings,
                                 themeColor: TEMPLATE_DEFAULTS[tpl.key] || '#2563eb'
                               }
                             }));
                           }}
                        >
                           <div className="tpl-thumb-sidebar">
                              <div className="tpl-preview-container">
                                  <TemplateRenderer 
                                    templateKey={tpl.key}
                                    data={SAMPLE_DATA}
                                    settings={{
                                      ...cvData.settings,
                                      themeColor: TEMPLATE_DEFAULTS[tpl.key] || '#2563eb', // Force default color for thumbnail
                                      isThumbnail: true
                                    }}
                                  />
                              </div>
                              {cvData.templateKey === tpl.key && (
                                <div className="tpl-active-overlay">
                                  <div className="active-check-badge">
                                    <Check size={16} strokeWidth={3} />
                                  </div>
                                </div>
                              )}
                           </div>
                           <div className="tpl-name-sidebar">
                             {tpl.key.charAt(0).toUpperCase() + tpl.key.slice(1)}
                             {tpl.category === 'Pro' && <span className="premium-badge-sidebar" style={{marginLeft: '6px'}}>PRO</span>}
                           </div>
                        </div>
                     ))}
                  </div>
                </div>

              </div>
              
              <div className="editor-footer-info">
                 <Layout size={14} />
                 <span>Customizing: {availableTemplates.find(t => t.key === cvData.templateKey)?.key ? (availableTemplates.find(t => t.key === cvData.templateKey).key.charAt(0).toUpperCase() + availableTemplates.find(t => t.key === cvData.templateKey).key.slice(1)) : 'Modern'}</span>
              </div>
            </div>
          )}
        </aside>

        <main className="editor-preview-pane">
          <div className="preview-scroll-area" ref={previewScrollRef}>
            <div className="preview-scaler">
              <div className={`resume-paper-canvas ${!isPrintMode ? 'show-page-breaks' : ''}`} ref={canvasRef}>
                <TemplateRenderer 
                  templateKey={cvData.templateKey} 
                  data={cvData.data} 
                  settings={cvData.settings} 
                />
              </div>
            </div>

            {/* Premium Pill - Inside scroll area to stay under CV */}


             <div className="preview-footer-minimal">
                {isSaved ? (
                  <div className="status-saved-text" style={{ display: 'flex', alignItems: 'center', color: '#10b981', gap: '8px' }}>
                    <CheckCircle size={14} strokeWidth={3} />
                    <span>Saved</span>
                  </div>
                ) : (
                  <div className="status-saved-text" style={{ color: '#cbd5e1' }}>
                    <span>Saving...</span>
                  </div>
                )}

                <div className="pagination-text">
                    <button 
                        className="page-link-btn" 
                        onClick={() => scrollToPage(currentPage > 1 ? currentPage - 1 : totalPages)}
                        disabled={totalPages <= 1}
                    >
                        <ChevronUp size={14} />
                    </button>
                    <span>Page {currentPage} / {totalPages}</span>
                    <button 
                        className="page-link-btn" 
                        onClick={() => scrollToPage(currentPage < totalPages ? currentPage + 1 : 1)}
                        disabled={totalPages <= 1}
                    >
                        <ChevronDown size={14} />
                    </button>
                </div>
             </div>
          </div>
        </main>
      </div>

      <DeleteConfirmationModal 
        isOpen={deleteModal.isOpen}
        onClose={cancelDeleteCategory}
        onConfirm={confirmDeleteCategory}
        applicationName={deleteModal.title}
        itemType="category"
        message={`Are you sure you want to delete this ${deleteModal.title}?`}
      />
      
      {/* MOBILE DESIGN DRAWER */}
      <div className={`mobile-design-drawer ${viewMode === 'design' ? 'open' : ''}`}>
        <div className="drawer-header" onClick={() => setViewMode('content')}>
          <ChevronDown size={22} />
          <span>Templates</span>
        </div>
        
        <div className="drawer-content">
           {/* 1. Spacing */}
            <div className="drawer-section">
                <div className="drawer-label-row tight">
                   <label>
                     Line Spacing ({(() => {
                       const val = parseInt(cvData.settings?.lineSpacing);
                       return isNaN(val) ? 100 : val;
                     })()}%)
                   </label>
                   <div className="compact-spacing-controls">
                      <button 
                        onClick={() => {
                          const current = parseInt(cvData.settings?.lineSpacing) || 100;
                          updateNestedState('settings.lineSpacing', Math.max(80, current - 10));
                        }}
                        className="spacing-btn"
                      >
                        <Minus size={14} />
                      </button>
                      <Type size={16} color="#94a3b8" />
                      <button 
                        onClick={() => {
                          const current = parseInt(cvData.settings?.lineSpacing) || 100;
                          updateNestedState('settings.lineSpacing', Math.min(200, current + 10));
                        }}
                        className="spacing-btn"
                      >
                        <Plus size={14} />
                      </button>
                   </div>
                </div>
            </div>

           {/* 2. Colors */}
           <div className="drawer-section">
             <div className="drawer-label-row">
               <label>Accent Color</label>
               <span style={{fontSize: '0.75rem', color: '#6366f1', fontWeight: '600'}}>{cvData.settings.themeColor}</span>
             </div>
             <div className="drawer-color-row">
                {PRESET_COLORS.map(color => (
                   <button
                     key={color}
                     className={`color-circle-mini ${cvData.settings.themeColor === color ? 'active' : ''}`}
                     style={{backgroundColor: color}}
                     onClick={() => updateNestedState('settings.themeColor', color)}
                   >
                      {cvData.settings.themeColor === color && <Check size={14} color="white" />}
                   </button>
                ))}
                <div className="custom-picker-sidebar">
                  <input 
                    type="color" 
                    value={cvData.settings.themeColor}
                    onChange={(e) => updateNestedState('settings.themeColor', e.target.value)}
                    style={{opacity: 0, position: 'absolute', width: '100%', height: '100%', cursor: 'pointer'}}
                  />
                  <Palette size={14} color="#64748b" />
                </div>
             </div>
           </div>

           {/* 3. Templates (Horizontal Scroll) */}
           <div className="drawer-section no-border">
             <div className="drawer-label-row">
                <label>Select Template</label>
             </div>
             <div className="drawer-template-list">
                {availableTemplates.map(tpl => (
                   <div 
                      key={tpl._id} 
                      className={`drawer-tpl-card ${cvData.templateKey === tpl.key ? 'active' : ''}`}
                      onClick={() => {
                        setCvData(prev => ({
                           ...prev,
                           templateKey: tpl.key,
                           settings: {
                             ...prev.settings,
                             themeColor: TEMPLATE_DEFAULTS[tpl.key] || '#2563eb'
                           }
                        }));
                      }}
                   >
                      <div className="drawer-tpl-thumb">
                          <div className="drawer-preview-scaler">
                              <TemplateRenderer 
                                templateKey={tpl.key}
                                data={SAMPLE_DATA}
                                settings={{
                                  ...cvData.settings,
                                  themeColor: TEMPLATE_DEFAULTS[tpl.key] || '#2563eb', // Force default color for thumbnail
                                  isThumbnail: true
                                }}
                              />
                          </div>
                          {cvData.templateKey === tpl.key && (
                            <div className="tpl-active-overlay">
                              <div className="active-check-badge">
                                <Check size={16} strokeWidth={3} />
                              </div>
                            </div>
                          )}
                      </div>
                      <span className="drawer-tpl-name">{tpl.key.charAt(0).toUpperCase() + tpl.key.slice(1)}</span>
                   </div>
                ))}
             </div>
           </div>
        </div>
      </div>

      {/* MOBILE FLOATING BUTTON */}
      {viewMode === 'content' && (
        <button 
          className="mobile-floating-templates-btn"
          onClick={() => setViewMode('design')}
        >
          <ChevronUp size={18} />
          <span>Templates</span>
        </button>
      )}

    </div>
  );
};

export default Editor;