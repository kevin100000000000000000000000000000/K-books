import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json({ limit: '50mb' }));

// Helper to get Gemini AI client
function getGenAIClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// 1. Text-To-Speech Endpoint using Gemini 3.8 Flash Lite TTS
app.post('/api/tts', async (req, res) => {
  try {
    const { text, voice = 'Kore', style = 'Warm, expressive, articulate audiobook narrator' } = req.body;

    if (!text || typeof text !== 'string') {
      res.status(400).json({ error: 'Text is required for TTS generation' });
      return;
    }

    const ai = getGenAIClient();
    if (!ai) {
      res.status(503).json({
        error: 'GEMINI_API_KEY is not configured on the server. Falling back to browser speech synthesis.',
        fallback: true
      });
      return;
    }

    // Limit chunk to ~2000 chars for optimal Gemini TTS synthesis
    const trimmedText = text.length > 2500 ? text.slice(0, 2500) + '...' : text;

    // Supported prebuilt voices: 'Puck', 'Charon', 'Kore', 'Fenrir', 'Zephyr'
    const allowedVoices = ['Puck', 'Charon', 'Kore', 'Fenrir', 'Zephyr'];
    const validVoice = allowedVoices.includes(voice) ? voice : 'Kore';

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash-lite-tts',
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: trimmedText,
              speechMetadata: {
                style: style,
              },
            },
          ],
        },
      ],
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: validVoice },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

    if (!base64Audio) {
      res.status(500).json({ error: 'No audio returned from Gemini speech model' });
      return;
    }

    res.json({
      audioBase64: base64Audio,
      mimeType: 'audio/wav',
      voice: validVoice,
      textLength: trimmedText.length
    });
  } catch (error: unknown) {
    const err = error as Error;
    console.error('TTS Generation error:', err);
    res.status(500).json({ error: err.message || 'TTS generation failed' });
  }
});

// 2. Chapter Summarization & Analysis Endpoint using Gemini 3.8 Flash
app.post('/api/summarize', async (req, res) => {
  try {
    const { chapterTitle, text } = req.body;
    if (!text) {
      res.status(400).json({ error: 'Chapter text is required' });
      return;
    }

    const ai = getGenAIClient();
    if (!ai) {
      res.status(503).json({ error: 'GEMINI_API_KEY is not configured' });
      return;
    }

    const prompt = `You are a professional audiobook director and literary analyst.
Analyze this chapter and provide:
1. A concise, engaging 2-sentence audiobook recap/synopsis.
2. Three key highlights/plot moments (as bullet points).
3. The emotional tone (e.g. Mysterious, Suspenseful, Nostalgic, Whimsical, Dramatic).
4. Recommended narrator style and pacing.

Chapter Title: ${chapterTitle || 'Chapter'}
Content excerpt:
${text.slice(0, 3500)}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
    });

    res.json({ summary: response.text });
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Summarize error:', err);
    res.status(500).json({ error: err.message || 'Failed to generate summary' });
  }
});

// 3. Health & Status Endpoint
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    hasGeminiKey: !!process.env.GEMINI_API_KEY,
    geminiTTSModel: 'gemini-3.8-flash-lite-tts'
  });
});

async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    // Vite middleware in dev
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Serve static files in prod
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(port, () => {
    console.log(`Audiobook server running on port ${port}`);
  });
}

startServer().catch(console.error);
