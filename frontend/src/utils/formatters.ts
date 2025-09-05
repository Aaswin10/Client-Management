//format currency
export function formatCurrency(amount: number) {
    return new Intl.NumberFormat('en-NP', {
        style: 'currency',
        currency: 'NPR',
        minimumFractionDigits: 0,
    }).format(amount);
}
