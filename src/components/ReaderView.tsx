import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  Type,
  Sun,
  Moon,
  Bookmark,
  ChevronLeft,
  ChevronRight,
  Headphones,
  Sliders
} from 'lucide-react';
import { AudiobookChapter, AudiobookMetadata } from '../utils/epub-parser';

interface ReaderViewProps {
  currentChapter: AudiobookChapter;
  currentChapterIndex: number;
  totalChapters: number;
  currentSentenceIndex: number;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onSeek: (sentenceIndex: number) => void;
  onPrevChapter: () => void;
  onNextChapter: () => void;
  onAddBookmark: (sentenceIndex: number, text: string) => void;
  onSwitchToPlayer: () => void;
  playbackRate: number;
  onChangePlaybackRate: (rate: number) => void;
}

type ReaderTheme = 'dark' | 'sepia' | 'light';
type FontSize = 'sm' | 'md' | 'lg' | 'xl';
type FontFamily = 'serif' | 'sans';

export const ReaderView: React.FC<ReaderViewProps> = ({
  currentChapter,
  currentChapterIndex,
  totalChapters,
  currentSentenceIndex,
  isPlaying,
  onTogglePlay,
  onSeek,
  onPrevChapter,
  onNextChapter,
  onAddBookmark,
  onSwitchToPlayer,
  playbackRate,
  onChangePlaybackRate,
}) => {
  const [theme, setTheme] = useState<ReaderTheme>('dark');
  const [fontSize, setFontSize] = useState<FontSize>('lg');
  const [fontFamily, setFontFamily] = useState<FontFamily>('serif');
  const activeSentenceRef = useRef<HTMLSpanElement>(null);

  // Auto-scroll to active sentence when playing
  useEffect(() => {
    if (isPlaying && activeSentenceRef.current) {
      activeSentenceRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [currentSentenceIndex, isPlaying]);

  const fontSizeClasses = {
    sm: 'text-base leading-relaxed',
    md: 'text-lg leading-loose',
    lg: 'text-xl leading-loose',
    xl: 'text-2xl leading-loose',
  };

  const themeClasses = {
    dark: 'bg-[#12131c] text-slate-200 border-white/10',
    sepia: 'bg-[#f4ecd8] text-[#3c2f1f] border-amber-900/10',
    light: 'bg-[#fafafa] text-slate-900 border-slate-200',
  };

  const highlightClasses = {
    dark: 'bg-amber-500/25 text-amber-200 font-semibold ring-2 ring-amber-400/40 rounded px-1',
    sepia: 'bg-amber-300 text-amber-950 font-bold ring-2 ring-amber-500/50 rounded px-1',
    light: 'bg-amber-200 text-amber-950 font-semibold ring-2 ring-amber-400/60 rounded px-1',
  };

  const sentences = currentChapter.sentences || [];

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 animate-fade-in pb-28">
      {/* Top Reader Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6 p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <button
            onClick={onSwitchToPlayer}
            className="flex items-center gap-1.5 text-xs text-amber-400 hover:text-amber-300 font-semibold px-2.5 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 transition-colors"
          >
            <Headphones className="w-3.5 h-3.5" />
            <span>Studio View</span>
          </button>

          <span className="text-xs text-slate-400 hidden sm:inline">
            Chapter {currentChapterIndex + 1} of {totalChapters}
          </span>
        </div>

        {/* Font styling tools */}
        <div className="flex items-center gap-3">
          {/* Font Family */}
          <div className="flex items-center bg-white/5 p-0.5 rounded-lg border border-white/10 text-xs">
            <button
              onClick={() => setFontFamily('serif')}
              className={`px-2 py-1 rounded font-serif ${fontFamily === 'serif' ? 'bg-amber-500 text-stone-950 font-bold' : 'text-slate-400 hover:text-white'}`}
            >
              Serif
            </button>
            <button
              onClick={() => setFontFamily('sans')}
              className={`px-2 py-1 rounded font-sans ${fontFamily === 'sans' ? 'bg-amber-500 text-stone-950 font-bold' : 'text-slate-400 hover:text-white'}`}
            >
              Sans
            </button>
          </div>

          {/* Font size */}
          <div className="flex items-center bg-white/5 p-0.5 rounded-lg border border-white/10 text-xs">
            {(['sm', 'md', 'lg', 'xl'] as FontSize[]).map((sz) => (
              <button
                key={sz}
                onClick={() => setFontSize(sz)}
                className={`px-2 py-1 rounded uppercase font-bold text-[10px] ${
                  fontSize === sz ? 'bg-amber-500 text-stone-950' : 'text-slate-400 hover:text-white'
                }`}
              >
                {sz}
              </button>
            ))}
          </div>

          {/* Theme toggler */}
          <div className="flex items-center bg-white/5 p-0.5 rounded-lg border border-white/10 text-xs">
            <button
              onClick={() => setTheme('dark')}
              className={`p-1.5 rounded ${theme === 'dark' ? 'bg-amber-500 text-stone-950' : 'text-slate-400 hover:text-white'}`}
              title="Dark Velvet Theme"
            >
              <Moon className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setTheme('sepia')}
              className={`p-1.5 rounded ${theme === 'sepia' ? 'bg-amber-500 text-stone-950' : 'text-slate-400 hover:text-white'}`}
              title="Warm Sepia Paper"
            >
              <span className="w-3.5 h-3.5 block rounded-full bg-[#f4ecd8] border border-stone-600" />
            </button>
            <button
              onClick={() => setTheme('light')}
              className={`p-1.5 rounded ${theme === 'light' ? 'bg-amber-500 text-stone-950' : 'text-slate-400 hover:text-white'}`}
              title="Bright Day Theme"
            >
              <Sun className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Book Reader Canvas */}
      <div
        className={`rounded-3xl p-6 sm:p-12 border shadow-2xl transition-colors duration-300 min-h-[600px] ${
          themeClasses[theme]
        } ${fontFamily === 'serif' ? 'font-serif-book' : 'font-sans'}`}
      >
        <div className="text-center mb-10 pb-8 border-b border-current/10">
          <span className="text-xs uppercase tracking-widest font-semibold opacity-60">
            Chapter {currentChapterIndex + 1}
          </span>
          <h2 className="text-2xl sm:text-4xl font-bold mt-2 tracking-tight">
            {currentChapter.title}
          </h2>
          <p className="text-xs opacity-60 mt-2">
            Click any sentence below to jump voice narration directly there.
          </p>
        </div>

        {/* Sentences with synchronized highlight */}
        <div className={`space-y-4 ${fontSizeClasses[fontSize]}`}>
          {sentences.map((sentence, idx) => {
            const isActive = idx === currentSentenceIndex;
            return (
              <span
                key={idx}
                ref={isActive ? activeSentenceRef : null}
                onClick={() => onSeek(idx)}
                className={`cursor-pointer transition-all duration-200 inline ${
                  isActive
                    ? highlightClasses[theme]
                    : 'hover:opacity-100 opacity-90'
                }`}
                title="Click to play from here"
              >
                {sentence}{' '}
              </span>
            );
          })}
        </div>

        {/* Chapter navigation footer */}
        <div className="flex items-center justify-between mt-14 pt-8 border-t border-current/10">
          <button
            onClick={onPrevChapter}
            disabled={currentChapterIndex === 0}
            className="flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-xl border border-current/20 disabled:opacity-30 transition-all hover:bg-current/5"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Previous Chapter</span>
          </button>

          <span className="text-xs opacity-60 font-medium">
            Sentence {currentSentenceIndex + 1} / {sentences.length}
          </span>

          <button
            onClick={onNextChapter}
            disabled={currentChapterIndex >= totalChapters - 1}
            className="flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-xl border border-current/20 disabled:opacity-30 transition-all hover:bg-current/5"
          >
            <span>Next Chapter</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Floating Bottom Audio Dock for comfortable reading control */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-[#161826]/95 border border-white/15 backdrop-blur-xl px-5 py-3 rounded-full shadow-2xl flex items-center gap-4 text-white">
        <button
          onClick={() => onSeek(Math.max(0, currentSentenceIndex - 1))}
          className="p-1.5 text-slate-300 hover:text-white transition-colors"
          title="Previous sentence"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        <button
          onClick={onTogglePlay}
          className="w-10 h-10 rounded-full bg-amber-500 text-stone-950 flex items-center justify-center font-bold shadow-md shadow-amber-500/30 hover:scale-105 active:scale-95 transition-all"
          title={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current translate-x-0.5" />}
        </button>

        <button
          onClick={() => onSeek(Math.min(sentences.length - 1, currentSentenceIndex + 1))}
          className="p-1.5 text-slate-300 hover:text-white transition-colors"
          title="Next sentence"
        >
          <RotateCw className="w-4 h-4" />
        </button>

        <div className="h-4 w-px bg-white/20" />

        <div className="flex items-center gap-1">
          {[1.0, 1.25, 1.5].map((rate) => (
            <button
              key={rate}
              onClick={() => onChangePlaybackRate(rate)}
              className={`text-[11px] px-2 py-0.5 rounded-md font-semibold transition-colors ${
                playbackRate === rate ? 'bg-amber-500 text-stone-950' : 'text-slate-400 hover:text-white'
              }`}
            >
              {rate}x
            </button>
          ))}
        </div>

        <div className="h-4 w-px bg-white/20" />

        <button
          onClick={() => onAddBookmark(currentSentenceIndex, sentences[currentSentenceIndex] || '')}
          className="p-1.5 text-amber-400 hover:text-amber-300 transition-colors"
          title="Bookmark active sentence"
        >
          <Bookmark className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
