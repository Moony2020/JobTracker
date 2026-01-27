import React, { useMemo, useState, useRef, useEffect } from "react";
import {
  LayoutDashboard,
  Users,
  CreditCard,
  Zap,
  Database,
  BarChart3,
  Settings,
  ShieldCheck,
  ChevronRight,
  Search,
  Bell,
  Moon,
  Globe,
  MoreHorizontal,
  TrendingUp,
  Clock,
  LogOut,
  User as UserIcon,
  Menu,
  X,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import AdminProfileModal from "../components/AdminProfileModal";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from "recharts";

import "./AdminDashboard.css";

const usageData = [
  { name: "Mon", free: 2000, paid: 4000 },
  { name: "Tue", free: 3000, paid: 4500 },
  { name: "Wed", free: 2500, paid: 6000 },
  { name: "Thu", free: 3500, paid: 5500 },
  { name: "Fri", free: 4000, paid: 7500 },
  { name: "Sat", free: 3000, paid: 6500 },
  { name: "Sun", free: 2500, paid: 5000 },
];

const userData = [
  { name: "Free", value: 45, color: "#5B7CFF" },
  { name: "Basic", value: 30, color: "#8B5CFF" },
  { name: "Pro", value: 25, color: "#C06BFF" },
];

const incomeData = [
  { name: "Apr 4", value: 4500 },
  { name: "Apr 10", value: 3800 },
  { name: "Apr 16", value: 5200 },
  { name: "Apr 22", value: 4000 },
  { name: "Apr 24", value: 4800 },
  { name: "Apr 26", value: 6824 },
];


const AdminDashboard = () => {
  const { user, logout, setUser } = useAuth();
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowProfileDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const initials = useMemo(() => {
    if (!user?.name) return "AD";
    const parts = user.name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return user.name.substring(0, 2).toUpperCase();
  }, [user]);

  const planList = useMemo(
    () => [
      { name: "Free", icon: <Globe size={15} />, dotClass: "free" },
      { name: "Basic", icon: <Database size={15} />, dotClass: "basic" },
      { name: "Pro", icon: <Zap size={15} />, dotClass: "pro" },
    ],
    []
  );

  return (
    <div className={`admin-dashboard-container ${isMobileMenuOpen ? "mobile-menu-active" : ""}`}>
      {/* Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div className="sidebar-overlay" onClick={() => setIsMobileMenuOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`admin-sidebar ${isMobileMenuOpen ? "open" : ""}`}>
        <div className="admin-logo">
          <div className="logo-glow" />
          <div className="logo-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 18a8 8 0 1 1 8-8 8 8 0 0 1-8 8z" />
              <circle cx="12" cy="12" r="3" />
              <path d="M12 7v2M12 15v2M7 12h2M15 12h2M8.5 8.5l1.5 1.5M14 14l1.5 1.5M8.5 15.5l1.5-1.5M14 10l1.5-1.5" />
            </svg>
          </div>
          <span>AI Admin</span>
        </div>

        <nav className="admin-nav">
          <div className="nav-group">
            <button className="nav-item active">
              <LayoutDashboard size={18} />
              <span>Dashboard</span>
              <div className="active-glow" />
            </button>

            <button className="nav-item">
              <Users size={18} />
              <span>Users</span>
            </button>

            <button className="nav-item">
              <CreditCard size={18} />
              <span>Payments</span>
            </button>

            <button className="nav-item">
              <Zap size={18} />
              <span>AI Models</span>
              <ChevronRight size={14} className="chevron" />
            </button>

            <button className="nav-item">
              <Database size={18} />
              <span>Credits</span>
              <ChevronRight size={14} className="chevron" />
            </button>

            <button className="nav-item">
              <BarChart3 size={18} />
              <span>Reports</span>
              <ChevronRight size={14} className="chevron" />
            </button>

            <button className="nav-item">
              <Settings size={18} />
              <span>Settings</span>
              <ChevronRight size={14} className="chevron" />
            </button>

            <button className="nav-item">
              <ShieldCheck size={18} />
              <span>Security</span>
              <ChevronRight size={14} className="chevron" />
            </button>
          </div>

          <div className="nav-divider" />

          <button className="manage-ai-btn">
            <Zap size={18} />
            <span>Manage AI Models</span>
            <ChevronRight size={14} />
          </button>
        </nav>

        <div className="sidebar-footer">
          <button className="upgrade-pill-btn">
            <span>Upgrade</span>
            <ChevronRight size={14} />
          </button>
        </div>
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
            <h1>Dashboard</h1>
          </div>

          <div className="header-actions">
            <div className="search-box">
              <Search size={18} />
              <input type="text" placeholder="Search..." />
            </div>

            <button className="icon-btn" aria-label="Theme">
              <Moon size={18} />
            </button>

            <button className="icon-btn" aria-label="Language">
              <Globe size={18} />
            </button>

            <button className="icon-btn relative" aria-label="Notifications">
              <Bell size={18} />
              <span className="notification-dot" />
            </button>

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
                    <span className="user-role-badge">Admin</span>
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
                    <span>My Profile</span>
                  </button>
                  <button className="dropdown-link logout-link" onClick={logout}>
                    <LogOut size={16} />
                    <span>Log Out</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Top Stats */}
        <div className="admin-stats-grid">
          {/* Revenue */}
          <div className="glass-card admin-stat-card">
            <div className="stat-top">
              <div className="stat-left">
                <div className="stat-icon-wrapper revenue">
                  <CreditCard size={18} />
                </div>
                <span className="stat-title">Revenue</span>
              </div>
              <button className="stat-chevron" aria-label="Open">
                <ChevronRight size={14} style={{ transform: 'rotate(-90deg)' }} />
              </button>
            </div>

            <div className="stat-main">
              <div className="stat-main-row">
                <div className="stat-value">$2,487</div>
                <div className="stat-badge positive">+22%</div>
              </div>

              <div className="spark-wrapper">
                <div className="spark-line revenue-spark" />
                <div className="spark-meta">72%</div>
              </div>
            </div>
          </div>

          <div className="glass-card admin-stat-card">
            <div className="stat-top">
              <div className="stat-left">
                <div className="stat-icon-wrapper users">
                  <Users size={18} />
                </div>
                <span className="stat-title">New Users</span>
              </div>
              <button className="stat-chevron" aria-label="Open">
                <ChevronRight size={14} style={{ transform: 'rotate(-90deg)' }} />
              </button>
            </div>

            <div className="stat-main">
              <div className="stat-main-row">
                <div className="stat-value">1,492</div>
                <div className="stat-badge positive">+8.9%</div>
              </div>
              <div className="stat-spark-mini" />
              <div className="stat-sub">+32% this week</div>
            </div>
          </div>

          <div className="glass-card admin-stat-card">
            <div className="stat-top">
              <div className="stat-left">
                <div className="stat-icon-wrapper quota">
                  <Zap size={18} />
                </div>
                <span className="stat-title">AI Quota Usage</span>
              </div>
              <button className="stat-chevron" aria-label="Open">
                <ChevronRight size={14} style={{ transform: 'rotate(-90deg)' }} />
              </button>
            </div>

            <div className="stat-main">
              <div className="stat-main-row">
                <div className="stat-value">
                  72,340 <span className="value-unit">/ f 100K</span>
                </div>
              </div>

              <div className="quota-bar">
                <div className="quota-fill" style={{ width: "72%" }} />
              </div>

              <div className="stat-sub">4,670 requests</div>
            </div>
          </div>

          <div className="glass-card admin-stat-card">
            <div className="stat-top">
              <div className="stat-left">
                <div className="stat-icon-wrapper subscriptions">
                  <BarChart3 size={18} />
                </div>
                <span className="stat-title">Active Subscriptions</span>
              </div>
              <button className="stat-chevron" aria-label="Open">
                <ChevronRight size={14} style={{ transform: 'rotate(-90deg)' }} />
              </button>
            </div>

            <div className="stat-main">
              <div className="stat-main-row">
                <div className="stat-value">
                  297 <span className="tiny-plus">+35</span>
                </div>
              </div>

              <div className="subs-bar">
                <div className="subs-fill" style={{ width: "65%" }} />
              </div>

              <div className="stat-sub">+35 this week</div>
            </div>
          </div>
        </div>

        {/* Middle Grid */}
        <div className="admin-content-grid">
          {/* Recent Payments */}
          <div className="glass-card table-section">
            <div className="card-header">
              <h2>Recent Payments</h2>
              <button className="header-dot-btn" aria-label="More">
                <MoreHorizontal size={18} />
              </button>
            </div>

            <div className="admin-table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Date</th>
                    <th>Plan</th>
                    <th>Amount</th>
                    <th />
                  </tr>
                </thead>

                <tbody>
                  {[
                    {
                      name: "Emma W.",
                      date: "4/18/2026",
                      plan: "Pro Plan",
                      amount: "$5.99",
                      avatar: "https://i.pravatar.cc/150?u=emma",
                    },
                    {
                      name: "Ahmed K.",
                      date: "4/18/2026",
                      plan: "Pro Plan",
                      amount: "$5.99",
                      avatar: "https://i.pravatar.cc/150?u=ahmed",
                    },
                    {
                      name: "Jason L.",
                      date: "4/18/2026",
                      plan: "Pro Plan",
                      amount: "$5.99",
                      avatar: "https://i.pravatar.cc/150?u=jason",
                    },
                    {
                      name: "Loubna C.",
                      date: "4/18/2026",
                      plan: "CV Download",
                      amount: "$1.49",
                      avatar: "https://i.pravatar.cc/150?u=lou",
                    },
                  ].map((row, i) => (
                    <tr key={i}>
                      <td>
                        <div className="user-info">
                          <img src={row.avatar} alt="" />
                          <span>{row.name}</span>
                        </div>
                      </td>
                      <td>{row.date}</td>
                      <td>{row.plan}</td>
                      <td>
                        <span className="amount-text">{row.amount}</span>
                      </td>
                      <td className="row-actions">
                        <button className="row-dot-btn" aria-label="Row menu">
                          <MoreHorizontal size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* AI Usage */}
          <div className="glass-card chart-section-large">
            <div className="card-header">
              <div className="header-titles">
                <h2>AI Usage &amp; Limits</h2>
                <div className="header-meta">
                  <span>Today&apos;s Usage</span>
                  <span className="meta-value">
                    <Clock size={14} /> 10,342
                  </span>
                </div>
              </div>
            </div>

            <div className="chart-wrapper">
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={usageData}>
                  <defs>
                    <linearGradient id="colorFree" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#5B7CFF" stopOpacity={0.38} />
                      <stop offset="100%" stopColor="#5B7CFF" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorPaid" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#8B5CFF" stopOpacity={0.38} />
                      <stop offset="100%" stopColor="#8B5CFF" stopOpacity={0} />
                    </linearGradient>
                  </defs>

                  <CartesianGrid
                    strokeDasharray="4 6"
                    stroke="rgba(255,255,255,0.06)"
                    vertical={false}
                  />

                  <XAxis
                    dataKey="name"
                    stroke="rgba(255,255,255,0.40)"
                    fontSize={12}
                    axisLine={false}
                    tickLine={false}
                  />

                  <YAxis hide />

                  <Tooltip
                    contentStyle={{
                      background: "rgba(10,12,22,0.72)",
                      border: "1px solid rgba(255,255,255,0.10)",
                      borderRadius: "14px",
                      backdropFilter: "blur(12px)",
                      color: "#EAF0FF",
                    }}
                    itemStyle={{ fontSize: 12 }}
                    cursor={{ stroke: "transparent" }}
                  />

                  <Area
                    type="monotone"
                    dataKey="free"
                    stroke="#5B7CFF"
                    strokeWidth={3}
                    fill="url(#colorFree)"
                    dot={false}
                  />
                  <Area
                    type="monotone"
                    dataKey="paid"
                    stroke="#8B5CFF"
                    strokeWidth={3}
                    fill="url(#colorPaid)"
                    dot={false}
                  />
                </AreaChart>
              </ResponsiveContainer>

              <div className="chart-legend">
                <div className="legend-item">
                  <span className="dot free" /> Free Tier
                </div>
                <div className="legend-item">
                  <span className="dot paid" /> Paid Tier
                </div>
                <button className="view-details-btn">View Details</button>
              </div>
            </div>
          </div>

          {/* User Analytics */}
          <div className="glass-card analytics-section">
            <div className="card-header">
              <h2>User Analytics</h2>

              <div className="time-filters">
                <button className="filter-btn active">Monthly</button>
                <button className="filter-btn">Weekly</button>
                <button className="filter-btn">Daily</button>
              </div>
            </div>

            <div className="analytics-layout">
              {/* donut */}
              <div className="donut-wrap">
                <ResponsiveContainer width="100%" height={170}>
                  <PieChart>
                    <Pie
                      data={userData}
                      innerRadius={50}
                      outerRadius={75}
                      paddingAngle={3}
                      dataKey="value"
                      stroke="rgba(0,0,0,0)"
                    >
                      {userData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="donut-center">
                  <span>45%</span>
                </div>
              </div>

              {/* circle legend panel (matches image) */}
              <div className="plans-orb">
                <div className="plans-orb-inner">
                  {planList.map((p) => (
                    <div className="orb-row" key={p.name}>
                      <div className={`orb-icon ${p.dotClass}`}>{p.icon}</div>
                      <div className="orb-text">{p.name}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* amount + button */}
              <div className="analytics-actions">
                <div className="monthly-amount">
                  <TrendingUp size={16} />
                  <span className="amt">$6,824</span>
                  <span className="muted">this month</span>
                </div>

                <button className="manage-billing-btn">
                  <Database size={16} />
                  Manage Billing
                </button>
              </div>
            </div>
          </div>

          {/* Income Insights */}
          <div className="glass-card insights-section">
            <div className="card-header">
              <div className="header-titles">
                <h2>Income Insights</h2>
              </div>
              <button className="header-dot-btn" aria-label="More">
                <MoreHorizontal size={18} />
              </button>
            </div>

            <div className="income-topline">
              <div className="income-amount">
                <span className="amt">$6,824</span>
                <span className="muted">this month</span>
              </div>

              <button className="details-btn ghost">View Details</button>
            </div>

            <div className="income-chart">
              <ResponsiveContainer width="100%" height={170}>
                <BarChart
                  data={incomeData}
                  margin={{ top: 10, right: 10, left: 10, bottom: 15 }}
                >
                  <Tooltip
                    cursor={{ fill: "rgba(255,255,255,0.05)" }}
                    contentStyle={{
                      background: "rgba(10,12,22,0.85)",
                      border: "1px solid rgba(255,255,255,0.12)",
                      borderRadius: "14px",
                      backdropFilter: "blur(12px)",
                      color: "#EAF0FF",
                      padding: "10px 14px",
                    }}
                    itemStyle={{ color: "#EAF0FF", fontSize: 13, fontWeight: 700 }}
                    labelStyle={{ color: "rgba(234,240,255,0.4)", fontSize: 11, marginBottom: 4, fontWeight: 800 }}
                  />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "rgba(255,255,255,0.45)", fontSize: 11 }}
                    tickFormatter={(v, idx) => {
                      if (idx === 0) return "Apr";
                      const parts = String(v).split(" ");
                      return parts[1] || v;
                    }}
                  />
                  <YAxis hide />
                  <Bar 
                    dataKey="value" 
                    fill="#5B7CFF"
                    radius={[6, 6, 0, 0]} 
                    maxBarSize={22}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
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
