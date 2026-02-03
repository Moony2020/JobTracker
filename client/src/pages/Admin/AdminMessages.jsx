import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Mail, Search, MessageSquare, Send, CheckCircle, Clock, Trash2 } from 'lucide-react';




const AdminMessages = ({ t, showNotify }) => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null); // ID of message to delete
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);
  const [hoverCancel, setHoverCancel] = useState(false);
  const [hoverDelete, setHoverDelete] = useState(false);

  useEffect(() => {
    fetchMessages();
  }, []);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/messages');
      setMessages(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Failed to fetch messages:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleReply = async () => {
    if (!replyText.trim()) return;

    try {
      setSending(true);
      await api.post(`/admin/messages/${selectedMessage._id}/reply`, { replyText });
      
      // Update local state
      setMessages(msgs => msgs.map(m => 
        m._id === selectedMessage._id 
          ? { 
              ...m, 
              status: 'replied', 
              repliedAt: new Date().toISOString(), 
              adminReply: replyText,
              replies: [...(m.replies || []), { body: replyText, date: new Date().toISOString() }]
            }
          : m
      ));
      
      setSelectedMessage(null);
      setReplyText('');
      if (showNotify) showNotify('Reply sent successfully!');
    } catch (err) {
      console.error("Failed to send reply:", err);
      if (showNotify) showNotify('Failed to send reply', 'error');
    } finally {
      setSending(false);
    }
  };

  const handleDeleteClick = (id, e) => {
    e.stopPropagation();
    setShowDeleteConfirm(id);
  };

  const confirmDelete = async () => {
    if (!showDeleteConfirm) return;
    
    try {
      await api.delete(`/admin/messages/${showDeleteConfirm}`);
      setMessages(msgs => msgs.filter(m => m._id !== showDeleteConfirm));
      if (showNotify) showNotify('Message deleted successfully', 'success');
    } catch (err) {
      console.error("Failed to delete message:", err);
      if (showNotify) showNotify('Failed to delete message', 'error');
    } finally {
      setShowDeleteConfirm(null);
    }
  };

  const filteredMessages = messages.filter(msg => 
    msg.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    msg.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    msg.subject?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="glass-card admin-page-card" style={{ padding: '0', overflow: 'hidden' }}>
      <div className="card-header" style={{ padding: '24px', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: '700', color: 'white', marginBottom: '4px' }}>Inquiries</h2>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '13px' }}>Manage contact form messages</p>
        </div>
        <div style={{ position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.4)' }} />
          <input 
            type="text" 
            placeholder="Search messages..."
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
              <th>Status</th>
              <th>From</th>
              <th>Subject</th>
              <th>Date</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="5" style={{ padding: '40px', textAlign: 'center', color: 'rgba(255,255,255,0.5)' }}>Loading messages...</td></tr>
            ) : filteredMessages.length === 0 ? (
              <tr><td colSpan="5" style={{ padding: '40px', textAlign: 'center', color: 'rgba(255,255,255,0.5)' }}>No messages found</td></tr>
            ) : (
              filteredMessages.map(msg => (
                <tr key={msg._id} className="table-row-hover">
                   <td>
                    <span style={{ 
                      padding: '4px 10px', 
                      borderRadius: '20px', 
                      background: msg.status === 'replied' ? 'rgba(74, 222, 128, 0.2)' : 'rgba(255,255,255,0.1)', // Green if replied
                      color: msg.status === 'replied' ? '#4ade80' : 'rgba(255,255,255,0.7)',
                      fontSize: '11px',
                      textTransform: 'capitalize',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}>
                      {msg.status === 'replied' ? <CheckCircle size={10} /> : <Clock size={10} />}
                      {msg.status}
                    </span>
                  </td>
                  <td>
                    <div style={{ color: 'white', fontSize: '14px', fontWeight: '500' }}>{msg.name}</div>
                    <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px' }}>{msg.email}</div>
                  </td>
                  <td style={{ color: 'rgba(255,255,255,0.8)', fontSize: '14px' }}>
                    {msg.subject || 'No Subject'}
                  </td>
                  <td style={{ color: 'rgba(255,255,255,0.5)', fontSize: '13px' }}>
                    {new Date(msg.createdAt).toLocaleDateString()}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button 
                        onClick={() => setSelectedMessage(msg)}
                        style={{
                          background: 'rgba(99, 102, 241, 0.2)',
                          color: '#818cf8',
                          border: 'none',
                          padding: '6px 12px',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '12px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          transition: 'all 0.2s'
                        }}
                      >
                        <MessageSquare size={14} />
                        {msg.status === 'replied' ? 'View' : 'Reply'}
                      </button>

                      <button 
                        onClick={(e) => handleDeleteClick(msg._id, e)}
                        style={{
                          background: 'rgba(239, 68, 68, 0.2)',
                          color: '#ef4444',
                          border: 'none',
                          padding: '6px 10px',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'all 0.2s'
                        }}
                        title="Delete Message"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Reply/View Modal */}
      {selectedMessage && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(5px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
          padding: '20px' /* Reduced to 20px */
        }} onClick={() => setSelectedMessage(null)}>
          <div style={{
            background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)',
            width: '600px', maxWidth: '100%', borderRadius: '16px', 
            maxHeight: '100%', display: 'flex', flexDirection: 'column',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
            overflow: 'hidden', boxSizing: 'border-box'
          }} onClick={e => e.stopPropagation()}>
            
            {/* Header - Fixed */}
            <div style={{ padding: '20px 30px 20px 30px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <h3 style={{ color: 'white', fontSize: '20px', display: 'flex', alignItems: 'center', gap: '10px', margin: 0 }}>
                <Mail size={20} color="#818cf8" />
                Message Details
                </h3>
            </div>

            {/* Scrollable Content Body */}
            <div style={{ overflowY: 'auto', flex: 1, padding: '20px 30px' }}>
                {/* Original Message */}
                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '20px', borderRadius: '8px', marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <span style={{ color: '#94a3b8', fontSize: '13px' }}>From: <strong>{selectedMessage.name}</strong></span>
                    <span style={{ color: '#64748b', fontSize: '12px' }}>{new Date(selectedMessage.createdAt).toLocaleString()}</span>
                </div>
                <p style={{ color: 'white', fontSize: '15px', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
                    {selectedMessage.message}
                </p>
                </div>

                {/* Reply History */}
                {selectedMessage.replies && selectedMessage.replies.length > 0 ? (
                <div style={{ marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {selectedMessage.replies.map((reply, index) => (
                        <div key={index} style={{ background: 'rgba(74, 222, 128, 0.1)', border: '1px solid rgba(74, 222, 128, 0.2)', padding: '15px', borderRadius: '8px' }}>
                        <p style={{ color: '#4ade80', fontSize: '12px', fontWeight: 'bold', marginBottom: '5px' }}>YOUR REPLY {index + 1}:</p>
                        <p style={{ color: 'rgba(255,255,255,0.9)', fontSize: '14px' }}>{reply.body}</p>
                        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px', marginTop: '5px' }}>Sent on {new Date(reply.date).toLocaleString()}</p>
                        </div>
                    ))}
                </div>
                ) : selectedMessage.status === 'replied' && (
                /* Fallback for old messages */
                <div style={{ background: 'rgba(74, 222, 128, 0.1)', border: '1px solid rgba(74, 222, 128, 0.2)', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
                    <p style={{ color: '#4ade80', fontSize: '12px', fontWeight: 'bold', marginBottom: '5px' }}>SENT REPLY:</p>
                    <p style={{ color: 'rgba(255,255,255,0.9)', fontSize: '14px' }}>{selectedMessage.adminReply}</p>
                    <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px', marginTop: '5px' }}>Replied on {new Date(selectedMessage.repliedAt).toLocaleString()}</p>
                </div>
                )}

                {/* Reply Form */}
                <div style={{ marginBottom: '10px' }}>
                    <label style={{ display: 'block', color: '#94a3b8', fontSize: '13px', marginBottom: '8px' }}>Your Reply (This will be emailed via Professional Template)</label>
                    <textarea
                        value={replyText}
                        onChange={e => setReplyText(e.target.value)}
                        placeholder="Type your professional reply here..."
                        style={{
                        width: '100%', height: '120px', background: 'rgba(0,0,0,0.3)',
                        border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px',
                        padding: '12px', color: 'white', fontSize: '14px', outline: 'none',
                        fontFamily: 'inherit', resize: 'vertical'
                        }}
                    />
                </div>
            </div>

            {/* Footer - Fixed */}
            <div style={{ 
                padding: '20px 30px 20px 30px', 
                borderTop: '1px solid rgba(255,255,255,0.05)',
                display: 'flex', justifyContent: 'flex-end', gap: '12px', background: '#0f172a' 
            }}>
              <button 
                onClick={() => setSelectedMessage(null)}
                style={{
                  background: 'transparent', color: '#94a3b8', border: 'none',
                  padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontSize: '14px'
                }}
              >
                Close
              </button>
              <button 
                onClick={handleReply}
                disabled={sending || !replyText.trim()}
                style={{
                  background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                  color: 'white', border: 'none', padding: '10px 24px',
                  borderRadius: '6px', cursor: 'pointer', fontSize: '14px', fontWeight: '600',
                  display: 'flex', alignItems: 'center', gap: '8px',
                  opacity: (sending || !replyText.trim()) ? 0.7 : 1
                }}
              >
                {sending ? 'Sending...' : (
                  <>
                    <Send size={16} />
                    Send Reply
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(5px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100
        }} onClick={() => setShowDeleteConfirm(null)}>
          <div style={{
            background: 'rgba(30, 41, 59, 0.9)', 
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '16px', 
            padding: '24px 16px', 
            width: '480px', 
            maxWidth: '90%',
            textAlign: 'center',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
          }} onClick={e => e.stopPropagation()}>
            <div style={{ 
              width: '44px', height: '44px', borderRadius: '50%', background: 'rgba(239, 68, 68, 0.2)', 
              color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 16px auto'
            }}>
              <Trash2 size={22} />
            </div>
            <h3 style={{ color: 'white', fontSize: '16px', marginBottom: '8px' }}>Delete Message?</h3>
            <p style={{ color: '#94a3b8', fontSize: '13px', marginBottom: '20px', lineHeight: '1.5' }}>
              Are you sure you want to delete this message? This action cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button 
                onClick={() => setShowDeleteConfirm(null)}
                onMouseEnter={() => setHoverCancel(true)}
                onMouseLeave={() => setHoverCancel(false)}
                style={{
                  width: '80px',
                  height: '34px',
                  boxSizing: 'border-box',
                  background: hoverCancel ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.05)', 
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: 'white', 
                  padding: '0', 
                  borderRadius: '10px', 
                  cursor: 'pointer',
                  fontSize: '13px', 
                  fontWeight: '500', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  transition: 'all 0.2s'
                }}
              >
                Cancel
              </button>
              <button 
                onClick={confirmDelete}
                onMouseEnter={() => setHoverDelete(true)}
                onMouseLeave={() => setHoverDelete(false)}
                style={{
                  width: '80px',
                  height: '34px',
                  boxSizing: 'border-box',
                  background: hoverDelete ? '#dc2626' : '#ef4444', 
                  border: hoverDelete ? '1px solid #dc2626' : '1px solid rgba(239, 68, 68, 1)', 
                  color: 'white', 
                  padding: '0', 
                  borderRadius: '10px', 
                  cursor: 'pointer',
                  fontSize: '13px', 
                  fontWeight: '600', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  boxShadow: hoverDelete ? '0 6px 16px rgba(239, 68, 68, 0.5)' : '0 4px 12px rgba(239, 68, 68, 0.4)',
                  transition: 'all 0.2s',
                  transform: hoverDelete ? 'translateY(-1px)' : 'none'
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminMessages;
