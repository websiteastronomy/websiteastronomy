"use client";

import { useState, useEffect } from 'react';
import { subscribeToCollection, updateDocument } from '@/lib/db';
import { rowStyle } from './shared';

export default function MemberRequests() {
  const [users, setUsers] = useState<any[]>([]);
  const [approvingUser, setApprovingUser] = useState<any>(null);
  const [selectedRole, setSelectedRole] = useState<'member' | 'core'>('member');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    // We subscribe to the 'users' collection to see real-time updates
    const unsub = subscribeToCollection('users', (data) => setUsers(data));
    return () => unsub();
  }, []);

  const handleApprove = async () => {
    if (!approvingUser) return;
    setIsProcessing(true);
    try {
      await updateDocument('users', approvingUser.id, {
        status: 'approved',
        role: selectedRole
      });
      setApprovingUser(null);
    } catch (err) {
      console.error(err);
      alert("Failed to approve user.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async (id: string) => {
    if (confirm("Are you sure you want to reject this user? They will be blocked from accessing the system.")) {
      try {
        await updateDocument('users', id, { status: 'rejected' });
      } catch (err) {
        console.error(err);
        alert("Failed to reject user.");
      }
    }
  };

  const pendingUsers = users.filter(u => u.status === 'pending');
  const processedUsers = users.filter(u => u.status !== 'pending');

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.4rem' }}>Member Approvals</h2>
      </div>

      {approvingUser && (
        <div style={{ padding: '1.5rem', background: 'rgba(34, 197, 94, 0.1)', border: '1px solid #22c55e', borderRadius: '8px', marginBottom: '1.5rem' }}>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', color: '#22c55e' }}>Approve User: {approvingUser.name}</h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>Assign a technical role to this account.</p>
          
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', fontSize: '0.9rem' }}>
              <input 
                type="radio" 
                name="role" 
                value="member" 
                checked={selectedRole === 'member'} 
                onChange={() => setSelectedRole('member')} 
              />
              Club Member
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', fontSize: '0.9rem', color: 'var(--gold-light)' }}>
              <input 
                type="radio" 
                name="role" 
                value="core" 
                checked={selectedRole === 'core'} 
                onChange={() => setSelectedRole('core')} 
              />
              Core Committee Member
            </label>
          </div>

          <div style={{ display: 'flex', gap: '1rem' }}>
            <button className="btn-primary" disabled={isProcessing} onClick={handleApprove} style={{ padding: '0.5rem 1.5rem' }}>
              {isProcessing ? 'Processing...' : 'Confirm Approval'}
            </button>
            <button className="btn-secondary" disabled={isProcessing} onClick={() => setApprovingUser(null)} style={{ padding: '0.5rem 1.5rem', background: 'transparent' }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* PENDING QUEUE */}
      <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', color: 'var(--text-secondary)' }}>Pending Requests</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginBottom: '3rem' }}>
        {pendingUsers.map((user) => (
          <div key={user.id} style={{ ...rowStyle, padding: '1.2rem' }}>
            <div>
              <h4 style={{ fontSize: '1.05rem', marginBottom: '0.3rem' }}>{user.name}</h4>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                {user.email} {user.phone ? `• ${user.phone}` : ''}
              </p>
              <span style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem', borderRadius: '4px', background: 'rgba(234, 179, 8, 0.2)', color: '#eab308', marginTop: '0.5rem', display: 'inline-block' }}>
                PENDING REVIEW
              </span>
            </div>
            
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button 
                onClick={() => { setApprovingUser(user); setSelectedRole('member'); window.scrollTo(0,0); }}
                style={{ background: '#22c55e', color: '#000', padding: '0.4rem 0.8rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem', fontFamily: 'inherit', fontWeight: 'bold' }}
              >
                Approve
              </button>
              <button 
                onClick={() => handleReject(user.id)}
                style={{ background: 'transparent', border: '1px solid rgba(239, 68, 68, 0.5)', color: '#ef4444', padding: '0.4rem 0.8rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem', fontFamily: 'inherit' }}
              >
                Reject
              </button>
            </div>
          </div>
        ))}
        {pendingUsers.length === 0 && (
          <p style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>No pending accounts to review.</p>
        )}
      </div>

      {/* PROCESSED USERS */}
      <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', color: 'var(--text-secondary)' }}>Account Directory</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
        {processedUsers.map((user) => (
          <div key={user.id} style={{ ...rowStyle, padding: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h4 style={{ fontSize: '0.95rem' }}>{user.name}</h4>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>{user.email}</p>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: user.status === 'approved' ? '#22c55e' : '#ef4444' }}>
                {user.status}
              </span>
              {user.status === 'approved' && (
                <div style={{ fontSize: '0.75rem', marginTop: '0.2rem', color: user.role === 'core' ? 'var(--gold)' : 'var(--text-muted)' }}>
                  {user.role} role
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
