import React, { useState } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Sparkles,
  Download,
  BookmarkPlus,
  Clock,
  Sliders,
  ChevronDown,
  Disc,
  Layers,
  Wand2,
  Check,
  CloudRain,
  Flame,
  BookOpen,
  Waves
} from 'lucide-react';
import { AudiobookChapter, AudiobookMetadata } from '../utils/epub-parser';
import { formatAudioTime } from '../utils/audiobook-logic';
import { GEMINI_VOICES, NARRATION_STYLES, VoiceOption } from '../utils/audio-engine';
import { SOUNDSCAPES, soundscapeManager } from '../utils/soundscapes';

interface PlayerViewProps {
  bookMetadata: AudiobookMetadata;
  currentChapter: AudiobookChapter;
  currentChapterIndex: number;
  totalChapters: number;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onPrevChapter: () => void;
  onNextChapter: () => void;
  onSeek: (sentenceIndex: number) => void;
  currentSentenceIndex: number;
  engineType: 'gemini' | 'browser';
  onChangeEngineType: (type: 'gemini' | 'browser') => void;
  selectedVoice: string;
  onChangeVoice: (voiceId: string) => void;
  selectedStyle: string;
  onChangeStyle: (stylePrompt: string) => void;
  playbackRate: number;
  onChangePlaybackRate: (rate: number) => void;
  onAddBookmark: () => void;
  onOpenSleepModal: () => void;
  onOpenExportModal: () => void;
  onOpenRecapModal: () => void;
  isLoadingAudio: boolean;
  activeSoundscape: string;
  onChangeSoundscape: (id: string) => void;
}

