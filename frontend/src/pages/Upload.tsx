import React, { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import { 
  UploadCloud, 
  FileText, 
  AlertCircle, 
  CheckCircle, 
  Loader2, 
  ArrowLeft,
  X
} from 'lucide-react';

export const Upload: React.FC = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [status, setStatus] = useState<'idle' | 'uploading' | 'processing' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [docId, setDocId] = useState<string | null>(null);

  // File size validation (15MB limit)
  const MAX_FILE_SIZE = 15 * 1024 * 1024;

  const validateAndSetFile = (selectedFile: File) => {
    setErrorMsg(null);
    if (!selectedFile.name.toLowerCase().endsWith('.pdf')) {
      setErrorMsg('Unsupported file type. Only PDF documents are allowed.');
      return false;
    }
    if (selectedFile.size > MAX_FILE_SIZE) {
      setErrorMsg('File size exceeds the maximum limit of 15MB.');
      return false;
    }
    setFile(selectedFile);
    return true;
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleClear = () => {
    setFile(null);
    setStatus('idle');
    setUploadProgress(0);
    setErrorMsg(null);
  };

  const handleUploadSubmit = async () => {
    if (!file) return;

    setStatus('uploading');
    setUploadProgress(0);
    setErrorMsg(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await api.post('/documents/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          const total = progressEvent.total || file.size;
          const current = progressEvent.loaded;
          const percent = Math.round((current / total) * 100);
          setUploadProgress(percent);
          if (percent >= 100) {
            setStatus('processing');
          }
        },
      });

      setDocId(response.data.id);
      setStatus('success');
      
      // Auto redirect to analysis page after 2 seconds
      setTimeout(() => {
        navigate(`/analysis?document_id=${response.data.id}`);
      }, 2000);

    } catch (err: any) {
      console.error('Upload failed:', err);
      const msg = err.response?.data?.detail || 'Upload failed. The document could not be analyzed.';
      setErrorMsg(msg);
      setStatus('error');
    }
  };

  return (
    <div className="flex-1 p-8 overflow-y-auto max-h-screen">
      {/* Header navigations */}
      <div className="mb-8">
        <Link to="/dashboard" className="inline-flex items-center gap-2 text-xs text-slate-400 hover:text-white mb-4 transition">
          <ArrowLeft size={14} />
          <span>Back to dashboard</span>
        </Link>
        <h1 className="font-outfit font-extrabold text-3xl text-white mb-1">Upload Legal Document</h1>
        <p className="text-sm text-slate-400">Add a contract or PDF agreement to perform AI risk analysis & chunking.</p>
      </div>

      <div className="max-w-2xl mx-auto mt-6">
        {errorMsg && (
          <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex gap-2.5 items-start animate-pulse">
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            <div className="flex-1">{errorMsg}</div>
            <button onClick={() => setErrorMsg(null)} className="text-slate-500 hover:text-slate-200 transition">
              <X size={14} />
            </button>
          </div>
        )}

        {/* Upload Container Box */}
        <div className="glass-card rounded-3xl p-8">
          
          {status === 'idle' && (
            <div 
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-2xl p-12 text-center transition-all cursor-pointer ${
                dragActive 
                  ? 'border-brand-500 bg-brand-600/5' 
                  : 'border-slate-800/80 bg-slate-900/10 hover:bg-slate-900/20 hover:border-slate-700/80'
              }`}
              onClick={triggerFileInput}
            >
              <input 
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="application/pdf"
                className="hidden"
              />
              <div className="w-16 h-16 bg-slate-900 border border-slate-850 rounded-2xl flex items-center justify-center text-slate-400 mx-auto mb-4">
                <UploadCloud size={28} />
              </div>
              <h3 className="font-outfit font-bold text-slate-200 mb-1.5 text-base">Drag & Drop Contract File</h3>
              <p className="text-xs text-slate-500 mb-4 max-w-xs mx-auto">
                Only PDF files are supported. Maximum limit of 15MB.
              </p>
              <button 
                type="button"
                className="bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-semibold px-4 py-2.5 rounded-xl border border-slate-850 transition"
              >
                Choose File from Local
              </button>
            </div>
          )}

          {/* File Selected & Ready */}
          {status === 'idle' && file && (
            <div className="mt-6 p-4 bg-slate-900/50 border border-slate-800/80 rounded-2xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-brand-500/10 p-2.5 rounded-xl text-brand-400">
                  <FileText size={20} />
                </div>
                <div className="text-left overflow-hidden max-w-sm">
                  <p className="font-outfit font-semibold text-sm text-slate-200 truncate">{file.name}</p>
                  <p className="text-xs text-slate-500">{parseFloat((file.size / (1024 * 1024)).toFixed(2))} MB</p>
                </div>
              </div>
              <button 
                onClick={handleClear}
                className="p-1 text-slate-500 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition"
              >
                <X size={16} />
              </button>
            </div>
          )}

          {/* Upload Button */}
          {status === 'idle' && file && (
            <button
              onClick={handleUploadSubmit}
              className="mt-6 w-full bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white font-bold py-3.5 px-4 rounded-xl shadow-lg shadow-brand-500/10 transition"
            >
              Start Analysis & Audit
            </button>
          )}

          {/* Uploading Status Progress bar */}
          {(status === 'uploading' || status === 'processing') && (
            <div className="py-8 text-center max-w-sm mx-auto">
              <div className="w-12 h-12 rounded-2xl bg-brand-600/10 border border-brand-500/20 mx-auto flex items-center justify-center text-brand-400 mb-6 animate-pulse">
                {status === 'uploading' ? <UploadCloud size={20} /> : <Loader2 size={20} className="animate-spin" />}
              </div>
              <h3 className="font-outfit font-bold text-slate-200 mb-1 text-base">
                {status === 'uploading' ? `Uploading payload...` : `Parsing PDF structure...`}
              </h3>
              <p className="text-xs text-slate-500 mb-6 leading-relaxed">
                {status === 'uploading' 
                  ? 'Transmitting file payload to security endpoints.' 
                  : 'Document uploaded successfully! Performing RAG context chunking and AI risk calculations...'}
              </p>
              
              <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-brand-500 to-indigo-500 h-full rounded-full transition-all duration-150"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <span className="text-[10px] font-mono text-slate-500 mt-2 block">{uploadProgress}% complete</span>
            </div>
          )}

          {/* Success screen */}
          {status === 'success' && (
            <div className="py-8 text-center max-w-sm mx-auto">
              <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center mb-6">
                <CheckCircle size={24} />
              </div>
              <h3 className="font-outfit font-bold text-slate-200 mb-1 text-base">Document Ingested!</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Analysis logs compiled. Redirecting to interactive dashboard workspace...
              </p>
            </div>
          )}

          {/* Error fallback options */}
          {status === 'error' && (
            <div className="py-4 text-center">
              <button
                onClick={handleClear}
                className="bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-semibold px-4 py-2.5 rounded-xl border border-slate-800 transition"
              >
                Try Again
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Upload;
