import React from 'react';
import { CreditCard, Users, Database, ShieldCheck, TrendingUp } from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, Tooltip, XAxis } from 'recharts';
import { useNavigate } from 'react-router-dom';

const AdminOverview = ({ stats, t }) => {
  const navigate = useNavigate();

  const getSimplifiedTemplateName = (name) => {
    if (!name) return 'Unknown Template';
    const lower = name.toLowerCase();
    if (lower.includes('creative')) return 'Creative';
    if (lower.includes('modern')) return 'Modern';
    if (lower.includes('classic')) return 'Classic';
    if (lower.includes('timeline')) return 'Timeline';
    return name;
  };

  return (
    <>
      <div className="admin-stats-grid">
        <div className="glass-card admin-stat-card clickable" onClick={() => navigate('/admin/payments?status=succeeded')}>
          <div className="stat-top">
            <div className="stat-left">
              <div className="stat-icon-wrapper revenue">
                <CreditCard size={18} />
              </div>
              <span className="stat-title">{t.revenueThisMonth}</span>
            </div>
          </div>
          <div className="stat-main">
            <div className="stat-main-row">
              <div className="stat-value">${stats.kpis.revenueThisMonth.toFixed(2)}</div>
            </div>
            <div className="stat-sub">{t.monthly}</div>
          </div>
        </div>

        <div className="glass-card admin-stat-card clickable" onClick={() => navigate('/admin/users')}>
          <div className="stat-top">
            <div className="stat-left">
              <div className="stat-icon-wrapper users">
                <Users size={18} />
              </div>
              <span className="stat-title">{t.totalUsers}</span>
            </div>
          </div>
          <div className="stat-main">
            <div className="stat-main-row">
              <div className="stat-value">{stats.kpis.totalUsers}</div>
            </div>
            <div className="stat-sub">{stats.kpis.activeUsers} {t.activeUsers}</div>
          </div>
        </div>

        <div className="glass-card admin-stat-card clickable" onClick={() => navigate('/admin/templates')}>
          <div className="stat-top">
            <div className="stat-left">
              <div className="stat-icon-wrapper cvs">
                <Database size={18} />
              </div>
              <span className="stat-title">{t.totalCVs}</span>
            </div>
          </div>
          <div className="stat-main">
            <div className="stat-main-row">
              <div className="stat-value">{stats.kpis.totalCVs}</div>
            </div>
            <div className="stat-sub">{t.last30Days}</div>
          </div>
        </div>

        <div className="glass-card admin-stat-card clickable" onClick={() => navigate('/admin/downloads')}>
          <div className="stat-top">
            <div className="stat-left">
              <div className="stat-icon-wrapper downloads">
                <ShieldCheck size={18} />
              </div>
              <span className="stat-title">{t.paidDownloads}</span>
            </div>
          </div>
          <div className="stat-main">
            <div className="stat-main-row">
              <div className="stat-value">{stats.kpis.paidDownloads}</div>
            </div>
            <div className="stat-sub">{t.thisMonth}</div>
          </div>
        </div>
      </div>

      <div className="admin-content-grid">
        <div className="glass-card table-section">
          <div className="card-header">
            <h2>{t.recentPayments}</h2>
            <button className="details-btn ghost" onClick={() => navigate('/admin/payments')}>{t.viewDetails}</button>
          </div>

          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>{t.user}</th>
                  <th>{t.date}</th>
                  <th>{t.template}</th>
                  <th>{t.method}</th>
                  <th>{t.amount}</th>
                  <th>{t.status}</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentPayments.length === 0 ? (
                   <tr>
                     <td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: 'rgba(234,240,255,0.2)' }}>
                       No recent payments
                     </td>
                   </tr>
                ) : (
                  stats.recentPayments.map((row, i) => (
                    <tr key={i}>
                    <td>
                      <div style={{ fontWeight: '600', color: 'white' }}>{row.user?.name || row.userName || row.user?.email || row.email || 'Unknown User'}</div>
                      <div style={{ fontSize: '11px', opacity: 0.4 }}>{row.user?.email || row.email}</div>
                    </td>
                      <td>
                        <div style={{ color: 'white', fontSize: '13px' }}>{new Date(row.createdAt).toLocaleDateString()}</div>
                        <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px' }}>{new Date(row.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                      </td>
                      <td>{getSimplifiedTemplateName(row.template?.name || row.templateName)}</td>
                      <td style={{ textTransform: 'capitalize' }}>{row.provider || row.method}</td>
                      <td><span className="amount-text">${row.amount.toFixed(2)}</span></td>
                      <td><span className={`status-badge ${row.status}`}>{row.status}</span></td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="glass-card analytics-section">
          <div className="card-header">
            <h2>{t.userAnalytics}</h2>
          </div>

          <div className="analytics-layout">
            <div className="donut-wrap">
              <ResponsiveContainer width="100%" height={170}>
                <PieChart>
                  <Pie
                    data={stats.usageAnalytics}
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="value"
                    stroke="rgba(0,0,0,0)"
                  >
                    {stats.usageAnalytics.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="analytics-actions">
              <div className="monthly-amount">
                <TrendingUp size={16} />
                <span className="amt">${stats.kpis.revenueThisMonth.toFixed(2)}</span>
                <span className="muted">{t.thisMonth}</span>
              </div>

              <button className="manage-billing-btn" onClick={() => navigate('/admin/templates')}>
                <Database size={16} />
                {t.manageTemplates}
              </button>
            </div>
          </div>
        </div>

        <div className="glass-card insights-section">
          <div className="card-header">
            <h2>{t.incomeInsights}</h2>
            <button className="details-btn ghost" onClick={() => navigate('/admin/payments')}>{t.viewDetails}</button>
          </div>

          <div className="income-chart">
            <ResponsiveContainer width="100%" height={170}>
              <BarChart data={stats.incomeInsights}>
                <Tooltip
                  cursor={{ fill: 'transparent' }}
                  contentStyle={{
                    background: "rgba(10,12,22,0.85)",
                    border: "1px solid rgba(255,255,255,0.12)",
                    borderRadius: "14px",
                    backdropFilter: "blur(12px)",
                    color: "#EAF0FF",
                    padding: "10px 14px",
                  }}
                />
                <XAxis dataKey="name" hide />
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
    </>
  );
};

export default AdminOverview;
