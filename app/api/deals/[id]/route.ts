import { NextRequest, NextResponse } from 'next/server';
import { db, syncDatabaseOnBoot, persistWrite } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';

/**
 * PATCH /api/deals/[id]
 * Dealer: paymentStatus='paid'  → marks commission + fixed amount as paid to admin
 * Admin:  adminSettled=boolean  → verifies payment and marks deal as closed (or reverts)
 * Admin:  paymentStatus='pending' | 'paid' → updates payment state
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await syncDatabaseOnBoot();
  const user = getAuthUser(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id: dealId } = await params;
  const dealIdx = (db.deal_closures || []).findIndex((d: any) => d.id === dealId);
  if (dealIdx === -1) return NextResponse.json({ error: 'Deal not found' }, { status: 404 });

  const deal = { ...db.deal_closures[dealIdx] };

  if (user.role === 'dealer') {
    const dr =
      db.dealers.find((d: any) => d.email?.toLowerCase() === user.email?.toLowerCase()) ||
      db.dealers.find((d: any) => d.id === user.id || d._id === user.id);
    if (deal.dealerId !== (dr?.id || user.id))
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  } else if (user.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await req.json();
  const now = new Date().toISOString();

  const totalAdmin = deal.totalAdminDue ?? (
    (deal.commissionAmount || 0) + (deal.fixedAmount ?? deal.perCustomerAssignmentFee ?? 0)
  );

  let notifyAdmin = false;
  let notifyDealer = false;
  let dealerNotifMsg = '';

  if (user.role === 'dealer') {
    if (body.paymentStatus === 'paid') {
      deal.paymentStatus = 'paid';
      deal.dealStatus = 'paid_by_dealer';
      deal.paidAt = now;
      if (body.paidNotes) deal.paidNotes = body.paidNotes.trim();
      notifyAdmin = true;
    } else if (body.paymentStatus === 'pending') {
      deal.paymentStatus = 'pending';
      deal.dealStatus = 'pending_payment';
      deal.paidAt = null;
    }
  } else if (user.role === 'admin') {
    if (body.adminSettled === true || body.dealStatus === 'closed') {
      deal.adminSettled = true;
      deal.dealStatus = 'closed';
      deal.paymentStatus = 'paid';
      deal.settledAt = now;
      notifyDealer = true;
      dealerNotifMsg = `Admin verified your payment of ₹${totalAdmin.toLocaleString('en-IN')} (Commission + Fixed Amount) and marked deal #${dealId.slice(-6).toUpperCase()} as officially CLOSED.`;
    } else if (body.adminSettled === false) {
      deal.adminSettled = false;
      deal.settledAt = null;
      deal.dealStatus = deal.paymentStatus === 'paid' ? 'paid_by_dealer' : 'pending_payment';
    }

    if (body.paymentStatus === 'pending') {
      deal.paymentStatus = 'pending';
      deal.dealStatus = 'pending_payment';
      deal.adminSettled = false;
      deal.paidAt = null;
      deal.settledAt = null;
      notifyDealer = true;
      dealerNotifMsg = `Admin flagged payment for deal #${dealId.slice(-6).toUpperCase()} (${deal.customerName || 'customer'}) as UNPAID. Please verify payment or contact admin.`;
    } else if (body.paymentStatus === 'paid' && !deal.adminSettled) {
      deal.paymentStatus = 'paid';
      deal.dealStatus = 'paid_by_dealer';
      if (!deal.paidAt) deal.paidAt = now;
    }
  }

  deal.updatedAt = now;
  db.deal_closures[dealIdx] = deal;
  await persistWrite('deal_closures', dealId, deal);

  // Notify Admin when dealer marks as PAID
  if (notifyAdmin) {
    const notifId = `notif_paid_${dealId}_${Date.now()}`;
    const comm = deal.commissionAmount || 0;
    const fixed = deal.fixedAmount ?? deal.perCustomerAssignmentFee ?? 0;
    const notif = {
      id: notifId,
      type: 'commission_paid',
      dealId,
      dealerId: deal.dealerId,
      message: `${deal.dealerCompanyName || 'Dealer'} marked Commission (₹${comm.toLocaleString('en-IN')}) + Fixed (₹${fixed.toLocaleString('en-IN')}) = ₹${totalAdmin.toLocaleString('en-IN')} as PAID for ${deal.customerName || 'customer'}. Please verify and mark deal closed.`,
      isRead: false,
      createdAt: now,
    };
    db.notifications.push(notif);
    await persistWrite('notifications', notifId, notif);
  }

  // Notify Dealer when admin updates settlement / payment status
  if (notifyDealer && deal.dealerId) {
    const notifId = `notif_settle_${dealId}_${Date.now()}`;
    const notif = {
      id: notifId,
      type: deal.adminSettled ? 'deal_settled' : 'deal_payment_pending',
      dealId,
      dealerId: deal.dealerId,
      message: dealerNotifMsg,
      isRead: false,
      createdAt: now,
    };
    db.notifications.push(notif);
    await persistWrite('notifications', notifId, notif);
  }

  return NextResponse.json(deal);
}
