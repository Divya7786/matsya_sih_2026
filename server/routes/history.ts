import { Router, Request, Response } from 'express';
import { dbQuery, useInMemory, memGetAnalyses, memSaveAnalysis, StoredAnalysis } from '../db/postgres';
import { requireAuth } from '../middleware/auth';

export const historyRouter = Router();

// GET /api/history/analyses — return analysis history for the authenticated user
historyRouter.get('/analyses', requireAuth, async (req: Request, res: Response) => {
  const uid = req.user!.id;
  try {
    let analyses: StoredAnalysis[];
    if (useInMemory()) {
      analyses = memGetAnalyses(uid);
    } else {
      analyses = await dbQuery(
        `SELECT * FROM analysis_history WHERE user_id=$1 ORDER BY created_at DESC LIMIT 50`,
        [uid]
      );
    }
    res.json({ analyses });
  } catch (err: any) {
    console.error('[HISTORY] Error:', err.message);
    res.status(500).json({ error: 'Failed to load history' });
  }
});

// Internal helper called from server.ts after orchestration
export async function saveAnalysis(params: {
  userId: string;
  query: string;
  intent: string;
  locationName: string | null;
  lat: number | null;
  lng: number | null;
  answerSummary: string;
  dataStatus: string;
  pfzCount: number;
  waveHeight: number | null;
}): Promise<void> {
  const record: StoredAnalysis = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    user_id: params.userId,
    query: params.query,
    intent: params.intent,
    location_name: params.locationName,
    lat: params.lat,
    lng: params.lng,
    answer_summary: params.answerSummary,
    data_status: params.dataStatus,
    pfz_count: params.pfzCount,
    wave_height: params.waveHeight,
    created_at: new Date().toISOString(),
  };

  if (useInMemory()) {
    memSaveAnalysis(record);
    return;
  }
  try {
    await dbQuery(
      `INSERT INTO analysis_history
         (user_id, query, intent, location_name, lat, lng, answer_summary, data_status, pfz_count, wave_height)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
      [params.userId, params.query, params.intent, params.locationName, params.lat, params.lng,
       params.answerSummary, params.dataStatus, params.pfzCount, params.waveHeight]
    );
  } catch (err: any) {
    console.warn('[HISTORY] Failed to save analysis:', err.message);
  }
}
