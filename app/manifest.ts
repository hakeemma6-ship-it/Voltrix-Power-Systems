import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: 'VOLTRIX Power Systems',
        short_name: 'VOLTRIX',
        description:
            'VOLTRIX is a Power Solutions Platform, Technical Guidance Portal, and Industrial Power Consultation Network helping users evaluate, compare, and connect with suitable power protection solution providers.',
        start_url: '/',
        display: 'standalone',
        background_color: '#ffffff',
        theme_color: '#0A2342',
        icons: [
            {
                src: '/icon-192.png',
                sizes: '192x192',
                type: 'image/png',
            },
            {
                src: '/android-chrome-192x192.png',
                sizes: '192x192',
                type: 'image/png',
            },
            {
                src: '/icon-512.png',
                sizes: '512x512',
                type: 'image/png',
            },
            {
                src: '/android-chrome-512x512.png',
                sizes: '512x512',
                type: 'image/png',
            },
            {
                src: '/apple-touch-icon.png',
                sizes: '180x180',
                type: 'image/png',
            },
        ],
    };
}
