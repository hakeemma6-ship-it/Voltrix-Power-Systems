/**
 * lib/otp.ts — Provider-Independent OTP Service (Powered by 2Factor.in)
 *
 * Facilitates sending and verifying one-time passwords via 2Factor's official API:
 * - Send (AUTOGEN): GET https://2factor.in/API/V1/{API_KEY}/SMS/{PHONE}/AUTOGEN
 * - Verify (VERIFY): GET https://2factor.in/API/V1/{API_KEY}/SMS/VERIFY/{SESSION_ID}/{OTP}
 *
 * Implements:
 * - Secure rate limiting (max 3 sends per 10 mins per phone; 30s cooldown)
 * - Maximum verification attempts guard (max 5 attempts)
 * - Zero plaintext OTP storage (2Factor manages and verifies the code on their servers)
 * - Ephemeral simulated development fallback when key is not configured or in tests
 */

import { randomInt } from 'crypto';
import bcrypt from 'bcryptjs';

// In-memory tracking for phone send rate-limits and simulated sessions
declare global {
    // eslint-disable-next-line no-var
    var __voltrix_otp_rate_limits: Record<string, { count: number; lastSentAt: number; windowStart: number }> | undefined;
    // eslint-disable-next-line no-var
    var __voltrix_simulated_otp_sessions: Record<string, { otpHash: string; expiry: number; attempts: number }> | undefined;
}

if (!global.__voltrix_otp_rate_limits) {
    global.__voltrix_otp_rate_limits = {};
}
if (!global.__voltrix_simulated_otp_sessions) {
    global.__voltrix_simulated_otp_sessions = {};
}

const sendRateLimits = global.__voltrix_otp_rate_limits!;
const simulatedSessions = global.__voltrix_simulated_otp_sessions!;

/**
 * Normalizes phone numbers to standard 10-digit Indian mobile format expected by 2Factor.in.
 * If international number with country code, strips leading '+' or '91' for India.
 */
export function formatPhoneNumber2Factor(phone: string | undefined): string {
    if (!phone) return '';
    let digits = phone.replace(/\D/g, '');

    // If starts with 91 and has 12 digits (India +91)
    if (digits.length === 12 && digits.startsWith('91')) {
        digits = digits.slice(2);
    }
    // If starts with 0 and has 11 digits
    if (digits.length === 11 && digits.startsWith('0')) {
        digits = digits.slice(1);
    }

    return digits;
}

export interface SendOtpOptions {
    phone: string;
    purpose?: 'login' | 'reset' | 'onboard' | 'verification';
    customOtp?: string; // Optional custom OTP override
}

export interface SendOtpResult {
    success: boolean;
    sessionId?: string;
    status: 'success' | 'simulated' | 'rate_limited' | 'failed' | 'invalid_phone';
    error?: string;
}

export interface VerifyOtpOptions {
    sessionId: string | undefined;
    otp: string;
    fallbackHash?: string; // Optional bcrypt fallback hash if session was stored locally
}

export interface VerifyOtpResult {
    success: boolean;
    status: 'matched' | 'mismatch' | 'expired' | 'max_attempts' | 'invalid_session' | 'failed';
    error?: string;
}

/**
 * Checks and updates rate limits for sending OTP to a phone number.
 * Allows max 3 sends per 10 minutes, with a minimum 30-second cooldown between sends.
 */
function checkSendRateLimit(cleanPhone: string): { allowed: boolean; waitSeconds?: number } {
    const now = Date.now();
    const record = sendRateLimits[cleanPhone];

    if (!record) {
        sendRateLimits[cleanPhone] = { count: 1, lastSentAt: now, windowStart: now };
        return { allowed: true };
    }

    // Reset window after 10 minutes
    if (now - record.windowStart > 10 * 60 * 1000) {
        sendRateLimits[cleanPhone] = { count: 1, lastSentAt: now, windowStart: now };
        return { allowed: true };
    }

    // Enforce 30-second cooldown between requests
    const cooldownMs = 30 * 1000;
    if (now - record.lastSentAt < cooldownMs) {
        const wait = Math.ceil((cooldownMs - (now - record.lastSentAt)) / 1000);
        return { allowed: false, waitSeconds: wait };
    }

    // Enforce max 3 requests per 10-minute window
    if (record.count >= 3) {
        const windowRemaining = Math.ceil((10 * 60 * 1000 - (now - record.windowStart)) / 1000);
        return { allowed: false, waitSeconds: windowRemaining };
    }

    record.count += 1;
    record.lastSentAt = now;
    return { allowed: true };
}

