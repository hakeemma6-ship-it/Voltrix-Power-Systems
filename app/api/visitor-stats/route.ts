/**
 * GET /api/visitor-stats — Get all visitor page views stats
 */
import { NextResponse } from 'next/server';
import { visitorStatsCache, ensureDb } from '@/lib/db';

export async function GET() {
    await ensureDb();
    return NextResponse.json(Object.values(visitorStatsCache));
}
