import React from 'react';
import type { Metadata } from 'next';
import { Inter, Plus_Jakarta_Sans, JetBrains_Mono } from 'next/font/google';

import './globals.css';

const inter = Inter({
    subsets: ['latin'],
    variable: '--font-inter',
    weight: ['300', '400', '500', '600', '700', '800'],
    display: 'swap',
});

const plusJakartaSans = Plus_Jakarta_Sans({
    subsets: ['latin'],
    variable: '--font-plus-jakarta',
    weight: ['400', '500', '600', '700', '800'],
    display: 'swap',
});

const jetBrainsMono = JetBrains_Mono({
    subsets: ['latin'],
    variable: '--font-jetbrains-mono',
    weight: ['400', '500', '700'],
    display: 'swap',
});

export const metadata: Metadata = {
    metadataBase: new URL('https://voltrixsystems.com'),
    title: {
        default: 'VOLTRIX | Power Solutions Platform & Technical Guidance Portal',
        template: '%s | VOLTRIX',
    },
    description:
        'VOLTRIX is a Power Solutions Platform, Technical Guidance Portal, and Industrial Power Consultation Network helping users evaluate, compare, and connect with suitable power protection solution providers.',
    applicationName: 'VOLTRIX Power Systems',
    authors: [{ name: 'VOLTRIX Power Systems / Fortune Traders', url: 'https://voltrixsystems.com' }],
    generator: 'Next.js',
    keywords: [
        'VOLTRIX',
        'Voltrix Power Systems',
        'Servo Voltage Stabilizer',
        'Air Cooled Stabilizer',
        'Oil Cooled Stabilizer',
        'Industrial Online UPS',
        'Commercial Inverter',
        'Industrial Batteries',
        'Solar Power Systems',
        'Power Protection Hyderabad',
        'Fortune Traders'
    ],
    referrer: 'origin-when-cross-origin',
    creator: 'VOLTRIX Power Systems',
    publisher: 'Fortune Traders',
    formatDetection: {
        email: false,
        address: false,
        telephone: false,
    },
    alternates: {
        canonical: 'https://voltrixsystems.com',
    },
    icons: {
        icon: [
            { url: '/favicon.ico', sizes: 'any' },
            { url: '/favicon-32x32.png', type: 'image/png', sizes: '32x32' },
            { url: '/favicon-16x16.png', type: 'image/png', sizes: '16x16' },
            { url: '/icon-192.png', type: 'image/png', sizes: '192x192' },
            { url: '/icon-512.png', type: 'image/png', sizes: '512x512' },
        ],
        apple: [
            { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
        ],
        shortcut: '/favicon.ico',
    },
    manifest: '/manifest.webmanifest',
    openGraph: {
        title: 'VOLTRIX | Power Solutions Platform & Technical Guidance Portal',
        description:
            'VOLTRIX is a Power Solutions Platform, Technical Guidance Portal, and Industrial Power Consultation Network helping users evaluate, compare, and connect with suitable power protection solution providers.',
        url: 'https://voltrixsystems.com',
        siteName: 'VOLTRIX Power Systems',
        locale: 'en_US',
        type: 'website',
        images: [
            {
                url: 'https://voltrixsystems.com/og-image.png',
                width: 1200,
                height: 630,
                alt: 'VOLTRIX Power Systems - Industrial Power Solutions & Technical Guidance Portal',
                type: 'image/png',
            },
        ],
    },
    twitter: {
        card: 'summary_large_image',
        title: 'VOLTRIX | Power Solutions Platform & Technical Guidance Portal',
        description:
            'VOLTRIX is a Power Solutions Platform, Technical Guidance Portal, and Industrial Power Consultation Network helping users evaluate, compare, and connect with suitable power protection solution providers.',
        images: ['https://voltrixsystems.com/og-image.png'],
        creator: '@VoltrixPower',
        site: '@VoltrixPower',
    },
    robots: {
        index: true,
        follow: true,
        nocache: false,
        googleBot: {
            index: true,
            follow: true,
            'max-video-preview': -1,
            'max-image-preview': 'large',
            'max-snippet': -1,
        },
    },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    const jsonLd = {
        "@context": "https://schema.org",
        "@type": "Organization",
        "name": "VOLTRIX Power Systems",
        "url": "https://voltrixsystems.com",
        "contactPoint": {
            "@type": "ContactPoint",
            "telephone": "+91-99999-99999",
            "contactType": "customer service",
            "areaServed": "IN",
            "availableLanguage": "en"
        },
        "description": "Industrial Power Solutions Platform, Technical Guidance Portal, and Industrial Power Consultation Network."
    };

    return (
        <html lang="en" className={`${inter.variable} ${plusJakartaSans.variable} ${jetBrainsMono.variable}`}>
            <head>
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
                />
            </head>
            <body className="antialiased text-slate-900 bg-white selection:bg-emerald-500 selection:text-white font-sans">
                <div id="voltrix-viewport" className="min-h-screen flex flex-col">
                    {children}
                </div>
            </body>
        </html>
    );
}
