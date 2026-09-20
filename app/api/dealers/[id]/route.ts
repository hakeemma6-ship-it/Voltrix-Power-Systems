/**
 * GET   /api/dealers/[id]         — Get single dealer
 * PATCH /api/dealers/[id]         — Admin: approve / suspend / reactivate dealer
 * DELETE /api/dealers/[id]        — Admin: delete dealer
 *
 * PATCH body: { action: 'approve' | 'suspend' | 'reactivate' }
 * or generic field updates
 */
import { NextRequest, NextResponse } from 'next/server';
import { db, persistWrite, syncDatabaseOnBoot, isMongoReady, getMongoDb } from '@/lib/db';
import { requireRole, sanitizeUser } from '@/lib/auth';
import { sendWhatsAppMessage } from '@/lib/whatsapp';

type Params = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: Params) {
    await syncDatabaseOnBoot();
    const { id } = await params;
    const authResult = requireRole(req, ['admin', 'dealer']);
    if (authResult instanceof NextResponse) return authResult;

    const dealer = db.dealers.find((d: any) => d.id === id);
    if (!dealer) return NextResponse.json({ error: 'Dealer not found' }, { status: 404 });

    const { user } = authResult;
    if (user.role === 'dealer' && dealer.email.toLowerCase() !== user.email.toLowerCase()) {
        return NextResponse.json({ error: 'Forbidden: You cannot view another dealer\'s profile' }, { status: 403 });
    }

    return NextResponse.json(sanitizeUser(dealer));
}

