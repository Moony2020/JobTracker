import React from 'react';

const AdminSettings = ({ t }) => (
  <div className="glass-card admin-page-card">
    <div className="card-header">
      <h2>{(t && t.settings) || 'Admin Settings'}</h2>
    </div>
    <div className="admin-placeholder-content">
      <p>Configure dashboard preferences, administrative roles, and system-wide notifications.</p>
      <div className="empty-state-dash">
        <p>Settings implementation coming soon...</p>
      </div>
    </div>
  </div>
);

export default AdminSettings;
