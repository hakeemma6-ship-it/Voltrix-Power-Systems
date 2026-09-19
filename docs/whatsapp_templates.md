# Voltrix CRM WhatsApp Message Templates Specification

This document provides a comprehensive catalogue of the WhatsApp Business API message templates required for the Voltrix Power Systems CRM. All templates below are designed to align with the Meta Developer Console standards and the current implementation in our Next.js backend endpoints.

---

## 📋 Meta Category Definitions
Meta categorizes WhatsApp templates into three categories. **All of these templates belong to the `UTILITY` category (Utility class)**:
* **UTILITY (Utility Class)**: Messaging related to a specific, agreed-upon transaction or account update (e.g., order confirmations, accounts setup, lead alerts, status updates, or notifications about customer inquiries/quotes). These messages are transactional and qualify for Meta's lower utility pricing rates.
* **MARKETING**: Promotional messages, offers, recommendations, or any communications that do not fall under Utility or Authentication.
* **AUTHENTICATION**: Passcodes, OTPs, or verification links required during security checkouts or register screens.

---

## 🔄 Workflow & Trigger Pipelines

### Flow A: Directly Registered Customers (Self-Sign Up)
```
[Customer Sign Up]
       │
       ▼ (Template A1: customer_signup_welcome) -> CUSTOMER NOTIFIED
[Customer Raises Inquiry]
       │
       ▼ (Template D2: admin_new_lead_alert) -> ADMIN NOTIFIED
[Admin Assigns Inquiry/Customer to Dealer]
       │
       ▼ (Template B4: lead_assigned_to_dealer) -> DEALER NOTIFIED
[Dealer Accepts Inquiry]
       │
       ▼ (Template A3: dealer_accepts_inquiry) -> CUSTOMER NOTIFIED
[Dealer Creates Quote]
       │
       ▼ (Template A4: quotation_received) -> CUSTOMER NOTIFIED
[Dealer Accepts/Rejects Quote]
       │
       ▼ (Template A5: quotation_status_update_customer) -> CUSTOMER NOTIFIED
       ▼ (Template D3: quotation_status_update_admin) -> ADMIN NOTIFIED
[Dealer Files Order from Quotation]
       │
       ▼ (Template A6: order_placed / jaspers_market_image_cta_v1) -> CUSTOMER NOTIFIED
       ▼ (Template D4: admin_new_order_alert) -> ADMIN NOTIFIED
[Order Status Updates (Processing, Shipped, etc.)]
       │
       ▼ (Template A7: order_status_update) -> CUSTOMER NOTIFIED
```

### Flow B: Manually Added Customers (From Marketing Leads)
```
[Admin Manually Creates Customer in CRM]
       │
       ▼ (Template A2: customer_welcome_credentials) -> CUSTOMER NOTIFIED
[Admin Assigns Customer to Dealer]
       │
       ▼ (Template B4: lead_assigned_to_dealer) -> DEALER NOTIFIED
[Dealer Accepts Inquiry]
       │
       ▼ (Template A3: dealer_accepts_inquiry) -> CUSTOMER NOTIFIED
[Dealer Creates Quote]
       │
       ▼ (Template A4: quotation_received) -> CUSTOMER NOTIFIED
[Dealer Accepts/Rejects Quote]
       │
       ▼ (Template A5: quotation_status_update_customer) -> CUSTOMER NOTIFIED
       ▼ (Template D3: quotation_status_update_admin) -> ADMIN NOTIFIED
[Dealer Files Order from Quotation]
       │
       ▼ (Template A6: order_placed / jaspers_market_image_cta_v1) -> CUSTOMER NOTIFIED
       ▼ (Template D4: admin_new_order_alert) -> ADMIN NOTIFIED
[Order Status Updates (Processing, Shipped, etc.)]
       │
       ▼ (Template A7: order_status_update) -> CUSTOMER NOTIFIED
```

### Flow C: Dealer Registration Workflow
```
[Dealer Submits Registration Form]
       │
       ▼ (Template B1: dealer_registration_received) -> DEALER NOTIFIED (Acknowledgement)
       ▼ (Template D1: admin_new_dealer_alert) -> ADMIN NOTIFIED
[Admin Approves/Suspends/Rejects Dealer]
       │
       ├─► Approved  ──► (Template B2: dealer_approved) -> DEALER NOTIFIED
       ├─► Suspended ──► (Template B3: dealer_suspended) -> DEALER NOTIFIED
       └─► Rejected  ──► (Template B5: dealer_rejected) -> DEALER NOTIFIED
```

