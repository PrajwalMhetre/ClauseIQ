import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { 
  FileText, 
  Trash2, 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  HelpCircle, 
  ArrowRight,
  Plus,
  TrendingUp,
  ShieldAlert,
  Loader2
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';

interface Document {
  id: string;
  filename: string;
  file_size: number;
  status: string;
  created_at: string;
  risk_score?: number;
}

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchDocuments = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const response = await api.get('/documents/list');
      setDocuments(response.data);
    } catch (err) {
      console.error('Error fetching documents:', err);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  // Initial fetch and auto-polling if any document is processing
  useEffect(() => {
    fetchDocuments();
  }, []);

  useEffect(() => {
    // Check if any document is in 'processing' state
    const hasProcessing = documents.some(doc => doc.status === 'processing');
    if (!hasProcessing) return;

    // Set polling check every 3.5 seconds
    const interval = setInterval(() => {
      fetchDocuments(false);
    }, 3500);

    return () => clearInterval(interval);
  }, [documents]);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Avoid row navigation trigger
    if (!confirm('Are you sure you want to permanently delete this document and all its analysis logs?')) return;
    
    setDeletingId(id);
    try {
      await api.delete(`/documents/${id}`);
      setDocuments(prev => prev.filter(doc => doc.id !== id));
    } catch (err) {
      console.error('Error deleting document:', err);
    } finally {
      setDeletingId(null);
    }
  };

  const handleRowClick = (doc: Document) => {
    if (doc.status === 'completed') {
      navigate(`/analysis?document_id=${doc.id}`);
    } else if (doc.status === 'failed') {
      alert('This document analysis failed during processing. Please try re-uploading a valid PDF contract.');
    } else {
      alert('This document is currently being audited. Please wait, it will update automatically.');
    }
  };

  // Format file size
  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  // Aggregate stats
  const totalUploads = documents.length;
  const processingCount = documents.filter(d => d.status === 'processing').length;
  const completedCount = documents.filter(d => d.status === 'completed').length;
  const failedCount = documents.filter(d => d.status === 'failed').length;
  
  // Calculate average risk score
  const completedDocs = documents.filter(d => d.status === 'completed' && d.risk_score !== undefined);
  const avgRiskScore = completedDocs.length > 0
    ? Math.round(completedDocs.reduce((acc, curr) => acc + (curr.risk_score || 0), 0) / completedDocs.length)
    : 0;

  // Chart data 1: Risk distribution
  const highRiskCount = completedDocs.filter(d => (d.risk_score || 0) >= 70).length;
  const medRiskCount = completedDocs.filter(d => (d.risk_score || 0) >= 40 && (d.risk_score || 0) < 70).length;
  const lowRiskCount = completedDocs.filter(d => (d.risk_score || 0) < 40).length;

  const pieData = [
    { name: 'High Risk (Score ≥ 70)', value: highRiskCount, color: '#f43f5e' }, // rose-500
    { name: 'Medium Risk (40-69)', value: medRiskCount, color: '#f59e0b' },   // amber-500
    { name: 'Low Risk (< 40)', value: lowRiskCount, color: '#10b981' }       // emerald-500
  ].filter(item => item.value > 0); // Only display if count > 0

  // Chart data 2: Monthly upload growth trend (mock aggregated from documents dates)
  const areaData = [
    { name: 'Jan', uploads: 1 },
    { name: 'Feb', uploads: 2 },
    { name: 'Mar', uploads: 4 },
    { name: 'Apr', uploads: 3 },
    { name: 'May', uploads: 5 },
    { name: 'Jun', uploads: totalUploads || 6 }
  ];

  return (
    <div className="flex-1 p-8 overflow-y-auto max-h-screen">
      {/* Header banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="font-outfit font-extrabold text-3xl text-white mb-1.5">
            Welcome back, {user?.full_name || 'Legal Analyst'}
          </h1>
          <p className="text-sm text-slate-400">Here is the latest intelligence audit of your legal document directory.</p>
        </div>
        <Link 
          to="/upload" 
          className="bg-brand-600 hover:bg-brand-500 text-white text-sm font-semibold px-5 py-3 rounded-xl shadow-lg shadow-brand-600/15 flex items-center gap-2 border border-brand-500/20 transition duration-150"
        >
          <Plus size={16} />
          <span>Upload Document</span>
        </Link>
      </div>

      {loading ? (
        <div className="py-24 text-center">
          <Loader2 size={40} className="animate-spin text-brand-500 mx-auto mb-4" />
          <p className="text-slate-400 font-medium animate-pulse">Loading workspace analytics...</p>
        </div>
      ) : (
        <>
          {/* Statistics Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="glass-card rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Ingestions</span>
                <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400">
                  <FileText size={16} />
                </div>
              </div>
              <div className="text-3xl font-extrabold text-white">{totalUploads}</div>
              <p className="text-xs text-slate-500 mt-2">Contracts uploaded to RAG</p>
            </div>

            <div className="glass-card rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Avg Risk Score</span>
                <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-brand-400">
                  <ShieldAlert size={16} />
                </div>
              </div>
              <div className={`text-3xl font-extrabold ${avgRiskScore >= 70 ? 'text-rose-500' : avgRiskScore >= 40 ? 'text-amber-500' : 'text-emerald-500'}`}>
                {avgRiskScore > 0 ? `${avgRiskScore}/100` : 'N/A'}
              </div>
              <p className="text-xs text-slate-500 mt-2">System-wide contract average</p>
            </div>

            <div className="glass-card rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Ingestion Queue</span>
                <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-amber-500 animate-pulse">
                  <Clock size={16} />
                </div>
              </div>
              <div className="text-3xl font-extrabold text-white">{processingCount}</div>
              <p className="text-xs text-slate-500 mt-2">Currently being audited by AI</p>
            </div>

            <div className="glass-card rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Successful Audits</span>
                <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-emerald-500">
                  <CheckCircle size={16} />
                </div>
              </div>
              <div className="text-3xl font-extrabold text-white">{completedCount}</div>
              <p className="text-xs text-slate-500 mt-2">Ready for chat & analysis</p>
            </div>
          </div>

          {/* Visual Analytics Block */}
          {totalUploads > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              {/* Trend Chart */}
              <div className="glass-card rounded-2xl p-6 lg:col-span-2">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-outfit font-extrabold text-base text-slate-200">Contract Upload Growth</h3>
                  <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold">
                    <TrendingUp size={14} />
                    <span>+40% MoM</span>
                  </div>
                </div>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={areaData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                      <defs>
                        <linearGradient id="uploadsGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.2}/>
                          <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                      <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} />
                      <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                      <Tooltip 
                        contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: '8px' }}
                        labelStyle={{ color: '#94a3b8', fontSize: '11px', fontWeight: 'bold' }}
                        itemStyle={{ color: '#f8fafc', fontSize: '12px' }}
                      />
                      <Area type="monotone" dataKey="uploads" stroke="#8b5cf6" strokeWidth={2.5} fillOpacity={1} fill="url(#uploadsGrad)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Risk Distribution Chart */}
              <div className="glass-card rounded-2xl p-6 flex flex-col justify-between">
                <h3 className="font-outfit font-extrabold text-base text-slate-200 mb-2">Contract Risk Matrix</h3>
                
                {pieData.length > 0 ? (
                  <>
                    <div className="h-48 flex justify-center items-center">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={pieData}
                            cx="50%"
                            cy="50%"
                            innerRadius={50}
                            outerRadius={70}
                            paddingAngle={5}
                            dataKey="value"
                          >
                            {pieData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip 
                            contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: '8px' }}
                            itemStyle={{ color: '#f8fafc', fontSize: '12px' }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    {/* Manual Legend */}
                    <div className="space-y-2 border-t border-slate-900 pt-4">
                      {pieData.map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2 text-slate-400">
                            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                            <span>{item.name}</span>
                          </div>
                          <span className="font-bold text-slate-200">{item.value} ({Math.round((item.value / completedCount) * 100)}%)</span>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-center text-slate-500 py-6">
                    <AlertTriangle size={24} className="mb-2 text-slate-600" />
                    <span className="text-xs">No audited risk logs compiled. Upload a contract PDF to analyze.</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Recent Documents Table List */}
          <div className="glass-card rounded-2xl overflow-hidden">
            <div className="p-6 border-b border-slate-900 flex justify-between items-center">
              <h3 className="font-outfit font-extrabold text-base text-slate-200">Legal Document Vault</h3>
              <span className="text-xs bg-slate-900 border border-slate-800 text-slate-400 px-2.5 py-1 rounded-md">
                {totalUploads} Total files
              </span>
            </div>

            {documents.length === 0 ? (
              <div className="py-16 text-center">
                <div className="w-16 h-16 rounded-full bg-slate-900 border border-slate-800 mx-auto flex items-center justify-center text-slate-500 mb-4">
                  <FileText size={24} />
                </div>
                <h4 className="font-outfit font-bold text-slate-200 mb-1">Your document vault is empty</h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto mb-6">
                  ClauseIQ parses documents into risk categories. Get started by uploading a contract PDF.
                </p>
                <Link 
                  to="/upload" 
                  className="inline-flex items-center gap-2 bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl border border-brand-500/20 transition duration-150"
                >
                  <Plus size={14} />
                  <span>Upload your first contract</span>
                </Link>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-900 text-xs font-bold text-slate-500 uppercase tracking-widest bg-slate-900/10">
                      <th className="p-4 pl-6">Document Name</th>
                      <th className="p-4">Upload Date</th>
                      <th className="p-4">File Size</th>
                      <th className="p-4">Process Status</th>
                      <th className="p-4">Risk Audit</th>
                      <th className="p-4 pr-6 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {documents.map((doc) => (
                      <tr 
                        key={doc.id}
                        onClick={() => handleRowClick(doc)}
                        className="border-b border-slate-900/60 hover:bg-slate-900/20 transition duration-150 cursor-pointer text-sm"
                      >
                        {/* Filename */}
                        <td className="p-4 pl-6 font-outfit font-semibold text-slate-200 max-w-xs truncate">
                          {doc.filename}
                        </td>
                        
                        {/* Date */}
                        <td className="p-4 text-slate-400">
                          {new Date(doc.created_at).toLocaleDateString(undefined, { 
                            year: 'numeric', 
                            month: 'short', 
                            day: 'numeric' 
                          })}
                        </td>

                        {/* Size */}
                        <td className="p-4 text-slate-400">
                          {formatSize(doc.file_size)}
                        </td>

                        {/* Status Badge */}
                        <td className="p-4">
                          {doc.status === 'processing' && (
                            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-400 bg-amber-400/10 px-2.5 py-1 rounded-full border border-amber-400/20 animate-pulse">
                              <Loader2 size={12} className="animate-spin" />
                              <span>Auditing...</span>
                            </span>
                          )}
                          {doc.status === 'completed' && (
                            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400 bg-emerald-400/10 px-2.5 py-1 rounded-full border border-emerald-400/20">
                              <CheckCircle size={12} />
                              <span>Active</span>
                            </span>
                          )}
                          {doc.status === 'failed' && (
                            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-400 bg-rose-400/10 px-2.5 py-1 rounded-full border border-rose-400/20">
                              <AlertTriangle size={12} />
                              <span>Failed</span>
                            </span>
                          )}
                        </td>

                        {/* Risk Gauge Badge */}
                        <td className="p-4">
                          {doc.status === 'completed' && doc.risk_score !== undefined ? (
                            <div className="flex items-center gap-2">
                              <div className="w-12 bg-slate-900 rounded-full h-1.5 overflow-hidden">
                                <div 
                                  className={`h-full rounded-full ${
                                    doc.risk_score >= 70 ? 'bg-rose-500' : doc.risk_score >= 40 ? 'bg-amber-500' : 'bg-emerald-500'
                                  }`}
                                  style={{ width: `${doc.risk_score}%` }}
                                />
                              </div>
                              <span className={`font-mono text-xs font-bold ${
                                doc.risk_score >= 70 ? 'text-rose-500' : doc.risk_score >= 40 ? 'text-amber-500' : 'text-emerald-500'
                              }`}>
                                {doc.risk_score}/100
                              </span>
                            </div>
                          ) : (
                            <span className="text-xs text-slate-600 font-mono">--</span>
                          )}
                        </td>

                        {/* Actions (Delete button) */}
                        <td className="p-4 pr-6 text-right">
                          <button
                            onClick={(e) => handleDelete(doc.id, e)}
                            disabled={deletingId === doc.id}
                            className="p-2 hover:bg-slate-900 hover:text-rose-400 text-slate-500 rounded-lg transition duration-150 disabled:opacity-50"
                          >
                            {deletingId === doc.id ? (
                              <Loader2 size={16} className="animate-spin text-rose-500" />
                            ) : (
                              <Trash2 size={16} />
                            )}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;
