import React, { useState } from 'react';
import { Download, X, Check, Loader2, Sparkles, FileAudio, ListMusic } from 'lucide-react';
import { AudiobookChapter, AudiobookMetadata } from '../utils/epub-parser';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  metadata: AudiobookMetadata;
  currentChapter: AudiobookChapter;
  chapters: AudiobookChapter[];
  selectedVoice: string;
  selectedStyle: string;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  metadata,
  currentChapter,
  chapters,
  selectedVoice,
  selectedStyle,
}) => {
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState('');
  const [downloadReadyUrl, setDownloadReadyUrl] = useState<string | null>(null);
  const [downloadFileName, setDownloadFileName] = useState('');

  if (!isOpen) return null;

  // 1. Export Current Chapter Audio via Gemini TTS
  const handleExportChapterAudio = async () => {
    setIsExporting(true);
    setDownloadReadyUrl(null);
    setStatusMessage('Generating AI narration audio for chapter...');
    setExportProgress(20);

    try {
      // Chunk or text slice for narration
      const textToSynthesize = currentChapter.cleanedText.slice(0, 2200);

      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: textToSynthesize,
          voice: selectedVoice,
          style: selectedStyle,
        }),
      });

      setExportProgress(65);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to synthesize chapter audio');
      }

      setExportProgress(90);
      setStatusMessage('Encoding WAV file container...');

      // Convert base64 to Blob URL
      const byteCharacters = atob(data.audioBase64);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'audio/wav' });
      const url = URL.createObjectURL(blob);

      const safeTitle = `${metadata.title.replace(/[^a-zA-Z0-9]/g, '_')}_Ch${currentChapter.index}_${currentChapter.title.replace(/[^a-zA-Z0-9]/g, '_')}.wav`;
      setDownloadReadyUrl(url);
      setDownloadFileName(safeTitle);
      setExportProgress(100);
      setStatusMessage('Chapter audio generated successfully!');
    } catch (err: unknown) {
      console.error(err);
      setStatusMessage(`Export failed: ${(err as Error).message}`);
    } finally {
      setIsExporting(false);
    }
  };

  // 2. Export M3U Audiobook Playlist & Metadata Manifest
  const handleExportPlaylist = () => {
    let m3u = `#EXTM3U\n#PLAYLIST:${metadata.title} - ${metadata.author}\n\n`;

    chapters.forEach((ch) => {
      m3u += `#EXTINF:${ch.durationSeconds},${metadata.author} - ${ch.title}\n`;
      m3u += `${metadata.title.replace(/[^a-zA-Z0-9]/g, '_')}_Ch${ch.index}.wav\n\n`;
    });

    const blob = new Blob([m3u], { type: 'audio/x-mpegurl' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${metadata.title.replace(/[^a-zA-Z0-9]/g, '_')}_audiobook_playlist.m3u`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // 3. Export Formatted Audiobook Script / Narration Cue Sheet (Text)
  const handleExportScript = () => {
    let script = `======================================================\n`;
    script += `AUDIOBOOK PRODUCTION SCRIPT\n`;
    script += `Title: ${metadata.title}\n`;
    script += `Author: ${metadata.author}\n`;
    script += `Narrator Voice: ${selectedVoice}\n`;
    script += `Narration Style: ${selectedStyle}\n`;
    script += `Total Chapters: ${chapters.length}\n`;
    script += `Total Words: ${metadata.totalWords}\n`;
    script += `======================================================\n\n`;

    chapters.forEach((ch, idx) => {
      script += `--- [TRACK ${idx + 1}: ${ch.title}] ---\n`;
      script += `Estimated Duration: ~${Math.round(ch.durationSeconds / 60)} minutes (${ch.wordCount} words)\n\n`;
      script += `${ch.cleanedText}\n\n`;
    });

    const blob = new Blob([script], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${metadata.title.replace(/[^a-zA-Z0-9]/g, '_')}_Audiobook_Script.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md bg-[#141624] border border-white/10 rounded-2xl p-6 shadow-2xl text-white">
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Download className="w-5 h-5 text-amber-400" />
            <h3 className="font-bold text-base">Export Audiobook Files</h3>
          </div>
          <button
            onClick={onClose}
            aria-label="Close export dialog"
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="py-4 space-y-3.5">
          {/* Option A: Render chapter audio via Gemini */}
          <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 space-y-3">
            <div className="flex items-center gap-2">
              <FileAudio className="w-4 h-4 text-amber-400" />
              <h4 className="text-xs font-bold text-white">
                Render Current Chapter ({currentChapter.title})
              </h4>
            </div>
            <p className="text-[11px] text-slate-400">
              Generates a master WAV audio file using the <span className="text-amber-300 font-semibold">{selectedVoice}</span> AI narrator.
            </p>

            {downloadReadyUrl ? (
              <a
                href={downloadReadyUrl}
                download={downloadFileName}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-bold text-xs transition-colors shadow-lg shadow-emerald-500/20"
              >
                <Check className="w-4 h-4" />
                <span>Download {downloadFileName}</span>
              </a>
            ) : (
              <button
                onClick={handleExportChapterAudio}
                disabled={isExporting}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-stone-950 font-bold text-xs hover:brightness-110 disabled:opacity-50 transition-all shadow-md shadow-amber-500/20"
              >
                {isExporting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Rendering Voice Audio ({exportProgress}%)...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Generate WAV Audio Track</span>
                  </>
                )}
              </button>
            )}

            {statusMessage && (
              <p className="text-[11px] text-slate-400 text-center">{statusMessage}</p>
            )}
          </div>

          {/* Option B: Download M3U Playlist */}
          <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 flex items-center justify-between">
            <div>
              <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                <ListMusic className="w-4 h-4 text-blue-400" />
                Audiobook M3U Playlist
              </h4>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Standard index for VLC, iTunes, and Car audio players.
              </p>
            </div>
            <button
              onClick={handleExportPlaylist}
              className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-semibold text-slate-200 border border-white/10 transition-colors"
            >
              Export M3U
            </button>
          </div>

          {/* Option C: Download Narration Script */}
          <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 flex items-center justify-between">
            <div>
              <h4 className="text-xs font-bold text-white">Narration Script & Cue Sheet</h4>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Formatted text with chapter timestamps for voice directors.
              </p>
            </div>
            <button
              onClick={handleExportScript}
              className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-semibold text-slate-200 border border-white/10 transition-colors"
            >
              Export Script
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
