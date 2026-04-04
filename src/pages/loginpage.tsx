import React, { useRef, useEffect, useState } from "react";
import AuthCard from "../components/AuthCard";
import InputField from "../components/InputField";
import ErrorBanner from "../components/ErrorBanner";
import { loginUser } from "../api/auth";

const HINT = "Try: sn08776@st.habib.edu.pk / password";

export default function LoginPage() {
  const emailRef = useRef<HTMLInputElement>(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    emailRef.current?.focus();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !password.trim()) {
      setError("Please fill in both fields.");
      return;
    }

    setLoading(true);
    try {
      const response = await loginUser({ email: email.trim(), password });

      // Store token for later use when backend integration is ready
      localStorage.setItem("token", response.data.token);

      // Redirect based on whether profile setup is still needed
      if (response.data.nextStep === "complete_profile") {
        window.location.href = "/profile-setup";
      } else {
        window.location.href = "/dashboard";
      }
    } catch (err: unknown) {
      const apiError = err as { code?: number; message?: string };
      setError(apiError.message ?? "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthCard
      title="FYPConnect"
      subtitle="A Web-Based Platform for Final Year Project Team Formation"
    >
      <p style={styles.testHint}>{HINT}</p>

      <form onSubmit={handleSubmit} noValidate>
        <InputField
          ref={emailRef}
          label="HU Student Email"
          type="email"
          placeholder="e.g xy12345@st.habib.edu.pk"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
        />

        <InputField
          label="Password"
          type="password"
          placeholder="Your password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
        />

        <ErrorBanner message={error} />

        <button
          type="submit"
          style={{ ...styles.submitBtn, opacity: loading ? 0.7 : 1 }}
          disabled={loading}
        >
          {loading ? "Logging in…" : "Log In"}
        </button>
      </form>

      <p style={styles.footer}>
        Don't have an account?{" "}
        <a href="/register">Register Now.</a>
      </p>
    </AuthCard>
  );
}

const styles: Record<string, React.CSSProperties> = {
  testHint: {
    fontSize: "12px",
    color: "#9999aa",
    marginBottom: "20px",
    fontStyle: "italic",
  },
  submitBtn: {
    width: "100%",
    padding: "13px",
    background: "#5D3891",
    color: "#ffffff",
    border: "none",
    borderRadius: "8px",
    fontSize: "15px",
    fontWeight: 600,
    fontFamily: "'DM Sans', sans-serif",
    cursor: "pointer",
    transition: "background 0.15s ease",
    marginBottom: "20px",
  },
  footer: {
    fontSize: "13px",
    color: "#6b6b7b",
    textAlign: "center",
  },
};