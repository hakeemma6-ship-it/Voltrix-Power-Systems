/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  Bot, Send, Volume2, VolumeX, RefreshCw,
  ShieldCheck, X, MessageSquare, Phone,
  Paperclip, FileText, CheckCircle2, User, Mail,
  MapPin, ChevronDown, ChevronUp, ArrowRight,
  Lock, Plus, Trash2, Menu, Zap, Cpu, Sun
} from 'lucide-react';

/* ─────────────────────────────────────────────
   TYPES
───────────────────────────────────────────── */
interface SizingRecommendation {
  productType: string;
  connectedLoadKw: number;
  calculatedKva: number;
  cushionAppliedPercent: number;
  requiredKvaOrCapacity: number;
  recommendedModelRating: string;
  coolingRecommendation?: string;
  phaseAndVoltageDetails: string;
  formulasUsed: string[];
  billOfMaterials: string[];
  technicalNotes: string;
}

interface Message {
  role: 'user' | 'model';
  text: string;
  recommendation?: SizingRecommendation;
  fileAttachment?: { name: string; type: string };
  isStreaming?: boolean;
}

/* ─────────────────────────────────────────────
   MARKDOWN RENDERER
───────────────────────────────────────────── */
function parseInline(text: string, cursor?: boolean): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  let idx = 0;
  const re = /(\*\*|`)(.*?)\1/g;
  let m;
  while ((m = re.exec(text)) !== null) {
    if (m.index > idx) parts.push(text.substring(idx, m.index));
    if (m[1] === '**') parts.push(<strong key={m.index} className="font-semibold text-slate-900">{m[2]}</strong>);
    else parts.push(<code key={m.index} className="px-1.5 py-0.5 rounded-md bg-emerald-50 border border-emerald-100 font-mono text-emerald-700 text-[11px]">{m[2]}</code>);
    idx = re.lastIndex;
  }
  if (idx < text.length) parts.push(text.substring(idx));
  if (cursor) parts.push(<span key="cur" className="inline-block w-[3px] h-[14px] ml-0.5 bg-emerald-500 animate-pulse rounded-sm align-middle" />);
  return parts;
}

function Markdown({ text, isStreaming }: { text: string; isStreaming?: boolean }) {
  if (!text) return isStreaming ? <span className="inline-block w-[3px] h-[14px] bg-emerald-500 animate-pulse rounded-sm align-middle" /> : null;

  type BType = 'p' | 'h1' | 'h2' | 'h3' | 'ul' | 'ol' | 'code';
  const blocks: { type: BType; lines: string[] }[] = [];
  let cur: { type: BType; lines: string[] } | null = null;

  for (const raw of text.split('\n')) {
    const t = raw.trim();
    if (t.startsWith('```')) { cur = cur?.type === 'code' ? (cur = null) : (blocks.push(cur = { type: 'code', lines: [] }), cur); continue; }
    if (cur?.type === 'code') { cur.lines.push(raw); continue; }
    if (t.startsWith('# '))  { blocks.push({ type: 'h1', lines: [t.slice(2)] }); cur = null; continue; }
    if (t.startsWith('## ')) { blocks.push({ type: 'h2', lines: [t.slice(3)] }); cur = null; continue; }
    if (t.startsWith('### ')){ blocks.push({ type: 'h3', lines: [t.slice(4)] }); cur = null; continue; }
    const bm = raw.match(/^(\s*)([*\-•])\s+(.*)/);
    if (bm) { cur?.type === 'ul' ? cur.lines.push(bm[3]) : blocks.push(cur = { type: 'ul', lines: [bm[3]] }); continue; }
    const om = raw.match(/^(\s*)\d+\.\s+(.*)/);
    if (om) { cur?.type === 'ol' ? cur.lines.push(om[2]) : blocks.push(cur = { type: 'ol', lines: [om[2]] }); continue; }
    if (t === '') { cur = null; continue; }
    cur?.type === 'p' ? cur.lines.push(raw) : blocks.push(cur = { type: 'p', lines: [raw] });
  }

  return (
    <div className="space-y-2.5 text-[13px] leading-relaxed text-slate-700">
      {blocks.map((b, i) => {
        const last = i === blocks.length - 1;
        if (b.type === 'h1') return <h1 key={i} className="text-lg font-bold text-slate-900 mt-3 mb-1">{parseInline(b.lines[0], isStreaming && last)}</h1>;
        if (b.type === 'h2') return <h2 key={i} className="text-base font-semibold text-slate-900 mt-2.5 mb-1">{parseInline(b.lines[0], isStreaming && last)}</h2>;
        if (b.type === 'h3') return <h3 key={i} className="text-sm font-semibold text-slate-800 mt-2 mb-0.5">{parseInline(b.lines[0], isStreaming && last)}</h3>;
        if (b.type === 'ul') return <ul key={i} className="list-disc pl-5 space-y-1 text-slate-600">{b.lines.map((l, j) => <li key={j}>{parseInline(l, isStreaming && last && j === b.lines.length - 1)}</li>)}</ul>;
        if (b.type === 'ol') return <ol key={i} className="list-decimal pl-5 space-y-1 text-slate-600">{b.lines.map((l, j) => <li key={j}>{parseInline(l, isStreaming && last && j === b.lines.length - 1)}</li>)}</ol>;
        if (b.type === 'code') return <pre key={i} className="p-3 rounded-xl bg-slate-900 text-emerald-400 font-mono text-xs overflow-x-auto my-2"><code>{b.lines.join('\n')}</code></pre>;
        return <p key={i} className="whitespace-pre-wrap">{parseInline(b.lines.join('\n'), isStreaming && last)}</p>;
      })}
    </div>
  );
}

