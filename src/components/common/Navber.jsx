import React, { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import { IoSearch, IoClose, IoMenu } from "react-icons/io5";
import { BsBell, BsBellFill } from "react-icons/bs";
import { MdOutlineDarkMode, MdLightMode } from "react-icons/md";
import pro from "../../assets/pro.png";
import { useAuthStore } from "../zustendstore/AuthStore";
import { api, getErrorMessage } from "../../lib/api";

const Navber = ({ onMenuClick }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const dropdownRef = useRef(null);
  const { user, setUser, clearUser } = useAuthStore();
  const [profileOpen, setProfileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [profileEditOpen, setProfileEditOpen] = useState(false);
  const [dark, setDark] = useState(false);
  const [query, setQuery] = useState("");
  const [profile, setProfile] = useState({ fullname: "", phone: "", address: "", password: "" });
  const [message, setMessage] = useState("");
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    setProfile({ fullname: user?.fullname || "", phone: user?.phone || "", address: user?.address || "", password: "" });
  }, [user]);

  useEffect(() => {
    const closeMenus = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) setProfileOpen(false);
    };
    document.addEventListener("mousedown", closeMenus);
    return () => document.removeEventListener("mousedown", closeMenus);
  }, []);

  useEffect(() => {
    api.get("/checkout/all-orders")
      .then((response) => setNotifications((response.data.data || []).filter((order) => order.deliveryStatus === "pending").slice(0, 5)))
      .catch(() => setNotifications([]));
  }, [location.pathname]);

  const search = (event) => {
    event.preventDefault();
    const value = query.trim();
    if (value) navigate(`/all-product?search=${encodeURIComponent(value)}`);
  };

  const saveProfile = async (event) => {
    event.preventDefault();
    try {
      const response = await api.patch("/auth/profile", profile);
      setUser(response.data.data);
      setMessage("Profile updated successfully");
      setProfileEditOpen(false);
    } catch (error) {
      setMessage(getErrorMessage(error));
    }
  };

  const logout = async () => {
    try { await api.post("/auth/logout"); } finally { clearUser(); navigate("/login"); }
  };

  return <>
    <nav className="sticky top-0 z-30 border-b border-[#031d43] bg-linear-to-br from-[#062B63] to-[#1255A4] px-3 py-3 text-white sm:px-5">
      <div className="flex items-center justify-between gap-3">
        <button type="button" onClick={onMenuClick} className="rounded-lg p-2 hover:bg-white/20 md:hidden" aria-label="Open navigation"><IoMenu size={24} /></button>
        <h2 className="shrink-0 text-lg font-bold sm:text-2xl"><span className="text-white">N.H.</span><span className="text-emerald-300">Shop</span></h2>
        <form onSubmit={search} className="ml-auto flex min-w-0 max-w-xl flex-1 items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 sm:ml-8"><input value={query} onChange={(event) => setQuery(event.target.value)} className="min-w-0 w-full bg-transparent text-sm text-white outline-none placeholder:text-gray-300" type="search" placeholder="Search dashboard..." aria-label="Search dashboard" /><button type="submit" aria-label="Search"><IoSearch /></button></form>
        <div className="flex shrink-0 items-center gap-1 sm:gap-3">
          <button type="button" onClick={() => setDark((value) => !value)} className="rounded-full bg-white/20 p-2.5" aria-label="Toggle theme">{dark ? <MdLightMode /> : <MdOutlineDarkMode />}</button>
          <div className="relative"><button type="button" onClick={() => setNotificationsOpen((value) => !value)} className="relative rounded-full bg-white/20 p-2.5" aria-label="Notifications">{notifications.length ? <BsBellFill /> : <BsBell />} {notifications.length > 0 && <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px]">{notifications.length}</span>}</button>{notificationsOpen && <div className="absolute right-0 mt-3 w-72 rounded-xl bg-white p-4 text-black shadow-xl"><h3 className="font-semibold">Pending orders</h3>{notifications.length ? notifications.map((order) => <button type="button" key={order._id} onClick={() => navigate("/orders")} className="mt-3 block w-full border-b pb-2 text-left text-sm hover:text-green-700">{order.user?.fullname || "Guest"} has an order awaiting action</button>) : <p className="mt-3 text-sm text-gray-500">No new notifications</p>}</div>}</div>
          <div ref={dropdownRef} className="relative"><button type="button" onClick={() => setProfileOpen((value) => !value)} aria-label="Open profile"><img src={pro} alt="Profile" className="h-9 w-9 rounded-full border-2 border-white object-cover sm:h-10 sm:w-10" /></button>{profileOpen && <div className="absolute right-0 mt-3 w-64 rounded-xl bg-white p-4 text-black shadow-xl"><div className="flex items-center gap-3 border-b pb-3"><img src={pro} alt="" className="h-12 w-12 rounded-full" /><div className="min-w-0"><h3 className="truncate font-semibold">{user?.fullname || "Admin"}</h3><p className="truncate text-sm text-gray-500">{user?.email}</p><span className="text-xs uppercase text-green-600">{user?.role}</span></div></div><div className="mt-3 flex flex-col gap-2"><button type="button" onClick={() => { setProfileEditOpen(true); setProfileOpen(false); }} className="rounded-lg px-3 py-2 text-left hover:bg-gray-100">Edit profile</button><button type="button" onClick={() => setLogoutOpen(true)} className="rounded-lg px-3 py-2 text-left text-red-500 hover:bg-red-100">Logout</button></div></div>}</div>
        </div>
      </div>
    </nav>
    {message && <div className="fixed right-4 top-20 z-50 rounded-lg bg-white px-4 py-3 text-sm text-gray-800 shadow-xl">{message}</div>}
    {profileEditOpen && <Modal title="Edit admin profile" onClose={() => setProfileEditOpen(false)}><form onSubmit={saveProfile} className="space-y-3"><input value={profile.fullname} onChange={(event) => setProfile({ ...profile, fullname: event.target.value })} placeholder="Full name" className="w-full rounded-lg border p-3" required /><input value={profile.phone} onChange={(event) => setProfile({ ...profile, phone: event.target.value })} placeholder="Phone" className="w-full rounded-lg border p-3" /><input value={profile.address} onChange={(event) => setProfile({ ...profile, address: event.target.value })} placeholder="Address" className="w-full rounded-lg border p-3" /><input type="password" value={profile.password} onChange={(event) => setProfile({ ...profile, password: event.target.value })} placeholder="New password (optional)" className="w-full rounded-lg border p-3" /><button className="w-full rounded-lg bg-green-600 px-4 py-3 font-semibold text-white">Save changes</button></form></Modal>}
    {logoutOpen && <Modal title="Confirm logout" onClose={() => setLogoutOpen(false)}><p className="text-gray-600">Are you sure you want to logout?</p><div className="mt-5 flex justify-end gap-3"><button type="button" onClick={() => setLogoutOpen(false)} className="rounded-lg bg-gray-100 px-4 py-2">Cancel</button><button type="button" onClick={logout} className="rounded-lg bg-red-500 px-4 py-2 text-white">Logout</button></div></Modal>}
  </>;
};

function Modal({ title, onClose, children }) {
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}><div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl" onClick={(event) => event.stopPropagation()}><div className="mb-5 flex items-center justify-between"><h2 className="text-lg font-semibold text-gray-800">{title}</h2><button type="button" onClick={onClose} aria-label="Close"><IoClose size={22} className="text-gray-500" /></button></div>{children}</div></div>;
}

export default Navber;
