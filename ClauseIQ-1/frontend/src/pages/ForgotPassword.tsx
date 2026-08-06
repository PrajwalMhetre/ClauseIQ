import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import { Scale, Mail, CheckCircle2, ArrowLeft, Loader2 } from 'lucide-react';

type ForgotPasswordFormInput = {
  email: string;
};

export const ForgotPassword: React.FC = () => {
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<ForgotPasswordFormInput>();

  const onSubmit = async (_data: ForgotPasswordFormInput) => {
    setSubmitting(true);
    // Simulate sending recovery email
    setTimeout(() => {
      setSubmitting(false);
      setSuccess(true);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-slate-950 bg-grid-pattern flex flex-col items-center justify-center p-6 relative">
      <div className="absolute top-1/4 left-1/3 w-80 h-80 bg-brand-600/10 rounded-full blur-[80px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/3 w-80 h-80 bg-indigo-600/10 rounded-full blur-[80px] pointer-events-none" />

      {/* Header Logo */}
      <Link to="/" className="flex items-center gap-3 mb-8 relative z-10 hover:opacity-95 transition">
        <div className="bg-gradient-to-tr from-brand-600 to-indigo-500 p-2.5 rounded-xl">
          <Scale size={20} className="text-white" />
        </div>
        <span className="font-outfit font-extrabold text-xl tracking-tight text-white">
          Clause<span className="text-brand-500">IQ</span>
        </span>
      </Link>

      {/* Forgot Password Card */}
      <motion.div
        className="glass-card w-full max-w-md rounded-3xl p-8 relative z-10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        {!success ? (
          <>
            <h2 className="font-outfit text-2xl font-extrabold text-white text-center mb-2">Reset Password</h2>
            <p className="text-slate-400 text-sm text-center mb-8">Enter your email to receive recovery instructions</p>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              {/* Email field */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3.5 text-slate-500" size={18} />
                  <input
                    type="email"
                    {...register('email', { 
                      required: 'Email address is required',
                      pattern: { value: /^\S+@\S+$/i, message: 'Invalid email address' }
                    })}
                    className="glass-input w-full pl-11 pr-4 py-3.5 text-sm"
                    placeholder="you@company.com"
                  />
                </div>
                {errors.email && (
                  <span className="text-[10px] text-rose-400 font-semibold">{errors.email.message}</span>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white font-bold py-3.5 px-4 rounded-xl shadow-lg shadow-brand-500/10 flex items-center justify-center gap-2 transition duration-200 disabled:opacity-70"
              >
                {submitting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Sending Recovery Email...</span>
                  </>
                ) : (
                  <span>Send Reset Link</span>
                )}
              </button>
            </form>
          </>
        ) : (
          <div className="text-center py-6">
            <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 size={32} />
            </div>
            <h2 className="font-outfit text-2xl font-extrabold text-white mb-2">Check Your Email</h2>
            <p className="text-slate-400 text-sm mb-8 max-w-sm mx-auto leading-relaxed">
              We have dispatched instructions to your address. Please verify your inbox to reset your password.
            </p>
          </div>
        )}

        <div className="mt-8 border-t border-slate-900 pt-6 text-center">
          <Link to="/login" className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition">
            <ArrowLeft size={14} />
            <span>Return to login</span>
          </Link>
        </div>
      </motion.div>
    </div>
  );
};

export default ForgotPassword;
