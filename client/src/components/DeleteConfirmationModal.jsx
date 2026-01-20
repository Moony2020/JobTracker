import React from 'react';
import ReactDOM from 'react-dom';
import { X } from 'lucide-react';

const DeleteConfirmationModal = ({ isOpen, onClose, onConfirm, applicationName }) => {
  if (!isOpen) return null;

  return ReactDOM.createPortal(
    <div className="modal" onClick={onClose} id="deleteModal" style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: 9999 }}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '385px' }}>
        <div className="modal-header" style={{ marginBottom: '0.5rem', paddingBottom: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0, fontSize: '1.2rem' }}>Confirm Delete</h2>
          <button 
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
        
        <div className="modal-body" style={{ margin: '0.4rem 0 0.8rem', textAlign: 'left' }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: '1.4', margin: 0 }}>Are you sure you want to delete this application?</p>
          {applicationName && <p className="delete-target-name" style={{ fontWeight: 600, marginTop: '0.4rem', color: 'var(--text-color)', fontSize: '1rem', margin: '0.2rem 0 0' }}>{applicationName}</p>}
        </div>

        <div className="form-actions">
          <button className="btn btn-outline" onClick={onClose}>Cancel</button>
          <button className="btn btn-danger" onClick={onConfirm}>Delete</button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default DeleteConfirmationModal;
