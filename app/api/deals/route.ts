import { NextRequest, NextResponse } from 'next/server';
import { db, syncDatabaseOnBoot, persistWrite } from '@/lib/db';
import { uploadToCloudinary } from '@/lib/cloudinary';
import { getAuthUser } from '@/lib/auth';
import { normalizePhoneNumber } from '@/lib/phone';
import fs from 'fs';
import path from 'path';

export async function GET(req: NextRequest) {
  await syncDatabaseOnBoot();

  const user = getAuthUser(req);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const url = new URL(req.url);
  const requestedDealerId = url.searchParams.get('dealerId');
  const requestedCustomerId = url.searchParams.get('customerId');

  let deals = db.deal_closures || [];

  if (user.role === 'customer') {
    // IDOR Protection: Customers can strictly only query their own records
    const userId = user.id || user._id;
    if (requestedCustomerId && requestedCustomerId !== userId && requestedCustomerId !== user.customerId) {
      return NextResponse.json({ error: 'Forbidden: You cannot access another customer\'s orders or deals.' }, { status: 403 });
    }

    const userPhone = user.phone ? normalizePhoneNumber(user.phone) : '';
    const userEmail = (user.email || '').toLowerCase().trim();

    deals = deals.filter((d: any) => {
      const matchId = d.customerId && (d.customerId === userId);
      const matchPhone = userPhone && d.customerPhone && (normalizePhoneNumber(d.customerPhone) === userPhone);
      const matchEmail = userEmail && d.customerEmail && (d.customerEmail.toLowerCase().trim() === userEmail);
      const customerRecord = db.customers?.find((c: any) => c.id === d.customerId);
      const matchRecordEmail = userEmail && customerRecord?.email && (customerRecord.email.toLowerCase().trim() === userEmail);
      const matchRecordPhone = userPhone && customerRecord?.phone && (normalizePhoneNumber(customerRecord.phone) === userPhone);
      return matchId || matchPhone || matchEmail || matchRecordEmail || matchRecordPhone;
    });
  } else if (user.role === 'dealer') {
    // Dealers can only see their own deals
    const dealerRecord = db.dealers.find((d: any) => d.email?.toLowerCase() === user.email?.toLowerCase()) ||
      db.dealers.find((d: any) => d.id === user.id || d._id === user.id);
    const activeDealerId = dealerRecord?.id || user.dealerId || user.id;

    deals = deals.filter((d: any) => d.dealerId === activeDealerId);
  } else if (user.role === 'admin') {
    // Admins can filter by dealerId or customerId, or view all
    if (requestedDealerId) {
      deals = deals.filter((d: any) => d.dealerId === requestedDealerId);
    }
    if (requestedCustomerId) {
      deals = deals.filter((d: any) => d.customerId === requestedCustomerId);
    }
  } else {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Sort by closedAt descending
  deals = [...deals].sort((a: any, b: any) =>
    new Date(b.closedAt || b.createdAt).getTime() - new Date(a.closedAt || a.createdAt).getTime()
  );

  // Attach dealer & customer info
  const enriched = deals.map((deal: any) => {
    const dealer = db.dealers.find((d: any) => d.id === deal.dealerId || d._id === deal.dealerId);
    const customer = db.customers.find((c: any) => c.id === deal.customerId || c._id === deal.customerId);
    const commPct = (deal.commissionPercentage !== undefined && deal.commissionPercentage !== null && deal.commissionPercentage > 0)
      ? deal.commissionPercentage
      : (dealer?.commissionPercentage || 0);
    const commAmt = (deal.commissionAmount !== undefined && deal.commissionAmount !== null && deal.commissionAmount > 0)
      ? deal.commissionAmount
      : (commPct > 0 && deal.closedAmount ? parseFloat(((deal.closedAmount * commPct) / 100).toFixed(2)) : 0);
    const fixedAmt = (deal.fixedAmount !== undefined && deal.fixedAmount !== null)
      ? deal.fixedAmount
      : (deal.perCustomerAssignmentFee ?? dealer?.perCustomerAssignmentFee ?? 0);
    const totalAdminDue = deal.totalAdminDue ?? parseFloat((commAmt + fixedAmt).toFixed(2));
    const isClosed = Boolean(deal.adminSettled);
    const isPaid = deal.paymentStatus === 'paid' || isClosed;
    const dealStatus = isClosed ? 'closed' : (isPaid ? 'paid_by_dealer' : 'pending_payment');

    return {
      ...deal,
      commissionPercentage: commPct,
      commissionAmount: commAmt,
      fixedAmount: fixedAmt,
      perCustomerAssignmentFee: fixedAmt,
      totalAdminDue,
      paymentStatus: isPaid ? 'paid' : (deal.paymentStatus || 'pending'),
      adminSettled: isClosed,
      dealStatus,
      paidAt: deal.paidAt || (isClosed ? (deal.settledAt || deal.closedAt) : undefined),
      settledAt: deal.settledAt || (isClosed ? deal.closedAt : undefined),
      dealerCompanyName: dealer?.companyName || deal.dealerCompanyName || 'Authorized Dealer',
      dealerPhone: dealer?.phone || deal.dealerPhone || '',
      dealerEmail: dealer?.email || deal.dealerEmail || '',
      customerName: customer?.name || deal.customerName || 'Customer',
      customerPhone: customer?.phone || deal.customerPhone || '',
      customerEmail: customer?.email || deal.customerEmail || '',
      productTitle: deal.productTitle || deal.productCategory || 'Power System',
      productType: deal.productType || deal.productCategory || 'General',
      description: deal.description || deal.notes || '',
      invoiceNumber: deal.invoiceNumber || '',
      invoiceUrl: (deal.invoiceUrl || deal.invoiceData || deal.invoiceFilePath) ? `/api/deals/${deal.id}/invoice` : '',
      invoiceName: deal.invoiceName || '',
      invoiceType: deal.invoiceType || '',
      invoiceSize: deal.invoiceSize || 0,
    };
  });

  return NextResponse.json(enriched);
}

export async function POST(req: NextRequest) {
  await syncDatabaseOnBoot();

  const user = getAuthUser(req);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (user.role !== 'dealer' && user.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden: Only dealers and admins can close deals.' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const {
      dealerId: reqDealerId,
      customerId,
      closedAmount,
      productTitle,
      description,
      productType,
      productCategory,
      notes,
      invoiceNumber,
      invoiceUrl,
      invoiceName,
      invoiceType,
      invoiceSize
    } = body;

    // Resolve dealer
    let dealerId = reqDealerId;
    if (user.role === 'dealer') {
      const currentDealer = db.dealers.find((d: any) => d.email?.toLowerCase() === user.email?.toLowerCase()) ||
        db.dealers.find((d: any) => d.id === user.id || d._id === user.id);
      if (currentDealer) {
        dealerId = currentDealer.id || currentDealer._id;
      }
    }

    if (!dealerId || !customerId || !closedAmount) {
      return NextResponse.json(
        { error: 'dealerId, customerId, and closedAmount are required.' },
        { status: 400 }
      );
    }

    const dealer = db.dealers.find((d: any) => d.id === dealerId || d._id === dealerId || (d.email && user.email && d.email.toLowerCase() === user.email.toLowerCase()));
    const customer = db.customers.find((c: any) => c.id === customerId || c._id === customerId);

    if (!dealer) {
      return NextResponse.json({ error: 'Dealer not found.' }, { status: 404 });
    }

    if (!customer) {
      return NextResponse.json({ error: 'Customer not found.' }, { status: 404 });
    }

    // Security Check: Dealers can only close deals for customers assigned to them
    if (user.role === 'dealer') {
      const isAssigned = customer.assignedDealerId === dealerId ||
        customer.assignedDealerId === dealer.id ||
        customer.assignedDealerId === dealer._id ||
        (customer.assignedDealers && customer.assignedDealers.some((ad: any) => ad.id === dealerId || ad.id === dealer.id || ad.id === dealer._id));
      if (!isAssigned) {
        return NextResponse.json(
          { error: 'Forbidden: You are not assigned to close deals for this customer.' },
          { status: 403 }
        );
      }
    }

    const parsedAmount = parseFloat(closedAmount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return NextResponse.json(
        { error: 'closedAmount must be a valid positive number.' },
        { status: 400 }
      );
    }

    const commissionPercentage = dealer.commissionPercentage || 0;
    const commissionAmount = parseFloat(((parsedAmount * commissionPercentage) / 100).toFixed(2));
    const perCustomerAssignmentFee = dealer.perCustomerAssignmentFee || 0;

    const dealId = `deal_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const now = new Date().toISOString();

    const resolvedProductType = productType || productCategory || customer?.category || 'General';
    const resolvedProductTitle = (productTitle && productTitle.trim()) || resolvedProductType;
    const resolvedDescription = (description !== undefined ? description : notes) || '';

    // Handle invoice document upload (Local file disk save + Cloudinary backup + DB fallback)
    let finalInvoiceUrl = invoiceUrl || '';
    let invoiceFilePath = '';
    let cloudinaryUrl = '';

    if (finalInvoiceUrl && finalInvoiceUrl.startsWith('data:')) {
      const safeName = (invoiceName || 'invoice').replace(/[^a-zA-Z0-9._-]/g, '_');

      // 1. Save to local disk in public/uploads/invoices/
      try {
        const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'invoices');
        if (!fs.existsSync(uploadsDir)) {
          fs.mkdirSync(uploadsDir, { recursive: true });
        }
        const diskFile = path.join(uploadsDir, `${dealId}_${safeName}`);
        const commaIdx = finalInvoiceUrl.indexOf(',');
        const base64Data = commaIdx !== -1 ? finalInvoiceUrl.slice(commaIdx + 1) : finalInvoiceUrl;
        fs.writeFileSync(diskFile, Buffer.from(base64Data, 'base64'));
        invoiceFilePath = diskFile;
      } catch (diskErr) {
        console.warn('[Deals] Failed writing invoice to disk:', diskErr);
      }

      // 2. Also attempt Cloudinary upload as backup
      try {
        const isDoc = /\.(docx?|xlsx?|pdf|pptx?|txt|csv|zip)$/i.test(safeName);
        const resourceType = isDoc && !/\.(png|jpe?g|webp|gif)$/i.test(safeName) && !safeName.endsWith('.pdf') ? 'raw' : 'auto';
        const uploadedUrl = await uploadToCloudinary(finalInvoiceUrl, `${dealId}_${safeName}`, { resourceType });
        if (uploadedUrl && uploadedUrl.startsWith('http')) {
          cloudinaryUrl = uploadedUrl;
        }
      } catch (uploadErr) {
        console.warn('[Deals] Cloudinary upload skipped:', uploadErr);
      }
    }

    const fixedAmount = dealer.perCustomerAssignmentFee || 0;
    const totalAdminDue = parseFloat((commissionAmount + fixedAmount).toFixed(2));

    const newDeal = {
      id: dealId,
      dealerId: dealer.id || dealerId,
      dealerCompanyName: dealer.companyName || dealer.name || '',
      dealerPhone: dealer.phone || '',
      dealerEmail: dealer.email || '',
      customerId,
      customerName: customer?.name || '',
      customerPhone: customer?.phone || '',
      customerEmail: customer?.email || '',
      closedAmount: parsedAmount,
      commissionPercentage,
      commissionAmount,
      fixedAmount,
      perCustomerAssignmentFee: fixedAmount,
      totalAdminDue,
      paymentStatus: 'pending',
      adminSettled: false,
      dealStatus: 'pending_payment',
      productTitle: resolvedProductTitle,
      productType: resolvedProductType,
      productCategory: resolvedProductType,
      description: resolvedDescription,
      notes: resolvedDescription,
      invoiceNumber: (typeof invoiceNumber === 'string') ? invoiceNumber.trim() : '',
      invoiceUrl: finalInvoiceUrl ? `/api/deals/${dealId}/invoice` : '',
      invoiceData: finalInvoiceUrl,
      invoiceFilePath,
      cloudinaryUrl,
      invoiceName: invoiceName || (finalInvoiceUrl ? 'invoice_document' : ''),
      invoiceType: invoiceType || '',
      invoiceSize: invoiceSize || 0,
      closedAt: now,
      createdAt: now,
    };

    if (!db.deal_closures) db.deal_closures = [];
    db.deal_closures.push(newDeal);
    await persistWrite('deal_closures', dealId, newDeal);

    // Update customer status to completed, and sync invoice number and purchase date
    const custIdx = db.customers.findIndex((c: any) => c.id === customerId);
    if (custIdx !== -1) {
      db.customers[custIdx].status = 'completed';
      if (invoiceNumber && typeof invoiceNumber === 'string' && invoiceNumber.trim()) {
        const trimmedInv = invoiceNumber.trim();
        db.customers[custIdx].invoiceNumber = trimmedInv;
        const currentInvoices = Array.isArray(db.customers[custIdx].invoiceNumbers) ? db.customers[custIdx].invoiceNumbers : [];
        if (!currentInvoices.includes(trimmedInv)) {
          db.customers[custIdx].invoiceNumbers = [...currentInvoices, trimmedInv];
        }
      }
      db.customers[custIdx].purchaseDate = now;
      db.customers[custIdx].updatedAt = now;
      await persistWrite('customers', customerId, db.customers[custIdx]);
    }

    // Synchronize linked inquiry status to completed
    if (db.inquiries) {
      const inqIdx = db.inquiries.findIndex((i: any) =>
        i.linkedCustomerId === customerId ||
        (customer?.linkedInquiryId && i.id === customer.linkedInquiryId) ||
        (customer?.phone && i.phone === customer.phone) ||
        (customer?.email && i.email?.toLowerCase() === customer.email.toLowerCase())
      );
      if (inqIdx !== -1) {
        db.inquiries[inqIdx].status = 'completed';
        await persistWrite('inquiries', db.inquiries[inqIdx].id, db.inquiries[inqIdx]);
      }
    }

    // Notify admin with commission and fixed amount breakdown
    const notifId = `notif_deal_${dealId}`;
    const notif = {
      id: notifId,
      type: 'deal_closed',
      dealerId,
      message: `${dealer.companyName || dealer.name} closed a deal: ${resolvedProductTitle} (${resolvedProductType}) for ₹${parsedAmount.toLocaleString('en-IN')} (${customer?.name || customerId}). Admin share: Commission ₹${commissionAmount.toLocaleString('en-IN')} (${commissionPercentage}%) + Fixed ₹${fixedAmount.toLocaleString('en-IN')} = ₹${totalAdminDue.toLocaleString('en-IN')} (Pending payment).`,
      isRead: false,
      createdAt: now,
    };
    db.notifications.push(notif);
    await persistWrite('notifications', notifId, notif);

    // Notify customer in customer dashboard notifications
    if (customer?.email) {
      const custNotifId = `notif_cust_deal_${dealId}`;
      const custNotif = {
        id: custNotifId,
        type: 'deal_closed',
        customerEmail: customer.email.toLowerCase().trim(),
        customerId,
        dealerId,
        message: `Your order for ${resolvedProductTitle} has been confirmed & completed by ${dealer.companyName || dealer.name}. Invoice #${newDeal.invoiceNumber || dealId.slice(-6).toUpperCase()} is available in your profile.`,
        isRead: false,
        createdAt: now,
      };
      db.notifications.push(custNotif);
      await persistWrite('notifications', custNotifId, custNotif);
    }

    return NextResponse.json(newDeal, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
