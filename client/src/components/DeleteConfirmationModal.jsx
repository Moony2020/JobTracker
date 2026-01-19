import React from 'react';
import ReactDOM from 'react-dom';

const DeleteConfirmationModal = ({ isOpen, onClose, onConfirm, applicationName }) => {
  if (!isOpen) return null;

  return ReactDOM.createPortal(
    <div className="modal" onClick={onClose} id="deleteModal" style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: 9999 }}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '400px' }}>
        <div className="modal-header" style={{ marginBottom: '0.5rem', paddingBottom: '0.5rem' }}>
          <h2>Confirm Delete</h2>
          <button className="close-modal" onClick={onClose}>&times;</button>
        </div>
        
        <div className="modal-body" style={{ margin: '0.4rem 0 0.8rem', textAlign: 'left' }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: '1.4', margin: 0 }}>Are you sure you want to delete this application?</p>
          {applicationName && <p className="delete-target-name" style={{ fontWeight: 600, marginTop: '0.4rem', color: 'var(--text-color)', fontSize: '1.05rem', margin: '0.2rem 0 0' }}>{applicationName}</p>}
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
