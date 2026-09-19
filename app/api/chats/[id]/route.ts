/**
 * DELETE /api/chats/[id] — Delete a specific chat session for the authenticated user
 */
import { NextRequest, NextResponse } from 'next/server';
import { db, getMongoDb, isMongoReady, syncDatabaseOnBoot, escapeRegExp } from '@/lib/db';
import { requireAuth } from '@/lib/auth';

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    await syncDatabaseOnBoot();
    const auth = requireAuth(req);
    if (auth instanceof NextResponse) return auth;
    const { user } = auth;
    const userEmail = user.email.toLowerCase();
    const { id } = await params;

    if (isMongoReady()) {
        try {
            const mongoDb = getMongoDb();
            await mongoDb.collection('chat_sessions').deleteOne({ id, userEmail: { $regex: new RegExp(`^${escapeRegExp(userEmail)}$`, 'i') } });
        } catch (e) {
            console.error('Failed to delete chat session from MongoDB:', e);
        }
    }

    const idx = (db.chatSessions || []).findIndex((c: any) => c.id === id && c.userEmail?.toLowerCase() === userEmail);
    if (idx > -1) {
        db.chatSessions.splice(idx, 1);
    }

    return NextResponse.json({ success: true, message: 'Chat session deleted successfully' });
}
