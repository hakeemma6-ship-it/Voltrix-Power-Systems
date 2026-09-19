/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Customer Search and Formatting Helper
 * Supports 4-way matching across:
 *  1. Customer Name
 *  2. Mobile Number (formatted or raw digits)
 *  3. Invoice Number (case-insensitive & alphanumeric normalized)
 *  4. Purchase Date (multiple formats: DD/MM/YYYY, DD-MM-YYYY, YYYY-MM-DD, month names, year)
 */

export function matchesCustomerSearch(customer: any, search: string): boolean {
  if (!search || !search.trim()) return true;
  if (!customer) return false;

  const q = search.trim().toLowerCase();
  const cleanQ = q.replace(/[^a-zA-Z0-9]/g, '');

  // 1. Customer Name Match
  if (customer.name && typeof customer.name === 'string') {
    if (customer.name.toLowerCase().includes(q)) return true;
  }

  // 2. Mobile Number Match
  if (customer.phone && typeof customer.phone === 'string') {
    const rawPhone = customer.phone.toLowerCase();
    const cleanPhone = customer.phone.replace(/\D/g, '');
    if (rawPhone.includes(q)) return true;
    if (cleanQ && cleanPhone.includes(cleanQ)) return true;
  }

  // 3. Invoice Number Match
  const candidateInvoices: string[] = [];
  if (customer.invoiceNumber && typeof customer.invoiceNumber === 'string') {
    candidateInvoices.push(customer.invoiceNumber);
  }
  if (Array.isArray(customer.invoiceNumbers)) {
    customer.invoiceNumbers.forEach((inv: any) => {
      if (typeof inv === 'string') candidateInvoices.push(inv);
    });
  }

  for (const inv of candidateInvoices) {
    const invLower = inv.toLowerCase();
    const cleanInv = invLower.replace(/[^a-zA-Z0-9]/g, '');
    if (invLower.includes(q)) return true;
    if (cleanQ && cleanInv.includes(cleanQ)) return true;
  }

  // 4. Purchase Date Match
  const candidateDates: string[] = [];
  if (customer.purchaseDate && typeof customer.purchaseDate === 'string') {
    candidateDates.push(customer.purchaseDate);
  }
  if (customer.closedAt && typeof customer.closedAt === 'string') {
    candidateDates.push(customer.closedAt);
  }

  for (const dateStr of candidateDates) {
    if (!dateStr) continue;
    if (dateStr.toLowerCase().includes(q)) return true;

    try {
      const d = new Date(dateStr);
      if (!isNaN(d.getTime())) {
        const day = d.getDate();
        const dayPadded = String(day).padStart(2, '0');
        const month = d.getMonth() + 1;
        const monthPadded = String(month).padStart(2, '0');
        const year = d.getFullYear();
        const monthShort = d.toLocaleString('en-US', { month: 'short' }).toLowerCase();
        const monthLong = d.toLocaleString('en-US', { month: 'long' }).toLowerCase();

        const formattedVariations = [
          `${day}/${month}/${year}`,
          `${dayPadded}/${monthPadded}/${year}`,
          `${day}-${month}-${year}`,
          `${dayPadded}-${monthPadded}-${year}`,
          `${year}-${monthPadded}-${dayPadded}`,
          `${day} ${monthShort} ${year}`,
          `${dayPadded} ${monthShort} ${year}`,
          `${day} ${monthLong} ${year}`,
          `${monthShort} ${day}, ${year}`,
          `${monthLong} ${day}, ${year}`,
          `${monthShort} ${year}`,
          monthShort,
          monthLong,
          String(year)
        ];

        if (formattedVariations.some(v => v.includes(q))) {
          return true;
        }
      }
    } catch { }
  }

  // Optional: Also check email or product category for convenience
  if (customer.email && typeof customer.email === 'string' && customer.email.toLowerCase().includes(q)) {
    return true;
  }
  if (customer.category && typeof customer.category === 'string' && customer.category.toLowerCase().includes(q)) {
    return true;
  }

  return false;
}

/**
 * Formats a purchase date ISO string into a clean, human-readable format (e.g. "16 Sep 2026")
 */
export function formatPurchaseDate(dateStr?: string): string {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  } catch {
    return dateStr;
  }
}
