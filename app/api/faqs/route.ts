/**
 * GET /api/faqs — Get all FAQs
 */
import { NextResponse } from 'next/server';
import { db, syncDatabaseOnBoot } from '@/lib/db';

export async function GET() {
    await syncDatabaseOnBoot();
    return NextResponse.json(db.faqs || []);
}
