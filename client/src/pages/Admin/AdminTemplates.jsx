import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Database, Search, Edit2, CheckCircle, XCircle, DollarSign, Tag } from 'lucide-react';

const AdminTemplates = ({ t }) => {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const res = await api.get('/cv/templates');
      setTemplates(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Failed to fetch templates:", err);
    } finally {
      setLoading(false);
    }
  };

  const filteredTemplates = templates.filter(template => 
    template.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    template.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    template.key?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="glass-card admin-page-card" style={{ padding: '0', overflow: 'hidden' }}>
      <div className="card-header" style={{ padding: '24px', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: '700', color: 'white', marginBottom: '4px' }}>{t.templates}</h2>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '13px' }}>Manage CV template library and pricing</p>
        </div>
        <div style={{ position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.4)' }} />
          <input 
            type="text" 
            placeholder={t.search}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ 
              background: 'rgba(255,255,255,0.05)', 
              border: '1px solid rgba(255,255,255,0.1)', 
              borderRadius: '8px',
              padding: '8px 12px 8px 36px',
              color: 'white',
              fontSize: '14px',
              width: '240px',
              outline: 'none'
            }} 
          />
        </div>
      </div>

      <div className="table-responsive">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Template</th>
              <th>Key</th>
              <th>Category</th>
              <th>Price</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="5" style={{ padding: '40px', textAlign: 'center', color: 'rgba(255,255,255,0.5)' }}>Loading templates...</td></tr>
            ) : filteredTemplates.length === 0 ? (
              <tr><td colSpan="5" style={{ padding: '40px', textAlign: 'center', color: 'rgba(255,255,255,0.5)' }}>No templates found</td></tr>
            ) : (
              filteredTemplates.map(template => (
                <tr key={template._id} className="table-row-hover">
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '40px', height: '52px', overflow: 'hidden', borderRadius: '4px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                        {template.thumbnail ? (
                           <img src={template.thumbnail} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                           <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.2)' }}>
                             <Tag size={16} />
                           </div>
                        )}
                      </div>
                      <div style={{ color: 'white', fontSize: '14px', fontWeight: '500' }}>{template.name}</div>
                    </div>
                  </td>
                  <td>
                    {template.key}
                  </td>
                  <td>
                    <span style={{ 
                      padding: '4px 10px', 
                      borderRadius: '20px', 
                      background: template.category === 'Pro' || template.category === 'Premium' ? 'rgba(139, 92, 246, 0.2)' : 'rgba(74, 222, 128, 0.1)',
                      color: template.category === 'Pro' || template.category === 'Premium' ? '#c084fc' : '#4ade80',
                      fontSize: '11px',
                      fontWeight: '600'
                    }}>
                      {template.category}
                    </span>
                  </td>
                  <td style={{ padding: '16px 24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'white', fontSize: '14px', fontWeight: '600' }}>
                      {template.price > 0 ? (
                        <>
                          <DollarSign size={14} style={{ color: 'rgba(255,255,255,0.4)' }} />
                          {template.price.toFixed(2)}
                        </>
                      ) : (
                        <span style={{ color: 'rgba(255,255,255,0.4)', fontWeight: '400' }}>Free</span>
                      )}
                    </div>
                  </td>
                  <td style={{ padding: '16px 24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: template.isActive ? '#4ade80' : 'rgba(255,255,255,0.3)', fontSize: '13px' }}>
                      {template.isActive ? (
                        <CheckCircle size={14} />
                      ) : (
                        <XCircle size={14} />
                      )}
                      {template.isActive ? 'Active' : 'Disabled'}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminTemplates;
