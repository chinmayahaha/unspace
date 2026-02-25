/* src/pages/AdminPage.js */
import React, { useState, useEffect } from 'react';
import { functions } from '../firebase';
import { db } from '../firebase';
import { collection, query, where, onSnapshot, doc, updateDoc } from 'firebase/firestore';

import { httpsCallable } from 'firebase/functions';
// FIX: Import useAuth to guard all admin calls
import { useAuth } from '../features/auth/context/AuthContext';

const AdminPage = () => {
  // FIX: Get user and isAdmin from context
  const { user, isAdmin } = useAuth();

  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('users');
const [pendingItems, setPendingItems] = useState({});
const [pendingTab, setPendingTab] = useState('listings');
const [contactMessages, setContactMessages] = useState([]);

  useEffect(() => {
    // FIX: Only load dashboard if user is logged in
    // isAdmin check happens server-side too — this is just a UI guard
    if (user) {
      loadDashboard();
    } else {
      setLoading(false);
    }
  }, [user]); // Re-run when auth resolves

  useEffect(() => {
    if (!user) return;
  
    const collections = ['listings', 'books', 'lostAndFound', 'serviceRequests'];
    const unsubs = collections.map(col =>
      onSnapshot(
        query(collection(db, col), where('status', '==', 'pending')),
        (snap) => {
          setPendingItems(prev => ({
            ...prev,
            [col]: snap.docs.map(d => ({ id: d.id, _collection: col, ...d.data() }))
          }));
        }
      )
    );
  
    // Contact messages
    const contactUnsub = onSnapshot(
      collection(db, 'contactMessages'),
      (snap) => setContactMessages(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    );
  
    return () => { unsubs.forEach(u => u()); contactUnsub(); };
  }, [user]);

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const getStats = httpsCallable(functions, 'getAdminStats');
      const getUsers = httpsCallable(functions, 'getAllUsers');

      const [statsRes, usersRes] = await Promise.all([
        getStats({}),
        getUsers({})
      ]);

      setStats(statsRes.data);
      setUsers(usersRes.data.users || []);
    } catch (error) {
      console.error("Admin Load Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleBan = async (userId, currentStatus) => {
    if (!window.confirm(`${currentStatus ? 'Unban' : 'Ban'} this user?`)) return;
    try {
      const banFunc = httpsCallable(functions, 'banUser');
      await banFunc({ targetUserId: userId, ban: !currentStatus });
      loadDashboard();
    } catch (e) {
      alert(e.message);
    }
  };

  const handleGrantSelf = async () => {
    const secret = window.prompt("Enter Deployment Secret Key:");
    if (!secret) return;
    try {
      const func = httpsCallable(functions, 'makeMeAdmin');
      const result = await func({ secretKey: secret });
      alert(result.data.message);
      loadDashboard();
    } catch (error) {
      console.error(error);
      alert("Failed: " + error.message);
    }
  };

  const handleApprove = async (col, itemId) => {
    await updateDoc(doc(db, col, itemId), { status: 'active', approvedAt: new Date(), approvedBy: user.id });
  };
  
  const handleReject = async (col, itemId) => {
    const reason = window.prompt("Reason for rejection (shown to user):");
    if (reason === null) return;
    await updateDoc(doc(db, col, itemId), { status: 'rejected', rejectedReason: reason, rejectedAt: new Date() });
  };
  const handleDeleteItem = async (collection, id) => {
    if (!window.confirm(`Delete ${id} from ${collection}? This cannot be undone.`)) return;
    try {
      const deleteFunc = httpsCallable(functions, 'deleteAnyItem');
      await deleteFunc({ collection, id });
      alert("Deleted successfully.");
    } catch (e) {
      alert(e.message);
    }
  };


  // Show loading state
  if (loading) return (
    <div className="text-white p-10 text-center animate-pulse">Loading Mission Control...</div>
  );

  // Show sign-in prompt if not authenticated
  if (!user) return (
    <div className="text-white p-10 text-center">
      <h2 className="text-2xl font-bold mb-4 text-red-500">Access Denied</h2>
      <p className="text-muted">You must be signed in to access this page.</p>

  

  

    </div>
  );

  return (
    <div className="min-h-screen w-full pr-6 pb-20 text-white">

      {/* HEADER */}
      <div className="flex justify-between items-end mb-8 border-b border-red-500/30 pb-4">
        <div>
          <h1 className="lux-title text-4xl text-red-500">ADMIN CONTROL</h1>
          <p className="lux-subtitle">Restricted Area. Authorized Personnel Only.</p>
        </div>
        <button onClick={handleGrantSelf} className="text-xs text-muted hover:text-white">
          (Dev Only: Grant Me Access)
        </button>
      </div>

      {/* STATS */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="lux-card p-4 border-l-4 border-l-blue-500 bg-blue-900/10">
            <span className="text-xs uppercase text-muted">Total Users</span>
            <div className="text-3xl font-bold">{stats.totalUsers}</div>
          </div>
          <div className="lux-card p-4 border-l-4 border-l-green-500 bg-green-900/10">
            <span className="text-xs uppercase text-muted">Market Listings</span>
            <div className="text-3xl font-bold">{stats.totalListings}</div>
          </div>
          <div className="lux-card p-4 border-l-4 border-l-yellow-500 bg-yellow-900/10">
            <span className="text-xs uppercase text-muted">Books</span>
            <div className="text-3xl font-bold">{stats.totalBooks}</div>
          </div>
          <div className="lux-card p-4 border-l-4 border-l-purple-500 bg-purple-900/10">
            <span className="text-xs uppercase text-muted">Service Ads</span>
            <div className="text-3xl font-bold">{stats.totalAds}</div>
          </div>
        </div>
      )}

      {/* TABS */}
      <div className="flex gap-4 mb-6">
        <button
          onClick={() => setActiveTab('users')}
          className={`px-4 py-2 font-bold rounded ${activeTab === 'users' ? 'bg-red-600 text-white' : 'bg-white/5 text-muted'}`}
        >
          USER DATABASE
        </button>
        <button
          onClick={() => setActiveTab('content')}
          className={`px-4 py-2 font-bold rounded ${activeTab === 'content' ? 'bg-red-600 text-white' : 'bg-white/5 text-muted'}`}
        >
          CONTENT MODERATION
        </button>
        <button
  onClick={() => setActiveTab('approvals')}
  className={`px-4 py-2 font-bold rounded ${activeTab === 'approvals' ? 'bg-yellow-600 text-white' : 'bg-white/5 text-muted'}`}
>
  APPROVALS {pendingItems && Object.values(pendingItems).flat().length > 0 && (
    <span className="ml-2 bg-yellow-500 text-black text-xs rounded-full px-2">
      {Object.values(pendingItems).flat().length}
    </span>
  )}
</button>
<button
  onClick={() => setActiveTab('contacts')}
  className={`px-4 py-2 font-bold rounded ${activeTab === 'contacts' ? 'bg-blue-600 text-white' : 'bg-white/5 text-muted'}`}
>
  CONTACT MSGS {contactMessages.length > 0 && (
    <span className="ml-2 bg-blue-500 text-white text-xs rounded-full px-2">{contactMessages.length}</span>
  )}
</button>
      </div>

      {/* USERS TABLE */}
      {activeTab === 'users' && (
        <div className="lux-card overflow-hidden p-0">
          <table className="w-full text-left">
            <thead className="bg-white/10 text-xs uppercase text-muted">
              <tr>
                <th className="p-4">User / Email</th>
                <th className="p-4">Role</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {users.map(u => (
                <tr key={u.id} className="hover:bg-white/5 transition-colors">
                  <td className="p-4">
                    <div className="font-bold">{u.fullName || 'No Name'}</div>
                    <div className="text-xs text-muted">{u.email}</div>
                    <div className="text-[10px] text-muted font-mono">{u.id}</div>
                  </td>
                  <td className="p-4">
                    <span className={`text-xs px-2 py-1 rounded ${u.role === 'admin' ? 'bg-red-500/20 text-red-400' : 'bg-blue-500/20 text-blue-400'}`}>
                      {u.role || 'student'}
                    </span>
                  </td>
                  <td className="p-4">
                    {u.isBanned ? (
                      <span className="text-red-500 font-bold text-xs uppercase">⛔ BANNED</span>
                    ) : (
                      <span className="text-green-500 font-bold text-xs uppercase">● Active</span>
                    )}
                  </td>
                  <td className="p-4 text-right">
                    <button
                      onClick={() => handleBan(u.id, u.isBanned)}
                      className={`text-xs font-bold px-3 py-1 rounded border ${u.isBanned ? 'border-green-500 text-green-500 hover:bg-green-500 hover:text-black' : 'border-red-500 text-red-500 hover:bg-red-500 hover:text-white'}`}
                    >
                      {u.isBanned ? 'UNBAN' : 'BAN'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {/* APPROVALS PANEL */}
{activeTab === 'approvals' && (
  <div>
    <div className="flex gap-3 mb-6">
      {['listings', 'books', 'lostAndFound', 'serviceRequests'].map(col => (
        <button key={col} onClick={() => setPendingTab(col)}
          className={`px-4 py-2 text-sm font-bold rounded capitalize ${pendingTab === col ? 'bg-yellow-600 text-white' : 'bg-white/5 text-muted'}`}>
          {col} ({(pendingItems[col] || []).length})
        </button>
      ))}
    </div>

    {(pendingItems[pendingTab] || []).length === 0 ? (
      <div className="lux-card p-12 text-center text-muted">
        <div className="text-4xl mb-3">✅</div>
        <p>No pending {pendingTab} waiting for approval.</p>
      </div>
    ) : (
      <div className="space-y-4">
        {(pendingItems[pendingTab] || []).map(item => (
          <div key={item.id} className="lux-card p-6 border border-yellow-500/20 bg-yellow-900/5">
            <div className="flex justify-between items-start gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded uppercase font-bold">Pending</span>
                  <span className="text-xs text-muted font-mono">{item.id}</span>
                </div>
                <h3 className="font-bold text-white text-lg mb-1">
                  {item.title || item.name || item.requestTitle || 'Untitled'}
                </h3>
                <p className="text-sm text-muted mb-2 line-clamp-2">
                  {item.description || item.details || ''}
                </p>
                {item.images && item.images[0] && (
                  <img src={item.images[0]} alt="" className="w-32 h-24 object-cover rounded-lg border border-white/10 mt-2" />
                )}
                <div className="text-xs text-muted mt-2">
                  Posted by: <span className="text-white font-mono">{item.userId || item.posterId || item.clientId || 'unknown'}</span>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <button onClick={() => handleApprove(item._collection, item.id)}
                  className="px-5 py-2 bg-green-600 hover:bg-green-500 text-white font-bold rounded-lg transition-colors">
                  ✅ Approve
                </button>
                <button onClick={() => handleReject(item._collection, item.id)}
                  className="px-5 py-2 bg-red-600 hover:bg-red-500 text-white font-bold rounded-lg transition-colors">
                  ❌ Reject
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    )}
  </div>
)}

{/* CONTACT MESSAGES PANEL */}
{activeTab === 'contacts' && (
  <div className="space-y-4">
    {contactMessages.length === 0 ? (
      <div className="lux-card p-12 text-center text-muted">No contact messages yet.</div>
    ) : (
      contactMessages.map(msg => (
        <div key={msg.id} className="lux-card p-6 border border-blue-500/20">
          <div className="flex justify-between items-start mb-3">
            <div>
              <span className={`text-xs px-2 py-1 rounded uppercase font-bold mr-2 ${
                msg.topic === 'report_user' ? 'bg-red-500/20 text-red-400' :
                msg.topic === 'bug' ? 'bg-yellow-500/20 text-yellow-400' :
                'bg-blue-500/20 text-blue-400'
              }`}>{msg.topic || 'general'}</span>
              <span className="font-bold text-white">{msg.name}</span>
              <span className="text-muted text-sm ml-2">{msg.email}</span>
            </div>
            <span className="text-xs text-muted">
              {msg.createdAt?._seconds ? new Date(msg.createdAt._seconds * 1000).toLocaleString() : 'Just now'}
            </span>
          </div>
          {msg.reportedUrl && <p className="text-xs text-red-400 mb-2">Reported: {msg.reportedUrl}</p>}
          <p className="text-gray-300 text-sm whitespace-pre-line">{msg.message}</p>
        </div>
      ))
    )}
  </div>
)}

      {/* CONTENT MODERATION */}
      {activeTab === 'content' && (
        <div className="lux-card p-12 text-center text-muted border-dashed border-white/10">
          <h3 className="text-xl text-white mb-2">Content Nuke System</h3>
          <p className="mb-4">Search by ID to force-delete any Listing, Book, or Post.</p>
          <div className="mt-4 flex gap-2 justify-center max-w-md mx-auto">
            <input
              id="nuke-collection"
              type="text"
              placeholder="Collection (e.g. listings)"
              className="lux-input flex-1 text-center"
            />
            <input
              id="nuke-id"
              type="text"
              placeholder="Document ID"
              className="lux-input flex-1 text-center"
            />
            <button
              onClick={() => {
                const col = document.getElementById('nuke-collection').value;
                const id = document.getElementById('nuke-id').value;
                if (col && id) handleDeleteItem(col, id);
              }}
              className="lux-btn-primary bg-red-600 hover:bg-red-500 px-4"
            >
              NUKE
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminPage;