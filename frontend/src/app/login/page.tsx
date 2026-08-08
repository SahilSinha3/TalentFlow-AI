'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { Mail, Lock, User, ArrowRight, Sparkles, Zap } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const endpoint = isRegister ? '/api/auth/register' : '/api/auth/login';
      const payload = isRegister ? { name, email, password } : { email, password };
      
      const res = await api.post(endpoint, payload);
      const { access_token, user } = res.data;

      localStorage.setItem('outreach_token', access_token);
      localStorage.setItem('outreach_user', JSON.stringify(user));
      
      router.push('/');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Authentication failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center p-6 bg-white">
      <div className="w-full max-w-md neu-card p-8 relative z-10">
        
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-14 h-14 neu-btn flex items-center justify-center mx-auto mb-3 text-zinc-900">
            <Zap className="w-8 h-8 fill-zinc-900 text-zinc-900" />
          </div>
          <h1 className="text-xl font-bold text-zinc-900 tracking-tight">TalentFlow AI</h1>
          <p className="text-xs text-zinc-500 font-medium mt-0.5">Autonomous Recruiter Intelligence & Follow-Up Engine</p>
        </div>

        {/* Tab Toggle */}
        <div className="flex neu-input p-1 rounded-xl mb-5">
          <button
            type="button"
            onClick={() => setIsRegister(false)}
            className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${
              !isRegister ? 'neu-btn-active font-bold text-zinc-900' : 'text-zinc-500 hover:text-zinc-900'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => setIsRegister(true)}
            className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${
              isRegister ? 'neu-btn-active font-bold text-zinc-900' : 'text-zinc-500 hover:text-zinc-900'
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-5 p-3 neu-card bg-[#f7f8fa] border border-black/10 text-zinc-900 text-xs font-medium text-center">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegister && (
            <div>
              <label className="block text-xs font-medium text-zinc-600 mb-1.5">
                Full Name
              </label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3.5 top-3.5 text-zinc-500" />
                <input
                  type="text"
                  required
                  placeholder="Sahil Sinha"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 neu-input"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-zinc-600 mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3.5 top-3.5 text-zinc-500" />
              <input
                type="email"
                required
                placeholder="you@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-3.5 py-2.5 neu-input"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-600 mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3.5 top-3.5 text-zinc-500" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-3.5 py-2.5 neu-input"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 neu-btn-primary font-bold text-xs flex items-center justify-center gap-2 transition-all mt-5 disabled:opacity-50"
          >
            {loading ? (
              <span className="animate-pulse">Authenticating...</span>
            ) : (
              <>
                {isRegister ? 'Get Started' : 'Enter TalentFlow Workspace'}
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </form>

        {/* Footnote */}
        <div className="mt-6 text-center text-[11px] text-zinc-500 font-normal flex items-center justify-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-zinc-700" />
          <span>Powered by Gemini 2.0 Flash & Python Async Worker</span>
        </div>

      </div>
    </main>
  );
}
