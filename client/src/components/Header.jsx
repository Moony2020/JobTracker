import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { LogOut, User, LogIn, UserPlus, Settings, Lock, Menu, X, Sun, Moon } from 'lucide-react';

const Header = ({ darkMode, toggleTheme, onOpenPage, onLoginClick, onRegisterClick, onChangePasswordClick, activePage }) => {
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

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
            <div className="logo" onClick={() => onOpenPage('dashboard')} style={{ cursor: 'pointer' }}>JobTracker</div>
          </div>

          <nav className="desktop-nav">
            <ul>
              <li>
                <a href="#" className={`nav-link ${activePage === 'dashboard' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); onOpenPage('dashboard'); }}>
                  Dashboard
                </a>
              </li>
              <li>
                <a href="#" className={`nav-link ${activePage === 'applications' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); onOpenPage('applications'); }}>
                  Applications
                </a>
              </li>
              <li>
                <a href="#" className={`nav-link ${activePage === 'statistics' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); onOpenPage('statistics'); }}>
                  Statistics
                </a>
              </li>
            </ul>
          </nav>

          <div className="header-right">
            {!user ? (
              <div className="auth-buttons">
                <div className="user-dropdown" onMouseEnter={() => setDropdownOpen(true)} onMouseLeave={() => setDropdownOpen(false)}>
                  <div className="guest-badge">
                    <User size={20} />
                  </div>
                  {dropdownOpen && (
                    <div className="dropdown-menu" style={{ display: 'flex' }}>
                      <div className="dropdown-header">
                        <span>Welcome</span>
                      </div>
                      <button className="dropdown-item" onClick={onLoginClick}>
                        <LogIn size={18} /> Login
                      </button>
                      <button className="dropdown-item" onClick={onRegisterClick}>
                        <UserPlus size={18} /> Register
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="user-menu">
                <div className="user-dropdown" onMouseEnter={() => setDropdownOpen(true)} onMouseLeave={() => setDropdownOpen(false)}>
                  <div className="user-badge">
                    <span>{getInitials(user.name)}</span>
                  </div>
                  {dropdownOpen && (
                    <div className="dropdown-menu" style={{ display: 'flex' }}>
                      <div className="dropdown-header">
                        <span>{user.name}</span>
                      </div>
                      <button className="dropdown-item" onClick={() => { onChangePasswordClick(); setDropdownOpen(false); }}>
                        <Lock size={18} /> Change Password
                      </button>
                      <button className="dropdown-item">
                        <Settings size={18} /> Settings
                      </button>
                      <button className="logout-btn-animated" onClick={logout}>
                        <div className="sign">
                          <LogOut size={18} />
                        </div>
                        <div className="text">Logout</div>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

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
            <span></span>
            <span></span>
            <span></span>
          </button>
        </div>
      </div>
      
      {/* Mobile Nav */}
      <div className={`mobile-nav ${mobileMenuOpen ? 'active' : ''}`}>
        <nav>
          <ul>
            <li><a href="#" className="mobile-nav-link active" onClick={() => { onOpenPage('dashboard'); setMobileMenuOpen(false); }}>Dashboard</a></li>
            <li><a href="#" className="mobile-nav-link" onClick={() => { onOpenPage('applications'); setMobileMenuOpen(false); }}>Applications</a></li>
            <li><a href="#" className="mobile-nav-link" onClick={() => { onOpenPage('statistics'); setMobileMenuOpen(false); }}>Statistics</a></li>
          </ul>
        </nav>

        {!user ? (
          <div className="mobile-auth-buttons">
            <button className="btn btn-primary full-width" onClick={() => { onLoginClick(); setMobileMenuOpen(false); }}>Login</button>
            <button className="btn btn-outline full-width" onClick={() => { onRegisterClick(); setMobileMenuOpen(false); }}>Register</button>
          </div>
        ) : (
          <div className="mobile-user-menu">
            <div className="mobile-user-info">Welcome, {user.name}</div>
            <button className="btn logout-btn" onClick={logout}>
              <LogOut size={18} /> Logout
            </button>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
