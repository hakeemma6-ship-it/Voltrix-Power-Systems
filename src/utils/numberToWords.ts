/**
 * Converts a number into Indian Rupees amount in words formatting.
 * Handles numbers up to crores.
 */
export function numberToWordsInRupees(num: number): string {
    if (num === 0) return 'Rupee Zero Only';

    // Round to nearest integer for display
    num = Math.round(num);

    const a = [
        '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
        'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'
    ];
    const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

    function numToWords(n: number): string {
        if (n < 20) return a[n];
        if (n < 100) return b[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + a[n % 10] : '');
        if (n < 1000) return a[Math.floor(n / 100)] + ' Hundred' + (n % 100 !== 0 ? ' and ' + numToWords(n % 100) : '');
        return '';
    }

    let result = '';

    // Crores (1,00,00,000)
    const crores = Math.floor(num / 10000000);
    if (crores > 0) {
        result += numToWords(crores) + ' Crore ';
        num %= 10000000;
    }

    // Lakhs (1,00,000)
    const lakhs = Math.floor(num / 100000);
    if (lakhs > 0) {
        result += numToWords(lakhs) + ' Lakh ';
        num %= 100000;
    }

    // Thousands (1,000)
    const thousands = Math.floor(num / 1000);
    if (thousands > 0) {
        result += numToWords(thousands) + ' Thousand ';
        num %= 1000;
    }

    // Hundreds & Tens
    if (num > 0) {
        result += numToWords(num);
    }

    return `Rupees ${result.trim()} Only`;
}
