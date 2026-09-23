import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import { api } from "../../lib/api";
import { useLanguage } from "../../i18n/useLanguage";
import AuthShell from "./AuthShell";
import { Field, inputClass } from "../common/PageShell";

const EMPTY = { fullname: "", email: "", phone: "", address: "", password: "", confirmPassword: "" };

/**
 * Creates the first dashboard administrator and walks them through email
 * verification. The API refuses a second administrator, so after the first
 * account exists further staff are added by an administrator instead.
 */
export default function Register() {
  const navigate = useNavigate();
  const { t, apiMessage } = useLanguage();
  const [step, setStep] = useState("register");
  const [form, setForm] = useState(EMPTY);
  const [otp, setOtp] = useState("");
  const [status, setStatus] = useState(null);
  const [busy, setBusy] = useState(false);
  const [resendIn, setResendIn] = useState(0);

  useEffect(() => {
    if (!resendIn) return undefined;
    const timer = setInterval(() => setResendIn((value) => Math.max(value - 1, 0)), 1000);
    return () => clearInterval(timer);
  }, [resendIn]);

  const change = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.value }));

  const submit = async (event) => {
    event.preventDefault();
    if (form.password.length < 8) {
      setStatus({ type: "error", message: t("auth.passwordLength") });
      return;
    }
    if (form.password !== form.confirmPassword) {
      setStatus({ type: "error", message: t("auth.passwordsDoNotMatch") });
      return;
    }

    setBusy(true);
    setStatus(null);
    try {
      await api.post("/auth/dashboard-signup", {
        fullname: form.fullname,
        email: form.email,
        phone: form.phone,
        address: form.address,
        password: form.password,
      });
      setStep("verify");
      setResendIn(60);
      setStatus({ type: "success", message: t("auth.registered") });
    } catch (caught) {
      setStatus({ type: "error", message: apiMessage(caught) });
    } finally {
      setBusy(false);
    }
  };

  const verify = async (event) => {
    event.preventDefault();
    setBusy(true);
    setStatus(null);
    try {
      await api.post("/auth/verifyotp", { email: form.email, otp });
      setStatus({ type: "success", message: t("auth.verified") });
      setTimeout(() => navigate("/login"), 900);
    } catch (caught) {
      setStatus({ type: "error", message: apiMessage(caught) });
    } finally {
      setBusy(false);
    }
  };

  const resend = async () => {
    if (resendIn) return;
    setBusy(true);
    try {
      await api.post("/auth/resendotp", { email: form.email });
      setResendIn(60);
      setStatus({ type: "success", message: t("auth.codeSent") });
    } catch (caught) {
      setStatus({ type: "error", message: apiMessage(caught) });
    } finally {
      setBusy(false);
    }
  };

  const note = status && (
    <p className={`rounded-lg p-3 text-sm ${status.type === "error" ? "bg-red-500/20 text-red-100" : "bg-green-500/20 text-green-100"}`}>
      {status.message}
    </p>
  );

  if (step === "verify") {
    return (
      <AuthShell title={t("auth.verifyTitle")} subtitle={t("auth.verifySubtitle", { email: form.email })}>
        <form onSubmit={verify} className="space-y-4">
          <input
            required
            value={otp}
            onChange={(event) => setOtp(event.target.value.replace(/[^A-Za-z0-9]/g, "").slice(0, 8).toUpperCase())}
            placeholder={t("auth.code")}
            aria-label={t("auth.code")}
            className={`${inputClass} text-center text-2xl tracking-[0.4em]`}
          />
          {note}
          <button disabled={busy} className="w-full rounded-full bg-green-500 px-6 py-4 font-semibold hover:bg-green-400 disabled:opacity-50">
            {busy ? t("auth.verifying") : t("auth.verify")}
          </button>
          <button type="button" disabled={busy || resendIn > 0} onClick={resend} className="w-full rounded-full border border-white/30 px-6 py-3 disabled:opacity-50">
            {resendIn ? t("auth.resendIn", { seconds: resendIn }) : t("auth.resend")}
          </button>
          <button type="button" onClick={() => setStep("register")} className="w-full text-sm text-white/70 hover:text-white">
            {t("auth.backToRegister")}
          </button>
        </form>
      </AuthShell>
    );
  }

  return (
    <AuthShell title={t("auth.registerTitle")} subtitle={t("auth.registerSubtitle")}>
      <form onSubmit={submit} className="space-y-3">
        <Field label={t("auth.fullname")} htmlFor="register-name">
          <input id="register-name" required name="fullname" value={form.fullname} onChange={change} className={inputClass} />
        </Field>
        <Field label={t("auth.email")} htmlFor="register-email">
          <input id="register-email" required type="email" name="email" value={form.email} onChange={change} className={inputClass} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label={t("auth.phone")} htmlFor="register-phone">
            <input id="register-phone" name="phone" value={form.phone} onChange={change} className={inputClass} />
          </Field>
          <Field label={t("auth.address")} htmlFor="register-address">
            <input id="register-address" name="address" value={form.address} onChange={change} className={inputClass} />
          </Field>
        </div>
        <Field label={t("auth.password")} htmlFor="register-password">
          <input id="register-password" required type="password" minLength={8} name="password" value={form.password} onChange={change} className={inputClass} />
        </Field>
        <Field label={t("auth.confirmPassword")} htmlFor="register-confirm">
          <input id="register-confirm" required type="password" minLength={8} name="confirmPassword" value={form.confirmPassword} onChange={change} className={inputClass} />
        </Field>
        {note}
        <button disabled={busy} className="w-full rounded-full bg-green-500 px-6 py-4 font-semibold transition hover:bg-green-400 disabled:opacity-50">
          {busy ? t("auth.creating") : t("auth.register")}
        </button>
        <p className="text-center text-sm text-white/70">
          {t("auth.haveAccount")}{" "}
          <Link to="/login" className="font-semibold text-green-300 hover:underline">
            {t("auth.login")}
          </Link>
        </p>
      </form>
    </AuthShell>
  );
}
