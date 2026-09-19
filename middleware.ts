import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// In-memory request ledger (resets when the serverless instance/container recycles)
const tracker = new Map<string, { count: number; resetTime: number }>();

// Cleanup timer interval (to prevent memory leaks from old entries)
let lastCleanup = Date.now();
const CLEANUP_INTERVAL = 5 * 60 * 1000; // 5 minutes

function cleanupTracker() {
    const now = Date.now();
    for (const [key, record] of tracker.entries()) {
        if (now > record.resetTime) {
            tracker.delete(key);
        }
    }
    lastCleanup = now;
}

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Only apply rate limiting to API routes
    if (!pathname.startsWith('/api')) {
        return NextResponse.next();
    }

    // Exclude healthcheck from rate limiting
    if (pathname === '/api/health') {
        return NextResponse.next();
    }

    const now = Date.now();

    // Periodic memory cleanup
    if (now - lastCleanup > CLEANUP_INTERVAL) {
        cleanupTracker();
    }

    // Resolve client IP address
    const ip = (request as any).ip || request.headers.get('x-forwarded-for')?.split(',')[0].trim() || request.headers.get('x-real-ip') || '127.0.0.1';

    // Different limits for auth endpoints versus general API
    const isSensitive = pathname.startsWith('/api/auth/login') ||
        pathname.startsWith('/api/auth/signup') ||
        pathname.startsWith('/api/auth/google-login') ||
        pathname.startsWith('/api/auth/google-onboard') ||
        pathname.startsWith('/api/auth/forgot-password') ||
        pathname.startsWith('/api/auth/verify-otp') ||
        pathname.startsWith('/api/auth/set-password');

    const limit = isSensitive ? 15 : 100; // 15 requests/min for auth, 100 requests/min for other APIs
    const windowMs = 60 * 1000; // 1 minute window

    const trackingKey = `${ip}:${isSensitive ? 'sensitive' : 'general'}`;
    const record = tracker.get(trackingKey);

    if (!record) {
        tracker.set(trackingKey, {
            count: 1,
            resetTime: now + windowMs,
        });
        return NextResponse.next();
    }

    if (now > record.resetTime) {
        // Reset the window
        record.count = 1;
        record.resetTime = now + windowMs;
        return NextResponse.next();
    }

    record.count += 1;

    if (record.count > limit) {
        const resetRemainingSeconds = Math.ceil((record.resetTime - now) / 1000);
        return new NextResponse(
            JSON.stringify({
                error: 'Too many requests. Please try again later.',
                retryAfterSeconds: resetRemainingSeconds
            }),
            {
                status: 429,
                headers: {
                    'Content-Type': 'application/json',
                    'Retry-After': String(resetRemainingSeconds)
                }
            }
        );
    }

    const response = NextResponse.next();
    // Set headers to expose rate limits to the client
    response.headers.set('X-RateLimit-Limit', String(limit));
    response.headers.set('X-RateLimit-Remaining', String(Math.max(0, limit - record.count)));
    response.headers.set('X-RateLimit-Reset', String(Math.ceil(record.resetTime / 1000)));

    return response;
}

// Configure middleware to only target API routes to reduce overhead
export const config = {
    matcher: '/api/:path*',
};
