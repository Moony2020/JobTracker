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

const Statistics = ({ applications, loading }) => {
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
    const statusMap = {
      applied: "Applied",
      interview: "Interview",
      test: "Test",
      offer: "Offer",
      rejected: "Rejected",
      canceled: "Canceled",
    };
    return statusMap[status] || status;
  };

  const statusData = useMemo(() => {
    const counts = { applied: 0, interview: 0, test: 0, offer: 0, rejected: 0, canceled: 0 };
    applications.forEach(app => {
      if (counts[app.status] !== undefined) counts[app.status]++;
    });

    return {
      labels: Object.keys(counts).map(s => s.charAt(0).toUpperCase() + s.slice(1)),
      datasets: [{
        data: Object.values(counts),
        backgroundColor: ['#3b82f6', '#f59e0b', '#8b5cf6', '#10b981', '#ef4444', '#6b7280'],
        borderWidth: 0,
      }],
    };
  }, [applications]);

  const timelineData = useMemo(() => {
    const last6Months = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      last6Months.push({
        label: d.toLocaleString('default', { month: 'short' }),
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
        label: 'Applications Trend',
        data: last6Months.map(m => m.count),
        borderColor: '#6366f1',
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
        fill: true,
        tension: 0.4,
      }],
    };
  }, [applications]);

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

    return { sortedWeeks, sortedMonths, weekly, monthly };
  }, [applications]);

  const filteredMonthApps = useMemo(() => {
    if (selectedMonth === 'all') return [];
    return extendedStats.monthly[selectedMonth]?.applications || [];
  }, [selectedMonth, extendedStats]);

  const toggleWeek = (key) => setExpandedWeeks(prev => ({ ...prev, [key]: !prev[key] }));
  const toggleMonth = (key) => setExpandedMonths(prev => ({ ...prev, [key]: !prev[key] }));

  return (
    <div id="statistics-page" className="page">
      <h1>Application Statistics</h1>
      
      <div className="statistics-sections">
        {/* Weekly Stats */}
        <div className="statistics-section">
          <h2>Applications by Week</h2>
          <div className="stats-container">
            {loading && applications.length === 0 ? <div className="loading-message">Loading...</div> : 
             extendedStats.sortedWeeks.map(week => {
               const key = `${week.year}-W${week.week}`;
               return (
                 <div key={key} className={`stat-item ${expandedWeeks[key] ? 'active' : ''}`}>
                   <div className="stat-header" onClick={() => toggleWeek(key)}>
                     <h4><i className={`ri-arrow-${expandedWeeks[key] ? 'up' : 'down'}-s-line`}></i> Week {week.week}, {week.year}</h4>
                     <span className="stat-count">{week.count} applications</span>
                   </div>
                   {expandedWeeks[key] && (
                     <div className="stat-content">
                       <div className="applications-list">
                         {week.applications.map(app => (
                           <div key={app._id} className="application-item">
                             <span className="app-title">{app.jobTitle}</span>
                             <span className="app-company">at {app.company}</span>
                             <span className="app-location">{app.location ? `in ${app.location}` : ''}</span>
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
          <h2>Applications by Month</h2>
          <div className="stats-container">
            {extendedStats.sortedMonths.map(month => {
              const key = `${month.year}-${month.month.toString().padStart(2, '0')}`;
              return (
                <div key={key} className={`stat-item ${expandedMonths[key] ? 'active' : ''}`}>
                  <div className="stat-header" onClick={() => toggleMonth(key)}>
                    <h4><i className={`ri-arrow-${expandedMonths[key] ? 'up' : 'down'}-s-line`}></i> {month.monthName}</h4>
                    <span className="stat-count">{month.count} applications</span>
                  </div>
                  {expandedMonths[key] && (
                    <div className="stat-content">
                      <div className="applications-list">
                        {month.applications.map(app => (
                          <div key={app._id} className="application-item">
                            <span className="app-title">{app.jobTitle}</span>
                            <span className="app-company">at {app.company}</span>
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
          <h2>Filter Applications by Specific Month</h2>
          <div className="filter-controls">
            <div className="form-group">
              <label>Select Month</label>
              <div className="select-wrapper">
                <select className="form-control" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)}>
                  <option value="all">Select Month</option>
                  {extendedStats.sortedMonths.map(m => (
                    <option key={`${m.year}-${m.month}`} value={`${m.year}-${m.month.toString().padStart(2, '0')}`}>
                      {m.monthName}
                    </option>
                  ))}
                </select>
                <i className="ri-arrow-down-s-fill chevron"></i>
              </div>
            </div>
          </div>
          <div className="filtered-results">
            {selectedMonth === 'all' ? (
              <div className="initial-message">Select a month to view specific results.</div>
            ) : filteredMonthApps.length === 0 ? (
              <div className="no-data">No applications found for this month.</div>
            ) : (
              <div className="applications-list">
                {filteredMonthApps.map(app => (
                  <div key={app._id} className="application-item">
                    <span className="app-title">{app.jobTitle}</span>
                    <span className="app-company">at {app.company}</span>
                    <span className={`app-status status-${app.status}`}>{getStatusText(app.status)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="charts-container">
          <div className="chart-section">
            <h3>Applications by Status</h3>
            <div style={{ height: '300px', display: 'flex', justifyContent: 'center' }}>
              <Pie data={statusData} options={{ maintainAspectRatio: false }} />
            </div>
          </div>
          <div className="chart-section" style={{ minHeight: '320px' }}>
            <h3>Application Velocity</h3>
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
