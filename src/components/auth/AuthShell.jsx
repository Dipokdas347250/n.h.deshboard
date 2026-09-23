import LanguageSwitcher from "../common/LanguageSwitcher";

/** Frame shared by the sign-in, registration and verification screens. */
export default function AuthShell({ title, subtitle, children }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-linear-to-br from-[#062B63] to-[#1255A4] p-6 text-white">
      <div className="w-full max-w-xl rounded-3xl border border-white/20 bg-white/10 p-8 shadow-[0_0_60px_rgba(22,134,61,0.3)] backdrop-blur-xl">
        <div className="mb-6 flex justify-center">
          <LanguageSwitcher />
        </div>
        <h1 className="text-center text-3xl font-bold">{title}</h1>
        <p className="mb-8 mt-2 text-center text-white/70">{subtitle}</p>
        {children}
      </div>
    </div>
  );
}
