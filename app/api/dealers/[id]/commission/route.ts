/**
 * app/api/dealers/[id]/commission/route.ts
 * Admin: get or update any dealer's commission settings and view their deal closure history.
 * Dealer: view their own commission settings and deal closure history.
 */

import { NextRequest, NextResponse } from 'next/server';
import { db, syncDatabaseOnBoot, persistWrite } from '@/lib/db';
import { requireAuth, requireRole } from '@/lib/auth';

type Params = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: Params) {
  await syncDatabaseOnBoot();

  const authResult = requireAuth(req);
  if (authResult instanceof NextResponse) return authResult;
  const { user } = authResult;

  // Authorization: Only admin or dealers can access commission endpoints
  if (user.role !== 'admin' && user.role !== 'dealer') {
    return NextResponse.json({ error: 'Forbidden: Insufficient permissions.' }, { status: 403 });
  }

  const { id: dealerId } = await params;
  const dealer = db.dealers.find((d: any) => d.id === dealerId || d._id === dealerId);
  if (!dealer) {
    return NextResponse.json({ error: 'Dealer not found.' }, { status: 404 });
  }

  // Authorization: Only admin or the specific dealer themselves can view this financial data
  if (user.role === 'dealer' && dealer.email.toLowerCase() !== user.email.toLowerCase()) {
    return NextResponse.json({ error: 'Forbidden: You cannot view another dealer\'s commission records.' }, { status: 403 });
  }

  const resolvedDealerId = dealer.id || dealer._id || dealerId;

  // Get all closed deals for this dealer
  const rawDeals = (db.deal_closures || []).filter((d: any) => d.dealerId === dealerId || d.dealerId === resolvedDealerId);
  const deals = rawDeals.map((d: any) => {
    const commPct = (d.commissionPercentage !== undefined && d.commissionPercentage !== null && d.commissionPercentage > 0)
      ? d.commissionPercentage
      : (dealer.commissionPercentage || 0);
    const commAmt = (d.commissionAmount !== undefined && d.commissionAmount !== null && d.commissionAmount > 0)
      ? d.commissionAmount
      : (commPct > 0 && d.closedAmount ? parseFloat(((d.closedAmount * commPct) / 100).toFixed(2)) : 0);
    return {
      ...d,
      commissionPercentage: commPct,
      commissionAmount: commAmt,
      perCustomerAssignmentFee: d.perCustomerAssignmentFee ?? dealer.perCustomerAssignmentFee ?? 0,
    };
  });

  const totalDeals = deals.length;
  const totalClosedAmount = deals.reduce((acc: number, d: any) => acc + (d.closedAmount || 0), 0);
  const totalCommissionEarned = deals.reduce((acc: number, d: any) => acc + (d.commissionAmount || 0), 0);
  const totalAssignedCustomers = db.customers.filter((c: any) =>
    c.assignedDealerId === dealerId ||
    c.assignedDealerId === resolvedDealerId ||
    (c.assignedDealers || []).some((ad: any) => ad.id === dealerId || ad.id === resolvedDealerId)
  ).length;
  const perCustomerFeeTotal = totalAssignedCustomers * (dealer.perCustomerAssignmentFee || 0);

  return NextResponse.json({
    dealerId: resolvedDealerId,
    companyName: dealer.companyName,
    commissionPercentage: dealer.commissionPercentage || 0,
    perCustomerAssignmentFee: dealer.perCustomerAssignmentFee || 0,
    totalDeals,
    totalClosedAmount,
    totalCommissionEarned,
    totalAssignedCustomers,
    perCustomerFeeTotal,
    totalAmountOwed: totalCommissionEarned + perCustomerFeeTotal,
    deals: [...deals].sort((a: any, b: any) =>
      new Date(b.closedAt || b.createdAt).getTime() - new Date(a.closedAt || a.createdAt).getTime()
    ),
  });
}

export async function PATCH(req: NextRequest, { params }: Params) {
  await syncDatabaseOnBoot();

  // Enforce admin-only access for modifying financial commission settings
  const authResult = requireRole(req, ['admin']);
  if (authResult instanceof NextResponse) return authResult;

  const { id: dealerId } = await params;
  const dealerIdx = db.dealers.findIndex((d: any) => d.id === dealerId || d._id === dealerId);
  if (dealerIdx === -1) {
    return NextResponse.json({ error: 'Dealer not found.' }, { status: 404 });
  }

  try {
    const body = await req.json();
    const { commissionPercentage, perCustomerAssignmentFee } = body;

    if (commissionPercentage !== undefined) {
      const parsed = parseFloat(commissionPercentage);
      if (isNaN(parsed) || parsed < 0 || parsed > 100) {
        return NextResponse.json({ error: 'commissionPercentage must be a valid number between 0 and 100.' }, { status: 400 });
      }
      db.dealers[dealerIdx].commissionPercentage = parsed;
    }
    if (perCustomerAssignmentFee !== undefined) {
      const parsed = parseFloat(perCustomerAssignmentFee);
      if (isNaN(parsed) || parsed < 0) {
        return NextResponse.json({ error: 'perCustomerAssignmentFee must be a non-negative number.' }, { status: 400 });
      }
      db.dealers[dealerIdx].perCustomerAssignmentFee = parsed;
    }

    const targetDealerId = db.dealers[dealerIdx].id || db.dealers[dealerIdx]._id || dealerId;
    await persistWrite('dealers', targetDealerId, db.dealers[dealerIdx]);

    // Sync rates to users collection for immediate login token consistency
    const userIdx = db.users.findIndex((u: any) =>
      u.dealerId === dealerId || u.dealerId === targetDealerId || u.id === dealerId || u._id === dealerId ||
      (u.email && db.dealers[dealerIdx].email && u.email.toLowerCase() === db.dealers[dealerIdx].email.toLowerCase())
    );
    if (userIdx !== -1) {
      db.users[userIdx].commissionPercentage = db.dealers[dealerIdx].commissionPercentage;
      db.users[userIdx].perCustomerAssignmentFee = db.dealers[dealerIdx].perCustomerAssignmentFee;
      const userDocId = db.users[userIdx].id || db.users[userIdx]._id;
      await persistWrite('users', userDocId, db.users[userIdx]);
    }

    // Refresh past closed deals for this dealer that had 0 commission recorded
    if (db.deal_closures && Array.isArray(db.deal_closures)) {
      for (let i = 0; i < db.deal_closures.length; i++) {
        const deal = db.deal_closures[i];
        if (deal.dealerId === dealerId || deal.dealerId === targetDealerId) {
          deal.perCustomerAssignmentFee = db.dealers[dealerIdx].perCustomerAssignmentFee;
          if ((!deal.commissionPercentage || deal.commissionAmount === 0) && db.dealers[dealerIdx].commissionPercentage) {
            deal.commissionPercentage = db.dealers[dealerIdx].commissionPercentage;
            deal.commissionAmount = parseFloat((((deal.closedAmount || 0) * deal.commissionPercentage) / 100).toFixed(2));
            await persistWrite('deal_closures', deal.id || deal._id, deal);
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      commissionPercentage: db.dealers[dealerIdx].commissionPercentage,
      perCustomerAssignmentFee: db.dealers[dealerIdx].perCustomerAssignmentFee,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}

