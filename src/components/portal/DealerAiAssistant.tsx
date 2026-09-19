'use client';
/**
 * DealerAiAssistant — ChatGPT-inspired minimal UI layout for Voltrix Power Systems.
 * Contains:
 *  - Hamburger toggle on the top-left to slide out the Chat History sidebar.
 *  - Center "Where should we begin?" visual dashboard.
 *  - Inline/Modal interactive helpers for load calculator, B2b proposal, and cooling comparison.
 *  - Bottom input pill with "+" menu for tools, mic mock trigger, and speak visualizer.
 *  - Full responsiveness matching the requested layout across PC/Tablet/Mobile.
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Menu, Plus, Trash2, Mic, AudioLines, Send, Sparkles,
  Calculator, FileText, Layers, X, Info, AlertTriangle, Check, Copy,
  Bot, User, ArrowUp, RefreshCw, Volume2
} from 'lucide-react';

interface Message {
  id: string;
  sender: 'ai' | 'user';
  text: string;
  timestamp: string;
}

const inputCls = "w-full text-xs rounded-xl border-2 border-slate-200 bg-white text-slate-800 p-2.5 outline-none focus:border-emerald-500 transition-all font-semibold";

export default function DealerAiAssistant({ dealerSession }: { dealerSession: any }) {
  // Local storage key isolated by role and user
  const storageKey = `voltrix_ai_chat_${dealerSession?.role === 'admin' ? 'admin' : (dealerSession?.id || dealerSession?.email ? String(dealerSession?.id || dealerSession?.email).replace(/[^a-zA-Z0-9]/g, '_') : 'dealer')}`;

  // Modals / Tool States
  const [showCalc, setShowCalc] = useState(false);
  const [showProposal, setShowProposal] = useState(false);
  const [showCooling, setShowCooling] = useState(false);
  const [plusMenuOpen, setPlusMenuOpen] = useState(false);

  // AI Chat Messages State (stored only locally in localStorage, no server database history)
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
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Load Calculator States
  const [calcType, setCalcType] = useState<'hp' | 'kw' | 'amps'>('hp');
  const [calcInput, setCalcInput] = useState<number>(30);
  const [calcPhase, setCalcPhase] = useState<'1' | '3'>('3');
  const [calcEquipment, setCalcEquipment] = useState<'motor' | 'medical' | 'it' | 'standard'>('motor');
  const [calcSafety, setCalcSafety] = useState<number>(1.25);
  const [calcCopied, setCalcCopied] = useState(false);

  // Proposal Writer States
  const [propClient, setPropClient] = useState('Metro Diagnostics Center');
  const [propCapacity, setPropCapacity] = useState('120');
  const [propCooling, setPropCooling] = useState('air');
  const [propNeed, setPropNeed] = useState('Multi-slice CT Scanners & Diagnostic Suites');
  const [propLetter, setPropLetter] = useState('');
  const [letterCopied, setLetterCopied] = useState(false);

  // Mock Mic Status
  const [micState, setMicState] = useState<'idle' | 'listening'>('idle');

  // Auto-scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, chatLoading]);

  // Synchronize active chat messages to localStorage
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

  // If user session switches, reload respective chat
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

  // Start a fresh new chat: completely deletes current chat info locally
  const startNewChat = () => {
    setMessages([]);
    setChatInput('');
    setPlusMenuOpen(false);
    setMicState('idle');
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem(storageKey);
      } catch (e) {
        console.warn('Failed to remove local chat', e);
      }
    }
  };

  // Dynamic calculations logic
  const calculateResult = () => {
    let kw = 0;
    if (calcType === 'hp') {
      kw = calcInput * 0.746;
    } else if (calcType === 'kw') {
      kw = calcInput;
    } else {
      const voltage = calcPhase === '1' ? 230 : 415;
      const pf = calcEquipment === 'motor' ? 0.8 : (calcEquipment === 'it' ? 0.9 : 0.85);
      if (calcPhase === '1') {
        kw = (calcInput * voltage * pf) / 1000;
      } else {
        kw = (calcInput * voltage * 1.732 * pf) / 1000;
      }
    }

    const pf = calcEquipment === 'motor' ? 0.8 : (calcEquipment === 'it' ? 0.9 : 0.85);
    const kva = kw / pf;
    const recommendedKva = kva * calcSafety;

    return {
      kw: Math.round(kw * 100) / 100,
      kva: Math.round(kva * 100) / 100,
      recommendedKva: Math.round(recommendedKva * 10) / 10,
    };
  };

  const results = calculateResult();

  // Dynamic proposal letter generator
  const generateProposalLetter = useCallback(() => {
    const coolingText = propCooling === 'oil' ? 'Oil-Cooled Heavy Duty Industrial' : 'Air-Cooled Compact Microprocessor-controlled';
    const safetySpecs = propCooling === 'oil'
      ? '- Heavy-Duty Toroidal Variac with 99.9% Pure Copper Buck-Boost Transformers\n- Natural convection heat dissipation conforming to IS-335 standards\n- Ideal for harsh, dusty industrial setups and outdoor installations'
      : '- DSP microcontroller board with state-of-the-art solid-state sensing\n- Silent high-volume fan cooling on heavy-duty aluminum heat sinks\n- Compact physical footprint optimized for indoor medical labs or server closets';

    const letter = `Dear Director of Facility Operations,

Thank you for giving Voltrix Power Systems the opportunity to submit our proposal for the power quality regulation requirements of ${propClient}.

We are pleased to quote our flagship Voltrix ${propCapacity} kVA ${coolingText} Servo Stabilizer, engineered specifically for safeguarding your critical ${propNeed || 'machinery'}.

Key Technical Capabilities of the Recommended Voltrix System:
${safetySpecs}
- Output Voltage Regulation Accuracy: ±1% with system efficiency >98.5%
- Microprocessor DSP Controller with real-time digital backlit LCD display
- High-surge handling capabilites (sustains up to 300% starting current load)
- Protections: Instant Low/High Voltage cutoff, Overload, and short-circuit trip
- Factory Warranty: 12 Months comprehensive manufacturer warranty

Please find our detailed corporate quotation details attached. We look forward to powering your operations with stable voltage.

Best Regards,
Voltrix Technical Partner Desk`;
    setPropLetter(letter);
  }, [propClient, propCapacity, propCooling, propNeed]);

  useEffect(() => {
    generateProposalLetter();
  }, [generateProposalLetter]);

  // Chat message submit
  const handleSend = async (textToSend?: string) => {
    const query = (textToSend || chatInput).trim();
    if (!query || chatLoading) return;

    const userMsg: Message = {
      id: `u_${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const updatedWithUser = [...messages, userMsg];
    setMessages(updatedWithUser);
    if (!textToSend) setChatInput('');
    setChatLoading(true);
    setPlusMenuOpen(false);

    const aiMsgId = `ai_${Date.now()}`;
    const aiMsg: Message = {
      id: aiMsgId,
      sender: 'ai',
      text: '',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages(prev => [...prev, aiMsg]);

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('voltrix_auth_token') : '';

      const apiMsgs = updatedWithUser.map(m => ({
        role: m.sender === 'user' ? 'user' : 'model',
        text: m.text
      }));

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ messages: apiMsgs }),
      });

      if (!res.ok || !res.body) {
        throw new Error(`HTTP ${res.status}`);
      }

      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let acc = '';

      while (true) {
        const { value, done: d } = await reader.read();
        if (d) break;

        const decoded = dec.decode(value);
        for (const line of decoded.split('\n')) {
          if (!line.trim().startsWith('data: ')) continue;
          try {
            const data = JSON.parse(line.trim().slice(6));
            if (data.text) {
              acc += data.text;
              setMessages(prev =>
                prev.map(m => m.id === aiMsgId ? { ...m, text: acc } : m)
              );
            }
            if (data.done) break;
          } catch { }
        }
      }

      setMessages(prev => {
        const finalMessages = prev.map(m => m.id === aiMsgId ? { ...m, text: acc || "No response received." } : m);
        return finalMessages;
      });

    } catch (err: any) {
      console.warn("Real AI chat failed, falling back to local simulation:", err);
      const fallbackText = generateFallbackAiReply(query);
      setMessages(prev => {
        const finalMessages = prev.map(m => m.id === aiMsgId ? { ...m, text: fallbackText } : m);
        return finalMessages;
      });
    } finally {
      setChatLoading(false);
    }
  };

  // Mock Mic Processing
  const handleMicClick = () => {
    if (micState === 'listening') {
      setMicState('idle');
      return;
    }
    setMicState('listening');
    setChatInput('Listening...');
    setTimeout(() => {
      setChatInput('What is the recommended kVA safety buffer factor for a 45 HP elevator induction motor?');
      setMicState('idle');
    }, 2800);
  };

  const copyToClipboard = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="flex-grow flex min-h-0 bg-[#F8FAFC] relative overflow-hidden font-sans w-full">

      {/* MAIN CHAT AREA (Full width, no history sidebar) */}
      <div className="flex-grow flex flex-col min-h-0 relative bg-white w-full">

        {/* Top Navbar Header */}
        <header className="h-14 border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between shrink-0 bg-white sticky top-0 z-35">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-xl bg-[#0A2342] text-white flex items-center justify-center shadow-xs">
              <Sparkles className="h-4 w-4 text-emerald-400" />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-sm uppercase tracking-tight text-[#0A2342]">Voltrix Copilot</span>
              <span className="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full font-bold border border-emerald-200 select-none">
                {dealerSession?.role === 'admin' ? 'Admin Intelligence' : 'Dealer Assistant'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={startNewChat}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-all cursor-pointer border border-slate-200 shadow-xs active:scale-95"
              title="Start a fresh conversation and wipe current chat"
            >
              <Plus className="h-3.5 w-3.5 text-emerald-600" />
              <span>New Chat</span>
            </button>
          </div>
        </header>

        {/* CHAT MESSAGES PANEL */}
        <div className="flex-grow overflow-y-auto px-4 py-6 md:p-8 space-y-6">
          {messages.length === 0 ? (
            /* CENTERED CHATGPT-STYLE "WHERE SHOULD WE BEGIN" */
            <div className="max-w-2xl mx-auto flex-grow flex flex-col justify-center items-center text-center p-4 my-auto space-y-5 md:space-y-6 select-none animate-fade-in">
              <div className="h-10 w-10 md:h-12 md:w-12 rounded-2xl bg-[#0A2342] text-emerald-455 flex items-center justify-center shadow-md animate-bounce">
                <Sparkles className="h-5 w-5 md:h-6 md:w-6" />
              </div>
              <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-800">
                Where should we begin?
              </h2>
              <p className="text-xs md:text-sm text-slate-500 max-w-md font-semibold leading-relaxed px-4 font-sans">
                Run electrical load calculations or draft B2B cover letters using the templates below, or type directly in context.
              </p>

              {/* Quick Action Templates */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 w-full max-w-xl pt-2 px-4 shadow-none">
                <button
                  onClick={() => setShowCalc(true)}
                  className="bg-white border border-slate-200 hover:border-emerald-500 rounded-2xl p-4 text-left transition-all shadow-xs hover:shadow-md cursor-pointer group"
                >
                  <div className="h-8 w-8 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center mb-3">
                    <Calculator className="h-4 w-4" />
                  </div>
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-tight group-hover:text-emerald-700">Load Sizer</h4>
                  <p className="text-xs text-slate-500 mt-1 leading-snug font-medium">Verify phase specifications & run calculators.</p>
                </button>

                <button
                  onClick={() => setShowProposal(true)}
                  className="bg-white border border-slate-200 hover:border-emerald-500 rounded-2xl p-4 text-left transition-all shadow-xs hover:shadow-md cursor-pointer group"
                >
                  <div className="h-8 w-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
                    <FileText className="h-4 w-4" />
                  </div>
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-tight group-hover:text-emerald-700">Proposal Builder</h4>
                  <p className="text-xs text-slate-505 mt-1 leading-snug font-medium">Draft formatted B2B quotation cover letters.</p>
                </button>

                <button
                  onClick={() => setShowCooling(true)}
                  className="bg-white border border-slate-200 hover:border-emerald-500 rounded-2xl p-4 text-left transition-all shadow-xs hover:shadow-md cursor-pointer group"
                >
                  <div className="h-8 w-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-3">
                    <Layers className="h-4 w-4" />
                  </div>
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-tight group-hover:text-emerald-700">Cooling Matrix</h4>
                  <p className="text-xs text-slate-505 mt-1 leading-snug font-medium">Compare compact Air vs Oil cooling method specs.</p>
                </button>
              </div>
            </div>
          ) : (
            /* SCROLLABLE CONVERSATION FEED */
            <div className="max-w-2xl mx-auto space-y-6">
              {messages.map(msg => (
                <div
                  key={msg.id}
                  className={`flex gap-4 max-w-full ${msg.sender === 'user' ? 'ml-auto flex-row-reverse' : ''}`}
                >
                  {/* Sender Avatar */}
                  <div className={`h-7 w-7 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold ${msg.sender === 'user'
                    ? 'bg-slate-100 text-slate-700'
                    : 'bg-[#0A2342] text-emerald-400'
                    }`}>
                    {msg.sender === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                  </div>

                  {/* Message Bubble */}
                  <div className={`space-y-1 max-w-[82%] ${msg.sender === 'user' ? 'text-right' : ''}`}>
                    <div className={`p-3.5 rounded-2xl text-[12px] leading-relaxed text-left text-slate-850 ${msg.sender === 'user'
                      ? 'bg-slate-100 rounded-tr-none font-medium'
                      : 'bg-white border border-slate-200 rounded-tl-none font-normal'
                      }`}>
                      {msg.text.split('\n').map((line, i) => (
                        <p key={i} className={line.startsWith('**') ? 'font-black text-slate-900 mt-1 mb-1' : 'mb-1'}>
                          {line.replace(/\*\*/g, '')}
                        </p>
                      ))}
                    </div>

                    {/* Timestamp & Actions */}
                    <div className="flex items-center justify-between px-1 text-[9px] text-slate-450 font-bold uppercase tracking-wider">
                      <span>{msg.timestamp}</span>
                      {msg.sender === 'ai' && (
                        <button
                          onClick={() => copyToClipboard(msg.id, msg.text)}
                          className="flex items-center gap-1 hover:text-slate-705 transition-colors cursor-pointer border-none bg-transparent"
                        >
                          {copiedId === msg.id ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                          <span>{copiedId === msg.id ? 'Copied' : 'Copy'}</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {chatLoading && (
                <div className="flex gap-4 max-w-full">
                  <div className="h-7 w-7 rounded-lg bg-[#0A2342] text-emerald-400 flex items-center justify-center shrink-0">
                    <Bot className="h-4 w-4" />
                  </div>
                  <div className="bg-white border border-slate-200 p-3 px-4 rounded-2xl rounded-tl-none text-[12px] text-slate-500 font-bold flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping" />
                    <span>Voltrix Copilot is calculating...</span>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>
          )}
        </div>

        {/* FLOATING CHAT INPUT CONTAINER */}
        <div className="p-3 pb-20 md:pb-6 bg-white border-t border-slate-200 shrink-0 relative z-30 font-sans">
          <div className="max-w-2xl mx-auto relative bg-transparent">

            {/* Click shield for Plus Dropdown menu */}
            {plusMenuOpen && (
              <div
                className="fixed inset-0 z-40 bg-transparent"
                onClick={() => setPlusMenuOpen(false)}
              />
            )}

            {/* Tool Selection Dropdown popover (triggered by "+") */}
            {plusMenuOpen && (
              <div className="absolute bottom-16 left-0 z-50 w-56 bg-white border border-slate-200 rounded-xl shadow-lg p-2 animate-fade-in select-none">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider px-2.5 py-1 mb-1">Voltrix Helpers</p>

                <button
                  onClick={() => { setShowCalc(true); setPlusMenuOpen(false); }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 rounded-lg text-left border-none bg-transparent cursor-pointer"
                >
                  <Calculator className="h-4 w-4 text-orange-500" />
                  <span>Sizing Calculator</span>
                </button>

                <button
                  onClick={() => { setShowProposal(true); setPlusMenuOpen(false); }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 rounded-lg text-left border-none bg-transparent cursor-pointer"
                >
                  <FileText className="h-4 w-4 text-blue-500" />
                  <span>B2B Proposal Builder</span>
                </button>

                <button
                  onClick={() => { setShowCooling(true); setPlusMenuOpen(false); }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-55 rounded-lg text-left border-none bg-transparent cursor-pointer"
                >
                  <Layers className="h-4 w-4 text-purple-500" />
                  <span>Cooling Method Compare</span>
                </button>
              </div>
            )}

            {/* Input Pill Box (Matches ChatGPT design) */}
            <form
              onSubmit={e => { e.preventDefault(); handleSend(); }}
              className={`border-2 rounded-3xl bg-slate-50 flex flex-col p-2.5 gap-2 transition-all ${chatLoading ? 'opacity-70 border-slate-200' : 'border-slate-250 hover:border-slate-350 focus-within:border-slate-400 bg-white shadow-xs'
                }`}
            >
              <textarea
                value={chatInput}
                rows={1}
                onChange={e => setChatInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                disabled={chatLoading}
                placeholder="Ask anything..."
                className="w-full bg-transparent px-2.5 outline-none border-none text-xs md:text-sm font-semibold text-slate-800 placeholder:text-slate-450 resize-none max-h-32 min-h-[22px]"
              />

              <div className="flex items-center justify-between pt-2 px-1">
                {/* Left Side menu button */}
                <button
                  type="button"
                  onClick={() => setPlusMenuOpen(p => !p)}
                  className={`h-7 w-7 rounded-full flex items-center justify-center transition-colors cursor-pointer border-none ${plusMenuOpen ? 'bg-slate-200 text-slate-800' : 'bg-slate-100 hover:bg-slate-200 text-slate-650'
                    }`}
                  title="Insert technical template tools"
                >
                  <Plus className={`h-4 w-4 transition-transform duration-200 ${plusMenuOpen ? 'rotate-45' : ''}`} />
                </button>

                {/* Right Side triggers */}
                <div className="flex items-center gap-2">

                  {/* Microphone */}
                  <button
                    type="button"
                    onClick={handleMicClick}
                    className={`h-7 w-7 rounded-full flex items-center justify-center transition-colors cursor-pointer border-none ${micState === 'listening' ? 'bg-red-50 text-red-655 animate-pulse' : 'bg-slate-100 hover:bg-slate-200 text-slate-650'
                      }`}
                    title="Mock speech estimator query"
                  >
                    <Mic className="h-4 w-4" />
                  </button>

                  {/* Waveform helper */}
                  <button
                    type="button"
                    className="h-7 w-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-650 flex items-center justify-center border-none cursor-pointer"
                    title="Audio display visualizer"
                  >
                    <AudioLines className="h-4 w-4" />
                  </button>

                  {/* Send Action */}
                  <button
                    type="submit"
                    disabled={!chatInput.trim() || chatLoading}
                    className="h-8 w-8 rounded-full bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-200 text-white flex items-center justify-center transition-colors border-none cursor-pointer"
                  >
                    <ArrowUp className="h-4.5 w-4.5" />
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>

      </div>

      {/* ======================================================== */}
      {/* MODAL POPUPS FOR DYNAMIC TOOLS                          */}
      {/* ======================================================== */}

      {/* 1. LOAD SIZER CALCULATOR MODAL */}
      {showCalc && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4 backdrop-blur-xs font-sans">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto w-full border border-slate-200 p-5 space-y-6 animate-fade-in shadow-xl select-none">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2 text-orange-600">
                <Calculator className="h-5 w-5" />
                <h3 className="text-sm font-black uppercase tracking-wider">Load Sizing Calculator</h3>
              </div>
              <button
                onClick={() => setShowCalc(false)}
                className="p-1 text-slate-400 hover:text-slate-800 rounded bg-transparent border-none cursor-pointer"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1.5">Input Unit Type</label>
                <div className="grid grid-cols-3 gap-1 bg-slate-100 p-0.5 rounded-xl border border-slate-205">
                  {(['hp', 'kw', 'amps'] as const).map(unit => (
                    <button
                      key={unit}
                      type="button"
                      onClick={() => setCalcType(unit)}
                      className={`py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all border-none ${calcType === unit ? 'bg-white text-slate-850 shadow-xs' : 'text-slate-400 hover:text-slate-600'
                        }`}
                    >
                      {unit}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1.5">Capacity Value</label>
                <input
                  type="number"
                  min={1}
                  value={calcInput}
                  className={inputCls}
                  onChange={e => setCalcInput(Math.max(1, Number(e.target.value)))}
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1.5">Electrical Phase</label>
                <div className="grid grid-cols-2 gap-1 bg-slate-100 p-0.5 rounded-xl border border-slate-205">
                  {[
                    { id: '1', label: '1-Phase (230V)' },
                    { id: '3', label: '3-Phase (415V)' },
                  ].map(ph => (
                    <button
                      key={ph.id}
                      type="button"
                      onClick={() => setCalcPhase(ph.id as any)}
                      className={`py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all border-none ${calcPhase === ph.id ? 'bg-white text-slate-850 shadow-xs' : 'text-slate-400 hover:text-slate-650'
                        }`}
                    >
                      {ph.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1.5">Equipment Sizing Profile</label>
                <select
                  className={inputCls}
                  value={calcEquipment}
                  onChange={e => setCalcEquipment(e.target.value as any)}
                >
                  <option value="motor">Induction Motors / Elevators</option>
                  <option value="medical">Medical Diagnostics / MRI / CT</option>
                  <option value="it">Datacenters / Server Racks</option>
                  <option value="standard">Standard Domestic & Commercial</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1.5">Sizing Safety Buffer: <span className="text-emerald-700 font-extrabold">{Math.round((calcSafety - 1) * 100)}%</span></label>
                <input
                  type="range"
                  min="1.10"
                  max="1.60"
                  step="0.05"
                  value={calcSafety}
                  className="w-full accent-emerald-500 cursor-pointer h-2 bg-slate-200 rounded-lg appearance-none"
                  onChange={e => setCalcSafety(Number(e.target.value))}
                />
                <div className="flex justify-between text-[10px] text-slate-400 font-bold mt-1 uppercase">
                  <span>1.10x (Tight)</span>
                  <span>1.30x (Standard)</span>
                  <span>1.60x (Rugged)</span>
                </div>
              </div>
            </div>

            {/* Assessment outputs */}
            <div className="bg-slate-50 border-2 border-slate-100 rounded-xl p-4 space-y-3.5">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Estimated Outputs</span>
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="bg-white p-2 rounded-lg border border-slate-100">
                  <span className="block text-[9px] text-slate-400 uppercase">Active Load</span>
                  <span className="font-bold">{results.kw} kW</span>
                </div>
                <div className="bg-white p-2 rounded-lg border border-slate-100">
                  <span className="block text-[9px] text-slate-400 uppercase">Apparent Load</span>
                  <span className="font-bold">{results.kva} kVA</span>
                </div>
                <div className="bg-emerald-50/50 p-2 rounded-lg border border-emerald-200 text-emerald-800">
                  <span className="block text-[9px] uppercase font-bold text-emerald-705">Recommended</span>
                  <span className="font-black text-sm">{results.recommendedKva} kVA</span>
                </div>
              </div>

              {calcEquipment === 'motor' && (
                <div className="flex gap-2 text-[10.5px] font-semibold text-amber-800 bg-amber-50 rounded-lg p-2.5 leading-snug">
                  <AlertTriangle className="h-4.5 w-4.5 text-amber-600 shrink-0 mt-0.5" />
                  <span>Electric motor start-up rushes require high temporary overload capability. Voltrix Servo units are designed to withstand these startup conditions safely.</span>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  const prompt = `Can you recommend the exact Voltrix Servo Stabilizer model for a load of ${results.kw}kW (${results.kva}kVA)? It is for a ${calcEquipment === 'motor' ? '3-Phase AC motor' : calcEquipment} application with safety factor ${calcSafety}.`;
                  setShowCalc(false);
                  handleSend(prompt);
                }}
                className="flex-grow py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-colors flex items-center justify-center gap-1.5 border-none cursor-pointer shadow-xs"
              >
                <Sparkles className="h-4 w-4" /> Load Chat Analysis
              </button>

              <button
                onClick={() => {
                  copyToClipboard('calc_mdl', `Specs: Active Load: ${results.kw}kW, Apparent: ${results.kva}kVA, Capacity: ${results.recommendedKva}kVA`);
                  setCalcCopied(true);
                  setTimeout(() => setCalcCopied(false), 2000);
                }}
                className="py-2.5 px-3 bg-slate-100 hover:bg-slate-205 text-slate-700 rounded-xl text-xs font-bold transition-all border-none cursor-pointer"
              >
                {calcCopied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. PROPOSAL BUILDER MODAL */}
      {showProposal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4 backdrop-blur-xs font-sans">
          <div className="bg-white rounded-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto border border-slate-200 p-5 space-y-6 animate-fade-in shadow-xl select-none">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100 font-sans">
              <div className="flex items-center gap-2 text-blue-600">
                <FileText className="h-5 w-5" />
                <h3 className="text-sm font-black uppercase tracking-wider">B2B Proposal Writer</h3>
              </div>
              <button
                onClick={() => setShowProposal(false)}
                className="p-1 text-slate-400 hover:text-slate-805 rounded bg-transparent border-none cursor-pointer"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1.5">Client Institution Name</label>
                <input
                  type="text"
                  className={inputCls}
                  value={propClient}
                  onChange={e => setPropClient(e.target.value)}
                  placeholder="e.g. Metro Diagnostics"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1.5">Sizing Capacity (kVA)</label>
                <input
                  type="text"
                  className={inputCls}
                  value={propCapacity}
                  onChange={e => setPropCapacity(e.target.value)}
                  placeholder="e.g. 100"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1.5">Cooling Type</label>
                <select
                  className={inputCls}
                  value={propCooling}
                  onChange={e => setPropCooling(e.target.value)}
                >
                  <option value="air">Air-Cooled (Lower Capacity)</option>
                  <option value="oil">Oil-Cooled (Industrial Duty)</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1.5">Primary Load Application</label>
                <input
                  type="text"
                  className={inputCls}
                  value={propNeed}
                  onChange={e => setPropNeed(e.target.value)}
                  placeholder="e.g. CT scanner suites"
                />
              </div>
            </div>

            {/* Letter Output */}
            <div className="space-y-2">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Quotation Cover Letter Previews</span>
              <textarea
                value={propLetter}
                onChange={e => setPropLetter(e.target.value)}
                rows={10}
                className="w-full text-[11px] font-mono leading-relaxed bg-slate-50 border-2 border-slate-200 rounded-xl p-3.5 focus:outline-none resize-none h-44"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  const prompt = `Review my current proposal cover letter draft. Let's make the technical specifications look even more robust for ${propClient}: ${propLetter.slice(0, 120)}...`;
                  setShowProposal(false);
                  handleSend(prompt);
                }}
                className="flex-grow py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-colors flex items-center justify-center gap-1.5 border-none cursor-pointer shadow-xs"
              >
                <Sparkles className="h-4 w-4" /> Discuss Letter In Chat
              </button>

              <button
                onClick={() => {
                  navigator.clipboard.writeText(propLetter);
                  setLetterCopied(true);
                  setTimeout(() => setLetterCopied(false), 2000);
                }}
                className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all border-none cursor-pointer flex items-center justify-center gap-1"
              >
                {letterCopied ? <Check className="h-4 w-4 text-emerald-650" /> : <Copy className="h-4 w-4" />}
                <span>{letterCopied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. COOLING MATRIX COMPARATIVE MODAL */}
      {showCooling && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4 backdrop-blur-xs font-sans">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-slate-200 p-5 space-y-6 animate-fade-in shadow-xl select-none">
            <div className="flex justify-between items-center pb-2 border-b border-slate-101">
              <div className="flex items-center gap-2 text-purple-600">
                <Layers className="h-5 w-5" />
                <h3 className="text-sm font-black uppercase tracking-wider">Cooling Comparatives Matrix</h3>
              </div>
              <button
                onClick={() => setShowCooling(false)}
                className="p-1 text-slate-400 hover:text-slate-805 rounded bg-transparent border-none cursor-pointer"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

              {/* Air card */}
              <div className="border border-slate-200 rounded-xl p-4 bg-white space-y-2.5">
                <div>
                  <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-750 font-black text-[9px] uppercase tracking-wider">Air-Cooled</span>
                  <h4 className="text-xs font-black uppercase text-slate-805 mt-1 leading-none">Compact Series</h4>
                </div>

                <div className="text-[11px] space-y-2 text-slate-600 font-medium">
                  <div><span className="text-slate-400 font-bold block text-[9px] uppercase">Best Application</span>Labs, offices, medical imaging rooms</div>
                  <div><span className="text-slate-400 font-bold block text-[9px] uppercase">Peak Load Capacity</span>Up to 150 kVA</div>
                  <div><span className="text-slate-400 font-bold block text-[9px] uppercase">Servicing needs</span>Direct replacement of air filters only</div>
                </div>

                <div className="pt-2 border-t border-slate-100 flex justify-between items-center text-[10px] text-slate-450 uppercase">
                  <span>Efficiency Factor</span>
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map(dot => (
                      <div key={dot} className={`h-2 w-2 rounded-full ${dot <= 3 ? 'bg-emerald-500' : 'bg-slate-200'}`} />
                    ))}
                  </div>
                </div>
              </div>

              {/* Oil card */}
              <div className="border border-slate-200 rounded-xl p-4 bg-white space-y-2.5">
                <div>
                  <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-700 font-black text-[9px] uppercase tracking-wider">Oil-Cooled</span>
                  <h4 className="text-xs font-black uppercase text-slate-805 mt-1 leading-none">Industrial Series</h4>
                </div>

                <div className="text-[11px] space-y-2 text-slate-600 font-medium">
                  <div><span className="text-slate-400 font-bold block text-[9px] uppercase">Best Application</span>Mills, CNC welding, outdoor machinery</div>
                  <div><span className="text-slate-400 font-bold block text-[9px] uppercase">Peak Load Capacity</span>Up to 2500 kVA (Extreme duty)</div>
                  <div><span className="text-slate-400 font-bold block text-[9px] uppercase">Servicing needs</span>Oil testing validation every 18 months</div>
                </div>

                <div className="pt-2 border-t border-slate-100 flex justify-between items-center text-[10px] text-slate-450 uppercase">
                  <span>Efficiency Factor</span>
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map(dot => (
                      <div key={dot} className={`h-2 w-2 rounded-full ${dot <= 5 ? 'bg-emerald-500' : 'bg-slate-200'}`} />
                    ))}
                  </div>
                </div>
              </div>

            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowCooling(false);
                  handleSend("Compare Air-Cooled versus Oil-Cooled Voltrix Servo Stabilizers for client installation.");
                }}
                className="flex-grow py-2.5 bg-slate-805 hover:bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-colors flex items-center justify-center gap-1 border-none cursor-pointer"
              >
                Compare In Chat
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

/**
 * Intelligent Fallback Generator for Voltrix Power Systems Technical Queries (Off-grid backup database)
 */
function generateFallbackAiReply(prompt: string): string {
  const lower = prompt.toLowerCase();

  if (lower.includes('motor') || lower.includes('hp') || lower.includes('kva') || lower.includes('calculator')) {
    return `**Voltrix Sizing Assessment Formula Matrix:**
    
For typical 3-Phase AC Induction Motor loads:
- **Power Factor (PF):** Assumed 0.8pf standard safety limit
- **Overload Starting Factor:** High start-up torque requires a 1.25x – 1.50x headroom multiplier.
- **Microprocessor DSP Control:** Automatic voltage buck-boost stabilization prevents voltage sag during heavy spikes.

**Recommended Voltrix Configuration:**
- High efficiency 3-Phase Servo Stabilizer (Double Carbon roller brush system).
- Integrated low/high voltage trip protectors.`;
  }

  if (lower.includes('proposal') || lower.includes('letter') || lower.includes('hospital') || lower.includes('template')) {
    return `**Voltrix B2B Cover Proposal Draft Notes:**

Please use the Proposal Builder Template in your bottom left '+' menu to fill in the exact customer specifications (Client Name, Product Sizing kW/kVA) to instantly compile a formatted professional cover letter ready for copy/paste redirection.

Feel free to ask here for customized terms, warranty extensions, or special commercial clauses!`;
  }

  if (lower.includes('oil') || lower.includes('air') || lower.includes('cooling')) {
    return `**Thermal Cooling Selection Guide:**

1. **Voltrix Air-Cooled Stabilizers (Compact Indoor):**
   - Natural air convection/fan dissipation. Compact footprint. Ideal for labs, offices, and indoor setups under 150 kVA.

2. **Voltrix Oil-Cooled Stabilizers (Heavy Duty Industrial):**
   - IS-335 compliant transformer oil tank. Maximum insulation, dustproof, and high kVA durability. Optimal for high ambient temperature workshops and machines (>50 kVA up to 2500 kVA).`;
  }

  return `**Voltrix Partner AI Copilot Advice:**

I can assist you with sizing motors, choosing stabilizers/inverters, or drafting client proposals.
- Click the **+** button in the bottom input bar to launch the specialized Sizing and Proposal tools.
- Type in standard specifications or custom queries (e.g. "What is the warranty period on servo carbon roller brush stabilizers?").

Let me know what detailed specifications you would like to discuss!`;
}