export async function PATCH(req: NextRequest, { params }: Params) {
    await syncDatabaseOnBoot();
    const { id } = await params;
    const authResult = requireRole(req, ['admin', 'dealer']);
    if (authResult instanceof NextResponse) return authResult;

    const { user } = authResult;
    if (user.role === 'dealer') {
        const dealerRecord = db.dealers.find((d: any) => d.id === id);
        if (!dealerRecord || dealerRecord.email.toLowerCase() !== user.email.toLowerCase()) {
            return NextResponse.json({ error: "Forbidden: You cannot modify another dealer's profile" }, { status: 403 });
        }
    }

    const idx = db.dealers.findIndex((d: any) => d.id === id);
    if (idx === -1) return NextResponse.json({ error: 'Dealer not found' }, { status: 404 });

    const body = await req.json();
    const { action, ...updates } = body;

    const adminOnlyActions = ['approve', 'suspend', 'reactivate', 'reject'];
    if (action && adminOnlyActions.includes(action)) {
        if (user.role !== 'admin') {
            return NextResponse.json({ error: 'Forbidden: Only administrators can modify dealer account status' }, { status: 403 });
        }
    }

    if (action === 'approve') {
        const fee = body.perCustomerAssignmentFee !== undefined 
            ? parseFloat(body.perCustomerAssignmentFee) 
            : db.dealers[idx].perCustomerAssignmentFee;
        const pct = body.commissionPercentage !== undefined 
            ? parseFloat(body.commissionPercentage) 
            : db.dealers[idx].commissionPercentage;

        if (fee === undefined || fee === null || isNaN(fee) || fee <= 0 ||
            pct === undefined || pct === null || isNaN(pct) || pct <= 0) {
            return NextResponse.json({
                error: 'Dealer approval requires setting and saving both a fixed price per customer and a commission percentage greater than 0.'
            }, { status: 400 });
        }

        db.dealers[idx] = {
            ...db.dealers[idx],
            status: 'approved',
            approvedAt: new Date().toISOString().split('T')[0],
            isSeenByAdmin: true,
            commissionPercentage: pct,
            perCustomerAssignmentFee: fee,
        };
        // Notify approved dealer via WhatsApp
        try {
            await sendWhatsAppMessage({
                to: db.dealers[idx].phone || '',
                recipientName: db.dealers[idx].name || 'Dealer',
                type: 'template',
                templateName: 'dealer_approved',
                parameters: [db.dealers[idx].name || 'Dealer', db.dealers[idx].companyName || 'Voltrix Reseller'],
                associatedDealerId: id
            });
        } catch (err) {
            console.error('Failed to notify dealer approval:', err);
        }
    } else if (action === 'suspend') {
        db.dealers[idx] = {
            ...db.dealers[idx],
            status: 'suspended',
            isSeenByAdmin: true,
        };
        // Notify suspended dealer via WhatsApp
        try {
            await sendWhatsAppMessage({
                to: db.dealers[idx].phone || '',
                recipientName: db.dealers[idx].name || 'Dealer',
                type: 'template',
                templateName: 'dealer_suspended',
                parameters: [db.dealers[idx].name || 'Dealer', db.dealers[idx].companyName || 'Voltrix Reseller'],
                associatedDealerId: id
            });
        } catch (err) {
            console.error('Failed to notify dealer suspension:', err);
        }
    } else if (action === 'reactivate') {
        db.dealers[idx] = {
            ...db.dealers[idx],
            status: 'approved',
            isSeenByAdmin: true,
        };
        // Notify reactivated dealer via WhatsApp (dealer_approved notice)
        try {
            await sendWhatsAppMessage({
                to: db.dealers[idx].phone || '',
                recipientName: db.dealers[idx].name || 'Dealer',
                type: 'template',
                templateName: 'dealer_approved',
                parameters: [db.dealers[idx].name || 'Dealer', db.dealers[idx].companyName || 'Voltrix Reseller'],
                associatedDealerId: id
            });
        } catch (err) {
            console.error('Failed to notify dealer reactivation:', err);
        }
    } else if (action === 'reject') {
        db.dealers[idx] = {
            ...db.dealers[idx],
            status: 'rejected',
            isSeenByAdmin: true,
        };
        // Notify rejected dealer via WhatsApp
        try {
            await sendWhatsAppMessage({
                to: db.dealers[idx].phone || '',
                recipientName: db.dealers[idx].name || 'Dealer',
                type: 'template',
                templateName: 'dealer_rejected',
                parameters: [db.dealers[idx].name || 'Dealer', db.dealers[idx].companyName || 'Voltrix Reseller'],
                associatedDealerId: id
            });
        } catch (err) {
            console.error('Failed to notify dealer rejection:', err);
        }
    } else {
        // Generic update: If caller is dealer, restrict updates to safe profile fields
        let allowedUpdates = updates;
        if (user.role === 'dealer') {
            const safeFields = [
                'name', 'companyName', 'phone', 'alternateMobile', 'city', 'state',
                'shopAddress', 'pinCode', 'panNumber', 'aadhaarNumber', 'yearsOfExperience',
                'interestedProducts', 'businessType'
            ];
            allowedUpdates = {};
            for (const field of safeFields) {
                if (updates[field] !== undefined) {
                    allowedUpdates[field] = updates[field];
                }
            }
        }
        if (user.role === 'admin') {
            if (updates.commissionPercentage !== undefined) {
                allowedUpdates.commissionPercentage = Math.min(100, Math.max(0, parseFloat(updates.commissionPercentage) || 0));
            }
            if (updates.perCustomerAssignmentFee !== undefined) {
                allowedUpdates.perCustomerAssignmentFee = Math.max(0, parseFloat(updates.perCustomerAssignmentFee) || 0);
            }
        }

        db.dealers[idx] = {
            ...db.dealers[idx],
            ...allowedUpdates,
            isSeenByAdmin: user.role === 'admin' ? true : db.dealers[idx].isSeenByAdmin,
        };
    }

    await persistWrite('dealers', id, db.dealers[idx]);

    // Sync status and commission to users collection (Admin collection in MongoDB) for login consistency
    const userIdx = db.users.findIndex((u: any) => u.dealerId === id || u.id === id || (u.email && db.dealers[idx].email && u.email.toLowerCase() === db.dealers[idx].email.toLowerCase() && u.role === 'dealer'));
    if (userIdx !== -1) {
        db.users[userIdx].status = db.dealers[idx].status;
        if (db.dealers[idx].commissionPercentage !== undefined) {
            db.users[userIdx].commissionPercentage = db.dealers[idx].commissionPercentage;
        }
        if (db.dealers[idx].perCustomerAssignmentFee !== undefined) {
            db.users[userIdx].perCustomerAssignmentFee = db.dealers[idx].perCustomerAssignmentFee;
        }
        await persistWrite('users', db.users[userIdx].id || db.users[userIdx]._id, db.users[userIdx]);
    }

    return NextResponse.json(sanitizeUser(db.dealers[idx]));
}

