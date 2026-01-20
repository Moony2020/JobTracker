import React, { useState, useEffect, useRef } from 'react';
import { X, Sparkles, MessageSquare, Briefcase, Loader2, CheckCircle2, RotateCw } from 'lucide-react';
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

    // Ref to prevent parallel identical fetches (especially in Strict Mode)
    const pendingFetchRef = useRef(null);

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
                            <select 
                                value={selectedLanguage} 
                                onChange={handleLanguageChange}
                                style={{
                                    padding: '0.2rem 0.4rem',
                                    borderRadius: '8px',
                                    border: '1px solid var(--light-border)',
                                    fontSize: '0.8rem',
                                    background: 'var(--glass-bg)',
                                    color: 'var(--text-color)',
                                    cursor: 'pointer',
                                    outline: 'none'
                                }}
                            >
                                <option value="English">English</option>
                                <option value="Swedish">Swedish</option>
                                <option value="Arabic">Arabic</option>
                            </select>
                            
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
                                                alert(translations[selectedLanguage]?.copied || 'Copied to clipboard!');
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
                                                alert(translations[selectedLanguage]?.copied || 'Copied to clipboard!');
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
                        </div>
                    ) }
                </div>
            </div>

            <div className="modal-footer" style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end', gap: '1rem', flexWrap: 'wrap' }}>
                    <button className="btn btn-outline" onClick={onClose} style={{ borderRadius: '50px', width: 'auto', minWidth: '100px' }}>
                        {translations[selectedLanguage]?.cancel || 'Close'}
                    </button>
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
            </div>
        </div>
    );
};

export default PrepModal;
