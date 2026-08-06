import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { Scale, AlertCircle, Mail, Lock, User, Loader2 } from 'lucide-react';

type RegisterFormInput = {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
};

export const Register: React.FC = () => {
  const { register: signUp } = useAuth();
  const navigate = useNavigate();
  const [apiError, setApiError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const { register, handleSubmit, watch, formState: { errors } } = useForm<RegisterFormInput>();
  const password = watch('password');

  const onSubmit = async (data: RegisterFormInput) => {
    setSubmitting(true);
    setApiError(null);
    try {
      await signUp(data.email, data.password, data.fullName);
      navigate('/dashboard');
    } catch (err: any) {
      const errMsg = err.response?.data?.detail || 'Registration failed. This email might already be in use.';
      setApiError(errMsg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 bg-grid-pattern flex flex-col items-center justify-center p-6 relative">
      {/* Glow background ambient elements */}
      <div className="absolute top-1/4 left-1/3 w-80 h-80 bg-brand-600/10 rounded-full blur-[80px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/3 w-80 h-80 bg-indigo-600/10 rounded-full blur-[80px] pointer-events-none" />

      {/* Brand Logo Link */}
      <Link to="/" className="flex items-center gap-3 mb-8 relative z-10 hover:opacity-95 transition">
        <div className="bg-gradient-to-tr from-brand-600 to-indigo-500 p-2.5 rounded-xl shadow-lg shadow-brand-500/20">
          <Scale size={20} className="text-white" />
        </div>
        <span className="font-outfit font-extrabold text-xl tracking-tight text-white">
          Clause<span className="text-brand-500">IQ</span>
        </span>
      </Link>

      {/* Registration Card */}
      <motion.div
        className="glass-card w-full max-w-md rounded-3xl p-8 relative z-10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h2 className="font-outfit text-2xl font-extrabold text-white text-center mb-2">Create Account</h2>
        <p className="text-slate-400 text-sm text-center mb-8">Begin auditing contracts in real time</p>

        {apiError && (
          <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex gap-2.5 items-start">
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            <span>{apiError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Full Name field */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block">Full Name</label>
            <div className="relative">
              <User className="absolute left-3.5 top-3.5 text-slate-500" size={18} />
              <input
                type="text"
                {...register('fullName', { required: 'Name is required' })}
                className="glass-input w-full pl-11 pr-4 py-3 text-sm"
                placeholder="Alex Morgan"
              />
            </div>
            {errors.fullName && (
              <span className="text-[10px] text-rose-400 font-semibold">{errors.fullName.message}</span>
            )}
          </div>

          {/* Email field */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3.5 text-slate-500" size={18} />
              <input
                type="email"
                {...register('email', { 
                  required: 'Email address is required',
                  pattern: { value: /^\S+@\S+$/i, message: 'Invalid email address' }
                })}
                className="glass-input w-full pl-11 pr-4 py-3 text-sm"
                placeholder="you@company.com"
              />
            </div>
            {errors.email && (
              <span className="text-[10px] text-rose-400 font-semibold">{errors.email.message}</span>
            )}
          </div>

          {/* Password field */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block">Password</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3.5 text-slate-500" size={18} />
              <input
                type="password"
                {...register('password', { 
                  required: 'Password is required',
                  minLength: { value: 6, message: 'Password must be at least 6 characters' }
                })}
                className="glass-input w-full pl-11 pr-4 py-3 text-sm"
                placeholder="••••••••"
              />
            </div>
            {errors.password && (
              <span className="text-[10px] text-rose-400 font-semibold">{errors.password.message}</span>
            )}
          </div>

          {/* Confirm Password field */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block">Confirm Password</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3.5 text-slate-500" size={18} />
              <input
                type="password"
                {...register('confirmPassword', { 
                  required: 'Please confirm password',
                  validate: value => value === password || 'Passwords do not match'
                })}
                className="glass-input w-full pl-11 pr-4 py-3 text-sm"
                placeholder="••••••••"
              />
            </div>
            {errors.confirmPassword && (
              <span className="text-[10px] text-rose-400 font-semibold">{errors.confirmPassword.message}</span>
            )}
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white font-bold py-3 px-4 rounded-xl shadow-lg shadow-brand-500/10 flex items-center justify-center gap-2 transition duration-200 disabled:opacity-70 disabled:cursor-not-allowed mt-2"
          >
            {submitting ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Creating Account...</span>
              </>
            ) : (
              <span>Create Account</span>
            )}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-slate-500">
          Already have an account?{' '}
          <Link to="/login" className="text-brand-400 hover:text-brand-300 font-semibold transition">
            Sign In
          </Link>
        </p>
      </motion.div>
    </div>
  );
};

export default Register;