---

## 👥 Category A: Customer-Facing Templates (`UTILITY`)

### A1. `customer_signup_welcome`<!--Changed this because meta warns the older version is not a utility -->
* **Trigger**: When a customer directly signs up on the website.
* **Recipient**: Registered Customer
* **Meta Category**: `UTILITY`
* **Body Content**:
  ```text
  Hello {{1}}, your Voltrix Power Systems customer account has been successfully registered. You can access your customer portal at {{2}} to view and manage your inquiries, quotations, and orders. Thank you for choosing Voltrix Power Systems.

  ```
* **Variables**:
  * `{{1}}`: Customer Full Name (e.g. `Jayesh Mehta`)
  * `{{2}}`: Customer Portal Login Link (e.g. `https://voltrixpowersystems.com/#login`)

### A2. `customer_welcome_credentials`<!--Changed this because meta warns the older version is not a utility -->
* **Trigger**: When the admin manually creates a customer in the CRM from a marketing lead and generates login credentials.
* **Recipient**: Manually Captured Customer
* **Meta Category**: `UTILITY`
* **Body Content**:
  ```text
  Hello *{{1}}*, your Customer Portal account has been created by Voltrix Power Systems. You can access your account and complete the initial account setup using the link below: {{2}}. Once setup is complete, you can manage your inquiries, quotations, and orders through the portal. Thank you for choosing Voltrix Power Systems.
  ```
* **Variables**:
  * `{{1}}`: Customer Full Name (e.g. `Aditya Nair`)
  * `{{2}}`: Portal Password Setup URL (e.g. `https://voltrixpowersystems.com/setup-password?token=cust_123`)

### A3. `dealer_accepts_inquiry`<!--Changed this because meta warns the older version is not a utility -->
* **Trigger**: When the assigned dealer accepts the inquiry reassigned by the administrator.
* **Recipient**: Customer
* **Meta Category**: `UTILITY`
* **Body Content**:
  ```text
  Hello {{1}}, our authorized regional partner "{{2}}" has accepted your Inquiry (ID: {{3}}). A technical consultant from their team will contact you shortly to guide you through design configurations and estimates.
  ```
* **Variables**:
  * `{{1}}`: Customer Full Name (e.g. `Jayesh Mehta`)
  * `{{2}}`: Dealer Business / Company Name (e.g. `Apollo Grid Solutions`)
  * `{{3}}`: Voltrix Inquiry ID (e.g. `inq_17992928`)

### A4. `quotation_received`<!--Changed this because meta warns the older version is not a utility -->
* **Trigger**: When a dealer creates a quotation for a customer.
* **Recipient**: Customer
* **Meta Category**: `UTILITY`
* **Body Content**:
  ```text
  Hello {{1}}, you have received a new price quotation for {{2}} (Total Amount: INR {{3}}) standard supply from authorized Voltrix partner {{4}}. Log in to your customer portal to view item specifications or place an order.
  ```
* **Variables**:
  * `{{1}}`: Customer Full Name (e.g. `Jayesh Mehta`)
  * `{{2}}`: Product Brand / Name summary (e.g. `100 kVA 3-Phase Servo Stabilizer`)
  * `{{3}}`: Grand Total price (incl. GST & deductions) (e.g. `2,45,000.00`)
  * `{{4}}`: Dealer Company Name (e.g. `Apollo Grid Solutions`)

### A5. `quotation_status_update_customer`<!--Changed this because meta warns the older version is not a utility -->
* **Trigger**: When the dealer accepts or rejects the customer's changes/counter-proposal, or explicitly issues a status update on a draft quote.
* **Recipient**: Customer
* **Meta Category**: `UTILITY`
* **Body Content**:
  ```text
  Hello {{1}}, the price quotation (ID: {{2}}) submitted by partner "{{3}}" for "{{4}}" has been updated to status: {{5}}. Visit your customer dashboard to review the terms or proceed to order placement.
  ```
