import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Volume2,
  VolumeX,
  Copy,
  Check,
  FileText,
  ChevronDown,
  ChevronUp,
  Mic,
  ShieldCheck,
  CheckSquare,
  Square,
  Droplets,
  BookOpen,
  RotateCcw
} from 'lucide-react';
import { ChatMessage, EngineConfig } from '../types';

interface ChatInterfaceProps {
  messages: ChatMessage[];
  isLoading: boolean;
  config: EngineConfig;
  onSendMessage: (query: string) => void;
  onToggleChecklist: (messageId: string, itemId: string) => void;
  onOpenVoice: () => void;
  onNavigateToAdvisories: () => void;
  onOpenSource?: (source: string) => void;
  onNewChat?: () => void;
}

const PRESET_QUERIES = [
  {
    icon: '🌡️',
    title: 'Heat Index Ngayon',
    query: 'What is the heat index according to PAGASA? Ano ang danger category?',
    tag: 'PAGASA Heat Index'
  },
  {
    icon: '🌧️',
    title: 'Rainfall Advisory',
    query: 'What is the PAGASA rainfall advisory? Kailan babalik ang regular na ulan?',
    tag: 'PAGASA Rainfall'
  },
  {
    icon: '🌾',
    title: 'Tuyong Palayan (AWD)',
    query: 'Tuyong-tuyo na ang palayan namin sa bukid, ano ang dapat gawin ayon sa DA?',
    tag: 'DA AWD Protocol'
  },
  {
    icon: '☀️',
    title: 'First Aid sa Init',
    query: 'Nahihilo at nawalan ng malay ang magsasaka dahil sa init, ano ang first aid ayon sa DOH?',
    tag: 'DOH Heat Health'
  },
  {
    icon: '💧',
    title: 'Rasyon ng Tubig',
    query: 'Ilan ang opisyal na water rationing quota bawat pamilya sa ilalim ng DILG circular?',
    tag: 'DILG Water MC'
  },
  {
    icon: '🐖',
    title: 'Kulungan ng Hayop',
    query: 'Paano mapapalamig ang kulungan ng baboy at manok sa matinding init ayon sa DA-BAI?',
    tag: 'DA-BAI Livestock'
  }
];

const TOPIC_CHIPS = [
  { label: 'Heat Index', query: 'What is the current heat index forecast according to PAGASA?' },
  { label: 'Rainfall Advisory', query: 'What is the PAGASA rainfall advisory and when will the rains return?' },
  { label: 'AWD / Palayan', query: 'Tuyong-tuyo na ang palayan namin sa bukid, ano ang dapat gawin ayon sa DA?' },
  { label: 'Heat Stroke', query: 'Ano ang first aid sa heat stroke ayon sa DOH?' },
  { label: 'Rasyon ng Tubig', query: 'Ilan ang opisyal na water rationing quota bawat pamilya?' }
];

