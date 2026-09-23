import { useEffect, useState } from "react";
import { api } from "../../lib/api";
import { useLanguage } from "../../i18n/useLanguage";
import { PageShell, ErrorNote, SuccessNote, Field, inputClass } from "../common/PageShell";

const BLANK_ZONE = { key: "", label: "", labelBn: "", charge: 0, estimatedDays: "2-3", estimatedDaysBn: "২-৩" };

/** Turns "Inside Dhaka" into the stable key "inside_dhaka". */
const toKey = (label) =>
  label.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "") || `zone_${Date.now()}`;

/** Delivery charges and the fake-order detection thresholds. */
export default function Settings() {
  const { t, apiMessage } = useLanguage();
  const [settings, setSettings] = useState(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;

    api.get("/admin/settings")
      .then((response) => {
        if (active) setSettings(response.data.data);
      })
      .catch((caught) => {
        if (active) setError(apiMessage(caught, "settings.loadFailed"));
      });

    return () => {
      active = false;
    };
  }, [apiMessage]);

  const updateZone = (index, patch) =>
    setSettings((current) => ({
      ...current,
      deliveryZones: current.deliveryZones.map((zone, zoneIndex) => (zoneIndex === index ? { ...zone, ...patch } : zone)),
    }));

  const save = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    setNotice("");

    try {
      const response = await api.patch("/admin/settings", {
        // Zones the admin added have no key yet, so derive one from the label.
        deliveryZones: settings.deliveryZones.map((zone) => ({ ...zone, key: zone.key || toKey(zone.label) })),
        freeDeliveryThreshold: settings.freeDeliveryThreshold,
        codMaxAmount: settings.codMaxAmount,
        fraud: settings.fraud,
      });
      setSettings(response.data.data);
      setNotice(t("settings.saved"));
    } catch (caught) {
      setError(apiMessage(caught));
    } finally {
      setBusy(false);
    }
  };

  if (!settings) {
    return (
      <PageShell title={t("settings.title")}>
        <ErrorNote message={error} />
        {!error && <p className="text-white/70">{t("common.loading")}</p>}
      </PageShell>
    );
  }

  const fraudNumberFields = [
    ["blockScore", "settings.blockScore"],
    ["reviewScore", "settings.reviewScore"],
    ["maxOrdersPerPhonePerDay", "settings.maxPhonePerDay"],
    ["maxOrdersPerIpPerDay", "settings.maxIpPerDay"],
    ["maxPendingOrdersPerPhone", "settings.maxPending"],
    ["maxCancelledOrdersPerPhone", "settings.maxCancelled"],
    ["highValueCodAmount", "settings.highValueCod"],
    ["minAddressLength", "settings.minAddress"],
  ];

  return (
    <PageShell title={t("settings.title")}>
      <ErrorNote message={error} />
      <SuccessNote message={notice} />

      <form onSubmit={save} className="space-y-6">
        <section className="rounded-2xl bg-white/10 p-5">
          <h2 className="text-lg font-bold">{t("settings.deliveryTitle")}</h2>
          <p className="mt-1 text-sm text-white/60">{t("settings.deliverySubtitle")}</p>

          <div className="mt-5 space-y-4">
            {settings.deliveryZones.map((zone, index) => (
              <div key={zone.key || index} className="grid gap-3 rounded-xl bg-white/5 p-4 md:grid-cols-5">
                <Field label={t("settings.zoneLabel")} htmlFor={`zone-label-${index}`}>
                  <input
                    id={`zone-label-${index}`}
                    required
                    value={zone.label}
                    onChange={(event) => updateZone(index, { label: event.target.value })}
                    className={inputClass}
                  />
                </Field>
                <Field label={t("settings.zoneLabelBn")} htmlFor={`zone-label-bn-${index}`}>
                  <input
                    id={`zone-label-bn-${index}`}
                    value={zone.labelBn}
                    onChange={(event) => updateZone(index, { labelBn: event.target.value })}
                    className={inputClass}
                  />
                </Field>
                <Field label={t("settings.zoneCharge")} htmlFor={`zone-charge-${index}`}>
                  <input
                    id={`zone-charge-${index}`}
                    type="number"
                    min="0"
                    required
                    value={zone.charge}
                    onChange={(event) => updateZone(index, { charge: Number(event.target.value) })}
                    className={inputClass}
                  />
                </Field>
                <Field label={t("settings.zoneDays")} htmlFor={`zone-days-${index}`}>
                  <input
                    id={`zone-days-${index}`}
                    value={zone.estimatedDays}
                    onChange={(event) => updateZone(index, { estimatedDays: event.target.value })}
                    className={inputClass}
                  />
                </Field>
                <div className="flex items-end gap-2">
                  <Field label={t("settings.zoneDaysBn")} htmlFor={`zone-days-bn-${index}`}>
                    <input
                      id={`zone-days-bn-${index}`}
                      value={zone.estimatedDaysBn}
                      onChange={(event) => updateZone(index, { estimatedDaysBn: event.target.value })}
                      className={inputClass}
                    />
                  </Field>
                  <button
                    type="button"
                    disabled={settings.deliveryZones.length === 1}
                    onClick={() =>
                      setSettings((current) => ({
                        ...current,
                        deliveryZones: current.deliveryZones.filter((_, zoneIndex) => zoneIndex !== index),
                      }))
                    }
                    className="mb-0.5 shrink-0 rounded-lg bg-red-500 px-3 py-3 text-sm text-white disabled:opacity-40"
                  >
                    {t("settings.removeZone")}
                  </button>
                </div>
              </div>
            ))}

            <button
              type="button"
              onClick={() => setSettings((current) => ({ ...current, deliveryZones: [...current.deliveryZones, { ...BLANK_ZONE }] }))}
              className="rounded-lg bg-blue-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-400"
            >
              {t("settings.addZone")}
            </button>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <Field label={t("settings.freeThreshold")} hint={t("settings.freeThresholdHint")} htmlFor="free-threshold">
              <input
                id="free-threshold"
                type="number"
                min="0"
                value={settings.freeDeliveryThreshold}
                onChange={(event) => setSettings({ ...settings, freeDeliveryThreshold: Number(event.target.value) })}
                className={inputClass}
              />
            </Field>
            <Field label={t("settings.codMax")} htmlFor="cod-max">
              <input
                id="cod-max"
                type="number"
                min="0"
                value={settings.codMaxAmount}
                onChange={(event) => setSettings({ ...settings, codMaxAmount: Number(event.target.value) })}
                className={inputClass}
              />
            </Field>
          </div>
        </section>

        <section className="rounded-2xl bg-white/10 p-5">
          <h2 className="text-lg font-bold">{t("settings.fraudTitle")}</h2>
          <p className="mt-1 text-sm text-white/60">{t("settings.fraudSubtitle")}</p>

          <label className="mt-5 flex items-center gap-3">
            <input
              type="checkbox"
              checked={settings.fraud.enabled}
              onChange={(event) => setSettings({ ...settings, fraud: { ...settings.fraud, enabled: event.target.checked } })}
              className="h-5 w-5 accent-green-500"
            />
            <span className="font-medium">{t("settings.fraudEnabled")}</span>
          </label>

          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {fraudNumberFields.map(([key, labelKey]) => (
              <Field key={key} label={t(labelKey)} htmlFor={`fraud-${key}`}>
                <input
                  id={`fraud-${key}`}
                  type="number"
                  min="0"
                  value={settings.fraud[key]}
                  onChange={(event) => setSettings({ ...settings, fraud: { ...settings.fraud, [key]: Number(event.target.value) } })}
                  className={inputClass}
                />
              </Field>
            ))}
          </div>
        </section>

        <button
          disabled={busy}
          className="w-full rounded-xl bg-green-500 px-6 py-3.5 font-semibold text-white transition hover:bg-green-400 disabled:opacity-50 md:w-auto md:px-10"
        >
          {busy ? t("common.saving") : t("common.save")}
        </button>
      </form>
    </PageShell>
  );
}
