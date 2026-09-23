import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { api } from "../../lib/api";
import { useLanguage } from "../../i18n/useLanguage";
import { useAuthStore } from "../zustendstore/AuthStore";
import AuthShell from "./AuthShell";
import { Field, inputClass } from "../common/PageShell";

export default function Login() {
  const navigate = useNavigate();
  const { t, apiMessage } = useLanguage();
  const { setUser } = useAuthStore();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const change = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.value }));

  const submit = async (event) => {
    event.preventDefault();
    if (!form.email || !form.password) {
      setError(t("auth.allFieldsRequired"));
      return;
    }

    setError("");
    setBusy(true);
    try {
      // `scope: "dashboard"` makes the API reject shoppers who have no staff role.
      const response = await api.post("/auth/login", { ...form, scope: "dashboard" });
      setUser(response.data.data);
      navigate("/");
    } catch (caught) {
      setError(apiMessage(caught));
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthShell title={t("auth.loginTitle")} subtitle={t("auth.loginSubtitle")}>
      <form onSubmit={submit} className="space-y-4">
        {error && <p className="rounded-lg bg-red-500/20 p-3 text-sm text-red-100">{error}</p>}

        <Field label={t("auth.email")} htmlFor="login-email">
          <input id="login-email" required type="email" name="email" value={form.email} onChange={change} className={inputClass} />
        </Field>

        <Field label={t("auth.password")} htmlFor="login-password">
          <input id="login-password" required type="password" name="password" value={form.password} onChange={change} className={inputClass} />
        </Field>

        <button disabled={busy} className="w-full rounded-full bg-green-500 px-6 py-4 font-semibold transition hover:bg-green-400 disabled:opacity-50">
          {busy ? t("auth.signingIn") : t("auth.login")}
        </button>

        <p className="text-center text-sm text-white/70">
          {t("auth.noAccount")}{" "}
          <Link to="/register" className="font-semibold text-green-300 hover:underline">
            {t("auth.register")}
          </Link>
        </p>
      </form>
    </AuthShell>
  );
}
