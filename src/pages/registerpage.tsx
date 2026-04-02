import React, { useRef, useEffect, useState } from "react";
import AuthCard from "../components/AuthCard";
import InputField from "../components/InputField";
import ErrorBanner from "../components/ErrorBanner";
import { registerUser } from "../api/auth";

// Dummy hint so testers know what will pass validation
const HINT = "Try: xy12345@st.habib.edu.pk";

export default function RegisterPage() {
  const emailRef = useRef<HTMLInputElement>(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Auto-focus the email field when the page loads
  useEffect(() => {
    emailRef.current?.focus();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    // Client-side: check both fields are filled before even calling the API
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
        <p style={styles.tinyHint}>
          (Dummy verification code: <strong>123456</strong>)
        </p>
        <button
          style={styles.linkBtn}
          onClick={() => {
            // In the real app this would navigate to /verify-email
            window.location.href = "/verify-email";
          }}
        >
          Go to Verify Email →
        </button>
      </AuthCard>
    );
  }

  return (
    <AuthCard title="Register Account">
      <p style={styles.testHint}>{HINT}</p>
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

        <InputField
          label="Password"
          type="password"
          placeholder="Min. 8 characters"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="new-password"
        />

        {/* Error shows only after a failed submit — blank otherwise */}
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
    marginBottom: "8px",
  },
  tinyHint: {
    fontSize: "12px",
    color: "#9999aa",
    marginBottom: "20px",
    fontStyle: "italic",
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
