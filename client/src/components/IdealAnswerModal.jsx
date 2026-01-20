import React from 'react';
import { X, CheckCircle2 } from 'lucide-react';
import translations from '../utils/translations';

const IdealAnswerModal = ({ isOpen, onClose, answer, language = 'English' }) => {
    if (!isOpen) return null;

    return (
        <div style={{
            position: 'fixed',
            inset: 0,
            zIndex: 3000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.5rem',
            background: 'rgba(15, 23, 42, 0.4)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
        }} onClick={onClose}>
            <div style={{
                background: 'var(--bg-color)',
                width: '100%',
                maxWidth: '500px',
                borderRadius: '20px',
                padding: '1.5rem',
                position: 'relative',
                boxShadow: 'var(--shadow-lg)',
                border: '1px solid var(--glass-border)',
                animation: 'modalSlideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
            }} onClick={e => e.stopPropagation()}>
                
                <button 
                    onClick={onClose}
                    style={{
                        position: 'absolute',
                        top: '0.75rem',
                        right: '0.75rem',
                        background: 'rgba(150, 150, 150, 0.15)',
                        border: 'none',
                        borderRadius: '50%',
                        width: '30px',
                        height: '30px',
                        padding: 0,
                        cursor: 'pointer',
                        color: 'var(--text-color)',
                        transition: 'all 0.2s ease',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 10
                    }}
                    onMouseEnter={e => {
                        e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)';
                        e.currentTarget.style.color = 'var(--danger-color)';
                    }}
                    onMouseLeave={e => {
                        e.currentTarget.style.background = 'rgba(150, 150, 150, 0.15)';
                        e.currentTarget.style.color = 'var(--text-color)';
                    }}
                >
                    <X size={16} />
                </button>

                <div style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '12px',
                        background: 'rgba(16, 185, 129, 0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--success-color)'
                    }}>
                        <CheckCircle2 size={24} />
                    </div>
                    <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-color)' }}>
                        {translations[language]?.model_answer || 'Model Answer'}
                    </h3>
                </div>


                <div style={{
                    maxHeight: '40vh',
                    overflowY: 'auto',
                    padding: '0.75rem 1rem',
                    background: 'var(--glass-bg)',
                    borderRadius: '16px',
                    border: '1px solid var(--glass-border)',
                    fontSize: '0.95rem',
                    lineHeight: '1.6',
                    color: 'var(--text-color)',
                    marginBottom: '1rem'
                }}>
                    {answer}
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <button 
                        className="btn btn-primary"
                        onClick={onClose}
                        style={{
                            minWidth: '85px',
                            height: '34px',
                            borderRadius: '50px',
                            fontWeight: 700,
                            padding: '0 1.25rem',
                            fontSize: '0.85rem'
                        }}
                    >
                        {translations[language]?.got_it || 'Got it'}
                    </button>
                </div>
            </div>

            <style>
                {`
                    @keyframes modalSlideUp {
                        from { opacity: 0; transform: translateY(20px) scale(0.95); }
                        to { opacity: 1; transform: translateY(0) scale(1); }
                    }
                `}
            </style>
        </div>
    );
};

export default IdealAnswerModal;
