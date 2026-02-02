import React, { useState, useEffect, useCallback } from 'react';
import { Search, Sparkles, ExternalLink, Briefcase, MapPin, Globe, Loader2, ArrowRight } from 'lucide-react';
import api from '../services/api';
import translations from '../utils/translations';

const JobFinder = ({ language, user }) => {
    const t = translations[language] || translations['English'];
    const [searchQuery, setSearchQuery] = useState('');
    const [location, setLocation] = useState(user?.location || '');
    const [loading, setLoading] = useState(false);
    const [recLoading, setRecLoading] = useState(false);
    const [jobs, setJobs] = useState([]);
    const [recommendations, setRecommendations] = useState([]);
    const [error, setError] = useState(null);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(false);

    const handleSearch = useCallback(async (e, queryOverride = null, pageNum = 1, locationOverride = null) => {
        if (e) e.preventDefault();
        const finalQuery = queryOverride || searchQuery;
        const finalLocation = locationOverride !== null ? locationOverride : location;
        
        if (!finalQuery.trim()) return;

        setLoading(true);
        setError(null);
        if (pageNum === 1) setJobs([]); // Clear results for a new search

        try {
            const response = await api.get(`/jobs/search?q=${encodeURIComponent(finalQuery)}&l=${encodeURIComponent(finalLocation)}&page=${pageNum}`);
            const newJobs = response.data.jobs || [];
            
            if (pageNum === 1) {
                setJobs(newJobs);
            } else {
                setJobs(prev => [...prev, ...newJobs]);
            }
            
            setPage(pageNum);
            setHasMore(response.data.hasMore);
        } catch (err) {
            setError('Failed to fetch jobs. Please try again later.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [searchQuery, location]);

    const fetchRecommendations = useCallback(async () => {
        setRecLoading(true);
        try {
            const response = await api.get('/ai/recommend-jobs');
            setRecommendations(response.data.recommendations || []);
            // Automatically search for the first recommendation
            if (response.data.recommendations?.length > 0) {
                // Do not auto-search. Let user choose.
            }
        } catch (err) {
            console.error('Failed to fetch job recommendations:', err);
        } finally {
            setRecLoading(false);
        }
    }, []);

    useEffect(() => {
        if (user) {
            if (user.location) setLocation(user.location);
            fetchRecommendations();
        }
    }, [user, fetchRecommendations]);

    const getIndeedLink = (title, location) => {
        return `https://www.indeed.com/jobs?q=${encodeURIComponent(title)}&l=${encodeURIComponent(location)}`;
    };

    const getLinkedInLink = (title, location) => {
        return `https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(title)}&location=${encodeURIComponent(location)}`;
    };

    const getArbetsformedlingenLink = (title, location) => {
        // Arbetsförmedlingen search URL - Platsbanken
        return `https://arbetsformedlingen.se/platsbanken/annonser?q=${encodeURIComponent(title)}&l=${encodeURIComponent(location)}`;
    };

    return (
        <div className="job-finder-container">
            <div className="dashboard-header">
                <div>
                    <h1>{t.job_finder || 'AI Job Match'}</h1>
                    <p style={{ color: 'var(--text-muted)' }}>
                        Find your next opportunity based on your skills and experience.
                    </p>
                </div>
            </div>

            {/* Discover Engine */}
            <div className="discovery-engine" style={{ marginBottom: '2rem' }}>
                <div className="section-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', gap: '8px', marginBottom: '1.2rem' }}>
                    <Globe size={20} color="var(--primary-color)" />
                    <h2 style={{ fontSize: '1.2rem', margin: 0 }}>Discover Engine</h2>
                </div>
                <div className="discovery-pills" style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                    {[
                        { id: 'remote', label: 'Remote Only', query: 'Remote', icon: <Globe size={16} /> },
                        { id: 'ai', label: 'AI & Machine Learning', query: 'AI Machine Learning', icon: <Sparkles size={16} /> },
                        { id: 'high-salary', label: 'High Salary ($100k+)', query: 'High Salary', icon: <Briefcase size={16} /> },
                        { id: 'startup', label: 'Startup Hub', query: 'Startup', icon: <ExternalLink size={16} /> }
                    ].map((cat) => (
                        <button 
                            key={cat.id} 
                            className="discovery-pill"
                            onClick={() => {
                                const q = cat.query;
                                setSearchQuery(q);
                                setPage(1);
                                handleSearch(null, q, 1);
                            }}
                            style={{
                                padding: '10px 20px',
                                borderRadius: '12px',
                                border: '1px solid var(--light-border)',
                                background: 'var(--glass-bg)',
                                color: 'var(--text-color)',
                                cursor: 'pointer',
                                fontSize: '0.9rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                transition: 'all 0.3s ease'
                            }}
                        >
                            <span style={{ display: 'flex', alignItems: 'center' }}>{cat.icon}</span>
                            <span>{cat.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Recommendations Section */}
            <div className="ai-recommendations" style={{ marginBottom: '2rem' }}>
                <div className="section-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', gap: '8px', marginBottom: '1rem' }}>
                    <Sparkles size={20} color="var(--primary-color)" />
                    <h2 style={{ fontSize: '1.2rem', margin: 0 }}>Tailored Recommendations</h2>
                </div>
                
                {recLoading ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '1rem' }}>
                        <Loader2 className="animate-spin" size={20} />
                        <span style={{ color: 'var(--text-muted)' }}>Analyzing your CV for the best matches...</span>
                    </div>
                ) : recommendations.length > 0 ? (
                    <div className="recommendation-pills" style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                        {recommendations.map((rec, idx) => (
                            <button 
                                key={idx} 
                                className="rec-pill"
                                onClick={() => {
                                    setSearchQuery(rec.title);
                                    setPage(1);
                                    handleSearch(null, rec.title, 1);
                                }}
                                style={{
                                    padding: '8px 16px',
                                    borderRadius: '50px',
                                    border: '1px solid var(--primary-color)',
                                    background: searchQuery === rec.title ? 'var(--primary-color)' : 'transparent',
                                    color: searchQuery === rec.title ? '#fff' : 'var(--primary-color)',
                                    cursor: 'pointer',
                                    fontSize: '0.9rem',
                                    transition: 'all 0.2s'
                                }}
                            >
                                {rec.title}
                            </button>
                        ))}
                    </div>
                ) : (
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                        Update your <span style={{ color: 'var(--primary-color)', cursor: 'pointer' }}>CV Profile</span> to get personalized job recommendations.
                    </p>
                )}
            </div>

            {/* Search Bar */}
            <form onSubmit={(e) => { setPage(1); handleSearch(e, null, 1); }} style={{ padding: '0', marginBottom: '2rem' }}>
                <div className="job-search-grid">
                    <div className="form-group">
                        <div className="input-with-icon">
                            <Briefcase className="field-icon" size={18} />
                            <input 
                                type="text" 
                                className="form-control" 
                                placeholder="Job title, keywords, or company"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="form-group">
                        <div className="input-with-icon">
                            <MapPin className="field-icon" size={18} />
                            <input 
                                type="text" 
                                className="form-control" 
                                placeholder="City, state, or remote"
                                value={location}
                                onChange={(e) => setLocation(e.target.value)}
                            />
                        </div>
                    </div>
                    <button type="submit" className="btn btn-primary" disabled={loading}>
                        {loading && page === 1 ? <Loader2 className="animate-spin" size={20} /> : <Search size={20} />}
                    </button>
                </div>
            </form>

            {/* Results Section */}
            <div className="job-results">
                {loading && page === 1 ? (
                    <div style={{ textAlign: 'center', padding: '3rem' }}>
                        <Loader2 className="animate-spin" size={40} color="var(--primary-color)" style={{ margin: '0 auto 1rem' }} />
                        <p style={{ color: 'var(--text-muted)' }}>Searching for jobs...</p>
                    </div>
                ) : error ? (
                    <div className="notification error show" style={{ position: 'relative', top: 0, right: 0 }}>{error}</div>
                ) : jobs.length > 0 ? (
                    <>
                        <div className="job-cards-grid">
                            {jobs.map((job, idx) => (
                                <div key={idx} className="job-card">
                                    <div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                                            <div className="job-badge" style={{ 
                                                background: 'rgba(99, 102, 241, 0.1)', 
                                                color: 'var(--primary-color)',
                                                padding: '4px 12px',
                                                borderRadius: '50px',
                                                fontSize: '0.75rem',
                                                fontWeight: '600'
                                            }}>
                                                {job.type || 'Full-time'}
                                            </div>
                                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{job.posted || 'Recent'}</span>
                                        </div>
                                        <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.1rem' }}>{job.title}</h3>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1rem' }}>
                                            <Globe size={16} />
                                            <span>{job.company} • {job.location}</span>
                                        </div>
                                        <p style={{ fontSize: '0.85rem', color: 'var(--text-color)', marginBottom: '1.5rem', lineHeight: '1.5', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                            {job.description}
                                        </p>
                                    </div>
                                    <div className="job-card-footer">
                                        <a href={job.url} target="_blank" rel="noopener noreferrer" className="btn btn-primary btn-apply-now">
                                            Apply Now <ExternalLink size={14} />
                                        </a>
                                        <div className="social-job-links">
                                            <a href={getIndeedLink(job.title, location)} target="_blank" rel="noopener noreferrer" className="btn btn-social-job" title="Search on Indeed">
                                                <img src="https://www.google.com/s2/favicons?domain=indeed.com" width="16" alt="" />
                                            </a>
                                            <a href={getLinkedInLink(job.title, location)} target="_blank" rel="noopener noreferrer" className="btn btn-social-job" title="Search on LinkedIn">
                                                <img src="https://www.google.com/s2/favicons?domain=linkedin.com" width="16" alt="" />
                                            </a>
                                            <a href={getArbetsformedlingenLink(job.title, location)} target="_blank" rel="noopener noreferrer" className="btn btn-social-job" title="Search on Arbetsförmedlingen">
                                                <img src="https://www.google.com/s2/favicons?domain=arbetsformedlingen.se" width="16" alt="" />
                                            </a>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        
                        {/* Pagination / Load More */}
                        <div style={{ marginTop: '2.5rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1.5rem' }}>
                            {hasMore && (
                                <button 
                                    className="btn btn-secondary" 
                                    onClick={() => handleSearch(null, null, page + 1)}
                                    disabled={loading}
                                    style={{ padding: '0.8rem 2rem', borderRadius: '50px', display: 'flex', alignItems: 'center', gap: '8px' }}
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="animate-spin" size={18} />
                                            <span>Loading...</span>
                                        </>
                                    ) : (
                                        <>
                                            <span>Load More Jobs</span>
                                            <ArrowRight size={18} />
                                        </>
                                    )}
                                </button>
                            )}
                        </div>
                        <div style={{ textAlign: 'center', marginTop: '1rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                            Showing {jobs.length} results
                        </div>
                    </>
                ) : (
                    <div style={{ textAlign: 'center', padding: '5rem 2rem', background: 'var(--glass-bg)', borderRadius: '16px', border: '1px dashed var(--light-border)' }}>
                        <Briefcase size={48} color="var(--text-muted)" style={{ marginBottom: '1rem', opacity: 0.3 }} />
                        <h3>{searchQuery ? 'No jobs found' : 'Ready to find your match?'}</h3>
                        <p style={{ color: 'var(--text-muted)' }}>
                            {searchQuery ? 'Try adjusting your search terms or location.' : 'Search for a job title or city above, or use our AI recommendations.'}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default JobFinder;