export const ChatInterface: React.FC<ChatInterfaceProps> = ({
  messages,
  isLoading,
  config,
  onSendMessage,
  onToggleChecklist,
  onOpenVoice,
  onNavigateToAdvisories,
  onOpenSource,
  onNewChat
}) => {
  const [input, setInput] = useState('');
  const [expandedChunks, setExpandedChunks] = useState<Record<string, boolean>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    onSendMessage(input.trim());
    setInput('');
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSpeak = (id: string, text: string) => {
    if ('speechSynthesis' in window) {
      if (speakingId === id) {
        window.speechSynthesis.cancel();
        setSpeakingId(null);
        return;
      }
      window.speechSynthesis.cancel();
      // Strip markdown brackets and symbols for natural voice
      const cleanAudioText = text.replace(/\[.*?\]/g, '').replace(/[\*\#\_]/g, '');
      const utterance = new SpeechSynthesisUtterance(cleanAudioText);
      utterance.rate = 0.95;
      utterance.onend = () => setSpeakingId(null);
      utterance.onerror = () => setSpeakingId(null);
      window.speechSynthesis.speak(utterance);
      setSpeakingId(id);
    }
  };

  const toggleChunks = (msgId: string) => {
    setExpandedChunks(prev => ({ ...prev, [msgId]: !prev[msgId] }));
  };

  return (
    <div className="flex flex-col h-[calc(100vh-65px)] max-w-4xl mx-auto w-full px-3 sm:px-4 pb-3">
      {/* Top Offline Architecture Banner */}
      <div className="my-2.5 p-3 sm:p-3.5 rounded-2xl bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white shadow-sm flex items-center justify-between gap-3 border border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-heading font-extrabold text-white tracking-wide">
                Patak Offline Engine
              </span>
              <span className="inline-flex items-center gap-1.5 text-[10px] font-bold bg-emerald-500/20 text-emerald-300 px-2.5 py-0.5 rounded-full border border-emerald-400/30">
                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></span>
                Grounded sa mga Opisyal na Advisory
              </span>
            </div>
            <p className="text-[11px] text-slate-300/90 font-body">
              DA-PhilRice · PAGASA · DOH · DILG · DA-BAI · Sariling Uploads (Walang Cloud API)
            </p>
          </div>
        </div>

        <button
          onClick={onNavigateToAdvisories}
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-sky-200 hover:text-white bg-white/10 hover:bg-white/15 transition-all cursor-pointer"
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>Tingnan ang Library</span>
        </button>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-1">
        {messages.length <= 1 ? (
          <div className="py-6 flex flex-col items-center text-center">
            {/* Water Drop Hero Icon */}
            <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-blue-600 via-sky-500 to-teal-400 p-0.5 shadow-lg shadow-blue-500/20 flex items-center justify-center text-white mb-3">
              <Droplets className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-xl sm:text-2xl font-heading font-black text-slate-900 mb-1">
              Patak: Tugon sa El Niño
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 max-w-md font-body mb-5">
              Lokal na AI assistant para sa Barangay Officials, Disaster Teams, at Magsasaka.
              Mabilis na sumasagot nang walang internet batay sa opisyal na patnubay.
            </p>

            {/* Quick Starters Cards */}
            <div className="w-full max-w-2xl text-left">
              <div className="text-[11px] font-heading font-extrabold text-slate-500 uppercase tracking-wider mb-2 px-1">
                Subukan ang mga Madalas Itanong:
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {PRESET_QUERIES.map((preset, idx) => (
                  <button
                    key={idx}
                    onClick={() => onSendMessage(preset.query)}
                    className="p-3 rounded-2xl bg-white hover:bg-blue-50/60 border border-slate-200/90 hover:border-blue-300 text-left transition-all duration-200 shadow-2xs hover:shadow-sm group flex flex-col justify-between cursor-pointer"
                  >
                    <div className="flex items-start gap-2 mb-1">
                      <span className="text-base">{preset.icon}</span>
                      <span className="text-xs font-heading font-bold text-slate-900 group-hover:text-blue-700 leading-tight">
                        {preset.title}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 font-body line-clamp-2 mb-1.5">
                      "{preset.query}"
                    </div>
                    <span className="inline-block text-[9px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100 self-start">
                      {preset.tag}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          messages.map(msg => (
            <div key={msg.id} className="space-y-2">
              {msg.role === 'user' ? (
                /* User Message */
                <div className="flex justify-end">
                  <div className="max-w-[85%] sm:max-w-[75%] rounded-3xl rounded-br-md bg-gradient-to-r from-blue-700 to-indigo-700 text-white px-4 py-3 shadow-sm">
                    <p className="text-xs sm:text-sm font-body leading-relaxed whitespace-pre-wrap">
                      {msg.content}
                    </p>
                    <span className="block text-[10px] text-blue-200/70 mt-1 text-right">
                      {msg.timestamp}
                    </span>
                  </div>
                </div>
              ) : (
                /* Assistant Message */
                <div className="flex justify-start">
                  <div className="max-w-[95%] sm:max-w-[90%] rounded-3xl rounded-tl-md bg-white border border-slate-200 text-slate-800 p-4 sm:p-5 shadow-xs space-y-3.5">
                    {/* Header */}
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
                          💧
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-heading font-bold text-xs text-slate-900">
                              Patak Assistant
                            </span>
                            <span className="text-[9px] font-semibold bg-emerald-50 text-emerald-700 px-1.5 py-0.2 rounded-full border border-emerald-200">
                              Offline Grounded
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-400 font-body">
                            Pinagkunan: {msg.modelUsed || 'Lokal na Engine'}
                          </span>
                        </div>
                      </div>

                      {/* Top Action Buttons */}
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleSpeak(msg.id, msg.content)}
                          title="Pakinggan ang gabay (Audio Readout)"
                          className={`p-1.5 rounded-lg border text-xs transition-colors cursor-pointer ${
                            speakingId === msg.id
                              ? 'bg-blue-600 text-white border-blue-600'
                              : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200'
                          }`}
                        >
                          {speakingId === msg.id ? (
                            <VolumeX className="w-3.5 h-3.5" />
                          ) : (
                            <Volume2 className="w-3.5 h-3.5" />
                          )}
                        </button>
                        <button
                          onClick={() => handleCopy(msg.id, msg.content)}
                          title="Kopyahin ang sagot"
                          className="p-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 text-xs transition-colors cursor-pointer"
                        >
                          {copiedId === msg.id ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Main Content Body */}
                    <div className="text-xs sm:text-sm font-body leading-relaxed whitespace-pre-wrap text-slate-800">
                      {msg.content}
                    </div>

                    {/* Optional Interactive Action Checklist (Shown ONLY when the query requested actionable steps) */}
                    {msg.checklist && msg.checklist.length > 0 && (
                      <div className="bg-blue-50/70 border border-blue-200/80 rounded-2xl p-3 sm:p-4 space-y-2.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-heading font-extrabold text-blue-950 uppercase tracking-wider flex items-center gap-1.5">
                            <CheckSquare className="w-3.5 h-3.5 text-blue-600" />
                            Action Checklist:
                          </span>
                          <span className="text-[10px] text-blue-700 font-bold bg-white px-2 py-0.5 rounded-full border border-blue-200">
                            {msg.checklist.filter(i => i.isDone).length}/{msg.checklist.length} Natapos
                          </span>
                        </div>

                        <div className="space-y-1.5">
                          {msg.checklist.map((item, idx) => (
                            <div
                              key={item.id}
                              onClick={() => onToggleChecklist(msg.id, item.id)}
                              className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-start gap-2.5 ${
                                item.isDone
                                  ? 'bg-white/80 border-emerald-300 text-slate-400 line-through'
                                  : 'bg-white border-slate-200 hover:border-blue-300 text-slate-800 shadow-2xs'
                              }`}
                            >
                              <div className="mt-0.5 shrink-0 text-blue-600">
                                {item.isDone ? (
                                  <CheckSquare className="w-4 h-4 text-emerald-600" />
                                ) : (
                                  <Square className="w-4 h-4 text-slate-400" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <span className="text-xs font-body leading-snug">
                                  <strong className="text-slate-900 mr-1">
                                    {idx + 1}.
                                  </strong>
                                  {item.text}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Official Citations Summary */}
                    {msg.sources && msg.sources.length > 0 && (
                      <div className="pt-2 border-t border-slate-100 flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] font-heading font-extrabold text-slate-500 uppercase">
                          Opisyal na Sanggunian:
                        </span>
                        {msg.sources.map((src, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => onOpenSource?.(src)}
                            className="text-[10px] font-semibold bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-800 border border-slate-200 hover:border-blue-300 px-2 py-0.5 rounded-md font-mono cursor-pointer"
                          >
                            {src}
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Collapsible Retrieved Context Chunks (Inspect Grounded Facts) */}
                    {msg.contextChunks && msg.contextChunks.length > 0 && (
                      <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50/50">
                        <button
                          onClick={() => toggleChunks(msg.id)}
                          className="w-full px-3 py-2 text-left flex items-center justify-between text-[11px] font-semibold text-slate-700 hover:text-blue-900 transition-colors cursor-pointer"
                        >
                          <span className="flex items-center gap-1.5">
                            <FileText className="w-3.5 h-3.5 text-blue-600" />
                            Suriin ang Pinagbatayang Advisory Chunks ({msg.contextChunks.length})
                          </span>
                          {expandedChunks[msg.id] ? (
                            <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
                          ) : (
                            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                          )}
                        </button>

                        {expandedChunks[msg.id] && (
                          <div className="p-3 border-t border-slate-200 space-y-2 bg-white">
                            <p className="text-[10px] text-slate-500">
                              Ito ang eksaktong mga talata mula sa lokal na database na ginamit upang buuin ang sagot nang walang hallucination:
                            </p>
                            {msg.contextChunks.map((chunk, cIdx) => (
                              <div
                                key={cIdx}
                                className="p-2.5 rounded-lg bg-blue-50/40 border border-blue-100 text-xs space-y-1"
                              >
                                <div className="flex items-center justify-between">
                                  <span className="font-heading font-bold text-[11px] text-blue-950">
                                    {chunk.title}
                                  </span>
                                  <span className="text-[9px] font-mono font-bold text-blue-700 bg-blue-100 px-1.5 py-0.2 rounded">
                                    {chunk.agency} (Pahina {chunk.page || 1})
                                  </span>
                                </div>
                                <p className="text-[11px] text-slate-700 font-body leading-relaxed">
                                  {chunk.text}
                                </p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))
        )}

        {isLoading && (
          <div className="flex justify-start">
            <div className="rounded-3xl rounded-tl-md bg-white border border-slate-200 p-4 shadow-xs flex items-center gap-3">
              <div className="w-5 h-5 rounded-full border-2 border-blue-600 border-t-transparent animate-spin"></div>
              <div className="space-y-0.5">
                <span className="text-xs font-heading font-bold text-slate-900">
                  Nagsasagawa ng Lokal na Pagsusuri...
                </span>
                <p className="text-[10px] text-slate-500">
                  Paghahanap sa mga opisyal na advisory at na-upload na dokumento
                </p>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div className="mt-2 flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
        {TOPIC_CHIPS.map(chip => (
          <button
            key={chip.label}
            type="button"
            disabled={isLoading}
            onClick={() => onSendMessage(chip.query)}
            className="shrink-0 text-[11px] px-2.5 py-1 rounded-full bg-white text-slate-700 border border-slate-200 hover:border-blue-400 hover:text-blue-800 hover:bg-blue-50 transition-colors cursor-pointer disabled:opacity-50"
          >
            {chip.label}
          </button>
        ))}
        {onNewChat && messages.length > 1 && (
          <button
            type="button"
            onClick={onNewChat}
            className="shrink-0 inline-flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-200 cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
            Bagong usapan
          </button>
        )}
      </div>

      {/* Input Form Bar */}
      <form onSubmit={handleSubmit} className="mt-1">
        <div className="relative flex items-center bg-white rounded-2xl border border-slate-200 shadow-md shadow-slate-900/5 focus-within:border-blue-600 focus-within:ring-2 focus-within:ring-blue-100 transition-all p-1.5">
          {/* Voice Input Button */}
          <button
            type="button"
            onClick={onOpenVoice}
            title="Mag-salita ng voice query (Offline Speech)"
            className="p-2.5 rounded-xl text-slate-500 hover:text-blue-600 hover:bg-slate-100 transition-colors shrink-0 cursor-pointer"
          >
            <Mic className="w-5 h-5" />
          </button>

          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Hal: Ano ang dapat gawin sa tuyong palayan? O: Kailan babalik ang ulan?"
            disabled={isLoading}
            className="flex-1 px-2 py-2 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 bg-transparent focus:outline-hidden font-body"
          />

          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className={`p-2.5 rounded-xl font-medium transition-all shrink-0 flex items-center justify-center cursor-pointer ${
              input.trim() && !isLoading
                ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-xs active:scale-95'
                : 'bg-slate-100 text-slate-400 cursor-not-allowed'
            }`}
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        <div className="mt-1 flex items-center justify-between px-2 text-[10px] text-slate-400 font-body">
          <span>100% lokal na sagot. Walang data na lumalabas sa iyong device.</span>
          <span className="hidden sm:inline">Pindutin ang Enter upang magtanong</span>
        </div>
      </form>
    </div>
  );
};
