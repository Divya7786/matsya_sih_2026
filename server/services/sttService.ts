// Cloud Speech-to-Text abstraction.
// Provider priority:
//   1. STT_PROVIDER=gemini  → Gemini 1.5 Flash multimodal audio (uses GEMINI_API_KEY)
//   2. STT_PROVIDER=google  → Google Cloud Speech-to-Text (uses STT_API_KEY)
//   3. STT_PROVIDER=openai  → OpenAI Whisper (uses STT_API_KEY)
//   4. Auto: if GEMINI_API_KEY is present, use gemini by default
//
// API keys are NEVER exposed to the frontend.

import { GoogleGenAI } from '@google/genai';

export interface TranscriptionResult {
  transcript: string;
  language: string;
  provider: string;
  confidence: number;
  method: 'cloud' | 'fallback';
}

// BCP-47 code → language name for prompts
const LANG_NAMES: Record<string, string> = {
  'ta-IN': 'Tamil (India)',
  'hi-IN': 'Hindi (India)',
  'te-IN': 'Telugu (India)',
  'ml-IN': 'Malayalam (India)',
  'kn-IN': 'Kannada (India)',
  'bn-IN': 'Bengali (India)',
  'mr-IN': 'Marathi (India)',
  'gu-IN': 'Gujarati (India)',
  'pa-IN': 'Punjabi (India)',
  'or-IN': 'Odia (India)',
  'en-IN': 'English (India)',
};

export async function transcribeAudio(
  audioBuffer: Buffer,
  mimeType: string,
  languageCode: string,
): Promise<TranscriptionResult> {
  const provider = resolveProvider();

  if (provider === 'gemini') {
    return transcribeWithGemini(audioBuffer, mimeType, languageCode);
  }
  if (provider === 'google') {
    return transcribeWithGoogleSpeech(audioBuffer, mimeType, languageCode);
  }
  if (provider === 'openai') {
    return transcribeWithWhisper(audioBuffer, mimeType, languageCode);
  }

  throw new Error(
    'No STT provider configured. Set STT_PROVIDER=gemini (uses GEMINI_API_KEY) in .env, ' +
    'or STT_PROVIDER=google/openai with STT_API_KEY.',
  );
}

function resolveProvider(): string | null {
  const explicit = (process.env.STT_PROVIDER || '').toLowerCase().trim();
  if (explicit) return explicit;
  // Auto-detect: use Gemini if key present
  if (process.env.GEMINI_API_KEY) return 'gemini';
  if (process.env.STT_API_KEY) return 'google';
  return null;
}

// ── Gemini 1.5 Flash — multimodal audio transcription ─────────────────────

async function transcribeWithGemini(
  audioBuffer: Buffer,
  mimeType: string,
  languageCode: string,
): Promise<TranscriptionResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY not set');

  const genai = new GoogleGenAI({
    apiKey,
    httpOptions: { headers: { 'User-Agent': 'aistudio-build' } },
  });

  const audioBase64 = audioBuffer.toString('base64');
  const langName = LANG_NAMES[languageCode] || languageCode;
  const safeMimeType = normalizeMime(mimeType);

  const prompt = `Transcribe the speech in this audio recording. ` +
    `The speaker is speaking in ${langName}. ` +
    `Return ONLY the transcribed text — no explanations, no punctuation notes, no language labels. ` +
    `If the audio is silent or unclear, return an empty string.`;

  // Try models in order of quality/availability
  const models = [
    'gemini-2.0-flash',
    'gemini-1.5-flash',
    'gemini-1.5-flash-8b',
  ];

  for (const model of models) {
    try {
      const response = await genai.models.generateContent({
        model,
        contents: [
          {
            role: 'user',
            parts: [
              { inlineData: { data: audioBase64, mimeType: safeMimeType } },
              { text: prompt },
            ],
          },
        ],
      });

      const text = (response as any)?.text || (response as any)?.candidates?.[0]?.content?.parts?.[0]?.text || '';
      const transcript = text.trim();
      console.log(`[STT/Gemini] model=${model} lang=${languageCode} transcript="${transcript.slice(0, 80)}"`);

      return {
        transcript,
        language: languageCode,
        provider: `gemini:${model}`,
        confidence: transcript ? 0.85 : 0,
        method: 'cloud',
      };
    } catch (err: any) {
      console.warn(`[STT/Gemini] model=${model} failed: ${err.message}`);
      if (model === models[models.length - 1]) throw err;
    }
  }

  throw new Error('All Gemini models failed');
}

