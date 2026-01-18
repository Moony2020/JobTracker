import React from 'react';

const StatCard = ({ label, value }) => {
  return (
    <div className="stat-card">
      <h3>{value}</h3>
      <p>{label}</p>
    </div>
  );
};

export default StatCard;