* **Variables**:
  * `{{1}}`: Customer Full Name (e.g. `Jayesh Mehta`)
  * `{{2}}`: Voltrix Quotation ID (e.g. `quot_17993001`)
  * `{{3}}`: Dealer Company Name (e.g. `Apollo Grid Solutions`)
  * `{{4}}`: Product Name / Items summary (e.g. `Servo Stabilizer supply`)
  * `{{5}}`: Updated status (e.g. `Accepted`, `Revised`, `Suspended`, `Closed`)

### A6. `order_placed` / `jaspers_market_image_cta_v1`<!--Changed this because meta warns the older version is not a utility -->
* **Trigger**: When a dealer files a B2B order on behalf of the customer.
* **Recipient**: Customer
* **Meta Category**: `UTILITY`
* **Body Content**:
  ```text
  Hello *{{1}}*, Your order for *"{{2}}"* has been successfully placed by your assigned Voltrix partner *"{{3}}"*. Order Reference ID: {{4}}. Track your logistics progress inside the customer portal!
  ```
* **Variables**:
  * `{{1}}`: Customer Full Name (e.g. `Jayesh Mehta`)
  * `{{2}}`: Product Name / Model (e.g. `Air Cooled Servo Stabilizer`)
  * `{{3}}`: Dealer Agency Company Name (e.g. `Apollo Grid Solutions`)
  * `{{4}}`: Voltrix Order ID (e.g. `order_17849492`)

### A7. `order_status_update`<!--Changed this because meta warns the older version is not a utility -->
* **Trigger**: When the order status is updated by the admin/dealer during production (e.g. Assembly, Testing, Shipped, Delivered).
* **Recipient**: Customer
* **Meta Category**: `UTILITY`
* **Body Content**:
  ```text
  Hello {{1}}, your Voltrix order {{2}} status has been successfully updated to: {{3}}. Thank you for choosing Voltrix Power Systems.
  ```
* **Variables**:
  * `{{1}}`: Customer Full Name (e.g. `Jayesh Mehta`)
  * `{{2}}`: Voltrix Order ID (e.g. `order_17849492`)
  * `{{3}}`: New Order Status (e.g. `In Assembly`, `Quality Testing`, `Shipped / In Transit`, `Delivered`)

---

## 🏢 Category B: Dealer-Facing Templates (`UTILITY`)

### B1. `dealer_registration_received`
* **Trigger**: When a new dealer registers their reseller agency.
* **Recipient**: Onboarding Dealer
* **Meta Category**: `UTILITY`
* **Body Content**:
  ```text
  Hello {{1}}, thank you for registering your agency {{2}} with Voltrix Power Systems. Our operations staff has received your registration documentation and will review your profile details shortly. We will contact you once approved.
  ```
* **Variables**:
  * `{{1}}`: Dealer Contact Representative Name (e.g. `Rajesh Patel`)
  * `{{2}}`: Registered Business Company Name (e.g. `Saurashtra Solar & Power`)

### B2. `dealer_approved`
* **Trigger**: When the administrator approves a dealer's application.
* **Recipient**: Approved Dealer
* **Meta Category**: `UTILITY`
* **Body Content**:
  ```text
  Hello {{1}}, congratulations! Your B2B partner account for {{2}} has been approved. You now have full access to order placement, quotes, and lead desks. Log in to your portal to start.
  ```
* **Variables**:
  * `{{1}}`: Dealer Representative Name (e.g. `Rajesh Patel`)
  * `{{2}}`: Registered Business Company Name (e.g. `Saurashtra Solar & Power`)

### B3. `dealer_suspended`
* **Trigger**: When the administrator suspends a dealer's account credentials/privileges.
* **Recipient**: Suspended Dealer
* **Meta Category**: `UTILITY`
* **Body Content**:
  ```text
  Hello {{1}}, your B2B reseller account for {{2}} has been suspended. Please check your email or contact system administration at support@voltrix.com.
  ```
* **Variables**:
  * `{{1}}`: Dealer Representative Name (e.g. `Rajesh Patel`)
  * `{{2}}`: Registered Business Company Name (e.g. `Saurashtra Solar & Power`)
  