/**
 * Sends an OTP via 2Factor.in AUTOGEN endpoint.
 * Automatically falls back to simulated development mode when TWOFACTOR_API_KEY is not configured.
 */
export async function sendOtp({
    phone,
    purpose = 'login',
    customOtp
}: SendOtpOptions): Promise<SendOtpResult> {
    const cleanPhone = formatPhoneNumber2Factor(phone);

    if (!cleanPhone || cleanPhone.length < 10) {
        console.warn(`[OTP Service] Invalid phone number provided: "${phone}"`);
        return { success: false, status: 'invalid_phone', error: 'Please enter a valid 10-digit mobile number.' };
    }

    // Check rate limit
    const rateCheck = checkSendRateLimit(cleanPhone);
    if (!rateCheck.allowed) {
        return {
            success: false,
            status: 'rate_limited',
            error: `Please wait ${rateCheck.waitSeconds} seconds before requesting another OTP.`
        };
    }

    const apiKey = process.env.TWOFACTOR_API_KEY?.trim();
    const template = process.env.TWOFACTOR_OTP_TEMPLATE?.trim();

    // Simulation / Development Fallback when API key is missing
    if (!apiKey) {
        const simulatedOtp = customOtp || randomInt(100000, 1000000).toString();
        const sessionId = `sim_2fa_${Date.now()}_${randomInt(1000, 9999)}`;
        const otpHash = bcrypt.hashSync(simulatedOtp, 10);

        simulatedSessions[sessionId] = {
            otpHash,
            expiry: Date.now() + 10 * 60 * 1000, // 10 minutes
            attempts: 0
        };

        console.log('\n==========================================================');
        console.log(`🔑 [2Factor SIMULATOR] Purpose: ${purpose.toUpperCase()} | Phone: ${cleanPhone}`);
        console.log(`   Simulated OTP: ${simulatedOtp}`);
        console.log(`   Session ID: ${sessionId}`);
        console.log('==========================================================\n');

        return {
            success: true,
            sessionId,
            status: 'simulated'
        };
    }

    try {
        // 2Factor.in SMS endpoint strictly expects the 10-digit mobile number for Indian domestic SMS routing.
        // Prepending '+' or '+91' in the URL causes length validation failures and triggers automated Voice Fallback calls.
        const targetPhone = cleanPhone.length === 10 ? cleanPhone : cleanPhone.replace(/^\+/, '');
        let url = `https://2factor.in/API/V1/${encodeURIComponent(apiKey)}/SMS/${encodeURIComponent(targetPhone)}/AUTOGEN`;
        if (template) {
            url += `/${encodeURIComponent(template)}`;
        }

        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Accept': 'application/json'
            }
        });

        const data = await response.json();

        if (response.ok && data.Status === 'Success') {
            const sessionId = data.Details;
            console.log(`[2Factor API] OTP sent successfully to ${cleanPhone}. Session: ${sessionId}`);
            return {
                success: true,
                sessionId,
                status: 'success'
            };
        } else {
            const errorMsg = data.Details || `2Factor API error (Status: ${data.Status || response.status})`;
            console.error(`[2Factor API] Failed to send OTP to ${cleanPhone}:`, errorMsg);
            return {
                success: false,
                status: 'failed',
                error: errorMsg
            };
        }
    } catch (err: any) {
        console.error(`[2Factor API] Network exception while sending OTP to ${cleanPhone}:`, err.message);
        return {
            success: false,
            status: 'failed',
            error: 'Unable to reach SMS gateway. Please try again shortly.'
        };
    }
}

