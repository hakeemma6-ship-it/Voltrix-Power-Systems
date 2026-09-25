/**
 * POST /api/chat — Real Gemini-powered AI chat assistant with RAG context and Tool calling
 */
import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { db, persistWrite, syncDatabaseOnBoot, getMongoDb } from '@/lib/db';
import { ai } from '@/lib/ai';
import { getAuthUser } from '@/lib/auth';
import { searchKnowledgeBase, syncKnowledgeBaseOnBoot } from '@/server/ragEngine';
import { calculateSizingRecommendation } from '@/server/powerRulesEngine';
import type { Inquiry } from '@/types';
import { sendWhatsAppMessage, sendAdminWhatsAppMessage } from '@/lib/whatsapp';

export async function POST(req: NextRequest) {
    await syncDatabaseOnBoot();

    // Initialize the RAG knowledge documents on boot if needed
    if (ai) {
        try {
            await syncKnowledgeBaseOnBoot(ai, getMongoDb());
        } catch (e) {
            console.error('[ragEngine] Failed to sync knowledge base on boot:', e);
        }
    }

    let body: any;
    try {
        body = await req.json();
    } catch (err) {
        return NextResponse.json({ error: 'Invalid JSON request body.' }, { status: 400 });
    }

    const { messages } = body;
    if (!messages || !Array.isArray(messages)) {
        return NextResponse.json({ error: 'Invalid request payload. Expects messages array.' }, { status: 400 });
    }

    if (messages.length > 50) {
        return NextResponse.json({ error: 'Conversation history exceeds maximum limit of 50 messages.' }, { status: 400 });
    }

    const lastMsgObj = messages[messages.length - 1];
    const lastUserMsg = (lastMsgObj?.text || lastMsgObj?.content || '').toString();
    if (lastUserMsg.length > 4000) {
        return NextResponse.json({ error: 'Message content exceeds maximum allowed length of 4000 characters.' }, { status: 400 });
    }
    const cleanedMsg = lastUserMsg.toLowerCase();

    const encoder = new TextEncoder();

    // Obtain user information (Restricted to Dealer and Admin Portals)
    const user = getAuthUser(req);
    if (!user || (user.role !== 'dealer' && user.role !== 'admin')) {
        return NextResponse.json(
            { error: 'AI Assistant access is restricted to authorized Dealer and Admin portals.' },
            { status: 403 }
        );
    }
    const userRole = user.role;
    const userEmail = user.email || '';

    // Perform semantic retrieval from RAG knowledge base
    let searchResults: any[] = [];
    try {
        searchResults = await searchKnowledgeBase(ai, lastUserMsg, 5);
        console.log(`[RAG PIPELINE DIAGNOSTIC] Found ${searchResults.length} relevant context chunks in knowledge base for query: "${lastUserMsg}"`);
    } catch (err) {
        console.error('RAG search failed in chat route:', err);
    }

    const contextBlock = searchResults
        .map(r => `[Source: ${r.chunk.source}] (${r.chunk.title})\n${r.chunk.content}`)
        .join('\n\n');

    const citations = searchResults.map(r => ({
        id: r.chunk.id,
        title: r.chunk.title,
        source: r.chunk.source,
        category: r.chunk.category
    }));

    let roleContextBlock = '';

    if (userRole === 'dealer') {
        const dealer = db.dealers.find(d => d.email.toLowerCase() === userEmail.toLowerCase());
        const dealerId = dealer ? dealer.id : null;
        if (dealerId) {
            const myDeals = (db.deal_closures || []).filter(d => d.dealerId === dealerId);
            const myLeads = db.inquiries.filter(i => i.assignedDealerId === dealerId);
            const myCustomers = db.customers.filter(c =>
                c.assignedDealerId === dealerId ||
                (c.assignedDealers && Array.isArray(c.assignedDealers) && c.assignedDealers.some((d: any) => d.id === dealerId))
            );

            roleContextBlock = `
=== DEPLOYED ROLE: B2B AUTHORIZED DEALER ===
You are logged in as Dealer Partner: "${dealer.companyName || dealer.name}" (Dealer ID: ${dealerId}, Representative: ${dealer.name}).
You are an authorized dealer partner located in: ${dealer.city}, ${dealer.state}.

SUMMARY STATS:
- Assigned Customers Count: ${myCustomers.length}
- Closed Deals Count: ${myDeals.length}
- Assigned Customer Leads Count: ${myLeads.length}

SECURITY REQUIREMENT:
You ONLY have access to your own data. You cannot view other dealers' data or general platform administrator files.
The data below is verified and belongs ONLY to you.

YOUR ASSIGNED CUSTOMERS (Total: ${myCustomers.length}):
${JSON.stringify(myCustomers.map(c => ({
                id: c.id,
                name: c.name,
                email: c.email,
                phone: c.phone,
                location: c.location || 'N/A'
            })), null, 2)}

YOUR CLOSED DEALS (Total: ${myDeals.length}):
${JSON.stringify(myDeals, null, 2)}

ROLE-SPECIFIC OPERATIONS:
- You CAN discuss, list, and summarize all of customer stats, orders, leads, and quotations listed above.
- The strict pricing & checkout restrictions do NOT apply to you since you are an authorized partner viewing your own confidential B2B records. You are allowed to state and discuss the prices and totals listed in your data.
- If the dealer asks about pending orders, list those with status not equal to 'delivered' or 'cancelled'.
- If they ask about today's assigned customers, check leads/orders with createdAt matching today's date (or recent date entries).
- If they ask about follow-up, list leads with pending nextFollowupDate.
- Keep the tone highly professional, helpful, and collaborative.
`;
        } else {
            roleContextBlock = `\n[Error: Dealer profile not found for email ${userEmail}]\n`;
        }
    } else if (userRole === 'admin') {
        const allDealers = db.dealers;
        const allDeals = db.deal_closures || [];
        const allLeads = db.inquiries;
        const allCustomers = db.customers;
        const allInventory: any[] = [];
        const allServiceBookings: any[] = [];

        roleContextBlock = `
=== DEPLOYED ROLE: SYSTEM ADMINISTRATOR ===
You are logged in as the System Administrator (Operations Executive Head) of Voltrix Power.
You have unrestricted root access to the entire platform database.

SUMMARY STATS:
- Total Registered Dealers: ${allDealers.length}
- Total Customers: ${allCustomers.length}
- Total Closed Deals: ${allDeals.length}
- Total CRM Leads & Inquiries: ${allLeads.length}

ALL REGISTERED DEALERS:
${JSON.stringify(allDealers.map(d => ({
            id: d.id,
            companyName: d.companyName || (d as any).businessName,
            ownerName: d.name || (d as any).ownerName,
            email: d.email,
            phone: d.phone,
            city: d.city,
            state: d.state,
            status: d.status,
            registeredAt: d.registeredAt
        })), null, 2)}

ALL CUSTOMERS (Total: ${allCustomers.length}):
${JSON.stringify(allCustomers.map(c => ({
            id: c.id,
            name: c.name,
            email: c.email,
            phone: c.phone,
            location: c.location || 'N/A',
            assignedDealerId: c.assignedDealerId || 'N/A',
            assignedDealers: c.assignedDealers || []
        })), null, 2)}

ALL CLOSED DEALS (Total: ${allDeals.length}):
${JSON.stringify(allDeals, null, 2)}

ALL CRM LEADS & INQUIRIES (Total: ${allLeads.length}):
${JSON.stringify(allLeads, null, 2)}

CURRENT INVENTORY:
${JSON.stringify(allInventory, null, 2)}

ACTIVE SERVICE BOOKINGS:
${JSON.stringify(allServiceBookings, null, 2)}

ROLE-SPECIFIC INSTRUCTIONS:
- You have complete access to all metrics, statistics, lists, and deep database lookup details for anyone on the platform.
- You can answer broad business questions, compile reports, count total records, and view/modify dealer verification statuses.
- You can state any price, discount, or commercial details across the system.
`;
    } else if (userRole === 'customer') {
        const customer = db.customers.find(c => c.email?.toLowerCase() === userEmail.toLowerCase());
        const myDeals = (db.deal_closures || []).filter(d => d.customerPhone === customer?.phone || d.customerId === customer?.id);
        const myLeads = db.inquiries.filter(i => i.email?.toLowerCase() === userEmail.toLowerCase());

        roleContextBlock = `
=== DEPLOYED ROLE: AUTHENTICATED CUSTOMER ===
You are logged in as Customer: "${customer?.name || userEmail}".
You can ONLY access your own details, closed deals, and inquiries.

YOUR DETAILS:
- Name: ${customer?.name || 'N/A'}
- Email: ${customer?.email || userEmail}
- Phone: ${customer?.phone || 'N/A'}
- City: ${customer?.location || 'N/A'}

YOUR CLOSED DEALS (Total: ${myDeals.length}):
${JSON.stringify(myDeals, null, 2)}

YOUR SERVICE INQUIRIES & CRM LEADS (Total: ${myLeads.length}):
${JSON.stringify(myLeads.map(l => ({
            id: l.id,
            subject: l.subject,
            message: l.message,
            status: l.status,
            createdAt: l.createdAt
        })), null, 2)}

ROLE-SPECIFIC OPERATIONS:
- You can summarize, list, and detail all of the inquiries and closed deals belonging to you.
- You cannot see any other customers' data or general platform administrator files.
`;
    }

    // Construct System Instruction for Gemini
    const systemInstruction = `You are the official VOLTRIX AI Assistant.

${roleContextBlock}

BUSINESS IDENTITY & ROLE:
VOLTRIX POWER SYSTEMS is NOT a manufacturer, factory, production company, dealer, or distributor.
VOLTRIX POWER SYSTEMS is an AI-powered power solutions guidance and consultancy platform.
Our core role is:
- Helping customers understand power solutions
- Technical guidance
- Load analysis support
- Product recommendation
- Connecting users with suitable regional suppliers or authorized partners

STRICT TOPICS OF FOCUS:
Prioritize our website content topics:
- Servo Stabilizers
- UPS Systems
- Inverters
- Batteries
- Solar Solutions
- Power backup guidance

COMMUNICATION RULES & CONSTRAINTS:
- NEVER say "we manufacture", "our factory", "our plant", "our warehouse", "our Noida facility", "world-class manufacturing", or "industrial manufacturer".
- Keep replies short, professional, and use natural, human-like language.
- No fake marketing, no fake history, and no imaginary offices or factories.
- If the user asks a question whose answer cannot be found in the provided RAG KNOWLEDGE BASE or website content (retrieved context), you SHOULD answer using your general knowledge directly. Do NOT say that you don't know or ask them to contact support for general questions; answer the question directly.

STRICT PRICING & BUSINESS SAFETY RULES:
- DO NOT provide product prices, commercial quotations, bulk discounts, or final commercial offers unless they are explicitly listed in your Deployed Role context data (e.g. for dealers/admins/customers viewing their own orders/quotations).
- If a customer asks about generic product prices, commercial quotes, or dealer pricing that is not in their role context, you MUST respond with this EXACT statement: "Please contact our sales/dealer team for pricing and quotation assistance."

RAG KNOWLEDGE BASE (Retrieve-and-Cite Protocol):
You must base your technical statements and product information on the following retrieved knowledge. Always cite the Source (e.g. [Source: ...]) when referencing specific data:

=== RETRIEVED CONTEXT ===
${contextBlock || 'No relevant knowledge found in the database.'}
=== END OF CONTEXT ===

AI ASSISTANT PROTOCOL & INTERACTIVE DIAGNOSTIC DIALOGUE:
1. Greet the user or partner professionally.
2. If the user is asking about specific orders, customers, or transactions, refer to the Deployed Role context logs.
3. Recommend suitable products professionally by asking smart diagnostic questions when needed.
4. If the user provides load values and requests a sizing calculation, call the 'calculatePowerRecommendation' tool to calculate precise ratings.
5. If a user wants to request a quote, submit specifications, or buy/order, collect their details (Name, Email, Phone, City, Product Interest, Capacity) and call the 'saveLeadToCrm' tool.
6. If the user is frustrated, wants human support, or requests a human rep, call the 'requestHumanHandoff' tool.`;

    // 1. Check if Gemini is configured. If not, use local sandbox fallback.
    if (!ai || !process.env.GEMINI_API_KEY) {
        let fallbackText = '### VOLTRIX AI Assistant (Consultancy Sandbox Mode Active)\n\n';
        let sizingDetails: any = null;
        let actionTaken = '';

        // Detect Sizing Request
        if (
            cleanedMsg.includes('stabilizer') ||
            cleanedMsg.includes('servo') ||
            cleanedMsg.includes('ups') ||
            cleanedMsg.includes('battery') ||
            cleanedMsg.includes('solar') ||
            cleanedMsg.includes('calculate') ||
            cleanedMsg.includes('kva') ||
            cleanedMsg.includes('kw') ||
            /\b\d+(\s*(kw|kva|w|hp))\b/i.test(cleanedMsg)
        ) {
            let detectedLoad = 10;
            const matches = cleanedMsg.match(/\b(\d+(\.\d+)?)\s*(kw|kva|w|hp)?\b/i);
            if (matches) {
                detectedLoad = parseFloat(matches[1]);
            }

            const isSingle = cleanedMsg.includes('single') || cleanedMsg.includes('1 phase') || cleanedMsg.includes('1phase');
            const isSolar = cleanedMsg.includes('solar') || cleanedMsg.includes('panel') || cleanedMsg.includes('sun');
            const isUps = cleanedMsg.includes('ups') || cleanedMsg.includes('backup') || cleanedMsg.includes('computer');
            const isBank = cleanedMsg.includes('bank') || cleanedMsg.includes('ah') || cleanedMsg.includes('hours');

            let prodType: 'servo_stabilizer' | 'online_ups' | 'battery_bank' | 'solar_system' = 'servo_stabilizer';
            if (isSolar) prodType = 'solar_system';
            else if (isUps) prodType = 'online_ups';
            else if (isBank) prodType = 'battery_bank';

            sizingDetails = calculateSizingRecommendation({
                productType: prodType,
                connectedLoadKw: detectedLoad,
                phaseType: isSingle ? 'single_phase' : 'three_phase',
                applicationType: cleanedMsg.includes('medical')
                    ? 'medical'
                    : cleanedMsg.includes('home') || cleanedMsg.includes('residen')
                        ? 'residential'
                        : 'industrial'
            });
        }

        // Detect Lead Capture
        const emailRegex = /[\w\.-]+@[\w\.-]+\.\w+/;
        const phoneRegex = /(\+?\d{1,4}[\s-]?)?\(?\d{3}\)?[\s-]?\d{3}[\s-]?\d{4}/;
        const hasEmail = emailRegex.test(cleanedMsg);
        const hasPhone = phoneRegex.test(cleanedMsg);

        if (hasEmail || hasPhone || cleanedMsg.includes('quote') || cleanedMsg.includes('buy') || cleanedMsg.includes('purchase') || cleanedMsg.includes('order')) {
            const lName = (cleanedMsg.match(/name is\s+([a-zA-Z\s]+)/i)?.[1] || 'Offline Lead').trim();
            const lEmail = (cleanedMsg.match(emailRegex)?.[0] || 'crm_lead@voltrix.com').trim();
            const lPhone = (cleanedMsg.match(phoneRegex)?.[0] || '+91 99000 99000').trim();

            const inqId = `inq_ai_${Date.now()}`;
            const customerExists = db.customers?.some(c => c.email && c.email.toLowerCase() === lEmail.toLowerCase());
            if (!customerExists) {
                const customerId = `cust_${Date.now()}`;
                const newCustomer: any = {
                    id: customerId,
                    name: lName,
                    email: lEmail,
                    phone: lPhone,
                    role: 'customer',
                    hasLogin: false,
                    status: 'new',
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                };
                if (!db.customers) db.customers = [];
                db.customers.unshift(newCustomer);
                await persistWrite('customers', customerId, newCustomer);
            }

            const newInq: any = {
                id: inqId,
                name: lName,
                email: lEmail,
                phone: lPhone,
                subject: 'AI Advisor Self-Captured Lead',
                message: 'This lead was captured automatically during user chatbot interaction in sandbox fallback mode.',
                createdAt: new Date().toISOString().split('T')[0],
                status: 'new',
                whatsappLogs: [],
                location: 'Self Capture',
                productInterest: 'Servo Stabilizer',
                priority: 'hot',
                score: 80,
                timeline: [
                    {
                        id: 'tl_' + Date.now(),
                        timestamp: new Date().toISOString(),
                        type: 'system',
                        remarks: 'CRM Lead auto-written inside local simulation mode',
                        userRole: 'system',
                        userName: 'Sandbox Fallback'
                    }
                ],
                uploadedDocuments: [],
                callbackRequests: [],
                notifications: []
            };

            db.inquiries.unshift(newInq);
            await persistWrite('inquiries', newInq.id, newInq);

            await sendWhatsAppMessage({
                to: lPhone,
                recipientName: lName,
                type: 'template',
                templateName: 'inquiry_received',
                parameters: [lName, 'AI Advisor Self-Captured Lead'],
                associatedInquiryId: inqId
            });

            // Notify Admin about Sandbox captured lead
            await sendAdminWhatsAppMessage({
                templateName: 'admin_new_lead_alert',
                parameters: [lName, lPhone, 'AI Advisor Lead']
            });

            const dNotif = {
                id: `notif_ai_${Date.now()}`,
                type: 'lead_registration',
                dealerId: 'system_admin',
                message: ` Hot CRM Lead via Sandbox Fallback: ${lName} - Registered inquiry.`,
                isRead: false,
                createdAt: new Date().toISOString()
            };
            db.notifications.unshift(dNotif);
            await persistWrite('notifications', dNotif.id, dNotif);

            actionTaken = 'lead_captured';
        }

        // Detect Human Handoff Request
        if (cleanedMsg.includes('human') || cleanedMsg.includes('representative') || cleanedMsg.includes('support rep') || cleanedMsg.includes('agent') || cleanedMsg.includes('call me')) {
            const hNotif = {
                id: `notif_handoff_${Date.now()}`,
                type: 'human_handoff',
                dealerId: 'system_admin',
                message: ` HUMAN HANDOFF REQUESTED in Sandbox Mode: "${lastUserMsg}"`,
                isRead: false,
                createdAt: new Date().toISOString()
            };
            db.notifications.unshift(hNotif);
            await persistWrite('notifications', hNotif.id, hNotif);

            // Notify Admin about Sandbox handoff request
            await sendAdminWhatsAppMessage({
                templateName: 'admin_handoff_request_alert',
                parameters: ['Sandbox Interactive User', 'N/A', lastUserMsg.slice(0, 100)]
            });

            actionTaken = 'human_notified';
        }

        if (actionTaken === 'human_notified') {
            fallbackText += `Our system has flagged your request for human consultation helper support. A Technical Coordinator will contact you directly.\n\n“Our authorized VOLTRIX partner will contact you shortly for pricing, quotation, installation, and final discussion.”`;
        } else if (actionTaken === 'lead_captured') {
            fallbackText += `Thank you for sharing your project specifications. I have registered your inquiry details in our CRM lead portal safely.\n\n“Our authorized VOLTRIX partner will contact you shortly for pricing, quotation, installation, and final discussion.”`;
        } else if (sizingDetails) {
            fallbackText += `###  DETERMINISTIC POWER SIZING ANALYSIS\n\nBased on your load profile, our engineering rules calculated the following recommendations:\n\n` +
                `* **Product category recommendation:** ${sizingDetails.productType.toUpperCase()}\n` +
                `* **Target load capability:** ${sizingDetails.connectedLoadKw} kW\n` +
                `* **Required Capacity Sizing:** ${sizingDetails.requiredKvaOrCapacity} ${sizingDetails.productType === 'battery_bank' ? 'Ah' : 'kVA'}\n` +
                `* **Recommended Solution Model:** ${sizingDetails.recommendedModelRating}\n` +
                `* **Microprocessor Cooling Recommendation:** ${sizingDetails.coolingRecommendation || 'Air Cooled fan dynamic vents'}\n\n` +
                `**Formula parameters analyzed:**\n` +
                sizingDetails.formulasUsed.map((f: string) => `* ${f}`).join('\n') + `\n\n` +
                `**Technical installation notes:**\n` +
                `_${sizingDetails.technicalNotes}_\n\n` +
                `“Our authorized VOLTRIX partner will contact you shortly for pricing, quotation, installation, and final discussion.”`;
        } else {
            if (userRole === 'dealer') {
                const dealer = db.dealers.find(d => d.email.toLowerCase() === userEmail.toLowerCase());
                const dealerId = dealer ? dealer.id : null;
                if (dealerId) {
                    const myDeals = (db.deal_closures || []).filter(d => d.dealerId === dealerId);
                    const myLeads = db.inquiries.filter(i => i.assignedDealerId === dealerId);
                    const myCustomers = db.customers.filter(c =>
                        c.assignedDealerId === dealerId ||
                        (c.assignedDealers && Array.isArray(c.assignedDealers) && c.assignedDealers.some((d: any) => d.id === dealerId))
                    );

                    if (cleanedMsg.includes('deal') || cleanedMsg.includes('closed') || cleanedMsg.includes('commission')) {
                        fallbackText += `###  DEALER B2B CLOSURES & COMMISSION REPORT\n\n` +
                            `* Total Closed Deals Count: **${myDeals.length}**\n` +
                            `* Total Associated Customers Count: **${myCustomers.length}**\n\n` +
                            `Your closed deals list:\n` +
                            myDeals.map(d => `* **Deal for ${d.customerName}**: ₹${d.closedAmount?.toLocaleString('en-IN')} - Commission: **₹${d.commissionAmount?.toLocaleString('en-IN')}**`).join('\n') + '\n';
                        actionTaken = 'dealer_report';
                    } else if (cleanedMsg.includes('lead') || cleanedMsg.includes('customer') || cleanedMsg.includes('assign') || cleanedMsg.includes('follow') || cleanedMsg.includes('how many customer')) {
                        fallbackText += `###  DEALER CRM CUSTOMER & LEADS REPORT\n\n` +
                            `* Total Associated Customers Count: **${myCustomers.length}**\n` +
                            `* Total CRM Leads Count: **${myLeads.length}**\n\n` +
                            `Your assigned customer leads:\n` +
                            myLeads.map(l => `* **Lead ${l.id}**: ${l.name} - Status: **${l.status.toUpperCase()}**`).join('\n') + '\n';
                        actionTaken = 'dealer_report';
                    }
                }
            } else if (userRole === 'admin') {
                const allCustomers = db.customers;
                const allDeals = db.deal_closures || [];
                if (cleanedMsg.includes('dealer') || cleanedMsg.includes('partners') || cleanedMsg.includes('how many dealer')) {
                    fallbackText += `###  PLATFORM DEALERS REPORT (ADMIN)\n\n` +
                        `* Total Registered Dealers: **${db.dealers.length}**\n\n` +
                        db.dealers.map(d => `* **${d.companyName || d.name}** (${d.city}) - Status: [**${d.status.toUpperCase()}**]`).join('\n') + '\n';
                    actionTaken = 'admin_report';
                } else if (cleanedMsg.includes('lead') || cleanedMsg.includes('crm') || cleanedMsg.includes('inquiry') || cleanedMsg.includes('how many lead') || cleanedMsg.includes('inquiries')) {
                    fallbackText += `###  CRM LEADS PIPELINE STATUS\n\n` +
                        `* Total Leads Count: **${db.inquiries.length}**\n\n` +
                        db.inquiries.slice(0, 10).map(l => `* **${l.name}** (${l.location}) - Topic: *${l.subject}* - Status: **${l.status.toUpperCase()}**`).join('\n') + '\n';
                    actionTaken = 'admin_report';
                } else if (cleanedMsg.includes('customer') || cleanedMsg.includes('stats') || cleanedMsg.includes('how many customer')) {
                    fallbackText += `###  PLATFORM CUSTOMERS REPORT (ADMIN)\n\n` +
                        `* Total Registered Customers: **${allCustomers.length}**\n\n` +
                        allCustomers.slice(0, 10).map(c => `* **${c.name}** (${c.email}) - Location: **${c.location || 'N/A'}**`).join('\n') + '\n';
                    actionTaken = 'admin_report';
                } else if (cleanedMsg.includes('deal') || cleanedMsg.includes('closure') || cleanedMsg.includes('commission')) {
                    fallbackText += `###  SYSTEM WIDE DEALS REPORT (ADMIN)\n\n` +
                        `* Total Closed Deals: **${allDeals.length}**\n\n` +
                        allDeals.slice(0, 10).map(d => `* **Deal for ${d.customerName}**: ₹${d.closedAmount?.toLocaleString('en-IN')} by ${d.dealerCompanyName} (Commission: ₹${d.commissionAmount?.toLocaleString('en-IN')})`).join('\n') + '\n';
                    actionTaken = 'admin_report';
                }
            } else if (userRole === 'customer') {
                const customer = db.customers.find(c => c.email?.toLowerCase() === userEmail.toLowerCase());
                const myDeals = (db.deal_closures || []).filter(d => d.customerPhone === customer?.phone || d.customerId === customer?.id);
                const myLeads = db.inquiries.filter(i => i.email?.toLowerCase() === userEmail.toLowerCase());

                if (cleanedMsg.includes('deal') || cleanedMsg.includes('closed') || cleanedMsg.includes('order') || cleanedMsg.includes('my orders')) {
                    fallbackText += `###  CUSTOMER DEALS REPORT\n\n` +
                        `You have **${myDeals.length}** closed deals.\n\n` +
                        myDeals.map(d => `* **Deal for ${d.productCategory || 'Power Solution'}**: ₹${d.closedAmount?.toLocaleString('en-IN')} (Closed on ${new Date(d.closedAt).toLocaleDateString('en-IN')})`).join('\n') + '\n';
                    actionTaken = 'customer_report';
                } else if (cleanedMsg.includes('lead') || cleanedMsg.includes('inquiry') || cleanedMsg.includes('my inquiries') || cleanedMsg.includes('status')) {
                    fallbackText += `###  CUSTOMER CRM INQUIRIES REPORT\n\n` +
                        `You have **${myLeads.length}** inquiry leads.\n\n` +
                        myLeads.map(l => `* **Inquiry ${l.id}**: ${l.subject} - Status: **${l.status.toUpperCase()}**`).join('\n') + '\n';
                    actionTaken = 'customer_report';
                } else if (cleanedMsg.includes('profile') || cleanedMsg.includes('my details') || cleanedMsg.includes('who am i')) {
                    fallbackText += `###  CUSTOMER PROFILE DETAILS\n\n` +
                        `* Name: **${customer?.name || 'N/A'}**\n` +
                        `* Email: **${customer?.email || userEmail}**\n` +
                        `* Phone: **${customer?.phone || 'N/A'}**\n` +
                        `* Location: **${customer?.location || 'N/A'}**\n`;
                    actionTaken = 'customer_report';
                }
            }

            if (!actionTaken) {
                if (searchResults.length > 0) {
                    const topResult = searchResults[0];
                    fallbackText += `#### Retrieved Consultation Knowledge (${topResult.chunk.title})\n\n${topResult.chunk.content}\n\n`;
                } else {
                    const lowerUserMsg = cleanedMsg;
                    if (lowerUserMsg.includes('transformer') || lowerUserMsg.includes('isolation')) {
                        fallbackText += `### Isolation Transformers (Outside Knowledge Fallback)\n\n` +
                            `An **Isolation Transformer** is used to transfer electrical power from a source of alternating current (AC) power to a equipment or device while isolating the powered device from the power source for safety. They provide galvanic isolation, protect against electric shocks, and suppress electrical noise.\n\n` +
                            `“Our authorized VOLTRIX partner will contact you shortly for pricing, quotation, installation, and final discussion.”`;
                    } else if (lowerUserMsg.includes('generator') || lowerUserMsg.includes('engine')) {
                        fallbackText += `### Power Generators (Outside Knowledge Fallback)\n\n` +
                            `A **generator** converts mechanical energy into electrical energy to provide back-up electricity during power outages. Typical back-up options range from portable diesel components to heavy duty industrial generator systems.\n\n` +
                            `“Our authorized VOLTRIX partner will contact you shortly for pricing, quotation, installation, and final discussion.”`;
                    } else if (lowerUserMsg.includes('panel') || lowerUserMsg.includes('switchgear')) {
                        fallbackText += `### Switchgear & Panels (Outside Knowledge Fallback)\n\n` +
                            `**Electrical Panels** and **Switchgear** contain fuses, circuit breakers, and switches that distribute electrical power safely throughout a facility and protect equipment from overload parameters.\n\n` +
                            `“Our authorized VOLTRIX partner will contact you shortly for pricing, quotation, installation, and final discussion.”`;
                    } else {
                        fallbackText += `### Voltrix Copilot Consultation System\n\n` +
                            `I have processed your query: "${lastUserMsg}" utilizing our integrated knowledge retrieval index. Since this specific information is not fully covered by the core site parameters, I've resolved this consultation request using outside engineering practices.\n\n` +
                            `For custom sizing, stabilizers, or battery solutions, please share your phase/load specs!\n\n` +
                            `“Our authorized VOLTRIX partner will contact you shortly for pricing, quotation, installation, and final discussion.”`;
                    }
                }
            }
        }

        // Return SSE stream for local sandbox simulation
        const stream = new ReadableStream({
            start(controller) {
                const words = fallbackText.split(' ');
                let i = 0;
                const sendNextWord = () => {
                    if (i < words.length) {
                        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: words[i] + ' ' })}\n\n`));
                        i++;
                        setTimeout(sendNextWord, 40);
                    } else {
                        controller.enqueue(
                            encoder.encode(`data: ${JSON.stringify({ citations: searchResults.length > 0 ? citations : [], recommendation: sizingDetails || null, done: true })}\n\n`)
                        );
                        controller.close();
                    }
                };
                sendNextWord();
            }
        });

        return new Response(stream, {
            headers: {
                'Content-Type': 'text/event-stream; charset=utf-8',
                'Cache-Control': 'no-cache, no-transform',
                'Connection': 'keep-alive',
                'X-Accel-Buffering': 'no'
            }
        });
    }

    // 2. Real Google Gemini execution with Function Calling
    try {
        const firstUserIndex = messages.findIndex(msg => msg.role === 'user');
        const filteredMessages = firstUserIndex !== -1 ? messages.slice(firstUserIndex) : messages;

        const contents = filteredMessages.map(msg => ({
            role: msg.role === 'user' ? 'user' : 'model',
            parts: [{ text: msg.text }]
        }));

        const tools = [
            {
                functionDeclarations: [
                    {
                        name: 'calculatePowerRecommendation',
                        description: 'Calculates specific power stabilizer sizing recommendation, backup hours for Online UPS or commercial solar network installations.',
                        parameters: {
                            type: 'OBJECT',
                            properties: {
                                productType: { type: 'STRING', enum: ['servo_stabilizer', 'online_ups', 'battery_bank', 'solar_system'], description: 'Target product category.' },
                                connectedLoadKw: { type: 'NUMBER', description: 'Connected load sizing demand in Kilowatts.' },
                                phaseType: { type: 'STRING', enum: ['single_phase', 'three_phase'], description: 'Supply source phases.' },
                                inputVoltageMin: { type: 'NUMBER', description: 'Lowest voltage fluctuation seen.' },
                                inputVoltageMax: { type: 'NUMBER', description: 'Highest voltage spike seen.' },
                                applicationType: { type: 'STRING', enum: ['industrial', 'medical', 'commercial', 'residential'], description: 'Type of site location.' },
                                backupHours: { type: 'NUMBER', description: 'Target backup hours for batteries.' },
                                systemDcVoltage: { type: 'NUMBER', description: 'DC Bus specification for online battery arrays.' }
                            },
                            required: ['productType', 'connectedLoadKw', 'phaseType']
                        }
                    },
                    {
                        name: 'saveLeadToCrm',
                        description: 'Registers and logs a qualified customer quotation request or sales inquiry into the CRM lead database and notifies authorized dealers.',
                        parameters: {
                            type: 'OBJECT',
                            properties: {
                                name: { type: 'STRING', description: 'Customer Name.' },
                                phone: { type: 'STRING', description: 'Business Phone Number.' },
                                email: { type: 'STRING', description: 'Customer Email address.' },
                                city: { type: 'STRING', description: 'Location city.' },
                                product: { type: 'STRING', description: 'Product type interest.' },
                                capacity: { type: 'STRING', description: 'Target capacity rating.' },
                                company: { type: 'STRING', description: 'Company name.' },
                                notes: { type: 'STRING', description: 'Additional custom requirements or site notes.' }
                            },
                            required: ['name', 'phone', 'email', 'city', 'product']
                        }
                    },
                    {
                        name: 'requestHumanHandoff',
                        description: 'Initiates a human engineering representative handoff, saving the active session details and flagging the admin dashboard for instant intervention.',
                        parameters: {
                            type: 'OBJECT',
                            properties: {
                                customerNotes: { type: 'STRING', description: 'Brief details of why the human is requested or what needs expert review.' }
                            },
                            required: ['customerNotes']
                        }
                    }
                ]
            }
        ] as any;

        let response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: contents,
            config: {
                systemInstruction: systemInstruction,
                temperature: 0.4,
                tools: tools
            }
        });

        const candidates = (response as any).candidates || [];
        const functionCalls = candidates[0]?.content?.parts?.filter((p: any) => p.functionCall).map((p: any) => p.functionCall) || response.functionCalls || [];

        if (functionCalls && functionCalls.length > 0) {
            const call = functionCalls[0];
            let toolResult: any = null;
            let activeRecommendation: any = null;

            if (call.name === 'calculatePowerRecommendation') {
                const result = calculateSizingRecommendation(call.args as any);
                activeRecommendation = result;
                toolResult = { success: true, calculations: result };

            } else if (call.name === 'saveLeadToCrm') {
                const args = call.args as any;
                const inqId = `inq_ai_${Date.now()}`;

                const customerExists = db.customers?.some(c => c.email && c.email.toLowerCase() === args.email.toLowerCase());
                if (!customerExists) {
                    const customerId = `cust_${Date.now()}`;
                    const newCustomer: any = {
                        id: customerId,
                        name: args.name,
                        email: args.email,
                        phone: args.phone,
                        role: 'customer',
                        hasLogin: false,
                        status: 'new',
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString()
                    };
                    if (!db.customers) db.customers = [];
                    db.customers.unshift(newCustomer);
                    await persistWrite('customers', customerId, newCustomer);
                }

                const newInq: any = {
                    id: inqId,
                    name: args.name,
                    email: args.email,
                    phone: args.phone,
                    subject: `AI Sizing Quote Request: ${args.product} (${args.capacity || 'N/A'})`,
                    message: `Product Category: ${args.product}\nRequired Capacity: ${args.capacity || 'Calculated Sizing'}\nApplication: ${args.application || 'Not specified'}\nCompany Name: ${args.company || 'N/A'}\nCity Location: ${args.city}\nCustomer Custom Notes: ${args.notes || 'None'}`,
                    createdAt: new Date().toISOString().split('T')[0],
                    status: 'new',
                    whatsappLogs: [],
                    location: args.city,
                    productInterest: args.product || 'Servo Stabilizer',
                    priority: 'hot',
                    score: 95,
                    timeline: [
                        {
                            id: 'tl_' + Date.now(),
                            timestamp: new Date().toISOString(),
                            type: 'system',
                            remarks: `Inquiry registered by Gemini Sizing for ${args.product}`,
                            userRole: 'system',
                            userName: 'Gemini AI'
                        }
                    ],
                    uploadedDocuments: [],
                    callbackRequests: [],
                    notifications: []
                };

                db.inquiries.unshift(newInq);
                await persistWrite('inquiries', newInq.id, newInq);

                await sendWhatsAppMessage({
                    to: args.phone,
                    recipientName: args.name,
                    type: 'template',
                    templateName: 'inquiry_received',
                    parameters: [args.name, `AI Sizing: ${args.product}`],
                    associatedInquiryId: inqId
                });

                // Notify Admin about Gemini captured lead
                await sendAdminWhatsAppMessage({
                    templateName: 'admin_new_lead_alert',
                    parameters: ['Gemini AI Sizer', args.name, args.product || 'Stabilizer', args.phone]
                });

                const dNotif = {
                    id: `notif_ai_${Date.now()}`,
                    type: 'lead_registration',
                    dealerId: 'system_admin',
                    message: ` Hot CRM Lead via Gemini Advisor: ${args.name} (${args.city}) - Sized: ${args.capacity || 'Calculated'} ${args.product}`,
                    isRead: false,
                    createdAt: new Date().toISOString()
                };
                db.notifications.unshift(dNotif);
                await persistWrite('notifications', dNotif.id, dNotif);

                toolResult = { success: true, inquiryId: inqId, message: 'CRITICAL CRM RECORD WRITTEN SUCCESSFULLY' };

            } else if (call.name === 'requestHumanHandoff') {
                const args = call.args as any;
                const hNotif = {
                    id: `notif_handoff_${Date.now()}`,
                    type: 'human_handoff',
                    dealerId: 'system_admin',
                    message: ` HUMAN HANDOFF REQUESTED in Gemini Assistant: "${args.customerNotes}"`,
                    isRead: false,
                    createdAt: new Date().toISOString()
                };
                db.notifications.unshift(hNotif);
                await persistWrite('notifications', hNotif.id, hNotif);

                // Notify Admin about Gemini handoff request
                await sendAdminWhatsAppMessage({
                    templateName: 'admin_handoff_request_alert',
                    parameters: [args.customerName || 'Anonymous Client', args.customerPhone || 'N/A', args.customerNotes ? args.customerNotes.slice(0, 100) : 'Direct Handoff']
                });

                toolResult = { success: true, message: 'HUMAN DESKS ALERTED' };
            }

            contents.push({
                role: 'model',
                parts: [{ functionCall: call }]
            } as any);

            contents.push({
                role: 'tool',
                parts: [{
                    functionResponse: {
                        name: call.name,
                        response: { result: JSON.stringify(toolResult) }
                    }
                }]
            } as any);

            const nextStream = new ReadableStream({
                async start(controller) {
                    try {
                        const stream = await ai.models.generateContentStream({
                            model: 'gemini-2.5-flash',
                            contents: contents,
                            config: {
                                systemInstruction: systemInstruction,
                                temperature: 0.2,
                                tools: tools
                            }
                        });

                        for await (const chunk of stream) {
                            if (chunk.text) {
                                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: chunk.text })}\n\n`));
                            }
                        }

                        controller.enqueue(
                            encoder.encode(`data: ${JSON.stringify({ citations: citations, recommendation: activeRecommendation, done: true })}\n\n`)
                        );
                        controller.close();
                    } catch (e: any) {
                        controller.enqueue(
                            encoder.encode(`data: ${JSON.stringify({ error: 'Failed to stream post-tool Gemini completion: ' + e.message })}\n\n`)
                        );
                        controller.close();
                    }
                }
            });

            return new Response(nextStream, {
                headers: {
                    'Content-Type': 'text/event-stream; charset=utf-8',
                    'Cache-Control': 'no-cache, no-transform',
                    'Connection': 'keep-alive',
                    'X-Accel-Buffering': 'no'
                }
            });
        } else {
            const normalStream = new ReadableStream({
                async start(controller) {
                    try {
                        const stream = await ai.models.generateContentStream({
                            model: 'gemini-2.5-flash',
                            contents: contents,
                            config: {
                                systemInstruction: systemInstruction,
                                temperature: 0.4,
                                tools: tools
                            }
                        });

                        for await (const chunk of stream) {
                            if (chunk.text) {
                                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: chunk.text })}\n\n`));
                            }
                        }

                        controller.enqueue(
                            encoder.encode(`data: ${JSON.stringify({ citations: citations, recommendation: null, done: true })}\n\n`)
                        );
                        controller.close();
                    } catch (err: any) {
                        controller.enqueue(
                            encoder.encode(`data: ${JSON.stringify({ error: 'Failed to stream normal Gemini content: ' + err.message })}\n\n`)
                        );
                        controller.close();
                    }
                }
            });

            return new Response(normalStream, {
                headers: {
                    'Content-Type': 'text/event-stream; charset=utf-8',
                    'Cache-Control': 'no-cache, no-transform',
                    'Connection': 'keep-alive',
                    'X-Accel-Buffering': 'no'
                }
            });
        }

    } catch (error: any) {
        console.error('Gemini API Error details:', error);
        const errStream = new ReadableStream({
            start(controller) {
                controller.enqueue(
                    encoder.encode(`data: ${JSON.stringify({ error: 'Failed to generate AI response: ' + error.message })}\n\n`)
                );
                controller.close();
            }
        });

        return new Response(errStream, {
            headers: {
                'Content-Type': 'text/event-stream; charset=utf-8',
                'Cache-Control': 'no-cache, no-transform',
                'Connection': 'keep-alive',
                'X-Accel-Buffering': 'no'
            }
        });
    }
}
