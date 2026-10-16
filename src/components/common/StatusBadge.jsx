import { useLanguage } from "../../i18n/useLanguage";

const DELIVERY_STYLE = {
  pending: "bg-amber-400/20 text-amber-200",
  confirm: "bg-blue-400/20 text-blue-200",
  deliverd: "bg-green-400/20 text-green-200",
  cenceled: "bg-red-400/20 text-red-200",
};

const FRAUD_STYLE = {
  clean: "bg-white/10 text-white/70",
  review: "bg-amber-400/20 text-amber-200",
  blocked: "bg-red-400/20 text-red-200",
  verified: "bg-green-400/20 text-green-200",
  fake: "bg-red-500/30 text-red-100",
};

const RISK_STYLE = {
  low: "bg-green-400/20 text-green-200",
  medium: "bg-amber-400/20 text-amber-200",
  high: "bg-red-400/20 text-red-200",
};

const MERCHANT_STYLE = {
  pending: "bg-amber-400/20 text-amber-200",
  approved: "bg-sky-400/20 text-sky-200",
  trial: "bg-violet-400/20 text-violet-200",
  active: "bg-green-400/20 text-green-200",
  payment_due: "bg-orange-400/20 text-orange-200",
  suspended: "bg-red-400/20 text-red-200",
  rejected: "bg-red-500/30 text-red-100",
  locked: "bg-gray-900/60 text-white",
};

const APPROVAL_STYLE = {
  pending: "bg-amber-400/20 text-amber-200",
  approved: "bg-green-400/20 text-green-200",
  rejected: "bg-red-400/20 text-red-200",
};

const STEP_STYLE = {
  pending: "bg-amber-400/20 text-amber-200",
  confirmed: "bg-blue-400/20 text-blue-200",
  shipped: "bg-violet-400/20 text-violet-200",
  delivered: "bg-green-400/20 text-green-200",
  cancelled: "bg-red-400/20 text-red-200",
};

const PAYMENT_STYLE = {
  pending: "bg-amber-400/20 text-amber-200",
  approved: "bg-sky-400/20 text-sky-200",
  activated: "bg-green-400/20 text-green-200",
  rejected: "bg-red-400/20 text-red-200",
};

/** The status people see: finer than the stored one (see accountStatus on the API). */
const ACCOUNT_STYLE = {
  pending_approval: "bg-amber-400/20 text-amber-200",
  trial: "bg-violet-400/20 text-violet-200",
  active: "bg-green-400/20 text-green-200",
  payment_pending: "bg-sky-400/20 text-sky-200",
  payment_due: "bg-orange-400/20 text-orange-200",
  grace: "bg-yellow-400/20 text-yellow-100",
  suspended: "bg-red-400/20 text-red-200",
};

const TICKET_STYLE = {
  open: "bg-amber-400/20 text-amber-200",
  in_progress: "bg-blue-400/20 text-blue-200",
  resolved: "bg-green-400/20 text-green-200",
};

const capitalise = (value) => `${String(value).charAt(0).toUpperCase()}${String(value).slice(1)}`;

/**
 * Coloured pill for a delivery status, a fraud status, a risk level, a merchant
 * account status, a product's approval, a merchant's progress on an order, a
 * payment proof (`payment`, or `paymentShort` for tight spaces) or a support ticket.
 */
export default function StatusBadge({ kind, value }) {
  const { t } = useLanguage();
  const key = String(value || "").toLowerCase();

  const { style, label } = {
    delivery: { style: DELIVERY_STYLE[key], label: t(`orders.status${capitalise(key || "pending")}`) },
    fraud: { style: FRAUD_STYLE[key], label: t(`fraud.status${capitalise(key || "clean")}`) },
    risk: { style: RISK_STYLE[key], label: t(`fraud.level${capitalise(key || "low")}`) },
    merchant: { style: MERCHANT_STYLE[key], label: t(`mstatus.${key || "pending"}`) },
    approval: { style: APPROVAL_STYLE[key || "approved"], label: t(`approval.${key || "approved"}`) },
    step: { style: STEP_STYLE[key], label: t(`mstep.${key || "pending"}`) },
    payment: { style: PAYMENT_STYLE[key], label: t(`pstatus.${key || "pending"}`) },
    paymentShort: { style: PAYMENT_STYLE[key], label: t(`pstatusShort.${key || "pending"}`) },
    ticket: { style: TICKET_STYLE[key], label: t(`tstatus.${key || "open"}`) },
    account: { style: ACCOUNT_STYLE[key], label: t(`astatus.${key || "pending_approval"}`) },
  }[kind] || { style: "", label: value };

  return (
    <span className={`inline-block whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ${style || "bg-white/10 text-white/70"}`}>
      {label}
    </span>
  );
}
