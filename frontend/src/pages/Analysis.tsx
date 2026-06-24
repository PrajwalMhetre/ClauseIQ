import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import { 
  ArrowLeft, 
  MessageSquare, 
  AlertTriangle, 
  CheckCircle, 
  HelpCircle,
  FileText, 
  Sparkles,
  ShieldAlert,
  Wrench,
  Loader2,
  Maximize2
} from 'lucide-react';

interface Clause {
  title: string;
  text: string;
  page: number;
  category: string;
  risk_level: string;
  explanation: string;
  remediation: string;
}

interface KeyRisk {
  clause: string;
  issue: string;
  remediation: string;
}

interface AnalysisData {
  summary: string;
  risk_score: number;
  clauses: Clause[];
  key_risks: {
    high: KeyRisk[];
    medium: KeyRisk[];
    low: KeyRisk[];
  };
}

interface DocumentMetadata {
  id: string;
  filename: string;
  status: string;
}

export const Analysis: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const documentId = searchParams.get('document_id');

  const [docMetadata, setDocMetadata] = useState<DocumentMetadata | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'summary' | 'clauses' | 'risks'>('summary');
  
  // Highlighted clause trigger: matches pages preview on left with right side clicks
  const [highlightedPage, setHighlightedPage] = useState<number | null>(null);
  const [searchText, setSearchText] = useState('');

  useEffect(() => {
    if (!documentId) {
      setError('No document ID specified.');
      setLoading(false);
      return;
    }

    const fetchAnalysisData = async () => {
      try {
        // Fetch metadata
        const metaRes = await api.get(`/documents/${documentId}`);
        setDocMetadata(metaRes.data);

        if (metaRes.data.status !== 'completed') {
          setError('Analysis is still in progress. Please check again in a few moments.');
          setLoading(false);
          return;
        }

        // Fetch analysis details
        const detailsRes = await api.get(`/analysis/details/${documentId}`);
        setAnalysis(detailsRes.data);
      } catch (err: any) {
        console.error('Failed to load analysis:', err);
        setError('Failed to retrieve analysis logs. Please ensure the document exists and is processed.');
      } finally {
        setLoading(false);
      }
    };

    fetchAnalysisData();
  }, [documentId]);

  const handleStartChat = () => {
    if (documentId) {
      navigate(`/chat?document_id=${documentId}`);
    }
  };

  const getRiskLevelColor = (level: string) => {
    switch (level.toLowerCase()) {
      case 'high': return 'text-rose-400 bg-rose-500/10 border-rose-500/20';
      case 'medium': return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
      case 'low': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
      default: return 'text-slate-400 bg-slate-500/10 border-slate-500/20';
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center py-24">
        <Loader2 size={36} className="animate-spin text-brand-500 mb-4" />
        <p className="text-slate-400 text-sm animate-pulse">Running semantic parsing logs...</p>
      </div>
    );
  }

  if (error || !analysis || !docMetadata) {
    return (
      <div className="flex-1 p-8 text-center max-w-md mx-auto py-24">
        <AlertTriangle size={48} className="text-rose-500 mx-auto mb-4" />
        <h3 className="font-outfit font-bold text-slate-200 mb-2">Audit Check Failed</h3>
        <p className="text-xs text-slate-500 mb-6">{error || 'Could not fetch contract details.'}</p>
        <Link to="/dashboard" className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-semibold px-4 py-2.5 rounded-xl border border-slate-850 transition">
          <ArrowLeft size={14} />
          <span>Back to dashboard</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden">
      {/* Title bar */}
      <div className="p-6 border-b border-slate-900 bg-slate-950/40 flex items-center justify-between z-10 shrink-0">
        <div className="flex items-center gap-4">
          <Link to="/dashboard" className="p-2 hover:bg-slate-900 rounded-lg text-slate-400 hover:text-white transition">
            <ArrowLeft size={16} />
          </Link>
          <div>
            <h1 className="font-outfit font-extrabold text-lg text-slate-200">{docMetadata.filename}</h1>
            <p className="text-xs text-slate-500">Legal Risk Audit Dashboard</p>
          </div>
        </div>

        <button
          onClick={handleStartChat}
          className="bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-lg shadow-brand-600/10 flex items-center gap-2 border border-brand-500/20 transition duration-150"
        >
          <MessageSquare size={14} />
          <span>Start AI Chat</span>
        </button>
      </div>

      {/* Pane Layout Container */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Left Pane: Document Text Preview */}
        <div className="w-[45%] border-r border-slate-900 bg-slate-950/60 p-6 flex flex-col overflow-hidden">
          <div className="mb-4 flex items-center justify-between shrink-0">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <FileText size={14} />
              <span>Contract Source Text</span>
            </h3>
            <input 
              type="text"
              placeholder="Search contract text..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="glass-input text-xs px-3 py-1.5 w-44"
            />
          </div>

          <div className="flex-1 overflow-y-auto space-y-6 pr-2">
            {/* Displaying extracted pages dynamically */}
            {analysis.clauses && analysis.clauses.length > 0 ? (
              analysis.clauses.map((clause, idx) => (
                <div 
                  key={idx}
                  onClick={() => setHighlightedPage(clause.page)}
                  className={`p-4 rounded-2xl border transition duration-150 ${
                    highlightedPage === clause.page
                      ? 'bg-brand-950/15 border-brand-500/40 text-slate-100 shadow-sm shadow-brand-500/5'
                      : 'bg-slate-900/10 border-slate-900/60 text-slate-400 hover:border-slate-800'
                  }`}
                >
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[10px] uppercase font-mono tracking-widest font-bold text-slate-500">
                      Page {clause.page} • {clause.category}
                    </span>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setHighlightedPage(clause.page);
                      }}
                      className="text-slate-600 hover:text-slate-400"
                    >
                      <Maximize2 size={12} />
                    </button>
                  </div>
                  <p className="text-xs leading-relaxed font-mono whitespace-pre-line">
                    {searchText ? (
                      // Highlight searched word
                      clause.text.split(new RegExp(`(${searchText})`, 'gi')).map((part, i) => 
                        part.toLowerCase() === searchText.toLowerCase() 
                          ? <mark key={i} className="bg-brand-500/30 text-white px-0.5 rounded">{part}</mark>
                          : part
                      )
                    ) : clause.text}
                  </p>
                </div>
              ))
            ) : (
              <div className="h-full flex items-center justify-center text-center text-slate-600 text-xs">
                No text segments available for visual preview.
              </div>
            )}
          </div>
        </div>

        {/* Right Pane: Audits, Clauses, and Score */}
        <div className="w-[55%] flex flex-col overflow-hidden bg-slate-950/10">
          
          {/* Tab Selector Links */}
          <div className="flex border-b border-slate-900/80 px-6 shrink-0 bg-slate-950/30">
            <button
              onClick={() => setActiveTab('summary')}
              className={`px-4 py-4 text-xs font-bold uppercase tracking-widest border-b-2 transition duration-200 ${
                activeTab === 'summary' 
                  ? 'border-brand-500 text-white' 
                  : 'border-transparent text-slate-500 hover:text-slate-300'
              }`}
            >
              Overview Summary
            </button>
            <button
              onClick={() => setActiveTab('clauses')}
              className={`px-4 py-4 text-xs font-bold uppercase tracking-widest border-b-2 transition duration-200 ${
                activeTab === 'clauses' 
                  ? 'border-brand-500 text-white' 
                  : 'border-transparent text-slate-500 hover:text-slate-300'
              }`}
            >
              Extracted Clauses
            </button>
            <button
              onClick={() => setActiveTab('risks')}
              className={`px-4 py-4 text-xs font-bold uppercase tracking-widest border-b-2 transition duration-200 ${
                activeTab === 'risks' 
                  ? 'border-brand-500 text-white' 
                  : 'border-transparent text-slate-500 hover:text-slate-300'
              }`}
            >
              Risk Matrix ({analysis.clauses.length} items)
            </button>
          </div>

          {/* Right Pane Tab Contents */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            
            {/* TAB: Summary */}
            {activeTab === 'summary' && (
              <div className="space-y-6">
                <div className="glass-card rounded-2xl p-6">
                  <h3 className="font-outfit font-extrabold text-base text-slate-200 mb-4 flex items-center gap-2">
                    <Sparkles size={16} className="text-brand-400" />
                    <span>Executive Summary</span>
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed whitespace-pre-line">
                    {analysis.summary}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="glass-card rounded-xl p-5 border-l-4 border-brand-500">
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Contract Status</h4>
                    <p className="text-sm font-outfit font-extrabold text-slate-200">Active Audit Logs</p>
                  </div>
                  <div className="glass-card rounded-xl p-5 border-l-4 border-indigo-500">
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Scope Category</h4>
                    <p className="text-sm font-outfit font-extrabold text-slate-200">General Commercial NDA</p>
                  </div>
                </div>
              </div>
            )}

            {/* TAB: Clauses List */}
            {activeTab === 'clauses' && (
              <div className="space-y-4">
                {analysis.clauses && analysis.clauses.length > 0 ? (
                  analysis.clauses.map((clause, idx) => (
                    <div 
                      key={idx}
                      className="glass-card rounded-2xl p-6 border-transparent hover:border-slate-800 transition"
                    >
                      <div className="flex flex-wrap justify-between items-start gap-2 mb-3">
                        <div>
                          <h4 className="font-outfit font-bold text-slate-100 text-sm mb-1">{clause.title}</h4>
                          <span className="text-[10px] text-slate-500 uppercase font-mono tracking-wider">
                            Category: {clause.category} • Page {clause.page}
                          </span>
                        </div>
                        <span className={`text-[10px] uppercase font-mono tracking-wider font-extrabold px-3 py-1 rounded-full border ${getRiskLevelColor(clause.risk_level)}`}>
                          {clause.risk_level} Risk
                        </span>
                      </div>
                      
                      <div className="p-3.5 bg-slate-900/40 rounded-xl border border-slate-900/60 mb-4 text-xs text-slate-400 italic">
                        "{clause.text}"
                      </div>
                      
                      <div className="space-y-2 border-t border-slate-900 pt-3 text-xs">
                        <p className="text-slate-400 leading-relaxed">
                          <span className="font-bold text-slate-300">Issue:</span> {clause.explanation}
                        </p>
                        <p className="text-slate-400 leading-relaxed flex gap-2 items-start">
                          <Wrench size={14} className="text-brand-400 shrink-0 mt-0.5" />
                          <span>
                            <span className="font-bold text-brand-300">Action:</span> {clause.remediation}
                          </span>
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12 text-slate-500 text-xs">
                    No individual clauses extracted.
                  </div>
                )}
              </div>
            )}

            {/* TAB: Risk Guage & Matrix */}
            {activeTab === 'risks' && (
              <div className="space-y-6">
                
                {/* Risk Score details card */}
                <div className="glass-card rounded-2xl p-6 flex flex-col sm:flex-row items-center gap-6">
                  {/* Styled Radial score */}
                  <div className="relative w-32 h-32 flex items-center justify-center shrink-0">
                    <svg className="w-full h-full transform -rotate-95" viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="40" stroke="#1e293b" strokeWidth="6" fill="transparent" />
                      <circle 
                        cx="50" 
                        cy="50" 
                        r="40" 
                        stroke={analysis.risk_score >= 70 ? '#f43f5e' : analysis.risk_score >= 40 ? '#f59e0b' : '#10b981'} 
                        strokeWidth="8" 
                        fill="transparent" 
                        strokeDasharray="251.2"
                        strokeDashoffset={251.2 - (251.2 * analysis.risk_score) / 100}
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute flex flex-col items-center">
                      <span className="text-3xl font-extrabold text-white">{analysis.risk_score}</span>
                      <span className="text-[9px] text-slate-500 uppercase tracking-widest font-bold">Risk Score</span>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-outfit font-extrabold text-base text-slate-200 mb-1.5">
                      {analysis.risk_score >= 70 ? 'High Liability Exposure' : analysis.risk_score >= 40 ? 'Moderate Exposure' : 'Low Exposure'}
                    </h3>
                    <p className="text-xs text-slate-450 leading-relaxed mb-4">
                      This contract scores {analysis.risk_score}/100. It presents{' '}
                      {analysis.risk_score >= 70 ? 'significant challenges that require amendments.' : analysis.risk_score >= 40 ? 'general issues that should be addressed before approval.' : 'standard low-exposure terms.'}
                    </p>
                    
                    <div className="flex gap-2">
                      <span className="text-[10px] font-mono font-bold bg-rose-500/15 border border-rose-500/20 text-rose-400 px-2.5 py-1 rounded-md">
                        {analysis.key_risks.high?.length || 0} High
                      </span>
                      <span className="text-[10px] font-mono font-bold bg-amber-500/15 border border-amber-500/20 text-amber-400 px-2.5 py-1 rounded-md">
                        {analysis.key_risks.medium?.length || 0} Medium
                      </span>
                      <span className="text-[10px] font-mono font-bold bg-emerald-500/15 border border-emerald-500/20 text-emerald-400 px-2.5 py-1 rounded-md">
                        {analysis.key_risks.low?.length || 0} Low
                      </span>
                    </div>
                  </div>
                </div>

                {/* Priority Risks & Action Plans */}
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Priority Remediation Plan</h4>
                  
                  {/* High Risks */}
                  {analysis.key_risks.high && analysis.key_risks.high.map((risk, idx) => (
                    <div key={`high-${idx}`} className="p-5 rounded-2xl border border-rose-500/20 bg-rose-500/5 text-xs">
                      <div className="flex items-center gap-2 text-rose-400 font-bold mb-2">
                        <ShieldAlert size={14} />
                        <span>High Risk: {risk.clause}</span>
                      </div>
                      <p className="text-slate-350 leading-relaxed mb-3"><span className="font-bold text-slate-300">Issue:</span> {risk.issue}</p>
                      <p className="text-slate-350 leading-relaxed flex gap-2 items-start"><Wrench size={14} className="text-rose-400 shrink-0 mt-0.5" /><span><span className="font-bold text-rose-300">Action:</span> {risk.remediation}</span></p>
                    </div>
                  ))}

                  {/* Medium Risks if no High risks */}
                  {(!analysis.key_risks.high || analysis.key_risks.high.length === 0) && analysis.key_risks.medium && analysis.key_risks.medium.map((risk, idx) => (
                    <div key={`med-${idx}`} className="p-5 rounded-2xl border border-amber-500/20 bg-amber-500/5 text-xs">
                      <div className="flex items-center gap-2 text-amber-400 font-bold mb-2">
                        <ShieldAlert size={14} />
                        <span>Medium Risk: {risk.clause}</span>
                      </div>
                      <p className="text-slate-350 leading-relaxed mb-3"><span className="font-bold text-slate-300">Issue:</span> {risk.issue}</p>
                      <p className="text-slate-350 leading-relaxed flex gap-2 items-start"><Wrench size={14} className="text-amber-400 shrink-0 mt-0.5" /><span><span className="font-bold text-amber-300">Action:</span> {risk.remediation}</span></p>
                    </div>
                  ))}
                </div>

              </div>
            )}

          </div>
        </div>

      </div>
    </div>
  );
};

export default Analysis;
