import React from 'react';
import { Headphones, BookOpen, Upload, Moon, Bookmark as BookmarkIcon, Sparkles } from 'lucide-react';
import { AudiobookMetadata } from '../utils/epub-parser';

interface HeaderProps {
  metadata: AudiobookMetadata | null;
  activeView: 'player' | 'reader';
  onToggleView: (view: 'player' | 'reader') => void;
  onOpenUpload: () => void;
  onOpenBookmarks: () => void;
  onOpenChapters: () => void;
  sleepTimerLeft: number | null; // in seconds
  onOpenSleepModal: () => void;
  hasGeminiKey: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  metadata,
  activeView,
  onToggleView,
  onOpenUpload,
  onOpenBookmarks,
  onOpenChapters,
  sleepTimerLeft,
  onOpenSleepModal,
  hasGeminiKey,
}) => {
  const formatTimer = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <header className="sticky top-0 z-30 bg-[#0f111a]/90 backdrop-blur-md border-b border-white/10 px-4 lg:px-8 py-3.5 transition-colors">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Brand / Logo */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 via-orange-600 to-rose-600 flex items-center justify-center shadow-lg shadow-amber-500/20 text-white font-bold ring-1 ring-white/20">
            <Headphones className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-title-vintage tracking-wider font-bold text-lg text-white">AudioBookify</span>
              <span className="text-[11px] font-semibold uppercase tracking-wider bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full border border-amber-500/30">
                EPUB Studio
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">
              Turn any EPUB into an AI Audiobook
            </p>
          </div>
        </div>

        {/* Center: View Switcher */}
        {metadata && (
          <div className="flex items-center bg-white/5 p-1 rounded-xl border border-white/10 text-xs font-medium">
            <button
              onClick={() => onToggleView('player')}
              aria-label="Switch to Audiobook Player view"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                activeView === 'player'
                  ? 'bg-amber-500 text-stone-950 font-semibold shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <Headphones className="w-3.5 h-3.5" />
              <span>Audio Studio</span>
            </button>
            <button
              onClick={() => onToggleView('reader')}
              aria-label="Switch to Synchronized Text Reader view"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                activeView === 'reader'
                  ? 'bg-amber-500 text-stone-950 font-semibold shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Read Along</span>
            </button>
          </div>
        )}

        {/* Right Action buttons */}
        <div className="flex items-center gap-2">
          {/* Sleep timer status if active */}
          {sleepTimerLeft !== null && (
            <button
              onClick={onOpenSleepModal}
              aria-label="View sleep timer countdown"
              className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 hover:bg-indigo-500/30 transition-colors"
            >
              <Moon className="w-3.5 h-3.5 animate-pulse" />
              <span>{formatTimer(sleepTimerLeft)}</span>
            </button>
          )}

          {metadata && (
            <>
              {/* Table of contents button */}
              <button
                onClick={onOpenChapters}
                aria-label="Open Table of Contents"
                className="hidden sm:flex items-center gap-1.5 text-xs text-slate-300 hover:text-white px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 transition-colors"
              >
                <BookOpen className="w-3.5 h-3.5 text-amber-400" />
                <span>Chapters</span>
              </button>

              {/* Bookmarks button */}
              <button
                onClick={onOpenBookmarks}
                aria-label="Open Saved Bookmarks"
                className="p-2 rounded-lg text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition-colors"
                title="Bookmarks"
              >
                <BookmarkIcon className="w-4 h-4" />
              </button>
            </>
          )}

          {/* Upload / Switch Book button */}
          <button
            onClick={onOpenUpload}
            aria-label="Upload EPUB or Choose Book"
            className="flex items-center gap-1.5 text-xs font-semibold px-3.5 py-2 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 text-stone-950 hover:brightness-110 active:scale-95 transition-all shadow-md shadow-amber-500/20"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>{metadata ? 'Change EPUB' : 'Import EPUB'}</span>
          </button>
        </div>
      </div>
    </header>
  );
};
