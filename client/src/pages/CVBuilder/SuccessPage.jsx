import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../../services/api';
import { CheckCircle, Download, ArrowLeft, Loader2, X } from 'lucide-react';

const SuccessPage = ({ showNotify }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const [status, setStatus] = useState('verifying'); // verifying, ready, error
    const [cvId, setCvId] = useState(null);
    const [cvTitle, setCvTitle] = useState('Your CV');

    const handleDownload = React.useCallback(async (targetCvId, targetTitle) => {
        try {
            if (showNotify) showNotify('Starting download...', 'info');
            
            const response = await api.get(`/cv/export/${targetCvId}`, {
                responseType: 'blob'
            });
            
            if (response.data.type !== 'application/pdf') {
                throw new Error('Verification in progress. If download doesn\'t start, please refresh.');
            }

            const url = window.URL.createObjectURL(response.data);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `${targetTitle || 'CV'}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link);
            window.URL.revokeObjectURL(url);
            
            if (showNotify) showNotify('PDF downloaded successfully!', 'success');
        } catch (err) {
            console.error('[SuccessPage] Download error:', err);
            if (showNotify) showNotify(err.message || 'Error downloading PDF', 'error');
        }
    }, [showNotify]);

    const hasStartedRef = React.useRef(false);

    useEffect(() => {
        if (hasStartedRef.current) return;
        
        const query = new URLSearchParams(location.search);
        const sessionId = query.get('session_id');

        if (!sessionId) {
            setStatus('error');
            return;
        }

        hasStartedRef.current = true;
        let isCancelled = false;
        let pollCount = 0;
        const maxPolls = 10; 

        const verifySession = async () => {
            if (isCancelled) return;
            try {
                const res = await api.get(`/payment/stripe/session/${sessionId}`);
                const { cvId: fetchedCvId, cvTitle: fetchedCvTitle, isFulfilled, status: paymentStatus } = res.data;
                
                if (paymentStatus !== 'paid') {
                    setStatus('error');
                    return;
                }

                setCvId(fetchedCvId);
                setCvTitle(fetchedCvTitle || 'Your CV');

                if (isFulfilled) {
                    setStatus('ready');
                    // Use a slightly longer timeout to ensure backend PDF generation (Puppeteer) is ready
                    setTimeout(() => {
                        if (!isCancelled) {
                            handleDownload(fetchedCvId, fetchedCvTitle);
                        }
                    }, 2000);
                } else if (pollCount < maxPolls) {
                    pollCount++;
                    setTimeout(verifySession, 2500); // 2.5s between polls
                } else {
                    setStatus('ready');
                }

            } catch (err) {
                console.error('[SuccessPage] Verification failed:', err);
                if (pollCount < 3) {
                    pollCount++;
                    setTimeout(verifySession, 2000);
                } else {
                    setStatus('error');
                }
            }
        };

        verifySession();

        return () => { isCancelled = true; };
    }, [location.search, handleDownload]);

    if (status === 'verifying') {
        return (
            <div className="success-page-container">
                <div className="success-card glass-card" style={{ padding: '60px 40px' }}>
                    <Loader2 size={48} className="animate-spin" style={{ color: '#6366f1', marginBottom: '24px' }} />
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1e293b', marginBottom: '8px' }}>Securing your download...</h2>
                    <p style={{ fontSize: '1rem', color: '#64748b' }}>Please wait while we prepare your premium PDF.</p>
                </div>
            </div>
        );
    }

    if (status === 'error') {
        return (
            <div className="success-page-container">
                <div className="success-icon-wrapper" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}>
                    <X size={48} />
                </div>
                <h2>Something went wrong</h2>
                <p>
                    We couldn't verify your session. If you completed the payment, your CV is safe in your "Saved Resumes" list.
                </p>
                <button 
                    className="btn-back-success"
                    onClick={() => navigate('/cv-builder')}
                >
                    Back to CV Builder
                </button>
            </div>
        );
    }

    return (
        <div className="success-page-container">
            <div className="success-card glass-card">
                <div className="success-icon-wrapper">
                    <CheckCircle size={64} className="check-animate" />
                </div>
                
                <h1 className="success-title">Payment Successful!</h1>
                
                <p className="success-message">
                    Thank you for your purchase. Your premium PDF download for <strong>{cvTitle}</strong> will start automatically in a moment.
                </p>

                <div className="success-status-badge">
                    {status === 'ready' ? (
                        <>
                            <div className="status-dot pulsed" />
                            <span>Ready for download</span>
                        </>
                    ) : (
                        <>
                            <Loader2 className="animate-spin" size={16} />
                            <span>Preparing your PDF...</span>
                        </>
                    )}
                </div>

                <div className="success-actions">
                    <button 
                        onClick={() => handleDownload(cvId, cvTitle)}
                        className="btn-download-success"
                        disabled={status !== 'ready'}
                    >
                        <Download size={20} />
                        Download PDF Now
                    </button>
                    
                    <button 
                        onClick={() => navigate('/cv-builder')}
                        className="btn-back-success"
                    >
                        Back to My Resumes
                    </button>
                </div>

                <p className="success-footer-note">
                    You can access this download indefinitely from your "Saved Resumes" dashboard.
                </p>
            </div>
        </div>
    );
};

export default SuccessPage;
