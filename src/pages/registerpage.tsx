import React, { useRef, useEffect, useState } from "react";
import AuthCard from "../components/AuthCard";
import InputField from "../components/InputField";
import ErrorBanner from "../components/ErrorBanner";
import { registerUser } from "../api/auth";

export default function RegisterPage() {
  const emailRef = useRef<HTMLInputElement>(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

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
      await registerUser({ email: email.trim(), password });
      setSuccess(true);
    } catch (err: unknown) {
      const apiError = err as { code?: number; message?: string };
      setError(apiError.message ?? "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <AuthCard
        title="Check your inbox"
        subtitle={`A 6-digit verification code was sent to ${email}. It expires in 24 hours.`}
      >
        <p style={styles.hint}>
          Head to the <strong>Verify Email</strong> screen to complete registration.
        </p>
        <button
          style={styles.linkBtn}
          onClick={() => {
            window.location.href = `/verify-email?email=${encodeURIComponent(email)}`;
          }}
        >
          Go to Verify Email →
        </button>
      </AuthCard>
    );
  }

  return (
    <AuthCard title="Register Account">
      <form onSubmit={handleSubmit} noValidate>
        <InputField
          ref={emailRef}
          label="HU Student Email"
          type="email"
          placeholder="e.g xy01234@st.habib.edu.pk"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
        />

        <div style={styles.passwordWrapper}>
          <InputField
            label="Password"
            type={showPassword ? "text" : "password"}
            placeholder="Min. 8 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
          />
          <button
            type="button"
            style={styles.eyeBtn}
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOffIcon /> : <EyeIcon />}
          </button>
        </div>

        <ErrorBanner message={error} />

        <button
          type="submit"
          style={{ ...styles.submitBtn, opacity: loading ? 0.7 : 1 }}
          disabled={loading}
        >
          {loading ? "Sending…" : "Send Verification Email"}
        </button>
      </form>

      <p style={styles.footer}>
        Already have an account?{" "}
        <a href="/login">Log In.</a>
      </p>
    </AuthCard>
  );
}

function EyeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}

const styles: Record<string, React.CSSProperties> = {
  passwordWrapper: {
    position: "relative",
  },
  eyeBtn: {
    position: "absolute",
    right: "12px",
    bottom: "26px",
    background: "none",
    border: "none",
    cursor: "pointer",
    color: "#9999aa",
    padding: "0",
    display: "flex",
    alignItems: "center",
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
    transition: "background 0.15s ease, transform 0.1s ease",
    marginBottom: "20px",
  },
  footer: {
    fontSize: "13px",
    color: "#6b6b7b",
    textAlign: "center",
  },
  hint: {
    fontSize: "14px",
    color: "#6b6b7b",
    marginBottom: "20px",
  },
  linkBtn: {
    background: "none",
    border: "none",
    color: "#5D3891",
    fontWeight: 600,
    fontSize: "14px",
    cursor: "pointer",
    fontFamily: "'DM Sans', sans-serif",
    padding: 0,
  },
};