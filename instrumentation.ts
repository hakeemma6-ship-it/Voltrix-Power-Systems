/**
 * instrumentation.ts — Next.js Server Lifecycle Bootstrap Hook.
 * Executes once on server startup before any HTTP requests are processed.
 */

export async function register() {
    if (process.env.NEXT_RUNTIME === 'nodejs') {
        try {
            const { bootstrapDatabase } = await import('@/lib/db');
            await bootstrapDatabase();
        } catch (err) {
            console.error('[Instrumentation] Database bootstrap error:', err);
        }
    }
}
