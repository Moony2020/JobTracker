import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { LogOut, User, LogIn, UserPlus, Settings, Lock, Menu, X, Sun, Moon, Globe, Briefcase, FileText } from 'lucide-react';
import translations from '../utils/translations';

const Header = ({ darkMode, toggleTheme, language, setLanguage, onOpenPage, onLoginClick, onRegisterClick, onChangePasswordClick, onProfileClick, activePage }) => {
  const t = translations[language];
  const { user, logout } = useAuth();
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (activeDropdown && 
          !event.target.closest('.user-dropdown') && 
          !event.target.closest('.global-language-selector')) {
        setActiveDropdown(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [activeDropdown]);

  const getInitials = (name) => {
    if (!name) return '??';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <header>
      <div className="container">
        <div className="header-content">
          <div className="header-left">
            <div className="logo" onClick={() => onOpenPage('dashboard')} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Briefcase size={22} className="logo-icon" />
              <span className="logo-text">JobTracker</span>
            </div>
          </div>

          <nav className="desktop-nav">
            <ul>
              <li>
                <a href="#" className={`nav-link ${activePage === 'dashboard' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); onOpenPage('dashboard'); }}>
                  {t.dashboard}
                </a>
              </li>
              <li>
                <a href="#" className={`nav-link ${activePage === 'applications' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); onOpenPage('applications'); }}>
                  {t.applications}
                </a>
              </li>
              <li>
                <a href="#" className={`nav-link ${activePage === 'statistics' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); onOpenPage('statistics'); }}>
                  {t.statistics}
                </a>
              </li>
            </ul>
          </nav>

          <div className="header-right">
            {!user ? (
              <div className="auth-buttons">
                <div className="user-dropdown" onMouseEnter={() => setActiveDropdown('user')} onMouseLeave={() => setActiveDropdown(null)}>
                  <div className="guest-badge">
                    <User size={20} />
                  </div>
                  {activeDropdown === 'user' && (
                    <div className="dropdown-menu" style={{ display: 'flex' }}>
                      <div className="dropdown-header">
                        <span>{t.welcome}</span>
                      </div>
                      <button className="dropdown-item dropdown-btn-primary" onClick={onLoginClick}>
                        <LogIn size={18} /> {t.login}
                      </button>
                      <button className="dropdown-item dropdown-btn-secondary" onClick={onRegisterClick}>
                        <UserPlus size={18} /> {t.register}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="user-menu">
                <div className="user-dropdown" onMouseEnter={() => setActiveDropdown('user')} onMouseLeave={() => setActiveDropdown(null)}>
                  <div className="user-badge">
                    <span>{getInitials(user.name)}</span>
                  </div>
                  {activeDropdown === 'user' && (
                    <div className="dropdown-menu" style={{ display: 'flex' }}>
                      <div className="dropdown-header">
                        <span>{user.name}</span>
                      </div>
                      <button className="dropdown-item dropdown-btn-primary" onClick={() => { onChangePasswordClick(); setActiveDropdown(null); }}>
                        <Lock size={18} /> {t.change_password}
                      </button>
                      <button className="dropdown-item dropdown-btn-secondary" onClick={() => { onProfileClick(); setActiveDropdown(null); }}>
                        <FileText size={18} /> {t.settings}
                      </button>
                      <button className="logout-btn-animated" onClick={logout}>
                        <div className="sign">
                          <LogOut size={18} />
                        </div>
                        <div className="text">{t.logout}</div>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="global-language-selector" style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <div 
                onClick={() => setActiveDropdown(activeDropdown === 'lang' ? null : 'lang')} 
                style={{ 
                  width: '32px', 
                  height: '32px', 
                  borderRadius: '50%', 
                  background: 'var(--glass-bg)', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  cursor: 'pointer',
                  border: '1px solid var(--light-border)',
                  transition: 'background 0.3s'
                }}
              >
                <Globe size={18} />
              </div>
              {activeDropdown === 'lang' && (
                <div className="dropdown-menu lang-dropdown" style={{ display: 'flex', top: '40px', right: '0' }}>
                  <button className="dropdown-item lang-item" onClick={() => { setLanguage('English'); setActiveDropdown(null); }}>
                    <span className="lang-flag"><img src="https://flagcdn.com/w80/us.png" alt="" className="lang-flag-img" /></span>
                    <span className="lang-text">English</span>
                  </button>
                  <button className="dropdown-item lang-item" onClick={() => { setLanguage('Swedish'); setActiveDropdown(null); }}>
                    <span className="lang-flag"><img src="https://flagcdn.com/w80/se.png" alt="" className="lang-flag-img" /></span>
                    <span className="lang-text">Swedish</span>
                  </button>
                  <button className="dropdown-item lang-item" onClick={() => { setLanguage('Arabic'); setActiveDropdown(null); }}>
                    <span className="lang-flag"><img src="https://flagcdn.com/w80/sa.png" alt="" className="lang-flag-img" /></span>
                    <span className="lang-text">Arabic</span>
                  </button>
                </div>
              )}
            </div>

            <label className="switch">
              <input type="checkbox" checked={darkMode} onChange={toggleTheme} className="input" />
              <span className="slider"></span>
              <span className="sun">
                <svg viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="5"></circle>
                  <line x1="12" y1="1" x2="12" y2="3"></line>
                  <line x1="12" y1="21" x2="12" y2="23"></line>
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                  <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                  <line x1="1" y1="12" x2="3" y2="12"></line>
                  <line x1="21" y1="12" x2="23" y2="12"></line>
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                  <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
                </svg>
              </span>
              <span className="moon">
                <svg viewBox="0 0 24 24">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
                </svg>
              </span>
            </label>
          </div>

          <button className={`hamburger ${mobileMenuOpen ? 'active' : ''}`} onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            <div className="grid-dot"></div>
            <div className="grid-dot"></div>
            <div className="grid-dot"></div>
            <div className="grid-dot"></div>
          </button>
        </div>
      </div>
      
      {/* Mobile Nav */}
      <div className={`mobile-nav ${mobileMenuOpen ? 'active' : ''}`}>
        <nav>
          <ul>
            <li><a href="#" className={`mobile-nav-link ${activePage === 'dashboard' ? 'active' : ''}`} onClick={() => { onOpenPage('dashboard'); setMobileMenuOpen(false); }}>{t.dashboard}</a></li>
            <li><a href="#" className={`mobile-nav-link ${activePage === 'applications' ? 'active' : ''}`} onClick={() => { onOpenPage('applications'); setMobileMenuOpen(false); }}>{t.applications}</a></li>
            <li><a href="#" className={`mobile-nav-link ${activePage === 'statistics' ? 'active' : ''}`} onClick={() => { onOpenPage('statistics'); setMobileMenuOpen(false); }}>{t.statistics}</a></li>
          </ul>
        </nav>

        {!user ? (
          <div className="mobile-auth-buttons">
            <button className="btn btn-primary full-width" onClick={() => { onLoginClick(); setMobileMenuOpen(false); }}>{t.login}</button>
            <button className="btn btn-outline full-width" onClick={() => { onRegisterClick(); setMobileMenuOpen(false); }}>{t.register}</button>
          </div>
        ) : (
          <div className="mobile-user-menu">
            <div className="mobile-user-info">{t.welcome}, {user.name}</div>
            <button className="btn logout-btn" onClick={logout}>
              <LogOut size={18} /> {t.logout}
            </button>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
