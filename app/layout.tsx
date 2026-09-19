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
    title: 'VOLTRIX | Power Solutions Platform & Technical Guidance Portal',
    description:
        'VOLTRIX is a Power Solutions Platform, Technical Guidance Portal, and Industrial Power Consultation Network helping users evaluate, compare, and connect with suitable power protection solution providers.',
    alternates: {
        canonical: 'https://voltrixsystems.com',
    },
    openGraph: {
        title: 'VOLTRIX | Power Solutions Platform & Technical Guidance Portal',
        description: 'VOLTRIX is a Power Solutions Platform, Technical Guidance Portal, and Industrial Power Consultation Network helping users evaluate, compare, and connect with suitable power protection solution providers.',
        url: 'https://voltrixsystems.com',
        siteName: 'VOLTRIX Power Systems',
        locale: 'en_US',
        type: 'website',
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
