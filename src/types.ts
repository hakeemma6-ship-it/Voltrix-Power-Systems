/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Subcategory {
  id: string;
  name: string;
  slug: string;
  description: string;
  specifications: Record<string, string>;
  features: string[];
  applications: string[];
  capacityRange: string;
  coolingType: string;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  category: 'servo' | 'ups' | 'battery' | 'inverter' | 'solar';
  description: string;
  features: string[];
  specs: Record<string, string>;
  subcategories?: Subcategory[];
  image: string;
}

/** Admin-created or inquiry-sourced customer record */
export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  location?: string;
  category?: string; // e.g. "UPS", "Stabilizer", "Solar", etc.
  notes?: string;
  source: 'manual' | 'inquiry'; // how the customer was added
  assignedDealerId?: string;
  assignedDealerName?: string;
  assignedDealers?: Array<{ id: string; name: string }>;
  linkedInquiryId?: string;
  status: 'PENDING' | 'new' | 'assigned' | 'in_discussion' | 'completed' | 'active';
  hasLogin?: boolean; // true once admin has generated credentials / user activated
  createdAt: string;
  updatedAt?: string;

  // Location details
  companyName?: string;
  address?: string;
  shopAddress?: string;
  areaLocality?: string;
  landmark?: string;
  district?: string;
  state?: string;
  city?: string;
  country?: string;
  zipcode?: string;
  pinCode?: string;
  gstin?: string;

  // Authentication & Onboarding
  password?: string;
  activationTokenHash?: string; // SHA-256 hash of one-time onboarding token
  activationTokenExpiry?: number; // 7 days (1 week) expiration timestamp
  activatedAt?: string;
  resetToken?: string;
  resetTokenExpiry?: number;

  // Invoice & Purchase Details (entered when dealer closes deal)
  invoiceNumber?: string;
  invoiceNumbers?: string[];
  purchaseDate?: string;
  dealsCount?: number;
  latestDealAmount?: number;
  latestDealProduct?: string;
}

export interface Dealer {
  id: string;
  _id?: string;
  companyName: string;
  email: string;
  phone: string;
  name: string;
  city: string;
  state: string;
  /** Simplified: pending → approved → suspended */
  status: 'pending' | 'approved' | 'suspended' | 'rejected';
  gstin?: string;
  registeredAt: string;
  approvedAt?: string;
  username?: string;
  password?: string;
  dealerId?: string;
  isSeenByAdmin?: boolean;

  // Commission Settings (set by admin on approval)
  commissionPercentage?: number;         // e.g. 5 for 5%
  perCustomerAssignmentFee?: number;     // e.g. 500 (fixed fee per assignment)

  // 2FA / OTP Authentication
  otpHash?: string;
  otpExpiry?: number;
  otpAttempts?: number;

  // Personal Details
  fatherName?: string;
  altPhone?: string;
  whatsappPhone?: string;
  dob?: string;
  profilePhoto?: string;

  // Business Details
  businessType?: 'Proprietorship' | 'Partnership' | 'Private Limited' | 'Distributor' | 'Retailer' | 'RegionalSupplier' | string;
  yearsOfExperience?: string | number;
  numberOfEmployees?: string | number;
  existingBrands?: string;
  monthlySalesCapacity?: string;
  website?: string;

  // Address Details
  shopAddress?: string;
  areaLocality?: string;
  landmark?: string;
  district?: string;
  country?: string;
  pinCode?: string;

  // Business Documents
  panNumber?: string;
  tradeLicense?: string;
  aadhaarNumber?: string;

  // Product Interest
  interestedProducts?: string[];
  notes?: string[];
  whatsappLogs?: { timestamp: string; message: string; direction: 'sent' | 'received' }[];
}

/** Recorded when a dealer closes a deal with a customer */
export interface DealClosure {
  id: string;
  dealerId: string;
  dealerCompanyName?: string;
  dealerPhone?: string;
  dealerEmail?: string;
  customerId: string;
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  closedAmount: number;                  // The total deal value the customer paid
  commissionPercentage: number;          // Snapshot of dealer's commission rate at time of closure
  commissionAmount: number;              // closedAmount × (commissionPercentage / 100)
  fixedAmount?: number;                  // Fixed amount snapshot based on admin set value for this dealer
  perCustomerAssignmentFee?: number;     // Alias / backward compatibility for fixedAmount
  totalAdminDue?: number;                // commissionAmount + fixedAmount
  productTitle?: string;                 // Title of product sold
  productType?: string;                  // Product type / category
  productCategory?: string;             // What product was sold (backward compatibility)
  description?: string;                  // Detailed description of the deal/product
  notes?: string;                        // Notes (backward compatibility)
  invoiceNumber?: string;                // Official invoice / bill number (e.g. INV-2026-001)
  invoiceUrl?: string;                   // URL or base64 Data URL of uploaded invoice document
  invoiceName?: string;                  // File name of the invoice document
  invoiceType?: string;                  // File MIME type (e.g. application/pdf, image/png)
  invoiceSize?: number;                  // File size in bytes
  paymentStatus?: 'pending' | 'paid';    // Dealer payment status for commission + fixed amount
  paidAt?: string;                       // Timestamp when dealer marked PAID
  paidNotes?: string;                    // Optional payment reference note by dealer
  adminSettled?: boolean;                // Confirmed & settled by Admin
  dealStatus?: 'pending_payment' | 'paid_by_dealer' | 'closed'; // High level deal closing status
  settledAt?: string;                    // Timestamp when admin confirmed and closed deal
  closedAt: string;
  createdAt: string;
  updatedAt?: string;
}

export interface TimelineEvent {
  id: string;
  timestamp: string;
  type: 'call' | 'whatsapp' | 'email' | 'comment' | 'meeting' | 'status_change' | 'system';
  remarks: string;
  nextFollowupDate?: string;
  userRole: 'admin' | 'dealer' | 'system' | 'customer';
  userName?: string;
}

export interface Inquiry {
  id: string;
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  createdAt: string;
  updatedAt?: string;
  status: 'new' | 'contacted' | 'assigned' | 'in_discussion' | 'converted' | 'lost' | string;
  notes?: string[];
  location?: string;
  latitude?: number;
  longitude?: number;
  addressLine1?: string;
  addressLine2?: string;
  zipcode?: string;
  city?: string;
  state?: string;
  country?: string;
  productInterest?: string;
  productCategory?: string;
  assignedDealerId?: string;
  assignedDealerName?: string;
  linkedCustomerId?: string;
  isSeenByAdmin?: boolean;
  isSeenByDealer?: boolean;
}

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  author: string;
  readTime: string;
  publishedAt: string;
  tags: string[];
  image: string;
}

export interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
}
