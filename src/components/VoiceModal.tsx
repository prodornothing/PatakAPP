import React, { useState, useEffect } from 'react';
import { X, Mic, MicOff, Volume2, Sparkles, AlertCircle, Play } from 'lucide-react';

interface VoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSendTranscript: (transcript: string) => void;
}

const SAMPLE_VOICE_QUERIES = [
  {
    label: 'Magsasaka sa Central Luzon (Palayan & Patubig)',
    transcript: 'Tuyong-tuyo na ang palayan namin sa bukid, ano po ang payo ng Department of Agriculture para makatipid sa tubig?',
    duration: '4s'
  },
  {
    label: 'Barangay Health Worker (Heat Stroke sa Bukid)',
    transcript: 'May magsasaka kaming nahilo at nawalan ng malay dahil sa matinding init sa bukid, anong agarang first aid ayon sa DOH?',
    duration: '5s'
  },
  {
    label: 'Punong Barangay (Water Shortage & Balon)',
    transcript: 'Paano po ang tamang water rationing protocol sa aming barangay kung bumababa ang lebel ng tubig sa balon?',
    duration: '5s'
  },
  {
    label: 'Magsasaka sa Batangas (Kulungan ng Baboy at Manok)',
    transcript: 'Nalalanta at hinihingal ang mga baboy at manok sa sobrang init, paano mapapalamig ang kulungan ayon sa DA-BAI?',
    duration: '6s'
  }
];

export const VoiceModal: React.FC<VoiceModalProps> = ({ isOpen, onClose, onSendTranscript }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [recognitionSupported, setRecognitionSupported] = useState(false);
  const [recognitionObj, setRecognitionObj] = useState<any>(null);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      setRecognitionSupported(true);
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'fil-PH'; // Tagalog / Filipino

      recognition.onresult = (event: any) => {
        const text = Array.from(event.results)
          .map((result: any) => result[0].transcript)
          .join('');
        setTranscript(text);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognition.onerror = () => {
        setIsRecording(false);
      };

      setRecognitionObj(recognition);
    }
  }, []);

  if (!isOpen) return null;

  const toggleRecording = () => {
    if (!recognitionSupported) return;
    if (isRecording) {
      recognitionObj?.stop();
      setIsRecording(false);
    } else {
      setTranscript('');
      try {
        recognitionObj?.start();
        setIsRecording(true);
      } catch {
        setIsRecording(false);
      }
    }
  };

  const handleApplyPreset = (text: string) => {
    setTranscript(text);
  };

  const handleSend = () => {
    if (!transcript.trim()) return;
    onSendTranscript(transcript.trim());
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl border border-sky-100 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-blue-900 to-indigo-900 text-white">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center">
              <Mic className="w-4 h-4 text-sky-300" />
            </div>
            <div>
              <h3 className="font-heading font-extrabold text-sm">
                Offline Voice Query (Whisper.cpp / Speech API)
              </h3>
              <p className="text-[11px] text-sky-200/80 font-body">
                Magsalita sa Taglish o pumili ng simulated field recording
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-sky-200 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          {/* Mic Visualizer */}
          <div className="flex flex-col items-center justify-center py-4 bg-sky-50/50 rounded-2xl border border-sky-100">
            <button
              onClick={toggleRecording}
              className={`w-16 h-16 rounded-full flex items-center justify-center transition-all shadow-md ${
                isRecording
                  ? 'bg-rose-500 text-white animate-pulse ring-8 ring-rose-200'
                  : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/25'
              }`}
            >
              {isRecording ? <MicOff className="w-7 h-7" /> : <Mic className="w-7 h-7" />}
            </button>
            <span className="text-xs font-heading font-bold text-slate-700 mt-3">
              {isRecording ? 'Nakikinig sa iyong boses (Tagalog/English)...' : 'Pindutin ang Mikropono upang Magsalita'}
            </span>
            <span className="text-[10px] text-slate-400 font-body">
              {recognitionSupported ? 'Speech Recognition Engine Handa' : 'Simulated voice input available'}
            </span>
          </div>

          {/* Transcript input/preview */}
          <div>
            <label className="block text-[11px] font-heading font-bold text-slate-700 mb-1">
              Transcribed Text / Voice Query:
            </label>
            <textarea
              value={transcript}
              onChange={e => setTranscript(e.target.value)}
              placeholder="Dito lalabas ang transcript ng iyong boses o piliin ang isa sa sample voice recordings sa ibaba..."
              rows={3}
              className="w-full p-2.5 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-hidden focus:border-blue-500 font-body"
            />
          </div>

          {/* Sample Field Audio Presets */}
          <div>
            <label className="block text-[11px] font-heading font-bold text-slate-500 uppercase tracking-wider mb-2">
              Subukan ang mga Halimbawang Field Voice Queries:
            </label>
            <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
              {SAMPLE_VOICE_QUERIES.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => handleApplyPreset(item.transcript)}
                  className="w-full text-left p-2 rounded-xl bg-white hover:bg-sky-50 border border-slate-200 hover:border-blue-300 transition-colors flex items-center justify-between text-xs group"
                >
                  <div className="flex-1 pr-2">
                    <span className="font-heading font-bold text-blue-950 text-[11px] block group-hover:text-blue-700">
                      {item.label}
                    </span>
                    <span className="text-[10px] text-slate-500 font-body line-clamp-1">
                      "{item.transcript}"
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded shrink-0">
                    Piliin
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200 transition-colors"
          >
            Kanselahin
          </button>
          <button
            onClick={handleSend}
            disabled={!transcript.trim()}
            className={`px-4 py-2 rounded-xl text-xs font-heading font-bold text-white transition-all shadow-xs ${
              transcript.trim()
                ? 'bg-blue-600 hover:bg-blue-700'
                : 'bg-slate-300 cursor-not-allowed'
            }`}
          >
            Isumite ang Tanong sa Patak
          </button>
        </div>
      </div>
    </div>
  );
};
