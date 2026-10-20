import React, { useState, useRef } from 'react';
import { Upload, FileText, Sparkles, X, BookOpen, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { ParsedEpubBook, parseEpubFile } from '../utils/epub-parser';
import { SAMPLE_BOOKS } from '../data/sample-books';

interface DropzoneModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBookLoaded: (book: ParsedEpubBook) => void;
  currentBookTitle?: string;
}

export const DropzoneModal: React.FC<DropzoneModalProps> = ({
  isOpen,
  onClose,
  onBookLoaded,
  currentBookTitle,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingStatus, setLoadingStatus] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleProcessFile = async (file: File) => {
    setIsLoading(true);
    setError(null);
    setLoadingStatus(`Reading ${file.name}...`);

    try {
      const buffer = await file.arrayBuffer();
      setLoadingStatus('Unpacking EPUB structure & chapters...');

      const book = await parseEpubFile(buffer, file.name);

      if (book.chapters.length === 0) {
        throw new Error('No chapters or readable text could be extracted from this file.');
      }

      setLoadingStatus(`Extracted ${book.chapters.length} chapters! Initializing voice narrator...`);
      setTimeout(() => {
        setIsLoading(false);
        onBookLoaded(book);
        onClose();
      }, 300);
    } catch (err: unknown) {
      console.error('File parsing error:', err);
      setIsLoading(false);
      setError((err as Error).message || 'Failed to parse EPUB file. Please check the file format.');
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      handleProcessFile(file);
    }
  };

  const handleSelectSample = (sample: ParsedEpubBook) => {
    onBookLoaded(sample);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-2xl bg-[#141622] border border-white/10 rounded-2xl p-6 sm:p-8 shadow-2xl text-white">
        {/* Close button if we already have a book loaded */}
        {currentBookTitle && (
          <button
            onClick={onClose}
            aria-label="Close dialog"
            className="absolute top-5 right-5 p-2 rounded-lg text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 mb-3">
            <Upload className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight">Convert EPUB to Audiobook</h2>
          <p className="text-sm text-slate-400 mt-1 max-w-md mx-auto">
            Drop your <span className="text-amber-300 font-medium">.epub</span> or <span className="text-amber-300 font-medium">.ep</span> ebook file below. We extract full chapters, covers, and table of contents for AI narration.
          </p>
        </div>

        {/* Drag and drop box */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => !isLoading && fileInputRef.current?.click()}
          className={`relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
            isDragging
              ? 'border-amber-400 bg-amber-500/10 scale-[1.01]'
              : 'border-white/15 bg-white/[0.02] hover:border-amber-400/50 hover:bg-white/[0.04]'
          } ${isLoading ? 'pointer-events-none opacity-80' : ''}`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".epub,.ep,.txt,.html"
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                handleProcessFile(e.target.files[0]);
              }
            }}
          />

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-4">
              <Loader2 className="w-10 h-10 text-amber-400 animate-spin mb-3" />
              <p className="text-sm font-medium text-amber-200">{loadingStatus}</p>
              <p className="text-xs text-slate-400 mt-1">Extracting chapters & formatting speech units</p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center">
              <div className="w-14 h-14 rounded-full bg-white/5 flex items-center justify-center mb-3 text-amber-400 group-hover:scale-110 transition-transform">
                <FileText className="w-7 h-7" />
              </div>
              <p className="font-semibold text-base mb-1">
                Drop your EPUB file here, or <span className="text-amber-400 underline decoration-amber-400/50">browse files</span>
              </p>
              <p className="text-xs text-slate-400">
                Supports Standard EPUB (.epub), .ep, raw text, or book manuscripts
              </p>
            </div>
          )}
        </div>

        {/* Error message if any */}
        {error && (
          <div className="mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {/* Quick-play Sample Books Divider */}
        <div className="mt-7">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-px bg-white/10 flex-1"></div>
            <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Or Try A Classic Pre-Loaded Audiobook
            </span>
            <div className="h-px bg-white/10 flex-1"></div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {SAMPLE_BOOKS.map((sample) => (
              <button
                key={sample.metadata.title}
                onClick={() => handleSelectSample(sample)}
                className="group relative flex flex-col items-start p-3.5 rounded-xl bg-white/[0.03] hover:bg-amber-500/10 border border-white/10 hover:border-amber-500/40 transition-all text-left"
              >
                <div className="flex items-center gap-2 mb-2 w-full">
                  <div className={`w-7 h-9 rounded-md bg-gradient-to-br ${sample.metadata.coverUrl || 'from-amber-700 to-stone-900'} shadow-md flex items-center justify-center text-[9px] font-bold text-amber-200 border border-white/20 shrink-0`}>
                    EPUB
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-xs font-bold text-white group-hover:text-amber-300 truncate">
                      {sample.metadata.title}
                    </h4>
                    <p className="text-[11px] text-slate-400 truncate">{sample.metadata.author}</p>
                  </div>
                </div>
                <div className="text-[10px] text-slate-400 mt-auto flex items-center justify-between w-full pt-1 border-t border-white/5">
                  <span>{sample.chapters.length} Chapters</span>
                  <span className="text-amber-400 font-medium">Ready</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