<!-- Not Needed this one is already added -->
### B4. `lead_assigned_to_dealer`
* **Trigger**: When admin assigns a customer inquiry/lead to a dealer.
* **Recipient**: Assigned Dealer
* **Meta Category**: `UTILITY`
* **Body Content**:
  ```text
  Hello B2B Partner {{1}}, a new customer lead (ID: {{2}}) has been assigned to you. Product interest: {{3}}. Customer Phone: {{4}}. Please log in to accept the lead and create a quotation.
  ```
* **Variables**:
  * `{{1}}`: Dealer Company Name (e.g. `Apollo Grid Solutions`)
  * `{{2}}`: Voltrix Inquiry ID or Customer ID (e.g. `inq_17992928`)
  * `{{3}}`: Product name or sizing interest (e.g. `100 kVA Servo Stabilizer`)
  * `{{4}}`: Customer Phone Number for reference (e.g. `919876543210`)

### B5. `dealer_rejected`
* **Trigger**: When admin rejects a dealer's pending application.
* **Recipient**: Rejected Dealer
* **Meta Category**: `UTILITY`
* **Body Content**:
  ```text
  Hello {{1}}, we regret to inform you that your B2B partner registration for {{2}} could not be approved at this time as it does not meet all verification criteria. Contact support at partners@voltrix.com.
  ```
* **Variables**:
  * `{{1}}`: Dealer Representative Name (e.g. `Rajesh Patel`)
  * `{{2}}`: Business Company Name (e.g. `Saurashtra Solar & Power`)

---

## 👑 Category D: Admin Alerts (`WHATSAPP_ADMIN_PHONE` / `UTILITY`)

### D1. `admin_new_dealer_alert` <!--this is also changed-->
* **Trigger**: When a new dealer self-registers on the website portal.
* **Recipient**: System Administrator
* **Meta Category**: `UTILITY`
* **Body Content**:
  ```text
  Admin Alert: New dealer registration submitted by {{1}} from {{2}} (Owner: {{3}}). Review details and approve/reject
  ```
* **Variables**:
  * `{{1}}`: Dealer Business Name (e.g. `Saurashtra Solar & Power`)
  * `{{2}}`: Location City / State or 'N/A' (e.g. `Rajkot`)
  * `{{3}}`: Owner/Agent Full Name (e.g. `Rajesh Patel`)
  

### D2. `admin_new_lead_alert` <!--this is also changed-->
* **Trigger**: When a chatbot interaction, sizer input, or website inquiry form registers a customer lead.
* **Recipient**: System Administrator
* **Meta Category**: `UTILITY`
* **Body Content**:
  ```text
  Admin Alert: Hot lead captured via {{1}}. Customer: {{2}}, Product: {{3}}, Phone: {{4}}. Assign a Dealer to Continue with the order.
  ```
* **Variables**:
  * `{{1}}`: Captured source channel (e.g. `Web Form`, `Sizer Copilot`)
  * `{{2}}`: Customer Name (e.g. `Jayesh Mehta`)
  * `{{3}}`: Product and category interest (e.g. `High capacity Stabilizer`)
  * `{{4}}`: Customer Contact Phone (e.g. `919876543210`)

### D3. `quotation_status_update_admin`
* **Trigger**: When a dealer accepts, cancels, or updates a quote status.
* **Recipient**: System Administrator
* **Meta Category**: `UTILITY`
* **Body Content**:
  ```text
  Admin Alert: Quotation {{1}} has been updated to {{2}} by B2B partner {{3}} for customer {{4}} (Total amount: INR {{5}}).
  ```
* **Variables**:
  * `{{1}}`: Voltrix Quotation ID (e.g. `quot_17993001`)
  * `{{2}}`: Updated status (e.g. `Accepted`, `Cancelled`, `Order Created`)
  * `{{3}}`: Dealer Company Name (e.g. `Apollo Grid Solutions`)
  * `{{4}}`: Customer Full Name (e.g. `Jayesh Mehta`)
  * `{{5}}`: Total Price quote (incl. Taxes) (e.g. `2,45,000.00`)

### D4. `admin_new_order_alert`
* **Trigger**: When a B2B partner files an order based on an active quote.
* **Recipient**: System Administrator
* **Meta Category**: `UTILITY`
* **Body Content**:
  ```text
  Admin Alert: B2B Order {{1}} submitted by dealer {{2}} for customer {{3}} (Product: {{4}}, Total: INR {{5}}).
  ```
