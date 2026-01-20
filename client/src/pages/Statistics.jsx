import React, { useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
} from 'chart.js';
import { Bar, Pie, Line } from 'react-chartjs-2';
import translations from '../utils/translations';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const Statistics = ({ applications, loading, language }) => {
  const t = translations[language] || translations['English'];
  const [selectedMonth, setSelectedMonth] = React.useState('all');
  const [expandedWeeks, setExpandedWeeks] = React.useState({});
  const [expandedMonths, setExpandedMonths] = React.useState({});

  // Helper: Get Week Number
  const getWeekNumber = (d) => {
    d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
    var yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    var weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
    return weekNo;
  };

  const getStatusText = (status) => {
    return t[status] || status;
  };

  const statusData = useMemo(() => {
    const counts = { applied: 0, interview: 0, test: 0, offer: 0, rejected: 0, canceled: 0 };
    applications.forEach(app => {
      if (counts[app.status] !== undefined) counts[app.status]++;
    });

    return {
      labels: Object.keys(counts).map(s => t[s] || s),
      datasets: [{
        data: Object.values(counts),
        backgroundColor: ['#3b82f6', '#f59e0b', '#8b5cf6', '#10b981', '#ef4444', '#6b7280'],
        borderWidth: 0,
      }],
    };
  }, [applications, t]);

  const timelineData = useMemo(() => {
    const last6Months = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      last6Months.push({
        label: d.toLocaleString(language === 'Arabic' ? 'ar' : language === 'Swedish' ? 'sv' : 'en', { month: 'short' }),
        month: d.getMonth(),
        year: d.getFullYear(),
        count: 0,
      });
    }

    applications.forEach(app => {
      const appDate = new Date(app.date);
      const monthIdx = last6Months.findIndex(m => m.month === appDate.getMonth() && m.year === appDate.getFullYear());
      if (monthIdx !== -1) last6Months[monthIdx].count++;
    });

    return {
      labels: last6Months.map(m => m.label),
      datasets: [{
        label: t.applications || 'Applications Trend',
        data: last6Months.map(m => m.count),
        borderColor: '#6366f1',
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
        fill: true,
        tension: 0.4,
      }],
    };
  }, [applications, language, t.applications]);

  const extendedStats = useMemo(() => {
    const weekly = {};
    const monthly = {};

    applications.forEach(app => {
      const date = new Date(app.date);
      // Weekly
      const weekNo = getWeekNumber(date);
      const year = date.getFullYear();
      const weekKey = `${year}-W${weekNo.toString().padStart(2, '0')}`;
      if (!weekly[weekKey]) weekly[weekKey] = { week: weekNo, year, count: 0, applications: [] };
      weekly[weekKey].count++;
      weekly[weekKey].applications.push(app);

      // Monthly
      const month = date.getMonth();
      const monthKey = `${year}-${(month + 1).toString().padStart(2, '0')}`;
      const monthName = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      if (!monthly[monthKey]) monthly[monthKey] = { month: month + 1, year, monthName, count: 0, applications: [] };
      monthly[monthKey].count++;
      monthly[monthKey].applications.push(app);
    });

    const sortedWeeks = Object.values(weekly).sort((a, b) => b.year !== a.year ? b.year - a.year : b.week - a.week);
    const sortedMonths = Object.values(monthly).sort((a, b) => b.year !== a.year ? b.year - a.year : b.month - a.month);

    // Advanced Funnel Stats
    const funnel = {
      applied: applications.length,
      interview: applications.filter(app => app.statusHistory?.some(h => h.status === 'interview') || app.status === 'interview' || app.status === 'test' || app.status === 'offer').length,
      test: applications.filter(app => app.statusHistory?.some(h => h.status === 'test') || app.status === 'test' || app.status === 'offer').length,
      offer: applications.filter(app => app.statusHistory?.some(h => h.status === 'offer') || app.status === 'offer').length,
    };

    const conversionRates = {
      appliedToInterview: funnel.applied ? ((funnel.interview / funnel.applied) * 100).toFixed(1) : 0,
      interviewToOffer: funnel.interview ? ((funnel.offer / funnel.interview) * 100).toFixed(1) : 0,
      totalSuccess: funnel.applied ? ((funnel.offer / funnel.applied) * 100).toFixed(1) : 0,
    };

    return { sortedWeeks, sortedMonths, weekly, monthly, conversionRates, funnel };
  }, [applications]);

  const filteredMonthApps = useMemo(() => {
    if (selectedMonth === 'all') return [];
    return extendedStats.monthly[selectedMonth]?.applications || [];
  }, [selectedMonth, extendedStats]);

  const toggleWeek = (key) => setExpandedWeeks(prev => ({ ...prev, [key]: !prev[key] }));
  const toggleMonth = (key) => setExpandedMonths(prev => ({ ...prev, [key]: !prev[key] }));

  return (
    <div id="statistics-page" className="page">
      <h1>{t.statistics}</h1>
      
      <div className="statistics-sections">
        {/* Advanced Analytics Card */}
        <div className="statistics-section full-width" style={{ gridColumn: '1 / -1' }}>
          <h2>{t.advanced_analytics}</h2>
          <div className="analytics-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
            <div className="analytic-card" style={{ padding: '1.5rem', background: 'var(--glass-bg)', borderRadius: '16px', border: '1px solid var(--light-border)', textAlign: 'center' }}>
              <h3 style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Applied to Interview</h3>
              <p style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--primary-color)' }}>{extendedStats.conversionRates.appliedToInterview}%</p>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Success Rate</p>
            </div>
            <div className="analytic-card" style={{ padding: '1.5rem', background: 'var(--glass-bg)', borderRadius: '16px', border: '1px solid var(--light-border)', textAlign: 'center' }}>
              <h3 style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Interview to Offer</h3>
              <p style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--success-color)' }}>{extendedStats.conversionRates.interviewToOffer}%</p>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Success Rate</p>
            </div>
            <div className="analytic-card" style={{ padding: '1.5rem', background: 'var(--glass-bg)', borderRadius: '16px', border: '1px solid var(--light-border)', textAlign: 'center' }}>
              <h3 style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Total Success Rate</h3>
              <p style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--secondary-color)' }}>{extendedStats.conversionRates.totalSuccess}%</p>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Overall Conversion</p>
            </div>
          </div>
          
          <div className="funnel-container" style={{ padding: '1.5rem', background: 'var(--glass-bg)', borderRadius: '16px', border: '1px solid var(--light-border)' }}>
             <h3 style={{ marginBottom: '1.5rem' }}>{t.conversion_funnel}</h3>
             <div className="funnel-stages" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div className="funnel-stage" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ width: '100px', fontWeight: '600' }}>{t.applied}</div>
                  <div style={{ flex: 1, height: '30px', background: 'var(--primary-color)', borderRadius: '4px', opacity: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '0.8rem' }}>{extendedStats.funnel.applied}</div>
                </div>
                <div className="funnel-stage" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ width: '100px', fontWeight: '600' }}>{t.interview}</div>
                  <div style={{ flex: extendedStats.funnel.interview / (extendedStats.funnel.applied || 1), height: '30px', background: 'var(--warning-color)', borderRadius: '4px', opacity: 0.9, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '0.8rem', minWidth: '40px' }}>{extendedStats.funnel.interview}</div>
                </div>
                <div className="funnel-stage" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ width: '100px', fontWeight: '600' }}>{t.test}</div>
                  <div style={{ flex: extendedStats.funnel.test / (extendedStats.funnel.applied || 1), height: '30px', background: 'var(--secondary-color)', borderRadius: '4px', opacity: 0.8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '0.8rem', minWidth: '30px' }}>{extendedStats.funnel.test}</div>
                </div>
                <div className="funnel-stage" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ width: '100px', fontWeight: '600' }}>{t.offer}</div>
                  <div style={{ flex: extendedStats.funnel.offer / (extendedStats.funnel.applied || 1), height: '30px', background: 'var(--success-color)', borderRadius: '4px', opacity: 0.7, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '0.8rem', minWidth: '20px' }}>{extendedStats.funnel.offer}</div>
                </div>
             </div>
          </div>
        </div>
        {/* Weekly Stats */}
        <div className="statistics-section">
          <h2>{t.applications_by_week}</h2>
          <div className="stats-container">
            {loading && applications.length === 0 ? <div className="loading-message">{t.loading}</div> : 
             extendedStats.sortedWeeks.map(week => {
               const key = `${week.year}-W${week.week}`;
               return (
                 <div key={key} className={`stat-item ${expandedWeeks[key] ? 'active' : ''}`}>
                   <div className="stat-header" onClick={() => toggleWeek(key)}>
                     <h4><i className={`ri-arrow-${expandedWeeks[key] ? 'up' : 'down'}-s-line`}></i> {t.week} {week.week}, {week.year}</h4>
                     <span className="stat-count">{week.count} {t.applications_count}</span>
                   </div>
                   {expandedWeeks[key] && (
                     <div className="stat-content">
                       <div className="applications-list">
                         {week.applications.map(app => (
                           <div key={app._id} className="application-item">
                             <span className="app-title">{app.jobTitle}</span>
                             <span className="app-company">{t.at} {app.company}</span>
                             <span className="app-location">{app.location ? `${t.in} ${app.location}` : ''}</span>
                             <span className={`app-status status-${app.status}`}>{getStatusText(app.status)}</span>
                           </div>
                         ))}
                       </div>
                     </div>
                   )}
                 </div>
               );
             })
            }
          </div>
        </div>

        {/* Monthly Stats */}
        <div className="statistics-section">
          <h2>{t.applications_by_month}</h2>
          <div className="stats-container">
            {extendedStats.sortedMonths.map(month => {
              const key = `${month.year}-${month.month.toString().padStart(2, '0')}`;
              return (
                <div key={key} className={`stat-item ${expandedMonths[key] ? 'active' : ''}`}>
                  <div className="stat-header" onClick={() => toggleMonth(key)}>
                    <h4><i className={`ri-arrow-${expandedMonths[key] ? 'up' : 'down'}-s-line`}></i> {month.monthName}</h4>
                    <span className="stat-count">{month.count} {t.applications_count}</span>
                  </div>
                  {expandedMonths[key] && (
                    <div className="stat-content">
                      <div className="applications-list">
                        {month.applications.map(app => (
                          <div key={app._id} className="application-item">
                            <span className="app-title">{app.jobTitle}</span>
                            <span className="app-company">{t.at} {app.company}</span>
                            <span className={`app-status status-${app.status}`}>{getStatusText(app.status)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Month Filter */}
        <div className="statistics-section">
          <h2>{t.filter_by_month}</h2>
          <div className="filter-controls">
            <div className="form-group">
              <label>{t.select_month}</label>
              <div className="select-wrapper">
                <select className="form-control" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)}>
                  <option value="all">{t.select_month}</option>
                  {extendedStats.sortedMonths.map(m => {
                    const [monthName, year] = m.monthName.split(' ');
                    const translatedMonth = t.months?.[monthName] || monthName;
                    return (
                      <option key={`${m.year}-${m.month}`} value={`${m.year}-${m.month.toString().padStart(2, '0')}`}>
                         {translatedMonth} {year}
                      </option>
                    );
                  })}
                </select>
                <i className="ri-arrow-down-s-fill chevron"></i>
              </div>
            </div>
          </div>
          <div className="filtered-results">
            {selectedMonth === 'all' ? (
              <div className="initial-message">{t.initial_message}</div>
            ) : filteredMonthApps.length === 0 ? (
              <div className="no-data">{t.no_apps}</div>
            ) : (
              <div className="applications-list">
                {filteredMonthApps.map(app => (
                  <div key={app._id} className="application-item">
                    <span className="app-title">{app.jobTitle}</span>
                    <span className="app-company">{t.at} {app.company}</span>
                    <span className={`app-status status-${app.status}`}>{getStatusText(app.status)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="charts-container">
          <div className="chart-section">
            <h3>{t.applications_by_status}</h3>
            <div style={{ height: '300px', display: 'flex', justifyContent: 'center' }}>
              <Pie data={statusData} options={{ maintainAspectRatio: false }} />
            </div>
          </div>
          <div className="chart-section" style={{ minHeight: '320px' }}>
            <h3>{t.application_velocity}</h3>
            <div style={{ height: '300px' }}>
              <Line data={timelineData} options={{ maintainAspectRatio: false }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Statistics;
