import React, { useState, useEffect, useMemo } from 'react';
import Header from './components/Header';
import Dashboard from './pages/Dashboard';
import Applications from './pages/Applications';
import Statistics from './pages/Statistics';
import Login from './components/Login';
import Register from './components/Register';
import api from './services/api';
import { AuthProvider, useAuth } from './context/AuthContext';
import './index.css';
import ChangePassword from './components/ChangePassword';
import ResetPassword from './components/ResetPassword';

const AppContent = () => {
  const { user, loading: authLoading } = useAuth();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [darkMode, setDarkMode] = useState(localStorage.getItem('theme') !== 'light');
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [showLogin, setShowLogin] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [resetToken, setResetToken] = useState(null);
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

  const handleDeleteApplication = async (id) => {
    if (!window.confirm('Are you sure you want to delete this application?')) return;
    
    const previousApplications = [...applications];
    setApplications(applications.filter(app => app._id !== id));

    try {
      await api.delete(`/applications/${id}`);
      showNotify('Application deleted successfully!');
    } catch (error) {
      console.error('Failed to delete application', error);
      setApplications(previousApplications); // Rollback
      showNotify('Failed to delete application', 'error');
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

  // Check for reset token immediately to avoid race conditions with auth loading
  useEffect(() => {
    const hash = window.location.hash;
    console.log('App Mounted. Current Hash:', hash);
    if (hash.startsWith('#reset/')) {
      const token = hash.replace('#reset/', '');
      console.log('Reset Token Detected:', token);
      setResetToken(token);
    }
  }, []);

  console.log('Render: authLoading:', authLoading, 'resetToken:', resetToken);

  if (authLoading && !resetToken) return <div className="loading-overlay"><div className="loading-spinner"></div><p>Validating Session...</p></div>;

  return (
    <div className="app-container">
      <Header 
        darkMode={darkMode} 
        toggleTheme={() => setDarkMode(!darkMode)} 
        onOpenPage={setCurrentPage}
        onLoginClick={() => setShowLogin(true)}
        onRegisterClick={() => setShowRegister(true)}
        onChangePasswordClick={() => setShowChangePassword(true)}
        activePage={currentPage}
      />
      <main className="container" style={{ marginTop: '1.5rem' }}>
        {currentPage === 'dashboard' && (
          <Dashboard 
            applications={applications} 
            stats={stats} 
            onAddApplication={handleAddApplication} 
            loading={loading}
          />
        )}
        {currentPage === 'applications' && (
          <Applications 
             applications={applications}
             onEdit={(app) => console.log('Edit', app)}
             onDelete={handleDeleteApplication}
             loading={loading}
          />
        )}
        {currentPage === 'statistics' && (
          <Statistics applications={applications} loading={loading} />
        )}
      </main>

      {showLogin && <Login onClose={() => setShowLogin(false)} />}
      {showRegister && <Register onClose={() => setShowRegister(false)} />}
      {showChangePassword && <ChangePassword onClose={() => setShowChangePassword(false)} />}
      {resetToken && <ResetPassword token={resetToken} onClose={() => setResetToken(null)} />}
      
      {notification && (
        <div className={`notification ${notification.type} show`}>
          {notification.message}
        </div>
      )}

      {loading && <div className="loading-overlay"><div className="loading-spinner"></div><p>Processing...</p></div>}
      
      <footer>
        <div className="container">
          <p>&copy; 2026 JobTracker. All rights reserved.</p>
        </div>
      </footer>
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
