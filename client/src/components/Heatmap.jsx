import React, { useMemo } from 'react';
import './Heatmap.css';

const Heatmap = ({ applications, language, t }) => {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = React.useState(currentYear);

  const years = useMemo(() => {
    const yearsSet = new Set([currentYear]);
    applications.forEach(app => {
      const year = new Date(app.date).getFullYear();
      if (year) yearsSet.add(year);
    });
    return Array.from(yearsSet).sort((a, b) => b - a);
  }, [applications, currentYear]);

  const locale = useMemo(() => {
    if (language === 'Arabic') return 'ar-SA';
    if (language === 'Swedish') return 'sv-SE';
    return 'en-US';
  }, [language]);

  const heatmapData = useMemo(() => {
    const data = {};
    const startOfYear = new Date(selectedYear, 0, 1);
    const endOfYear = new Date(selectedYear, 11, 31);
    
    let current = new Date(startOfYear);
    while (current <= endOfYear) {
      const y = current.getFullYear();
      const m = String(current.getMonth() + 1).padStart(2, '0');
      const d = String(current.getDate()).padStart(2, '0');
      const dateStr = `${y}-${m}-${d}`;
      data[dateStr] = 0;
      current.setDate(current.getDate() + 1);
    }

    applications.forEach(app => {
      const appDate = new Date(app.date);
      if (appDate.getFullYear() === selectedYear) {
        const y = appDate.getFullYear();
        const m = String(appDate.getMonth() + 1).padStart(2, '0');
        const d = String(appDate.getDate()).padStart(2, '0');
        const dateStr = `${y}-${m}-${d}`;
        if (data[dateStr] !== undefined) {
          data[dateStr]++;
        }
      }
    });

    return data;
  }, [applications, selectedYear]);

  const getColorClass = (count) => {
    if (count === 0) return 'level-0';
    if (count === 1) return 'level-1';
    if (count <= 3) return 'level-2';
    if (count <= 5) return 'level-3';
    return 'level-4';
  };

  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const date = new Date(2024, 0, i + 1); // Jan 1st 2024 was a Monday
      return date.toLocaleString(locale, { weekday: 'short' });
    });
  }, [locale]);

  const monthLabels = useMemo(() => {
    const labels = [];
    const startOfYear = new Date(selectedYear, 0, 1);
    // European start: 0=Mon, 1=Tue, ..., 6=Sun
    const firstDayOfWeek = (startOfYear.getDay() + 6) % 7;

    for (let m = 0; m < 12; m++) {
      const d = new Date(selectedYear, m, 1);
      const daysDiff = Math.floor((d - startOfYear) / (86400000));
      const weekIndex = Math.floor((daysDiff + firstDayOfWeek) / 7);
      
      labels.push({
        name: d.toLocaleString(locale, { month: 'short' }),
        weekIndex,
        daysDiff // useful for debugging if needed
      });
    }
    return labels;
  }, [locale, selectedYear]);

  // Calculate grid
  const days = useMemo(() => {
    const startOfYear = new Date(selectedYear, 0, 1);
    // 0=Mon, 1=Tue, 2=Wed, 3=Thu, 4=Fri, 5=Sat, 6=Sun
    const firstDayOfWeek = (startOfYear.getDay() + 6) % 7; 
    
    const prefix = [];
    for (let i = 0; i < firstDayOfWeek; i++) {
        prefix.push({ isPlaceholder: true });
    }

    const yearDays = Object.keys(heatmapData).sort().map(dateStr => ({
      date: dateStr,
      count: heatmapData[dateStr]
    }));

    return [...prefix, ...yearDays];
  }, [heatmapData, selectedYear]);

  return (
    <div className="heatmap-container">
      <div className="heatmap-header">
        <div className="heatmap-title">
          <h3>{t.application_activity || 'Application Activity'}</h3>
          <span className="total-count">{applications.filter(app => new Date(app.date).getFullYear() === selectedYear).length} applications in {selectedYear}</span>
        </div>
        <div className="year-selector">
          {years.map(year => (
            <button 
              key={year} 
              className={selectedYear === year ? 'active' : ''}
              onClick={() => setSelectedYear(year)}
            >
              {year}
            </button>
          ))}
        </div>
      </div>

      <div className="heatmap-grid-wrapper">
        <div className="heatmap-labels-months">
          {monthLabels.map((ml, i) => (
            <div 
              key={i} 
              className="month-label" 
              style={{ left: `${ml.weekIndex * 17}px` }} 
            >
              {ml.name}
            </div>
          ))}
        </div>
        <div className="heatmap-main-content">
          <div className="heatmap-labels-days">
            {weekDays.map((day, i) => (i === 0 || i === 2 || i === 4) ? <div key={day} className="day-label">{day}</div> : <div key={day} className="day-label-empty" />)}
          </div>
          <div className="heatmap-grid">
            {days.map((day, idx) => (
              <div 
                key={day.isPlaceholder ? `placeholder-${idx}` : day.date} 
                className={`heatmap-cell ${day.isPlaceholder ? 'placeholder' : (day.count === 0 ? 'level-0' : getColorClass(day.count))}`}
                title={day.isPlaceholder ? '' : `${day.count || 0} ${t.applications_count || 'applications'} ${t.on || 'on'} ${day.date}`}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="heatmap-legend">
        <span>Less</span>
        <div className="legend-cells">
          <div className="heatmap-cell level-0" />
          <div className="heatmap-cell level-1" />
          <div className="heatmap-cell level-2" />
          <div className="heatmap-cell level-3" />
          <div className="heatmap-cell level-4" />
        </div>
        <span>More</span>
      </div>
    </div>
  );
};

export default Heatmap;
