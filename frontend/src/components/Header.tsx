'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Bot, Sliders, LogOut, Activity, Zap } from 'lucide-react';

interface HeaderProps {
  agentStatus?: string;
  userEmail?: string;
}

export default function Header({ agentStatus = 'RUNNING', userEmail }: HeaderProps) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('outreach_token');
      localStorage.removeItem('outreach_user');
      router.push('/login');
    }
  };

  if (pathname === '/login') return null;

  return (
    <header className="sticky top-0 z-50 neu-card rounded-none border-b border-black/5 px-6 py-3.5 mb-8 backdrop-blur-xl bg-opacity-95">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-9 h-9 neu-btn flex items-center justify-center text-zinc-900 group-hover:scale-105 transition-transform">
            <Zap className="w-5 h-5 fill-zinc-900" />
          </div>
          <div>
            <h1 className="text-base font-bold text-zinc-900 tracking-tight">TalentFlow AI</h1>
            <p className="text-[11px] text-zinc-500 font-medium">Recruiter Outreach & Follow-Up Engine</p>
          </div>
        </Link>

        {/* Navigation Links */}
        <nav className="flex items-center gap-2 neu-input p-1 rounded-xl">
          <Link
            href="/"
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
              pathname === '/'
                ? 'neu-btn-active text-zinc-900 font-bold'
                : 'text-zinc-600 hover:text-zinc-900'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            Dashboard
          </Link>

          <Link
            href="/settings"
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
              pathname === '/settings'
                ? 'neu-btn-active text-zinc-900 font-bold'
                : 'text-zinc-600 hover:text-zinc-900'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            Settings & Writing Style
          </Link>
        </nav>

        {/* Agent Status & User Actions */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 neu-input text-[11px] font-medium">
            <span className={`w-2 h-2 rounded-full ${agentStatus === 'RUNNING' ? 'bg-zinc-900 animate-pulse' : 'bg-zinc-400'}`}></span>
            <span className="text-zinc-600">Agent: <strong className="text-zinc-900 font-semibold">{agentStatus}</strong></span>
          </div>

          <button
            onClick={handleLogout}
            className="p-2 neu-btn text-zinc-600 hover:text-zinc-900 transition-all"
            title="Logout"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>

      </div>
    </header>
  );
}
