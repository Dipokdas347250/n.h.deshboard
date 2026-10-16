import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { api } from "../../lib/api";
import { useLanguage } from "../../i18n/useLanguage";
import { PageShell, ErrorNote, EmptyNote, Field, inputClass } from "../common/PageShell";
import StatusBadge from "../common/StatusBadge";
import { AttachmentPicker } from "../support/Attachments";
import { EMPTY_ATTACHMENTS, appendAttachments, releaseAttachments } from "../support/attachmentFiles";
import TicketThread from "../support/TicketThread";

/** One row in a ticket list, shared with the administrator's list. */
export function TicketRow({ ticket, to, showMerchant = false }) {
  const { t, formatDate } = useLanguage();
  return (
    <li>
      <Link to={to} className={`block rounded-xl p-4 transition hover:bg-white/15 ${ticket.unread ? "bg-white/15 ring-1 ring-green-300/50" : "bg-white/10"}`}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="min-w-0 truncate font-semibold">
            {ticket.unread && <span className="mr-2 rounded-full bg-green-400 px-2 py-0.5 text-[10px] font-bold text-[#062B63]">{t("support.unread")}</span>}
            {ticket.subject}
          </span>
          <StatusBadge kind="ticket" value={ticket.status} />
        </div>
        {ticket.preview && <p className="mt-1 truncate text-sm text-white/60">{ticket.preview}</p>}
        <p className="mt-1 text-xs text-white/50">
          {ticket.ticketNumber}
          {showMerchant && ticket.merchant ? ` · ${ticket.merchant.name}` : ""} · {t("support.lastUpdate", { date: formatDate(ticket.lastMessageAt) })}
        </p>
      </Link>
    </li>
  );
}

/** The merchant's support requests and the form to open a new one. Open even while suspended. */
export default function MerchantSupport() {
  const { t, apiMessage } = useLanguage();
  const navigate = useNavigate();
  const [tickets, setTickets] = useState(null);
  const [form, setForm] = useState({ subject: "", message: "" });
  const [attachments, setAttachments] = useState(EMPTY_ATTACHMENTS);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    api.get("/merchant/support-tickets")
      .then((response) => active && setTickets(response.data.data))
      .catch((caught) => {
        if (!active) return;
        setTickets([]);
        setError(apiMessage(caught));
      });
    return () => {
      active = false;
    };
  }, [apiMessage]);

  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    const data = appendAttachments(new FormData(), attachments);
    data.append("subject", form.subject);
    data.append("message", form.message);
    try {
      const response = await api.post("/merchant/support-tickets", data);
      releaseAttachments(attachments);
      navigate(`/merchant/support/${response.data.data._id}`);
    } catch (caught) {
      setError(apiMessage(caught));
      setBusy(false);
    }
  };

  return (
    <PageShell title={t("support.title")} subtitle={t("support.subtitle")}>
      <div className="grid gap-6 lg:grid-cols-2">
        <form onSubmit={submit} className="space-y-4 rounded-2xl bg-white/10 p-5">
          <h2 className="text-lg font-bold">{t("support.new")}</h2>
          <ErrorNote message={error} />
          <Field label={t("support.subject")} htmlFor="ticket-subject">
            <input
              id="ticket-subject"
              required
              maxLength={150}
              value={form.subject}
              placeholder={t("support.subjectPlaceholder")}
              onChange={(event) => setForm({ ...form, subject: event.target.value })}
              className={inputClass}
            />
          </Field>
          <Field label={t("support.description")} htmlFor="ticket-message">
            <textarea
              id="ticket-message"
              rows={5}
              maxLength={3000}
              required={!attachments.images.length && !attachments.audio}
              value={form.message}
              onChange={(event) => setForm({ ...form, message: event.target.value })}
              className={inputClass}
            />
          </Field>
          <AttachmentPicker value={attachments} onChange={setAttachments} onError={setError} idPrefix="new-ticket" />
          <button disabled={busy} className="w-full rounded-lg bg-green-500 py-3 font-semibold text-white hover:bg-green-400 disabled:opacity-40">
            {busy ? t("support.sending") : t("support.send")}
          </button>
        </form>

        <section>
          {tickets === null ? (
            <p className="text-white/70">{t("common.loading")}</p>
          ) : tickets.length ? (
            <ul className="space-y-3">
              {tickets.map((ticket) => (
                <TicketRow key={ticket._id} ticket={ticket} to={`/merchant/support/${ticket._id}`} />
              ))}
            </ul>
          ) : (
            <EmptyNote message={t("support.none")} />
          )}
        </section>
      </div>
    </PageShell>
  );
}

/** One of the merchant's own tickets, with N H Shop's replies. */
export function MerchantTicket() {
  const { id } = useParams();
  const { t, apiMessage } = useLanguage();
  const [ticket, setTicket] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => api.get(`/merchant/support-tickets/${id}`).then((response) => setTicket(response.data.data)), [id]);

  useEffect(() => {
    load().catch((caught) => setError(apiMessage(caught)));
  }, [load, apiMessage]);

  const reply = async (data) => {
    setBusy(true);
    try {
      const response = await api.post(`/merchant/support-tickets/${id}/messages`, data);
      setTicket(response.data.data);
    } catch (caught) {
      throw apiMessage(caught);
    } finally {
      setBusy(false);
    }
  };

  return (
    <PageShell
      title={ticket ? ticket.subject : t("support.title")}
      subtitle={ticket?.ticketNumber}
      actions={
        <div className="flex items-center gap-3">
          {ticket && <StatusBadge kind="ticket" value={ticket.status} />}
          <Link to="/merchant/support" className="rounded-lg bg-white/15 px-4 py-2 text-sm hover:bg-white/25">
            {t("support.back")}
          </Link>
        </div>
      }
    >
      <ErrorNote message={error} />
      {ticket ? <TicketThread ticket={ticket} viewer="merchant" onReply={reply} busy={busy} /> : !error && <p className="text-white/70">{t("common.loading")}</p>}
    </PageShell>
  );
}
