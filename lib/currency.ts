export function formatCurrency(amount: number, currency: string = 'PKR'): string {
  // Currency symbols map
  const symbols: { [key: string]: string } = {
    PKR: 'PKR ',
    USD: '$',
    EUR: '€',
    GBP: '£',
    AED: 'AED ',
    SAR: 'SAR ',
    INR: '₹'
  };

  const symbol = symbols[currency] || currency + ' ';
  
  return `${symbol}${amount.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
}