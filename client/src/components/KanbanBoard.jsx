import React, { useState } from 'react';
import { Briefcase, Calendar, MapPin, MoreHorizontal, Sparkles } from 'lucide-react';

const KanbanBoard = ({ applications, onStatusChange, onEdit, onDelete, onPrep }) => {
    const columns = [
        { id: 'applied', title: 'Applied', color: 'var(--info-color)' },
        { id: 'interview', title: 'Interview', color: 'var(--warning-color)' },
        { id: 'test', title: 'Test', color: '#8b5cf6' },
        { id: 'offer', title: 'Offer', color: 'var(--success-color)' },
        { id: 'rejected', title: 'Rejected', color: 'var(--danger-color)' }
    ];

    const [draggedAppId, setDraggedAppId] = useState(null);

    const handleDragStart = (e, appId) => {
        setDraggedAppId(appId);
        e.dataTransfer.setData('appId', appId);
        e.dataTransfer.effectAllowed = 'move';
        // Add a ghost class or style
        e.target.style.opacity = '0.5';
    };

    const handleDragEnd = (e) => {
        setDraggedAppId(null);
        e.target.style.opacity = '1';
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    };

    const handleDrop = (e, status) => {
        e.preventDefault();
        const appId = e.dataTransfer.getData('appId');
        if (appId) {
            onStatusChange(appId, status);
        }
    };

    return (
        <div className="kanban-board" style={{ 
            display: 'flex', 
            gap: '1rem', 
            overflowX: 'auto', 
            padding: '1rem 0', 
            alignItems: 'flex-start',
            minHeight: '600px'
        }}>
            {columns.map(col => {
                const colApps = applications.filter(app => app.status === col.id);
                
                return (
                    <div 
                        key={col.id} 
                        className="kanban-column"
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDrop(e, col.id)}
                        style={{
                            flex: '0 0 280px',
                            background: 'var(--glass-bg)',
                            borderRadius: '16px',
                            padding: '1rem',
                            border: '1px solid var(--light-border)',
                            display: 'flex',
                            flexDirection: 'column',
                            height: '100%',
                            minHeight: '500px',
                            transition: 'all 0.2s',
                            position: 'relative'
                        }}
                    >
                        <div className="column-header" style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'space-between', 
                            marginBottom: '1rem',
                            paddingBottom: '0.5rem',
                            borderBottom: '2px solid',
                            borderColor: col.color
                        }}>
                            <h3 style={{ fontSize: '1rem', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ 
                                    width: '10px', 
                                    height: '10px', 
                                    borderRadius: '50%', 
                                    background: col.color 
                                }}></span>
                                {col.title}
                            </h3>
                            <span style={{ 
                                background: 'rgba(255,255,255,0.1)', 
                                padding: '2px 8px', 
                                borderRadius: '12px', 
                                fontSize: '0.8rem',
                                color: 'var(--text-muted)'
                            }}>
                                {colApps.length}
                            </span>
                        </div>

                        <div className="kanban-cards" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', flex: 1 }}>
                            {colApps.map(app => (
                                <div 
                                    key={app._id}
                                    draggable
                                    onDragStart={(e) => handleDragStart(e, app._id)}
                                    onDragEnd={handleDragEnd}
                                    className="kanban-card"
                                    onClick={() => onEdit(app)}
                                    style={{
                                        background: 'var(--card-bg)',
                                        borderRadius: '12px',
                                        padding: '1rem',
                                        cursor: 'grab',
                                        boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                                        border: '1px solid var(--light-border)',
                                        transition: 'transform 0.2s, box-shadow 0.2s',
                                        position: 'relative'
                                    }}
                                >
                                    <div style={{ marginBottom: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                        <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: '600', color: 'var(--text-color)' }}>{app.jobTitle}</h4>
                                        {app.status === 'interview' && (
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); onPrep(app); }}
                                                style={{ 
                                                    background: 'none', 
                                                    border: 'none', 
                                                    cursor: 'pointer', 
                                                    color: '#6366f1',
                                                    padding: 0
                                                }}
                                                title="AI Prep"
                                            >
                                                <Sparkles size={16} />
                                            </button>
                                        )}
                                    </div>
                                    
                                    <p style={{ margin: '0 0 0.8rem 0', fontSize: '0.9rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <Briefcase size={12} /> {app.company}
                                    </p>

                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            <MapPin size={12} /> {app.location?.split(',')[0] || 'Remote'}
                                        </span>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            <Calendar size={12} /> {new Date(app.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default KanbanBoard;
