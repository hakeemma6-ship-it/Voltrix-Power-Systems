/**
 * lib/auth.ts — JWT authentication utilities for Next.js API Route Handlers.
 */

import jwt from 'jsonwebtoken';
import { NextRequest, NextResponse } from 'next/server';

import crypto from 'crypto';

// Ephemeral development fallback (generated once per process runtime)
let devFallbackSecret: string | null = null;

export function getJwtSecret(): string {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
        if (process.env.NODE_ENV === 'production') {
            throw new Error('[CRITICAL SECURITY ERROR] JWT_SECRET environment variable must be configured in production.');
        }
        if (!devFallbackSecret) {
            devFallbackSecret = crypto.randomBytes(32).toString('hex');
            console.warn('[SECURITY WARNING] JWT_SECRET is not defined. Using ephemeral random secret for development session.');
        }
        return devFallbackSecret;
    }
    return secret;
}

export function signToken(payload: object, expiresIn = '7d'): string {
    return jwt.sign(payload, getJwtSecret(), { expiresIn } as any);
}

export function verifyToken(token: string): any {
    try {
        return jwt.verify(token, getJwtSecret());
    } catch {
        return null;
    }
}

/**
 * Strips sensitive authentication fields (passwords, OTP hashes, reset tokens)
 * from user/dealer/customer objects before returning them in API responses.
 */
export function sanitizeUser<T>(user: T): T {
    if (!user || typeof user !== 'object') return user;
    const sanitized = { ...(user as Record<string, any>) };
    delete sanitized.password;
    delete sanitized.otpHash;
    delete sanitized.otpExpiry;
    delete sanitized.otpAttempts;
    delete sanitized.resetOtpHash;
    delete sanitized.resetOtpExpiry;
    delete sanitized.resetOtpAttempts;
    delete sanitized.resetToken;
    delete sanitized.resetTokenExpiry;
    delete sanitized.activationTokenHash;
    delete sanitized.activationTokenExpiry;
    delete sanitized.activationToken;
    return sanitized as T;
}

/** Generates a cryptographically secure random token in hex format */
export function generateSecureToken(bytes = 32): string {
    return crypto.randomBytes(bytes).toString('hex');
}

/** Computes SHA-256 hash of a token for secure database storage */
export function hashToken(token: string): string {
    return crypto.createHash('sha256').update(token.trim()).digest('hex');
}

export function getAuthUser(req: NextRequest): any | null {
    let token = req.cookies.get('token')?.value || '';
    if (!token) {
        const authHeader = req.headers.get('authorization');
        if (authHeader?.startsWith('Bearer ')) {
            token = authHeader.slice(7);
        }
    }
    if (!token) return null;
    return verifyToken(token);
}

/** Returns a 401 response if the user is not authenticated. */
export function requireAuth(req: NextRequest): { user: any } | NextResponse {
    const user = getAuthUser(req);
    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return { user };
}

/** Returns a 403 response if the user does not have the required role. */
export function requireRole(req: NextRequest, roles: string[]): { user: any } | NextResponse {
    const authResult = requireAuth(req);
    if (authResult instanceof NextResponse) return authResult;
    const { user } = authResult;
    if (!roles.includes(user.role)) {
        return NextResponse.json({ error: 'Forbidden: Insufficient permissions' }, { status: 403 });
    }
    return { user };
}

export function verifyAdmin(req: NextRequest): NextResponse | null {
    const authResult = requireRole(req, ['admin']);
    if (authResult instanceof NextResponse) return authResult;
    return null;
}


