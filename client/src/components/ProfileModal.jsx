import React, { useState, useEffect } from 'react';
import { X, FileText, Save, Loader2, Sparkles, Upload } from 'lucide-react';
import api from '../services/api';
import translations from '../utils/translations';

const ProfileModal = ({ isOpen, onClose, language }) => {
    const t = translations[language] || translations['English'];
    const [profile, setProfile] = useState('');
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    useEffect(() => {
        if (isOpen) {
            fetchProfile();
        }
    }, [isOpen]);

    const fetchProfile = async () => {
        setLoading(true);
        try {
            const response = await api.get('/auth/profile');
            setProfile(response.data.profile || '');
        } catch (error) {
            console.error('Error fetching profile:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        setMessage({ type: '', text: '' });
        try {
            await api.put('/auth/profile', { profile });
            localStorage.removeItem('jt_ai_cache');
            setMessage({ type: 'success', text: 'Profile saved successfully!' });
            setTimeout(() => onClose(), 1500);
        } catch {
            setMessage({ type: 'error', text: 'Failed to save profile' });
        } finally {
            setSaving(false);
        }
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (file.type !== 'application/pdf') {
            setMessage({ type: 'error', text: 'Please upload a PDF file' });
            return;
        }

        setUploading(true);
        setMessage({ type: '', text: '' });

        const formData = new FormData();
        formData.append('cv', file);

        try {
            const response = await api.post('/auth/profile/upload', formData, {
                headers: { 
                    'Content-Type': 'multipart/form-data'
                }
            });
            setProfile(response.data.profile);
            localStorage.removeItem('jt_ai_cache');
            setMessage({ type: 'success', text: 'CV uploaded and parsed successfully!' });
        } catch (error) {
            console.error('Upload failed:', error);
            setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to upload CV' });
        } finally {
            setUploading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="modal">
            <div className="modal-content" style={{ maxWidth: '600px', width: '95%' }}>
                <div className="modal-header" style={{ borderBottom: 'none', paddingBottom: '0' }}>
                    <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.2rem', margin: 0 }}>
                        <FileText size={24} color="var(--primary-color)" />
                        {t.settings}
                    </h2>
                    <button 
                        className="close-modal" 
                        onClick={onClose}
                        style={{
                            width: '30px',
                            height: '30px',
                            padding: 0,
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
                </div>

                <div className="modal-body" style={{ padding: '10px 0' }}>
                    <div style={{ 
                        background: 'rgba(99, 102, 241, 0.05)', 
                        padding: '1rem', 
                        borderRadius: '12px', 
                        marginBottom: '1.5rem',
                        border: '1px solid rgba(99, 102, 241, 0.1)',
                        display: 'flex',
                        gap: '12px'
                    }}>
                        <Sparkles size={20} color="var(--primary-color)" style={{ flexShrink: 0, marginTop: '2px' }} />
                        <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', margin: 0, lineHeight: '1.5' }}>
                            Upload your **PDF CV** or paste your **Experience, Skills, and Education** below. AI will use this data for accurate Match Scores and tailored prep.
                        </p>
                    </div>

                    <div style={{ marginBottom: '1.5rem' }}>
                        <input 
                            type="file" 
                            id="cv-upload" 
                            accept=".pdf" 
                            style={{ display: 'none' }} 
                            onChange={handleFileUpload}
                        />
                        <button 
                            className="btn btn-outline" 
                            onClick={() => document.getElementById('cv-upload').click()}
                            disabled={uploading}
                            style={{ 
                                width: '100%', 
                                padding: '12px', 
                                borderStyle: 'dashed', 
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'center', 
                                gap: '8px' 
                            }}
                        >
                            {uploading ? (
                                <Loader2 size={20} className="animate-spin" />
                            ) : (
                                <Upload size={20} />
                            )}
                            {uploading ? 'Parsing PDF...' : 'Upload CV (PDF)'}
                        </button>
                    </div>

                    {loading ? (
                        <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
                            <Loader2 className="animate-spin" size={32} color="var(--primary-color)" />
                        </div>
                    ) : (
                        <>
                            <textarea
                                value={profile}
                                onChange={(e) => setProfile(e.target.value)}
                                placeholder="Example: 5 years experience in React, backend Node.js, BSc in Computer Science..."
                                style={{
                                    width: '100%',
                                    height: '250px',
                                    padding: '15px',
                                    borderRadius: '12px',
                                    border: '1px solid var(--light-border)',
                                    background: 'var(--glass-bg)',
                                    color: 'var(--text-color)',
                                    fontSize: '1rem',
                                    lineHeight: '1.6',
                                    resize: 'none',
                                    outline: 'none',
                                    transition: 'border-color 0.3s'
                                }}
                                onFocus={(e) => e.target.style.borderColor = 'var(--primary-color)'}
                                onBlur={(e) => e.target.style.borderColor = 'var(--light-border)'}
                            />
                            
                            {message.text && (
                                <div style={{ 
                                    marginTop: '15px', 
                                    padding: '10px', 
                                    borderRadius: '8px', 
                                    textAlign: 'center',
                                    fontSize: '0.9rem',
                                    backgroundColor: message.type === 'success' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                                    color: message.type === 'success' ? '#22c55e' : '#ef4444',
                                    border: `1px solid ${message.type === 'success' ? '#22c55e' : '#ef4444'}`
                                }}>
                                    {message.text}
                                </div>
                            )}
                        </>
                    )}
                </div>

                <div className="modal-footer" style={{ borderTop: 'none', paddingTop: '0', paddingBottom: '20px', display: 'flex', justifyContent: 'center', gap: '12px' }}>
                    <button className="btn btn-outline" onClick={onClose} disabled={saving} style={{ border: 'none' }}>{t.cancel || 'Cancel'}</button>
                    <button 
                        className="btn btn-primary" 
                        onClick={handleSave} 
                        disabled={saving || loading}
                        style={{ border: 'none', display: 'flex', alignItems: 'center', gap: '8px', minWidth: '120px', justifyContent: 'center' }}
                    >
                        {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                        {t.save_changes || 'Save Profile'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ProfileModal;
