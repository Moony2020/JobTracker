import React, { useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import ResumeList from './ResumeList';
import Editor from './Editor';
import SuccessPage from './SuccessPage';

const CVBuilder = ({ language, onExit, setFullScreen, showNotify, isPrinting }) => {
  const location = useLocation();
  const navigate = useNavigate();

  // 1. Derive View from URL
  const view = useMemo(() => {
    if (isPrinting) return 'print';
    if (location.hash === '#editor') return 'editor';
    if (location.pathname.includes('/success')) return 'success';
    return 'list';
  }, [location, isPrinting]);

  // 2. Derive Selected CV from URL/Storage
  const selectedCV = useMemo(() => {
    if (isPrinting) {
      const parts = location.pathname.split('/');
      const id = parts[parts.length - 1];
      return { _id: id };
    }
    if (view === 'editor') {
        const activeId = localStorage.getItem('cv_activeId');
        return activeId ? { _id: activeId } : null;
    }
    return null;
  }, [view, location.pathname, isPrinting]);

  // Handle full screen based on view
  useEffect(() => {
    if (isPrinting) return;
    if (setFullScreen) setFullScreen(view === 'editor');
  }, [view, setFullScreen, isPrinting]);

  const handleEdit = (cv) => {
    localStorage.setItem('cv_activeId', cv._id);
    navigate('#editor');
  };

  const handleCreateNew = (template) => {
    localStorage.removeItem('cv_activeId');
    navigate('#editor', { state: { templateKey: template?.key } });
  };

  const handleBackToList = () => {
    navigate('/cv-builder');
  };

  if (view === 'print') {
    return (
      <div className="cv-print-view">
        <Editor 
          cvId={selectedCV?._id} 
          isPrintMode={true}
        />
      </div>
    );
  }

  if (view === 'success') {
    return (
        <SuccessPage showNotify={showNotify} />
    );
  }

  return (
    <div className="cv-builder-page">
      {view === 'list' ? (
        <ResumeList 
          onEdit={handleEdit} 
          onCreate={handleCreateNew} 
          language={language}
          onBack={onExit}
          showNotify={showNotify}
        />
      ) : (
        <Editor 
          cvId={selectedCV?._id} 
          onBack={handleBackToList}
          language={language}
        />
      )}
    </div>
  );
};

export default CVBuilder;