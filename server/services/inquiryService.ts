/**
 * server/services/inquiryService.ts
 *
 * Encapsulates all customer inquiry/support ticket logic.
 * Reuses the central Voltrix database layer (db.inquiries and MongoDB).
 */

import { db, ensureDb, isMongoReady, getMongoDb, persistWrite } from '@/lib/db';
import { normalizePhoneNumber } from '@/lib/phone';
import type { Inquiry, Customer } from '@/types';

export class InquiryService {
    /**
     * Resolves the customer record by customerId.
     */
    private static async getCustomer(customerId: string): Promise<Customer | null> {
        await ensureDb();
        if (!customerId) return null;

        const cust = db.customers?.find((c: any) => c.id === customerId || (c as any)._id?.toString() === customerId);
        if (cust) return cust;

        if (isMongoReady()) {
            const mongoDb = getMongoDb();
            try {
                const doc = await mongoDb.collection('customers').findOne({
                    $or: [{ id: customerId }, { _id: customerId }]
                });
                if (doc) return { ...doc, id: doc._id?.toString() || doc.id };
            } catch (err) {
                console.error('[InquiryService.getCustomer] MongoDB lookup failed:', err);
            }
        }
        return null;
    }

    /**
     * Retrieves inquiries belonging to an authenticated customerId.
     */
    public static async getCustomerInquiries(customerId: string, limit: number = 5): Promise<Inquiry[]> {
        await ensureDb();
        if (!customerId) return [];

        const customer = await this.getCustomer(customerId);
        const normPhone = customer?.phone ? normalizePhoneNumber(customer.phone) : '';
        const userEmail = (customer?.email || '').toLowerCase().trim();

        let inquiries: Inquiry[] = (db.inquiries || []) as Inquiry[];

        if (isMongoReady()) {
            const mongoDb = getMongoDb();
            try {
                const filters: any[] = [{ linkedCustomerId: customerId }, { id: customer?.linkedInquiryId }];
                if (normPhone) {
                    filters.push({ phone: new RegExp(normPhone.slice(-10)) });
                }
                if (userEmail) {
                    filters.push({ email: userEmail });
                }
                const mongoInqs = await mongoDb.collection('inquiries').find({ $or: filters.filter(f => Object.values(f)[0]) }).toArray();
                if (mongoInqs && mongoInqs.length > 0) {
                    const mappedMongoInqs = mongoInqs.map((i: any) => ({
                        ...i,
                        id: i.id || i._id?.toString()
                    }));
                    const inqMap = new Map<string, Inquiry>();
                    inquiries.forEach(i => inqMap.set(i.id, i));
                    mappedMongoInqs.forEach((i: Inquiry) => inqMap.set(i.id, i));
                    inquiries = Array.from(inqMap.values());
                }
            } catch (err) {
                console.error('[InquiryService.getCustomerInquiries] MongoDB query failed:', err);
            }
        }

        const matched = inquiries.filter((i: any) => {
            const matchCustId = i.linkedCustomerId === customerId;
            const matchLink = customer?.linkedInquiryId === i.id;
            const matchPhone = normPhone && i.phone && (normalizePhoneNumber(i.phone).slice(-10) === normPhone.slice(-10));
            const matchEmail = userEmail && i.email && (i.email.toLowerCase().trim() === userEmail);
            return matchCustId || matchLink || matchPhone || matchEmail;
        });

        matched.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
        return matched.slice(0, limit);
    }

    /**
     * Returns the latest inquiry submitted by the customer.
     */
    public static async getLatestInquiry(customerId: string): Promise<Inquiry | null> {
        const inqs = await this.getCustomerInquiries(customerId, 1);
        return inqs.length > 0 ? inqs[0] : null;
    }

    /**
     * Creates a new support inquiry or callback request for the customer.
     */
    public static async createCustomerInquiry(
        customerId: string,
        data: { subject: string; message: string; productInterest?: string }
    ): Promise<Inquiry> {
        await ensureDb();
        const customer = await this.getCustomer(customerId);

        const newInq: Inquiry = {
            id: `inq_wa_${Date.now()}`,
            name: customer?.name || 'Voltrix Customer',
            email: customer?.email || 'customer@voltrixpower.com',
            phone: customer?.phone || '',
            subject: data.subject || 'WhatsApp Assistant Request',
            message: data.message,
            productInterest: data.productInterest || customer?.category || 'Power Solutions',
            status: 'new',
            linkedCustomerId: customerId,
            createdAt: new Date().toISOString(),
            notes: [`Created via WhatsApp Customer Assistant on ${new Date().toLocaleString()}`],
        };

        if (!db.inquiries) db.inquiries = [];
        db.inquiries.unshift(newInq);
        await persistWrite('inquiries', newInq.id, newInq);

        return newInq;
    }
}
