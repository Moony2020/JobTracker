import React from 'react';
import ReactDOM from 'react-dom';
import { X } from 'lucide-react';

const DeleteConfirmationModal = ({ isOpen, onClose, onConfirm, applicationName, itemType = 'application', message }) => {
  if (!isOpen) return null;

  return ReactDOM.createPortal(
    <div className="modal" onClick={onClose} id="deleteModal" style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: 9999 }}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '385px' }}>
        <div className="modal-header" style={{ marginBottom: '0.5rem', paddingBottom: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0, fontSize: '1.2rem' }}>Confirm Delete</h2>
          <button 
            className="btn-close-modal"
            onClick={onClose}
          >
            <X size={16} />
          </button>
        </div>
        
        <div className="modal-body" style={{ margin: '0.4rem 0 0.8rem', textAlign: 'left' }}>
          <p className="modal-text">
            {message || `Are you sure you want to delete this ${itemType}?`}
          </p>
          {applicationName && <p className="delete-target-name">{applicationName}</p>}
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
