/**
 * A credit history line's amount as it affects available credit: + adds,
 * − takes away. "used" has no sign: it spends credit already reserved, so the
 * available balance does not move.
 */
export function ledgerAmount(entry, formatPrice) {
  const amount = formatPrice(Math.abs(entry.amount));
  if (entry.type === "used") return amount;
  if (entry.type === "adjusted") return entry.amount < 0 ? `− ${amount}` : `+ ${amount}`;
  return ["earned", "released"].includes(entry.type) ? `+ ${amount}` : `− ${amount}`;
}

/** Badge colours for a referral's status. */
export const REFERRAL_STYLE = {
  pending: "bg-amber-400/20 text-amber-200",
  credited: "bg-green-400/20 text-green-200",
  void: "bg-white/10 text-white/60",
};
