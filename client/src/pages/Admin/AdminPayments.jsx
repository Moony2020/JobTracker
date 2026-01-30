import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { CreditCard, Search, Calendar, User, FileText, ExternalLink, CheckCircle } from 'lucide-react';

const AdminPayments = ({ t }) => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/payments');
      setPayments(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Failed to fetch payments:", err);
    } finally {
      setLoading(false);
    }
  };

  const filteredPayments = payments.filter(payment => 
    payment.user?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    payment.paymentId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    payment.template?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatAmount = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  return (
    <div className="glass-card admin-page-card" style={{ padding: '0', overflow: 'hidden' }}>
      <div className="card-header" style={{ padding: '24px', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: '700', color: 'white', marginBottom: '4px' }}>{t.payments}</h2>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '13px' }}>Monitor all CV template transactions</p>
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
              <th>{t.template}</th>
              <th>{t.amount}</th>
              <th>{t.date}</th>
              <th>{t.status}</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="5" style={{ padding: '40px', textAlign: 'center', color: 'rgba(255,255,255,0.5)' }}>Loading transactions...</td></tr>
            ) : filteredPayments.length === 0 ? (
              <tr><td colSpan="5" style={{ padding: '40px', textAlign: 'center', color: 'rgba(255,255,255,0.5)' }}>No transactions found</td></tr>
            ) : (
              filteredPayments.map(payment => (
                <tr key={payment._id} className="table-row-hover">
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(99, 102, 241, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#818cf8' }}>
                        <User size={14} />
                      </div>
                      <div>
                        <div style={{ color: 'white', fontSize: '13px', fontWeight: '600' }}>{payment.user?.name || payment.user?.email || 'Deleted User'}</div>
                        <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px' }}>{payment.user?.email}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <FileText size={14} style={{ color: 'rgba(255,255,255,0.4)' }} />
                      <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: '13px' }}>{payment.template?.name || 'Unknown Template'}</span>
                    </div>
                  </td>
                  <td>
                    <div style={{ color: 'white', fontSize: '14px', fontWeight: '600' }}>{formatAmount(payment.amount)}</div>
                  </td>
                  <td>
                    <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Calendar size={13} />
                      {new Date(payment.createdAt).toLocaleDateString()}
                    </div>
                  </td>
                  <td>
                    <span style={{ 
                      padding: '4px 10px', 
                      borderRadius: '20px', 
                      background: payment.status === 'completed' ? 'rgba(74, 222, 128, 0.15)' : 'rgba(255,255,255,0.05)',
                      color: payment.status === 'completed' ? '#4ade80' : 'rgba(255,255,255,0.5)',
                      fontSize: '11px',
                      fontWeight: '600',
                      textTransform: 'uppercase',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}>
                      {payment.status === 'completed' && <CheckCircle size={10} />}
                      {payment.status}
                    </span>
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

export default AdminPayments;
