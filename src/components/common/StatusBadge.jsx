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

const capitalise = (value) => `${String(value).charAt(0).toUpperCase()}${String(value).slice(1)}`;

/** Coloured pill for a delivery status, a fraud status or a risk level. */
export default function StatusBadge({ kind, value }) {
  const { t } = useLanguage();
  const key = String(value || "").toLowerCase();

  const { style, label } = {
    delivery: { style: DELIVERY_STYLE[key], label: t(`orders.status${capitalise(key || "pending")}`) },
    fraud: { style: FRAUD_STYLE[key], label: t(`fraud.status${capitalise(key || "clean")}`) },
    risk: { style: RISK_STYLE[key], label: t(`fraud.level${capitalise(key || "low")}`) },
  }[kind] || { style: "", label: value };

  return (
    <span className={`inline-block whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ${style || "bg-white/10 text-white/70"}`}>
      {label}
    </span>
  );
}
