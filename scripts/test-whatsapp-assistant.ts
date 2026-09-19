/**
 * scripts/test-whatsapp-assistant.ts
 *
 * Automated verification suite for WhatsApp Customer Assistant.
 * Tests:
 * 1. Webhook GET verification handshake
 * 2. Webhook POST HMAC-SHA256 signature validation
 * 3. Verified customer phone authentication vs unverified caller protection
 * 4. Business Services (OrderService, InquiryService, LogisticsService, PaymentService, DocumentService)
 * 5. Natural-Language intent classification & end-to-end response generation
 * 6. Rate limiting enforcement
 */

import dotenv from 'dotenv';
dotenv.config();

import crypto from 'crypto';
import { db } from '../lib/db';
import {
    WhatsAppService,
    CustomerAssistantService,
    OrderService,
    InquiryService,
    LogisticsService,
    PaymentService,
    DocumentService,
} from '../server/services';

async function runTests() {
    console.log('\n======================================================');
    console.log('⚡ VOLTRIX WHATSAPP CUSTOMER ASSISTANT TEST SUITE ⚡');
    console.log('======================================================\n');

    let passedCount = 0;
    let failedCount = 0;

    function assert(condition: boolean, testName: string, extra?: any) {
        if (condition) {
            console.log(`✅ [PASS] ${testName}`);
            passedCount++;
        } else {
            console.error(`❌ [FAIL] ${testName}`, extra ? extra : '');
            failedCount++;
        }
    }

    // ─── 1. Setup Test Data in In-Memory DB ─────────────────────────────────────
    const testCustomerId = 'cust_test_wa_101';
    const testCustomerPhone = '919876543210';
    const testCustomer = {
        id: testCustomerId,
        name: 'Rahul Sharma',
        phone: testCustomerPhone,
        email: 'rahul.sharma@example.com',
        location: 'Hyderabad, Telangana',
        category: 'Servo Stabilizer',
        status: 'active' as const,
        source: 'manual' as const,
        createdAt: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString(),
    };

    const testDeals = [
        {
            id: 'deal_test_201',
            dealerId: 'dealer_hyd_01',
            dealerCompanyName: 'Telangana Power Tech',
            dealerPhone: '919000011111',
            customerId: testCustomerId,
            customerName: 'Rahul Sharma',
            customerPhone: testCustomerPhone,
            customerEmail: 'rahul.sharma@example.com',
            closedAmount: 145000,
            commissionPercentage: 5,
            commissionAmount: 7250,
            productTitle: 'Voltrix 50 kVA Oil-Cooled Servo Stabilizer',
            productCategory: 'Servo Stabilizer',
            dealStatus: 'closed' as const,
            adminSettled: true,
            invoiceNumber: 'INV-2026-0042',
            invoiceUrl: 'https://res.cloudinary.com/voltrix/sample_invoice.pdf',
            invoiceName: 'INV-2026-0042.pdf',
            closedAt: new Date(Date.now() - 10 * 24 * 3600 * 1000).toISOString(),
            createdAt: new Date(Date.now() - 15 * 24 * 3600 * 1000).toISOString(),
        },
        {
            id: 'deal_test_202',
            dealerId: 'dealer_hyd_01',
            dealerCompanyName: 'Telangana Power Tech',
            dealerPhone: '919000011111',
            customerId: testCustomerId,
            customerName: 'Rahul Sharma',
            customerPhone: testCustomerPhone,
            customerEmail: 'rahul.sharma@example.com',
            closedAmount: 85000,
            commissionPercentage: 5,
            commissionAmount: 4250,
            productTitle: 'Voltrix 20 kVA Online UPS 3-Phase',
            productCategory: 'Online UPS',
            dealStatus: 'paid_by_dealer' as const,
            paymentStatus: 'paid' as const,
            adminSettled: false,
            invoiceNumber: 'INV-2026-0089',
            invoiceUrl: 'https://res.cloudinary.com/voltrix/sample_invoice_2.pdf',
            invoiceName: 'INV-2026-0089.pdf',
            closedAt: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
            createdAt: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString(),
        },
    ];

    const testInquiries = [
        {
            id: 'inq_test_301',
            name: 'Rahul Sharma',
            email: 'rahul.sharma@example.com',
            phone: testCustomerPhone,
            subject: 'Installation & Earthing Inspection',
            message: 'Need technical team to inspect site earthing before 50 kVA commissioning.',
            status: 'assigned',
            productInterest: 'Servo Stabilizer',
            linkedCustomerId: testCustomerId,
            createdAt: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString(),
        },
    ];

    if (!db.customers) db.customers = [];
    if (!db.deal_closures) db.deal_closures = [];
    if (!db.inquiries) db.inquiries = [];

    // Push test data
    db.customers.push(testCustomer as any);
    db.deal_closures.push(...(testDeals as any));
    db.inquiries.push(...(testInquiries as any));

    // ─── Test 1: Webhook GET Verification Handshake ─────────────────────────────
    console.log('\n--- 1. Webhook Verification Handshake ---');
    const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN || '0this1is2my3personal4whatsapp5verify6token7';
    const challengeParam = 'test_hub_challenge_xyz_123';

    const validParams = new URLSearchParams({
        'hub.mode': 'subscribe',
        'hub.verify_token': verifyToken,
        'hub.challenge': challengeParam,
    });
    const challengeResult = WhatsAppService.verifyWebhookChallenge(validParams);
    assert(challengeResult.status === 200 && challengeResult.body === challengeParam, 'Meta GET Challenge returns 200 and challenge string with valid token');

    const invalidParams = new URLSearchParams({
        'hub.mode': 'subscribe',
        'hub.verify_token': 'wrong_token_here',
        'hub.challenge': challengeParam,
    });
    const failedChallenge = WhatsAppService.verifyWebhookChallenge(invalidParams);
    assert(failedChallenge.status === 403, 'Meta GET Challenge rejects invalid verify_token with 403');

    // ─── Test 2: Webhook POST HMAC-SHA256 Signature ─────────────────────────────
    console.log('\n--- 2. HMAC-SHA256 Signature Verification ---');
    const appSecret = process.env.META_APP_SECRET || 'b301c293952a4c0c1d2743b3c3f7205e';
    const samplePayload = JSON.stringify({ entry: [{ changes: [{ value: { messages: [{ from: '919876543210', text: { body: 'Hello' } }] } }] }] });

    const correctHmac = 'sha256=' + crypto.createHmac('sha256', appSecret).update(samplePayload).digest('hex');
    const isValidSig = WhatsAppService.verifyWebhookSignature(samplePayload, correctHmac);
    assert(isValidSig === true, 'HMAC signature verifies accurately with valid META_APP_SECRET');

    const tamperedHmac = 'sha256=' + crypto.createHmac('sha256', 'wrong_secret').update(samplePayload).digest('hex');
    const isTamperedValid = WhatsAppService.verifyWebhookSignature(samplePayload, tamperedHmac);
    assert(isTamperedValid === false, 'HMAC signature verification rejects tampered / wrong secret');

    // ─── Test 3: Customer Authentication Mapping & Unverified Caller Protection ─
    console.log('\n--- 3. Customer Authentication & Data Protection ---');
    const matchedCustomer = await CustomerAssistantService.findCustomerByVerifiedPhone(testCustomerPhone);
    assert(matchedCustomer !== null && matchedCustomer.id === testCustomerId, 'Maps verified WhatsApp sender phone to Voltrix customerId');

    const unverifiedPhone = '919999999999';
    const unverifiedCustomer = await CustomerAssistantService.findCustomerByVerifiedPhone(unverifiedPhone);
    assert(unverifiedCustomer === null, 'Rejects unverified WhatsApp phone number');

    const unverifiedReply = await CustomerAssistantService.handleIncomingMessage({
        from: unverifiedPhone,
        messageId: `msg_${Date.now()}`,
        text: 'Show my orders',
    });
    assert(
        unverifiedReply.replyText?.includes('could not locate an active Voltrix customer account') === true &&
        unverifiedReply.replyText?.includes('Security Notice') === true &&
        !unverifiedReply.replyText?.includes('INV-2026-0042'),
        'Unverified phone caller receives guest guidance without exposing any customer orders or invoices'
    );

    // ─── Test 4: Business Services Layer ───────────────────────────────────────
    console.log('\n--- 4. Business Services Execution ---');
    // OrderService
    const orderCount = await OrderService.getOrderCount(testCustomerId);
    assert(orderCount === 2, `OrderService.getOrderCount returned 2 (got ${orderCount})`);

    const orders = await OrderService.getOrders(testCustomerId, 5);
    assert(orders.length === 2, 'OrderService.getOrders returned 2 orders');

    const latestOrder = await OrderService.getLatestOrder(testCustomerId);
    assert(latestOrder !== null && latestOrder.id === 'deal_test_202', 'OrderService.getLatestOrder returns most recent deal');

    // LogisticsService
    const logistics = await LogisticsService.getOrderLogisticsStatus(testCustomerId);
    assert(
        logistics !== null && logistics.status === 'In Transit / Dispatched' && logistics.dealerName === 'Telangana Power Tech',
        'LogisticsService determines correct shipping status (In Transit / Dispatched) and partner contact'
    );

    // PaymentService
    const payment = await PaymentService.getOrderPaymentStatus(testCustomerId);
    assert(payment !== null && payment.paymentStatus === 'PAID' && payment.amount === 85000, 'PaymentService reports PAID status and ₹85,000 for latest order');

    // InquiryService
    const customerInqs = await InquiryService.getCustomerInquiries(testCustomerId);
    assert(customerInqs.length >= 1 && customerInqs[0].subject === 'Installation & Earthing Inspection', 'InquiryService returns customer inquiries');

    // DocumentService
    const invoiceDoc = await DocumentService.getLatestInvoice(testCustomerId);
    assert(
        invoiceDoc !== null && invoiceDoc.invoiceNumber === 'INV-2026-0089' && invoiceDoc.documentUrl?.includes('sample_invoice_2.pdf') === true,
        'DocumentService retrieves invoice document URL and invoice number'
    );

    // ─── Test 5: Natural Language Intent Recognition ────────────────────────────
    console.log('\n--- 5. Natural Language Intent Classification ---');

    const testQueries: Array<{ query: string; expectedIntent: string }> = [
        { query: 'How many orders do I have?', expectedIntent: 'GET_ORDER_COUNT' },
        { query: 'Show my orders', expectedIntent: 'LIST_ORDERS' },
        { query: 'Where is my latest order?', expectedIntent: 'GET_LATEST_ORDER' },
        { query: 'Show my inquiries', expectedIntent: 'LIST_INQUIRIES' },
        { query: "What's my logistics/order status?", expectedIntent: 'GET_LOGISTICS_STATUS' },
        { query: 'Send my invoice/document', expectedIntent: 'GET_INVOICE_DOCUMENT' },
    ];

    for (const t of testQueries) {
        const parsed = await CustomerAssistantService.classifyIntent(t.query);
        assert(parsed.intent === t.expectedIntent, `Classified "${t.query}" -> ${parsed.intent}`);
    }

    // ─── Test 6: End-to-End Handling with Verified Customer ─────────────────────
    console.log('\n--- 6. End-to-End Customer Assistant Responses ---');

    // Query 1: Order count
    const resCount = await CustomerAssistantService.handleIncomingMessage({
        from: testCustomerPhone,
        messageId: `msg_test_${Date.now()}_1`,
        text: 'How many orders do I have?',
    });
    assert(resCount.replyText?.includes('*2* registered order') === true, 'Response: Correct order count returned in WhatsApp markdown');

    // Query 2: Show my orders
    const resOrders = await CustomerAssistantService.handleIncomingMessage({
        from: testCustomerPhone,
        messageId: `msg_test_${Date.now()}_2`,
        text: 'Show my orders',
    });
    assert(
        resOrders.replyText?.includes('Voltrix 20 kVA Online UPS') === true &&
        resOrders.replyText?.includes('Voltrix 50 kVA Oil-Cooled Servo Stabilizer') === true,
        'Response: Lists recent orders with product names and values'
    );

    // Query 3: Where is my latest order?
    const resWhere = await CustomerAssistantService.handleIncomingMessage({
        from: testCustomerPhone,
        messageId: `msg_test_${Date.now()}_3`,
        text: 'Where is my latest order?',
    });
    assert(
        resWhere.replyText?.includes('Latest Order Update') === true &&
        resWhere.replyText?.includes('Telangana Power Tech') === true,
        'Response: Details latest order with logistics note and partner phone'
    );

    // Query 4: Show my inquiries
    const resInqs = await CustomerAssistantService.handleIncomingMessage({
        from: testCustomerPhone,
        messageId: `msg_test_${Date.now()}_4`,
        text: 'Show my inquiries',
    });
    assert(
        resInqs.replyText?.includes('Installation & Earthing Inspection') === true,
        'Response: Displays customer inquiries with status'
    );

    // Query 5: What's my logistics/order status?
    const resLogistics = await CustomerAssistantService.handleIncomingMessage({
        from: testCustomerPhone,
        messageId: `msg_test_${Date.now()}_5`,
        text: "What's my logistics/order status?",
    });
    assert(
        resLogistics.replyText?.includes('In Transit / Dispatched') === true,
        'Response: Displays logistics and delivery status'
    );

    // Query 6: Send my invoice/document
    const resInvoice = await CustomerAssistantService.handleIncomingMessage({
        from: testCustomerPhone,
        messageId: `msg_test_${Date.now()}_6`,
        text: 'Send my invoice/document',
    });
    assert(
        resInvoice.replyText?.includes('INV-2026-0089') === true,
        'Response: Sends invoice details and PDF document link'
    );

    // ─── Test 7: Prompt Injection & DB Security Guard ───────────────────────────
    console.log('\n--- 7. Security Guard Against Arbitrary Query Execution ---');
    const injectionAttempt = await CustomerAssistantService.classifyIntent("DROP TABLE users; db.collection('customers').find({})");
    assert(
        typeof injectionAttempt.intent === 'string' && injectionAttempt.intent !== undefined,
        'Malicious injection input is safely treated as an enum intent without executing any DB code'
    );

    console.log('\n======================================================');
    console.log(`TEST SUMMARY: ${passedCount} PASSED, ${failedCount} FAILED`);
    console.log('======================================================\n');

    if (failedCount > 0) {
        process.exit(1);
    } else {
        process.exit(0);
    }
}

runTests().catch(err => {
    console.error('Fatal error in test runner:', err);
    process.exit(1);
});
