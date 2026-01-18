import React, { useState, useMemo } from 'react';
import { Search, Filter, LayoutGrid, List, Download, Edit2, Trash2, MapPin, Calendar, Building } from 'lucide-react';

const Applications = ({ applications, onEdit, onDelete, loading }) => {
  const [view, setView] = useState('table');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const filteredApplications = useMemo(() => {
    return applications.filter(app => {
      const matchesSearch = 
        app.jobTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (app.location && app.location.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesStatus = statusFilter === 'all' || app.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  }, [applications, searchTerm, statusFilter]);

  const paginatedApplications = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredApplications.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredApplications, currentPage]);

  const totalPages = Math.ceil(filteredApplications.length / itemsPerPage);

  const kanbanColumns = ['applied', 'interview', 'test', 'offer', 'rejected', 'canceled'];

  return (
    <div id="applications-page" className="page">
      <div className="header-actions" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h1>Job Applications</h1>
      </div>

      <div className="apps-toolbar">
        <div className="filters">
          <div className="form-group">
            <div className="search-input-wrapper">
              <Search className="search-icon" size={18} />
              <input 
                type="text" 
                className="form-control" 
                placeholder="Search jobs, companies..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div className="status-filter-group">
            <div className="select-wrapper">
              <select 
                className="form-control" 
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All Statuses</option>
                <option value="applied">Applied</option>
                <option value="interview">Interview</option>
                <option value="test">Test</option>
                <option value="offer">Offer</option>
                <option value="rejected">Rejected</option>
                <option value="canceled">Canceled</option>
              </select>
              <Filter className="chevron" size={16} />
            </div>
          </div>
        </div>

        <div className="toolbar-left">
          <div className="view-toggle">
            <button 
              className={`btn-toggle ${view === 'table' ? 'active' : ''}`}
              onClick={() => setView('table')}
            >
              <List size={18} /> Table
            </button>
            <button 
              className={`btn-toggle ${view === 'kanban' ? 'active' : ''}`}
              onClick={() => setView('kanban')}
            >
              <LayoutGrid size={18} /> Kanban
            </button>
          </div>
          <button className="btn btn-outline btn-export">
            <Download size={18} /> Export
          </button>
        </div>
      </div>

      {view === 'table' ? (
        <div className="table-container">
          <table className="applications-table">
            <thead>
              <tr>
                <th>Job Title</th>
                <th>Company</th>
                <th>Location</th>
                <th>Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && applications.length === 0 ? (
                [...Array(10)].map((_, i) => (
                  <tr key={i}>
                    <td><div className="skeleton-loader" style={{ height: '20px', width: '80%' }} /></td>
                    <td><div className="skeleton-loader" style={{ height: '20px', width: '60%' }} /></td>
                    <td><div className="skeleton-loader" style={{ height: '20px', width: '70%' }} /></td>
                    <td><div className="skeleton-loader" style={{ height: '20px', width: '50%' }} /></td>
                    <td><div className="skeleton-loader" style={{ height: '24px', width: '60px', borderRadius: '12px' }} /></td>
                    <td><div className="skeleton-loader" style={{ height: '30px', width: '60px' }} /></td>
                  </tr>
                ))
              ) : paginatedApplications.length > 0 ? (
                paginatedApplications.map(app => (
                  <tr key={app._id} style={{ opacity: app.loading ? 0.6 : 1 }}>
                    <td>{app.jobTitle} {app.loading && <span className="loading-dots">...</span>}</td>
                    <td>{app.company}</td>
                    <td>{app.location || '-'}</td>
                    <td>{new Date(app.date).toLocaleDateString()}</td>
                    <td>
                      <span className={`status-badge status-${app.status}`}>
                        {app.status}
                      </span>
                    </td>
                    <td className="action-buttons">
                      <button className="btn-action btn-edit" onClick={() => onEdit(app)}><Edit2 size={16} /></button>
                      <button className="btn-action btn-delete" onClick={() => onDelete(app._id)}><Trash2 size={16} /></button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="no-data">No applications found matching your filters.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="kanban-container">
          <div className="kanban-board">
            {kanbanColumns.map(status => (
              <div key={status} className="kanban-column">
                <div className="kanban-column-header">
                  {status.toUpperCase()}
                  <span className="count">
                    {filteredApplications.filter(a => a.status === status).length}
                  </span>
                </div>
                <div className="kanban-cards">
                  {loading && applications.length === 0 ? (
                    [...Array(3)].map((_, i) => (
                      <div key={i} className="kanban-card skeleton-loader" style={{ height: '120px', marginBottom: '1rem' }} />
                    ))
                  ) : filteredApplications
                    .filter(a => a.status === status)
                    .map(app => (
                      <div key={app._id} className="kanban-card" style={{ opacity: app.loading ? 0.6 : 1 }}>
                        <h4>{app.jobTitle} {app.loading && <span className="loading-dots">...</span>}</h4>
                        <span className="company">{app.company}</span>
                        <div className="meta">
                          <span><MapPin size={12} /> {app.location || 'Remote'}</span>
                          <span><Calendar size={12} /> {new Date(app.date).toLocaleDateString()}</span>
                        </div>
                        <div className="actions">
                           <button className="btn-action btn-edit" onClick={() => onEdit(app)}><Edit2 size={14} /></button>
                           <button className="btn-action btn-delete" onClick={() => onDelete(app._id)}><Trash2 size={14} /></button>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {totalPages > 1 && (
        <div className="pagination">
          <button 
            className="btn-pagination" 
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
          >
            Previous
          </button>
          <div className="page-numbers">
            {(() => {
              const pages = [];
              const maxVisible = 5;
              
              if (totalPages <= maxVisible) {
                for (let i = 1; i <= totalPages; i++) pages.push(i);
              } else {
                pages.push(1);
                if (currentPage > 3) pages.push('...');
                
                const start = Math.max(2, currentPage - 1);
                const end = Math.min(totalPages - 1, currentPage + 1);
                
                for (let i = start; i <= end; i++) {
                  if (!pages.includes(i)) pages.push(i);
                }
                
                if (currentPage < totalPages - 2) pages.push('...');
                pages.push(totalPages);
              }
              
              return pages.map((page, i) => (
                <button 
                  key={i} 
                  className={`page-num ${currentPage === page ? 'active' : ''} ${page === '...' ? 'dots' : ''}`}
                  onClick={() => page !== '...' && setCurrentPage(page)}
                  disabled={page === '...'}
                  type="button"
                >
                  {page}
                </button>
              ));
            })()}
          </div>
          <button 
            className="btn-pagination" 
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default Applications;