export async function DELETE(req: NextRequest, { params }: Params) {
    await syncDatabaseOnBoot();
    const { id } = await params;
    const authResult = requireRole(req, ['admin']);
    if (authResult instanceof NextResponse) return authResult;

    const idx = db.dealers.findIndex((d: any) => d.id === id);
    if (idx === -1) return NextResponse.json({ error: 'Dealer not found' }, { status: 404 });

    const dealer = db.dealers[idx];
    const dealerEmail = dealer.email?.toLowerCase();

    // 1. Remove dealer record from in-memory db
    db.dealers.splice(idx, 1);

    // 2. Remove associated dealer account from db.users
    if (db.users) {
        db.users = db.users.filter((u: any) =>
            u.dealerId !== id &&
            !(dealerEmail && u.email?.toLowerCase() === dealerEmail && u.role === 'dealer')
        );
    }

    // 3. Revert assigned inquiries to 'new'
    if (db.inquiries) {
        for (const inq of db.inquiries) {
            if (inq.assignedDealerId === id) {
                inq.assignedDealerId = undefined;
                inq.assignedDealerName = undefined;
                inq.status = 'new';
                inq.updatedAt = new Date().toISOString();
                await persistWrite('inquiries', inq.id, inq);
            }
        }
    }

    // 4. Unassign dealer from customers
    if (db.customers) {
        for (const cust of db.customers) {
            let changed = false;
            if (cust.assignedDealers && cust.assignedDealers.some((ad: any) => ad.id === id)) {
                cust.assignedDealers = cust.assignedDealers.filter((ad: any) => ad.id !== id);
                cust.assignedDealerId = cust.assignedDealers.length > 0 ? cust.assignedDealers[0].id : '';
                cust.assignedDealerName = cust.assignedDealers.map((ad: any) => ad.name).join(', ');
                cust.status = cust.assignedDealers.length > 0 ? 'assigned' : 'new';
                changed = true;
            } else if (cust.assignedDealerId === id) {
                cust.assignedDealerId = '';
                cust.assignedDealerName = '';
                cust.status = 'new';
                cust.assignedDealers = [];
                changed = true;
            }
            if (changed) {
                cust.updatedAt = new Date().toISOString();
                await persistWrite('customers', cust.id, cust);
            }
        }
    }

    // 5. MongoDB cascades
    if (isMongoReady()) {
        const mongoDb = getMongoDb();
        try {
            await mongoDb.collection('dealers').deleteOne({ _id: id });
            await mongoDb.collection('Admin').deleteMany({
                $or: [
                    { dealerId: id },
                    ...(dealerEmail ? [{ email: dealerEmail, role: 'dealer' }] : [])
                ]
            });
            await mongoDb.collection('inquiries').updateMany(
                { assignedDealerId: id },
                { $set: { status: 'new', updatedAt: new Date().toISOString() }, $unset: { assignedDealerId: '', assignedDealerName: '' } }
            );
        } catch (err: any) {
            console.error('[Dealer Cascade Delete] MongoDB error:', err.message);
        }
    }

    return NextResponse.json({ success: true });
}
