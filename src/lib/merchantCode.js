/** A short, readable merchant ID for staff to quote, e.g. M-3F9A2C. */
export const merchantCode = (id) => (id ? `M-${String(id).slice(-6).toUpperCase()}` : "");
