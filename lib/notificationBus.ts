/**
 * Notification Bus (Retired)
 * All notifications are now handled directly via WhatsApp Cloud API / Twilio SMS.
 */
type Role = 'admin' | 'dealer' | 'customer';

interface Subscriber {
    id: string;
    role: Role;
    userId?: string;
    controller?: any;
}

export function subscribe(_sub: Subscriber): void {}
export function unsubscribe(_id: string): void {}
export function notifyRole(_role: Role, _userId?: string): void {}
export const notifyAdmin = () => {};
export const notifyDealer = (_dealerId: string) => {};
export const notifyCustomer = (_email: string) => {};
