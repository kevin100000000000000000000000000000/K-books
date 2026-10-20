/**
 * Unified Audiobook Engine supporting both Gemini AI Neural Speech and Web Speech API
 * with synchronized sentence tracking, sleep timer, bookmarks, and audio export.
 */

export type NarrationEngineType = 'gemini' | 'browser';

export interface VoiceOption {
  id: string;
  name: string;
  gender: 'female' | 'male' | 'neutral';
  tone: string;
  engine: NarrationEngineType;
}

export const GEMINI_VOICES: VoiceOption[] = [
  { id: 'Kore', name: 'Kore (Warm & Melodic)', gender: 'female', tone: 'Rich, expressive, classic novel narrator', engine: 'gemini' },
  { id: 'Puck', name: 'Puck (Lively & Energetic)', gender: 'male', tone: 'Engaging, spirited, adventurous', engine: 'gemini' },
  { id: 'Fenrir', name: 'Fenrir (Deep & Resonant)', gender: 'male', tone: 'Authoritative, epic, dramatic', engine: 'gemini' },
  { id: 'Zephyr', name: 'Zephyr (Soft & Soothing)', gender: 'female', tone: 'Gentle, calming, meditative', engine: 'gemini' },
  { id: 'Charon', name: 'Charon (Wise & Scholarly)', gender: 'male', tone: 'Distinguished, philosophical, classic literature', engine: 'gemini' },
];

export const NARRATION_STYLES = [
  { id: 'storyteller', label: 'Classic Storyteller', prompt: 'Warm, engaging, articulate audiobook narrator with expressive pauses and dramatic flair' },
  { id: 'suspense', label: 'Mystery & Suspense', prompt: 'Intriguing, measured, slightly hushed suspenseful tone with tense cadence' },
  { id: 'calm', label: 'Soothing & Bedtime', prompt: 'Very soft, gentle, relaxing bedtime reading cadence with slow pauses' },
  { id: 'epic', label: 'Cinematic & Bold', prompt: 'Vibrant, majestic, commanding theatrical performance' },
];

export interface Bookmark {
  id: string;
  chapterIndex: number;
  chapterTitle: string;
  sentenceIndex: number;
  sentenceText: string;
  createdAt: number;
  note?: string;
}
