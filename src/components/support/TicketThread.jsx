import { useState } from "react";
import { IoArrowUndo } from "react-icons/io5";
import { useLanguage } from "../../i18n/useLanguage";
import { ErrorNote, inputClass } from "../common/PageShell";
import { AttachmentList, AttachmentPicker } from "./Attachments";
import { EMPTY_ATTACHMENTS, appendAttachments, releaseAttachments } from "./attachmentFiles";

const formatWhen = (value, language) =>
  new Date(value).toLocaleString(language === "bn" ? "bn-BD" : "en-GB", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });

/**
 * The conversation in one support ticket and the reply box under it.
 * `viewer` is "merchant" or "admin": your own messages sit on the right.
 * `onReply(formData)` sends the reply and resolves once it is saved.
 */
export default function TicketThread({ ticket, viewer, onReply, extraFields = null, busy = false }) {
  const { t, language } = useLanguage();
  const [message, setMessage] = useState("");
  const [attachments, setAttachments] = useState(EMPTY_ATTACHMENTS);
  const [replyTo, setReplyTo] = useState(null);
  const [error, setError] = useState("");

  const byId = Object.fromEntries(ticket.messages.map((entry) => [entry._id, entry]));
  const author = (entry) =>
    entry.authorType === viewer ? t("support.you") : entry.authorType === "admin" ? entry.authorName || t("support.nhshop") : entry.authorName || t("pay.merchant");
  const snippet = (entry) => (entry.body || t("support.attachment")).slice(0, 80);

  const send = async (event) => {
    event.preventDefault();
    if (!message.trim() && !attachments.images.length && !attachments.audio) return;
    setError("");
    const data = appendAttachments(new FormData(), attachments);
    data.append("message", message);
    if (replyTo) data.append("replyTo", replyTo);
    try {
      await onReply(data);
      setMessage("");
      releaseAttachments(attachments);
      setAttachments(EMPTY_ATTACHMENTS);
      setReplyTo(null);
    } catch (caught) {
      setError(caught);
    }
  };

  return (
    <div className="space-y-4">
      <ol className="space-y-3">
        {ticket.messages.map((entry) => {
          const mine = entry.authorType === viewer;
          const quoted = entry.replyTo && byId[entry.replyTo];
          return (
            <li key={entry._id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[90%] rounded-2xl p-4 sm:max-w-[75%] ${mine ? "bg-green-500/20" : "bg-white/10"}`}>
                <div className="mb-1 flex flex-wrap items-center gap-x-3 text-xs text-white/60">
                  <span className="font-semibold text-white/80">{author(entry)}</span>
                  <span>{formatWhen(entry.createdAt, language)}</span>
                </div>
                {quoted && <p className="mb-2 border-l-2 border-white/40 pl-2 text-xs text-white/60">{snippet(quoted)}</p>}
                {entry.body && <p className="whitespace-pre-wrap break-words text-sm leading-6">{entry.body}</p>}
                <AttachmentList attachments={entry.attachments} />
                <button type="button" onClick={() => setReplyTo(entry._id)} className="mt-2 inline-flex items-center gap-1 text-xs text-white/50 hover:text-white">
                  <IoArrowUndo /> {t("support.reply")}
                </button>
              </div>
            </li>
          );
        })}
      </ol>

      <form onSubmit={send} className="space-y-3 rounded-2xl bg-white/5 p-4">
        {viewer === "merchant" && ticket.status === "resolved" && <p className="text-xs text-amber-200">{t("support.reopenNote")}</p>}
        <ErrorNote message={error} />
        {replyTo && byId[replyTo] && (
          <div className="flex items-center justify-between gap-2 rounded-lg bg-white/10 px-3 py-2 text-xs text-white/70">
            <span className="truncate">{t("support.replyingTo", { text: snippet(byId[replyTo]) })}</span>
            <button type="button" onClick={() => setReplyTo(null)} className="shrink-0 underline">
              {t("support.cancelReply")}
            </button>
          </div>
        )}
        <label htmlFor="ticket-reply" className="sr-only">
          {t("support.reply")}
        </label>
        <textarea
          id="ticket-reply"
          rows={3}
          maxLength={3000}
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          placeholder={t("support.replyPlaceholder")}
          className={inputClass}
        />
        <AttachmentPicker value={attachments} onChange={setAttachments} onError={setError} idPrefix="reply" />
        <div className="flex flex-wrap items-center justify-end gap-3">
          {extraFields}
          <button disabled={busy} className="rounded-lg bg-green-500 px-5 py-2 text-sm font-semibold text-white hover:bg-green-400 disabled:opacity-40">
            {busy ? t("support.sending") : t("support.send")}
          </button>
        </div>
      </form>
    </div>
  );
}
