import { useEffect, useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router";

const initialForm = { fullname: "", email: "", password: "", confirmPassword: "", phone: "", address: "" };

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState("register");
  const [resendIn, setResendIn] = useState(0);
  const [status, setStatus] = useState({ type: "", message: "" });
  const [submitting, setSubmitting] = useState(false);

  const change = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.value }));

  const submit = async (event) => {
    event.preventDefault();
    if (form.password.length < 8) return setStatus({ type: "error", message: "Password must be at least 8 characters." });
    if (form.password !== form.confirmPassword) return setStatus({ type: "error", message: "Passwords do not match." });

    setSubmitting(true);
    setStatus({ type: "", message: "" });
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/auth/dashboard-signup`, {
        fullname: form.fullname,
        email: form.email,
        password: form.password,
        phone: form.phone,
        address: form.address,
      }, { withCredentials: true });
      setStep("verify");
      setResendIn(60);
      setStatus({ type: "success", message: "A verification code was sent to your email." });
    } catch (error) {
      setStatus({ type: "error", message: error.response?.data?.message || "Unable to register." });
    } finally {
      setSubmitting(false);
    }
  };

  const verify = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setStatus({ type: "", message: "" });
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/auth/verifyotp`, { email: form.email, otp }, { withCredentials: true });
      setStatus({ type: "success", message: "Email verified. Redirecting to login..." });
      setTimeout(() => navigate("/login"), 900);
    } catch (error) {
      setStatus({ type: "error", message: error.response?.data?.message || "Invalid verification code." });
    } finally {
      setSubmitting(false);
    }
  };

  const resend = async () => {
    if (resendIn) return;
    setSubmitting(true);
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/auth/resendotp`, { email: form.email }, { withCredentials: true });
      setResendIn(60);
      setStatus({ type: "success", message: "A new verification code was sent." });
    } catch (error) {
      setStatus({ type: "error", message: error.response?.data?.message || "Unable to resend code." });
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    if (!resendIn) return undefined;
    const timer = setInterval(() => setResendIn((current) => Math.max(current - 1, 0)), 1000);
    return () => clearInterval(timer);
  }, [resendIn]);

  if (step === "verify") return <AuthShell title="Verify your email" subtitle={`Enter the code sent to ${form.email}.`}>
    <form onSubmit={verify} className="space-y-4">
      <input required inputMode="text" autoCapitalize="characters" pattern="[A-Za-z0-9]{4,8}" value={otp} onChange={(event) => setOtp(event.target.value.replace(/[^A-Za-z0-9]/g, "").slice(0, 8).toUpperCase())} placeholder="Verification code" className="w-full rounded-lg bg-white/20 p-4 text-center text-2xl tracking-[0.4em] outline-none" />
      {status.message && <p className={status.type === "error" ? "text-red-300" : "text-green-300"}>{status.message}</p>}
      <button disabled={submitting} className="w-full rounded-full bg-green-500 px-6 py-4 font-semibold hover:bg-green-400 disabled:opacity-50">{submitting ? "Verifying..." : "Verify email"}</button>
      <button type="button" disabled={submitting || resendIn > 0} onClick={resend} className="w-full rounded-full border border-white/30 px-6 py-3 disabled:opacity-50">{resendIn ? `Resend code in ${resendIn}s` : "Resend code"}</button>
      <button type="button" onClick={() => setStep("register")} className="w-full text-sm text-white/70 hover:text-white">Back to registration</button>
    </form>
  </AuthShell>;

  return <AuthShell title="Create dashboard account" subtitle="Register and verify your email before signing in.">
    <form onSubmit={submit} className="space-y-3">
      <input required name="fullname" value={form.fullname} onChange={change} placeholder="Full name" className="w-full rounded-lg bg-white/20 p-4 outline-none" />
      <input required type="email" name="email" value={form.email} onChange={change} placeholder="Email" className="w-full rounded-lg bg-white/20 p-4 outline-none" />
      <div className="grid grid-cols-2 gap-3"><input name="phone" value={form.phone} onChange={change} placeholder="Phone" className="w-full rounded-lg bg-white/20 p-4 outline-none" /><input name="address" value={form.address} onChange={change} placeholder="Address" className="w-full rounded-lg bg-white/20 p-4 outline-none" /></div>
      <input required type="password" name="password" value={form.password} onChange={change} placeholder="Password" className="w-full rounded-lg bg-white/20 p-4 outline-none" />
      <input required type="password" name="confirmPassword" value={form.confirmPassword} onChange={change} placeholder="Confirm password" className="w-full rounded-lg bg-white/20 p-4 outline-none" />
      {status.message && <p className={status.type === "error" ? "text-red-300" : "text-green-300"}>{status.message}</p>}
      <button disabled={submitting} className="w-full rounded-full bg-green-500 px-6 py-4 font-semibold transition hover:bg-green-400 disabled:opacity-50">{submitting ? "Creating account..." : "Register"}</button>
      <p className="text-center text-sm text-white/70">Already registered? <Link to="/login" className="font-semibold text-green-300 hover:underline">Sign in</Link></p>
    </form>
  </AuthShell>;
}

export function AuthShell({ title, subtitle, children }) {
  return <div className="flex min-h-screen items-center justify-center bg-linear-to-br from-[#022c22] to-[#064e3b] p-6 text-white"><div className="w-full max-w-xl rounded-3xl border border-white/20 bg-white/10 p-8 shadow-[0_0_60px_rgba(34,197,94,0.3)] backdrop-blur-xl"><h2 className="text-center text-3xl font-bold">{title}</h2><p className="mb-8 mt-2 text-center text-white/70">{subtitle}</p>{children}</div></div>;
}