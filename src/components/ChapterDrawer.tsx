import React, { useState } from 'react';
import { X, BookOpen, Clock, CheckCircle, Wand2, Sparkles, Loader2, Play } from 'lucide-react';
import { AudiobookChapter } from '../utils/epub-parser';
import { formatAudioTime } from '../utils/audiobook-logic';

interface ChapterDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  chapters: AudiobookChapter[];
  currentChapterIndex: number;
  onSelectChapter: (index: number) => void;
  isPlaying: boolean;
}

export const ChapterDrawer: React.FC<ChapterDrawerProps> = ({
  isOpen,
  onClose,
  chapters,
  currentChapterIndex,
  onSelectChapter,
  isPlaying,
}) => {
  const [activeTab, setActiveTab] = useState<'chapters' | 'summary'>('chapters');
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryText, setSummaryText] = useState<string | null>(null);
  const [summaryError, setSummaryError] = useState<string | null>(null);

  if (!isOpen) return null;

  const currentChapter = chapters[currentChapterIndex];

  const handleFetchSummary = async () => {
    if (!currentChapter) return;
    setSummaryLoading(true);
    setSummaryError(null);

    try {
      const res = await fetch('/api/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chapterTitle: currentChapter.title,
          text: currentChapter.cleanedText.slice(0, 4000),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to generate chapter summary');
      }

      setSummaryText(data.summary);
    } catch (err: unknown) {
      setSummaryError((err as Error).message || 'Failed to connect to AI summary service');
    } finally {
      setSummaryLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md bg-[#131522] border-l border-white/10 h-full flex flex-col shadow-2xl text-white">
        {/* Header */}
        <div className="p-5 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-amber-400" />
            <h2 className="font-bold text-base">Table of Contents</h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Close chapters menu"
            className="p-1.5 rounded-lg text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switch */}
        <div className="flex border-b border-white/10 bg-white/[0.02] p-1 gap-1">
          <button
            onClick={() => setActiveTab('chapters')}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1.5 ${
              activeTab === 'chapters'
                ? 'bg-amber-500 text-stone-950 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>Chapters ({chapters.length})</span>
          </button>
          <button
            onClick={() => {
              setActiveTab('summary');
              if (!summaryText && !summaryLoading) {
                handleFetchSummary();
              }
            }}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1.5 ${
              activeTab === 'summary'
                ? 'bg-amber-500 text-stone-950 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Chapter Director</span>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {activeTab === 'chapters' ? (
            chapters.map((ch, idx) => {
              const isSelected = idx === currentChapterIndex;
              return (
                <button
                  key={ch.id}
                  onClick={() => {
                    onSelectChapter(idx);
                    onClose();
                  }}
                  className={`w-full flex items-start justify-between p-3.5 rounded-xl border text-left transition-all ${
                    isSelected
                      ? 'bg-amber-500/15 border-amber-500/60 shadow-md'
                      : 'bg-white/[0.02] border-white/5 hover:bg-white/[0.06] hover:border-white/15'
                  }`}
                >
                  <div className="min-w-0 flex-1 pr-3">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[11px] font-mono text-amber-400/80">
                        {String(idx + 1).padStart(2, '0')}
                      </span>
                      {isSelected && isPlaying && (
                        <span className="flex items-center gap-1 text-[10px] font-bold text-amber-300 uppercase tracking-wider bg-amber-500/20 px-1.5 py-0.5 rounded">
                          <Play className="w-2.5 h-2.5 fill-current" /> Playing
                        </span>
                      )}
                    </div>
                    <h3 className={`text-sm font-semibold truncate ${isSelected ? 'text-amber-200' : 'text-slate-200'}`}>
                      {ch.title}
                    </h3>
                    <p className="text-[11px] text-slate-400 mt-1 line-clamp-1">
                      {ch.sentences[0] || ''}
                    </p>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="flex items-center gap-1 text-xs text-slate-400">
                      <Clock className="w-3 h-3 text-slate-500" />
                      <span>{formatAudioTime(ch.durationSeconds)}</span>
                    </div>
                    <span className="text-[10px] text-slate-500 mt-0.5 block">
                      {ch.wordCount.toLocaleString()} words
                    </span>
                  </div>
                </button>
              );
            })
          ) : (
            <div className="p-2 space-y-4">
              <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/20 text-xs text-purple-200">
                <div className="flex items-center gap-1.5 font-bold mb-1">
                  <Wand2 className="w-4 h-4 text-purple-400" />
                  <span>AI Audiobook Director Recap</span>
                </div>
                <p className="text-[11px] text-purple-300/80">
                  Analyzing <span className="font-semibold text-white">{currentChapter?.title}</span> for plot beats, mood, and dramatic narration delivery.
                </p>
              </div>

              {summaryLoading ? (
                <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                  <Loader2 className="w-8 h-8 text-amber-400 animate-spin mb-3" />
                  <p className="text-xs">Generating director analysis with Gemini...</p>
                </div>
              ) : summaryError ? (
                <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs">
                  <p>{summaryError}</p>
                  <button
                    onClick={handleFetchSummary}
                    className="mt-3 px-3 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 font-semibold"
                  >
                    Retry Analysis
                  </button>
                </div>
              ) : summaryText ? (
                <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 text-slate-200 text-xs leading-relaxed whitespace-pre-wrap">
                  {summaryText}
                </div>
              ) : (
                <button
                  onClick={handleFetchSummary}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-stone-950 font-bold text-xs shadow-md"
                >
                  Generate Director Recap
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
