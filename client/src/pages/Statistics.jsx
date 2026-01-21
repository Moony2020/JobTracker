import React, { useMemo } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  FunnelChart,
  Funnel,
  LabelList
} from 'recharts';
import translations from '../utils/translations';

const Statistics = ({ applications, loading, language }) => {
  const t = translations[language] || translations['English'];
  const [expandedWeeks, setExpandedWeeks] = React.useState({});

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

    const colors = ['#3b82f6', '#f59e0b', '#8b5cf6', '#10b981', '#ef4444', '#6b7280'];
    return Object.keys(counts).map((key, index) => ({
      name: t[key] || key,
      value: counts[key],
      color: colors[index]
    }));
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

    return last6Months;
  }, [applications, language]);

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
    const funnel = [
      { name: t.applied, value: applications.length, fill: '#3b82f6' },
      { name: t.interview, value: applications.filter(app => app.statusHistory?.some(h => h.status === 'interview') || app.status === 'interview' || app.status === 'test' || app.status === 'offer').length, fill: '#f59e0b' },
      { name: t.test, value: applications.filter(app => app.statusHistory?.some(h => h.status === 'test') || app.status === 'test' || app.status === 'offer').length, fill: '#8b5cf6' },
      { name: t.offer, value: applications.filter(app => app.statusHistory?.some(h => h.status === 'offer') || app.status === 'offer').length, fill: '#10b981' },
    ].map(item => ({
      ...item,
      displayLabel: `${item.value} ${item.name}`
    }));

    const weeklyData = sortedWeeks.map(w => ({
      name: `${t.week} ${w.week}`,
      count: w.count
    })).reverse();

    const conversionRates = {
      appliedToInterview: (funnel[0]?.value && funnel[1]?.value) ? ((funnel[1].value / funnel[0].value) * 100).toFixed(1) : "0",
      interviewToOffer: (funnel[1]?.value && funnel[3]?.value) ? ((funnel[3].value / funnel[1].value) * 100).toFixed(1) : "0",
      totalSuccess: (funnel[0]?.value && funnel[3]?.value) ? ((funnel[3].value / funnel[0].value) * 100).toFixed(1) : "0",
    };

    return { sortedWeeks, sortedMonths, weekly, monthly, conversionRates, funnel, weeklyData };
  }, [applications, t]);

  const toggleWeek = (key) => setExpandedWeeks(prev => ({ ...prev, [key]: !prev[key] }));

  if (loading && !applications.length) {
    return <div className="page" id="statistics-page"><div className="loading-message">{t.loading}</div></div>;
  }

  return (
    <div id="statistics-page" className="page">
      <h1>{t.statistics}</h1>
      
      <div className="statistics-sections">
        {/* Advanced Analytics Card */}
        <div className="statistics-section full-width" style={{ gridColumn: '1 / -1' }}>
          <h2>{t.advanced_analytics}</h2>
          <div className="analytics-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
            <div className="analytic-card">
              <h3>{t.applied_to_interview}</h3>
              <p className="value">{extendedStats.conversionRates.appliedToInterview}%</p>
              <p className="desc">{t.success_rate}</p>
            </div>
            <div className="analytic-card">
              <h3>{t.interview_to_offer}</h3>
              <p className="value success">{extendedStats.conversionRates.interviewToOffer}%</p>
              <p className="desc">{t.success_rate}</p>
            </div>
            <div className="analytic-card">
              <h3>{t.total_success_rate}</h3>
              <p className="value secondary">{extendedStats.conversionRates.totalSuccess}%</p>
              <p className="desc">{t.overall_conversion}</p>
            </div>
          </div>
          
          <div className="funnel-container" style={{ padding: '1.5rem', background: 'var(--glass-bg)', borderRadius: '16px', border: '1px solid var(--light-border)', minHeight: '400px' }}>
             <h3 style={{ marginBottom: '1.5rem' }}>{t.conversion_funnel}</h3>
             <ResponsiveContainer width="100%" height={300}>
                <FunnelChart>
                  <Tooltip 
                    contentStyle={{ background: 'var(--card-bg)', border: '1px solid var(--light-border)', borderRadius: '8px' }}
                    itemStyle={{ color: 'var(--text-color)' }}
                  />
                  <Funnel
                    dataKey="value"
                    data={extendedStats.funnel}
                    isAnimationActive
                  >
                    <LabelList 
                      position="right" 
                      dataKey="displayLabel" 
                      fill="var(--text-color)" 
                      stroke="none" 
                      fontSize={13}
                      fontWeight={600}
                    />
                  </Funnel>
                </FunnelChart>
             </ResponsiveContainer>
          </div>
        </div>

        {/* Weekly Activity Chart */}
        <div className="statistics-section">
          <h2>{t.applications_by_week}</h2>
          <div className="stats-container" style={{ padding: '1rem', background: 'var(--glass-bg)', borderRadius: '16px', minHeight: '300px' }}>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={extendedStats.weeklyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--light-border)" vertical={false} />
                <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                   cursor={{ fill: 'var(--glass-bg)' }}
                   contentStyle={{ background: 'var(--card-bg)', border: '1px solid var(--light-border)', borderRadius: '8px' }}
                />
                <Bar dataKey="count" fill="var(--primary-color)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Weekly Stats List */}
        <div className="statistics-section">
          <h2>{t.weekly_details}</h2>
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

        <div className="charts-container" style={{ gridColumn: '1 / -1', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '1.5rem' }}>
          <div className="chart-section" style={{ padding: '1.5rem', background: 'var(--glass-bg)', borderRadius: '16px', border: '1px solid var(--light-border)' }}>
            <h3 style={{ marginBottom: '1.5rem' }}>{t.applications_by_status}</h3>
            <div style={{ height: '300px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ background: 'var(--card-bg)', border: '1px solid var(--light-border)', borderRadius: '8px' }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="chart-section" style={{ padding: '1.5rem', background: 'var(--glass-bg)', borderRadius: '16px', border: '1px solid var(--light-border)' }}>
            <h3 style={{ marginBottom: '1.5rem' }}>{t.application_velocity}</h3>
            <div style={{ height: '300px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={timelineData}>
                  <defs>
                    <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--primary-color)" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="var(--primary-color)" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--light-border)" vertical={false} />
                  <XAxis dataKey="label" stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip 
                    contentStyle={{ background: 'var(--card-bg)', border: '1px solid var(--light-border)', borderRadius: '8px' }}
                  />
                  <Area type="monotone" dataKey="count" stroke="var(--primary-color)" fillOpacity={1} fill="url(#colorCount)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Statistics;
