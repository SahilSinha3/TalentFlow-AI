'use client';

import React, { useState, useEffect } from 'react';
import Header from '@/components/Header';
import api from '@/lib/api';
import { Key, Mail, FileText, Sliders, Shield, Save, CheckCircle, Sparkles, User, Globe, Upload, FileCode, MessageSquare, AlertCircle, Info, MapPin, Briefcase, Building } from 'lucide-react';

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingPdf, setUploadingPdf] = useState(false);
  const [pdfSuccess, setPdfSuccess] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const [settings, setSettings] = useState({
    gmailEmail: '',
    gmailAppPassword: '',
    geminiApiKey: '',
    portfolioUrl: '',
    githubUrl: '',
    linkedinUrl: '',
    resumeDriveUrl: '',
    resumeText: '',
    sampleEmailText: '',
    writingStyleRules: '',
    targetRoles: ['Full Stack Developer', 'AI Engineer'],
    targetLocations: ['Remote', 'United States', 'India'],
    remotePreference: 'Remote',
    maxEmailsPerDay: 15,
    maxPostingAgeDays: 3,
    selectedTone: 'SHORT_DIRECT',
    customTonePrompt: 'Keep cold email under 100 words, direct, highlighting key project achievements.',
    agentMode: 'LOW',
    agentStatus: 'RUNNING',
  });

  // String helpers for input comma formatting
  const [targetRolesInput, setTargetRolesInput] = useState('');
  const [targetLocationsInput, setTargetLocationsInput] = useState('');

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/settings');
      setSettings(res.data);
      setTargetRolesInput((res.data.targetRoles || []).join(', '));
      setTargetLocationsInput((res.data.targetLocations || []).join(', '));
    } catch (err: any) {
      setErrorMsg('Failed to load user settings. Please check authentication.');
    } finally {
      setLoading(false);
    }
  };

  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    setUploadingPdf(true);
    setPdfSuccess('');
    setErrorMsg('');

    try {
      const res = await api.post('/api/settings/upload-resume', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setPdfSuccess(res.data.message);
      await fetchSettings();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.detail || 'Failed to parse PDF resume.');
    } finally {
      setUploadingPdf(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg('');
    setErrorMsg('');

    try {
      const payload = {
        ...settings,
        targetRoles: targetRolesInput.split(',').map((s) => s.trim()).filter(Boolean),
        targetLocations: targetLocationsInput.split(',').map((s) => s.trim()).filter(Boolean),
      };

      const res = await api.put('/api/settings', payload);
      setSettings(res.data);
      setSuccessMsg('Agent configuration, job targeting & writing style saved successfully!');
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.detail || 'Failed to update settings.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f4f4f6] text-zinc-900 pb-16">
      <Header agentStatus={settings.agentStatus} userEmail={settings.gmailEmail} />

      <main className="max-w-4xl mx-auto px-6">
        
        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-xl font-bold text-zinc-900 flex items-center gap-2.5 tracking-tight">
            <Sliders className="w-5 h-5 text-zinc-800" />
            Agent Configuration, Location Targeting & Writing Style
          </h1>
          <p className="text-xs text-zinc-500 mt-0.5 font-normal">
            Configure target countries, remote/hybrid preferences, API keys, resume PDF, and email tone calibration.
          </p>
        </div>

        {/* Success / Error Banners */}
        {successMsg && (
          <div className="mb-5 p-3.5 neu-card bg-[#eef0f4] text-zinc-900 text-xs font-semibold flex items-center gap-2.5">
            <CheckCircle className="w-4 h-4 text-zinc-900 flex-shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {errorMsg && (
          <div className="mb-5 p-3.5 neu-card bg-[#eef0f4] text-zinc-900 text-xs font-semibold flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 text-zinc-900 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {loading ? (
          <div className="neu-card p-10 text-center text-zinc-500 text-xs font-medium animate-pulse">
            Loading settings...
          </div>
        ) : (
          <form onSubmit={handleSave} className="space-y-6">
            
            {/* 1. Job Sourcing Location & Work Type Preferences */}
            <div className="neu-card p-6">
              <h2 className="text-sm font-bold text-zinc-900 mb-1 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-zinc-800" />
                Job Location & Work Arrangement Targeting
              </h2>
              <p className="text-xs text-zinc-500 mb-5 font-normal">
                Job scrapers and Gemini lead scoring will filter opportunities matching your specific countries, cities, and remote preferences.
              </p>

              <div className="space-y-5">
                <div>
                  <label className="block text-xs font-medium text-zinc-600 mb-1.5 flex items-center gap-1 group relative">
                    <span>Work Type Preference</span>
                    <Info className="w-3 h-3 text-zinc-400 cursor-pointer" />
                    <div className="absolute hidden group-hover:block bottom-full mb-2 left-0 w-72 p-2.5 neu-card bg-white text-[11px] text-zinc-700 z-50 shadow-xl border border-black/10">
                      Filters scrapers to only pull Remote, Hybrid, Onsite, or Any/Worldwide job listings.
                    </div>
                  </label>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
                    {[
                      { id: 'Remote', label: 'Remote Only', desc: 'Worldwide & Remote Jobs' },
                      { id: 'Hybrid', label: 'Hybrid', desc: 'Flexible Office + Remote' },
                      { id: 'Onsite', label: 'Onsite', desc: 'In-Person Office Roles' },
                      { id: 'Worldwide', label: 'Any / Worldwide', desc: 'No Location Filters' },
                    ].map((w) => (
                      <button
                        type="button"
                        key={w.id}
                        onClick={() => setSettings({ ...settings, remotePreference: w.id })}
                        className={`p-3 text-left transition-all ${
                          settings.remotePreference === w.id
                            ? 'neu-btn-active font-bold text-zinc-900'
                            : 'neu-btn'
                        }`}
                      >
                        <div className="text-xs font-bold text-zinc-900">{w.label}</div>
                        <div className="text-[10px] text-zinc-500 mt-0.5">{w.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-600 mb-1.5 flex items-center gap-1 group relative">
                    <span>Target Countries & Cities (Comma Separated)</span>
                    <Info className="w-3 h-3 text-zinc-400 cursor-pointer" />
                    <div className="absolute hidden group-hover:block bottom-full mb-2 left-0 w-80 p-2.5 neu-card bg-white text-[11px] text-zinc-700 z-50 shadow-xl border border-black/10">
                      Enter target locations e.g. "Remote Worldwide, United States, Canada, Europe, India, London, San Francisco".
                    </div>
                  </label>
                  <div className="relative">
                    <Globe className="w-4 h-4 absolute left-3.5 top-3.5 text-zinc-500" />
                    <input
                      type="text"
                      placeholder="e.g. Remote Worldwide, United States, Canada, Europe, India"
                      value={targetLocationsInput}
                      onChange={(e) => setTargetLocationsInput(e.target.value)}
                      className="w-full pl-10 pr-3.5 py-2.5 neu-input text-xs font-medium text-zinc-900"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-600 mb-1.5 flex items-center gap-1 group relative">
                    <span>Target Job Titles & Role Keywords (Comma Separated)</span>
                    <Info className="w-3 h-3 text-zinc-400 cursor-pointer" />
                    <div className="absolute hidden group-hover:block bottom-full mb-2 left-0 w-80 p-2.5 neu-card bg-white text-[11px] text-zinc-700 z-50 shadow-xl border border-black/10">
                      Enter role keywords e.g. "Full Stack Developer, AI/ML Engineer, Backend Developer, Python Engineer".
                    </div>
                  </label>
                  <div className="relative">
                    <Briefcase className="w-4 h-4 absolute left-3.5 top-3.5 text-zinc-500" />
                    <input
                      type="text"
                      placeholder="e.g. Full Stack Developer, AI/ML Engineer, Backend Developer"
                      value={targetRolesInput}
                      onChange={(e) => setTargetRolesInput(e.target.value)}
                      className="w-full pl-10 pr-3.5 py-2.5 neu-input text-xs font-medium text-zinc-900"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Credentials & App Connection */}
            <div className="neu-card p-6">
              <h2 className="text-sm font-bold text-zinc-900 mb-5 flex items-center gap-2">
                <Key className="w-4 h-4 text-zinc-800" />
                Gmail SMTP & Gemini API Credentials
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-medium text-zinc-600 mb-1.5 flex items-center justify-between">
                    <span>Gmail Email Address</span>
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3.5 top-3.5 text-zinc-500" />
                    <input
                      type="email"
                      placeholder="you@gmail.com"
                      value={settings.gmailEmail || ''}
                      onChange={(e) => setSettings({ ...settings, gmailEmail: e.target.value })}
                      className="w-full pl-10 pr-3.5 py-2.5 neu-input"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-600 mb-1.5 flex items-center justify-between group relative">
                    <span className="flex items-center gap-1">
                      Gmail App Password (16-char Passkey)
                      <Info className="w-3 h-3 text-zinc-400 cursor-pointer" />
                    </span>
                    <div className="absolute hidden group-hover:block bottom-full mb-2 right-0 w-64 p-2.5 neu-card bg-white text-[11px] text-zinc-700 z-50 shadow-xl border border-black/10">
                      Generate from Google Account Security $\rightarrow$ 2-Step Verification $\rightarrow$ App Passwords.
                    </div>
                  </label>
                  <div className="relative">
                    <Shield className="w-4 h-4 absolute left-3.5 top-3.5 text-zinc-500" />
                    <input
                      type="password"
                      placeholder="abcd efgh ijkl mnop"
                      value={settings.gmailAppPassword || ''}
                      onChange={(e) => setSettings({ ...settings, gmailAppPassword: e.target.value })}
                      className="w-full pl-10 pr-3.5 py-2.5 neu-input"
                    />
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-zinc-600 mb-1.5 flex items-center justify-between group relative">
                    <span className="flex items-center gap-1">
                      Google Gemini API Key (`GEMINI_API_KEY`)
                      <Info className="w-3 h-3 text-zinc-400 cursor-pointer" />
                    </span>
                    <div className="absolute hidden group-hover:block bottom-full mb-2 left-0 w-72 p-2.5 neu-card bg-white text-[11px] text-zinc-700 z-50 shadow-xl border border-black/10">
                      Included with your Google AI Pro subscription / Google AI Studio key for Gemini 2.0 Flash API access.
                    </div>
                  </label>
                  <div className="relative">
                    <Sparkles className="w-4 h-4 absolute left-3.5 top-3.5 text-zinc-700" />
                    <input
                      type="password"
                      placeholder="AIzaSy..."
                      value={settings.geminiApiKey || ''}
                      onChange={(e) => setSettings({ ...settings, geminiApiKey: e.target.value })}
                      className="w-full pl-10 pr-3.5 py-2.5 neu-input"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 3. Resume & PDF Upload Section */}
            <div className="neu-card p-6">
              <h2 className="text-sm font-bold text-zinc-900 mb-1 flex items-center gap-2">
                <FileCode className="w-4 h-4 text-zinc-800" />
                Resume & Profile Storage
              </h2>
              <p className="text-xs text-zinc-500 mb-5 font-normal">
                Upload your PDF resume or provide a Google Drive / Web link. The AI will ingest your skills for lead matching.
              </p>

              <div className="space-y-5">
                {/* PDF Drag & Drop Upload */}
                <div className="p-5 neu-input border-dashed border border-zinc-400/50 rounded-xl text-center">
                  <Upload className="w-6 h-6 text-zinc-800 mx-auto mb-2" />
                  <div className="text-xs font-bold text-zinc-900">
                    Upload PDF Resume File
                  </div>
                  <p className="text-[11px] text-zinc-500 mt-0.5 mb-3">
                    Extracted automatically into plain text using Python PDF parser.
                  </p>
                  
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={handlePdfUpload}
                    className="hidden"
                    id="pdf-upload-input"
                  />
                  <label
                    htmlFor="pdf-upload-input"
                    className="cursor-pointer px-4 py-2 neu-btn text-xs font-bold text-zinc-900 inline-flex items-center gap-2"
                  >
                    {uploadingPdf ? 'Parsing PDF Text...' : 'Select PDF File'}
                  </label>

                  {pdfSuccess && (
                    <div className="mt-2.5 text-xs font-bold text-zinc-900">
                      {pdfSuccess}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-600 mb-1.5">
                    Google Drive or Online Resume Link (Optional)
                  </label>
                  <div className="relative">
                    <Globe className="w-4 h-4 absolute left-3.5 top-3.5 text-zinc-500" />
                    <input
                      type="url"
                      placeholder="https://drive.google.com/file/d/..."
                      value={settings.resumeDriveUrl || ''}
                      onChange={(e) => setSettings({ ...settings, resumeDriveUrl: e.target.value })}
                      className="w-full pl-10 pr-3.5 py-2.5 neu-input"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-600 mb-1.5">
                    Parsed Resume Content & Technical Summary
                  </label>
                  <textarea
                    rows={4}
                    placeholder="Parsed PDF text or manual summary will appear here..."
                    value={settings.resumeText || ''}
                    onChange={(e) => setSettings({ ...settings, resumeText: e.target.value })}
                    className="w-full p-3 neu-input font-mono text-xs text-zinc-900"
                  />
                </div>
              </div>
            </div>

            {/* 4. Writing Style & Cold Email Sample Calibration */}
            <div className="neu-card p-6">
              <h2 className="text-sm font-bold text-zinc-900 mb-1 flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-zinc-800" />
                Writing Style & Tone Calibration Engine
              </h2>
              <p className="text-xs text-zinc-500 mb-5 font-normal">
                Paste an example email you've previously sent. Gemini will mimic your authentic sentence flow, greeting, and signature.
              </p>

              <div className="space-y-5">
                <div>
                  <label className="block text-xs font-medium text-zinc-600 mb-1.5 flex items-center gap-1 group relative">
                    <span>Sample Cold Email (Writing Style Reference)</span>
                    <Info className="w-3 h-3 text-zinc-400 cursor-pointer" />
                    <div className="absolute hidden group-hover:block bottom-full mb-2 left-0 w-80 p-2.5 neu-card bg-white text-[11px] text-zinc-700 z-50 shadow-xl border border-black/10">
                      Gemini API analyzes this sample email to replicate your exact paragraph structure, tone, and signoff.
                    </div>
                  </label>
                  <textarea
                    rows={5}
                    placeholder={`Hi Sarah,\n\nI saw Acme AI's recent launch of their multi-agent engine on Twitter. Really impressed by the low latency execution.\n\nOver the past 3 years, I built a similar distributed worker pipeline in Rust that handled 50k events/sec. Would love to bring this experience to your team.\n\nHere's my portfolio: https://sahilsinha.dev\n\nBest,\nSahil`}
                    value={settings.sampleEmailText || ''}
                    onChange={(e) => setSettings({ ...settings, sampleEmailText: e.target.value })}
                    className="w-full p-3 neu-input font-mono text-xs text-zinc-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-600 mb-1.5">
                    Cold Email Writing Tone Preset
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
                    {[
                      { id: 'SHORT_DIRECT', label: 'Short & Direct', desc: '< 90 words, high punch' },
                      { id: 'FORMAL', label: 'Formal Corporate', desc: 'Standard business style' },
                      { id: 'CASUAL', label: 'Casual Engineer', desc: 'Peer-to-peer friendly' },
                      { id: 'STORYTELLING', label: 'Value Storytelling', desc: 'Achievement focused' },
                    ].map((tone) => (
                      <button
                        type="button"
                        key={tone.id}
                        onClick={() => setSettings({ ...settings, selectedTone: tone.id })}
                        className={`p-3 text-left transition-all ${
                          settings.selectedTone === tone.id
                            ? 'neu-btn-active font-bold text-zinc-900'
                            : 'neu-btn'
                        }`}
                      >
                        <div className="text-xs font-bold text-zinc-900">{tone.label}</div>
                        <div className="text-[10px] text-zinc-500 mt-0.5">{tone.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-600 mb-1.5">
                    Custom Tone Instructions & Guardrails
                  </label>
                  <textarea
                    rows={2}
                    placeholder="e.g., Always sound high-value, never sound needy, keep under 100 words."
                    value={settings.customTonePrompt || ''}
                    onChange={(e) => setSettings({ ...settings, customTonePrompt: e.target.value })}
                    className="w-full p-3 neu-input text-zinc-900"
                  />
                </div>
              </div>
            </div>

            {/* 5. Optional Social Links & Profiles */}
            <div className="neu-card p-6">
              <h2 className="text-sm font-bold text-zinc-900 mb-5 flex items-center gap-2">
                <Globe className="w-4 h-4 text-zinc-800" />
                Social Profiles & Links (Optional)
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div>
                  <label className="block text-xs font-medium text-zinc-600 mb-1.5">
                    GitHub Profile
                  </label>
                  <div className="relative">
                    <Globe className="w-4 h-4 absolute left-3.5 top-3.5 text-zinc-500" />
                    <input
                      type="url"
                      placeholder="https://github.com/username"
                      value={settings.githubUrl || ''}
                      onChange={(e) => setSettings({ ...settings, githubUrl: e.target.value })}
                      className="w-full pl-10 pr-3 py-2.5 neu-input text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-600 mb-1.5">
                    LinkedIn Profile
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 absolute left-3.5 top-3.5 text-zinc-500" />
                    <input
                      type="url"
                      placeholder="https://linkedin.com/in/username"
                      value={settings.linkedinUrl || ''}
                      onChange={(e) => setSettings({ ...settings, linkedinUrl: e.target.value })}
                      className="w-full pl-10 pr-3 py-2.5 neu-input text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-600 mb-1.5">
                    Personal Portfolio
                  </label>
                  <div className="relative">
                    <Globe className="w-4 h-4 absolute left-3.5 top-3.5 text-zinc-500" />
                    <input
                      type="url"
                      placeholder="https://sahilsinha.dev"
                      value={settings.portfolioUrl || ''}
                      onChange={(e) => setSettings({ ...settings, portfolioUrl: e.target.value })}
                      className="w-full pl-10 pr-3 py-2.5 neu-input text-xs"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 6. Agent Parameters */}
            <div className="neu-card p-6">
              <h2 className="text-sm font-bold text-zinc-900 mb-5 flex items-center gap-2">
                <Sliders className="w-4 h-4 text-zinc-800" />
                Agent Throttle & Freshness Parameters
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-medium text-zinc-600 mb-1.5 font-mono flex items-center gap-1 group relative">
                    <span>Max Emails Per Day Cap</span>
                    <Info className="w-3 h-3 text-zinc-400 cursor-pointer" />
                    <div className="absolute hidden group-hover:block bottom-full mb-2 left-0 w-64 p-2.5 neu-card bg-white text-[11px] text-zinc-700 z-50 shadow-xl border border-black/10">
                      Limits maximum outbound emails per 24 hours to keep your Gmail sender reputation clean.
                    </div>
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={50}
                    value={settings.maxEmailsPerDay}
                    onChange={(e) => setSettings({ ...settings, maxEmailsPerDay: parseInt(e.target.value) || 1 })}
                    className="w-full px-3.5 py-2.5 neu-input font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-600 mb-1.5 font-mono flex items-center gap-1 group relative">
                    <span>Job Posting Max Age</span>
                    <Info className="w-3 h-3 text-zinc-400 cursor-pointer" />
                    <div className="absolute hidden group-hover:block bottom-full mb-2 right-0 w-64 p-2.5 neu-card bg-white text-[11px] text-zinc-700 z-50 shadow-xl border border-black/10">
                      Automatically filters out outdated or filled job listings older than the specified days.
                    </div>
                  </label>
                  <select
                    value={settings.maxPostingAgeDays}
                    onChange={(e) => setSettings({ ...settings, maxPostingAgeDays: parseInt(e.target.value) })}
                    className="w-full px-3.5 py-2.5 neu-input font-mono text-zinc-900 font-medium"
                  >
                    <option value={1}>Posted within Last 24 Hours</option>
                    <option value={3}>Posted within Last 3 Days</option>
                    <option value={7}>Posted within Last 7 Days</option>
                    <option value={14}>Posted within Last 14 Days</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Save Button */}
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="py-3 px-6 neu-btn-primary font-bold text-xs flex items-center gap-2 transition-all disabled:opacity-50"
              >
                {saving ? (
                  <span className="animate-pulse">Saving Settings...</span>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Save Configuration & Job Targeting
                  </>
                )}
              </button>
            </div>

          </form>
        )}

      </main>
    </div>
  );
}
