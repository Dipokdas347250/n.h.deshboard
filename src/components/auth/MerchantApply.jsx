import { useState } from "react";
import { Link } from "react-router";
import { api } from "../../lib/api";
import { useLanguage } from "../../i18n/useLanguage";
import AuthShell from "./AuthShell";
import { ErrorNote, Field, inputClass } from "../common/PageShell";

const TRIAL_DAYS = 7;
const BLANK = { fullname: "", phone: "", email: "", businessName: "", address: "", facebookPage: "", productType: "", nidNumber: "", password: "" };

const fileClass =
  "w-full cursor-pointer rounded-lg bg-white/15 p-2 text-white file:mr-3 file:rounded-md file:border-none file:bg-green-500 file:px-4 file:py-2 file:text-white";

/**
 * Public "Apply for a merchant account" form. Submitting creates nothing but
 * an application; the account only exists once an administrator approves it.
 */
export default function MerchantApply() {
  const { t, apiMessage, formatNumber } = useLanguage();
  const [form, setForm] = useState(BLANK);
  const [nidFront, setNidFront] = useState(null);
  const [nidBack, setNidBack] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  const change = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.value }));

  const submit = async (event) => {
    event.preventDefault();
    if (form.password.length < 8) {
      setError(t("auth.passwordLength"));
      return;
    }

    const data = new FormData();
    Object.entries(form).forEach(([key, value]) => data.append(key, value));
    data.append("nidFront", nidFront);
    data.append("nidBack", nidBack);

    setError("");
    setBusy(true);
    try {
      await api.post("/merchant/apply", data);
      setDone(true);
    } catch (caught) {
      setError(apiMessage(caught));
    } finally {
      setBusy(false);
    }
  };

  if (done) {
    return (
      <AuthShell title={t("apply.doneTitle")} subtitle={t("apply.doneBody")}>
        <Link to="/login" className="block w-full rounded-full bg-green-500 px-6 py-4 text-center font-semibold transition hover:bg-green-400">
          {t("apply.backToLogin")}
        </Link>
      </AuthShell>
    );
  }

  return (
    <AuthShell title={t("apply.title")} subtitle={t("apply.subtitle")}>
      <form onSubmit={submit} className="space-y-4">
        <ErrorNote message={error} />

        <Field label={t("apply.fullname")} htmlFor="apply-name">
          <input id="apply-name" required name="fullname" value={form.fullname} onChange={change} autoComplete="name" className={inputClass} />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t("apply.phone")} htmlFor="apply-phone">
            <input id="apply-phone" required type="tel" name="phone" value={form.phone} onChange={change} placeholder="01XXXXXXXXX" autoComplete="tel" className={inputClass} />
          </Field>
          <Field label={`${t("apply.email")} (${t("common.optional")})`} hint={t("apply.emailOptionalHint")} htmlFor="apply-email">
            <input id="apply-email" type="email" name="email" value={form.email} onChange={change} autoComplete="email" className={inputClass} />
          </Field>
        </div>

        <Field label={t("apply.businessName")} htmlFor="apply-business">
          <input id="apply-business" required maxLength={150} name="businessName" value={form.businessName} onChange={change} autoComplete="organization" className={inputClass} />
        </Field>

        <Field label={t("apply.address")} htmlFor="apply-address">
          <textarea id="apply-address" required rows={2} maxLength={500} name="address" value={form.address} onChange={change} autoComplete="street-address" className={inputClass} />
        </Field>

        <Field label={`${t("apply.facebookPage")} (${t("common.optional")})`} htmlFor="apply-facebook">
          <input
            id="apply-facebook"
            name="facebookPage"
            value={form.facebookPage}
            onChange={change}
            placeholder="https://facebook.com/yourpage"
            className={inputClass}
          />
        </Field>

        <Field label={t("apply.productType")} htmlFor="apply-products">
          <textarea
            id="apply-products"
            required
            rows={2}
            name="productType"
            value={form.productType}
            onChange={change}
            placeholder={t("apply.productTypePlaceholder")}
            className={inputClass}
          />
        </Field>

        <Field label={t("apply.nidNumber")} hint={t("apply.nidHint")} htmlFor="apply-nid">
          <input id="apply-nid" required inputMode="numeric" name="nidNumber" value={form.nidNumber} onChange={change} className={inputClass} />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t("apply.nidFront")} htmlFor="apply-nid-front">
            <input
              id="apply-nid-front"
              required
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={(event) => setNidFront(event.target.files?.[0] || null)}
              className={fileClass}
            />
          </Field>
          <Field label={t("apply.nidBack")} htmlFor="apply-nid-back">
            <input
              id="apply-nid-back"
              required
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={(event) => setNidBack(event.target.files?.[0] || null)}
              className={fileClass}
            />
          </Field>
        </div>
        <p className="text-xs text-white/60">{t("apply.nidPrivacy")}</p>

        <Field label={t("apply.password")} hint={t("apply.passwordHint")} htmlFor="apply-password">
          <input
            id="apply-password"
            required
            minLength={8}
            type="password"
            name="password"
            value={form.password}
            onChange={change}
            autoComplete="new-password"
            className={inputClass}
          />
        </Field>

        <p className="rounded-lg bg-white/10 p-3 text-sm text-white/80">{t("apply.trialNote", { days: formatNumber(TRIAL_DAYS) })}</p>

        <button disabled={busy} className="w-full rounded-full bg-green-500 px-6 py-4 font-semibold transition hover:bg-green-400 disabled:opacity-50">
          {busy ? t("apply.submitting") : t("apply.submit")}
        </button>

        <p className="text-center text-sm text-white/70">
          <Link to="/login" className="font-semibold text-green-300 hover:underline">
            {t("apply.backToLogin")}
          </Link>
        </p>
      </form>
    </AuthShell>
  );
}