/* ─────────────────────────────────────────────
   FLOATING CHAT BUBBLE (stub)
───────────────────────────────────────────── */
export function FloatingChatBubble() { return null; }

/* ─────────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────────── */
export function DedicatedAiSupport({
  activeSession, onNavigate, hideSidebarOnPc = false
}: { activeSession: any; onNavigate?: (h: string) => void; key?: string; hideSidebarOnPc?: boolean }) {

  /* ── local storage key ── */
  const storageKey = `voltrix_ai_chat_public_${activeSession?.email ? String(activeSession.email).replace(/[^a-zA-Z0-9]/g, '_') : 'guest'}`;

  /* ── state ── */
  const [messages, setMessages] = useState<Message[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(storageKey);
        if (saved) return JSON.parse(saved);
      } catch (e) {
        console.warn('Failed to load local chat messages', e);
      }
    }
    return [];
  });
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [safetyBanner, setSafetyBanner] = useState(false);
  const [attachedFile, setAttachedFile] = useState<{ name: string; type: string } | null>(null);
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(false);
  const [expandedSizing, setExpandedSizing] = useState<number | null>(null);
  const [leadForm, setLeadForm] = useState<{
    show: boolean; product: string; capacity: string;
    name: string; email: string; phone: string; city: string;
    submitting: boolean; submitted: boolean; refId?: string;
  }>({ show: false, product: '', capacity: '', name: '', email: '', phone: '', city: '', submitting: false, submitted: false });

  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  /* ── auth headers ── */
  const authHeaders = (): Record<string, string> => {
    if (typeof window === 'undefined') return {};
    const t = localStorage.getItem('voltrix_auth_token');
    return t ? { Authorization: `Bearer ${t}` } : {};
  };

  /* ── synchronize messages to localStorage ── */
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        if (messages.length > 0) {
          localStorage.setItem(storageKey, JSON.stringify(messages));
        }
      } catch (e) {
        console.warn('Failed to save chat locally', e);
      }
    }
  }, [messages, storageKey]);

  /* ── reload chat if active session changes ── */
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(storageKey);
        setMessages(saved ? JSON.parse(saved) : []);
      } catch {
        setMessages([]);
      }
    }
  }, [storageKey]);

  /* ── scroll to bottom ── */
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, isLoading, leadForm.show]);

  /* ── auto-resize textarea ── */
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 160) + 'px';
  }, [input]);

  /* ── cleanup TTS ── */
  useEffect(() => () => { window.speechSynthesis?.cancel(); }, []);

  /* ── actions: start fresh new chat ── */
  const createNewChat = () => {
    setMessages([]);
    setInput('');
    setSafetyBanner(false);
    setAttachedFile(null);
    setExpandedSizing(null);
    window.speechSynthesis?.cancel();
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem(storageKey);
      } catch (e) {
        console.warn('Failed to remove local chat', e);
      }
    }
  };

  const toggleVoice = () => {
    setIsVoiceEnabled(v => { if (v) window.speechSynthesis?.cancel(); return !v; });
  };

  const openLeadForm = (product: string, capacity: string) =>
    setLeadForm({ show: true, product, capacity, name: '', email: '', phone: '', city: '', submitting: false, submitted: false });

  const closeLeadForm = () => setLeadForm(f => ({ ...f, show: false }));

  /* ── lead form submit ── */
  const submitLeadForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setLeadForm(f => ({ ...f, submitting: true }));
    try {
      const res = await fetch('/api/inquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: leadForm.name, email: leadForm.email, phone: leadForm.phone,
          location: leadForm.city, productInterest: leadForm.product,
          subject: `AI Sizing Quote Request (${leadForm.capacity})`,
          message: `Sized Capacity: ${leadForm.capacity}\nSized Product: ${leadForm.product}`
        })
      });
      const obj = res.ok ? await res.json() : {};
      const refId = obj.id || `inq_${Date.now()}`;
      setLeadForm(f => ({ ...f, submitting: false, submitted: true, refId }));
      setMessages(prev => [...prev, {
        role: 'model',
        text: `### Quotation Request Registered\n\nYour specifications have been logged under reference **\`${refId}\`**.\n\nOur authorized partner for **${leadForm.city || 'your region'}** will send a formal pricing proposal shortly.`
      }]);
    } catch {
      const refId = `inq_${Date.now()}`;
      setLeadForm(f => ({ ...f, submitting: false, submitted: true, refId }));
    }
  };

  /* ── send message ── */
  const handleSend = async (e?: React.FormEvent, custom?: string) => {
    e?.preventDefault();
    const text = custom || input;
    if (!text.trim() || isLoading) return;
    setInput(''); setSafetyBanner(false);

    const priceQuery = /price|cost|quot|discount|how much|dealership/i.test(text);
    if (priceQuery) setSafetyBanner(true);

    const fileSnap = attachedFile ? { ...attachedFile } : undefined;
    setAttachedFile(null);

    const userMsg: Message = { role: 'user', text, fileAttachment: fileSnap };
    const newMsgs = [...messages, userMsg];
    setMessages(newMsgs);
    setIsLoading(true);

    try {
      const promptText = fileSnap ? `${text}\n[Attached: ${fileSnap.name} (${fileSnap.type})]` : text;
      const apiMsgs = newMsgs.map((m, i) => ({ role: m.role, text: i === newMsgs.length - 1 ? promptText : m.text }));

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ messages: apiMsgs })
      });

      if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`);

      const streamIdx = newMsgs.length;
      setMessages(p => [...p, { role: 'model', text: '', isStreaming: true }]);

      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let acc = '', displayed = '', done = false, citations: any[] = [], rec: any = null;

      const ticker = setInterval(() => {
        const lag = acc.length - displayed.length;
        if (lag > 0) {
          displayed = acc.slice(0, displayed.length + (lag > 250 ? 6 : lag > 120 ? 4 : lag > 50 ? 2 : 1));
          setMessages(p => { const u = [...p]; if (u[streamIdx]) u[streamIdx] = { ...u[streamIdx], text: displayed }; return u; });
          if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        } else if (done) {
          clearInterval(ticker);
          setMessages(p => { const u = [...p]; if (u[streamIdx]) u[streamIdx] = { ...u[streamIdx], isStreaming: false, text: acc, recommendation: rec || undefined }; return u; });
          setIsLoading(false);
        }
      }, 30);

      try {
        while (true) {
          const { value, done: d } = await reader.read();
          if (d) break;
          for (const line of dec.decode(value).split('\n')) {
            if (!line.trim().startsWith('data: ')) continue;
            try {
              const data = JSON.parse(line.trim().slice(6));
              if (data.text) acc += data.text;
              if (data.citations) citations = data.citations;
              if (data.recommendation) rec = data.recommendation;
              if (data.done) break;
            } catch {}
          }
        }
      } finally { done = true; }

    } catch (err: any) {
      const isCustomer = activeSession?.role === 'customer';
      const maintenanceMsg = isCustomer
        ? "AI is under Maintainance. For more queries contact our manual customer care support team:\n\n📞 +91 90323 72136\n📞 +91 73867 10160\n✉️ voltrixpowersystems@gmail.com\n\n[YouTube](https://www.youtube.com/@VoltrixPowerSystems) | [Facebook](https://www.facebook.com/profile.php?id=61592899555120) | [Instagram](https://www.instagram.com/voltrixpowersystems/)"
        : "AI is in Maintainance and it will be fixed soon.";

      setMessages(p => [...p, { role: 'model', text: maintenanceMsg }]);
      setIsLoading(false);
    }
  };

  /* ────────────────────────────────────────────
     AUTH WALL
  ──────────────────────────────────────────── */
  if (!activeSession) {
    return (
      <div className="h-full flex items-center justify-center bg-slate-50 p-6">
        <div className="relative max-w-sm w-full bg-white border border-slate-200 rounded-2xl p-8 text-center shadow-lg overflow-hidden">
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-500" />
          <div className="mx-auto h-14 w-14 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 mb-5">
            <Lock className="h-7 w-7 stroke-[1.8]" />
          </div>
          <h2 className="text-lg font-bold text-slate-900 mb-2">Sign in to continue</h2>
          <p className="text-slate-500 text-sm mb-6">Access to Voltrix AI is restricted to authenticated partners and accounts.</p>
          <button
            onClick={() => onNavigate ? onNavigate('#login') : (window.location.hash = '#login')}
            className="w-full flex items-center justify-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm rounded-xl transition-colors cursor-pointer"
          >
            Sign In <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  }

  /* ────────────────────────────────────────────
     QUICK PROMPTS
  ──────────────────────────────────────────── */
  const quickPrompts = [
    { icon: Zap,  label: 'Size CNC Stabilizer',      text: 'Size a three-phase 15 kW air-cooled servo stabilizer for a CNC milling machine.' },
    { icon: Cpu,  label: 'MRI / Hospital UPS',        text: 'What online UPS model should I install for a 50 kW medical MRI scanner with zero transfer time?' },
    { icon: Sun,  label: 'Solar Hybrid System',       text: 'Size a hybrid solar net-metering system for a 10 kW commercial warehouse load in Hyderabad.' },
    { icon: Zap,  label: 'Textile Mill Stabilizer',   text: 'Recommend a servo stabilizer for a 100 kVA three-phase textile mill with heavy voltage fluctuations.' },
    { icon: Cpu,  label: 'Data Center UPS',           text: 'What UPS system with battery backup should I use for a 30 kW server room datacenter?' },
    { icon: Sun,  label: 'Battery Backup Sizing',     text: 'How many tubular batteries do I need for 4 hours of backup for a 5 kW office load?' },
  ];

  /* ────────────────────────────────────────────
     USER AVATAR INITIALS
  ──────────────────────────────────────────── */
  const userInitials = activeSession?.email
    ? activeSession.email.substring(0, 2).toUpperCase()
    : activeSession?.name?.substring(0, 2).toUpperCase() || 'US';

  const displayName = activeSession?.name
    || activeSession?.email?.split('@')[0]
    || 'Partner';

  /* ────────────────────────────────────────────
     RENDER
  ──────────────────────────────────────────── */
  return (
    <div className={`${hideSidebarOnPc ? 'h-full' : 'h-[calc(100dvh-4rem)]'} flex bg-white font-sans overflow-hidden w-full`}>

      {/* ══════════════════════════════════════
          MAIN PANEL (Full width, no history sidebar)
      ══════════════════════════════════════ */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-slate-50 w-full">

        {/* ── Top header bar ── */}
        <header className="shrink-0 bg-white border-b border-slate-100 px-4 sm:px-6 h-14 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="h-7 w-7 rounded-lg bg-emerald-600 flex items-center justify-center shrink-0 shadow-xs">
              <Bot className="h-4 w-4 text-white stroke-[2]" />
            </div>
            <div className="leading-tight">
              <p className="text-sm font-semibold text-slate-900 leading-none">Voltrix AI</p>
              <p className="text-[10px] text-slate-400 leading-none mt-0.5">Power Solutions Assistant</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={createNewChat}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-all cursor-pointer border border-slate-200 shadow-xs active:scale-95"
              title="Start a fresh conversation and wipe current chat"
            >
              <Plus className="h-3.5 w-3.5 text-emerald-600" />
              <span>New Chat</span>
            </button>
            <button
              onClick={toggleVoice}
              title={isVoiceEnabled ? 'TTS enabled' : 'TTS disabled'}
              className={`p-2 rounded-xl transition-colors cursor-pointer border border-slate-200 ${isVoiceEnabled ? 'text-emerald-600 bg-emerald-50 border-emerald-200' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'}`}
            >
              {isVoiceEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
            </button>
          </div>
        </header>

        {/* ── Safety banner ── */}
        {safetyBanner && (
          <div className="shrink-0 bg-amber-50 border-b border-amber-100 px-4 py-2.5 flex items-start justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <ShieldCheck className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
              <p className="text-xs text-amber-800 leading-relaxed">
                <span className="font-semibold">Pricing note:</span> Estimates vary by cable length, earth resistance, and load duty cycles. Use <span className="font-semibold">Lock Spec</span> on sizing cards to request a formal quotation.
              </p>
            </div>
            <button onClick={() => setSafetyBanner(false)} className="text-amber-500 hover:text-amber-700 cursor-pointer shrink-0 mt-0.5">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {/* ── Message viewport ── */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto">

          {/* EMPTY STATE */}
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center px-6 py-12 text-center select-none max-w-2xl mx-auto w-full">
              <div className="h-14 w-14 rounded-2xl bg-emerald-600 flex items-center justify-center mb-6 shadow-lg shadow-emerald-200">
                <Bot className="h-7 w-7 text-white stroke-[1.8]" />
              </div>
              <h2 className="text-2xl font-semibold text-slate-900 tracking-tight mb-2">
                How can I help you today?
              </h2>
              <p className="text-sm text-slate-500 mb-8 max-w-sm">
                Ask about load sizing, product selection, technical specifications, or request a quotation for any power system.
              </p>

              {/* Quick prompt cards */}
              <div className="grid grid-cols-2 gap-2 w-full max-w-lg">
                {quickPrompts.map(({ icon: Icon, label, text }) => (
                  <button
                    key={label}
                    onClick={() => handleSend(undefined, text)}
                    className="flex items-center gap-2.5 px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-left hover:border-emerald-300 hover:bg-emerald-50/50 hover:shadow-sm transition-all cursor-pointer group"
                  >
                    <div className="p-1.5 rounded-lg bg-slate-100 group-hover:bg-emerald-100 transition-colors shrink-0">
                      <Icon className="h-3.5 w-3.5 text-slate-500 group-hover:text-emerald-600 transition-colors" />
                    </div>
                    <span className="text-[11px] font-medium text-slate-600 group-hover:text-slate-900 leading-tight">{label}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            /* CONVERSATION */
            <div className="max-w-3xl mx-auto w-full px-4 py-6 space-y-6">
              {messages.map((m, i) => {
                const isUser = m.role === 'user';
                return (
                  <div key={i} className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}>
                    {/* AI avatar */}
                    {!isUser && (
                      <div className="h-8 w-8 rounded-lg bg-emerald-600 flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                        <Bot className="h-4 w-4 text-white stroke-[2]" />
                      </div>
                    )}

                    <div className={`flex flex-col gap-1 ${isUser ? 'items-end max-w-[78%]' : 'items-start flex-1 min-w-0'}`}>
                      {/* Bubble */}
                      {isUser ? (
                        <div className="bg-emerald-600 text-white px-4 py-2.5 rounded-2xl rounded-tr-sm text-sm leading-relaxed">
                          <p className="whitespace-pre-wrap font-medium !text-white">{m.text}</p>
                          {m.fileAttachment && (
                            <div className="mt-2 flex items-center gap-1.5 bg-emerald-700/40 rounded-lg px-2.5 py-1.5 text-[11px] text-emerald-100">
                              <FileText className="h-3.5 w-3.5 shrink-0" />
                              <span className="truncate max-w-[160px] font-medium">{m.fileAttachment.name}</span>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="bg-white border border-slate-100 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm w-full">
                          <Markdown text={m.text} isStreaming={m.isStreaming} />
                        </div>
                      )}

                      {/* Sizing card */}
                      {!isUser && m.recommendation && (
                        <div className="w-full mt-2 bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-md">
                          {/* Card header */}
                          <div className="bg-slate-900 px-4 py-3.5 flex items-center justify-between">
                            <div>
                              <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">Sizing Complete</span>
                              <p className="text-sm font-semibold text-white mt-0.5">{m.recommendation.productType}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-[10px] text-slate-400 uppercase tracking-wide">Rated Capacity</p>
                              <p className="text-base font-bold text-emerald-400 font-mono">{m.recommendation.recommendedModelRating}</p>
                            </div>
                          </div>

                          {/* Params grid */}
                          <div className="grid grid-cols-2 gap-px bg-slate-100">
                            {[
                              { label: 'Base Load', value: `${m.recommendation.connectedLoadKw} kW / ${m.recommendation.calculatedKva} kVA` },
                              { label: 'Safety Margin', value: `${m.recommendation.cushionAppliedPercent}%` },
                              { label: 'Cooling', value: m.recommendation.coolingRecommendation || 'Natural Convection' },
                              { label: 'Phase & Voltage', value: m.recommendation.phaseAndVoltageDetails },
                            ].map(({ label, value }) => (
                              <div key={label} className="bg-white px-4 py-3">
                                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">{label}</p>
                                <p className="text-xs font-semibold text-slate-800 mt-0.5 leading-snug truncate" title={value}>{value}</p>
                              </div>
                            ))}
                          </div>

                          {/* BOM accordion */}
                          <div className="border-t border-slate-100">
                            <button
                              onClick={() => setExpandedSizing(expandedSizing === i ? null : i)}
                              className="w-full flex items-center justify-between px-4 py-2.5 text-xs text-slate-500 hover:bg-slate-50 transition-colors cursor-pointer"
                            >
                              <span className="font-medium">Formulas & Bill of Materials</span>
                              {expandedSizing === i ? <ChevronUp className="h-4 w-4 text-emerald-600" /> : <ChevronDown className="h-4 w-4" />}
                            </button>
                            {expandedSizing === i && (
                              <div className="px-4 pb-4 space-y-4 border-t border-slate-100">
                                <div className="pt-3">
                                  <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider mb-2">Safety Calculations</p>
                                  <ul className="space-y-1">
                                    {m.recommendation.formulasUsed.map((f, j) => (
                                      <li key={j} className="text-[11px] text-slate-600 font-mono bg-slate-50 px-2.5 py-1.5 rounded-lg">{f}</li>
                                    ))}
                                  </ul>
                                </div>
                                <div>
                                  <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider mb-2">Bill of Materials</p>
                                  <ul className="space-y-1">
                                    {m.recommendation.billOfMaterials.map((b, j) => (
                                      <li key={j} className="text-[11px] text-slate-600 flex items-start gap-2">
                                        <span className="text-emerald-500 mt-0.5 shrink-0">•</span>{b}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Card footer CTA */}
                          <div className="border-t border-slate-100 px-4 py-3 flex items-center justify-between bg-slate-50/60">
                            <p className="text-[11px] text-slate-500">Ready for CRM sync</p>
                            <button
                              onClick={() => openLeadForm(m.recommendation!.productType, m.recommendation!.recommendedModelRating)}
                              className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer shadow-sm"
                            >
                              Lock Spec & Request Quote <ArrowRight className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* User avatar */}
                    {isUser && (
                      <div className="h-8 w-8 rounded-lg bg-slate-200 flex items-center justify-center text-slate-600 text-xs font-bold shrink-0 mt-0.5">
                        {userInitials}
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Typing indicator */}
              {isLoading && (
                <div className="flex gap-3">
                  <div className="h-8 w-8 rounded-lg bg-emerald-600 flex items-center justify-center shrink-0 shadow-sm">
                    <Bot className="h-4 w-4 text-white stroke-[2]" />
                  </div>
                  <div className="bg-white border border-slate-100 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm flex items-center gap-2">
                    <div className="flex gap-1">
                      <span className="h-2 w-2 rounded-full bg-emerald-400 animate-[bounce_1.2s_infinite_0ms]" />
                      <span className="h-2 w-2 rounded-full bg-emerald-400 animate-[bounce_1.2s_infinite_150ms]" />
                      <span className="h-2 w-2 rounded-full bg-emerald-400 animate-[bounce_1.2s_infinite_300ms]" />
                    </div>
                    <span className="text-[11px] text-slate-400 font-medium">Analysing…</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Input area ── */}
        <div className="shrink-0 bg-white border-t border-slate-100 px-4 pt-3 pb-3 lg:pb-3">
          <div className="max-w-3xl mx-auto w-full space-y-2">

            {/* Attached file chip */}
            {attachedFile && (
              <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2 w-fit">
                <FileText className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                <span className="text-xs font-medium text-emerald-800 truncate max-w-[200px]">{attachedFile.name}</span>
                <button onClick={() => setAttachedFile(null)} className="text-emerald-400 hover:text-emerald-700 cursor-pointer ml-1">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            )}

            {/* Input box */}
            <form onSubmit={handleSend} className="flex items-end gap-2 bg-white border border-slate-200 rounded-2xl px-3 py-2.5 shadow-sm focus-within:border-emerald-400 focus-within:ring-2 focus-within:ring-emerald-100 transition-all">
              <input
                type="file"
                ref={fileInputRef}
                onChange={e => { const f = e.target.files?.[0]; if (f) setAttachedFile({ name: f.name, type: f.type || 'application/octet-stream' }); }}
                className="hidden"
                accept=".txt,.pdf,.png,.jpg,.jpeg,.doc,.docx,.xls,.xlsx"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                title="Attach specification sheet"
                className={`p-1.5 rounded-lg transition-colors cursor-pointer shrink-0 mb-0.5 ${attachedFile ? 'text-emerald-600 bg-emerald-50' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'}`}
              >
                <Paperclip className="h-4 w-4" />
              </button>

              <textarea
                ref={textareaRef}
                rows={1}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                placeholder="Ask anything..."
                className="flex-1 bg-transparent text-sm text-slate-800 placeholder-slate-400 resize-none focus:outline-none py-0.5 "
              />

              <button
                type="submit"
                disabled={(!input.trim() && !attachedFile) || isLoading}
                className="h-8 w-8 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-100 disabled:text-slate-300 text-white flex items-center justify-center transition-colors cursor-pointer shrink-0 mb-0.5"
              >
                <Send className="h-3.5 w-3.5 stroke-[2.5]" />
              </button>
            </form>

            <p className="text-[10px] text-slate-300 text-center">
              Voltrix AI may make errors. Verify safety-critical ratings with a certified engineer.
            </p>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════
          LEAD FORM MODAL
      ══════════════════════════════════════ */}
      {leadForm.show && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 w-full max-w-md shadow-2xl overflow-hidden">
            {/* Modal header */}
            <div className="relative px-6 pt-6 pb-4 border-b border-slate-100">
              <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-500" />
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-base font-semibold text-slate-900">Request Formal Quote</h3>
                  <p className="text-xs text-slate-500 mt-0.5">AI-generated sizing data will be attached automatically</p>
                </div>
                <button onClick={closeLeadForm} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer transition-colors">
                  <X className="h-4 w-4" />
                </button>
              </div>
              {/* Pre-filled spec chips */}
              <div className="flex gap-2 mt-3">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 rounded-lg text-[11px] font-medium text-slate-600">
                  <Cpu className="h-3 w-3 text-emerald-600" />{leadForm.product}
                </span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 border border-emerald-100 rounded-lg text-[11px] font-semibold text-emerald-700">
                  {leadForm.capacity}
                </span>
              </div>
            </div>

            {leadForm.submitted ? (
              <div className="px-6 py-8 text-center">
                <div className="h-12 w-12 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="h-6 w-6 text-emerald-600" />
                </div>
                <p className="font-semibold text-slate-900 mb-1">Request submitted</p>
                <p className="text-xs text-slate-500">Reference: <span className="font-mono text-emerald-600">{leadForm.refId}</span></p>
                <button onClick={closeLeadForm} className="mt-5 px-5 py-2 bg-slate-900 text-white text-sm font-medium rounded-xl cursor-pointer hover:bg-slate-800 transition-colors">
                  Close
                </button>
              </div>
            ) : (
              <form onSubmit={submitLeadForm} className="px-6 py-5 space-y-4">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Full Name *</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                    <input required type="text" placeholder="Your full name" value={leadForm.name}
                      onChange={e => setLeadForm(f => ({ ...f, name: e.target.value }))}
                      className="w-full pl-9 pr-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition-all placeholder-slate-400" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Email *</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                      <input required type="email" placeholder="you@company.com" value={leadForm.email}
                        onChange={e => setLeadForm(f => ({ ...f, email: e.target.value }))}
                        className="w-full pl-9 pr-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition-all placeholder-slate-400" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Phone *</label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                      <input required type="tel" placeholder="+91 98765 43210" value={leadForm.phone}
                        onChange={e => setLeadForm(f => ({ ...f, phone: e.target.value }))}
                        className="w-full pl-9 pr-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition-all placeholder-slate-400" />
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Installation City *</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                    <input required type="text" placeholder="e.g. Hyderabad" value={leadForm.city}
                      onChange={e => setLeadForm(f => ({ ...f, city: e.target.value }))}
                      className="w-full pl-9 pr-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition-all placeholder-slate-400" />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={leadForm.submitting}
                  className="w-full flex items-center justify-center gap-2 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white text-sm font-semibold rounded-xl transition-colors cursor-pointer shadow-sm"
                >
                  {leadForm.submitting ? <><RefreshCw className="h-4 w-4 animate-spin" /> Submitting…</> : <><CheckCircle2 className="h-4 w-4" /> Submit Quote Request</>}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