/**
 * Verifies an OTP using 2Factor.in VERIFY endpoint.
 * Validates session expiry, maximum attempts, and matches.
 */
export async function verifyOtp({
    sessionId,
    otp,
    fallbackHash
}: VerifyOtpOptions): Promise<VerifyOtpResult> {
    if (!sessionId) {
        return {
            success: false,
            status: 'invalid_session',
            error: 'No active OTP verification session found. Please request a new OTP.'
        };
    }

    const cleanOtp = (otp || '').trim();
    if (!cleanOtp) {
        return {
            success: false,
            status: 'mismatch',
            error: 'Please enter the OTP verification code.'
        };
    }

    // 1. Check Simulated Session
    if (sessionId.startsWith('sim_2fa_')) {
        const simSession = simulatedSessions[sessionId];
        if (!simSession) {
            if (fallbackHash) {
                const isValid = bcrypt.compareSync(cleanOtp, fallbackHash);
                return isValid
                    ? { success: true, status: 'matched' }
                    : { success: false, status: 'mismatch', error: 'Invalid OTP code. Please check and try again.' };
            }
            return { success: false, status: 'invalid_session', error: 'Session expired or not found. Please request a new OTP.' };
        }

        if (Date.now() > simSession.expiry) {
            delete simulatedSessions[sessionId];
            return { success: false, status: 'expired', error: 'OTP has expired. Please request a new one.' };
        }

        if (simSession.attempts >= 5) {
            delete simulatedSessions[sessionId];
            return { success: false, status: 'max_attempts', error: 'Maximum OTP verification attempts exceeded. Please request a new OTP.' };
        }

        const isMatch = bcrypt.compareSync(cleanOtp, simSession.otpHash);
        if (isMatch) {
            delete simulatedSessions[sessionId];
            return { success: true, status: 'matched' };
        } else {
            simSession.attempts += 1;
            const remaining = 5 - simSession.attempts;
            return {
                success: false,
                status: 'mismatch',
                error: `Invalid OTP code. ${remaining > 0 ? `${remaining} attempts remaining.` : 'Maximum attempts reached.'}`
            };
        }
    }

    // 2. Real 2Factor API Verification
    const apiKey = process.env.TWOFACTOR_API_KEY?.trim();
    if (!apiKey) {
        // If API key is missing but session is not simulated, check fallback hash
        if (fallbackHash && bcrypt.compareSync(cleanOtp, fallbackHash)) {
            return { success: true, status: 'matched' };
        }
        return { success: false, status: 'failed', error: 'SMS service is not configured.' };
    }

    try {
        const url = `https://2factor.in/API/V1/${encodeURIComponent(apiKey)}/SMS/VERIFY/${encodeURIComponent(sessionId)}/${encodeURIComponent(cleanOtp)}`;
        const response = await fetch(url, {
            method: 'GET',
            headers: { 'Accept': 'application/json' }
        });

        const data = await response.json();

        if (data.Status === 'Success' && data.Details === 'OTP Matched') {
            console.log(`[2Factor API] OTP verified successfully for session: ${sessionId}`);
            return { success: true, status: 'matched' };
        }

        const details = (data.Details || '').toString().toLowerCase();

        if (details.includes('mismatch')) {
            return {
                success: false,
                status: 'mismatch',
                error: 'Invalid OTP code. Please check the code and try again.'
            };
        }

        if (details.includes('expired')) {
            return {
                success: false,
                status: 'expired',
                error: 'OTP has expired. Please request a new code.'
            };
        }

        if (details.includes('already') || details.includes('invalid')) {
            return {
                success: false,
                status: 'invalid_session',
                error: 'This OTP session has already been used or is invalid. Please request a new one.'
            };
        }

        return {
            success: false,
            status: 'failed',
            error: data.Details || 'Failed to verify OTP code.'
        };
    } catch (err: any) {
        console.error(`[2Factor API] Exception while verifying OTP for session ${sessionId}:`, err.message);
        return {
            success: false,
            status: 'failed',
            error: 'Network failure communicating with OTP verification service. Please try again.'
        };
    }
}
