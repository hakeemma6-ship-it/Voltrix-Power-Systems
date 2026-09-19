import { NextRequest, NextResponse } from 'next/server';
import { syncDatabaseOnBoot, isMongoReady, getMongoDb } from '@/lib/db';

export async function GET(_req: NextRequest) {
    try {
        await syncDatabaseOnBoot();
        const mongoReady = isMongoReady();
        const mongoDb = getMongoDb();
        const memoryUsage = process.memoryUsage();

        return NextResponse.json({
            status: 'healthy',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            services: {
                next: 'up',
                database: {
                    type: mongoReady ? 'mongodb' : 'in-memory fallback',
                    status: mongoReady && mongoDb ? 'connected' : 'active-local'
                },
                system: {
                    heapUsedMB: Math.round(memoryUsage.heapUsed / 1024 / 1024 * 100) / 100,
                    heapTotalMB: Math.round(memoryUsage.heapTotal / 1024 / 1024 * 100) / 100,
                    rssMB: Math.round(memoryUsage.rss / 1024 / 1024 * 100) / 100
                }
            }
        });
    } catch (err: any) {
        return NextResponse.json({
            status: 'unhealthy',
            timestamp: new Date().toISOString(),
            error: err.message
        }, { status: 500 });
    }
}
