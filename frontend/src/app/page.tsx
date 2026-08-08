'use client';

import React, { useState, useEffect } from 'react';
import Header from '@/components/Header';
import api from '@/lib/api';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Play, Pause, RefreshCw, Send, CheckCircle, Clock, AlertCircle, Sparkles, Filter, ExternalLink, Mail, UserCheck, ShieldCheck, ChevronRight, Key, ArrowRight, Zap, Calendar, Repeat, Info } from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [runningWorker, setRunningWorker] = useState(false);
  const [workerMessage, setWorkerMessage] = useState('');

  const [settings, setSettings] = useState<any>({
    agentStatus: 'RUNNING',
    agentMode: 'LOW',
    maxEmailsPerDay: 15,
    gmailEmail: '',
    gmailAppPassword: '',
    geminiApiKey: '',
  });

  const [jobs, setJobs] = useState<any[]>([]);
  const [outreachLogs, setOutreachLogs] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | 'QUEUED' | 'SENT' | 'FOLLOWUP_QUEUED'>('all');
  
  // Selected draft for Cold Email Review Modal
  const [selectedDraft, setSelectedDraft] = useState<any | null>(null);
  const [sendingModal, setSendingModal] = useState(false);
  const [modalSuccess, setModalSuccess] = useState('');

  // Follow-Up Scheduling Modal State
  const [followUpLog, setFollowUpLog] = useState<any | null>(null);
  const [followUpDays, setFollowUpDays] = useState<number>(3);
  const [followUpSubject, setFollowUpSubject] = useState('');
  const [followUpBody, setFollowUpBody] = useState('');
  const [schedulingFollowUp, setSchedulingFollowUp] = useState(false);
  const [followUpSuccess, setFollowUpSuccess] = useState('');

  useEffect(() => {
    checkAuth();
    fetchDashboardData();
  }, []);

  const checkAuth = () => {
    const token = localStorage.getItem('outreach_token');
    if (!token) {
      router.push('/login');
    }
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [sRes, jRes, oRes] = await Promise.all([
        api.get('/api/settings'),
        api.get('/api/jobs'),
        api.get('/api/jobs/outreach')
      ]);

      setSettings(sRes.data);
      setJobs(jRes.data);
      setOutreachLogs(oRes.data);
    } catch (err: any) {
      if (err.response?.status === 401) {
        router.push('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRunWorkerNow = async () => {
    setRunningWorker(true);
    setWorkerMessage('');
    try {
      const res = await api.post('/api/agent/run');
      setWorkerMessage(`Worker execution complete! Scraped ${res.data.processed || 0} fresh jobs, drafted ${res.data.drafted || 0} recruiter cold emails.`);
      await fetchDashboardData();
    } catch (err: any) {
      setWorkerMessage(err.response?.data?.detail || 'Worker execution failed.');
    } finally {
      setRunningWorker(false);
      setTimeout(() => setWorkerMessage(''), 6000);
    }
  };

  const handleControlAgent = async (status: string, mode?: string) => {
    try {
      const res = await api.post('/api/agent/control', { status, mode: mode || settings.agentMode });
      setSettings((prev: any) => ({ ...prev, agentStatus: res.data.agentStatus, agentMode: res.data.agentMode }));
    } catch (err: any) {
      console.error(err);
    }
  };

  const handleApproveAndSend = async (outreachId: string) => {
    setSendingModal(true);
    setModalSuccess('');
    try {
      await api.post(`/api/agent/send-email/${outreachId}`);
      setModalSuccess('Cold email successfully delivered via Gmail SMTP!');
      setTimeout(() => {
        setSelectedDraft(null);
        setModalSuccess('');
        fetchDashboardData();
      }, 2000);
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to send email.');
    } finally {
      setSendingModal(false);
    }
  };

  const handleOpenFollowUpModal = (log: any) => {
    setFollowUpLog(log);
    setFollowUpDays(3);
    setFollowUpSubject(log.followUpSubject || `Re: ${log.subject}`);
    setFollowUpBody(log.followUpBody || `Hi,\n\nFollowing up on my earlier note regarding the ${log.role} position at ${log.company}. Would love to connect if you have a moment this week.\n\nBest regards,`);
    setFollowUpSuccess('');
  };

  const handleScheduleFollowUp = async () => {
    if (!followUpLog) return;
    setSchedulingFollowUp(true);
    try {
      const res = await api.post(`/api/agent/schedule-followup/${followUpLog.id}`, {
        daysDelay: followUpDays,
        customSubject: followUpSubject,
        customBody: followUpBody
      });
      setFollowUpSuccess(res.data.message);
      setTimeout(() => {
        setFollowUpLog(null);
        setFollowUpSuccess('');
        fetchDashboardData();
      }, 2000);
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to schedule follow-up.');
    } finally {
      setSchedulingFollowUp(false);
    }
  };

  const handleSendFollowUpNow = async () => {
    if (!followUpLog) return;
    setSchedulingFollowUp(true);
    try {
      await api.post(`/api/agent/send-followup/${followUpLog.id}`);
      setFollowUpSuccess('Follow-up email delivered via Gmail SMTP!');
      setTimeout(() => {
        setFollowUpLog(null);
        setFollowUpSuccess('');
        fetchDashboardData();
      }, 2000);
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to send follow-up.');
    } finally {
      setSchedulingFollowUp(false);
    }
  };

  // Stats
  const sentTodayCount = outreachLogs.filter((o) => o.status === 'SENT').length;
  const queuedCount = outreachLogs.filter((o) => o.status === 'QUEUED').length;
  const followUpQueuedCount = outreachLogs.filter((o) => o.followUpStatus === 'FOLLOWUP_QUEUED').length;
  const highMatchCount = jobs.filter((j) => (j.matchScore || 0) >= 85).length;
  const isSetupIncomplete = !settings.geminiApiKey || !settings.gmailAppPassword;

  const filteredOutreach = outreachLogs.filter((log) => {
    if (activeTab === 'all') return true;
    if (activeTab === 'FOLLOWUP_QUEUED') return log.followUpStatus === 'FOLLOWUP_QUEUED';
    return log.status === activeTab;
  });

  return (
    <div className="min-h-screen bg-white text-zinc-900 pb-16">
      <Header agentStatus={settings.agentStatus} userEmail={settings.gmailEmail} />

      <main className="max-w-6xl mx-auto px-6">
        
        {/* Onboarding Banner if Credentials are missing */}
        {isSetupIncomplete && (
          <div className="mb-6 p-5 neu-card bg-[#f7f8fa] flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 neu-btn flex items-center justify-center text-zinc-900 flex-shrink-0">
                <Key className="w-5 h-5 animate-pulse text-zinc-900" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-zinc-900">Setup Required: Configure API Keys & Gmail Credentials</h3>
                <p className="text-xs text-zinc-600 mt-0.5 font-normal">
                  Add your <strong>Google Gemini API Key</strong> and <strong>Gmail App Password</strong> in Settings to start autonomous outreach and follow-ups.
                </p>
              </div>
            </div>
            <Link
              href="/settings"
              className="px-4 py-2 neu-btn-primary font-semibold text-xs flex items-center gap-2 whitespace-nowrap"
            >
              <span>Go to Settings</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        )}

        {/* Agent Control Header & Quick Actions */}
        <div className="neu-card p-6 mb-6 flex flex-col lg:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 neu-btn flex items-center justify-center text-zinc-900">
              <Zap className="w-7 h-7 fill-zinc-900" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-lg font-bold text-zinc-900 tracking-tight">TalentFlow Intelligence Center</h1>
                <span className={`px-2.5 py-0.5 neu-input text-[11px] font-medium ${
                  settings.agentStatus === 'RUNNING' ? 'text-zinc-900 font-bold' : 'text-zinc-500'
                }`}>
                  {settings.agentStatus}
                </span>
              </div>
              <p className="text-xs text-zinc-600 mt-0.5 font-normal">
                Gmail: <span className="text-zinc-900 font-semibold">{settings.gmailEmail || 'Not configured'}</span> | Mode: <span className="text-zinc-900 font-bold">{settings.agentMode}</span>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
            {/* Status Toggle */}
            {settings.agentStatus === 'RUNNING' ? (
              <button
                onClick={() => handleControlAgent('PAUSED')}
                className="flex items-center gap-2 px-3.5 py-2 neu-btn text-zinc-700 font-semibold text-xs"
              >
                <Pause className="w-3.5 h-3.5 text-zinc-600" />
                Pause Agent
              </button>
            ) : (
              <button
                onClick={() => handleControlAgent('RUNNING')}
                className="flex items-center gap-2 px-3.5 py-2 neu-btn text-zinc-900 font-semibold text-xs"
              >
                <Play className="w-3.5 h-3.5 text-zinc-900" />
                Resume Agent
              </button>
            )}

            {/* Mode Switches with Hover Info */}
            <div className="relative group">
              <div className="flex neu-input p-1 rounded-xl text-xs font-medium">
                {['LOW', 'MEDIUM', 'HIGH'].map((m) => (
                  <button
                    key={m}
                    onClick={() => handleControlAgent(settings.agentStatus, m)}
                    className={`px-3 py-1 rounded-lg transition-all ${
                      settings.agentMode === m ? 'neu-btn-active font-bold text-zinc-900' : 'text-zinc-600 hover:text-zinc-900'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>

              {/* Mode Info Hover Tooltip */}
              <div className="absolute hidden group-hover:block bottom-full mb-2 right-0 w-72 p-3 neu-card bg-[#f4f4f6] text-[11px] text-zinc-700 z-50 shadow-xl border border-black/10">
                <div className="font-bold text-zinc-900 mb-1 flex items-center gap-1">
                  <Info className="w-3.5 h-3.5 text-zinc-900" /> Agent Intensity Modes:
                </div>
                <ul className="space-y-1 list-disc pl-3">
                  <li><strong>LOW (Recommended):</strong> Creates drafts in queue for 1-click review before sending.</li>
                  <li><strong>MEDIUM:</strong> Auto-sends top matches (&gt;85% fit), queues lower scores.</li>
                  <li><strong>HIGH:</strong> Fully autonomous sourcing & auto-sending with daily cap guard.</li>
                </ul>
              </div>
            </div>

            {/* Run Worker Now */}
            <button
              onClick={handleRunWorkerNow}
              disabled={runningWorker}
              className="flex items-center gap-2 px-5 py-2.5 neu-btn-primary font-bold text-xs transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${runningWorker ? 'animate-spin' : ''}`} />
              {runningWorker ? 'Sourcing Jobs...' : 'Run Worker Now'}
            </button>
          </div>
        </div>

        {/* Worker Status Toast */}
        {workerMessage && (
          <div className="mb-6 p-3.5 neu-card bg-[#f7f8fa] text-zinc-800 text-xs font-medium flex items-center justify-between border border-black/10">
            <span className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-zinc-800" />
              {workerMessage}
            </span>
          </div>
        )}

        {/* Stat Cards with Hover Tooltips */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-5 mb-6">
          <div className="neu-card p-5 neu-card-hover relative group">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-zinc-500 flex items-center gap-1">
                Leads Discovered
                <Info className="w-3 h-3 text-zinc-400 cursor-pointer" />
              </span>
              <Filter className="w-3.5 h-3.5 text-zinc-700" />
            </div>
            <div className="text-2xl font-bold text-zinc-900">{jobs.length}</div>
            <div className="text-[11px] text-zinc-500 mt-0.5">Free Web Platforms</div>
            
            {/* Tooltip */}
            <div className="absolute hidden group-hover:block bottom-full mb-2 left-0 right-0 p-2.5 neu-card bg-white text-[11px] text-zinc-700 z-50 shadow-lg border border-black/10">
              Scraped from Reddit, Hacker News, Remotive, WWR RSS, and RemoteOK feeds.
            </div>
          </div>

          <div className="neu-card p-5 neu-card-hover relative group">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-zinc-500 flex items-center gap-1">
                Outreach Queue
                <Info className="w-3 h-3 text-zinc-400 cursor-pointer" />
              </span>
              <Clock className="w-3.5 h-3.5 text-zinc-700" />
            </div>
            <div className="text-2xl font-bold text-zinc-900">{queuedCount}</div>
            <div className="text-[11px] text-zinc-500 mt-0.5">Ready for 1-Click Send</div>

            {/* Tooltip */}
            <div className="absolute hidden group-hover:block bottom-full mb-2 left-0 right-0 p-2.5 neu-card bg-white text-[11px] text-zinc-700 z-50 shadow-lg border border-black/10">
              Cold email drafts tailored to your resume awaiting your manual 1-click approval.
            </div>
          </div>

          <div className="neu-card p-5 neu-card-hover relative group">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-zinc-500 flex items-center gap-1">
                Follow-Ups Scheduled
                <Info className="w-3 h-3 text-zinc-400 cursor-pointer" />
              </span>
              <Repeat className="w-3.5 h-3.5 text-zinc-700" />
            </div>
            <div className="text-2xl font-bold text-zinc-900">{followUpQueuedCount}</div>
            <div className="text-[11px] text-zinc-500 mt-0.5">Auto Follow-Up Engine</div>

            {/* Tooltip */}
            <div className="absolute hidden group-hover:block bottom-full mb-2 left-0 right-0 p-2.5 neu-card bg-white text-[11px] text-zinc-700 z-50 shadow-lg border border-black/10">
              Automated follow-up emails scheduled for 3, 5, or 7 days post initial outreach.
            </div>
          </div>

          <div className="neu-card p-5 neu-card-hover relative group">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-zinc-500 flex items-center gap-1">
                Sent Today
                <Info className="w-3 h-3 text-zinc-400 cursor-pointer" />
              </span>
              <Send className="w-3.5 h-3.5 text-zinc-700" />
            </div>
            <div className="text-2xl font-bold text-zinc-900">
              {sentTodayCount} <span className="text-xs font-normal text-zinc-500">/ {settings.maxEmailsPerDay} max</span>
            </div>
            <div className="w-full neu-input h-1.5 rounded-full mt-2.5 overflow-hidden p-0">
              <div
                className="bg-zinc-900 h-full rounded-full transition-all"
                style={{ width: `${Math.min(100, (sentTodayCount / (settings.maxEmailsPerDay || 15)) * 100)}%` }}
              />
            </div>

            {/* Tooltip */}
            <div className="absolute hidden group-hover:block bottom-full mb-2 left-0 right-0 p-2.5 neu-card bg-white text-[11px] text-zinc-700 z-50 shadow-lg border border-black/10">
              Total cold emails dispatched via Gmail SMTP today. Protects sender reputation.
            </div>
          </div>
        </div>

        {/* Outreach Activity & Follow-Up Table */}
        <div className="neu-card overflow-hidden">
          
          {/* Table Header & Filter Tabs */}
          <div className="p-5 border-b border-black/5 flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-zinc-900 flex items-center gap-2">
                <Mail className="w-4 h-4 text-zinc-800" />
                Live Recruiter Outreach & Follow-Up Activity
              </h2>
              <p className="text-xs text-zinc-500 mt-0.5">
                Review cold email drafts, schedule automated follow-ups, or track delivery logs.
              </p>
            </div>

            <div className="flex neu-input p-1 rounded-xl text-xs font-medium">
              {[
                { id: 'all', label: 'All Activity' },
                { id: 'QUEUED', label: `Queued (${queuedCount})` },
                { id: 'SENT', label: 'Sent' },
                { id: 'FOLLOWUP_QUEUED', label: `Follow-Ups (${followUpQueuedCount})` },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-3.5 py-1.5 rounded-lg transition-all ${
                    activeTab === tab.id ? 'neu-btn-active font-bold text-zinc-900' : 'text-zinc-600 hover:text-zinc-900'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Table Body */}
          <div className="overflow-x-auto">
            {loading ? (
              <div className="p-10 text-center text-zinc-500 text-xs animate-pulse">Loading outreach & follow-up logs...</div>
            ) : filteredOutreach.length === 0 ? (
              <div className="p-10 text-center text-zinc-500 text-xs">
                No outreach activity logged yet. Click <strong className="text-zinc-900">"Run Worker Now"</strong> to trigger sourcing!
              </div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead className="bg-[#edf0f5] text-zinc-600 text-[11px] uppercase font-semibold border-b border-black/5">
                  <tr>
                    <th className="px-5 py-3.5">Company & Role</th>
                    <th className="px-5 py-3.5">Recruiter Contact</th>
                    <th className="px-5 py-3.5 text-center">Outreach Status</th>
                    <th className="px-5 py-3.5 text-center">Follow-Up Status</th>
                    <th className="px-5 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/5 text-zinc-800">
                  {filteredOutreach.map((log) => (
                    <tr key={log.id} className="hover:bg-zinc-100/80 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="font-bold text-zinc-900">{log.role}</div>
                        <div className="text-[11px] text-zinc-500 font-normal mt-0.5">{log.company}</div>
                      </td>

                      <td className="px-5 py-3.5">
                        <div className="text-xs text-zinc-800 font-medium">{log.recipientEmail}</div>
                      </td>

                      <td className="px-5 py-3.5 text-center">
                        <span className={`px-2.5 py-0.5 neu-input text-[11px] font-semibold ${
                          log.status === 'SENT'
                            ? 'text-zinc-900 font-bold'
                            : log.status === 'QUEUED'
                            ? 'text-zinc-700'
                            : 'text-zinc-500'
                        }`}>
                          {log.status}
                        </span>
                      </td>

                      <td className="px-5 py-3.5 text-center">
                        {log.followUpStatus === 'FOLLOWUP_QUEUED' ? (
                          <span className="px-2.5 py-0.5 neu-input text-[11px] font-bold text-zinc-900 inline-flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            Scheduled
                          </span>
                        ) : log.followUpStatus === 'FOLLOWUP_SENT' ? (
                          <span className="text-[11px] text-zinc-600 font-bold">Follow-Up Sent</span>
                        ) : (
                          <span className="text-[11px] text-zinc-400">None</span>
                        )}
                      </td>

                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {log.status === 'QUEUED' && (
                            <button
                              onClick={() => setSelectedDraft(log)}
                              className="px-3 py-1.5 neu-btn font-bold text-xs text-zinc-900 inline-flex items-center gap-1 transition-all"
                            >
                              <span>Review & Send</span>
                              <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {log.status === 'SENT' && log.followUpStatus !== 'FOLLOWUP_SENT' && (
                            <button
                              onClick={() => handleOpenFollowUpModal(log)}
                              className="px-3 py-1.5 neu-btn font-bold text-xs text-zinc-900 inline-flex items-center gap-1 transition-all"
                            >
                              <Repeat className="w-3.5 h-3.5" />
                              <span>{log.followUpStatus === 'FOLLOWUP_QUEUED' ? 'Edit Follow-Up' : 'Schedule Follow-Up'}</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

      </main>

      {/* Review & Send Cold Email Modal */}
      {selectedDraft && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/40 backdrop-blur-md">
          <div className="neu-card max-w-2xl w-full p-6 relative border border-black/10 bg-[#f7f8fa]">
            
            <h3 className="text-base font-bold text-zinc-900 mb-0.5 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-zinc-900" />
              Review Gemini Cold Email Draft
            </h3>
            <p className="text-xs text-zinc-500 mb-5 font-normal">
              Tailored specifically to your writing tone and candidate resume.
            </p>

            {modalSuccess ? (
              <div className="p-8 text-center text-zinc-900 font-bold flex flex-col items-center gap-3">
                <CheckCircle className="w-10 h-10 text-zinc-900 animate-bounce" />
                <span>{modalSuccess}</span>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-[11px] font-medium text-zinc-600 uppercase tracking-wider mb-1">
                    Recipient Recruiter
                  </label>
                  <input
                    type="text"
                    disabled
                    value={`${selectedDraft.recipientEmail} (${selectedDraft.company})`}
                    className="w-full px-3.5 py-2 neu-input text-zinc-900 text-xs font-mono font-medium"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-zinc-600 uppercase tracking-wider mb-1">
                    Email Subject Line
                  </label>
                  <input
                    type="text"
                    value={selectedDraft.subject}
                    onChange={(e) => setSelectedDraft({ ...selectedDraft, subject: e.target.value })}
                    className="w-full px-3.5 py-2.5 neu-input text-xs font-bold text-zinc-900"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-zinc-600 uppercase tracking-wider mb-1">
                    Email Body
                  </label>
                  <textarea
                    rows={8}
                    value={selectedDraft.emailBody}
                    onChange={(e) => setSelectedDraft({ ...selectedDraft, emailBody: e.target.value })}
                    className="w-full p-3.5 neu-input text-xs text-zinc-800 leading-relaxed font-normal"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-3.5 border-t border-black/5">
                  <button
                    onClick={() => setSelectedDraft(null)}
                    className="px-4 py-2 neu-btn text-zinc-700 text-xs font-semibold transition-all"
                  >
                    Cancel
                  </button>

                  <button
                    onClick={() => handleApproveAndSend(selectedDraft.id)}
                    disabled={sendingModal}
                    className="px-5 py-2 neu-btn-primary font-bold text-xs flex items-center gap-2 transition-all disabled:opacity-50"
                  >
                    <Send className="w-3.5 h-3.5" />
                    {sendingModal ? 'Delivering via Gmail...' : 'Approve & Send Now'}
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      )}

      {/* Schedule Follow-Up Modal */}
      {followUpLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/40 backdrop-blur-md">
          <div className="neu-card max-w-2xl w-full p-6 relative border border-black/10 bg-[#f7f8fa]">
            
            <h3 className="text-base font-bold text-zinc-900 mb-0.5 flex items-center gap-2">
              <Repeat className="w-4 h-4 text-zinc-900" />
              Schedule Recruiter Follow-Up Engine
            </h3>
            <p className="text-xs text-zinc-500 mb-5 font-normal">
              Select delay timing and review the Gemini-generated follow-up draft.
            </p>

            {followUpSuccess ? (
              <div className="p-8 text-center text-zinc-900 font-bold flex flex-col items-center gap-3">
                <CheckCircle className="w-10 h-10 text-zinc-900 animate-bounce" />
                <span>{followUpSuccess}</span>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-[11px] font-medium text-zinc-600 uppercase tracking-wider mb-1">
                    Select Follow-Up Schedule Delay
                  </label>
                  <div className="flex gap-3">
                    {[3, 5, 7, 14].map((d) => (
                      <button
                        type="button"
                        key={d}
                        onClick={() => setFollowUpDays(d)}
                        className={`flex-1 py-2 rounded-xl text-xs transition-all ${
                          followUpDays === d ? 'neu-btn-active font-bold text-zinc-900' : 'neu-btn text-zinc-600'
                        }`}
                      >
                        {d} Days Later
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-zinc-600 uppercase tracking-wider mb-1">
                    Follow-Up Subject Line
                  </label>
                  <input
                    type="text"
                    value={followUpSubject}
                    onChange={(e) => setFollowUpSubject(e.target.value)}
                    className="w-full px-3.5 py-2.5 neu-input text-xs font-bold text-zinc-900"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-zinc-600 uppercase tracking-wider mb-1">
                    Follow-Up Email Body (Gemini Auto-Drafted)
                  </label>
                  <textarea
                    rows={6}
                    value={followUpBody}
                    onChange={(e) => setFollowUpBody(e.target.value)}
                    className="w-full p-3.5 neu-input text-xs text-zinc-800 leading-relaxed font-normal"
                  />
                </div>

                <div className="flex items-center justify-between pt-3.5 border-t border-black/5">
                  <button
                    onClick={() => handleSendFollowUpNow()}
                    disabled={schedulingFollowUp}
                    className="px-4 py-2 neu-btn text-zinc-900 text-xs font-bold transition-all flex items-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Send Follow-Up Right Now</span>
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setFollowUpLog(null)}
                      className="px-4 py-2 neu-btn text-zinc-700 text-xs font-semibold transition-all"
                    >
                      Cancel
                    </button>

                    <button
                      onClick={handleScheduleFollowUp}
                      disabled={schedulingFollowUp}
                      className="px-5 py-2 neu-btn-primary font-bold text-xs flex items-center gap-2 transition-all disabled:opacity-50"
                    >
                      <Calendar className="w-3.5 h-3.5" />
                      {schedulingFollowUp ? 'Scheduling...' : 'Save Schedule'}
                    </button>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
}
