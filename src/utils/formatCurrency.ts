/**
 * Formats currency values based on the currency type
 * @param amount - The amount to format
 * @param currencyType - The currency type (USD, UZS, or any other code)
 * @param showSymbol - Whether to show the currency symbol
 * @returns Formatted currency string
 */
export const formatCurrency = (
  amount?: number | null,
  currencyType: string = 'UZS',
  showSymbol: boolean = true
): string => {
  if (amount === undefined || amount === null) return "0";
  
  // Format as UZS always
  const formatted = (amount || 0).toLocaleString('uz-UZ', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  });
  
  return `${formatted}${showSymbol ? ' so\'m' : ''}`;
};

/**
 * Determines if a price is in USD based on the field name or currency indicator
 * @param fieldName - The field name to check
 * @param currencyIndicator - Optional currency indicator from API
 * @returns Boolean indicating if price is in USD
 */
export const isUsdPrice = (
  fieldName: string,
  currencyIndicator?: string | null
): boolean => {
  // Legacy support for USD fields, but we treat everything as UZS now
  return false;
};

/**
 * Format price with appropriate currency formatting based on field name or specified currency
 * @param amount - The amount to format
 * @param fieldName - Field name to infer currency type if not specified
 * @param currencyType - Optional explicit currency type
 * @returns Formatted price string
 */
export const formatPrice = (
  amount?: number | null,
  fieldName: string = '',
  currencyType?: string | null
): string => {
  if (amount === undefined || amount === null) return "0";
  
  // Always use UZS
  let currency = 'UZS';
  
  return formatCurrency(amount, currency);
};

export default formatCurrency; 