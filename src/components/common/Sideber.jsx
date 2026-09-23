import { NavLink, useNavigate } from "react-router";
import { IoClose, IoSettingsSharp } from "react-icons/io5";
import { FaBorderAll, FaShopify, FaUsers, FaVideo } from "react-icons/fa6";
import { AiFillProduct } from "react-icons/ai";
import { MdOutlineLibraryBooks } from "react-icons/md";
import { VscArrowSwap } from "react-icons/vsc";
import { BsBarChartFill, BsShieldExclamation } from "react-icons/bs";
import { RiLogoutCircleRLine } from "react-icons/ri";
import { GiVerticalBanner } from "react-icons/gi";
import { api } from "../../lib/api";
import { useAuthStore } from "../zustendstore/AuthStore";
import { useLanguage } from "../../i18n/useLanguage";

const linkClass = ({ isActive }) =>
  `flex items-center gap-3 rounded-r-lg border-l-4 p-2 transition duration-200 ${
    isActive ? "border-green-300 bg-green-300/20" : "border-[#064e3b] hover:border-green-300 hover:bg-green-300/10"
  }`;

const Sideber = ({ open = false, onClose = () => {} }) => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { clearUser } = useAuthStore();

  const groups = [
    {
      title: t("nav.products"),
      items: [
        { to: "/add-product", label: t("nav.addProduct"), icon: FaShopify },
        { to: "/all-product", label: t("nav.allProducts"), icon: FaShopify },
      ],
    },
    {
      title: t("nav.category"),
      items: [
        { to: "/add-category", label: t("nav.addCategory"), icon: AiFillProduct },
        { to: "/all-category", label: t("nav.allCategories"), icon: AiFillProduct },
      ],
    },
    {
      title: t("nav.banner"),
      items: [
        { to: "/banner", label: t("nav.addBanner"), icon: GiVerticalBanner },
        { to: "/banner/all", label: t("nav.allBanners"), icon: GiVerticalBanner },
      ],
    },
  ];

  const singles = [
    { to: "/videos", label: t("nav.videos"), icon: FaVideo },
    { to: "/orders", label: t("nav.orders"), icon: MdOutlineLibraryBooks },
    { to: "/fraud-review", label: t("nav.fraud"), icon: BsShieldExclamation },
    { to: "/customers", label: t("nav.customers"), icon: FaUsers },
    { to: "/transactions", label: t("nav.transactions"), icon: VscArrowSwap },
    { to: "/analytics", label: t("nav.analytics"), icon: BsBarChartFill },
    { to: "/settings", label: t("nav.settings"), icon: IoSettingsSharp },
  ];

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
      {open && <button type="button" aria-label={t("common.close")} onClick={onClose} className="fixed inset-0 z-40 bg-black/50 md:hidden" />}

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-[min(82vw,300px)] overflow-y-auto border-r border-[#031d43] bg-[#062B63] px-2 pb-10 pt-5 transition-transform duration-300 md:w-[20%] md:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between gap-3 p-2">
          <NavLink to="/" onClick={onClose} className="flex items-center gap-3">
            <FaBorderAll className="text-[20px] text-white" />
            <span className="text-xl font-bold text-white">{t("nav.dashboard")}</span>
          </NavLink>
          <button type="button" onClick={onClose} className="text-white md:hidden" aria-label={t("common.close")}>
            <IoClose size={24} />
          </button>
        </div>

        <nav className="mt-6 space-y-6">
          {groups.map((group) => (
            <div key={group.title} className="border-t border-white/20 pt-4">
              <h2 className="px-2 pb-2 text-sm font-semibold uppercase tracking-wide text-white/60">{group.title}</h2>
              <div className="ml-3 space-y-1">
                {group.items.map(({ to, label, icon: Icon }) => (
                  <NavLink key={to} to={to} onClick={onClose} className={linkClass}>
                    <Icon className="shrink-0 text-[16px] text-white" />
                    <span className="font-medium text-white">{label}</span>
                  </NavLink>
                ))}
              </div>
            </div>
          ))}

          <div className="space-y-1 border-t border-white/20 pt-4">
            {singles.map(({ to, label, icon: Icon }) => (
              <NavLink key={to} to={to} onClick={onClose} className={linkClass}>
                <Icon className="shrink-0 text-[16px] text-white" />
                <span className="font-medium text-white">{label}</span>
              </NavLink>
            ))}
          </div>

          <div className="border-t border-white/20 pt-4">
            <button
              type="button"
              onClick={logout}
              className="flex w-full items-center gap-3 rounded-r-lg border-l-4 border-[#064e3b] p-2 text-left transition hover:border-red-400 hover:bg-red-400/10"
            >
              <RiLogoutCircleRLine className="shrink-0 text-[16px] text-white" />
              <span className="font-medium text-white">{t("nav.logout")}</span>
            </button>
          </div>
        </nav>
      </aside>
    </>
  );
};

export default Sideber;
