/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { ChatInterface } from './components/ChatInterface';
import { AdvisoryLibrary } from './components/AdvisoryLibrary';
import { SettingsModal } from './components/SettingsModal';
import { VoiceModal } from './components/VoiceModal';
import { executeRAGQuery } from './services/localRAG';
import { getAllAdvisories, subscribeToAdvisories } from './services/advisoryStore';
import { ChatMessage, EngineConfig } from './types';

export default function App() {
  const [activeTab, setActiveTab] = useState<'chat' | 'advisories'>('chat');
  const [isLoading, setIsLoading] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isVoiceOpen, setIsVoiceOpen] = useState(false);
  const [totalDocsCount, setTotalDocsCount] = useState<number>(() => getAllAdvisories().length);

  // Automatically detect online/offline state - no manual toggle required!
  const [isOnline, setIsOnline] = useState<boolean>(() => {
    return typeof navigator !== 'undefined' ? navigator.onLine : false;
  });

  const [config, setConfig] = useState<EngineConfig>(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('patak_engine_config') : null;
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {}
    }
    return {
      mode: 'in_browser',
      ollamaUrl: 'http://localhost:11434',
      ollamaModel: 'qwen2.5:3b',
      ollamaEmbeddingModel: 'nomic-embed-text',
      fastApiUrl: 'http://localhost:8000',
      wifiDisabled: !isOnline,
      topK: 4,
      language: 'bilingual'
    };
  });

  // Track network changes automatically and subscribe to advisory updates
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setConfig(prev => ({ ...prev, wifiDisabled: false }));
    };

    const handleOffline = () => {
      setIsOnline(false);
      setConfig(prev => ({ ...prev, wifiDisabled: true }));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const unsubscribe = subscribeToAdvisories(docs => {
      setTotalDocsCount(docs.length);
    });

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      unsubscribe();
    };
  }, []);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-msg',
      role: 'assistant',
      content: `Magandang araw! Ako si Patak, ang inyong offline assistant para sa El Niño response.

Maaari kayong magtanong sa English o Taglish tungkol sa:
1. Palayan at Tubig: Alternate Wetting and Drying (AWD) at matitibay na binhi mula sa DA-PhilRice.
2. Panahon at Ulan: Drought updates at rainfall forecast mula sa PAGASA Bulletin #14.
3. Kaligtasan sa Init: First aid sa heat stroke at split-shift labor mula sa DOH.
4. Alagang Hayop: Pagpapalamig sa kulungan ng baboy at manok mula sa DA-BAI.
5. Rasyon ng Tubig: 20-litro household quota at balon guidelines mula sa DILG.
6. Sariling Files: Maaari kayong mag-upload ng PDF o text files sa Advisory Library at susuriin ito ng AI.`,
      timestamp: 'Ngayon',
      sources: [
        'DA_AWD_Rice_Protocol_2024.pdf (Page 1)',
        'PAGASA_Drought_Bulletin_14.pdf (Page 1)',
        'DOH_Heat_Health_Protocol_2024.pdf (Page 1)',
        'DILG_LGU_Water_Contingency_MC2024.pdf (Page 1)'
      ],
      modelUsed: 'Patak Built-in Engine',
      isOffline: true
    }
  ]);

  const handleSendMessage = async (queryText: string) => {
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: queryText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const response = await executeRAGQuery(queryText, config);

      const assistantMsg: ChatMessage = {
        id: `assist-${Date.now()}`,
        role: 'assistant',
        content: response.content,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        sources: response.sources,
        contextChunks: response.contextChunks,
        checklist: response.checklist, // only present if the question called for an action checklist!
        modelUsed: response.modelUsed,
        isOffline: true
      };

      setMessages(prev => [...prev, assistantMsg]);
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        role: 'assistant',
        content: `⚠️ Paumanhin, nagkaroon ng aberya sa pagsusuri: ${err?.message || 'Lokal na koneksyon error'}. Mangyaring subukang muli.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isOffline: true
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleChecklist = (messageId: string, itemId: string) => {
    setMessages(prev =>
      prev.map(msg => {
        if (msg.id !== messageId || !msg.checklist) return msg;
        return {
          ...msg,
          checklist: msg.checklist.map(item =>
            item.id === itemId ? { ...item, isDone: !item.isDone } : item
          )
        };
      })
    );
  };

  const handleSelectQueryFromAdvisory = (query: string) => {
    setActiveTab('chat');
    handleSendMessage(query);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-body selection:bg-blue-100 selection:text-blue-900">
      {/* Top Header */}
      <Header
        config={config}
        isOnline={isOnline}
        totalAdvisoriesCount={totalDocsCount}
        onOpenSettings={() => setIsSettingsOpen(true)}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col">
        {activeTab === 'chat' ? (
          <ChatInterface
            messages={messages}
            isLoading={isLoading}
            config={config}
            onSendMessage={handleSendMessage}
            onToggleChecklist={handleToggleChecklist}
            onOpenVoice={() => setIsVoiceOpen(true)}
            onNavigateToAdvisories={() => setActiveTab('advisories')}
          />
        ) : (
          <AdvisoryLibrary
            onSelectQueryFromAdvisory={handleSelectQueryFromAdvisory}
          />
        )}
      </main>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        config={config}
        onSaveConfig={setConfig}
        isOnline={isOnline}
      />

      {/* Voice Input Modal */}
      <VoiceModal
        isOpen={isVoiceOpen}
        onClose={() => setIsVoiceOpen(false)}
        onSendTranscript={handleSendMessage}
      />
    </div>
  );
}
