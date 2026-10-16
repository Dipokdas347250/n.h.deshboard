import { useEffect } from "react";
import { IoClose } from "react-icons/io5";
import { useLanguage } from "../../i18n/useLanguage";

/** Dialog over the page, closed by the X, the backdrop or Escape. */
export default function Modal({ title, onClose, children, wide = false }) {
  const { t } = useLanguage();

  useEffect(() => {
    const onKey = (event) => event.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center overflow-y-auto bg-black/60 p-4 sm:p-8" onMouseDown={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onMouseDown={(event) => event.stopPropagation()}
        className={`w-full ${wide ? "max-w-4xl" : "max-w-xl"} rounded-2xl bg-[#0a3576] p-5 text-white shadow-2xl sm:p-6`}
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <h2 className="text-xl font-bold">{title}</h2>
          <button type="button" onClick={onClose} aria-label={t("common.close")} className="rounded-full p-1 hover:bg-white/10">
            <IoClose size={22} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