export const PlayerView: React.FC<PlayerViewProps> = ({
  bookMetadata,
  currentChapter,
  currentChapterIndex,
  totalChapters,
  isPlaying,
  onTogglePlay,
  onPrevChapter,
  onNextChapter,
  onSeek,
  currentSentenceIndex,
  engineType,
  onChangeEngineType,
  selectedVoice,
  onChangeVoice,
  selectedStyle,
  onChangeStyle,
  playbackRate,
  onChangePlaybackRate,
  onAddBookmark,
  onOpenSleepModal,
  onOpenExportModal,
  onOpenRecapModal,
  isLoadingAudio,
  activeSoundscape,
  onChangeSoundscape,
}) => {
  const [showVoiceDrawer, setShowVoiceDrawer] = useState(false);
  const [soundscapeVol, setSoundscapeVol] = useState(0.2);

  const sentences = currentChapter.sentences || [];
  const progressRatio = sentences.length > 0 ? (currentSentenceIndex + 1) / sentences.length : 0;

  // Approximate time calculations for current chapter
  const chapterDuration = currentChapter.durationSeconds / playbackRate;
  const currentElapsed = chapterDuration * progressRatio;
  const remainingTime = Math.max(0, chapterDuration - currentElapsed);

  const currentSentenceText = sentences[currentSentenceIndex] || 'Press play to start audiobook narration.';

  const handleSoundscapeVolume = (val: number) => {
    setSoundscapeVol(val);
    soundscapeManager.setVolume(val);
  };

  const handleSkip15 = (forward: boolean) => {
    // Jump ~3-4 sentences in the chapter
    const delta = forward ? 3 : -3;
    const target = Math.max(0, Math.min(sentences.length - 1, currentSentenceIndex + delta));
    onSeek(target);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 sm:py-10 animate-fade-in">
      {/* Top Banner / Book Card */}
      <div className="bg-gradient-to-b from-[#181a29] to-[#10121d] rounded-3xl p-6 sm:p-10 border border-white/10 shadow-2xl relative overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute -top-32 -left-32 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -right-32 w-80 h-80 bg-orange-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-center gap-8 md:gap-12">
          {/* Vinyl / Cover Art Section */}
          <div className="relative group shrink-0">
            {/* Spinning Vinyl Record behind the book cover */}
            <div
              className={`absolute top-0 right-0 w-52 h-52 sm:w-60 sm:h-60 rounded-full bg-stone-900 border-4 border-stone-800 shadow-2xl flex items-center justify-center transition-transform duration-700 ${
                isPlaying ? 'translate-x-8 sm:translate-x-12 rotate-180 animate-spin' : 'translate-x-2'
              }`}
              style={{ animationDuration: '6s' }}
            >
              {/* Vinyl grooves */}
              <div className="w-40 h-40 rounded-full border border-stone-800/80 flex items-center justify-center">
                <div className="w-28 h-28 rounded-full border border-stone-800/80 flex items-center justify-center">
                  <div className="w-16 h-16 rounded-full bg-amber-500/20 border-2 border-amber-500/40 flex items-center justify-center">
                    <Disc className="w-8 h-8 text-amber-400" />
                  </div>
                </div>
              </div>
            </div>

            {/* Book Cover Card */}
            <div className="relative z-10 w-44 h-60 sm:w-52 sm:h-72 rounded-2xl bg-gradient-to-br from-amber-800 via-stone-800 to-stone-900 border-2 border-white/20 shadow-2xl overflow-hidden flex flex-col justify-between p-5 text-white">
              {bookMetadata.coverUrl && !bookMetadata.coverUrl.startsWith('from-') ? (
                <img
                  src={bookMetadata.coverUrl}
                  alt={bookMetadata.title}
                  className="absolute inset-0 w-full h-full object-cover"
                />
              ) : (
                <div className="relative z-10 flex flex-col h-full justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-widest text-amber-300/80">
                      AUDIOBOOK EDITION
                    </span>
                    <h3 className="font-title-vintage text-base sm:text-lg font-bold leading-snug mt-2 line-clamp-3">
                      {bookMetadata.title}
                    </h3>
                  </div>
                  <div>
                    <div className="w-8 h-0.5 bg-amber-400/60 mb-2"></div>
                    <p className="text-xs text-amber-200/90 font-medium truncate">
                      {bookMetadata.author}
                    </p>
                  </div>
                </div>
              )}

              {/* Wave pulse effect overlay while playing */}
              {isPlaying && (
                <div className="absolute inset-0 bg-gradient-to-t from-amber-500/20 to-transparent pointer-events-none" />
              )}
            </div>
          </div>

          {/* Book Details and AI Director Info */}
          <div className="flex-1 text-center md:text-left min-w-0 w-full">
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                Chapter {currentChapterIndex + 1} of {totalChapters}
              </span>

              {/* Gemini Voice Badge */}
              {engineType === 'gemini' ? (
                <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  <Sparkles className="w-3 h-3 text-purple-400" />
                  Gemini AI Voice ({selectedVoice})
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  Browser Offline Voice
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight line-clamp-2">
              {currentChapter.title}
            </h1>
            <p className="text-sm text-slate-400 mt-1 truncate">
              {bookMetadata.title} — by <span className="text-slate-200">{bookMetadata.author}</span>
            </p>

            {/* Current Sentence readout box / Teleprompter preview */}
            <div className="mt-4 p-4 rounded-xl bg-white/[0.04] border border-white/10 text-slate-200 text-sm leading-relaxed min-h-[72px] flex items-center justify-center md:justify-start">
              <p className="italic line-clamp-3 font-serif-book">
                "{currentSentenceText}"
              </p>
            </div>

            {/* Quick Actions Row: AI Summary, Bookmark, Export */}
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2.5 mt-4">
              <button
                onClick={onOpenRecapModal}
                className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/30 transition-colors"
                title="AI Chapter Director Summary"
              >
                <Wand2 className="w-3.5 h-3.5" />
                <span>AI Chapter Recap</span>
              </button>

              <button
                onClick={onAddBookmark}
                className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 transition-colors"
                title="Save current sentence bookmark"
              >
                <BookmarkPlus className="w-3.5 h-3.5 text-amber-400" />
                <span>Bookmark Quote</span>
              </button>

              <button
                onClick={onOpenExportModal}
                className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 transition-colors"
                title="Download chapter or book audio"
              >
                <Download className="w-3.5 h-3.5 text-emerald-400" />
                <span>Export Audio</span>
              </button>

              <button
                onClick={onOpenSleepModal}
                className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 transition-colors"
                title="Set sleep timer"
              >
                <Clock className="w-3.5 h-3.5 text-indigo-400" />
                <span>Sleep Timer</span>
              </button>
            </div>
          </div>
        </div>

        {/* Audio Scrubber Slider */}
        <div className="mt-8 pt-6 border-t border-white/10">
          <div className="flex items-center justify-between text-xs font-mono text-slate-400 mb-2">
            <span>{formatAudioTime(currentElapsed)}</span>
            <span className="text-[11px] text-slate-500">
              Sentence {currentSentenceIndex + 1} of {sentences.length}
            </span>
            <span>-{formatAudioTime(remainingTime)}</span>
          </div>

          <div className="relative group">
            <input
              type="range"
              min="0"
              max={Math.max(1, sentences.length - 1)}
              value={currentSentenceIndex}
              onChange={(e) => onSeek(parseInt(e.target.value, 10))}
              className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-amber-500 focus:outline-none"
              aria-label="Chapter audio progress slider"
            />
            {/* Visual waveform mockup / progress fill */}
            <div
              className="absolute left-0 top-0 h-2 bg-gradient-to-r from-amber-500 to-orange-500 rounded-lg pointer-events-none"
              style={{ width: `${progressRatio * 100}%` }}
            />
          </div>
        </div>

        {/* Central Controls Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 mt-6">
          {/* Left: Speed selector */}
          <div className="flex items-center gap-1 bg-white/5 p-1 rounded-xl border border-white/10">
            {[0.75, 1.0, 1.25, 1.5, 2.0].map((rate) => (
              <button
                key={rate}
                onClick={() => onChangePlaybackRate(rate)}
                aria-label={`Set speed to ${rate}x`}
                className={`text-xs px-2.5 py-1 rounded-lg transition-all ${
                  playbackRate === rate
                    ? 'bg-amber-500 text-stone-950 font-bold'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {rate}x
              </button>
            ))}
          </div>

          {/* Center: Playback Controls */}
          <div className="flex items-center gap-3 sm:gap-4">
            {/* Previous Chapter */}
            <button
              onClick={onPrevChapter}
              disabled={currentChapterIndex === 0}
              aria-label="Previous chapter"
              className="p-2.5 rounded-full text-slate-300 hover:text-white hover:bg-white/10 disabled:opacity-40 disabled:hover:bg-transparent transition-colors"
            >
              <SkipBack className="w-5 h-5" />
            </button>

            {/* 15s Back */}
            <button
              onClick={() => handleSkip15(false)}
              aria-label="Rewind 15 seconds"
              className="p-2.5 rounded-full text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
            >
              <RotateCcw className="w-5 h-5" />
            </button>

            {/* Play/Pause Main Button */}
            <button
              onClick={onTogglePlay}
              aria-label={isPlaying ? 'Pause narration' : 'Play narration'}
              className="w-16 h-16 rounded-full bg-gradient-to-tr from-amber-500 via-orange-500 to-amber-400 text-stone-950 flex items-center justify-center shadow-lg shadow-amber-500/30 hover:scale-105 active:scale-95 transition-all"
            >
              {isLoadingAudio ? (
                <div className="w-7 h-7 border-3 border-stone-950 border-t-transparent rounded-full animate-spin" />
              ) : isPlaying ? (
                <Pause className="w-7 h-7 fill-stone-950" />
              ) : (
                <Play className="w-7 h-7 fill-stone-950 translate-x-0.5" />
              )}
            </button>

            {/* 15s Forward */}
            <button
              onClick={() => handleSkip15(true)}
              aria-label="Fast forward 15 seconds"
              className="p-2.5 rounded-full text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
            >
              <RotateCw className="w-5 h-5" />
            </button>

            {/* Next Chapter */}
            <button
              onClick={onNextChapter}
              disabled={currentChapterIndex >= totalChapters - 1}
              aria-label="Next chapter"
              className="p-2.5 rounded-full text-slate-300 hover:text-white hover:bg-white/10 disabled:opacity-40 disabled:hover:bg-transparent transition-colors"
            >
              <SkipForward className="w-5 h-5" />
            </button>
          </div>

          {/* Right: Voice Settings Toggle */}
          <button
            onClick={() => setShowVoiceDrawer(!showVoiceDrawer)}
            aria-label="Toggle voice and ambient settings"
            className={`flex items-center gap-2 text-xs font-semibold px-3.5 py-2 rounded-xl border transition-all ${
              showVoiceDrawer
                ? 'bg-amber-500 text-stone-950 border-amber-400'
                : 'bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border-white/10'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Voice & Ambience</span>
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showVoiceDrawer ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </div>

      {/* Expandable Voice & Ambient Soundscapes Settings Drawer */}
      {showVoiceDrawer && (
        <div className="mt-4 p-6 rounded-2xl bg-[#141622] border border-white/10 shadow-xl space-y-6 animate-fade-in">
          {/* Section 1: Narration Engine & Voices */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                Audiobook Narration Engine
              </h3>

              <div className="flex items-center bg-white/5 p-0.5 rounded-lg border border-white/10 text-xs">
                <button
                  onClick={() => onChangeEngineType('gemini')}
                  className={`px-2.5 py-1 rounded-md transition-colors ${
                    engineType === 'gemini'
                      ? 'bg-amber-500 text-stone-950 font-semibold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Gemini Neural (WAV)
                </button>
                <button
                  onClick={() => onChangeEngineType('browser')}
                  className={`px-2.5 py-1 rounded-md transition-colors ${
                    engineType === 'browser'
                      ? 'bg-amber-500 text-stone-950 font-semibold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Offline Web Speech
                </button>
              </div>
            </div>

            {engineType === 'gemini' ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                  {GEMINI_VOICES.map((v) => (
                    <button
                      key={v.id}
                      onClick={() => onChangeVoice(v.id)}
                      className={`flex flex-col items-start p-3 rounded-xl border text-left transition-all ${
                        selectedVoice === v.id
                          ? 'bg-amber-500/15 border-amber-500/60 shadow-sm'
                          : 'bg-white/[0.03] border-white/10 hover:border-white/20'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full mb-1">
                        <span className="font-bold text-xs text-white">{v.name}</span>
                        {selectedVoice === v.id && (
                          <Check className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400">{v.tone}</p>
                    </button>
                  ))}
                </div>

                {/* Narration Style */}
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-2">
                    Narration Style & Dramatic Direction
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {NARRATION_STYLES.map((style) => (
                      <button
                        key={style.id}
                        onClick={() => onChangeStyle(style.prompt)}
                        className={`text-xs px-3 py-2 rounded-lg border text-center transition-all ${
                          selectedStyle === style.prompt
                            ? 'bg-amber-500/20 border-amber-400 text-amber-200 font-semibold'
                            : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
                        }`}
                      >
                        {style.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10 text-xs text-slate-300">
                <p>
                  Using your device's high-performance native text-to-speech synthesizer. Zero latency, supports continuous reading and instant word karaoke.
                </p>
              </div>
            )}
          </div>

          {/* Section 2: Immersive Soundscapes */}
          <div className="pt-4 border-t border-white/10">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-amber-400" />
                Ambient Soundscape Background
              </h3>

              {activeSoundscape !== 'none' && (
                <div className="flex items-center gap-2">
                  <Volume2 className="w-3.5 h-3.5 text-slate-400" />
                  <input
                    type="range"
                    min="0"
                    max="0.5"
                    step="0.02"
                    value={soundscapeVol}
                    onChange={(e) => handleSoundscapeVolume(parseFloat(e.target.value))}
                    className="w-24 h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-amber-500"
                    title="Soundscape Volume"
                  />
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
              {SOUNDSCAPES.map((snd) => {
                const isCurrent = activeSoundscape === snd.id;
                return (
                  <button
                    key={snd.id}
                    onClick={() => onChangeSoundscape(snd.id)}
                    className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all ${
                      isCurrent
                        ? 'bg-amber-500/20 border-amber-400 text-amber-200 font-semibold shadow-sm'
                        : 'bg-white/[0.03] border-white/10 text-slate-400 hover:text-white hover:border-white/20'
                    }`}
                  >
                    {snd.id === 'rain' && <CloudRain className="w-4 h-4 mb-1.5 text-blue-400" />}
                    {snd.id === 'fireplace' && <Flame className="w-4 h-4 mb-1.5 text-orange-400" />}
                    {snd.id === 'library' && <BookOpen className="w-4 h-4 mb-1.5 text-amber-400" />}
                    {snd.id === 'brown-noise' && <Waves className="w-4 h-4 mb-1.5 text-emerald-400" />}
                    {snd.id === 'none' && <VolumeX className="w-4 h-4 mb-1.5 text-slate-500" />}

                    <span className="text-xs">{snd.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
