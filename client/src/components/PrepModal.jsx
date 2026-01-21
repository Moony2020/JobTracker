import React, { useState, useEffect, useRef } from 'react';
import { X, Sparkles, MessageSquare, Briefcase, Loader2, CheckCircle2, RotateCw, ChevronDown, Send, Download, FileText, Mic, MicOff } from 'lucide-react';
import api from '../services/api';
import translations from '../utils/translations';
import IdealAnswerModal from './IdealAnswerModal';

// Global cache to persist results across modal mounts/re-mounts
// Try to initialize from localStorage
const getInitialCache = () => {
    try {
        const saved = localStorage.getItem('jt_ai_cache');
        return saved ? new Map(JSON.parse(saved)) : new Map();
    } catch {
        return new Map();
    }
};

const aiCache = getInitialCache();

const saveToPersistentCache = (key, value) => {
    aiCache.set(key, value);
    try {
        localStorage.setItem('jt_ai_cache', JSON.stringify(Array.from(aiCache.entries())));
    } catch (e) {
        console.warn('Could not save to localStorage', e);
    }
};

const PrepModal = ({ isOpen, onClose, application }) => {
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('interview');
    const [selectedLanguage, setSelectedLanguage] = useState('Swedish'); // Default to Swedish
    const [interviewData, setInterviewData] = useState(null);
    const [resumeData, setResumeData] = useState(null);
    const [emailData, setEmailData] = useState(null);
    const [coverLetterData, setCoverLetterData] = useState(null);
    const [matchScore, setMatchScore] = useState(null);
    const [quizMode, setQuizMode] = useState(false);
    const [currentQuizIndex, setCurrentQuizIndex] = useState(0);
    const [showHint, setShowHint] = useState(false);
    const [error, setError] = useState(null);
    const [retryTimer, setRetryTimer] = useState(0);
    const [showIdealModal, setShowIdealModal] = useState(false);
    const [matchReason, setMatchReason] = useState(null);
    const [profileExists, setProfileExists] = useState(false);
    const [toast, setToast] = useState(null);
    
    // Virtual Interview States
    const [interviewMessages, setInterviewMessages] = useState([]);
    const [interviewSessionId, setInterviewSessionId] = useState(null);
    const [userMessage, setUserMessage] = useState('');
    const [isInterviewing, setIsInterviewing] = useState(false);
    const [interviewReport, setInterviewReport] = useState(null);
    const [isListening, setIsListening] = useState(false);
    const chatEndRef = useRef(null);
    const recognitionRef = useRef(null);

    // Ref to prevent parallel identical fetches (especially in Strict Mode)
    const pendingFetchRef = useRef(null);

    const showToast = (message) => {
        setToast(message);
        setTimeout(() => setToast(null), 3000);
    };

    // Countdown effect for 429 retry
    useEffect(() => {
        if (retryTimer > 0) {
            const timer = setInterval(() => {
                setRetryTimer((prev) => prev - 1);
            }, 1000);
            return () => clearInterval(timer);
        }
    }, [retryTimer]);

    // Dedicated effect to check profile existence whenever modal opens
    useEffect(() => {
        const verifyProfile = async () => {
            if (isOpen) {
                try {
                    const res = await api.get('/auth/profile');
                    setProfileExists(!!res.data.profile);
                } catch {
                    setProfileExists(false);
                }
            }
        };
        verifyProfile();
    }, [isOpen]);

    const fetchAIInsights = async (forcedLanguage = selectedLanguage, force = false) => {
        if (!application?._id || retryTimer > 0) return;
        
        const cacheKey = `${application._id}-${forcedLanguage}-full`;
        
        // Return if already in cache and we're not force-regenerating
        if (aiCache.has(cacheKey) && !force) {
            const cachedValue = aiCache.get(cacheKey);
            setInterviewData(cachedValue.interview);
            setResumeData(cachedValue.resume);
            setEmailData(cachedValue.email);
            setCoverLetterData(cachedValue.coverLetter);
            setMatchScore(cachedValue.matchScore);
            setMatchReason(cachedValue.matchReason);
            setError(null);
            return;
        }

        // Prevent parallel fetches
        if (pendingFetchRef.current === cacheKey) return;
        pendingFetchRef.current = cacheKey;

        setLoading(true);
        setError(null);
        try {
            // NEW: Fetch user profile first for accurate matching
            let userProfile = "";
            try {
                const profileRes = await api.get('/auth/profile');
                userProfile = profileRes.data.profile;
                setProfileExists(!!userProfile);
            } catch (err) {
                console.warn('Could not fetch user profile for AI matching:', err);
            }

            const payload = {
                jobTitle: application.jobTitle,
                company: application.company,
                notes: application.notes,
                status: application.status,
                language: forcedLanguage,
                userProfile: userProfile
            };

            const response = await api.post('/ai/full-prep', payload);

            const result = response.data;
            
            // Save to persistent cache
            saveToPersistentCache(cacheKey, result);

            setInterviewData(result.interview);
            setResumeData(result.resume);
            setEmailData(result.email);
            setCoverLetterData(result.coverLetter);
            setMatchScore(result.matchScore);
            setMatchReason(result.matchReason);
        } catch (err) {
            console.error('AI Prep Fetch error:', err);
            const backendError = err.response?.data;
            
            if (backendError?.error === 'QUOTA_EXCEEDED') {
                setError(backendError.message);
                if (backendError.retryAfter > 0) {
                    setRetryTimer(backendError.retryAfter);
                }
            } else {
                const msg = backendError?.details 
                    ? `${backendError.message}: ${backendError.details}`
                    : backendError?.message || 'Failed to load AI insights. Please try again.';
                setError(msg);
            }
        } finally {
            if (pendingFetchRef.current === cacheKey) {
                pendingFetchRef.current = null;
            }
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen && application?._id) {
            const cacheKey = `${application._id}-${selectedLanguage}-full`;
            
            // Sync local state from cache first
            if (aiCache.has(cacheKey)) {
                const cachedValue = aiCache.get(cacheKey);
                setInterviewData(cachedValue.interview);
                setResumeData(cachedValue.resume);
                setEmailData(cachedValue.email);
                setCoverLetterData(cachedValue.coverLetter);
                setMatchScore(cachedValue.matchScore);
                setError(null);
                return;
            }

            // Reset states for the new application to avoid contamination
            setInterviewData(null);
            setResumeData(null);
            setEmailData(null);
            setCoverLetterData(null);
            setMatchScore(null);
            setQuizMode(false);
            setError(null);

            // Fetch for the new application
            fetchAIInsights(selectedLanguage);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen, application?._id, selectedLanguage]);

    // Handle language change
    const handleLanguageChange = (e) => {
        const newLang = e.target.value;
        setSelectedLanguage(newLang);
        // Clear old data to trigger loading state; useEffect will refetch or pull from cache
        setInterviewData(null);
        setResumeData(null);
        setEmailData(null);
        setCoverLetterData(null);
        setMatchScore(null);
    };

    const handleDownloadReport = async () => {
        if (!application || !interviewData) return;
        setLoading(true);
        try {
            const response = await api.post('/reports/career-report', {
                job: {
                    jobTitle: application.jobTitle,
                    company: application.company,
                    location: application.location
                },
                insights: {
                    resume: resumeData,
                    interview: interviewData,
                    email: emailData
                },
                interviewSummary: interviewReport
            }, { responseType: 'blob' });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `Career_Report_${application.company}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            showToast('PDF Report Downloaded!');
        } catch (err) {
            console.error('PDF Download error:', err);
            showToast('Failed to download PDF');
        } finally {
            setLoading(false);
        }
    };

    const startInterview = async () => {
        setLoading(true);
        setIsInterviewing(true);
        setInterviewReport(null);
        try {
            const res = await api.post('/interview/start', {
                jobTitle: application.jobTitle,
                company: application.company,
                notes: application.notes,
                language: selectedLanguage,
                userProfile: profileExists ? "Detailed profile available" : "No profile",
                level: "Mid-level",
                type: "Mixed"
            });
            setInterviewSessionId(res.data.sessionId);
            setInterviewMessages([{ role: 'assistant', content: res.data.question }]);
        } catch (err) {
            console.error('Start interview error:', err);
            setError('Failed to start virtual interview');
            setIsInterviewing(false);
        } finally {
            setLoading(false);
        }
    };

    const toggleListening = () => {
        if (isListening) {
            recognitionRef.current?.stop();
            setIsListening(false);
            return;
        }

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            const isFirefox = navigator.userAgent.toLowerCase().indexOf('firefox') > -1;
            if (isFirefox) {
                showToast("Voice-to-Text is not supported in Firefox. Please use Chrome or Edge.");
            } else {
                showToast("Speech recognition not supported in this browser.");
            }
            return;
        }

        const recognition = new SpeechRecognition();
        recognitionRef.current = recognition;

        const langMap = {
            'Swedish': 'sv-SE',
            'English': 'en-US',
            'Arabic': 'ar-SA'
        };
        recognition.lang = langMap[selectedLanguage] || 'en-US';
        recognition.interimResults = true;
        recognition.continuous = true;

        recognition.onstart = () => {
            setIsListening(true);
            showToast("Listening...");
        };

        recognition.onresult = (event) => {
            let fullTranscript = '';
            for (let i = 0; i < event.results.length; i++) {
                fullTranscript += event.results[i][0].transcript;
            }
            setUserMessage(fullTranscript);
        };

        recognition.onerror = (event) => {
            console.error("Speech recognition error:", event.error);
            setIsListening(false);
            if (event.error !== 'no-speech') {
                showToast(`Error: ${event.error}`);
            }
        };

        recognition.onend = () => {
            setIsListening(false);
        };

        recognition.start();
    };

    const sendMessage = async (e) => {
        if (e) e.preventDefault();
        if (!userMessage.trim() || !interviewSessionId) return;

        const currentMsg = userMessage;
        setUserMessage('');
        setInterviewMessages(prev => [...prev, { role: 'user', content: currentMsg }]);
        
        setLoading(true);
        try {
            const res = await api.post('/interview/message', {
                sessionId: interviewSessionId,
                userAnswer: currentMsg
            });
            setInterviewMessages(prev => [...prev, { role: 'assistant', content: res.data.response }]);
        } catch (err) {
            console.error('Send message error:', err);
            showToast('Error sending message');
        } finally {
            setLoading(false);
        }
    };

    const endInterview = async () => {
        setLoading(true);
        try {
            const res = await api.post('/interview/end', { sessionId: interviewSessionId });
            setInterviewReport(res.data.report);
            setIsInterviewing(false);
            setInterviewSessionId(null);
        } catch (err) {
            console.error('End interview error:', err);
            showToast('Failed to generate report');
        } finally {
            setLoading(false);
        }
    };

    // Auto-scroll chat
    useEffect(() => {
        if (chatEndRef.current) {
            chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [interviewMessages]);

    if (!isOpen) return null;

    return (
        <div className="modal">
            <div className="modal-content" style={{ maxWidth: '600px', width: '95%', height: 'auto', maxHeight: '90vh', padding: '1.5rem 0.8rem' }}>
                <div className="modal-header" style={{ position: 'relative', display: 'block', paddingRight: '1.2rem', borderBottom: 'none', marginBottom: '0.5rem', paddingBottom: 0 }}>
                    <button 
                        className="close-modal" 
                        onClick={onClose} 
                        style={{ 
                            position: 'absolute', 
                            top: '0rem', 
                            right: '0rem', 
                            width: '30px',
                            height: '30px',
                            padding: 0, 
                            zIndex: 10,
                            background: 'rgba(150, 150, 150, 0.15)',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            border: 'none',
                            color: 'var(--text-color)',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease'
                        }}
                    >
                        <X size={16} />
                    </button>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem', width: '100%' }}>
                        <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.8rem' }}>
                            <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', fontSize: '1.2rem' }}>
                                <Sparkles size={20} style={{ marginRight: '8px', color: '#6366f1' }} />
                                {translations[selectedLanguage]?.ai_prep || 'AI Career Prep'}
                            </h2>
                            
                            {(matchScore !== null && matchScore !== undefined) && !loading && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <div style={{ 
                                        background: matchScore > 75 ? 'rgba(34, 197, 94, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                                        color: matchScore > 75 ? '#22c55e' : '#f59e0b',
                                        border: `1px solid ${matchScore > 75 ? '#22c55e' : '#f59e0b'}`,
                                        padding: '0.2rem 0.6rem',
                                        borderRadius: '20px',
                                        fontSize: '0.8rem',
                                        fontWeight: '700',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '4px'
                                    }}>
                                        {matchScore}% {translations[selectedLanguage]?.match_score || 'Match'}
                                    </div>
                                    <span style={{ 
                                        fontSize: '0.65rem', 
                                        color: profileExists ? '#6366f1' : '#94a3b8', 
                                        fontWeight: '600',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '3px'
                                    }}>
                                        {profileExists ? (
                                            <>✓ {translations[selectedLanguage]?.resume_match || 'Resume Match'}</>
                                        ) : (
                                            <>⚠ {translations[selectedLanguage]?.no_resume || 'No Resume'}</>
                                        )}
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* ROW 2: Language Selector - Dedicated Line */}
                        <div className="language-selector" style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '0.4rem',
                            marginTop: '0.2rem',
                            width: '100%',
                            justifyContent: 'flex-end',
                            paddingTop: 0,
                            paddingBottom: '0.6rem',
                            borderBottom: '1px solid var(--light-border)',
                            marginBottom: '0.5rem'
                        }}>
                            <span style={{ 
                                fontSize: '0.75rem', 
                                color: 'var(--text-muted)', 
                                fontWeight: '500' 
                            }}>
                                {translations[selectedLanguage]?.language_label || 'Language'}:
                            </span>
                            <div className="select-wrapper">
                                <select 
                                    value={selectedLanguage} 
                                    onChange={handleLanguageChange}
                                    style={{
                                        padding: '0.2rem 2rem 0.2rem 0.4rem',
                                        borderRadius: '8px',
                                        border: '1px solid var(--light-border)',
                                        fontSize: '0.8rem',
                                        background: 'var(--glass-bg)',
                                        color: 'var(--text-color)',
                                        cursor: 'pointer',
                                        outline: 'none',
                                        appearance: 'none'
                                    }}
                                >
                                    <option value="English">English</option>
                                    <option value="Swedish">Swedish</option>
                                    <option value="Arabic">Arabic</option>
                                </select>
                                <ChevronDown className="chevron" size={12} style={{ right: '6px' }} />
                            </div>
                            
                            {!loading && (
                                <button 
                                    onClick={() => fetchAIInsights(selectedLanguage, true)}
                                    title="Refresh AI Insights"
                                    style={{
                                        background: 'none',
                                        border: 'none',
                                        padding: '0.2rem',
                                        color: 'var(--text-muted)',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        marginLeft: '0.5rem',
                                        opacity: 0.7
                                    }}
                                >
                                    <RotateCw size={14} />
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                <div className="modal-body" style={{ padding: '0 0.2rem 1.5rem 0.2rem' }}>
                    {matchReason && !loading && (
                        <div style={{ 
                            background: 'var(--glass-bg)', 
                            padding: '0.75rem 1rem', 
                            borderRadius: '12px', 
                            border: '1px solid var(--light-border)',
                            marginBottom: '1rem',
                            fontSize: '0.85rem',
                            color: 'var(--text-color)',
                            lineHeight: '1.5',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '5px'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', opacity: 0.8 }}>
                                <Sparkles size={14} color="#6366f1" />
                                <span style={{ fontWeight: '600', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                    {translations[selectedLanguage]?.match_analysis || 'Match Analysis'}
                                </span>
                            </div>
                            {matchReason}
                            {!profileExists && (
                                <div style={{ fontSize: '0.75rem', color: '#f59e0b', marginTop: '4px', fontWeight: '500' }}>
                                    {translations[selectedLanguage]?.cv_tip || 'Tip: Upload your CV in CV Profile for a more accurate matching.'}
                                </div>
                            )}
                        </div>
                    )}

                <div className="prep-tabs" style={{ 
                    display: 'flex', 
                    gap: '0.5rem', 
                    marginBottom: '1rem', 
                    borderBottom: 'none', 
                    paddingBottom: '0.2rem',
                    overflowX: 'auto',
                    scrollbarWidth: 'none'
                }}>
                    <button 
                        className={`prep-tab ${activeTab === 'interview' ? 'active' : ''}`}
                        onClick={() => setActiveTab('interview')}
                        style={{
                            background: 'none',
                            border: 'none',
                            padding: '0.5rem 0.75rem',
                            color: activeTab === 'interview' ? 'var(--primary-color)' : 'var(--text-muted)',
                            fontWeight: activeTab === 'interview' ? '600' : '400',
                            borderBottom: activeTab === 'interview' ? '2px solid var(--primary-color)' : '2px solid transparent',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            whiteSpace: 'nowrap'
                        }}
                    >
                        <MessageSquare size={16} /> {translations[selectedLanguage]?.interview_prep || 'Interview Prep'}
                    </button>
                    <button 
                        className={`prep-tab ${activeTab === 'virtual-interview' ? 'active' : ''}`}
                        onClick={() => setActiveTab('virtual-interview')}
                        style={{
                            background: 'none',
                            border: 'none',
                            padding: '0.5rem 0.75rem',
                            color: activeTab === 'virtual-interview' ? 'var(--primary-color)' : 'var(--text-muted)',
                            fontWeight: activeTab === 'virtual-interview' ? '600' : '400',
                            borderBottom: activeTab === 'virtual-interview' ? '2px solid var(--primary-color)' : '2px solid transparent',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            whiteSpace: 'nowrap'
                        }}
                    >
                        <MessageSquare size={16} /> {translations[selectedLanguage]?.virtual_interview || 'Virtual Interview'}
                    </button>
                    <button 
                        className={`prep-tab ${activeTab === 'resume' ? 'active' : ''}`}
                        onClick={() => setActiveTab('resume')}
                        style={{
                            background: 'none',
                            border: 'none',
                            padding: '0.5rem 0.75rem',
                            color: activeTab === 'resume' ? 'var(--primary-color)' : 'var(--text-muted)',
                            fontWeight: activeTab === 'resume' ? '600' : '400',
                            borderBottom: activeTab === 'resume' ? '2px solid var(--primary-color)' : '2px solid transparent',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            whiteSpace: 'nowrap'
                        }}
                    >
                        <Briefcase size={16} /> {translations[selectedLanguage]?.resume_tips || 'Resume Tips'}
                    </button>
                    <button 
                        className={`prep-tab ${activeTab === 'email' ? 'active' : ''}`}
                        onClick={() => setActiveTab('email')}
                        style={{
                            background: 'none',
                            border: 'none',
                            padding: '0.4rem 0.6rem', // Slightly smaller padding for 4 tabs
                            color: activeTab === 'email' ? 'var(--primary-color)' : 'var(--text-muted)',
                            fontWeight: activeTab === 'email' ? '600' : '400',
                            borderBottom: activeTab === 'email' ? '2px solid var(--primary-color)' : '2px solid transparent',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            whiteSpace: 'nowrap',
                            fontSize: '0.85rem'
                        }}
                    >
                        <Sparkles size={16} /> {translations[selectedLanguage]?.email_draft || 'Email'}
                    </button>
                    <button 
                        className={`prep-tab ${activeTab === 'coverLetter' ? 'active' : ''}`}
                        onClick={() => setActiveTab('coverLetter')}
                        style={{
                            background: 'none',
                            border: 'none',
                            padding: '0.4rem 0.6rem',
                            color: activeTab === 'coverLetter' ? 'var(--primary-color)' : 'var(--text-muted)',
                            fontWeight: activeTab === 'coverLetter' ? '600' : '400',
                            borderBottom: activeTab === 'coverLetter' ? '2px solid var(--primary-color)' : '2px solid transparent',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            whiteSpace: 'nowrap',
                            fontSize: '0.85rem'
                        }}
                    >
                        <Briefcase size={16} /> {translations[selectedLanguage]?.cover_letter || 'Cover Letter'}
                    </button>
                </div>

                <div className="prep-body" style={{ minHeight: '300px' }}>
                    {loading ? (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '3rem' }}>
                            <Loader2 className="animate-spin" size={40} color="#6366f1" />
                            <p style={{ marginTop: '1rem', color: 'var(--text-muted)' }}>{translations[selectedLanguage]?.analyzing || 'AI is analyzing the job description...'}</p>
                        </div>
                    ) : error ? (
                        <div className="error-message" style={{ textAlign: 'center', padding: '2rem' }}>
                            <p style={{ color: 'var(--danger-color)', marginBottom: '0.8rem', fontWeight: '600' }}>{error}</p>
                            
                            {retryTimer > 0 && (
                                <div style={{ 
                                    background: 'rgba(239, 68, 68, 0.1)', 
                                    padding: '1rem', 
                                    borderRadius: '12px', 
                                    color: 'var(--danger-color)',
                                    marginBottom: '1rem',
                                    display: 'inline-block'
                                }}>
                                    <p style={{ margin: 0, fontWeight: '700', fontSize: '1.2rem' }}>
                                        {Math.floor(retryTimer / 60)}:{(retryTimer % 60).toString().padStart(2, '0')}
                                    </p>
                                    <p style={{ margin: 0, fontSize: '0.8rem' }}>{translations[selectedLanguage]?.seconds_until || 'Seconds until next attempt'}</p>
                                </div>
                            )}

                            {application && !application.notes && activeTab !== 'email' && retryTimer === 0 && (
                                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                    {translations[selectedLanguage]?.notes_tip || 'Tip: Try adding some Notes or a job description to the application first.'}
                                </p>
                            )}
                        </div>
                    ) : (
                        <div>
                            {activeTab === 'interview' && interviewData && (
                                <div className="interview-prep-list">
                                    <div style={{ 
                                        display: 'flex', 
                                        justifyContent: 'space-between', 
                                        alignItems: 'center', 
                                        flexWrap: 'wrap', 
                                        gap: '1rem', 
                                        marginBottom: '1.2rem' 
                                    }}>
                                        <p style={{ 
                                            fontSize: '0.9rem', 
                                            color: 'var(--text-muted)', 
                                            margin: 0, 
                                            flex: '1 1 auto' 
                                        }}>
                                            {translations[selectedLanguage]?.tailored_for || 'Tailored for'} <strong>{application.jobTitle}</strong>.
                                        </p>
                                        <button 
                                            onClick={() => setQuizMode(!quizMode)}
                                            style={{
                                                padding: '0.5rem 1rem',
                                                borderRadius: '25px',
                                                fontSize: '0.8rem',
                                                background: quizMode ? 'var(--primary-color)' : 'transparent',
                                                color: quizMode ? 'white' : 'var(--primary-color)',
                                                border: '2px solid var(--primary-color)',
                                                cursor: 'pointer',
                                                fontWeight: '700',
                                                whiteSpace: 'nowrap',
                                                boxShadow: quizMode ? '0 4px 12px rgba(99,102,241,0.2)' : 'none',
                                                transition: 'all 0.2s ease',
                                                marginLeft: 'auto'
                                            }}
                                        >
                                            {quizMode ? (translations[selectedLanguage]?.exit_quiz || 'Exit Quiz') : (translations[selectedLanguage]?.start_quiz_btn || 'Start Quiz 🔥')}
                                        </button>
                                    </div>

                                    {!quizMode ? (
                                        interviewData.map((item, index) => (
                                            <div key={index} className="prep-item" style={{ 
                                                background: 'var(--glass-bg)', 
                                                padding: '1rem', 
                                                borderRadius: '12px', 
                                                marginBottom: '1.5rem',
                                                borderLeft: '4px solid var(--primary-color)'
                                            }}>
                                                <h4 style={{ fontSize: '1rem', marginBottom: '0.5rem', color: 'var(--text-color)' }}>{item.question}</h4>
                                                <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '0.8rem' }}>{item.answer}</p>
                                                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontStyle: 'italic', background: 'rgba(99, 102, 241, 0.05)', padding: '0.5rem', borderRadius: '8px' }}>
                                                    <strong>Hint:</strong> {item.hint}
                                                </p>
                                            </div>
                                        ))
                                    ) : (
                                        <div style={{ 
                                            background: 'var(--glass-bg)', 
                                            padding: '2rem', 
                                            borderRadius: '16px', 
                                            textAlign: 'center',
                                            border: '1px solid var(--light-border)',
                                            minHeight: '320px',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            justifyContent: 'center'
                                        }}>
                                            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Question {currentQuizIndex + 1} of {interviewData.length}</span>
                                            <h3 style={{ fontSize: '1.2rem', margin: '1.5rem 0', color: 'var(--text-color)' }}>{interviewData[currentQuizIndex].question}</h3>
                                            
                                            {showHint && (
                                                <p style={{ color: 'var(--primary-color)', fontStyle: 'italic', marginBottom: '1.5rem' }}>
                                                    💡 {interviewData[currentQuizIndex].hint}
                                                </p>
                                            )}

                                            <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '1.5rem', flexWrap: 'wrap' }}>
                                                {!showHint && (
                                                    <button 
                                                        className="btn btn-outline" 
                                                        onClick={() => setShowHint(true)} 
                                                        style={{ fontSize: '0.85rem', width: 'auto', minWidth: '140px', padding: '0.8rem 1.6rem' }}
                                                    >
                                                        {translations[selectedLanguage]?.show_hint || 'Show Hint'}
                                                    </button>
                                                )}
                                                <button 
                                                    className="btn btn-primary" 
                                                    onClick={() => setShowIdealModal(true)} 
                                                    style={{ width: 'auto', minWidth: '190px', padding: '0.8rem 1.6rem' }}
                                                >
                                                    {translations[selectedLanguage]?.view_answer || 'View Ideal Answer'}
                                                </button>
                                            </div>

                                            <div style={{ marginTop: '2.5rem', display: 'flex', justifyContent: 'space-between' }}>
                                                <button 
                                                    disabled={currentQuizIndex === 0}
                                                    onClick={() => { setCurrentQuizIndex(currentQuizIndex - 1); setShowHint(false); }}
                                                    style={{ opacity: currentQuizIndex === 0 ? 0.3 : 1, background: 'none', border: 'none', color: 'var(--text-color)', cursor: 'pointer' }}
                                                >
                                                    ← {translations[selectedLanguage]?.previous || 'Previous'}
                                                </button>
                                                <button 
                                                    disabled={currentQuizIndex === interviewData.length - 1}
                                                    onClick={() => { setCurrentQuizIndex(currentQuizIndex + 1); setShowHint(false); }}
                                                    style={{ opacity: currentQuizIndex === interviewData.length - 1 ? 0.3 : 1, background: 'none', border: 'none', color: 'var(--text-color)', cursor: 'pointer' }}
                                                >
                                                    {translations[selectedLanguage]?.next || 'Next'} →
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {activeTab === 'resume' && resumeData && (
                                <div className="resume-tips-list">
                                    <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '1.2rem' }}>
                                        {translations[selectedLanguage]?.resume_tips_desc || 'Tailored resume improvements for this position:'}
                                    </p>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                        {resumeData.map((tip, index) => (
                                            <div key={index} style={{ 
                                                background: 'var(--glass-bg)', 
                                                padding: '1rem', 
                                                borderRadius: '12px',
                                                border: '1px solid var(--light-border)',
                                                display: 'flex',
                                                alignItems: 'flex-start',
                                                gap: '0.75rem'
                                            }}>
                                                <CheckCircle2 size={18} color="#22c55e" style={{ flexShrink: 0, marginTop: '2px' }} />
                                                <span style={{ fontSize: '0.9rem', color: 'var(--text-color)' }}>{tip}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {activeTab === 'email' && emailData && (
                                <div className="email-draft-section">
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                        <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', margin: 0 }}>
                                            {translations[selectedLanguage]?.email_status_desc || 'Drafted for status:'} <strong>{application.status}</strong>
                                        </p>
                                        <button 
                                            className="btn btn-outline"
                                            onClick={() => {
                                                navigator.clipboard.writeText(emailData);
                                                showToast(translations[selectedLanguage]?.copied || 'Copied to clipboard!');
                                            }}
                                            style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', borderRadius: '50px' }}
                                        >
                                            {translations[selectedLanguage]?.copy_draft || 'Copy Draft'}
                                        </button>
                                    </div>
                                    <div style={{ 
                                        background: 'var(--glass-bg)', 
                                        padding: '1.5rem', 
                                        borderRadius: '12px', 
                                        lineHeight: '1.6', 
                                        fontSize: '0.95rem', 
                                        whiteSpace: 'pre-wrap', 
                                        border: '1px solid var(--light-border)',
                                        color: 'var(--text-color)',
                                        maxHeight: '400px',
                                        overflowY: 'auto'
                                    }}>
                                        {emailData}
                                    </div>
                                </div>
                            )}

                            {activeTab === 'coverLetter' && coverLetterData && (
                                <div className="cover-letter-section">
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                        <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', margin: 0 }}>
                                            {translations[selectedLanguage]?.cl_desc || 'Full professional cover letter draft'}
                                        </p>
                                        <button 
                                            className="btn btn-outline"
                                            onClick={() => {
                                                navigator.clipboard.writeText(coverLetterData);
                                                showToast(translations[selectedLanguage]?.copied || 'Copied to clipboard!');
                                            }}
                                            style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', borderRadius: '50px' }}
                                        >
                                            {translations[selectedLanguage]?.copy_draft || 'Copy Letter'}
                                        </button>
                                    </div>
                                    <div style={{ 
                                        background: 'var(--glass-bg)', 
                                        padding: '1.5rem', 
                                        borderRadius: '12px', 
                                        lineHeight: '1.6', 
                                        fontSize: '0.95rem', 
                                        whiteSpace: 'pre-wrap', 
                                        border: '1px solid var(--light-border)',
                                        color: 'var(--text-color)',
                                        maxHeight: '400px',
                                        overflowY: 'auto'
                                    }}>
                                        {coverLetterData}
                                    </div>
                                </div>
                            )}

                            {activeTab === 'virtual-interview' && (
                                <div className="virtual-interview-container" style={{ 
                                    display: 'flex', 
                                    flexDirection: 'column', 
                                    minHeight: '400px', 
                                    background: 'var(--glass-bg)', 
                                    borderRadius: '16px', 
                                    border: '1px solid var(--light-border)',
                                    overflow: 'hidden'
                                }}>
                                    {!isInterviewing && !interviewReport ? (
                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', padding: '2rem', textAlign: 'center', minHeight: '350px' }}>
                                            <div style={{ background: 'rgba(99, 102, 241, 0.1)', padding: '1.5rem', borderRadius: '50%', marginBottom: '1rem' }}>
                                                <MessageSquare size={32} color="var(--primary-color)" />
                                            </div>
                                            <h3>AI Virtual Interviewer</h3>
                                            <p style={{ color: 'var(--text-muted)', maxWidth: '300px', marginBottom: '1.5rem', fontSize: '0.85rem' }}>
                                                Practice your interview skills with our AI. Get real-time feedback and a final performance report.
                                            </p>
                                            <button className="btn btn-primary" onClick={startInterview} disabled={loading} style={{ width: 'auto', padding: '0.6rem 1.5rem' }}>
                                                {loading ? <Loader2 className="animate-spin" size={20} /> : 'Start Mock Interview 🔥'}
                                            </button>
                                        </div>
                                    ) : interviewReport ? (
                                        <div style={{ padding: '1rem', overflowY: 'auto', height: '100%', maxHeight: '420px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1rem', borderBottom: '1px solid var(--light-border)', paddingBottom: '0.8rem' }}>
                                                <CheckCircle2 color="#22c55e" size={20} />
                                                <h4 style={{ margin: 0 }}>Performance Report</h4>
                                            </div>
                                            <div style={{ whiteSpace: 'pre-wrap', fontSize: '0.85rem', lineHeight: '1.5', color: 'var(--text-color)', background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '12px' }}>
                                                {interviewReport}
                                            </div>
                                            <div style={{ marginTop: '1.5rem', display: 'flex', gap: '1rem' }}>
                                                <button className="btn btn-outline" onClick={() => { setInterviewReport(null); setIsInterviewing(false); }} style={{ padding: '0.5rem 1rem', fontSize: '0.8rem' }}>
                                                    Try Again
                                                </button>
                                                <button 
                                                    className="btn btn-outline" 
                                                    onClick={handleDownloadReport} 
                                                    style={{ 
                                                        padding: '0.5rem 1rem', 
                                                        fontSize: '0.8rem', 
                                                        display: 'flex', 
                                                        alignItems: 'center', 
                                                        gap: '6px',
                                                        borderColor: 'var(--primary-color)',
                                                        color: 'var(--primary-color)',
                                                        transition: 'all 0.2s ease',
                                                        borderRadius: '50px'
                                                    }}
                                                    onMouseEnter={e => {
                                                        e.currentTarget.style.color = 'white';
                                                        e.currentTarget.style.background = 'var(--primary-color)';
                                                    }}
                                                    onMouseLeave={e => {
                                                        e.currentTarget.style.color = 'var(--primary-color)';
                                                        e.currentTarget.style.background = 'none';
                                                    }}
                                                >
                                                    <Download size={14} /> Save to PDF
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="chat-messages" style={{ flex: 1, padding: '1rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.8rem', maxHeight: '350px' }}>
                                                {interviewMessages.map((msg, i) => (
                                                    <div key={i} style={{ 
                                                        alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                                                        maxWidth: '85%',
                                                        background: msg.role === 'user' ? 'var(--primary-color)' : 'rgba(255,255,255,0.05)',
                                                        color: msg.role === 'user' ? 'white' : 'var(--text-color)',
                                                        padding: '0.6rem 1rem',
                                                        borderRadius: msg.role === 'user' ? '14px 14px 2px 14px' : '14px 14px 14px 2px',
                                                        fontSize: '0.85rem',
                                                        lineHeight: '1.4',
                                                        border: msg.role === 'user' ? 'none' : '1px solid var(--light-border)'
                                                    }}>
                                                        {msg.content}
                                                    </div>
                                                ))}
                                                {loading && (
                                                    <div style={{ alignSelf: 'flex-start', background: 'rgba(255,255,255,0.05)', padding: '0.6rem 1rem', borderRadius: '14px 14px 14px 2px', border: '1px solid var(--light-border)' }}>
                                                        <Loader2 className="animate-spin" size={14} />
                                                    </div>
                                                )}
                                                <div ref={chatEndRef} />
                                            </div>
                                            <div className="chat-footer" style={{ padding: '0.4rem 0.6rem', borderTop: '1px solid var(--light-border)', background: 'rgba(255,255,255,0.02)' }}>
                                                <form onSubmit={sendMessage} style={{ display: 'flex', gap: '0.3rem', alignItems: 'center' }}>
                                                    <input 
                                                        type="text" 
                                                        value={userMessage}
                                                        onChange={(e) => setUserMessage(e.target.value)}
                                                        placeholder="Type your response..."
                                                        style={{ 
                                                            flex: 1,
                                                            background: 'rgba(0,0,0,0.1)',
                                                            border: '1px solid var(--light-border)',
                                                            padding: '0.6rem 0.8rem',
                                                            borderRadius: '8px',
                                                            color: 'var(--text-color)',
                                                            fontSize: '0.85rem',
                                                            outline: 'none'
                                                        }}
                                                    />
                                                    <button 
                                                        type="button" 
                                                        className="chat-control-btn"
                                                        onClick={toggleListening}
                                                        style={{ 
                                                            background: isListening ? 'var(--danger-color)' : 'var(--primary-color)',
                                                            boxShadow: isListening ? '0 0 10px var(--danger-color)' : 'none',
                                                        }}
                                                    >
                                                        {isListening ? <MicOff size={14} /> : <Mic size={14} />}
                                                    </button>
                                                    <button 
                                                        type="submit" 
                                                        className="chat-control-btn chat-send-btn"
                                                    >
                                                        <Send size={14} />
                                                    </button>
                                                    <button 
                                                        type="button" 
                                                        className="chat-control-btn chat-end-btn"
                                                        onClick={endInterview} 
                                                    >
                                                        End
                                                    </button>
                                                </form>
                                            </div>
                                        </>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            <div className="modal-footer" style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end', gap: '1rem', flexWrap: 'wrap' }}>
                    <button className="btn btn-outline" onClick={onClose} style={{ borderRadius: '50px', width: 'auto', minWidth: '100px' }}>
                        {translations[selectedLanguage]?.cancel || 'Close'}
                    </button>
                    {interviewData && (
                        <button 
                            className="btn btn-outline" 
                            onClick={handleDownloadReport} 
                            style={{ 
                                borderRadius: '50px', 
                                width: 'auto', 
                                gap: '8px',
                                borderColor: 'var(--primary-color)',
                                color: 'var(--primary-color)',
                                transition: 'all 0.2s ease'
                            }}
                            onMouseEnter={e => {
                                e.currentTarget.style.color = 'white';
                                e.currentTarget.style.background = 'var(--primary-color)';
                            }}
                            onMouseLeave={e => {
                                e.currentTarget.style.color = 'var(--primary-color)';
                                e.currentTarget.style.background = 'none';
                            }}
                        >
                            <FileText size={16} /> {translations[selectedLanguage]?.download_report}
                        </button>
                    )}
                    <button 
                        className="btn btn-primary" 
                        onClick={() => fetchAIInsights(selectedLanguage, true)} 
                        style={{ 
                            borderRadius: '50px',
                            opacity: (loading || retryTimer > 0) ? 0.6 : 1,
                            cursor: (loading || retryTimer > 0) ? 'not-allowed' : 'pointer',
                            width: 'auto',
                            minWidth: '130px',
                            margin: 0
                        }}
                        disabled={loading || retryTimer > 0}
                    >
                        <Sparkles size={16} style={{ marginRight: '6px' }} /> 
                        {retryTimer > 0 ? `${translations[selectedLanguage]?.wait || 'Wait'} (${retryTimer}s)` : (translations[selectedLanguage]?.regenerate || 'Regenerate')}
                    </button>
                </div>

                <IdealAnswerModal 
                    isOpen={showIdealModal}
                    onClose={() => setShowIdealModal(false)}
                    answer={interviewData?.[currentQuizIndex]?.answer}
                    language={selectedLanguage}
                />

                {toast && (
                    <div style={{
                        position: 'fixed',
                        bottom: '30px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        background: 'rgba(30, 41, 59, 0.95)',
                        color: 'white',
                        padding: '10px 24px',
                        borderRadius: '50px',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
                        zIndex: 10000,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        animation: 'fadeInUp 0.3s ease-out',
                        backdropFilter: 'blur(8px)',
                        border: '1px solid rgba(255,255,255,0.1)'
                    }}>
                        <CheckCircle2 size={18} color="#4ade80" />
                        <span style={{ fontSize: '0.9rem', fontWeight: '500' }}>{toast}</span>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PrepModal;
