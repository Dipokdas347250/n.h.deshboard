import React, { useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router";
import { AuthShell } from "./Register";

export default function GlassLogin() {
  const navegate = useNavigate();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

 
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.email || !formData.password) {
      setError("All fields are required!");
      return;
    }
    if (!formData.email.includes("@")) {
      setError("Enter a valid email!");
      return;
    }


    setError("");
    setSubmitting(true);
    
    
      axios.post(`${import.meta.env.VITE_API_URL}/auth/login`, formData, { withCredentials: true })
        .then(() => {
          navegate("/")
        })
        .catch((error) => {
          setError(error.response?.data?.message || "Unable to sign in.");
        })
        .finally(() => setSubmitting(false));
    

  };

  return <AuthShell title="Dashboard sign in" subtitle="Use your registered account to continue.">
      <form onSubmit={handleSubmit} className="space-y-3">
        {error && (
          <p className="text-red-500 text-xl mb-4">{error}</p>
        )}
        <input required
          type="email"
          name="email"
          placeholder="Email"
          value={formData.email}
          onChange={handleChange}
          className="w-full rounded-lg bg-white/20 p-4 outline-none"
        />
        <input required
          type="password"
          name="password"
          placeholder="Password"
          value={formData.password}
          onChange={handleChange}
          className="w-full rounded-lg bg-white/20 p-4 outline-none"
        />

        <button
          type="submit"
          className="w-full rounded-full bg-green-500 px-6 py-4 transition hover:bg-green-400 disabled:opacity-50"
          disabled={submitting}
        >
          {submitting ? "Signing in..." : "Sign In"}
        </button>
        <p className="text-center text-sm text-white/70">Need an account? <Link to="/register" className="font-semibold text-green-300 hover:underline">Register</Link></p>
      </form>
    </AuthShell>;
}