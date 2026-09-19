import { NextRequest, NextResponse } from 'next/server';
import { db, syncDatabaseOnBoot, isMongoReady, getMongoDb } from '@/lib/db';
import { getAuthUser, verifyToken } from '@/lib/auth';
import { normalizePhoneNumber } from '@/lib/phone';
import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';
import path from 'path';

// Helper to determine accurate MIME type
function getMimeType(fileName: string, providedType?: string): string {
  if (providedType && providedType !== 'application/octet-stream') {
    return providedType;
  }
  const ext = (fileName || '').split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'pdf': return 'application/pdf';
    case 'docx': return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    case 'doc': return 'application/msword';
    case 'xlsx': return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    case 'xls': return 'application/vnd.ms-excel';
    case 'pptx': return 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
    case 'ppt': return 'application/vnd.ms-powerpoint';
    case 'png': return 'image/png';
    case 'jpg':
    case 'jpeg': return 'image/jpeg';
    case 'webp': return 'image/webp';
    case 'gif': return 'image/gif';
    case 'svg': return 'image/svg+xml';
    case 'txt': return 'text/plain';
    case 'csv': return 'text/csv';
    case 'zip': return 'application/zip';
    default: return providedType || 'application/octet-stream';
  }
}

type Params = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: Params) {
  await syncDatabaseOnBoot();

  const { id: dealId } = await params;
  let deal = (db.deal_closures || []).find((d: any) => d.id === dealId);

  // If not in memory, query MongoDB directly
  if (!deal && isMongoReady()) {
    const mongoDb = getMongoDb();
    if (mongoDb) {
      try {
        const found = await mongoDb.collection('deal_closures').findOne({ _id: dealId });
        if (found) deal = found;
      } catch (err) {
        console.error('[Invoice API] Error loading deal from Mongo:', err);
      }
    }
  }

  if (!deal || (!deal.invoiceUrl && !deal.invoiceData && !deal.invoiceFilePath)) {
    return NextResponse.json({ error: 'Invoice document not found for this deal.' }, { status: 404 });
  }

  // Authorization: Supports Bearer header, cookie or ?token= for top-frame browser new tabs
  const url = new URL(req.url);
  let user = getAuthUser(req);
  if (!user) {
    const tokenQuery = url.searchParams.get('token');
    if (tokenQuery) {
      user = verifyToken(tokenQuery);
    }
  }

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized: Valid authentication token required to access invoice.' }, { status: 401 });
  }

  if (user.role === 'dealer') {
    const dealerRecord = db.dealers?.find((d: any) =>
      (d.email && user.email && d.email.toLowerCase() === user.email.toLowerCase()) ||
      d.id === user.id ||
      d.id === user.dealerId
    );
    const activeDealerId = dealerRecord?.id || user.dealerId || user.id;
    const isOwner = deal.dealerId === activeDealerId;
    if (!isOwner) {
      return NextResponse.json({ error: 'Forbidden: You cannot access another dealer\'s invoice.' }, { status: 403 });
    }
  } else if (user.role === 'customer') {
    const userPhone = user.phone ? normalizePhoneNumber(user.phone) : '';
    const userEmail = (user.email || '').toLowerCase().trim();
    const userId = user.id || user._id;

    const matchId = deal.customerId && (deal.customerId === userId);
    const matchPhone = userPhone && deal.customerPhone && (normalizePhoneNumber(deal.customerPhone) === userPhone);
    const matchEmail = userEmail && deal.customerEmail && (deal.customerEmail.toLowerCase().trim() === userEmail);
    const customerRecord = db.customers?.find((c: any) => c.id === deal.customerId);
    const matchRecordEmail = userEmail && customerRecord?.email && (customerRecord.email.toLowerCase().trim() === userEmail);
    const matchRecordPhone = userPhone && customerRecord?.phone && (normalizePhoneNumber(customerRecord.phone) === userPhone);

    const isCustomerOwner = matchId || matchPhone || matchEmail || matchRecordEmail || matchRecordPhone;
    if (!isCustomerOwner) {
      return NextResponse.json({ error: 'Forbidden: You cannot access another customer\'s invoice.' }, { status: 403 });
    }
  } else if (user.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden: Insufficient clearance.' }, { status: 403 });
  }

  const rawUrl = deal.invoiceData || deal.invoiceUrl || '';
  const fileName = deal.invoiceName || `Invoice_${deal.id}`;
  const mimeType = getMimeType(fileName, deal.invoiceType);
  const isView = url.searchParams.get('view') === '1';

  // For PDF, images, and text: inline view in browser tab
  const canPreviewInline = mimeType.startsWith('image/') || mimeType === 'application/pdf' || mimeType.startsWith('text/');
  const disposition = (isView && canPreviewInline) ? 'inline' : 'attachment';
  const safeFileName = encodeURIComponent(fileName).replace(/['()]/g, escape).replace(/\*/g, '%2A');

  const buildHeaders = (length: number) => ({
    'Content-Type': mimeType,
    'Content-Disposition': `${disposition}; filename="${fileName}"; filename*=UTF-8''${safeFileName}`,
    'Content-Length': String(length),
    'Cache-Control': 'public, max-age=86400',
  });

  // 1. Try reading from local disk if invoiceFilePath is set or if saved in public/uploads
  if (deal.invoiceFilePath && fs.existsSync(deal.invoiceFilePath)) {
    try {
      const buffer = await fs.promises.readFile(deal.invoiceFilePath);
      return new Response(buffer, { status: 200, headers: buildHeaders(buffer.length) });
    } catch (err) {
      console.warn('[Invoice API] Failed reading disk file:', err);
    }
  }

  const diskPath = path.join(process.cwd(), 'public', 'uploads', 'invoices', `${deal.id}_${fileName}`);
  if (fs.existsSync(diskPath)) {
    try {
      const buffer = await fs.promises.readFile(diskPath);
      return new Response(buffer, { status: 200, headers: buildHeaders(buffer.length) });
    } catch (err) {
      console.warn('[Invoice API] Failed reading public uploads:', err);
    }
  }

  // 2. Handle base64 Data URL
  if (rawUrl.startsWith('data:')) {
    try {
      const commaIdx = rawUrl.indexOf(',');
      const base64Data = commaIdx !== -1 ? rawUrl.slice(commaIdx + 1) : rawUrl;
      const buffer = Buffer.from(base64Data, 'base64');
      return new Response(buffer, { status: 200, headers: buildHeaders(buffer.length) });
    } catch (err: any) {
      console.error('[Invoice API] Failed decoding base64 data URL:', err.message);
    }
  }

  // 3. Handle Cloudinary URL (uses authenticated API download to bypass ACL restrictions)
  if (rawUrl.includes('cloudinary.com')) {
    try {
      const isRaw = rawUrl.includes('/raw/upload/');
      const resourceType = isRaw ? 'raw' : 'image';
      
      const uploadIdx = rawUrl.indexOf('/upload/');
      let afterUpload = rawUrl.substring(uploadIdx + 8);
      if (afterUpload.match(/^v\d+\//)) {
        afterUpload = afterUpload.replace(/^v\d+\//, '');
      }

      let publicId = afterUpload;
      let format = '';
      if (!isRaw && publicId.includes('.')) {
        const lastDot = publicId.lastIndexOf('.');
        format = publicId.substring(lastDot + 1);
        publicId = publicId.substring(0, lastDot);
      }

      const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
      const apiKey = process.env.CLOUDINARY_API_KEY;
      const apiSecret = process.env.CLOUDINARY_API_SECRET;

      if (cloudName && apiKey && apiSecret) {
        cloudinary.config({ cloud_name: cloudName, api_key: apiKey, api_secret: apiSecret });
        const downloadUrl = cloudinary.utils.private_download_url(publicId, format, {
          resource_type: resourceType,
          type: 'upload',
        });

        const cloudRes = await fetch(downloadUrl);
        if (cloudRes.ok) {
          const arrayBuf = await cloudRes.arrayBuffer();
          const buffer = Buffer.from(arrayBuf);
          return new Response(buffer, { status: 200, headers: buildHeaders(buffer.length) });
        }
      }

      // Fallback: direct fetch of rawUrl
      const directRes = await fetch(rawUrl);
      if (directRes.ok) {
        const arrayBuf = await directRes.arrayBuffer();
        const buffer = Buffer.from(arrayBuf);
        return new Response(buffer, { status: 200, headers: buildHeaders(buffer.length) });
      }
    } catch (err: any) {
      console.error('[Invoice API] Error fetching from Cloudinary:', err.message);
    }
  }

  return NextResponse.json({ error: 'Could not load invoice content.' }, { status: 500 });
}
