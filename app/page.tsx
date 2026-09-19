'use client';

// Re-export the main App component as the Next.js root page.
// The entire app is a client-side SPA using hash routing, so we mark
// this page as a client component and delegate all rendering to App.tsx.
export { default } from '@/App';
