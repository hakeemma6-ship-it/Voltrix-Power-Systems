/**
 * POST /api/track — Record path visitor tracking
 */
import { NextRequest, NextResponse } from 'next/server';
import { visitorStatsCache, persistWriteAsync, ensureDb } from '@/lib/db';

export async function POST(req: NextRequest) {
    await ensureDb();
    const { path: routePath } = await req.json();
    if (!routePath) {
        return NextResponse.json({ error: 'Required route path parameter missing.' }, { status: 400 });
    }

    const cleanPath = routePath.split('?')[0];
    const lastVisitedAt = new Date().toISOString().split('T')[0];

    if (!visitorStatsCache[cleanPath]) {
        visitorStatsCache[cleanPath] = { path: cleanPath, views: 0, lastVisitedAt };
    }
    visitorStatsCache[cleanPath].views += 1;
    visitorStatsCache[cleanPath].lastVisitedAt = lastVisitedAt;

    persistWriteAsync('visitor_stats', cleanPath.replace(/\//g, '_') || 'home', visitorStatsCache[cleanPath]);
    return NextResponse.json({ success: true, stats: visitorStatsCache[cleanPath] });
}
