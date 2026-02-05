import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { User, Shield, Mail, Calendar, CheckCircle, XCircle, Search } from 'lucide-react';

const AdminUsers = ({ t }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/users');
      setUsers(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Failed to fetch users:", err);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(user => 
    user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="glass-card admin-page-card" style={{ padding: '0', overflow: 'hidden' }}>
      <div className="card-header" style={{ padding: '24px', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: '700', color: 'white', marginBottom: '4px' }}>{t.users}</h2>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '13px' }}>Manage all registered accounts</p>
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
              <th>{t.user}</th>
              <th>Role</th>
              <th>Plan</th>
              <th>Joined</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="5" style={{ padding: '40px', textAlign: 'center', color: 'rgba(255,255,255,0.5)' }}>Loading users...</td></tr>
            ) : filteredUsers.length === 0 ? (
              <tr><td colSpan="5" style={{ padding: '40px', textAlign: 'center', color: 'rgba(255,255,255,0.5)' }}>No users found</td></tr>
            ) : (
              filteredUsers.map(user => (
                <tr key={user._id} className="table-row-hover">
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '13px', fontWeight: 'bold' }}>
                        {user.name?.substring(0,2).toUpperCase()}
                      </div>
                      <div>
                        <div style={{ color: 'white', fontSize: '15px', fontWeight: '600', marginBottom: '2px' }}>{user.name || user.email}</div>
                        <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px' }}>{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span style={{ 
                      padding: '4px 10px', 
                      borderRadius: '20px', 
                      background: user.role === 'admin' ? 'rgba(168, 85, 247, 0.2)' : 'rgba(255,255,255,0.05)',
                      color: user.role === 'admin' ? '#d8b4fe' : 'rgba(255,255,255,0.7)',
                      fontSize: '11px',
                      textTransform: 'capitalize'
                    }}>
                      {user.role}
                    </span>
                  </td>
                  <td>
                     <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <span style={{ 
                        padding: '4px 10px', 
                        borderRadius: '20px', 
                        background: user.isPremium ? 'rgba(234, 179, 8, 0.2)' : 'rgba(255,255,255,0.05)',
                        color: user.isPremium ? '#fde047' : 'rgba(255,255,255,0.7)',
                        fontSize: '11px',
                        fontWeight: '500',
                        width: 'fit-content'
                      }}>
                        {user.isPremium ? 'PRO' : 'FREE'}
                      </span>
                      {user.isPremium && user.premiumUntil && (
                        <span style={{ color: 'rgba(255,180,0,0.6)', fontSize: '10px' }}>
                           Expires: {new Date(user.premiumUntil).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </td>
                  <td>
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#4ade80', fontSize: '13px' }}>
                      <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#4ade80', boxShadow: '0 0 8px rgba(74, 222, 128, 0.4)' }}></div>
                      Active
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

export default AdminUsers;
