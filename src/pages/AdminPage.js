/* src/pages/AdminPage.js */
import React, { useState, useEffect } from 'react';
import { functions } from '../firebase';
import { httpsCallable } from 'firebase/functions';

const AdminPage = () => {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview'); // overview, users, content

  // FETCH DATA
  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    setLoading(true);
    try {
        const getStats = httpsCallable(functions, 'getAdminStats');
        const getUsers = httpsCallable(functions, 'getAllUsers');
        
        const [statsRes, usersRes] = await Promise.all([
            getStats(),
            getUsers()
        ]);

        setStats(statsRes.data);
        setUsers(usersRes.data.users);
    } catch (error) {
        console.error("Admin Load Error:", error);
        // Optional: Auto-grant admin for localhost testing
        if (error.message.includes("internal")) {
            alert("Error loading admin data. Check console.");
        }
    } finally {
        setLoading(false);
    }
  };

  // ACTIONS
  const handleBan = async (userId, currentStatus) => {
    if (!window.confirm(`${currentStatus ? 'Unban' : 'Ban'} this user?`)) return;
    try {
        const banFunc = httpsCallable(functions, 'banUser');
        await banFunc({ targetUserId: userId, ban: !currentStatus });
        loadDashboard(); // Refresh
    } catch (e) { alert(e.message); }
  };

// UPDATED: Now prompts for the Secret Key
const handleGrantSelf = async () => {
    const secret = window.prompt("Enter Deployment Secret Key:");
    if (!secret) return;

    try {
        const func = httpsCallable(functions, 'makeMeAdmin');
        // Pass the secret key to the backend
        const result = await func({ secretKey: secret }); 
        
        alert(result.data.message);
        
        // Reload to check if permissions updated
        loadDashboard(); 
    } catch (error) {
        console.error(error);
        alert("Failed: " + error.message);
    }
  };

  if (loading) return <div className="text-white p-10 text-center animate-pulse">Loading Mission Control...</div>;

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

      {/* STATS ROW */}
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
             onClick={() => setActiveTab('content')} // Placeholder for future
             className={`px-4 py-2 font-bold rounded ${activeTab === 'content' ? 'bg-red-600 text-white' : 'bg-white/5 text-muted'}`}
          >
              CONTENT MODERATION
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

      {activeTab === 'content' && (
          <div className="lux-card p-12 text-center text-muted border-dashed border-white/10">
              <h3 className="text-xl text-white mb-2">Content Nuke System</h3>
              <p>Search by ID to force-delete any Listing, Book, or Post.</p>
              {/* Future: Add an input field here to call deleteAnyItem */}
              <div className="mt-4 flex gap-2 justify-center max-w-md mx-auto">
                  <input type="text" placeholder="Paste ID here..." className="lux-input text-center" />
                  <button className="lux-btn-primary bg-red-600 hover:bg-red-500">NUKE</button>
              </div>
          </div>
      )}

    </div>
  );
};

export default AdminPage;