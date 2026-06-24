import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import api from '../services/api';
import { 
  MessageSquare, 
  Send, 
  BookOpen, 
  HelpCircle, 
  AlertCircle, 
  Loader2,
  FileText,
  FileQuestion,
  Info
} from 'lucide-react';

interface Document {
  id: string;
  filename: string;
  status: string;
}

interface SourceCitation {
  page: number;
  text: string;
}

interface Message {
  sender: 'user' | 'ai';
  text: string;
  created_at: Date;
  sources?: SourceCitation[];
}

export const Chat: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const documentId = searchParams.get('document_id');

  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedDocId, setSelectedDocId] = useState<string>('');
  const [chatHistory, setChatHistory] = useState<Message[]>([]);
  const [inputMsg, setInputMsg] = useState('');
  
  const [loadingDocs, setLoadingDocs] = useState(true);
  const [sendingMsg, setSendingMsg] = useState(false);
  const [activeTooltip, setActiveTooltip] = useState<number | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const quickPrompts = [
    "Summarize this document",
    "What is the limitation of liability cap?",
    "Identify termination notice periods",
    "Is there a unilateral indemnification?"
  ];

  // Auto Scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatHistory, sendingMsg]);

  // Load all documents in user list
  const loadDocumentsList = async () => {
    try {
      const response = await api.get('/documents/list');
      const completed = response.data.filter((d: Document) => d.status === 'completed');
      setDocuments(completed);
      
      if (documentId) {
        setSelectedDocId(documentId);
      } else if (completed.length > 0) {
        setSelectedDocId(completed[0].id);
        setSearchParams({ document_id: completed[0].id });
      }
    } catch (err) {
      console.error('Error listing documents:', err);
    } finally {
      setLoadingDocs(false);
    }
  };

  // Load chat logs when selectedDocId changes
  const loadChatLogs = async (docId: string) => {
    if (!docId) return;
    try {
      const response = await api.get(`/chat/history/${docId}`);
      const messages: Message[] = [];
      response.data.forEach((chat: any) => {
        messages.push({
          sender: 'user',
          text: chat.question,
          created_at: new Date(chat.created_at)
        });
        messages.push({
          sender: 'ai',
          text: chat.answer,
          created_at: new Date(chat.created_at),
          sources: chat.sources || []
        });
      });
      setChatHistory(messages);
    } catch (err) {
      console.error('Error fetching chat history:', err);
    }
  };

  useEffect(() => {
    loadDocumentsList();
  }, [documentId]);

  useEffect(() => {
    if (selectedDocId) {
      loadChatLogs(selectedDocId);
    }
  }, [selectedDocId]);

  const handleDocChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setSelectedDocId(val);
    setSearchParams({ document_id: val });
  };

  const handleSendMessage = async (text: string) => {
    if (!text.trim() || !selectedDocId || sendingMsg) return;

    setInputMsg('');
    const userMsg: Message = {
      sender: 'user',
      text: text,
      created_at: new Date()
    };
    setChatHistory(prev => [...prev, userMsg]);
    setSendingMsg(true);

    try {
      const response = await api.post('/chat/query', {
        document_id: selectedDocId,
        question: text
      });

      const aiMsg: Message = {
        sender: 'ai',
        text: response.data.answer,
        created_at: new Date(),
        sources: response.data.sources || []
      };
      setChatHistory(prev => [...prev, aiMsg]);
    } catch (err) {
      console.error('Error querying chat endpoint:', err);
      const errMsg: Message = {
        sender: 'ai',
        text: 'An error occurred during chat reasoning. Please verify the backend is connected.',
        created_at: new Date()
      };
      setChatHistory(prev => [...prev, errMsg]);
    } finally {
      setSendingMsg(false);
    }
  };

  const activeDocName = documents.find(d => d.id === selectedDocId)?.filename || 'document';

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden bg-slate-950/10">
      
      {/* Selection Header */}
      <div className="p-6 border-b border-slate-900 bg-slate-950/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shrink-0 z-10">
        <div>
          <h1 className="font-outfit font-extrabold text-lg text-slate-200">Interactive Legal Companion</h1>
          <p className="text-xs text-slate-500">Converse and query specific clauses with your documents</p>
        </div>

        {/* Dropdown switch */}
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-widest block shrink-0">Current Document:</span>
          {loadingDocs ? (
            <Loader2 size={16} className="animate-spin text-slate-600" />
          ) : documents.length > 0 ? (
            <select
              value={selectedDocId}
              onChange={handleDocChange}
              className="glass-input text-xs px-3 py-2 w-64 block font-outfit"
            >
              {documents.map(d => (
                <option key={d.id} value={d.id} className="bg-slate-950 text-slate-200">
                  {d.filename}
                </option>
              ))}
            </select>
          ) : (
            <span className="text-xs text-slate-600">No active contracts found</span>
          )}
        </div>
      </div>

      {/* Main chat viewport */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        
        {documents.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center max-w-sm mx-auto">
            <FileQuestion size={48} className="text-slate-700 mb-4 animate-bounce" />
            <h3 className="font-outfit font-bold text-slate-200 mb-1">No contracts indexed</h3>
            <p className="text-xs text-slate-500 mb-6">
              You must upload and process at least one contract PDF before starting an interactive Q&A session.
            </p>
            <Link 
              to="/upload" 
              className="bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition shadow-lg shadow-brand-500/10"
            >
              Upload PDF Contract
            </Link>
          </div>
        ) : chatHistory.length === 0 && !sendingMsg ? (
          /* Welcome screen */
          <div className="h-full flex flex-col items-center justify-center text-center max-w-md mx-auto">
            <div className="w-12 h-12 bg-brand-600/10 border border-brand-500/20 text-brand-400 rounded-xl flex items-center justify-center mb-6">
              <MessageSquare size={22} />
            </div>
            <h3 className="font-outfit font-extrabold text-base text-slate-200 mb-2">
              Auditing "{activeDocName}"
            </h3>
            <p className="text-xs text-slate-550 leading-relaxed mb-8">
              Ask questions about clauses, liability exclusions, governing laws, or select a predefined query below to start:
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
              {quickPrompts.map((prompt, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(prompt)}
                  className="p-3 text-xs text-slate-400 hover:text-slate-200 bg-slate-900/30 border border-slate-900 hover:border-slate-800 rounded-xl text-left transition duration-150"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        ) : (
          /* Message dialogue history */
          <div className="max-w-3xl mx-auto space-y-6">
            {chatHistory.map((msg, index) => (
              <div 
                key={index} 
                className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div 
                  className={`max-w-[85%] rounded-2xl p-4 text-sm leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-brand-600/90 text-white font-medium shadow-md shadow-brand-500/10'
                      : 'glass-card text-slate-300'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.text}</p>
                  
                  {/* Citations references */}
                  {msg.sender === 'ai' && msg.sources && msg.sources.length > 0 && (
                    <div className="mt-3.5 border-t border-slate-900/80 pt-3 flex flex-wrap gap-2 items-center">
                      <span className="text-[10px] uppercase font-mono tracking-wider font-extrabold text-slate-500 flex items-center gap-1.5 mr-1">
                        <BookOpen size={12} />
                        <span>Sources:</span>
                      </span>
                      {msg.sources.map((citation, citIdx) => {
                        const tooltipId = index * 100 + citIdx;
                        const isTooltipOpen = activeTooltip === tooltipId;
                        return (
                          <div key={citIdx} className="relative">
                            <button
                              onMouseEnter={() => setActiveTooltip(tooltipId)}
                              onMouseLeave={() => setActiveTooltip(null)}
                              onClick={() => setActiveTooltip(isTooltipOpen ? null : tooltipId)}
                              className="text-[10px] font-mono font-bold bg-brand-950/20 hover:bg-brand-500/10 border border-brand-500/30 hover:border-brand-500/60 text-brand-400 px-2 py-0.5 rounded transition"
                            >
                              Page {citation.page}
                            </button>
                            {/* Hover Source Tooltip */}
                            {isTooltipOpen && (
                              <div className="absolute bottom-full left-0 mb-2 w-72 glass-card rounded-xl p-3 shadow-xl z-50 text-left">
                                <div className="flex items-center gap-1.5 text-brand-400 text-[10px] font-bold uppercase tracking-wider mb-1.5 border-b border-slate-800 pb-1">
                                  <Info size={10} />
                                  <span>Exercept Reference (Page {citation.page})</span>
                                </div>
                                <p className="text-[11px] text-slate-400 italic leading-normal font-mono">
                                  "{citation.text}"
                                </p>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
                <span className="text-[9px] text-slate-650 mt-1 font-mono">
                  {msg.created_at.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}

            {/* Ingestion typing indicator */}
            {sendingMsg && (
              <div className="flex flex-col items-start">
                <div className="glass-card rounded-2xl p-4 flex items-center gap-3">
                  <Loader2 size={16} className="animate-spin text-brand-500" />
                  <span className="text-xs text-slate-500 animate-pulse font-medium">Formulating legal response...</span>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input Tray footer */}
      {documents.length > 0 && (
        <div className="p-6 border-t border-slate-900 bg-slate-950/40 shrink-0">
          <div className="max-w-3xl mx-auto">
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage(inputMsg);
              }}
              className="flex gap-3"
            >
              <input
                type="text"
                value={inputMsg}
                onChange={(e) => setInputMsg(e.target.value)}
                placeholder={`Ask a question about "${activeDocName}"...`}
                disabled={sendingMsg}
                className="glass-input flex-1 px-4 py-3.5 text-sm"
              />
              <button
                type="submit"
                disabled={!inputMsg.trim() || sendingMsg}
                className="bg-brand-600 hover:bg-brand-500 text-white p-3.5 rounded-xl shadow-lg shadow-brand-500/10 flex items-center justify-center transition duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send size={18} />
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Chat;
