import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Scale, 
  ShieldCheck, 
  MessageSquare, 
  Cpu, 
  Sparkles, 
  ArrowRight, 
  Check, 
  HelpCircle,
  Clock,
  Coins,
  ChevronDown,
  UploadCloud
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const [isAnnual, setIsAnnual] = useState(false);
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [demoState, setDemoState] = useState<'idle' | 'uploading' | 'completed'>('idle');
  const [demoProgress, setDemoProgress] = useState(0);

  const startDemoSimulation = () => {
    setDemoState('uploading');
    setDemoProgress(0);
    const interval = setInterval(() => {
      setDemoProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setDemoState('completed');
          return 100;
        }
        return prev + 10;
      });
    }, 150);
  };

  const resetDemo = () => {
    setDemoState('idle');
    setDemoProgress(0);
  };

  const features = [
    {
      title: 'Contract Summarization',
      desc: 'Get a comprehensive executive summary highlighting critical dates, parties, and deal structure in seconds.',
      icon: Sparkles,
      color: 'from-violet-500 to-fuchsia-500'
    },
    {
      title: 'Clause Extraction',
      desc: 'Automatically isolate, parse, and catalog standard clauses including Indemnity, Liability caps, and Termination terms.',
      icon: Scale,
      color: 'from-blue-500 to-cyan-500'
    },
    {
      title: 'Risk Level Scoring',
      desc: 'Obtain an instant liability score from 0 to 100 and identify unfavorable provisions before signing.',
      icon: ShieldCheck,
      color: 'from-rose-500 to-orange-500'
    },
    {
      title: 'Contextual AI Chat',
      desc: 'Ask complex questions and converse directly with your legal documents using source-referenced Q&A responses.',
      icon: MessageSquare,
      color: 'from-emerald-500 to-teal-500'
    }
  ];

  const faqs = [
    {
      q: 'How does the ClauseIQ AI legal document analysis work?',
      a: 'ClauseIQ uses advanced Retrieval-Augmented Generation (RAG) and specialized large language models to ingest your PDF files, extract text streams, catalog crucial clauses, assess liability issues, and generate precise summaries.'
    },
    {
      q: 'Can I use ClauseIQ for free?',
      a: 'Yes, the Starter tier is 100% free for up to 3 document uploads per month. For larger volumes, compliance audit features, and deeper analysis logs, we offer premium Pro plans.'
    },
    {
      q: 'How secure are my uploaded legal files and documents?',
      a: 'Data privacy is our priority. All contract uploads are encrypted in transit and at rest. Your files are isolated and are never used to train public AI models.'
    },
    {
      q: 'Does ClauseIQ replace real legal counsel?',
      a: 'No, ClauseIQ is an AI intelligence tool meant to speed up contract reviews, audit risks, and outline key parameters. It serves as an assistant, not a licensed legal counsel.'
    }
  ];

  return (
    <div className="min-h-screen bg-slate-950 bg-grid-pattern relative">
      {/* Decorative Blur Ambient Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-brand-500/10 rounded-full blur-[120px] animate-glow-fade pointer-events-none" />
      <div className="absolute bottom-[20%] right-[-10%] w-[45%] h-[45%] bg-indigo-500/10 rounded-full blur-[130px] animate-glow-fade pointer-events-none" />

      {/* Header / Navbar */}
      <header className="sticky top-0 z-40 bg-slate-950/75 backdrop-blur-md border-b border-slate-800/60 transition duration-150">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-tr from-brand-600 to-indigo-500 p-2.5 rounded-xl shadow-lg shadow-brand-500/20">
              <Scale size={20} className="text-white" />
            </div>
            <span className="font-outfit font-extrabold text-xl tracking-tight text-white">
              Clause<span className="text-brand-500">IQ</span>
            </span>
          </div>

          <div className="flex items-center gap-4">
            <Link to="/login" className="text-sm font-semibold text-slate-300 hover:text-white transition px-4 py-2">
              Log In
            </Link>
            <Link 
              to="/register" 
              className="bg-brand-600 hover:bg-brand-500 text-white text-sm font-semibold px-5 py-2.5 rounded-xl shadow-lg shadow-brand-600/15 border border-brand-500/30 transition duration-200"
            >
              Sign Up Free
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-6 pt-20 pb-16 text-center">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-300 text-xs font-semibold mb-6">
            <Sparkles size={12} />
            <span>Next-Generation Legal Intelligence</span>
          </div>
          
          <h1 className="font-outfit text-5xl md:text-7xl font-extrabold tracking-tight text-white mb-6 max-w-4xl mx-auto leading-[1.1]">
            Legal Document Audits, <br />
            <span className="bg-gradient-to-r from-brand-400 via-indigo-300 to-cyan-300 bg-clip-text text-transparent">
              Reimagined with AI
            </span>
          </h1>

          <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed font-outfit">
            Upload contracts, extract critical clauses, identify hidden liability risks, and chat with your legal documents using enterprise-grade RAG technology.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <Link 
              to="/register" 
              className="w-full sm:w-auto bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white font-bold px-8 py-4 rounded-2xl shadow-xl shadow-brand-500/20 flex items-center justify-center gap-2 group transition duration-200"
            >
              <span>Get Started For Free</span>
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </Link>
            <a 
              href="#demo" 
              className="w-full sm:w-auto bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800/80 font-bold px-8 py-4 rounded-2xl transition duration-150"
            >
              Watch Demo
            </a>
          </div>
        </motion.div>
      </section>

      {/* Interactive Demo Sandbox Simulator */}
      <section id="demo" className="max-w-5xl mx-auto px-6 pb-24">
        <motion.div 
          className="glass-card rounded-3xl p-1.5 relative overflow-hidden"
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          {/* Inner window header */}
          <div className="bg-slate-950/70 rounded-2xl border border-slate-800/50 p-6">
            <div className="flex items-center justify-between border-b border-slate-900 pb-4 mb-6">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-rose-500/80" />
                <span className="w-3 h-3 rounded-full bg-amber-500/80" />
                <span className="w-3 h-3 rounded-full bg-emerald-500/80" />
                <span className="text-xs text-slate-600 font-medium ml-2 font-mono">clauseiq-sandbox-simulator</span>
              </div>
              <div className="bg-slate-900/60 px-3 py-1 rounded-md text-[11px] text-slate-500 font-mono">
                STATUS: {demoState.toUpperCase()}
              </div>
            </div>

            {demoState === 'idle' && (
              <div className="py-16 text-center">
                <div className="w-20 h-20 rounded-2xl bg-brand-500/10 border border-brand-500/20 border-dashed mx-auto flex items-center justify-center text-brand-400 mb-6 animate-pulse">
                  <UploadCloud size={32} />
                </div>
                <h3 className="font-outfit font-bold text-lg text-slate-200 mb-2">Simulate Contract Upload</h3>
                <p className="text-sm text-slate-500 max-w-sm mx-auto mb-6">
                  Experience how ClauseIQ handles PDF formatting, OCR checks, and neural parsing in real time.
                </p>
                <button
                  onClick={startDemoSimulation}
                  className="bg-brand-600 hover:bg-brand-500 text-white font-bold px-6 py-3 rounded-xl transition duration-150"
                >
                  Analyze Sample NDA.pdf
                </button>
              </div>
            )}

            {demoState === 'uploading' && (
              <div className="py-20 text-center max-w-md mx-auto">
                <p className="text-sm text-slate-400 font-semibold mb-4 animate-pulse">
                  {demoProgress < 40 && "Ingesting contract payload..."}
                  {demoProgress >= 40 && demoProgress < 85 && "Extracting document pages & stream OCR..."}
                  {demoProgress >= 85 && "Running neural risk assessment & scoring..."}
                </p>
                <div className="w-full bg-slate-900 rounded-full h-2.5 overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-brand-500 to-indigo-500 h-full rounded-full transition-all duration-150"
                    style={{ width: `${demoProgress}%` }}
                  />
                </div>
                <span className="text-xs text-slate-500 mt-2 block">{demoProgress}% complete</span>
              </div>
            )}

            {demoState === 'completed' && (
              <motion.div 
                className="grid grid-cols-1 md:grid-cols-3 gap-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                {/* Left side stats and summary */}
                <div className="md:col-span-1 border-r border-slate-900 pr-6 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 text-rose-400 mb-3">
                      <ShieldCheck size={18} />
                      <span className="font-bold text-xs uppercase tracking-wider">Analysis Result</span>
                    </div>
                    <h4 className="font-outfit font-extrabold text-slate-200 text-lg mb-4">Sample NDA.pdf</h4>
                    
                    {/* Risk Score meter */}
                    <div className="bg-slate-900/60 border border-slate-800/80 p-4 rounded-2xl text-center mb-6">
                      <div className="text-3xl font-extrabold text-rose-500">78</div>
                      <div className="text-[11px] text-rose-400/80 font-bold uppercase mt-1">High Risk Exposure</div>
                      <div className="text-xs text-slate-500 mt-2">Uncapped liabilities & unilateral indemnification detected.</div>
                    </div>
                  </div>

                  <button
                    onClick={resetDemo}
                    className="text-xs text-slate-500 hover:text-brand-400 underline text-left mt-4"
                  >
                    ← Simulate another file
                  </button>
                </div>

                {/* Right side clauses list */}
                <div className="md:col-span-2 space-y-4">
                  <h5 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Extracted Clauses</h5>
                  
                  {/* Clause Card 1 */}
                  <div className="p-4 rounded-xl border border-rose-500/20 bg-rose-500/5">
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-xs font-extrabold text-rose-400 font-outfit px-2 py-0.5 bg-rose-500/10 rounded-md">Indemnification</span>
                      <span className="text-xs text-slate-500">Page 2</span>
                    </div>
                    <p className="text-xs text-slate-300 italic mb-2">"...Client agrees to indemnify and hold harmless Provider against all claims without limit..."</p>
                    <p className="text-[11px] text-rose-300">⚠️ Risk: Unilateral clause, leaves client with infinite uncapped liability exposure.</p>
                  </div>

                  {/* Clause Card 2 */}
                  <div className="p-4 rounded-xl border border-amber-500/20 bg-amber-500/5">
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-xs font-extrabold text-amber-400 font-outfit px-2 py-0.5 bg-amber-500/10 rounded-md">Limitation of Liability</span>
                      <span className="text-xs text-slate-500">Page 2</span>
                    </div>
                    <p className="text-xs text-slate-300 italic mb-2">"...liability cap is excluded for breaches of confidentiality terms..."</p>
                    <p className="text-[11px] text-amber-300">⚠️ Risk: Missing aggregate monetary limit cap, exposing uncapped damages.</p>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>
      </section>

      {/* Features Grid */}
      <section className="max-w-7xl mx-auto px-6 py-20 border-t border-slate-900">
        <h2 className="font-outfit text-3xl md:text-5xl font-extrabold text-center text-white mb-16">
          Powerful Contract Audit Toolkit
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feat, index) => (
            <motion.div 
              key={index}
              className="glass-card glass-card-hover rounded-2xl p-6 flex flex-col items-start"
              whileHover={{ y: -5 }}
            >
              <div className={`bg-gradient-to-tr ${feat.color} p-3 rounded-xl mb-6 text-white shadow-lg`}>
                <feat.icon size={20} />
              </div>
              <h3 className="font-outfit font-extrabold text-lg text-slate-100 mb-3">{feat.title}</h3>
              <p className="text-slate-400 text-sm leading-relaxed">{feat.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Pricing Models */}
      <section className="max-w-7xl mx-auto px-6 py-20 border-t border-slate-900 text-center">
        <h2 className="font-outfit text-3xl md:text-5xl font-extrabold text-white mb-6">
          Transparent, Simple Pricing
        </h2>
        <p className="text-slate-400 max-w-md mx-auto mb-10">
          Scale your contract audits as your business grows. No hidden setups.
        </p>

        {/* Pricing Toggle */}
        <div className="inline-flex items-center gap-3 p-1.5 rounded-xl bg-slate-900 border border-slate-800/80 mb-16">
          <button 
            onClick={() => setIsAnnual(false)}
            className={`px-4 py-2 text-sm font-semibold rounded-lg transition ${!isAnnual ? 'bg-brand-600 text-white' : 'text-slate-400 hover:text-slate-100'}`}
          >
            Monthly Billing
          </button>
          <button 
            onClick={() => setIsAnnual(true)}
            className={`px-4 py-2 text-sm font-semibold rounded-lg transition ${isAnnual ? 'bg-brand-600 text-white' : 'text-slate-400 hover:text-slate-100'}`}
          >
            Annual Billing <span className="text-[10px] bg-brand-500/20 text-brand-300 px-1.5 py-0.5 rounded ml-1">-20%</span>
          </button>
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 max-w-3xl mx-auto gap-8">
          {/* Free Plan */}
          <div className="glass-card rounded-3xl p-8 flex flex-col justify-between text-left">
            <div>
              <span className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block">Starter</span>
              <h3 className="font-outfit text-3xl font-extrabold text-white mb-4">Free</h3>
              <p className="text-sm text-slate-400 mb-6">Best for solo practitioners and developers evaluating the AI service.</p>
              
              <ul className="space-y-3.5 mb-8 border-t border-slate-900 pt-6">
                <li className="flex items-center gap-3 text-sm text-slate-300">
                  <Check size={16} className="text-brand-400" />
                  <span>3 PDF Document uploads / mo</span>
                </li>
                <li className="flex items-center gap-3 text-sm text-slate-300">
                  <Check size={16} className="text-brand-400" />
                  <span>Basic Clause Extraction</span>
                </li>
                <li className="flex items-center gap-3 text-sm text-slate-300">
                  <Check size={16} className="text-brand-400" />
                  <span>General Risk Assessment Score</span>
                </li>
              </ul>
            </div>
            <Link 
              to="/register" 
              className="w-full py-3 px-4 rounded-xl text-center font-bold text-sm bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 transition duration-150"
            >
              Get Started Free
            </Link>
          </div>

          {/* Premium Plan */}
          <div className="glass-card rounded-3xl p-8 flex flex-col justify-between text-left border-brand-500/30 relative">
            <div className="absolute top-0 right-8 -translate-y-1/2 bg-brand-600 text-white font-extrabold text-[10px] uppercase tracking-widest px-3.5 py-1 rounded-full shadow-lg shadow-brand-500/20">
              POPULAR
            </div>
            <div>
              <span className="text-xs font-bold text-brand-400 uppercase tracking-widest mb-2 block">Enterprise Pro</span>
              <h3 className="font-outfit text-3xl font-extrabold text-white mb-4">
                {isAnnual ? '$79' : '$99'} <span className="text-slate-500 text-sm font-medium">/ month</span>
              </h3>
              <p className="text-sm text-slate-400 mb-6">Designed for legal departments, contracts compliance teams, and agencies.</p>
              
              <ul className="space-y-3.5 mb-8 border-t border-slate-900 pt-6">
                <li className="flex items-center gap-3 text-sm text-slate-300">
                  <Check size={16} className="text-brand-400" />
                  <span>Unlimited document uploads</span>
                </li>
                <li className="flex items-center gap-3 text-sm text-slate-300">
                  <Check size={16} className="text-brand-400" />
                  <span>Advanced RAG Interactive Chat</span>
                </li>
                <li className="flex items-center gap-3 text-sm text-slate-300">
                  <Check size={16} className="text-brand-400" />
                  <span>Remediation & amendment suggestions</span>
                </li>
                <li className="flex items-center gap-3 text-sm text-slate-300">
                  <Check size={16} className="text-brand-400" />
                  <span>API Integration Keys</span>
                </li>
              </ul>
            </div>
            <Link 
              to="/register" 
              className="w-full py-3 px-4 rounded-xl text-center font-bold text-sm bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white shadow-lg shadow-brand-500/10 transition duration-150"
            >
              Onboard Pro
            </Link>
          </div>
        </div>
      </section>

      {/* Accordion FAQ Section */}
      <section className="max-w-4xl mx-auto px-6 py-20 border-t border-slate-900">
        <h2 className="font-outfit text-3xl md:text-5xl font-extrabold text-center text-white mb-16">
          Frequently Asked Questions
        </h2>

        <div className="space-y-4">
          {faqs.map((faq, index) => {
            const isOpen = activeFaq === index;
            return (
              <div 
                key={index}
                className="glass-card rounded-2xl overflow-hidden transition-all duration-200"
              >
                <button
                  onClick={() => setActiveFaq(isOpen ? null : index)}
                  className="w-full px-6 py-5 flex items-center justify-between text-left font-outfit font-bold text-slate-200 hover:text-white"
                >
                  <span className="text-base">{faq.q}</span>
                  <ChevronDown 
                    size={18} 
                    className={`text-slate-500 transition-transform duration-200 ${isOpen ? 'rotate-180 text-brand-400' : ''}`} 
                  />
                </button>

                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: 'auto' }}
                      exit={{ height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="px-6 pb-6 text-sm text-slate-400 leading-relaxed border-t border-slate-900/50 pt-3">
                        {faq.a}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-12">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-tr from-brand-600 to-indigo-500 p-2.5 rounded-xl">
              <Scale size={16} className="text-white" />
            </div>
            <span className="font-outfit font-extrabold text-sm tracking-tight text-white">
              Clause<span className="text-brand-500">IQ</span>
            </span>
          </div>

          <p className="text-xs text-slate-500">
            &copy; {new Date().getFullYear()} ClauseIQ AI. All rights reserved. Built for modern legal operations.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
