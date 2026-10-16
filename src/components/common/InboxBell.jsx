import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { IoChatbubbleEllipses, IoChatbubbleEllipsesOutline } from "react-icons/io5";
import { api } from "../../lib/api";
import { useLanguage } from "../../i18n/useLanguage";
import { useNotificationText } from "./notificationText";

const POLL_MS = 30 * 1000;

/**
 * Bell for payment proofs, support tickets and subscription events — for
 * administrators and for merchants, each seeing only their own. Orders keep
 * their separate bell. Polls while the dashboard is open.
 */
export default function InboxBell({ role }) {
  const navigate = useNavigate();
  const { t, language, formatNumber } = useLanguage();
  const [data, setData] = useState({ latest: [], unread: 0 });
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const base = role === "merchant" ? "/merchant" : "/admin";

  const poll = useCallback(() => {
    api.get(`${base}/notifications`)
      .then((response) => setData(response.data.data))
      .catch(() => {});
  }, [base]);

  useEffect(() => {
    poll();
    const timer = setInterval(poll, POLL_MS);
    window.addEventListener("focus", poll);
    return () => {
      clearInterval(timer);
      window.removeEventListener("focus", poll);
    };
  }, [poll]);

  useEffect(() => {
    const close = (event) => ref.current && !ref.current.contains(event.target) && setOpen(false);
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const markRead = (ids) =>
    api.post(`${base}/notifications/read`, ids ? { ids } : {})
      .then((response) => setData((current) => ({ ...current, ...response.data.data })))
      .catch(() => {});

  const describe = useNotificationText(role);

  const openItem = (item) => {
    setOpen(false);
    if (!item.readAt) markRead([item._id]);
    if (item.link) navigate(item.link);
  };

  const when = (value) =>
    new Date(value).toLocaleString(language === "bn" ? "bn-BD" : "en-GB", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });

  const { latest, unread, counts } = data;

  return (
    <div className="relative" ref={ref}>
      <button type="button" onClick={() => setOpen((value) => !value)} className="relative rounded-full bg-white/20 p-2.5" aria-label={t("inbox.title")}>
        {unread ? <IoChatbubbleEllipses className="animate-pulse" /> : <IoChatbubbleEllipsesOutline />}
        {unread > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px]">
            {unread > 99 ? "99+" : formatNumber(unread)}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute -right-12 mt-3 w-[min(22rem,calc(100vw-1.5rem))] rounded-xl bg-white p-4 text-black shadow-xl sm:right-0">
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-semibold">{t("inbox.title")}</h3>
            {unread > 0 && (
              <button type="button" onClick={() => markRead()} className="text-xs text-green-700 hover:underline">
                {t("inbox.markAll")}
              </button>
            )}
          </div>
          {counts && (
            <p className="mt-1 text-xs text-gray-500">
              {t("inbox.counts", { payments: formatNumber(counts.pendingPayments + counts.approvedPayments), tickets: formatNumber(counts.unreadTickets) })}
            </p>
          )}
          <div className="mt-2 max-h-80 overflow-y-auto">
            {latest.length ? (
              latest.map((item) => (
                <button
                  type="button"
                  key={item._id}
                  onClick={() => openItem(item)}
                  className={`mt-1 flex w-full items-start gap-2 rounded-lg p-2 text-left text-sm hover:bg-gray-100 ${item.readAt ? "" : "bg-green-50"}`}
                >
                  <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${item.readAt ? "bg-transparent" : "bg-green-500"}`} />
                  <span className="min-w-0 flex-1">
                    <span className="block break-words">{describe(item)}</span>
                    <span className="block text-xs text-gray-500">{when(item.createdAt)}</span>
                  </span>
                </button>
              ))
            ) : (
              <p className="mt-3 text-sm text-gray-500">{t("inbox.empty")}</p>
            )}
          </div>
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              navigate(role === "merchant" ? "/merchant/notifications" : "/notifications");
            }}
            className="mt-3 w-full rounded-lg bg-[#062B63] py-2 text-sm font-semibold text-white"
          >
            {t("inbox.center")}
          </button>
        </div>
      )}
    </div>
  );
}
