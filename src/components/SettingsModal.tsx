import React, { useState } from 'react';
import { X, Check, Globe, Database, Trash2, Cpu, ShieldCheck } from 'lucide-react';
import { EngineConfig } from '../types';
import { getUploadedAdvisories } from '../services/advisoryStore';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: EngineConfig;
  onSaveConfig: (newConfig: EngineConfig) => void;
  isOnline: boolean;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  config,
  onSaveConfig,
  isOnline,
}) => {
  const [localConfig, setLocalConfig] = useState<EngineConfig>(config);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const uploadedCount = getUploadedAdvisories().length;

  const handleClearCache = () => {
    if (confirm('Nais mo bang linisin ang lahat ng na-upload na dokumento mula sa lokal na storage?')) {
      localStorage.removeItem('patak_uploaded_advisories_v2');
      setStatusMsg('Nalinis na ang lokal na storage. Magre-refresh ang library.');
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    }
  };

  const handleSave = () => {
    try {
      localStorage.setItem('patak_engine_config', JSON.stringify(localConfig));
    } catch {}
    onSaveConfig(localConfig);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <h3 className="font-heading font-extrabold text-sm sm:text-base">
                Mga Setting ng Patak
              </h3>
              <p className="text-[11px] text-slate-300 font-body">
                Lokal na Assistant para sa Disaster & Agrikultura
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4 overflow-y-auto max-h-[75vh]">
          {/* Status Badge */}
          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-700">Koneksyon sa Network:</span>
            <span
              className={`text-xs font-heading font-bold px-2.5 py-0.5 rounded-full ${
                !isOnline
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-sky-100 text-sky-800'
              }`}
            >
              {!isOnline ? '⚡ 100% Offline (Local)' : '🌐 Online'}
            </span>
          </div>

          {/* Engine Mode */}
          <div>
            <label className="block text-xs font-heading font-bold text-slate-800 mb-2">
              AI Engine Mode:
            </label>
            <div className="p-3.5 rounded-2xl border border-emerald-300 bg-emerald-50/50 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-heading font-bold text-emerald-950 flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5 text-emerald-700" />
                  Built-in Standalone Engine (Aktibo)
                </span>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.2 rounded-full">
                  Zero-Install
                </span>
              </div>
              <p className="text-[11px] text-emerald-900/80 font-body">
                Ganap na nakapaloob sa app. Hindi nangangailangan ng panlabas na server o cloud API key. Agad na gumagana para sa lahat ng opisyal at na-upload na advisory.
              </p>
            </div>
          </div>

          {/* Language Preference */}
          <div>
            <label className="block text-xs font-heading font-bold text-slate-800 mb-2 flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-blue-600" />
              Ginustong Wika ng Sagot:
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setLocalConfig(prev => ({ ...prev, language: 'bilingual' }))}
                className={`p-2.5 rounded-xl border text-xs font-heading font-bold transition-all cursor-pointer ${
                  localConfig.language === 'bilingual'
                    ? 'border-blue-600 bg-blue-50 text-blue-900 shadow-2xs'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                Taglish / Filipino
              </button>
              <button
                type="button"
                onClick={() => setLocalConfig(prev => ({ ...prev, language: 'english' }))}
                className={`p-2.5 rounded-xl border text-xs font-heading font-bold transition-all cursor-pointer ${
                  localConfig.language === 'english'
                    ? 'border-blue-600 bg-blue-50 text-blue-900 shadow-2xs'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                English
              </button>
            </div>
          </div>

          {/* Local Storage Stats */}
          <div className="pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between text-xs text-slate-600 mb-2">
              <span className="flex items-center gap-1.5 font-medium">
                <Database className="w-3.5 h-3.5 text-slate-400" />
                Mga Naka-store na Upload:
              </span>
              <span className="font-bold text-slate-900">
                {uploadedCount} {uploadedCount === 1 ? 'dokumento' : 'dokumento'}
              </span>
            </div>

            {uploadedCount > 0 && (
              <button
                type="button"
                onClick={handleClearCache}
                className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Linisin ang mga Na-upload na Dokumento</span>
              </button>
            )}
          </div>

          {statusMsg && (
            <div className="p-2.5 rounded-xl bg-blue-50 text-blue-900 text-xs text-center font-medium">
              {statusMsg}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
          >
            Isara
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 rounded-xl text-xs font-heading font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-xs transition-colors cursor-pointer"
          >
            I-save ang Setting
          </button>
        </div>
      </div>
    </div>
  );
};
