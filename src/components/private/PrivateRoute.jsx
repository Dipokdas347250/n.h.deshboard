import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { api } from "../../lib/api";
import { useAuthStore } from "../zustendstore/AuthStore";
import { useLanguage } from "../../i18n/useLanguage";

/** Accounts that may use the dashboard. Which pages each one sees is decided in `RootLayout`. */
const DASHBOARD_ROLES = ["admin", "merchant"];

/**
 * Gate for every dashboard page. Confirms the session belongs to an
 * administrator or a merchant before rendering anything, and sends everyone
 * else to sign in. The API checks the role again on every request.
 */
export default function PrivateRoute({ children }) {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { setUser, clearUser } = useAuthStore();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    let active = true;

    api.get("/auth/me")
      .then((response) => {
        if (!active) return;
        if (!DASHBOARD_ROLES.includes(response.data.data?.role)) throw new Error("Not a dashboard account");
        setUser(response.data.data);
        setChecked(true);
      })
      .catch(() => {
        if (!active) return;
        clearUser();
        navigate("/login", { replace: true });
      });

    return () => {
      active = false;
    };
  }, [navigate, setUser, clearUser]);

  if (!checked) {
    return <div className="flex min-h-screen items-center justify-center bg-[#062B63] text-white">{t("common.loading")}</div>;
  }

  return children;
}
