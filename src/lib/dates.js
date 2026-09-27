/**
 * Calendar helpers in shop time. The API reports by Dhaka day, so presets such
 * as "today" must be Dhaka's today even when the dashboard is opened abroad.
 */
const dhakaFormat = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Dhaka", year: "numeric", month: "2-digit", day: "2-digit" });

/** Today's Dhaka date as `YYYY-MM-DD`. */
export const todayInDhaka = () => dhakaFormat.format(new Date());

/** `YYYY-MM-DD` moved by `days` (negative goes back). */
export const shiftDate = (value, days) => {
  const date = new Date(`${value}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
};

/** The named ranges offered as one-click buttons on the orders page. */
export const datePresets = () => {
  const today = todayInDhaka();
  return {
    today: { from: today, to: today },
    yesterday: { from: shiftDate(today, -1), to: shiftDate(today, -1) },
    last7: { from: shiftDate(today, -6), to: today },
    thisMonth: { from: `${today.slice(0, 8)}01`, to: today },
    last30: { from: shiftDate(today, -29), to: today },
  };
};
