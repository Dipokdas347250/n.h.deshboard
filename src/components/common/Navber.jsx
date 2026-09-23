import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import { IoSearch, IoClose, IoMenu } from "react-icons/io5";
import { BsBell, BsBellFill } from "react-icons/bs";
import pro from "../../assets/pro.png";
import { api } from "../../lib/api";
import { useAuthStore } from "../zustendstore/AuthStore";
import { useLanguage } from "../../i18n/useLanguage";
import LanguageSwitcher from "./LanguageSwitcher";
import { Field, inputClass } from "./PageShell";

const Navber = ({ onMenuClick }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t, apiMessage } = useLanguage();
  const { user, setUser, clearUser } = useAuthStore();
  const dropdownRef = useRef(null);
  const notificationRef = useRef(null);

  const [profileOpen, setProfileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [profileEditOpen, setProfileEditOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [profile, setProfile] = useState({ fullname: "", phone: "", address: "", password: "" });
  const [profileUserId, setProfileUserId] = useState(null);
  const [toast, setToast] = useState("");
  const [notifications, setNotifications] = useState([]);

  // Fill the edit form from the signed-in account as soon as it is known.
  if (user && user._id !== profileUserId) {
    setProfileUserId(user._id);
    setProfile({ fullname: user.fullname || "", phone: user.phone || "", address: user.address || "", password: "" });
  }

  useEffect(() => {
    const closeMenus = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) setProfileOpen(false);
      if (notificationRef.current && !notificationRef.current.contains(event.target)) setNotificationsOpen(false);
    };
    document.addEventListener("mousedown", closeMenus);
    return () => document.removeEventListener("mousedown", closeMenus);
  }, []);

  // Anything still waiting on staff: unconfirmed orders and flagged ones.
  useEffect(() => {
    let active = true;

    api.get("/checkout/all-orders")
      .then((response) => {
        if (!active) return;
        setNotifications(
          (response.data.data || [])
            .filter((order) => order.deliveryStatus === "pending" || order.fraudStatus === "review")
            .slice(0, 6)
        );
      })
      .catch(() => {
        if (active) setNotifications([]);
      });

    return () => {
      active = false;
    };
  }, [location.pathname]);

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
        phone: profile.phone,
        address: profile.address,
        ...(profile.password ? { password: profile.password } : {}),
      });
      setUser(response.data.data);
      setProfile((current) => ({ ...current, password: "" }));
      setToast(t("auth.profileUpdated"));
      setProfileEditOpen(false);
    } catch (error) {
      setToast(apiMessage(error));
    }
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
                onClick={() => setNotificationsOpen((open) => !open)}
                className="relative rounded-full bg-white/20 p-2.5"
                aria-label={t("nav.notifications")}
              >
                {notifications.length ? <BsBellFill /> : <BsBell />}
                {notifications.length > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px]">
                    {notifications.length}
                  </span>
                )}
              </button>

              {notificationsOpen && (
                <div className="absolute right-0 mt-3 w-72 rounded-xl bg-white p-4 text-black shadow-xl">
                  <h3 className="font-semibold">{t("nav.pendingOrders")}</h3>
                  {notifications.length ? (
                    notifications.map((order) => (
                      <button
                        type="button"
                        key={order._id}
                        onClick={() => {
                          setNotificationsOpen(false);
                          navigate(order.fraudStatus === "review" ? "/fraud-review" : "/orders");
                        }}
                        className="mt-3 block w-full border-b pb-2 text-left text-sm hover:text-green-700"
                      >
                        {t("nav.orderAwaiting", { name: order.customer?.name || order.user?.fullname || t("orders.guest") })}
                      </button>
                    ))
                  ) : (
                    <p className="mt-3 text-sm text-gray-500">{t("nav.noNotifications")}</p>
                  )}
                </div>
              )}
            </div>

            <div ref={dropdownRef} className="relative">
              <button type="button" onClick={() => setProfileOpen((open) => !open)} aria-label={t("nav.editProfile")}>
                <img src={pro} alt="" className="h-9 w-9 rounded-full border-2 border-white object-cover sm:h-10 sm:w-10" />
              </button>

              {profileOpen && (
                <div className="absolute right-0 mt-3 w-64 rounded-xl bg-white p-4 text-black shadow-xl">
                  <div className="flex items-center gap-3 border-b pb-3">
                    <img src={pro} alt="" className="h-12 w-12 rounded-full" />
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

      {profileEditOpen && (
        <Modal title={t("nav.editProfile")} onClose={() => setProfileEditOpen(false)}>
          <form onSubmit={saveProfile} className="space-y-3 text-white">
            <Field label={t("auth.fullname")} htmlFor="profile-name">
              <input id="profile-name" required value={profile.fullname} onChange={(event) => setProfile({ ...profile, fullname: event.target.value })} className={inputClass} />
            </Field>
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
