import { Router, Request, Response } from 'express';
import { transcribeAudio } from '../services/sttService';

export const voiceRouter = Router();

const MAX_AUDIO_BYTES = 10 * 1024 * 1024; // 10 MB

// POST /api/voice/transcribe
// Body: { audioBase64: string, mimeType: string, languageCode: string }
// Returns: { transcript, language, provider, confidence }
// API keys NEVER returned; backend-only.
voiceRouter.post('/transcribe', async (req: Request, res: Response) => {
  const { audioBase64, mimeType, languageCode } = req.body ?? {};

  if (!audioBase64 || typeof audioBase64 !== 'string') {
    return res.status(400).json({ error: 'audioBase64 is required' });
  }
  if (!languageCode || typeof languageCode !== 'string') {
    return res.status(400).json({ error: 'languageCode is required' });
  }

  // Validate size before decoding
  const estimatedBytes = Math.ceil(audioBase64.length * 0.75);
  if (estimatedBytes > MAX_AUDIO_BYTES) {
    return res.status(413).json({ error: `Audio exceeds 10 MB limit (estimated ${Math.round(estimatedBytes / 1024 / 1024)}MB)` });
  }

  try {
    const audioBuffer = Buffer.from(audioBase64, 'base64');
    const result = await transcribeAudio(audioBuffer, mimeType || 'audio/webm', languageCode);

    // Never expose API keys — return only safe fields
    return res.json({
      transcript: result.transcript,
      language: result.language,
      provider: result.provider,   // e.g. "gemini:gemini-1.5-flash" — no key info
      confidence: result.confidence,
    });
  } catch (err: any) {
    console.error('[STT] Transcription error:', err.message);

    const isNoProvider = err.message?.includes('No STT provider');
    if (isNoProvider) {
      return res.status(503).json({
        error: 'Cloud STT not configured',
        hint: 'Set GEMINI_API_KEY (for Gemini) or STT_PROVIDER + STT_API_KEY in .env',
      });
    }

    return res.status(500).json({ error: 'Transcription failed', message: err.message });
  }
});
