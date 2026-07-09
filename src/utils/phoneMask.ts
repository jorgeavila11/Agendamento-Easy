/**
 * Dynamic mask for Brazilian phone numbers.
 * Formats 11 digits as: (88) 9 9761-4430
 * Formats 10 digits as: (88) 8761-4430
 */
export function maskBrazilianPhone(value: string): string {
  // Remove all non-digits
  const digits = value.replace(/\D/g, "");
  
  // Truncate to maximum 11 digits
  const cleaned = digits.slice(0, 11);
  const len = cleaned.length;
  
  if (len === 0) {
    return "";
  }
  
  if (len <= 2) {
    return `(${cleaned}`;
  }
  
  if (len <= 6) {
    return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2)}`;
  }
  
  if (len <= 10) {
    return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 6)}-${cleaned.slice(6)}`;
  }
  
  // exactly 11 digits: (DD) 9 CCCC-CCCC (e.g. (88) 9 9761-4430)
  return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 3)} ${cleaned.slice(3, 7)}-${cleaned.slice(7)}`;
}
