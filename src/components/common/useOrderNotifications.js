import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "../../lib/api";

const POLL_MS = 20 * 1000;
const seenKey = (userId) => `nh-dashboard-orders-seen:${userId || "staff"}`;

const readSeen = (userId) => {
  try {
    return window.localStorage.getItem(seenKey(userId));
  } catch {
    return null;
  }
};

const writeSeen = (userId, value) => {
  try {
    window.localStorage.setItem(seenKey(userId), value);
  } catch {
    // Unread counts will simply restart next visit.
  }
};

/**
 * A short two-note chime. Browsers only allow sound after the page has been
 * clicked once, so the audio context is created on the first click and reused.
 */
let audioContext = null;
if (typeof window !== "undefined") {
  window.addEventListener(
    "pointerdown",
    () => {
      const Context = window.AudioContext || window.webkitAudioContext;
      if (!audioContext && Context) audioContext = new Context();
    },
    { once: true }
  );
}

const playChime = () => {
  if (!audioContext) return;
  const start = audioContext.currentTime;
  [880, 1320].forEach((frequency, index) => {
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    oscillator.frequency.value = frequency;
    oscillator.connect(gain).connect(audioContext.destination);
    const at = start + index * 0.18;
    gain.gain.setValueAtTime(0.0001, at);
    gain.gain.exponentialRampToValueAtTime(0.25, at + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, at + 0.3);
    oscillator.start(at);
    oscillator.stop(at + 0.32);
  });
};

export const notificationsSupported = () => typeof window !== "undefined" && "Notification" in window;

/**
 * Watches for new orders while the dashboard is open.
 *
 * - `latest` is the ten newest orders, `unread` how many arrived since this
 *   staff member last opened the bell (remembered per browser).
 * - Each order that arrives while the page is open is passed to `onNewOrder`,
 *   plays a chime and, when permitted, raises a desktop notification.
 */
export function useOrderNotifications({ userId, onNewOrder, describe }) {
  const [latest, setLatest] = useState([]);
  const [unread, setUnread] = useState(0);
  const [lastSeen, setLastSeen] = useState(null);
  const newestRef = useRef(null);
  const serverTimeRef = useRef(null);
  const callbacks = useRef({ onNewOrder, describe });

  useEffect(() => {
    callbacks.current = { onNewOrder, describe };
  });

  useEffect(() => {
    if (!userId) return undefined;
    let active = true;
    newestRef.current = null;

    // First visit: start counting from now rather than flagging old orders.
    const seen = readSeen(userId) || new Date().toISOString();
    writeSeen(userId, seen);

    const poll = async () => {
      try {
        const response = await api.get("/admin/order-notifications", { params: { since: readSeen(userId) || seen } });
        if (!active) return;
        const { latest: orders = [], unread: count = 0, serverTime } = response.data.data || {};
        serverTimeRef.current = serverTime;

        // Anything newer than the newest order this tab has already seen is new.
        const previousNewest = newestRef.current;
        if (previousNewest) {
          const arrived = orders.filter((order) => new Date(order.createdAt) > new Date(previousNewest)).reverse();
          arrived.forEach((order) => {
            callbacks.current.onNewOrder?.(order);
            if (notificationsSupported() && Notification.permission === "granted") {
              const { title, body } = callbacks.current.describe(order);
              const notice = new Notification(title, { body, tag: order._id, icon: "/favicon.svg" });
              notice.onclick = () => {
                window.focus();
                notice.close();
              };
            }
          });
          if (arrived.length) playChime();
        }
        if (orders[0]) newestRef.current = orders[0].createdAt;
        else if (!previousNewest) newestRef.current = new Date(0).toISOString();

        setLatest(orders);
        setUnread(count);
        setLastSeen(readSeen(userId) || seen);
      } catch {
        // A missed poll is retried on the next tick.
      }
    };

    poll();
    const timer = setInterval(poll, POLL_MS);
    window.addEventListener("focus", poll);
    return () => {
      active = false;
      clearInterval(timer);
      window.removeEventListener("focus", poll);
    };
  }, [userId]);

  /** Called when the bell is opened: everything listed now counts as read. */
  const markSeen = useCallback(() => {
    const now = serverTimeRef.current || new Date().toISOString();
    const stamp = new Date(now).toISOString();
    writeSeen(userId, stamp);
    setLastSeen(stamp);
    setUnread(0);
  }, [userId]);

  return { latest, unread, lastSeen, markSeen };
}
