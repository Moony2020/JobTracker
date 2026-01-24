import React, { useState, useEffect } from 'react';
import ResumeList from './ResumeList';
import Editor from './Editor';
import './CVBuilder.css';

const CVBuilder = ({ language, user, onExit, setFullScreen }) => {
  // Default to list view to prevent getting stuck
  const [view, setView] = useState('list');
  
  // Persist selected CV ID (optional, but let's keep it safe or reset it)
  const [selectedCV, setSelectedCV] = useState(null);

  // Ensure full screen is disabled on mount (list view) and set initial history state
  useEffect(() => {
    if (setFullScreen) setFullScreen(false);
    
    // Replace current state with 'list' so we have a base to go back to
    window.history.replaceState({ view: 'list' }, '', '');

    return () => {
      if (setFullScreen) setFullScreen(false); // Cleanup on unmount
    };
  }, [setFullScreen]);

  // Sync with browser history for back button support
  useEffect(() => {
    const handlePopState = (event) => {
      // If we go back and there's no state, or state says list, go to list
      if (!event.state || event.state.view === 'list') {
        setView('list');
        if (setFullScreen) setFullScreen(false);
        localStorage.setItem('cv_view', 'list');
        localStorage.removeItem('cv_activeId');
        setSelectedCV(null);
      } else if (event.state.view === 'editor') {
        // If forward to editor (preserving state)
        setView('editor');
        if (setFullScreen) setFullScreen(true);
        if (event.state.cvId) {
           setSelectedCV({ _id: event.state.cvId });
           localStorage.setItem('cv_activeId', event.state.cvId);
        }
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [setFullScreen]);

  const handleEdit = (cv) => {
    setSelectedCV(cv);
    setView('editor');
    if (setFullScreen) setFullScreen(true);
    
    // Update local storage
    localStorage.setItem('cv_view', 'editor');
    localStorage.setItem('cv_activeId', cv._id);
    
    // Push editor state to history so "Back" works
    window.history.pushState({ view: 'editor', cvId: cv._id }, '', '#editor');
  };

  const handleCreateNew = (template) => {
    setSelectedCV(null);
    setView('editor');
    if (setFullScreen) setFullScreen(true);
    
    localStorage.setItem('cv_view', 'editor');
    localStorage.removeItem('cv_activeId');
    
    // Push editor state with selected template info
    window.history.pushState({ 
      view: 'editor', 
      cvId: null,
      templateKey: template?.key || 'modern' // Pass selected template key
    }, '', '#editor');
  };

  const handleBackToList = () => {
    // If the user clicks the "X" button inside the editor, we should just go back in history
    // This simulates hitting the browser back button
    window.history.back();
  };

  return (
    <div className="cv-builder-page">
      {view === 'list' ? (
        <ResumeList 
          onEdit={handleEdit} 
          onCreate={handleCreateNew} 
          language={language}
          onBack={onExit}
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
