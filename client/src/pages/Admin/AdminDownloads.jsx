import React from 'react';

const AdminDownloads = ({ t }) => (
  <div className="glass-card admin-page-card">
    <div className="card-header">
      <h2>{(t && t.downloads) || 'Access Control'}</h2>
    </div>
    <div className="admin-placeholder-content">
      <p>Monitor active download windows and manage time-limited access tokens for Pro templates.</p>
      <div className="empty-state-dash">
        <p>Access control logs implementation coming soon...</p>
      </div>
    </div>
  </div>
);

export default AdminDownloads;
