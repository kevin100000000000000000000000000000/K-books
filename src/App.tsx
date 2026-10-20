/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Header } from './components/Header';
import { PlayerView } from './components/PlayerView';
import { ReaderView } from './components/ReaderView';
import { DropzoneModal } from './components/DropzoneModal';
import { ChapterDrawer } from './components/ChapterDrawer';
import { BookmarksModal } from './components/BookmarksModal';
import { SleepTimerModal } from './components/SleepTimerModal';
import { ExportModal } from './components/ExportModal';
import { SAMPLE_BOOKS } from './data/sample-books';
import { ParsedEpubBook, AudiobookChapter } from './utils/epub-parser';
import { Bookmark, GEMINI_VOICES, NARRATION_STYLES } from './utils/audio-engine';
import { soundscapeManager } from './utils/soundscapes';

export default function App() {
  // Current book state: defaulted to classic book sample so user can immediately play
  const [currentBook, setCurrentBook] = useState<ParsedEpubBook>(SAMPLE_BOOKS[0]);
  const [activeView, setActiveView] = useState<'player' | 'reader'>('player');
  const [currentChapterIndex, setCurrentChapterIndex] = useState(0);
  const [currentSentenceIndex, setCurrentSentenceIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);

  // Narration configuration
  const [engineType, setEngineType] = useState<'gemini' | 'browser'>('gemini');
  const [selectedVoice, setSelectedVoice] = useState<string>('Kore');
  const [selectedStyle, setSelectedStyle] = useState<string>(NARRATION_STYLES[0].prompt);
  const [playbackRate, setPlaybackRate] = useState<number>(1.0);
  const [activeSoundscape, setActiveSoundscape] = useState<string>('none');

  // Modals state
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isChaptersOpen, setIsChaptersOpen] = useState(false);
  const [isBookmarksOpen, setIsBookmarksOpen] = useState(false);
  const [isSleepOpen, setIsSleepOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isRecapOpen, setIsRecapOpen] = useState(false);

  // Bookmarks & Sleep timer
  const [bookmarks, setBookmarks] = useState<Bookmark[]>(() => {
    try {
      const saved = localStorage.getItem('audiobookify_bookmarks');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [sleepTimerMinutes, setSleepTimerMinutes] = useState<number | null>(null);
  const [sleepTimerLeft, setSleepTimerLeft] = useState<number | null>(null);

  // Audio references
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const browserUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const isPlayingRef = useRef(isPlaying);
  isPlayingRef.current = isPlaying;

  const currentChapter: AudiobookChapter = currentBook.chapters[currentChapterIndex] || currentBook.chapters[0];
  const sentences = currentChapter ? currentChapter.sentences : [];

  // Save bookmarks to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('audiobookify_bookmarks', JSON.stringify(bookmarks));
    } catch {
      // Ignore storage errors
    }
  }, [bookmarks]);

  // Sleep Timer countdown
  useEffect(() => {
    if (sleepTimerLeft === null || sleepTimerLeft <= 0) return;

    const interval = setInterval(() => {
      setSleepTimerLeft((prev) => {
        if (prev === null || prev <= 1) {
          // Stop audio
          stopNarration();
          setIsPlaying(false);
          setSleepTimerMinutes(null);
          return null;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [sleepTimerLeft]);

  const handleSetSleepTimer = (minutes: number | null) => {
    setSleepTimerMinutes(minutes);
    if (minutes === null) {
      setSleepTimerLeft(null);
    } else if (minutes === -1) {
      // End of chapter mode: track via remaining seconds
      const remainingSeconds = Math.round(
        (currentChapter.durationSeconds / playbackRate) *
          (1 - currentSentenceIndex / Math.max(1, sentences.length))
      );
      setSleepTimerLeft(remainingSeconds);
    } else {
      setSleepTimerLeft(minutes * 60);
    }
  };

  // Stop any active speech or audio playback
  const stopNarration = useCallback(() => {
    if (audioElementRef.current) {
      audioElementRef.current.pause();
      audioElementRef.current.currentTime = 0;
      audioElementRef.current = null;
    }
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }, []);

  // Web Speech API execution for a sentence
  const playBrowserSentence = useCallback((sentenceIdx: number) => {
    if (!('speechSynthesis' in window)) {
      alert('Web Speech API is not supported in this browser.');
      setIsPlaying(false);
      return;
    }

    window.speechSynthesis.cancel();

    const sentence = sentences[sentenceIdx];
    if (!sentence) {
      // Chapter finished
      if (currentChapterIndex < currentBook.chapters.length - 1) {
        setCurrentChapterIndex(prev => prev + 1);
        setCurrentSentenceIndex(0);
      } else {
        setIsPlaying(false);
      }
      return;
    }

    const utterance = new SpeechSynthesisUtterance(sentence);
    utterance.rate = playbackRate;

    // Pick best available voice
    const voices = window.speechSynthesis.getVoices();
    const naturalVoice = voices.find(v => v.lang.startsWith('en') && (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Daniel') || v.name.includes('Samantha')));
    if (naturalVoice) {
      utterance.voice = naturalVoice;
    }

    utterance.onend = () => {
      if (isPlayingRef.current) {
        if (sentenceIdx + 1 < sentences.length) {
          setCurrentSentenceIndex(sentenceIdx + 1);
          playBrowserSentence(sentenceIdx + 1);
        } else {
          // Chapter finished
          if (currentChapterIndex < currentBook.chapters.length - 1) {
            setCurrentChapterIndex(prev => prev + 1);
            setCurrentSentenceIndex(0);
          } else {
            setIsPlaying(false);
          }
        }
      }
    };

    utterance.onerror = (e) => {
      if (e.error !== 'canceled') {
        console.error('Speech synthesis error:', e);
      }
    };

    browserUtteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  }, [sentences, playbackRate, currentChapterIndex, currentBook.chapters.length]);

  // Gemini Neural TTS execution for a sentence
  const playGeminiSentence = useCallback(async (sentenceIdx: number) => {
    const sentence = sentences[sentenceIdx];
    if (!sentence) {
      if (currentChapterIndex < currentBook.chapters.length - 1) {
        setCurrentChapterIndex(prev => prev + 1);
        setCurrentSentenceIndex(0);
      } else {
        setIsPlaying(false);
      }
      return;
    }

    setIsLoadingAudio(true);

    try {
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: sentence,
          voice: selectedVoice,
          style: selectedStyle,
        }),
      });

      const data = await response.json();
      setIsLoadingAudio(false);

      if (!response.ok || !data.audioBase64) {
        console.warn('Gemini TTS error or key unavailable, falling back to Browser Speech:', data.error);
        // Seamless fallback to browser speech synthesis
        playBrowserSentence(sentenceIdx);
        return;
      }

      const audioSrc = `data:audio/wav;base64,${data.audioBase64}`;
      const audio = new Audio(audioSrc);
      audio.playbackRate = playbackRate;
      audioElementRef.current = audio;

      audio.onended = () => {
        if (isPlayingRef.current) {
          if (sentenceIdx + 1 < sentences.length) {
            setCurrentSentenceIndex(sentenceIdx + 1);
            playGeminiSentence(sentenceIdx + 1);
          } else {
            // Next chapter
            if (currentChapterIndex < currentBook.chapters.length - 1) {
              setCurrentChapterIndex(prev => prev + 1);
              setCurrentSentenceIndex(0);
            } else {
              setIsPlaying(false);
            }
          }
        }
      };

      audio.onerror = () => {
        playBrowserSentence(sentenceIdx);
      };

      await audio.play();
    } catch (err) {
      console.warn('Network error during TTS, falling back to browser speech:', err);
      setIsLoadingAudio(false);
      playBrowserSentence(sentenceIdx);
    }
  }, [sentences, selectedVoice, selectedStyle, playbackRate, currentChapterIndex, currentBook.chapters.length, playBrowserSentence]);

  // Trigger sentence playback based on active engine
  const playCurrent = useCallback((sentenceIdx: number) => {
    stopNarration();
    if (engineType === 'gemini') {
      playGeminiSentence(sentenceIdx);
    } else {
      playBrowserSentence(sentenceIdx);
    }
  }, [engineType, playGeminiSentence, playBrowserSentence, stopNarration]);

  // Handle Play / Pause Toggle
  const handleTogglePlay = () => {
    if (isPlaying) {
      stopNarration();
      setIsPlaying(false);
    } else {
      setIsPlaying(true);
      playCurrent(currentSentenceIndex);
    }
  };

  // Handle Seeking to a sentence
  const handleSeek = (newSentenceIndex: number) => {
    const validIdx = Math.max(0, Math.min(sentences.length - 1, newSentenceIndex));
    setCurrentSentenceIndex(validIdx);
    if (isPlaying) {
      playCurrent(validIdx);
    }
  };

  // Chapter navigation
  const handlePrevChapter = () => {
    if (currentChapterIndex > 0) {
      stopNarration();
      setCurrentChapterIndex(prev => prev - 1);
      setCurrentSentenceIndex(0);
      if (isPlaying) {
        setTimeout(() => playCurrent(0), 100);
      }
    }
  };

  const handleNextChapter = () => {
    if (currentChapterIndex < currentBook.chapters.length - 1) {
      stopNarration();
      setCurrentChapterIndex(prev => prev + 1);
      setCurrentSentenceIndex(0);
      if (isPlaying) {
        setTimeout(() => playCurrent(0), 100);
      }
    }
  };

  const handleSelectChapter = (index: number) => {
    stopNarration();
    setCurrentChapterIndex(index);
    setCurrentSentenceIndex(0);
    if (isPlaying) {
      setTimeout(() => playCurrent(0), 100);
    }
  };

  // Soundscape handler
  const handleChangeSoundscape = (id: string) => {
    setActiveSoundscape(id);
    soundscapeManager.play(id);
  };

  // Add Bookmark
  const handleAddBookmark = (sIdx?: number, sText?: string) => {
    const targetIdx = sIdx !== undefined ? sIdx : currentSentenceIndex;
    const targetText = sText || sentences[targetIdx] || currentChapter.title;

    const newBookmark: Bookmark = {
      id: `bm-${Date.now()}`,
      chapterIndex: currentChapterIndex,
      chapterTitle: currentChapter.title,
      sentenceIndex: targetIdx,
      sentenceText: targetText,
      createdAt: Date.now(),
    };

    setBookmarks(prev => [newBookmark, ...prev]);
  };

  const handleDeleteBookmark = (id: string) => {
    setBookmarks(prev => prev.filter(b => b.id !== id));
  };

  const handleSelectBookmark = (bm: Bookmark) => {
    stopNarration();
    setCurrentChapterIndex(bm.chapterIndex);
    setCurrentSentenceIndex(bm.sentenceIndex);
    if (isPlaying) {
      playCurrent(bm.sentenceIndex);
    }
  };

  // When a new book is loaded from upload or sample picker
  const handleBookLoaded = (newBook: ParsedEpubBook) => {
    stopNarration();
    setIsPlaying(false);
    setCurrentBook(newBook);
    setCurrentChapterIndex(0);
    setCurrentSentenceIndex(0);
  };

  // Handle speed changes
  const handleChangePlaybackRate = (rate: number) => {
    setPlaybackRate(rate);
    if (audioElementRef.current) {
      audioElementRef.current.playbackRate = rate;
    }
  };

  return (
    <div className="min-h-screen bg-[#0c0d15] text-slate-100 flex flex-col selection:bg-amber-500 selection:text-stone-950">
      {/* Top Header */}
      <Header
        metadata={currentBook.metadata}
        activeView={activeView}
        onToggleView={setActiveView}
        onOpenUpload={() => setIsUploadOpen(true)}
        onOpenBookmarks={() => setIsBookmarksOpen(true)}
        onOpenChapters={() => setIsChaptersOpen(true)}
        sleepTimerLeft={sleepTimerLeft}
        onOpenSleepModal={() => setIsSleepOpen(true)}
        hasGeminiKey={true}
      />

      {/* Main View Area */}
      <main className="flex-1 flex flex-col">
        {activeView === 'player' ? (
          <PlayerView
            bookMetadata={currentBook.metadata}
            currentChapter={currentChapter}
            currentChapterIndex={currentChapterIndex}
            totalChapters={currentBook.chapters.length}
            isPlaying={isPlaying}
            onTogglePlay={handleTogglePlay}
            onPrevChapter={handlePrevChapter}
            onNextChapter={handleNextChapter}
            onSeek={handleSeek}
            currentSentenceIndex={currentSentenceIndex}
            engineType={engineType}
            onChangeEngineType={setEngineType}
            selectedVoice={selectedVoice}
            onChangeVoice={setSelectedVoice}
            selectedStyle={selectedStyle}
            onChangeStyle={setSelectedStyle}
            playbackRate={playbackRate}
            onChangePlaybackRate={handleChangePlaybackRate}
            onAddBookmark={() => handleAddBookmark()}
            onOpenSleepModal={() => setIsSleepOpen(true)}
            onOpenExportModal={() => setIsExportOpen(true)}
            onOpenRecapModal={() => setIsChaptersOpen(true)}
            isLoadingAudio={isLoadingAudio}
            activeSoundscape={activeSoundscape}
            onChangeSoundscape={handleChangeSoundscape}
          />
        ) : (
          <ReaderView
            currentChapter={currentChapter}
            currentChapterIndex={currentChapterIndex}
            totalChapters={currentBook.chapters.length}
            currentSentenceIndex={currentSentenceIndex}
            isPlaying={isPlaying}
            onTogglePlay={handleTogglePlay}
            onSeek={handleSeek}
            onPrevChapter={handlePrevChapter}
            onNextChapter={handleNextChapter}
            onAddBookmark={handleAddBookmark}
            onSwitchToPlayer={() => setActiveView('player')}
            playbackRate={playbackRate}
            onChangePlaybackRate={handleChangePlaybackRate}
          />
        )}
      </main>

      {/* Modals & Drawers */}
      <DropzoneModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onBookLoaded={handleBookLoaded}
        currentBookTitle={currentBook.metadata.title}
      />

      <ChapterDrawer
        isOpen={isChaptersOpen}
        onClose={() => setIsChaptersOpen(false)}
        chapters={currentBook.chapters}
        currentChapterIndex={currentChapterIndex}
        onSelectChapter={handleSelectChapter}
        isPlaying={isPlaying}
      />

      <BookmarksModal
        isOpen={isBookmarksOpen}
        onClose={() => setIsBookmarksOpen(false)}
        bookmarks={bookmarks}
        onSelectBookmark={handleSelectBookmark}
        onDeleteBookmark={handleDeleteBookmark}
      />

      <SleepTimerModal
        isOpen={isSleepOpen}
        onClose={() => setIsSleepOpen(false)}
        currentTimerMinutes={sleepTimerMinutes}
        onSetTimer={handleSetSleepTimer}
        sleepTimerLeft={sleepTimerLeft}
      />

      <ExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        metadata={currentBook.metadata}
        currentChapter={currentChapter}
        chapters={currentBook.chapters}
        selectedVoice={selectedVoice}
        selectedStyle={selectedStyle}
      />
    </div>
  );
}
