/**
 * GET /api/chats — Get chat sessions of the authenticated user
 * POST /api/chats — Create or update a chat session for the authenticated user
 */
import { NextRequest, NextResponse } from 'next/server';
import { db, persistWrite, syncDatabaseOnBoot } from '@/lib/db';
import { requireAuth } from '@/lib/auth';

export async function GET(req: NextRequest) {
    await syncDatabaseOnBoot();
    const auth = requireAuth(req);
    if (auth instanceof NextResponse) return auth;
    const { user } = auth;
    const userEmail = user.email.toLowerCase();

    const userChats = (db.chatSessions || [])
        .filter((c: any) => c.userEmail?.toLowerCase() === userEmail)
        .sort((a: any, b: any) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

    return NextResponse.json(userChats);
}

export async function POST(req: NextRequest) {
    await syncDatabaseOnBoot();
    const auth = requireAuth(req);
    if (auth instanceof NextResponse) return auth;
    const { user } = auth;
    const userEmail = user.email.toLowerCase();

    const { id, title, messages, recommendation } = await req.json();
    if (!id) {
        return NextResponse.json({ error: 'Chat session ID is required.' }, { status: 400 });
    }

    const timestamp = new Date().toISOString();
    let chatDoc = (db.chatSessions || []).find((c: any) => c.id === id);

    if (chatDoc) {
        if (chatDoc.userEmail && chatDoc.userEmail.toLowerCase() !== userEmail) {
            return NextResponse.json({ error: 'Forbidden: You cannot modify another user\'s chat session.' }, { status: 403 });
        }
        chatDoc.title = title || chatDoc.title;
        chatDoc.messages = messages || chatDoc.messages;
        chatDoc.recommendation = recommendation !== undefined ? recommendation : chatDoc.recommendation;
        chatDoc.updatedAt = timestamp;
    } else {
        chatDoc = {
            id,
            userEmail,
            title: title || 'New Power Solution Consultation',
            messages: messages || [],
            recommendation: recommendation || null,
            createdAt: timestamp,
            updatedAt: timestamp
        };
        db.chatSessions.push(chatDoc);
    }

    await persistWrite('chat_sessions', chatDoc.id, chatDoc);
    return NextResponse.json({ success: true, chat: chatDoc });
}
