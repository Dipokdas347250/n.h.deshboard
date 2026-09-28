import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { IoSearch, IoClose, IoMenu, IoCamera } from "react-icons/io5";
import { BsBell, BsBellFill } from "react-icons/bs";
import pro from "../../assets/pro.png";
import { api } from "../../lib/api";
import { useAuthStore } from "../zustendstore/AuthStore";
import { useLanguage } from "../../i18n/useLanguage";
import LanguageSwitcher from "./LanguageSwitcher";
import { Field, inputClass } from "./PageShell";
import { useOrderNotifications, notificationsSupported } from "./useOrderNotifications";

const ALERT_MS = 10 * 1000;

const Navber = ({ onMenuClick }) => {
  const navigate = useNavigate();
  const { t, apiMessage, language, formatPrice } = useLanguage();
  const { user, setUser, clearUser } = useAuthStore();
  const dropdownRef = useRef(null);
  const notificationRef = useRef(null);

  const [profileOpen, setProfileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [profileEditOpen, setProfileEditOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [profile, setProfile] = useState({ fullname: "", email: "", phone: "", address: "", password: "", currentPassword: "" });
  const [profileUserId, setProfileUserId] = useState(null);
  const [toast, setToast] = useState("");
  const [alerts, setAlerts] = useState([]);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [permission, setPermission] = useState(() => (notificationsSupported() ? Notification.permission : "unsupported"));

  const avatar = user?.photo || pro;
  const customerName = (order) => order.customer?.name || t("orders.guest");
  const formatWhen = (value) =>
    new Date(value).toLocaleString(language === "bn" ? "bn-BD" : "en-GB", {
      day: "numeric",
      month: "short",
      hour: "numeric",
      minute: "2-digit",
    });

  const { latest, unread, lastSeen, markSeen } = useOrderNotifications({
    userId: user?._id,
    describe: (order) => ({
      title: t("notify.newOrderTitle"),
      body: t("notify.newOrderBody", { name: customerName(order), amount: formatPrice(order.totalprice), order: order.orderNumber }),
    }),
    onNewOrder: (order) => {
      setAlerts((current) => [...current.slice(-2), order]);
      setTimeout(() => setAlerts((current) => current.filter((item) => item._id !== order._id)), ALERT_MS);
    },
  });

  // Fill the edit form from the signed-in account as soon as it is known.
  if (user && user._id !== profileUserId) {
    setProfileUserId(user._id);
    setProfile({ fullname: user.fullname || "", email: user.email || "", phone: user.phone || "", address: user.address || "", password: "", currentPassword: "" });
  }

  const emailChanged = profile.email.trim().toLowerCase() !== (user?.email || "").toLowerCase();

  useEffect(() => {
    const closeMenus = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) setProfileOpen(false);
      if (notificationRef.current && !notificationRef.current.contains(event.target)) setNotificationsOpen(false);
    };
    document.addEventListener("mousedown", closeMenus);
    return () => document.removeEventListener("mousedown", closeMenus);
  }, []);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = setTimeout(() => setToast(""), 3000);
    return () => clearTimeout(timer);
  }, [toast]);

  const search = (event) => {
    event.preventDefault();
    const value = query.trim();
    if (value) navigate(`/all-product?search=${encodeURIComponent(value)}`);
  };

  const saveProfile = async (event) => {
    event.preventDefault();
    try {
      const response = await api.patch("/auth/profile", {
        fullname: profile.fullname,
        email: profile.email,
        phone: profile.phone,
        address: profile.address,
        ...(profile.password ? { password: profile.password } : {}),
        ...(emailChanged ? { currentPassword: profile.currentPassword } : {}),
      });
      setUser(response.data.data);
      setProfile((current) => ({ ...current, email: response.data.data.email, password: "", currentPassword: "" }));
      setToast(t("auth.profileUpdated"));
      setProfileEditOpen(false);
    } catch (error) {
      setToast(apiMessage(error));
    }
  };

  const uploadPhoto = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    const data = new FormData();
    data.append("photo", file);
    setPhotoBusy(true);
    try {
      const response = await api.patch("/auth/profile/photo", data);
      setUser(response.data.data);
      setToast(t("auth.photoUpdated"));
    } catch (error) {
      setToast(apiMessage(error));
    } finally {
      setPhotoBusy(false);
    }
  };

  const toggleNotifications = () => {
    setNotificationsOpen((open) => {
      if (!open) markSeen();
      return !open;
    });
  };

  const enableDesktopAlerts = async () => {
    if (!notificationsSupported()) return;
    setPermission(await Notification.requestPermission());
  };

  const openOrder = (order) => {
    setNotificationsOpen(false);
    setAlerts((current) => current.filter((item) => item._id !== order._id));
    navigate(order.fraudStatus === "review" ? "/fraud-review" : "/orders");
  };

  const logout = async () => {
    try {
      await api.post("/auth/logout");
    } finally {
      clearUser();
      navigate("/login", { replace: true });
    }
  };

  return (
    <>
      <nav className="sticky top-0 z-30 border-b border-[#031d43] bg-linear-to-br from-[#062B63] to-[#1255A4] px-3 py-3 text-white sm:px-5">
        <div className="flex items-center justify-between gap-3">
          <button type="button" onClick={onMenuClick} className="rounded-lg p-2 hover:bg-white/20 md:hidden" aria-label={t("nav.dashboard")}>
            <IoMenu size={24} />
          </button>

          <h2 className="shrink-0 text-lg font-bold sm:text-2xl">
            <span className="text-white">N.H.</span>
            <span className="text-emerald-300">Shop</span>
          </h2>

          <form onSubmit={search} className="ml-auto flex min-w-0 max-w-xl flex-1 items-center gap-2 rounded-lg border border-white/30 px-3 py-2 sm:ml-8">
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="w-full min-w-0 bg-transparent text-sm text-white outline-none placeholder:text-white/50"
              type="search"
              placeholder={t("nav.searchPlaceholder")}
              aria-label={t("common.search")}
            />
            <button type="submit" aria-label={t("common.search")}>
              <IoSearch />
            </button>
          </form>

          <div className="flex shrink-0 items-center gap-1 sm:gap-3">
            <LanguageSwitcher className="hidden sm:flex" />

            <div className="relative" ref={notificationRef}>
              <button
                type="button"
                onClick={toggleNotifications}
                className="relative rounded-full bg-white/20 p-2.5"
                aria-label={t("nav.notifications")}
              >
                {unread ? <BsBellFill className="animate-pulse" /> : <BsBell />}
                {unread > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px]">
                    {unread > 99 ? "99+" : unread}
                  </span>
                )}
              </button>

              {notificationsOpen && (
                <div className="absolute -right-12 mt-3 w-[min(22rem,calc(100vw-1.5rem))] rounded-xl bg-white p-4 text-black shadow-xl sm:right-0">
                  <h3 className="font-semibold">{t("notify.latestOrders")}</h3>

                  {permission === "default" && (
                    <button
                      type="button"
                      onClick={enableDesktopAlerts}
                      className="mt-3 w-full rounded-lg bg-green-50 px-3 py-2 text-left text-xs text-green-800 hover:bg-green-100"
                    >
                      {t("notify.enableDesktop")}
                    </button>
                  )}
                  {permission === "denied" && <p className="mt-3 text-xs text-gray-500">{t("notify.desktopBlocked")}</p>}

                  <div className="mt-2 max-h-80 overflow-y-auto">
                    {latest.length ? (
                      latest.map((order) => {
                        const isNew = lastSeen && new Date(order.createdAt) > new Date(lastSeen);
                        return (
                          <button
                            type="button"
                            key={order._id}
                            onClick={() => openOrder(order)}
                            className={`mt-1 flex w-full items-start gap-2 rounded-lg p-2 text-left text-sm hover:bg-gray-100 ${isNew ? "bg-green-50" : ""}`}
                          >
                            <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${isNew ? "bg-green-500" : "bg-transparent"}`} />
                            <span className="min-w-0 flex-1">
                              <span className="block truncate font-medium">
                                {t("notify.orderFrom", { name: customerName(order) })}
                              </span>
                              <span className="block text-xs text-gray-500">
                                {order.orderNumber} · {formatPrice(order.totalprice)} · {formatWhen(order.createdAt)}
                              </span>
                            </span>
                          </button>
                        );
                      })
                    ) : (
                      <p className="mt-3 text-sm text-gray-500">{t("nav.noNotifications")}</p>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setNotificationsOpen(false);
                      navigate("/orders");
                    }}
                    className="mt-3 w-full rounded-lg bg-[#062B63] py-2 text-sm font-semibold text-white"
                  >
                    {t("notify.viewAll")}
                  </button>
                </div>
              )}
            </div>

            <div ref={dropdownRef} className="relative">
              <button type="button" onClick={() => setProfileOpen((open) => !open)} aria-label={t("nav.editProfile")}>
                <img src={avatar} alt="" className="h-9 w-9 rounded-full border-2 border-white object-cover sm:h-10 sm:w-10" />
              </button>

              {profileOpen && (
                <div className="absolute right-0 mt-3 w-64 rounded-xl bg-white p-4 text-black shadow-xl">
                  <div className="flex items-center gap-3 border-b pb-3">
                    <img src={avatar} alt="" className="h-12 w-12 shrink-0 rounded-full object-cover" />
                    <div className="min-w-0">
                      <h3 className="truncate font-semibold">{user?.fullname}</h3>
                      <p className="truncate text-sm text-gray-500">{user?.email}</p>
                      <span className="text-xs uppercase text-green-600">{user?.role}</span>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-col gap-2">
                    <button type="button" onClick={() => { setProfileEditOpen(true); setProfileOpen(false); }} className="rounded-lg px-3 py-2 text-left hover:bg-gray-100">
                      {t("nav.editProfile")}
                    </button>
                    <button type="button" onClick={() => { setLogoutOpen(true); setProfileOpen(false); }} className="rounded-lg px-3 py-2 text-left text-red-500 hover:bg-red-50">
                      {t("nav.logout")}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {toast && <div className="fixed right-4 top-20 z-50 rounded-lg bg-white px-4 py-3 text-sm text-gray-800 shadow-xl">{toast}</div>}

      {alerts.length > 0 && (
        <div className="no-print fixed bottom-4 right-4 z-50 flex w-[min(22rem,calc(100vw-2rem))] flex-col gap-2" role="status" aria-live="polite">
          {alerts.map((order) => (
            <div key={order._id} className="flex items-start gap-3 rounded-xl border-l-4 border-green-500 bg-white p-4 text-sm text-gray-800 shadow-2xl">
              <BsBellFill className="mt-0.5 shrink-0 text-green-600" />
              <button type="button" onClick={() => openOrder(order)} className="min-w-0 flex-1 text-left">
                <span className="block font-semibold">{t("notify.newOrderTitle")}</span>
                <span className="block text-gray-600">
                  {t("notify.newOrderBody", { name: customerName(order), amount: formatPrice(order.totalprice), order: order.orderNumber })}
                </span>
              </button>
              <button
                type="button"
                onClick={() => setAlerts((current) => current.filter((item) => item._id !== order._id))}
                aria-label={t("common.close")}
                className="text-gray-400 hover:text-gray-700"
              >
                <IoClose />
              </button>
            </div>
          ))}
        </div>
      )}

      {profileEditOpen && (
        <Modal title={t("nav.editProfile")} onClose={() => setProfileEditOpen(false)}>
          <div className="mb-5 flex items-center gap-4">
            <img src={avatar} alt="" className="h-20 w-20 shrink-0 rounded-full border-2 border-white/40 object-cover" />
            <div>
              <label
                htmlFor="profile-photo"
                className={`inline-flex cursor-pointer items-center gap-2 rounded-lg bg-white/15 px-4 py-2 text-sm text-white hover:bg-white/25 ${photoBusy ? "pointer-events-none opacity-50" : ""}`}
              >
                <IoCamera />
                {photoBusy ? t("common.saving") : t("auth.changePhoto")}
              </label>
              <input id="profile-photo" type="file" accept="image/png,image/jpeg,image/webp" onChange={uploadPhoto} className="sr-only" />
              <p className="mt-1 text-xs text-white/50">{t("auth.photoHint")}</p>
            </div>
          </div>

          <form onSubmit={saveProfile} className="space-y-3 text-white">
            <Field label={t("auth.fullname")} htmlFor="profile-name">
              <input id="profile-name" required value={profile.fullname} onChange={(event) => setProfile({ ...profile, fullname: event.target.value })} className={inputClass} />
            </Field>
            <Field label={t("auth.email")} htmlFor="profile-email">
              <input id="profile-email" required type="email" value={profile.email} onChange={(event) => setProfile({ ...profile, email: event.target.value })} className={inputClass} />
            </Field>
            {emailChanged && (
              <Field label={t("auth.currentPassword")} hint={t("auth.currentPasswordHint")} htmlFor="profile-current-password">
                <input id="profile-current-password" required type="password" autoComplete="current-password" value={profile.currentPassword} onChange={(event) => setProfile({ ...profile, currentPassword: event.target.value })} className={inputClass} />
              </Field>
            )}
            <Field label={t("auth.phone")} htmlFor="profile-phone">
              <input id="profile-phone" value={profile.phone} onChange={(event) => setProfile({ ...profile, phone: event.target.value })} className={inputClass} />
            </Field>
            <Field label={t("auth.address")} htmlFor="profile-address">
              <input id="profile-address" value={profile.address} onChange={(event) => setProfile({ ...profile, address: event.target.value })} className={inputClass} />
            </Field>
            <Field label={t("auth.newPassword")} hint={t("auth.newPasswordHint")} htmlFor="profile-password">
              <input id="profile-password" type="password" minLength={8} value={profile.password} onChange={(event) => setProfile({ ...profile, password: event.target.value })} className={inputClass} />
            </Field>
            <button className="w-full rounded-lg bg-green-600 px-4 py-3 font-semibold text-white">{t("common.save")}</button>
          </form>
        </Modal>
      )}

      {logoutOpen && (
        <Modal title={t("nav.logout")} onClose={() => setLogoutOpen(false)}>
          <p className="text-white/80">{t("nav.confirmLogout")}</p>
          <div className="mt-5 flex justify-end gap-3">
            <button type="button" onClick={() => setLogoutOpen(false)} className="rounded-lg bg-white/15 px-4 py-2 text-white">
              {t("common.cancel")}
            </button>
            <button type="button" onClick={logout} className="rounded-lg bg-red-500 px-4 py-2 text-white">
              {t("nav.logout")}
            </button>
          </div>
        </Modal>
      )}
    </>
  );
};

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose} role="presentation">
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl bg-[#062B63] p-5 shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">{title}</h2>
          <button type="button" onClick={onClose} aria-label="Close">
            <IoClose size={22} className="text-white/70" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export default Navber;
