import React from 'react';
import { Wifi, WifiOff, Settings, BookOpen, MessageSquare, Droplets } from 'lucide-react';
import { EngineConfig } from '../types';

interface HeaderProps {
  config: EngineConfig;
  isOnline: boolean;
  totalAdvisoriesCount: number;
  onOpenSettings: () => void;
  activeTab: 'chat' | 'advisories';
  setActiveTab: (tab: 'chat' | 'advisories') => void;
}

export const Header: React.FC<HeaderProps> = ({
  config,
  isOnline,
  totalAdvisoriesCount,
  onOpenSettings,
  activeTab,
  setActiveTab,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
      <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
        {/* Brand & Identity */}
        <div className="flex items-center gap-3">
          <div className="relative w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-700 via-sky-600 to-teal-400 p-0.5 shadow-md shadow-blue-600/20 flex items-center justify-center text-white shrink-0">
            <Droplets className="w-5 h-5 text-white" />
            <span
              className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${
                !isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-sky-500'
              }`}
            />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-heading font-black text-xl tracking-tight text-slate-900">
                PATAK
              </span>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-800 border border-blue-200">
                Tugon sa El Niño
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-body hidden sm:block">
              Offline Disaster & Agriculture Assistant · Zero Cloud APIs
            </p>
          </div>
        </div>

        {/* Center Navigation Tabs */}
        <div className="flex items-center bg-slate-100 p-1 rounded-2xl border border-slate-200/80 shadow-2xs">
          <button
            onClick={() => setActiveTab('chat')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-heading font-bold rounded-xl transition-all cursor-pointer ${
              activeTab === 'chat'
                ? 'bg-white text-blue-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5 text-blue-600" />
            <span>Assistant</span>
          </button>
          <button
            onClick={() => setActiveTab('advisories')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-heading font-bold rounded-xl transition-all cursor-pointer ${
              activeTab === 'advisories'
                ? 'bg-white text-blue-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5 text-teal-600" />
            <span>Advisory Library</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-200/80 text-slate-700 font-mono font-bold">
              {totalAdvisoriesCount}
            </span>
          </button>
        </div>

        {/* Right Status & Settings */}
        <div className="flex items-center gap-2">
          {/* Automatic Online/Offline Detection Badge (NOT a toggle) */}
          <div
            title={
              !isOnline
                ? 'Kasalukuyang walang internet. 100% gumagana ang Patak gamit ang lokal na database at storage!'
                : 'May koneksyon sa internet. Nananatiling offline-first at ligtas ang data.'
            }
            className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-heading font-bold transition-all select-none ${
              !isOnline
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-300 shadow-2xs'
                : 'bg-sky-50 text-sky-800 border border-sky-200 shadow-2xs'
            }`}
          >
            {!isOnline ? (
              <>
                <WifiOff className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span className="hidden sm:inline">100% Offline Active</span>
                <span className="sm:hidden">Offline</span>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse ml-0.5"></span>
              </>
            ) : (
              <>
                <Wifi className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                <span className="hidden sm:inline">Online (Lokal Handang-handa)</span>
                <span className="sm:hidden">Online</span>
              </>
            )}
          </div>

          {/* Settings Button */}
          <button
            onClick={onOpenSettings}
            title="Mga Setting at Wika"
            className="p-2 rounded-xl text-slate-600 hover:text-blue-900 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
