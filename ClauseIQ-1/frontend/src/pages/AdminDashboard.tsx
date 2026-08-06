import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { 
  Users, 
  FileText, 
  Database, 
  ShieldCheck, 
  Loader2, 
  AlertTriangle,
  HardDrive
} from 'lucide-react';

interface AdminUser {
  id: number;
  email: string;
  full_name: string;
  is_active: boolean;
  is_admin: boolean;
  created_at: string;
}

interface AdminDocument {
  id: string;
  filename: string;
  file_size: number;
  status: string;
  user_email: string;
  created_at: string;
}

interface AdminAnalytics {
  total_users: number;
  total_documents: number;
  total_storage_bytes: number;
  status_distribution: Record<string, number>;
  risk_distribution: Record<string, number>;
}

export const AdminDashboard: React.FC = () => {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [documents, setDocuments] = useState<AdminDocument[]>([]);
  const [analytics, setAnalytics] = useState<AdminAnalytics | null>(null);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeSubTab, setActiveSubTab] = useState<'users' | 'documents'>('users');

  const fetchAdminData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [usersRes, docsRes, analyticsRes] = await Promise.all([
        api.get('/admin/users'),
        api.get('/admin/documents'),
        api.get('/admin/analytics')
      ]);
      
      setUsers(usersRes.data);
      setDocuments(docsRes.data);
      setAnalytics(analyticsRes.data);
    } catch (err: any) {
      console.error('Error fetching admin details:', err);
      setError('Access forbidden or database connection failed. Administrator credentials required.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const formatStorage = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center py-24">
        <Loader2 size={36} className="animate-spin text-brand-500 mb-4" />
        <p className="text-slate-400 text-sm animate-pulse">Querying administrative logs...</p>
      </div>
    );
  }

  if (error || !analytics) {
    return (
      <div className="flex-1 p-8 text-center max-w-md mx-auto py-24">
        <AlertTriangle size={48} className="text-rose-500 mx-auto mb-4" />
        <h3 className="font-outfit font-bold text-slate-200 mb-2">Access Denied</h3>
        <p className="text-xs text-slate-500 mb-6">{error || 'Administrative privileges required.'}</p>
      </div>
    );
  }

  return (
    <div className="flex-1 p-8 overflow-y-auto max-h-screen">
      {/* Title */}
      <div className="mb-8">
        <h1 className="font-outfit font-extrabold text-3xl text-white mb-1.5 flex items-center gap-3">
          <ShieldCheck className="text-brand-500" size={30} />
          <span>System Administration</span>
        </h1>
        <p className="text-sm text-slate-400">ClauseIQ platform usage, user directory oversight, and database logs.</p>
      </div>

      {/* Aggregate metrics grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="glass-card rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Accounts</span>
            <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-brand-400">
              <Users size={16} />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-white">{analytics.total_users}</div>
          <p className="text-xs text-slate-500 mt-2">Registered user accounts</p>
        </div>

        <div className="glass-card rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total File Ingestions</span>
            <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-indigo-400">
              <FileText size={16} />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-white">{analytics.total_documents}</div>
          <p className="text-xs text-slate-500 mt-2">Contracts uploaded system-wide</p>
        </div>

        <div className="glass-card rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Storage Consumed</span>
            <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-emerald-400">
              <HardDrive size={16} />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-white">{formatStorage(analytics.total_storage_bytes)}</div>
          <p className="text-xs text-slate-500 mt-2">Total directory size on disk</p>
        </div>
      </div>

      {/* Subtab selection */}
      <div className="flex border-b border-slate-900/80 mb-6 bg-slate-950/20 rounded-t-2xl">
        <button
          onClick={() => setActiveSubTab('users')}
          className={`px-6 py-4 text-xs font-bold uppercase tracking-widest border-b-2 transition duration-200 ${
            activeSubTab === 'users' 
              ? 'border-brand-500 text-white' 
              : 'border-transparent text-slate-500 hover:text-slate-300'
          }`}
        >
          User Accounts Directory ({users.length})
        </button>
        <button
          onClick={() => setActiveSubTab('documents')}
          className={`px-6 py-4 text-xs font-bold uppercase tracking-widest border-b-2 transition duration-200 ${
            activeSubTab === 'documents' 
              ? 'border-brand-500 text-white' 
              : 'border-transparent text-slate-500 hover:text-slate-300'
          }`}
        >
          Document Audit Trail ({documents.length})
        </button>
      </div>

      {/* Contents Display tables */}
      <div className="glass-card rounded-2xl overflow-hidden">
        {activeSubTab === 'users' ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-900 text-xs font-bold text-slate-500 uppercase tracking-widest bg-slate-900/10">
                  <th className="p-4 pl-6">User ID</th>
                  <th className="p-4">Full Name</th>
                  <th className="p-4">Email</th>
                  <th className="p-4">System Role</th>
                  <th className="p-4">Account Status</th>
                  <th className="p-4 pr-6">Created At</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id} className="border-b border-slate-900/60 text-sm text-slate-300 hover:bg-slate-900/10">
                    <td className="p-4 pl-6 font-mono text-slate-500">{u.id}</td>
                    <td className="p-4 font-outfit font-semibold text-slate-200">{u.full_name}</td>
                    <td className="p-4 text-slate-400">{u.email}</td>
                    <td className="p-4">
                      {u.is_admin ? (
                        <span className="text-[10px] uppercase font-mono font-bold text-brand-400 bg-brand-500/10 px-2 py-0.5 rounded border border-brand-500/20">
                          Administrator
                        </span>
                      ) : (
                        <span className="text-[10px] uppercase font-mono font-bold text-slate-500 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                          General User
                        </span>
                      )}
                    </td>
                    <td className="p-4">
                      {u.is_active ? (
                        <span className="text-emerald-400 font-medium">Active</span>
                      ) : (
                        <span className="text-slate-600">Suspended</span>
                      )}
                    </td>
                    <td className="p-4 pr-6 text-slate-500">
                      {new Date(u.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-900 text-xs font-bold text-slate-500 uppercase tracking-widest bg-slate-900/10">
                  <th className="p-4 pl-6">Ingestion ID</th>
                  <th className="p-4">Filename</th>
                  <th className="p-4">Owner Email</th>
                  <th className="p-4">File Size</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 pr-6">Upload Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {documents.map(d => (
                  <tr key={d.id} className="border-b border-slate-900/60 text-sm text-slate-300 hover:bg-slate-900/10">
                    <td className="p-4 pl-6 font-mono text-slate-500 max-w-[120px] truncate">{d.id}</td>
                    <td className="p-4 font-outfit font-semibold text-slate-200 max-w-[200px] truncate">{d.filename}</td>
                    <td className="p-4 text-slate-400">{d.user_email}</td>
                    <td className="p-4 text-slate-400">{formatStorage(d.file_size)}</td>
                    <td className="p-4">
                      {d.status === 'completed' && <span className="text-emerald-400 font-medium">Index Complete</span>}
                      {d.status === 'processing' && <span className="text-amber-400 font-medium animate-pulse">Running Ingestion</span>}
                      {d.status === 'failed' && <span className="text-rose-400 font-medium">Failed</span>}
                    </td>
                    <td className="p-4 pr-6 text-slate-500">
                      {new Date(d.created_at).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
