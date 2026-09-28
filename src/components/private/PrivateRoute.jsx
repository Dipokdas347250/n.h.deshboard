import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { api } from "../../lib/api";
import { useAuthStore } from "../zustendstore/AuthStore";
import { useLanguage } from "../../i18n/useLanguage";

/**
 * Gate for every dashboard page. Confirms the session belongs to an
 * administrator before rendering anything, and sends everyone else to sign in.
 */
export default function PrivateRoute({ children }) {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { setUser, clearUser } = useAuthStore();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    let active = true;

    api.get("/auth/getme")
      .then((response) => {
        if (!active) return;
        if (response.data.data?.role !== "admin") throw new Error("Not an administrator");
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
