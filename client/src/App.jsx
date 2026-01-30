import React, { useState, useEffect, useMemo } from 'react';
import Header from './components/Header';
import Dashboard from './pages/Dashboard';
import Applications from './pages/Applications';
import Statistics from './pages/Statistics';
import JobFinder from './pages/JobFinder';
import CVBuilder from './pages/CVBuilder/CVBuilder';
import AdminDashboard from './pages/AdminDashboard';
import AdminLogin from './components/AdminLogin';
import Login from './components/Login';
import Register from './components/Register';
import api from './services/api';
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import './index.css';
import ChangePassword from './components/ChangePassword';
import ResetPassword from './components/ResetPassword';
import EditApplicationModal from './components/EditApplicationModal';
import DeleteConfirmationModal from './components/DeleteConfirmationModal';
import ProfileModal from './components/ProfileModal';
import ScrollToTop from './components/ScrollToTop';

const AppContent = () => {
  const { user, loading: authLoading } = useAuth();

  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [darkMode, setDarkMode] = useState(localStorage.getItem('theme') !== 'light');
  const [language, setLanguage] = useState(localStorage.getItem('jt_language') || 'English');
  
  const navigate = useNavigate();
  const location = useLocation();

  const [currentPage, setCurrentPage] = useState(() => {
    const path = window.location.pathname;
    if (path.startsWith('/admin')) return 'admin';
    if (path === '/applications') return 'applications';
    if (path === '/statistics') return 'statistics';
    if (path === '/jobs') return 'jobs';
    if (path.startsWith('/cv-builder')) return 'cv-builder';
    return 'dashboard';
  });

  useEffect(() => {
    const path = location.pathname;
    if (path.startsWith('/admin')) setCurrentPage('admin');
    else if (path === '/applications') setCurrentPage('applications');
    else if (path === '/statistics') setCurrentPage('statistics');
    else if (path === '/jobs') setCurrentPage('jobs');
    else if (path.startsWith('/cv-builder')) setCurrentPage('cv-builder');
    else if (path === '/') setCurrentPage('dashboard');
  }, [location]);

  const onOpenPage = (page) => {
    if (page === 'dashboard') navigate('/');
    else navigate(`/${page}`);
  };

  const isPrinting = useMemo(() => {
    return location.pathname.startsWith('/cv-builder/print/');
  }, [location.pathname]);

  useEffect(() => {
    if (isPrinting || currentPage === 'admin') return; // Don't persist print or admin page
    localStorage.setItem('jt_currentPage', currentPage);
  }, [currentPage, isPrinting]);
  
  useEffect(() => {
    document.documentElement.dir = language === 'Arabic' ? 'rtl' : 'ltr';
    localStorage.setItem('jt_language', language);
  }, [language]);
  const [showLogin, setShowLogin] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [resetToken, setResetToken] = useState(() => {
    const hash = window.location.hash;
    if (hash.startsWith('#reset/')) {
      return hash.replace('#reset/', '');
    }
    return null;
  });
  /* State for Modals */
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState(null);

  const [notification, setNotification] = useState(null);

  const showNotify = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const fetchApplications = React.useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get('/applications');
      setApplications(response.data);
    } catch (error) {
      console.error('Failed to fetch applications', error);
      showNotify('Failed to fetch applications', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) {
      fetchApplications();
    } else {
      setApplications([]);
    }
  }, [user, fetchApplications]);

  useEffect(() => {
    if (darkMode) {
      document.body.classList.add('dark-mode');
      localStorage.setItem('theme', 'dark');
    } else {
      document.body.classList.remove('dark-mode');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      if (hash.startsWith('#reset/')) {
        const token = hash.replace('#reset/', '');
        setResetToken(token);
      } else {
        setResetToken(null);
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    handleHashChange(); // Check on mount

    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const handleAddApplication = async (formData) => {
    if (!user) {
      setShowLogin(true);
      return;
    }
    
    // Optimistic Update
    const temporaryId = Date.now().toString();
    const newApp = { ...formData, _id: temporaryId, loading: true };
    const previousApplications = [...applications];
    setApplications([newApp, ...applications]);

    try {
      const response = await api.post('/applications', formData);
      // Replace optimistic app with real one from server
      setApplications(prev => prev.map(app => app._id === temporaryId ? response.data : app));
      showNotify('Application added successfully!');
    } catch (error) {
      console.error('Failed to add application', error);
      setApplications(previousApplications); // Rollback
      showNotify('Failed to add application', 'error');
    }
  };

  /* Edit Handlers */
  const handleEditClick = (app) => {
    setSelectedApplication(app);
    setIsEditModalOpen(true);
  };

  const handleUpdateApplication = (updatedApp) => {
    setApplications(prev => prev.map(app => app._id === updatedApp._id ? updatedApp : app));
    showNotify('Application updated successfully!');
    setIsEditModalOpen(false);
    setSelectedApplication(null);
  };

  /* Delete Handlers */
  const handleDeleteClick = (id) => {
    const app = applications.find(a => a._id === id);
    setSelectedApplication(app);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedApplication) return;
    
    const id = selectedApplication._id;
    const previousApplications = [...applications];
    setApplications(applications.filter(app => app._id !== id));
    setIsDeleteModalOpen(false); // Close immediately for responsiveness

    try {
      await api.delete(`/applications/${id}`);
      showNotify('Application deleted successfully!');
    } catch (error) {
      console.error('Failed to delete application', error);
      setApplications(previousApplications); // Rollback
      showNotify('Failed to delete application', 'error');
    } finally {
      setSelectedApplication(null);
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    const appToUpdate = applications.find(a => a._id === id);
    if (!appToUpdate || appToUpdate.status === newStatus) return;

    // Optimistic Update
    const previousApplications = [...applications];
    setApplications(prev => prev.map(app => 
      app._id === id ? { ...app, status: newStatus, loading: true } : app
    ));

    try {
      const response = await api.put(`/applications/${id}`, { ...appToUpdate, status: newStatus });
      setApplications(prev => prev.map(app => app._id === id ? response.data : app));
      showNotify(`Status updated to ${newStatus}`);
    } catch (error) {
      console.error('Failed to update status', error);
      setApplications(previousApplications); // Rollback
      showNotify('Failed to update status', 'error');
    }
  };

  const stats = useMemo(() => {
    const total = applications.length;
    const interviews = applications.filter(a => a.status === 'interview').length;
    const offers = applications.filter(a => a.status === 'offer').length;
    
    // This Week (Monday to Sunday)
    const thisWeek = applications.filter(a => {
      const appDate = new Date(a.date);
      const today = new Date();
      const startOfWeek = new Date(today);
      startOfWeek.setHours(0, 0, 0, 0);
      let day = startOfWeek.getDay() || 7; // Sunday is 0, make it 7
      startOfWeek.setDate(startOfWeek.getDate() - (day - 1));
      
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      endOfWeek.setHours(23, 59, 59, 999);
      
      return appDate >= startOfWeek && appDate <= endOfWeek;
    }).length;

    // This Month
    const thisMonth = applications.filter(a => {
      const date = new Date(a.date);
      const now = new Date();
      return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    }).length;

    const successRate = total > 0 ? ((offers / total) * 100).toFixed(1) : 0;

    return { total, interviews, offers, thisWeek, thisMonth, successRate };
  }, [applications]);

  /* Full Screen Mode for detailed editors */
  const [isFullScreen, setIsFullScreen] = useState(() => {
    return window.location.pathname.startsWith('/admin') || window.location.pathname.startsWith('/cv-builder/print/');
  });

  // Automatically set full screen for admin, reset for others (except cv-builder which handles it)
  useEffect(() => {
    if (currentPage === 'admin' || isPrinting) {
      setIsFullScreen(true);
    } else if (currentPage !== 'cv-builder') {
      setIsFullScreen(false);
    }
  }, [currentPage, isPrinting]);

  if (authLoading && !resetToken) return <div className="loading-overlay"><div className="loading-spinner"></div><p>Loading...</p></div>;

  return (
    <div className="app-container">
      {/* Hide Header only if isFullScreen is true. Otherwise show it for all pages including cv-builder list view */}
      {!isFullScreen && !isPrinting && !location.pathname.startsWith('/admin') && (
        <Header 
          darkMode={darkMode} 
          toggleTheme={() => setDarkMode(!darkMode)} 
          language={language}
          setLanguage={setLanguage}
          onOpenPage={onOpenPage}
          onLoginClick={() => setShowLogin(true)}
          onRegisterClick={() => setShowRegister(true)}
          onChangePasswordClick={() => setShowChangePassword(true)}
          onProfileClick={() => setShowProfile(true)}
          activePage={currentPage}
        />
      )}
      <main 
        className={(isFullScreen || currentPage === 'cv-builder') ? '' : 'container'} 
        style={{ 
          marginTop: (isFullScreen || currentPage === 'cv-builder') ? '0' : '1.5rem',
          width: (isFullScreen || currentPage === 'cv-builder') ? '100%' : undefined,
          maxWidth: (isFullScreen || currentPage === 'cv-builder') ? '100%' : undefined,
          padding: (isFullScreen || currentPage === 'cv-builder') ? '0' : undefined 
        }}
      >
        <Routes>
          <Route path="/" element={
            <Dashboard 
              applications={applications} 
              stats={stats} 
              onAddApplication={handleAddApplication} 
              onEdit={handleEditClick}
              onDelete={handleDeleteClick}
              onStatusChange={handleStatusChange}
              loading={loading}
              language={language}
            />
          } />
          <Route path="/applications" element={
            <Applications 
              applications={applications}
              onEdit={handleEditClick}
              onDelete={handleDeleteClick}
              onStatusChange={handleStatusChange}
              loading={loading}
              language={language}
            />
          } />
          <Route path="/statistics" element={
            <Statistics applications={applications} loading={loading} language={language} />
          } />
          <Route path="/jobs" element={
            <JobFinder language={language} user={user} />
          } />
          <Route path="/admin/*" element={
             user?.role === 'admin' ? <AdminDashboard /> : <AdminLogin />
          } />
          <Route path="/cv-builder/*" element={
            <CVBuilder 
              language={language} 
              user={user} 
              onExit={() => {
                setCurrentPage('dashboard');
                navigate('/');
              }} 
              setFullScreen={setIsFullScreen}
              showNotify={showNotify}
              isPrinting={isPrinting}
            />
          } />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      {showLogin && <Login onClose={() => setShowLogin(false)} language={language} />}
      {showRegister && <Register onClose={() => setShowRegister(false)} language={language} />}
      {showChangePassword && <ChangePassword onClose={() => setShowChangePassword(false)} language={language} />}
      {showProfile && <ProfileModal isOpen={showProfile} onClose={() => setShowProfile(false)} language={language} />}
      {resetToken && <ResetPassword token={resetToken} onClose={() => setResetToken(null)} language={language} />}
      
      {/* Edit Modal */}
      {isEditModalOpen &&          <EditApplicationModal 
            isOpen={isEditModalOpen}
            onClose={() => setIsEditModalOpen(false)}
            application={selectedApplication}
            onUpdate={handleUpdateApplication}
            language={language}
          />
      }

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal 
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        applicationName={selectedApplication ? `${selectedApplication.jobTitle} at ${selectedApplication.company}` : ''}
      />
      
      {notification && (
        <div className={`notification ${notification.type} show`}>
          {notification.message}
        </div>
      )}

      {loading && <div className="loading-overlay"><div className="loading-spinner"></div><p>Processing...</p></div>}
      
      <ScrollToTop />
      
      {!isFullScreen && (
        <footer>
          <div className="container">
            <p>&copy; 2026 JobTracker. All rights reserved.</p>
          </div>
        </footer>
      )}
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