// ── Google Cloud Speech-to-Text ────────────────────────────────────────────

async function transcribeWithGoogleSpeech(
  audioBuffer: Buffer,
  mimeType: string,
  languageCode: string,
): Promise<TranscriptionResult> {
  const apiKey = process.env.STT_API_KEY;
  if (!apiKey) throw new Error('STT_API_KEY not set for Google Cloud Speech');

  const audioBase64 = audioBuffer.toString('base64');
  const encoding = googleEncoding(mimeType);

  const body = {
    config: {
      encoding,
      sampleRateHertz: 16000,
      languageCode,
      alternativeLanguageCodes: ['en-IN'],
      enableAutomaticPunctuation: true,
      model: 'latest_long',
    },
    audio: { content: audioBase64 },
  };

  const res = await fetch(
    `https://speech.googleapis.com/v1/speech:recognize?key=${apiKey}`,
    { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) },
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Google Speech API ${res.status}: ${err.slice(0, 200)}`);
  }

  const data = await res.json();
  const transcript = data.results?.[0]?.alternatives?.[0]?.transcript?.trim() || '';
  const confidence = data.results?.[0]?.alternatives?.[0]?.confidence || 0.8;

  console.log(`[STT/Google] lang=${languageCode} transcript="${transcript.slice(0, 80)}"`);
  return { transcript, language: languageCode, provider: 'google-cloud-speech', confidence, method: 'cloud' };
}

// ── OpenAI Whisper ─────────────────────────────────────────────────────────

async function transcribeWithWhisper(
  audioBuffer: Buffer,
  mimeType: string,
  languageCode: string,
): Promise<TranscriptionResult> {
  const apiKey = process.env.STT_API_KEY;
  if (!apiKey) throw new Error('STT_API_KEY not set for OpenAI Whisper');

  // Whisper uses ISO 639-1 codes
  const whisperLang = languageCode.split('-')[0];

  const form = new FormData();
  const blob = new Blob([audioBuffer], { type: mimeType || 'audio/webm' });
  form.append('file', blob, `audio.${mimeType?.split('/')[1] || 'webm'}`);
  form.append('model', 'whisper-1');
  form.append('language', whisperLang);
  form.append('response_format', 'json');

  const res = await fetch('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}` },
    body: form,
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`OpenAI Whisper ${res.status}: ${err.slice(0, 200)}`);
  }

  const data = await res.json();
  const transcript = (data.text || '').trim();
  console.log(`[STT/Whisper] lang=${languageCode} transcript="${transcript.slice(0, 80)}"`);
  return { transcript, language: languageCode, provider: 'openai-whisper', confidence: 0.9, method: 'cloud' };
}

// ── Helpers ────────────────────────────────────────────────────────────────

function normalizeMime(mimeType: string): string {
  if (!mimeType) return 'audio/webm';
  if (mimeType.includes('webm')) return 'audio/webm';
  if (mimeType.includes('mp4') || mimeType.includes('m4a')) return 'audio/mp4';
  if (mimeType.includes('ogg')) return 'audio/ogg';
  if (mimeType.includes('wav')) return 'audio/wav';
  if (mimeType.includes('mpeg') || mimeType.includes('mp3')) return 'audio/mpeg';
  return mimeType;
}

function googleEncoding(mimeType: string): string {
  if (mimeType?.includes('webm')) return 'WEBM_OPUS';
  if (mimeType?.includes('ogg')) return 'OGG_OPUS';
  if (mimeType?.includes('mp4') || mimeType?.includes('m4a')) return 'MP4';
  if (mimeType?.includes('wav')) return 'LINEAR16';
  return 'WEBM_OPUS';
}
