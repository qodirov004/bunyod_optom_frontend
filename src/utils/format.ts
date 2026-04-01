export const formatMoney = (amount: number | null | undefined): string => {
  if (amount === null || amount === undefined) {
    return '0.00';
  }
  return amount.toLocaleString('uz-UZ', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }) + " so'm";
}; 