/** Standard page frame: dark panel, heading, optional subtitle and toolbar. */
export function PageShell({ title, subtitle, actions, children }) {
  return (
    <section className="min-h-screen bg-[#062B63]/95 p-4 text-white sm:p-6">
      <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{title}</h1>
          {subtitle && <p className="mt-1 max-w-2xl text-sm text-white/70">{subtitle}</p>}
        </div>
        {actions}
      </header>
      {children}
    </section>
  );
}

/** Red banner for a failed request. */
export function ErrorNote({ message }) {
  if (!message) return null;
  return <p className="mb-4 rounded-lg bg-red-500/20 p-3 text-sm text-red-100">{message}</p>;
}

/** Green banner confirming something saved. */
export function SuccessNote({ message }) {
  if (!message) return null;
  return <p className="mb-4 rounded-lg bg-green-500/20 p-3 text-sm text-green-100">{message}</p>;
}

/** Placeholder for an empty list. */
export function EmptyNote({ message }) {
  return <p className="rounded-xl bg-white/5 p-10 text-center text-white/60">{message}</p>;
}

/** Labelled form field used across every dashboard form. */
export function Field({ label, hint, children, htmlFor }) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-1.5 block text-sm text-white/80">
        {label}
      </label>
      {children}
      {hint && <p className="mt-1 text-xs text-white/50">{hint}</p>}
    </div>
  );
}

export const inputClass =
  "w-full rounded-lg bg-white/15 p-3 text-white outline-none transition placeholder:text-white/40 focus:bg-white/25";

export const selectClass = `${inputClass} [&>option]:text-gray-900`;
