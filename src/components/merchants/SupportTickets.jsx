import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import { api } from "../../lib/api";
import { merchantCode } from "../../lib/merchantCode";
import { useLanguage } from "../../i18n/useLanguage";
import { PageShell, ErrorNote, EmptyNote, selectClass } from "../common/PageShell";
import StatusBadge from "../common/StatusBadge";
import TicketThread from "../support/TicketThread";
import { TicketRow } from "../merchant/MerchantSupport";

const TABS = ["new", "unresolved", "open", "in_progress", "resolved", "all"];
const STATUSES = ["open", "in_progress", "resolved"];

const chipClass = (active) =>
  `rounded-full px-4 py-2 text-sm font-semibold transition ${active ? "bg-white text-[#062B63]" : "bg-white/10 text-white hover:bg-white/20"}`;

/** Every merchant's support requests, unread first. */
export default function SupportTickets() {
  const { t, apiMessage, formatNumber } = useLanguage();
  const [tab, setTab] = useState("unresolved");
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    api.get("/admin/support-tickets", { params: { status: tab } })
      .then((response) => active && setData(response.data.data))
      .catch((caught) => {
        if (!active) return;
        setData({ tickets: [], counts: {} });
        setError(apiMessage(caught));
      });
    return () => {
      active = false;
    };
  }, [tab, apiMessage]);

  return (
    <PageShell title={t("nav.supportTickets")} subtitle={t("support.adminSubtitle")}>
      <ErrorNote message={error} />
      <div className="mb-5 flex flex-wrap gap-2" role="group">
        {TABS.map((key) => (
          <button key={key} type="button" onClick={() => setTab(key)} aria-pressed={tab === key} className={chipClass(tab === key)}>
            {key === "all" ? t("common.all") : key === "unresolved" ? t("support.unresolved") : key === "new" ? t("support.newTickets") : t(`tstatus.${key}`)}
            {data?.counts?.[key] !== undefined ? ` · ${formatNumber(data.counts[key])}` : ""}
          </button>
        ))}
      </div>

      {data === null ? (
        <p className="text-white/70">{t("common.loading")}</p>
      ) : data.tickets.length ? (
        <ul className="max-w-4xl space-y-3">
          {data.tickets.map((ticket) => (
            <TicketRow key={ticket._id} ticket={ticket} to={`/merchants/support/${ticket._id}`} showMerchant />
          ))}
        </ul>
      ) : (
        <EmptyNote message={t("support.noneAdmin")} />
      )}
    </PageShell>
  );
}

/** One ticket: who sent it, the conversation, and the reply and status controls. */
export function AdminTicket() {
  const { id } = useParams();
  const { t, apiMessage, formatDate, formatPrice } = useLanguage();
  const [ticket, setTicket] = useState(null);
  const [replyStatus, setReplyStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(() => api.get(`/admin/support-tickets/${id}`).then((response) => setTicket(response.data.data)), [id]);

  useEffect(() => {
    load().catch((caught) => setError(apiMessage(caught)));
  }, [load, apiMessage]);

  const reply = async (data) => {
    setBusy(true);
    if (replyStatus) data.append("status", replyStatus);
    try {
      const response = await api.post(`/admin/support-tickets/${id}/messages`, data);
      setTicket(response.data.data);
      setReplyStatus("");
    } catch (caught) {
      throw apiMessage(caught);
    } finally {
      setBusy(false);
    }
  };

  const changeStatus = async (status) => {
    setBusy(true);
    setError("");
    try {
      const response = await api.patch(`/admin/support-tickets/${id}`, { status });
      setTicket(response.data.data);
    } catch (caught) {
      setError(apiMessage(caught));
    } finally {
      setBusy(false);
    }
  };

  const merchant = ticket?.merchant;

  return (
    <PageShell
      title={ticket ? ticket.subject : t("nav.supportTickets")}
      subtitle={ticket ? `${t("support.ticket")} ${ticket.ticketNumber}` : ""}
      actions={
        <Link to="/merchants/support" className="rounded-lg bg-white/15 px-4 py-2 text-sm hover:bg-white/25">
          {t("support.back")}
        </Link>
      }
    >
      <ErrorNote message={error} />
      {!ticket ? (
        !error && <p className="text-white/70">{t("common.loading")}</p>
      ) : (
        <div className="grid gap-6 xl:grid-cols-[1fr_18rem]">
          <TicketThread
            ticket={ticket}
            viewer="admin"
            onReply={reply}
            busy={busy}
            extraFields={
              <label className="flex items-center gap-2 text-sm text-white/70">
                {t("support.setStatus")}
                <select value={replyStatus} onChange={(event) => setReplyStatus(event.target.value)} className={`${selectClass} !w-auto !p-2`}>
                  <option value="">—</option>
                  {STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {t(`tstatus.${status}`)}
                    </option>
                  ))}
                </select>
              </label>
            }
          />

          <aside className="order-first space-y-4 xl:order-none">
            <section className="rounded-2xl bg-white/10 p-4 text-sm">
              <p className="mb-2 text-white/60">{t("support.status")}</p>
              <div className="flex flex-wrap gap-2">
                {STATUSES.map((status) => (
                  <button
                    key={status}
                    type="button"
                    disabled={busy || ticket.status === status}
                    onClick={() => changeStatus(status)}
                    aria-pressed={ticket.status === status}
                    className={`rounded-full px-3 py-1.5 text-xs font-semibold transition disabled:cursor-default ${
                      ticket.status === status ? "bg-white text-[#062B63]" : "bg-white/10 hover:bg-white/20"
                    }`}
                  >
                    {t(`tstatus.${status}`)}
                  </button>
                ))}
              </div>
            </section>

            {merchant && (
              <section className="space-y-1 rounded-2xl bg-white/10 p-4 text-sm">
                <p className="text-white/60">{t("pay.merchant")}</p>
                <p className="text-base font-semibold">{merchant.name}</p>
                <p className="font-mono text-xs text-white/60">
                  {t("pay.merchantId")}: {merchantCode(merchant._id)}
                </p>
                <p className="text-white/70">{merchant.phone}</p>
                <p className="break-all text-white/70">{merchant.email}</p>
                <div className="flex flex-wrap gap-1 pt-1">
                  <StatusBadge kind="merchant" value={merchant.status} />
                  {merchant.locked && <StatusBadge kind="merchant" value="locked" />}
                </div>
                <p className="pt-1 text-xs text-white/60">
                  {t("pay.fee")}: {formatPrice(merchant.monthlyFee)} · {t("pay.paidUntil")}: {merchant.paidUntil ? formatDate(merchant.paidUntil) : "—"}
                </p>
                <div className="flex flex-wrap gap-2 pt-2">
                  <Link to={`/merchants/payments?merchant=${merchant._id}`} className="rounded-lg bg-white/15 px-3 py-1.5 text-xs hover:bg-white/25">
                    {t("nav.paymentProofs")}
                  </Link>
                  <Link to={`/merchants/audit?merchant=${merchant._id}`} className="rounded-lg bg-white/15 px-3 py-1.5 text-xs hover:bg-white/25">
                    {t("nav.auditLog")}
                  </Link>
                </div>
              </section>
            )}
          </aside>
        </div>
      )}
    </PageShell>
  );
}
