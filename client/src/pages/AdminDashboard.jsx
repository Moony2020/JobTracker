import React, { useMemo, useState, useRef, useEffect, useCallback } from "react";
import {
  LayoutDashboard,
  Users,
  CreditCard,
  Database,
  Settings,
  ShieldCheck,
  ChevronRight,
  Search,
  Bell,
  TrendingUp,
  LogOut,
  User as UserIcon,
  Menu,
  X
} from "lucide-react";
import { useNavigate, useLocation, Routes, Route, NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import AdminProfileModal from "../components/AdminProfileModal";
import AdminOverview from "./Admin/AdminOverview";
import AdminUsers from "./Admin/AdminUsers";
import AdminPayments from "./Admin/AdminPayments";
import AdminTemplates from "./Admin/AdminTemplates";
import AdminDownloads from "./Admin/AdminDownloads";
import AdminSettings from "./Admin/AdminSettings";



import "./AdminDashboard.css";




const translations = {
  en: {
    dashboard: "Dashboard",
    users: "Users",
    payments: "Payments",
    templates: "CV Templates",
    downloads: "Access Control",
    settings: "Settings",
    logout: "Logout",
    totalUsers: "Total Users",
    activeUsers: "Active Users",
    last30Days: "Last 30 days",
    totalCVs: "Total CVs Created",
    paidDownloads: "Paid Downloads",
    revenueThisMonth: "Revenue This Month",
    recentPayments: "Recent Payments",
    userAnalytics: "User Analytics",
    incomeInsights: "Income Insights",
    search: "Search...",
    free: "Free",
    pro: "Pro",
    viewDetails: "View Details",
    manageTemplates: "Manage Templates",
    user: "User",
    date: "Date",
    template: "Template",
    amount: "Amount",
    status: "Status",
    method: "Method",
    thisMonth: "this month",
    monthly: "Monthly",
    weekly: "Weekly",
    daily: "Daily",
    admin: "Admin",
    myProfile: "My Profile",
  },
  ar: {
    dashboard: "لوحة التحكم",
    users: "المستخدمين",
    payments: "المدفوعات",
    templates: "نماذج السيرة الذاتية",
    downloads: "التحكم في الوصول",
    settings: "الإعدادات",
    logout: "تسجيل الخروج",
    totalUsers: "إجمالي المستخدمين",
    activeUsers: "المستخدمين النشطين",
    last30Days: "آخر 30 يوم",
    totalCVs: "إجمالي السير الذاتية",
    paidDownloads: "التحميلات المدفوعة",
    revenueThisMonth: "إيرادات هذا الشهر",
    recentPayments: "المدفوعات الأخيرة",
    userAnalytics: "تحليلات المستخدمين",
    incomeInsights: "رؤى الدخل",
    search: "بحث...",
    free: "مجاني",
    pro: "احترافي",
    viewDetails: "عرض التفاصيل",
    manageTemplates: "إدارة النماذج",
    user: "المستخدم",
    date: "التاريخ",
    template: "النموذج",
    amount: "المبلغ",
    status: "الحالة",
    method: "الطريقة",
    thisMonth: "هذا الشهر",
    monthly: "شهري",
    weekly: "أسبوعي",
    daily: "يومي",
    admin: "مدير",
    myProfile: "ملفي الشخصي",
  },
  sv: {
    dashboard: "Översikt",
    users: "Användare",
    payments: "Betalningar",
    templates: "CV-mallar",
    downloads: "Åtkomstkontroll",
    settings: "Inställningar",
    logout: "Logga ut",
    totalUsers: "Totalt antal användare",
    activeUsers: "Aktiva användare",
    last30Days: "Senaste 30 dagarna",
    totalCVs: "Totalt skapade CV:n",
    paidDownloads: "Betalda nedladdningar",
    revenueThisMonth: "Intäkter denna månad",
    recentPayments: "Senaste betalningar",
    userAnalytics: "Användaranalys",
    incomeInsights: "Inkomstinsikter",
    search: "Sök...",
    free: "Gratis",
    pro: "Pro",
    viewDetails: "Visa detaljer",
    manageTemplates: "Hantera mallar",
    user: "Användare",
    date: "Datum",
    template: "Mall",
    amount: "Belopp",
    status: "Status",
    method: "Metod",
    thisMonth: "denna månad",
    monthly: "Månadsvis",
    weekly: "Veckovis",
    daily: "Daglig",
    admin: "Admin",
    myProfile: "Min profil",
  }
};

const AdminDashboard = () => {
  const { user, logout, setUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [lang, setLang] = useState(localStorage.getItem("adminLang") || "en");
  const [showLangDropdown, setShowLangDropdown] = useState(false);
  const [lastClearedAt, setLastClearedAt] = useState(() => {
    const saved = localStorage.getItem("admin_notif_cleared");
    if (!saved) return new Date(0);
    return new Date(saved.match(/^\d+$/) ? parseInt(saved) : saved);
  });

  const langFlags = {
    en: "🇺🇸",
    ar: "🇸🇦",
    sv: "🇸🇪"
  };

  const [stats, setStats] = useState({
    kpis: {
      totalUsers: 0,
      activeUsers: 0,
      totalCVs: 0,
      paidDownloads: 0,
      revenueThisMonth: 0
    },
    recentPayments: [],
    usageAnalytics: [],
    incomeInsights: [],
    todayActivity: 0,
    todayUsers: 0,
    todayPayments: 0
  });

  const [loading, setLoading] = useState(true);
  
  const dropdownRef = useRef(null);
  const langDropdownRef = useRef(null);
  const notifDropdownRef = useRef(null);

  const t = translations[lang];

  const fetchStats = useCallback(async (isSilent = false) => {
    try {
      await Promise.resolve(); // Break synchronous execution path to avoid cascading render lint
      if (!isSilent) setLoading(true);
      const response = await fetch(`/api/admin/stats`, {
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        }
      });
      const data = await response.json();
      setStats(data);
      if (!isSilent) setLoading(false);
    } catch (err) {
      console.error("Failed to fetch admin stats:", err);
      if (!isSilent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      await fetchStats();
    };
    init();
    
    const pollInterval = setInterval(() => {
      fetchStats(true);
    }, 10000);
    return () => clearInterval(pollInterval);
  }, [fetchStats]);

  const notifications = useMemo(() => {
    if (!stats?.recentPayments || !Array.isArray(stats.recentPayments)) return [];
    
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    return stats.recentPayments
      .filter(p => {
        const pDate = new Date(p.createdAt);
        return pDate >= startOfToday && pDate.getTime() > lastClearedAt.getTime();
      })
      .map(p => ({
        id: p._id,
        type: "payment",
        title: `New Payment: $${p.amount.toFixed(2)}`,
        user: p.user?.name || "Guest",
        time: new Date(p.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        link: "/admin/payments"
      }));
  }, [stats.recentPayments, lastClearedAt]);

  const paymentNotifsCount = useMemo(() => 
    notifications.filter(n => n.type === 'payment').length
  , [notifications]);

  const userNotifsCount = useMemo(() => 
    notifications.filter(n => n.type === 'user').length
  , [notifications]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowProfileDropdown(false);
      }
      if (langDropdownRef.current && !langDropdownRef.current.contains(event.target)) {
        setShowLangDropdown(false);
      }
      if (notifDropdownRef.current && !notifDropdownRef.current.contains(event.target)) {
        setShowNotifDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleNotifClick = (link) => {
    navigate(link);
    setShowNotifDropdown(false);
  };

  const clearNotifications = () => {
    const now = Date.now();
    localStorage.setItem("admin_notif_cleared", now.toString());
    setLastClearedAt(new Date(now));
  };

  const initials = useMemo(() => {
    if (!user?.name) return "AD";
    const parts = user.name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return user.name.substring(0, 2).toUpperCase();
  }, [user]);

  const handleLangChange = (newLang) => {
    setLang(newLang);
    localStorage.setItem("adminLang", newLang);
  };

  if (loading) {
    return (
      <div className="admin-loading">
        <div className="loader"></div>
      </div>
    );
  }

  return (
    <div className={`admin-dashboard-container ${isMobileMenuOpen ? "mobile-menu-active" : ""} ${lang === 'ar' ? 'rtl' : ''}`}>
      {/* Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div className="sidebar-overlay" onClick={() => setIsMobileMenuOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`admin-sidebar ${isMobileMenuOpen ? "open" : ""}`}>
        <div className="admin-logo" onClick={() => navigate('/admin')} style={{ cursor: 'pointer' }}>
          <div className="logo-glow" />
          <div className="logo-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 18a8 8 0 1 1 8-8 8 8 0 0 1-8 8z" />
              <circle cx="12" cy="12" r="3" />
              <path d="M12 7v2M12 15v2M7 12h2M15 12h2M8.5 8.5l1.5 1.5M14 14l1.5 1.5M8.5 15.5l1.5-1.5M14 10l1.5-1.5" />
            </svg>
          </div>
          <span>JobTracker {t.admin}</span>
        </div>

        <nav className="admin-nav">
          <div className="nav-group">
            <NavLink to="/admin" end style={{ textDecoration: 'none' }} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <LayoutDashboard size={18} />
              <span>{t.dashboard}</span>
              <div className="active-glow" />
            </NavLink>

            <NavLink to="/admin/users" style={{ textDecoration: 'none' }} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <Users size={18} />
              <span>{t.users}</span>
              {userNotifsCount > 0 && <span className="notification-badge-sidebar">{userNotifsCount}</span>}
            </NavLink>

            <NavLink to="/admin/payments" style={{ textDecoration: 'none' }} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <CreditCard size={18} />
              <span>{t.payments}</span>
              {paymentNotifsCount > 0 && <span className="notification-badge-sidebar">{paymentNotifsCount}</span>}
            </NavLink>

            <NavLink to="/admin/templates" style={{ textDecoration: 'none' }} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <Database size={18} />
              <span>{t.templates}</span>
              <ChevronRight size={14} className="chevron" />
            </NavLink>

            <NavLink to="/admin/downloads" style={{ textDecoration: 'none' }} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <ShieldCheck size={18} />
              <span>{t.downloads}</span>
              <ChevronRight size={14} className="chevron" />
            </NavLink>

            <NavLink to="/admin/settings" style={{ textDecoration: 'none' }} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <Settings size={18} />
              <span>{t.settings}</span>
              <ChevronRight size={14} className="chevron" />
            </NavLink>
          </div>
        </nav>
      </aside>

      {/* Main */}
      <main className="admin-main">
        {/* Header */}
        <header className="admin-header glass-header">
          <div className="header-title">
            <button 
              className="mobile-menu-toggle" 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            <h1>
              {location.pathname === '/admin/users' ? t.users :
               location.pathname === '/admin/payments' ? t.payments :
               location.pathname === '/admin/templates' ? t.templates :
               location.pathname === '/admin/downloads' ? t.downloads :
               location.pathname === '/admin/settings' ? t.settings :
               t.dashboard}
            </h1>
          </div>

          <div className="search-box">
            <Search size={18} />
            <input type="text" placeholder={t.search} />
          </div>

          <div className="header-actions">
            <div className="admin-lang-menu" ref={langDropdownRef}>
              <button 
                className={`lang-trigger-btn ${showLangDropdown ? 'active' : ''}`}
                onClick={() => setShowLangDropdown(!showLangDropdown)}
              >
                <span className="lang-flag">{langFlags[lang]}</span>
                <span>{lang.toUpperCase()}</span>
              </button>

              {showLangDropdown && (
                <div className="lang-dropdown">
                  <button onClick={() => { handleLangChange('en'); setShowLangDropdown(false); }}>
                    <span className="menu-flag">{langFlags.en}</span> English
                  </button>
                  <button onClick={() => { handleLangChange('ar'); setShowLangDropdown(false); }}>
                    <span className="menu-flag">{langFlags.ar}</span> العربية
                  </button>
                  <button onClick={() => { handleLangChange('sv'); setShowLangDropdown(false); }}>
                    <span className="menu-flag">{langFlags.sv}</span> Svenska
                  </button>
                </div>
              )}
            </div>

            <div className="admin-notification-menu" ref={notifDropdownRef}>
              <button 
                className={`icon-btn relative ${showNotifDropdown ? 'active' : ''}`} 
                aria-label="Notifications"
                onClick={() => setShowNotifDropdown(!showNotifDropdown)}
              >
                <Bell size={18} />
                {notifications.length > 0 && (
                  <span className="notification-badge-count">{notifications.length}</span>
                )}
              </button>

              {showNotifDropdown && (
                <div className="admin-notification-dropdown">
                  <div className="notif-header">
                    <h3>Notifications</h3>
                    <button className="clear-all-btn" onClick={clearNotifications}>Clear all</button>
                  </div>
                  <div className="notif-list">
                    {notifications.length > 0 ? (
                      notifications.map(n => (
                        <button key={n.id} className="notif-item" onClick={() => handleNotifClick(n.link)}>
                          <div className={`notif-icon ${n.type}`}>
                            {n.type === 'payment' ? <CreditCard size={14} /> : <UserIcon size={14} />}
                          </div>
                          <div className="notif-content">
                            <span className="notif-title">{n.title}</span>
                            <span className="notif-time">{n.user} • {n.time}</span>
                          </div>
                        </button>
                      ))
                    ) : (
                      <div className="notif-empty">No new activities today</div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="admin-user-menu" ref={dropdownRef}>
              <button 
                className={`user-avatar-btn ${showProfileDropdown ? 'active' : ''}`}
                onClick={() => setShowProfileDropdown(!showProfileDropdown)}
              >
                {initials}
              </button>

              {showProfileDropdown && (
                <div className="admin-profile-dropdown">
                  <div className="dropdown-user-info">
                    <p className="user-name">{user?.name || "Administrator"}</p>
                    <p className="user-email">{user?.email}</p>
                    <span className="user-role-badge">{t.admin}</span>
                  </div>
                  <div className="dropdown-divider" />
                  <button 
                    className="dropdown-link"
                    onClick={() => {
                      setShowProfileModal(true);
                      setShowProfileDropdown(false);
                    }}
                  >
                    <UserIcon size={16} />
                    <span>{t.myProfile}</span>
                  </button>
                  <button className="dropdown-link logout-link" onClick={logout}>
                    <LogOut size={16} />
                    <span>{t.logout}</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Nested Content Rendering */}
        <Routes>
          <Route index element={<AdminOverview stats={stats} t={t} />} />
          <Route path="users" element={<AdminUsers t={t} />} />
          <Route path="payments" element={<AdminPayments t={t} />} />
          <Route path="templates" element={<AdminTemplates t={t} />} />
          <Route path="downloads" element={<AdminDownloads t={t} />} />
          <Route path="settings" element={<AdminSettings t={t} />} />
        </Routes>
      </main>

      <AdminProfileModal 
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        user={user}
        onUpdateUser={setUser}
      />
    </div>
  );
};

export default AdminDashboard;
