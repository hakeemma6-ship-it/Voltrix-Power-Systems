import { NextRequest, NextResponse } from 'next/server';
import { db, syncDatabaseOnBoot, persistWrite } from '@/lib/db';
import { sendWhatsAppMessage } from '@/lib/whatsapp';

export async function POST(req: NextRequest) {
    await syncDatabaseOnBoot();
    const body = await req.json();
    const { email } = body;

    if (!email) {
        return NextResponse.json({ error: 'Email is required.' }, { status: 400 });
    }

    const formattedEmail = email.trim().toLowerCase();
    
    // Find customer by email
    const customer = db.customers.find((c: any) => c.email && c.email.toLowerCase() === formattedEmail);

    if (!customer) {
        // Return a generic success message to prevent email enumeration
        return NextResponse.json({ success: true, message: 'If an account exists, a reset link has been sent.' });
    }

    try {
        const resetToken = require('crypto').randomBytes(32).toString('hex');
        const resetTokenExpiry = Date.now() + 24 * 60 * 60 * 1000; // 24 hours

        // Update customer
        customer.resetToken = resetToken;
        customer.resetTokenExpiry = resetTokenExpiry;
        customer.updatedAt = new Date().toISOString();

        await persistWrite('customers', customer.id, customer);

        // Send WhatsApp notification if phone exists
        if (customer.phone) {
            const origin = req.headers.get('origin') || 'https://voltrixpowersystems.com';
            const setupUrl = `${origin}/#set-password?token=${encodeURIComponent(resetToken)}`;
            
            await sendWhatsAppMessage({
                to: customer.phone,
                recipientName: customer.name,
                type: 'template',
                templateName: 'customer_welcome_credentials', // Or a dedicated reset template if available
                parameters: [customer.name, setupUrl]
            }).catch(e => console.error('Failed to send reset WhatsApp message:', e));
        }

        return NextResponse.json({ success: true, message: 'If an account exists, a reset link has been sent.' });
    } catch (error) {
        console.error('Failed to process forgot password:', error);
        return NextResponse.json({ error: 'An error occurred while processing your request.' }, { status: 500 });
    }
}