* **Variables**:
  * `{{1}}`: Voltrix Order ID (e.g. `order_17849492`)
  * `{{2}}`: Dealer Company Name (e.g. `Apollo Grid Solutions`)
  * `{{3}}`: Customer Full Name (e.g. `Jayesh Mehta`)
  * `{{4}}`: Product Name & Capacity selection (e.g. `Servo Stabilizer 100 kVA`)
  * `{{5}}`: Total Order amount (e.g. `2,45,000.00`)

---

## 🛠️ Meta API JSON Payload Reference Example

This is a developer reference payload demonstrating how the NextJS backend invokes the Meta Cloud API for `lead_assigned_to_dealer` (Utility template B4) using `fetch`:

```json
{
  "messaging_product": "whatsapp",
  "recipient_type": "individual",
  "to": "918888888888",
  "type": "template",
  "template": {
    "name": "lead_assigned_to_dealer",
    "language": {
      "code": "en"
    },
    "components": [
      {
        "type": "body",
        "parameters": [
          { "type": "text", "text": "Apollo Grid Solutions" },
          { "type": "text", "text": "inq_17992928" },
          { "type": "text", "text": "100 kVA Servo Stabilizer" },
          { "type": "text", "text": "919876543210" }
        ]
      }
    ]
  }
}
```

---

## 🔍 Gap Analysis: What You Might Have Missed

After reviewing your workflow triggers, here are a few critical points and templates that you should consider introducing for a seamless setup:

1. **Inquiry Acknowledgment for Customers**: 
   * *What was missed*: In Flow A, if the customer submits an inquiry, you notify the admin (`admin_new_lead_alert`). However, to build trust, you duplicate this by sending an immediate receipt notification to the customer. 
   * *Recommendation*: Use `inquiry_received` template (already integrated in `/api/inquiries/route.ts`).
     * **Body text**: `"Hello {{1}}, we have successfully received your inquiry regarding \"{{2}}\". A Voltrix technical coordinator will follow up with pricing shortly. Thank you."`

2. **Inquiry Reject / Decline by Dealer**:
   * *What was missed*: In the flow, when Admin assigns a customer to a dealer, the dealer gets a notification. The dealer is expected to accept the inquiry. However, what happens if the dealer rejects or declines the lead, or has capacity issues? Under this scenario, the admin needs to be notified so they can assign the lead to someone else.
   * *Recommendation*: Create a template `dealer_declines_lead_admin_alert` (Utility, sent to Admin).
     * **Body text**: `"Admin Alert: B2B partner {{1}} has declined customer lead {{2}} (Customer: {{3}}). Please re-assign this lead in the Admin Panel."`

3. **Customer Action on Quote (Customer Accepts/Rejects Quote)**:
   * *What was missed*: Your flow reads: `Dealer Creates Quote -> CUSTOMER NOTIFIED -> Dealer Accepts/Rejects Quote -> ADMIN & CUSTOMER NOTIFIED`. Usually, the **customer** is the one who accepts or rejects a pricing quote, which then notifies the Dealer and Admin! If the dealer accepted/rejected a quote, it might represent a counter-offer scenario.
   * *Recommendation*: Ensure you register templates for both directions:
     1. Customer accepts the quote (Notifying Dealer & Admin): `customer_accepts_quote`
     2. Dealer cancels/updates the quote (Notifying Customer & Admin): `quotation_status_update_customer` / `quotation_status_update_admin`.

4. **Actionable Quick-Replies (Meta Interactive Elements)**:
   * *What was missed*: With WhatsApp Business API, you are not limited to plain text templates. You can add buttons.
     * For **Dealer Accepts Inquiry**, you can add a **Quick Reply Button**: `"Accept Lead"` or `"Reject Lead"`. Clicking this triggers a webhook post-back directly, updating your database in real-time.
     * For **Dealer Creates Quote**, you can add a CTA button sending customers directly to the portal: `"View Quote PDF"`.
     * For **Order Status Updates**, you can add a CTA button: `"Track Logistics Progress"`.
   * *Recommendation*: Upgrade your Meta template registrations to include standard CTA links and Quick-Reply buttons. It significantly increases click-through rates.