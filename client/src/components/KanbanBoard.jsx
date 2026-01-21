import React, { useState } from 'react';
import { Briefcase, Calendar, MapPin, MoreHorizontal, Sparkles, Edit2, Trash2 } from 'lucide-react';
import translations from '../utils/translations';

const KanbanBoard = ({ applications, onStatusChange, onEdit, onDelete, onPrep, language }) => {
    const t = translations[language] || translations['English'];
    const columns = [
        { id: 'applied', title: t.applied, color: 'var(--info-color)' },
        { id: 'interview', title: t.interview, color: 'var(--warning-color)' },
        { id: 'test', title: t.test, color: '#8b5cf6' },
        { id: 'offer', title: t.offer, color: 'var(--success-color)' },
        { id: 'rejected', title: t.rejected, color: 'var(--danger-color)' },
        { id: 'canceled', title: t.canceled, color: 'var(--text-muted)' }
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
        <div className="kanban-board">
            {columns.map(col => {
                const colApps = applications.filter(app => app.status === col.id);
                
                return (
                    <div 
                        key={col.id} 
                        className="kanban-column"
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDrop(e, col.id)}
                    >
                        <div className="kanban-column-header">
                            {col.title.toUpperCase()}
                            <span className="count">
                                {colApps.length}
                            </span>
                        </div>

                        <div className="kanban-cards">
                            {colApps.map(app => (
                                <div 
                                    key={app._id}
                                    draggable
                                    onDragStart={(e) => handleDragStart(e, app._id)}
                                    onDragEnd={handleDragEnd}
                                    className="kanban-card"
                                >
                                    <h4>{app.jobTitle}</h4>
                                    <span className="company">{app.company}</span>
                                    
                                    <div className="meta">
                                        <span><MapPin size={12} /> {app.location || 'Remote'}</span>
                                        <span><Calendar size={12} /> {new Date(app.date).toLocaleDateString()}</span>
                                    </div>

                                    <div className="actions">
                                        <button className="btn-action btn-prep" onClick={(e) => { e.stopPropagation(); onPrep(app); }} title="AI Prep"><Sparkles size={14} /></button>
                                        <button className="btn-action btn-edit" onClick={(e) => { e.stopPropagation(); onEdit(app); }}><Edit2 size={14} /></button>
                                        <button className="btn-action btn-delete" onClick={(e) => { e.stopPropagation(); onDelete(app._id); }}><Trash2 size={14} /></button>
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
