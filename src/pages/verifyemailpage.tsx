import React, { useRef, useEffect, useState, useCallback } from "react";
import AuthCard from "../components/AuthCard";
import ErrorBanner from "../components/ErrorBanner";
import { verifyEmail, resendVerification } from "../api/auth";

const CODE_LENGTH = 6;
const COUNTDOWN_SECONDS = 90
// const COUNTDOWN_SECONDS = 24 * 60 * 60; // 24 hours — resets on reload (backend will own this later)

// The email is normally passed via navigation state. Using dummy for now.
const DUMMY_EMAIL = "sn08776@st.habib.edu.pk";

export default function VerifyEmailPage() {
  const [digits, setDigits] = useState<string[]>(Array(CODE_LENGTH).fill(""));
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendMessage, setResendMessage] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(COUNTDOWN_SECONDS);
  const [success, setSuccess] = useState(false);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Auto-focus the first digit slot
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  // Countdown timer — resets on page reload as agreed
  useEffect(() => {
    if (timeLeft <= 0) return;
    const timer = setInterval(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  function formatTime(seconds: number) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}h ${m}m until code expires`;
    if (m > 0) return `${m}m ${s}s until code expires`;
    return `${s}s until code expires`;
  }

  // Move focus to the next slot automatically after a digit is entered
  function handleDigitChange(index: number, value: string) {
    // Only accept a single digit
    const digit = value.replace(/\D/g, "").slice(-1);
    const updated = [...digits];
    updated[index] = digit;
    setDigits(updated);

    if (digit && index < CODE_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  }

  // Backspace moves focus back to the previous slot
  function handleKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  }

  // Handle paste — spread pasted digits across all slots
  function handlePaste(e: React.ClipboardEvent<HTMLInputElement>) {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, CODE_LENGTH);
    const updated = Array(CODE_LENGTH).fill("");
    pasted.split("").forEach((char, i) => { updated[i] = char; });
    setDigits(updated);
    // Focus the slot after the last pasted digit
    const nextIndex = Math.min(pasted.length, CODE_LENGTH - 1);
    inputRefs.current[nextIndex]?.focus();
  }

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const code = digits.join("");
    if (code.length < CODE_LENGTH) {
      setError("Please enter all 6 digits.");
      return;
    }

    setLoading(true);
    try {
      await verifyEmail({ email: DUMMY_EMAIL, verificationCode: code });
      setSuccess(true);
    } catch (err: unknown) {
      const apiError = err as { code?: number; message?: string };
      setError(apiError.message ?? "Something went wrong. Please try again.");
      // Clear the slots and re-focus first on a wrong code
      setDigits(Array(CODE_LENGTH).fill(""));
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  }, [digits]);

  async function handleResend() {
    setResendMessage(null);
    setError(null);
    setResendLoading(true);
    try {
      await resendVerification({ email: DUMMY_EMAIL });
      setResendMessage("A new code has been sent.");
      setTimeLeft(COUNTDOWN_SECONDS); // reset the timer
    } catch (err: unknown) {
      const apiError = err as { code?: number; message?: string };
      setError(apiError.message ?? "Could not resend. Try again later.");
    } finally {
      setResendLoading(false);
    }
  }

  if (success) {
    return (
      <AuthCard
        title="Email Verified!"
        subtitle="Your account is now active. You can log in and complete your profile."
      >
        <button
          style={styles.submitBtn}
          onClick={() => { window.location.href = "/login"; }}
        >
          Go to Login →
        </button>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title="Verify Your Email"
      subtitle={`Enter the 6-digit verification code sent to ${DUMMY_EMAIL}`}
    >
      <p style={styles.testHint}>Dummy code: <strong>123456</strong></p>

      <form onSubmit={handleSubmit} noValidate>
        {/* 6 digit slots */}
        <div style={styles.slotsRow}>
          {digits.map((digit, i) => (
            <input
              key={i}
              ref={(el) => { inputRefs.current[i] = el; }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleDigitChange(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              onPaste={handlePaste}
              style={{
                ...styles.digitSlot,
                borderColor: digit ? "#5D3891" : "#E8E2E2",
                color: digit ? "#1a1a2e" : "#D0C8C8",
              }}
              aria-label={`Digit ${i + 1}`}
              placeholder="8" // visual hint that a number goes here
            />
          ))}
        </div>

        {/* Countdown */}
        <p style={styles.countdown}>
          {timeLeft > 0 ? formatTime(timeLeft) : "Code has expired."}
        </p>

        {/* Error shows only after a failed submit */}
        <ErrorBanner message={error} />

        <button
          type="submit"
          style={{ ...styles.submitBtn, opacity: loading ? 0.7 : 1 }}
          disabled={loading}
        >
          {loading ? "Verifying…" : "Complete Registration"}
        </button>
      </form>

      <p style={styles.resendRow}>
        Didn't receive a code?{" "}
        <button
          style={styles.resendBtn}
          onClick={handleResend}
          disabled={resendLoading}
        >
          {resendLoading ? "Sending…" : "Resend Email."}
        </button>
      </p>
      {resendMessage && <p style={styles.resendSuccess}>{resendMessage}</p>}
      <p style={styles.resendNote}>
        <em>You can request up to 3 resend attempts per hour</em>
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
  slotsRow: {
    display: "flex",
    gap: "10px",
    justifyContent: "center",
    marginBottom: "16px",
  },
  digitSlot: {
    width: "52px",
    height: "60px",
    textAlign: "center",
    fontSize: "22px",
    fontWeight: 700,
    fontFamily: "'DM Sans', sans-serif",
    border: "2px solid #E8E2E2",
    borderRadius: "10px",
    background: "#fafafa",
    outline: "none",
    transition: "border-color 0.15s ease, box-shadow 0.15s ease",
    caretColor: "#5D3891",
  },
  countdown: {
    fontSize: "13px",
    color: "#6b6b7b",
    textAlign: "center",
    marginBottom: "18px",
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
  resendRow: {
    fontSize: "13px",
    color: "#6b6b7b",
    textAlign: "center",
    marginBottom: "4px",
  },
  resendBtn: {
    background: "none",
    border: "none",
    color: "#5D3891",
    fontWeight: 600,
    fontSize: "13px",
    cursor: "pointer",
    fontFamily: "'DM Sans', sans-serif",
    padding: 0,
    textDecoration: "underline",
  },
  resendSuccess: {
    fontSize: "12px",
    color: "#5D3891",
    textAlign: "center",
    marginBottom: "4px",
    fontWeight: 600,
  },
  resendNote: {
    fontSize: "11px",
    color: "#9999aa",
    textAlign: "center",
  },
};
