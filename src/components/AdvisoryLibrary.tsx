import React, { useState, useRef, useEffect } from 'react';
import {
  Search,
  FileText,
  Upload,
  Copy,
  Check,
  ChevronRight,
  FileUp,
  CheckCircle2,
  Trash2,
  AlertCircle,
  BookOpen,
  MessageSquareShare,
  Pencil,
  X
} from 'lucide-react';
import { AdvisoryDocument } from '../types';
import {
  getAllAdvisories,
  processUploadedFile,
  deleteUploadedAdvisory,
  renameUploadedAdvisory,
  subscribeToAdvisories
} from '../services/advisoryStore';
import { getActiveChunksCount } from '../services/localRAG';

interface AdvisoryLibraryProps {
  onSelectQueryFromAdvisory: (query: string) => void;
  focusedDocumentId?: string | null;
}

export const AdvisoryLibrary: React.FC<AdvisoryLibraryProps> = ({
  onSelectQueryFromAdvisory,
  focusedDocumentId
}) => {
  const [documents, setDocuments] = useState<AdvisoryDocument[]>(getAllAdvisories());
  const [search, setSearch] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<string>('ALL');
  const [activeDoc, setActiveDoc] = useState<AdvisoryDocument | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  
  const [renameDoc, setRenameDoc] = useState<AdvisoryDocument | null>(null);
  const [renameTitle, setRenameTitle] = useState('');
  const [renameFileName, setRenameFileName] = useState('');
  const [renameSummary, setRenameSummary] = useState('');
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Subscribe to changes in advisoryStore
  useEffect(() => {
    const unsubscribe = subscribeToAdvisories(updatedDocs => {
      setDocuments(updatedDocs);
      if (!activeDoc && updatedDocs.length > 0) {
        setActiveDoc(updatedDocs[0]);
      } else if (activeDoc) {
        const found = updatedDocs.find(d => d.id === activeDoc.id);
        setActiveDoc(found || updatedDocs[0] || null);
      }
    });

    if (focusedDocumentId) {
      const focused = documents.find(d => d.id === focusedDocumentId) ||
        documents.find(d => d.source === focusedDocumentId);
      if (focused) setActiveDoc(focused);
    } else if (documents.length > 0 && !activeDoc) {
      setActiveDoc(documents[0]);
    }

    return () => unsubscribe();
  }, [activeDoc, documents.length, focusedDocumentId]);

  const filterOptions = [
    { id: 'ALL', label: 'Lahat' },
    { id: 'USER_UPLOAD', label: 'Aking mga Upload' },
    { id: 'DA', label: 'DA-PhilRice' },
    { id: 'PAGASA', label: 'PAGASA' },
    { id: 'DOH', label: 'DOH' },
    { id: 'DILG', label: 'DILG' },
    { id: 'DA-BAI', label: 'DA-BAI' }
  ];

  const filteredDocs = documents.filter(doc => {
    const matchesFilter =
      selectedFilter === 'ALL'
        ? true
        : selectedFilter === 'USER_UPLOAD'
        ? doc.agency === 'USER_UPLOAD' || doc.isUploaded
        : doc.agency === selectedFilter;

    const matchesSearch =
      doc.title.toLowerCase().includes(search.toLowerCase()) ||
      doc.summary.toLowerCase().includes(search.toLowerCase()) ||
      doc.source.toLowerCase().includes(search.toLowerCase()) ||
      doc.fullText.toLowerCase().includes(search.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const ingestFile = async (file: File) => {
    setIsProcessing(true);
    setUploadStatus({
      type: 'success',
      message: `Binabasa ang file na ${file.name}...`
    });

    try {
      const { doc, ragChunks } = await processUploadedFile(file);
      setActiveDoc(doc);
      setUploadStatus({
        type: 'success',
        message: `Tagumpay na na-upload ang "${file.name}"! (${ragChunks.length} chunks ang nai-save para sa offline AI).`
      });
      setTimeout(() => setUploadStatus(null), 5000);
    } catch (err: any) {
      setUploadStatus({
        type: 'error',
        message: `Hindi na-upload ang file: ${err?.message || 'Error sa pagbasa'}`
      });
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await ingestFile(file);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) await ingestFile(file);
  };

  const handleDelete = (e: React.MouseEvent, docId: string) => {
    e.stopPropagation();
    if (confirm('Sigurado ka bang nais mong tanggalin ang dokumentong ito?')) {
      deleteUploadedAdvisory(docId);
      setUploadStatus({
        type: 'success',
        message: 'Natanggal na ang dokumento sa offline memory.'
      });
      setTimeout(() => setUploadStatus(null), 3000);
    }
  };

  const startRenaming = (doc: AdvisoryDocument) => {
    setRenameDoc(doc);
    setRenameTitle(doc.title);
    setRenameFileName(doc.source);
    setRenameSummary(doc.summary);
  };

  const handleSaveRename = () => {
    if (!renameDoc) return;
    if (!renameTitle.trim() && !renameFileName.trim()) {
      setRenameDoc(null);
      return;
    }

    renameUploadedAdvisory(renameDoc.id, {
      title: renameTitle.trim() || renameDoc.title,
      fileName: renameFileName.trim() || renameDoc.source,
      summary: renameSummary.trim() || renameDoc.summary
    });

    setUploadStatus({
      type: 'success',
      message: `Napalitan ang pangalan: "${renameTitle.trim() || renameDoc.title}" (${renameFileName.trim() || renameDoc.source}).`
    });
    setTimeout(() => setUploadStatus(null), 3000);
    setRenameDoc(null);
  };

  const handleAskAboutDoc = (doc: AdvisoryDocument) => {
    const sampleQuery = `Ano ang buod at mga rekomendasyon sa dokumentong "${doc.title}"?`;
    onSelectQueryFromAdvisory(sampleQuery);
  };

  return (
    <div className="max-w-5xl mx-auto px-3 sm:px-4 py-4 flex-1 flex flex-col h-[calc(100vh-65px)]">
      {/* Top Banner */}
      <div
        onDragOver={e => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`mb-3 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white p-4 rounded-2xl border shadow-xs transition-colors ${
          isDragging ? 'border-blue-500 bg-blue-50/70' : 'border-slate-200'
        }`}
      >
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-lg sm:text-xl font-heading font-black text-slate-900">
              Advisories at Dokumento
            </h2>
            <span className="inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-300">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
              Naka-save sa iyong device
            </span>
          </div>
          <p className="text-xs text-slate-500 font-body mt-0.5">
            I-drag at i-drop ang PDF o text, o mag-upload. Maaari ring palitan ang filename — hindi title lang. May <span className="text-blue-700 font-semibold">{getActiveChunksCount()} chunks</span> na handang gamitin ng AI.
          </p>
        </div>

        {/* Upload Action */}
        <div>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".pdf,.txt,.md,.json,.csv"
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isProcessing}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-heading font-bold text-white bg-blue-600 hover:bg-blue-700 active:scale-98 shadow-sm transition-all cursor-pointer disabled:opacity-50"
          >
            <FileUp className="w-4 h-4" />
            <span>{isProcessing ? 'Pinoproseso ang file...' : 'Mag-upload ng PDF o Text'}</span>
          </button>
        </div>
      </div>

      {/* Upload Notification */}
      {uploadStatus && (
        <div
          className={`mb-3 p-3 rounded-xl border text-xs font-medium flex items-center gap-2.5 transition-all ${
            uploadStatus.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-rose-50 border-rose-200 text-rose-900'
          }`}
        >
          {uploadStatus.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span>{uploadStatus.message}</span>
        </div>
      )}

      {/* Main 2-Column Layout */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-3 min-h-0">
        {/* Left Column: Search & Document List (5 cols) */}
        <div className="md:col-span-5 flex flex-col bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          {/* Search Bar & Filters */}
          <div className="p-3 border-b border-slate-100 space-y-2 bg-slate-50/50">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Maghanap ng advisory o paksa..."
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl placeholder:text-slate-400 focus:outline-hidden focus:border-blue-600 font-body"
              />
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px] no-scrollbar">
              {filterOptions.map(f => (
                <button
                  key={f.id}
                  onClick={() => setSelectedFilter(f.id)}
                  className={`px-2.5 py-1 rounded-lg font-semibold shrink-0 transition-all cursor-pointer ${
                    selectedFilter === f.id
                      ? 'bg-blue-600 text-white shadow-2xs'
                      : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Document Items List */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 p-1">
            {filteredDocs.length === 0 ? (
              <div className="p-8 text-center text-slate-400">
                <BookOpen className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p className="text-xs font-semibold">Walang nahanap na dokumento.</p>
                <p className="text-[11px] mt-1">Subukang magpalit ng keyword o mag-upload ng bagong file.</p>
              </div>
            ) : (
              filteredDocs.map(doc => {
                const isSelected = activeDoc?.id === doc.id;
                const isUploaded = doc.isUploaded || doc.agency === 'USER_UPLOAD';

                return (
                  <div
                    key={doc.id}
                    onClick={() => setActiveDoc(doc)}
                    className={`p-3 rounded-xl transition-all cursor-pointer m-1 relative group ${
                      isSelected
                        ? 'bg-blue-50/90 border border-blue-200 shadow-2xs'
                        : 'hover:bg-slate-50 border border-transparent'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                          <span
                            className={`text-[9px] font-heading font-extrabold px-2 py-0.2 rounded-md ${
                              isUploaded
                                ? 'bg-amber-100 text-amber-900 border border-amber-200'
                                : 'bg-blue-100 text-blue-900 border border-blue-200'
                            }`}
                          >
                            {isUploaded ? 'UPLOADED' : doc.agency}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono truncate">
                            {doc.source}
                          </span>
                        </div>

                        <h4
                          className={`text-xs font-heading font-bold leading-snug line-clamp-2 ${
                            isSelected ? 'text-blue-950' : 'text-slate-800'
                          }`}
                        >
                          {doc.title}
                        </h4>

                        <p className="text-[11px] text-slate-500 font-body line-clamp-2 mt-1">
                          {doc.summary}
                        </p>
                      </div>

                      {/* Action buttons for uploaded files */}
                      {isUploaded && (
                        <div className="flex items-center gap-1 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={e => {
                              e.stopPropagation();
                              startRenaming(doc);
                            }}
                            title="Palitan ang title at filename"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all cursor-pointer"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={e => handleDelete(e, doc.id)}
                            title="Tanggalin"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Active Document Details & Ask AI (7 cols) */}
        <div className="md:col-span-7 flex flex-col bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          {activeDoc ? (
            <div className="flex-1 flex flex-col min-h-0">
              {/* Header */}
              <div className="p-4 border-b border-slate-100 bg-slate-50/40">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                          activeDoc.isUploaded
                            ? 'bg-amber-100 text-amber-900 border border-amber-200'
                            : 'bg-blue-100 text-blue-900 border border-blue-200'
                        }`}
                      >
                        {activeDoc.isUploaded ? 'Uploaded Document' : `Ahensya: ${activeDoc.agency}`}
                      </span>
                      <span className="text-xs text-slate-500 font-mono">
                        {activeDoc.source} · {activeDoc.pageCount || 1} pahina
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <h3 className="text-sm sm:text-base font-heading font-extrabold text-slate-900 leading-snug">
                        {activeDoc.title}
                      </h3>
                      {(activeDoc.isUploaded || activeDoc.agency === 'USER_UPLOAD') && (
                        <button
                          onClick={() => startRenaming(activeDoc)}
                          title="Palitan ang title at filename"
                          className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer shrink-0"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Copy Button */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => handleCopy(activeDoc.id, activeDoc.fullText)}
                      title="Kopyahin ang buong teksto"
                      className="p-2 rounded-xl text-slate-600 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer"
                    >
                      {copiedId === activeDoc.id ? (
                        <Check className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Ask AI button */}
                <div className="mt-3 pt-3 border-t border-slate-200/60 flex items-center justify-between gap-2">
                  <span className="text-[11px] text-slate-500 hidden sm:inline">
                    Mabilis na pagsusuri gamit ang AI:
                  </span>
                  <button
                    onClick={() => handleAskAboutDoc(activeDoc)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-heading font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 transition-colors cursor-pointer ml-auto"
                  >
                    <MessageSquareShare className="w-3.5 h-3.5" />
                    <span>Tanungin ang AI tungkol dito</span>
                  </button>
                </div>
              </div>

              {/* Document Details & Chunks */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {/* Summary Card */}
                <div className="p-3.5 rounded-xl bg-blue-50/60 border border-blue-100 text-xs text-slate-800 space-y-1">
                  <span className="font-heading font-bold text-blue-950 uppercase text-[10px] tracking-wider block">
                    Buod:
                  </span>
                  <p className="font-body leading-relaxed text-slate-700">
                    {activeDoc.summary}
                  </p>
                </div>

                {/* Chunks */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-heading font-bold text-slate-700 uppercase tracking-wider">
                      Mga Naka-index na Bahagi ({activeDoc.chunks?.length || 0}):
                    </span>
                    <span className="text-[10px] text-slate-400">
                      May page reference
                    </span>
                  </div>

                  <div className="space-y-2">
                    {activeDoc.chunks && activeDoc.chunks.length > 0 ? (
                      activeDoc.chunks.map((chunk, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() =>
                            onSelectQueryFromAdvisory(
                              `Ipaliwanag ang bahaging ito mula sa "${activeDoc.title}": ${chunk.slice(0, 180)}`
                            )
                          }
                          className="w-full text-left p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-xs text-slate-800 space-y-1 hover:border-blue-300 hover:bg-blue-50/40 transition-colors cursor-pointer"
                        >
                          <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                            <span>Bahagi #{idx + 1}</span>
                            <span className="text-blue-600 font-semibold">Tanungin ang AI</span>
                          </div>
                          <p className="font-body leading-relaxed text-slate-700">
                            {chunk}
                          </p>
                        </button>
                      ))
                    ) : (
                      <div className="p-4 rounded-xl bg-slate-50 text-slate-500 text-xs text-center">
                        Walang mga bahagi na nakaimbak.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400">
              <FileText className="w-10 h-10 mb-2 opacity-30" />
              <p className="text-sm font-semibold">Pumili ng dokumento upang makita ang detalye.</p>
            </div>
          )}
        </div>
      </div>

      {renameDoc && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-[2px] flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-heading font-extrabold text-slate-900">
                Palitan ang pangalan ng file
              </h3>
              <button
                onClick={() => setRenameDoc(null)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-[11px] text-slate-500">
              Hindi title lang — maaari ring palitan ang actual filename na ginagamit sa citations at RAG search.
            </p>
            <label className="block space-y-1">
              <span className="text-[10px] font-heading font-bold uppercase tracking-wider text-slate-500">
                Display title
              </span>
              <input
                type="text"
                value={renameTitle}
                onChange={e => setRenameTitle(e.target.value)}
                className="w-full text-sm px-3 py-2 border border-slate-200 rounded-xl focus:outline-hidden focus:border-blue-500"
              />
            </label>
            <label className="block space-y-1">
              <span className="text-[10px] font-heading font-bold uppercase tracking-wider text-slate-500">
                Filename
              </span>
              <input
                type="text"
                value={renameFileName}
                onChange={e => setRenameFileName(e.target.value)}
                className="w-full text-sm px-3 py-2 border border-slate-200 rounded-xl font-mono focus:outline-hidden focus:border-blue-500"
              />
            </label>
            <label className="block space-y-1">
              <span className="text-[10px] font-heading font-bold uppercase tracking-wider text-slate-500">
                Buod
              </span>
              <textarea
                value={renameSummary}
                onChange={e => setRenameSummary(e.target.value)}
                rows={3}
                className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl focus:outline-hidden focus:border-blue-500 font-body"
              />
            </label>
            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                onClick={() => setRenameDoc(null)}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 text-slate-600 hover:bg-slate-200 cursor-pointer"
              >
                Kansela
              </button>
              <button
                onClick={handleSaveRename}
                className="px-3 py-1.5 rounded-xl text-xs font-heading font-bold bg-blue-600 text-white hover:bg-blue-700 cursor-pointer"
              >
                I-save ang pangalan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
